// ============================================================
// SERVIDOR PHOTOSHOP — Windows
// Roda no PC Windows e controla o Photoshop via ExtendScript
// Porta: 4000
// ============================================================

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const https   = require('https');
const http    = require('http');
const { exec } = require('child_process');
const os      = require('os');

const app  = express();
app.use(express.json({ limit: '10mb' }));

// ── CONFIG — ajuste se necessário ──────────────────────────
const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN || 'tilika-secret-2025';

const CONFIG = {
  PSD_PATH:    'C:\\Users\\' + os.userInfo().username + '\\Documents\\lilika\\Arte_Feed.psd',
  OUTPUT_DIR:  'C:\\tilika-ps-server\\output',
  TEMP_DIR:    'C:\\tilika-ps-server\\temp',
  PS_SCRIPT:   'C:\\tilika-ps-server\\temp\\script.jsx',
  VBS_SCRIPT:  'C:\\tilika-ps-server\\temp\\run.vbs',
};

// Criar pastas necessárias
[CONFIG.OUTPUT_DIR, CONFIG.TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true, psd: fs.existsSync(CONFIG.PSD_PATH) });
});

// ── LISTAR CAMADAS DO PSD (diagnóstico) ────────────────────
app.get('/layers', async (req, res) => {
  const jsxPath = CONFIG.PS_SCRIPT.replace('.jsx', '_layers.jsx');
  const outPath = CONFIG.TEMP_DIR + '\\layers.json';

  const jsx = `
#target photoshop
app.displayDialogs = DialogModes.NO;

var result = [];

function collectLayers(container, prefix) {
  try {
    var allLayers = container.layers;
    for (var i = 0; i < allLayers.length; i++) {
      var l = allLayers[i];
      var info = {
        name: l.name,
        kind: l.kind ? l.kind.toString() : 'group',
        path: prefix + l.name
      };
      result.push(info);
      try { if (l.layers && l.layers.length > 0) collectLayers(l, prefix + l.name + '/'); } catch(e) {}
    }
  } catch(e) {}
}

var psdFile = new File("${CONFIG.PSD_PATH.replace(/\\/g, '/')}");
var doc = app.open(psdFile);
collectLayers(doc, '');
doc.close(SaveOptions.DONOTSAVECHANGES);

var outFile = new File("${outPath.replace(/\\/g, '/')}");
outFile.open("w");
outFile.write(JSON.stringify(result));
outFile.close();
`;

  fs.writeFileSync(jsxPath, jsx, 'utf8');
  const vbs = buildVBS(jsxPath);
  const vbsPath = CONFIG.VBS_SCRIPT.replace('.vbs', '_layers.vbs');
  fs.writeFileSync(vbsPath, vbs, 'utf8');

  try {
    await runScript(`cscript //NoLogo "${vbsPath}"`);
    const layers = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    res.json({ layers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LER DEBUG DE CAMADAS ───────────────────────────────────
app.get('/layerdebug', (req, res) => {
  const f = CONFIG.TEMP_DIR + '\\layers_debug.txt';
  if (fs.existsSync(f)) {
    res.send(fs.readFileSync(f, 'utf8'));
  } else {
    res.send('Arquivo nao encontrado — rode um render primeiro');
  }
});

// ── LER LOG DE ERRO DO PHOTOSHOP ───────────────────────────
app.get('/errorlog', (req, res) => {
  const f = CONFIG.TEMP_DIR + '\\error.log';
  if (fs.existsSync(f)) {
    res.send(fs.readFileSync(f, 'utf8'));
  } else {
    res.send('Sem erros registrados');
  }
});

// ── MIDDLEWARE DE AUTENTICACAO ──────────────────────────────
function requireToken(req, res, next) {
  const token = req.headers['x-deploy-token'] || req.query.token;
  if (token !== DEPLOY_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  next();
}

// ── AUTO DEPLOY: git pull + reinicia o processo ────────────
app.post('/deploy', requireToken, (req, res) => {
  console.log('[Deploy] Recebido pedido de deploy do Mac...');
  res.json({ ok: true, msg: 'Pulling e reiniciando...' });

  // Dar tempo pro response chegar antes de reiniciar
  setTimeout(() => {
    exec('git -C C:\\tilika-ps-server pull', (err, stdout, stderr) => {
      console.log('[Deploy] git pull:', stdout || stderr);
      // Spawn processo filho independente e sai — o SO reinicia o servidor
      const { spawn } = require('child_process');
      const child = spawn('node', ['server.js'], {
        cwd: 'C:\\tilika-ps-server',
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      setTimeout(() => process.exit(0), 500);
    });
  }, 500);
});

// ── EXEC: rodar qualquer comando no Windows ─────────────────
app.post('/exec', requireToken, (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).json({ error: 'cmd obrigatório' });
  console.log('[Exec]', cmd);
  exec(cmd, { timeout: 30000, shell: 'powershell.exe' }, (err, stdout, stderr) => {
    res.json({ stdout: stdout || '', stderr: stderr || '', code: err?.code || 0 });
  });
});

// ── RENDER ─────────────────────────────────────────────────
app.post('/render', async (req, res) => {
  const { titulo, gancho, cta, pilar, photoUrl } = req.body;

  console.log('[PS Server] Render request:', titulo?.slice(0, 40));

  try {
    // 1. Baixar foto do Pexels pra arquivo temp
    const photoPath = path.join(CONFIG.TEMP_DIR, `photo_${Date.now()}.jpg`);
    await downloadFile(photoUrl, photoPath);
    console.log('[PS Server] Foto baixada:', photoPath);

    // 2. Caminho do PNG de saída
    const outputPath = path.join(CONFIG.OUTPUT_DIR, `art_${Date.now()}.png`);

    // 3. Gerar script ExtendScript
    const jsx = buildJSX({ titulo, gancho, cta, photoPath, outputPath });
    fs.writeFileSync(CONFIG.PS_SCRIPT, jsx, 'utf8');
    console.log('[PS Server] Script JSX gerado');

    // 4. Executar via VBScript (controla PS pelo COM do Windows)
    const vbs = buildVBS(CONFIG.PS_SCRIPT);
    fs.writeFileSync(CONFIG.VBS_SCRIPT, vbs, 'utf8');

    await runScript(`cscript //NoLogo "${CONFIG.VBS_SCRIPT}"`);
    console.log('[PS Server] Photoshop executou o script');

    // 5. Ler PNG exportado e retornar em base64
    if (!fs.existsSync(outputPath)) {
      // Ler log de erro do PS se existir
      const errLog = CONFIG.TEMP_DIR + '\\error.log';
      let psError = '';
      if (fs.existsSync(errLog)) {
        psError = fs.readFileSync(errLog, 'utf8');
        fs.unlinkSync(errLog);
      }
      throw new Error('Photoshop não gerou o arquivo. ' + (psError || 'Verifique o log do PS.'));
    }

    const jpgBuffer = fs.readFileSync(outputPath);
    const jpgBase64 = jpgBuffer.toString('base64');

    // Limpar arquivos temp
    try { fs.unlinkSync(photoPath); } catch(e) {}
    try { fs.unlinkSync(outputPath); } catch(e) {}

    console.log('[PS Server] Arte enviada ao Mac — OK');
    res.json({ success: true, jpgBase64, width: 1080, height: 1350 });

  } catch (err) {
    console.error('[PS Server] ERRO:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GERAR EXTENDSCRIPT JSX ──────────────────────────────────
function buildJSX({ titulo, gancho, cta, photoPath, outputPath }) {
  const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

  const psdPath   = CONFIG.PSD_PATH.replace(/\\/g, '/');
  const photoFwd  = photoPath.replace(/\\/g, '/');
  // Saída como PNG
  const outputPng = outputPath.replace(/\\/g, '/').replace(/\.jpg$/i, '.png');

  return `
#target photoshop
app.displayDialogs = DialogModes.NO;

// Limpar log anterior
try { var _cl = new File("C:/tilika-ps-server/temp/error.log"); _cl.open("w"); _cl.close(); } catch(e) {}

try {

  // ── 1. Abrir PSD ───────────────────────────────────────
  var doc = app.open(new File("${psdPath}"));
  app.activeDocument = doc;

  // ── 2. Logar nomes das camadas pra debug ──────────────
  var layerNames = [];
  try {
    for (var li = 0; li < doc.layers.length; li++) {
      layerNames.push(doc.layers[li].name);
      try {
        if (doc.layers[li].layers) {
          for (var lj = 0; lj < doc.layers[li].layers.length; lj++) {
            layerNames.push("  " + doc.layers[li].layers[lj].name);
          }
        }
      } catch(e) {}
    }
  } catch(e) {}
  var dbgFile = new File("C:/tilika-ps-server/temp/layers_debug.txt");
  dbgFile.open("w");
  dbgFile.write(layerNames.join("\\n"));
  dbgFile.close();

  // ── 3. Ocultar camada-final para revelar camadas editaveis ──
  var camadaFinal = findLayer(doc, "camada-final");
  if (camadaFinal) {
    camadaFinal.visible = false;
    appendLog("camada-final ocultada");
  } else {
    appendLog("camada-final NAO encontrada");
  }

  // ── 4. Editar textos ───────────────────────────────────
  editTextLayer(doc, "titulo", "${esc(titulo)}");
  editTextLayer(doc, "gancho", "${esc(gancho)}");
  editTextLayer(doc, "cta",    "${esc(cta)}");
  app.refresh(); // forcar re-render das camadas de texto

  // ── 5. Substituir foto ────────────────────────────────
  replaceFoto(doc, "${photoFwd}");
  app.refresh(); // forcar re-render da foto

  // ── 6. Exportar PNG com camadas editadas (camada-final oculta) ──
  var outFile    = new File("${outputPng}");
  var pngOptions = new PNGSaveOptions();
  pngOptions.compression = 3;
  pngOptions.interlaced  = false;
  doc.saveAs(outFile, pngOptions, true, Extension.LOWERCASE);
  appendLog("PNG exportado: ${outputPng}");

  // ── 10. Fechar sem salvar ─────────────────────────────
  doc.close(SaveOptions.DONOTSAVECHANGES);

} catch (e) {
  var logFile = new File("C:/tilika-ps-server/temp/error.log");
  logFile.open("a");
  logFile.write("ERRO GLOBAL: " + e.message + "\\nLine: " + e.line);
  logFile.close();
}

// ── Helpers ────────────────────────────────────────────────

function appendLog(msg) {
  try {
    var logF = new File("C:/tilika-ps-server/temp/error.log");
    logF.open("a");
    logF.write(msg + "\\n");
    logF.close();
  } catch(e) {}
}

function editTextLayer(doc, name, content) {
  if (!content) return;
  try {
    var layer = findLayer(doc, name);
    if (layer) {
      try {
        app.activeDocument = doc;
        doc.activeLayer = layer;
        layer.textItem.contents = content;

        // Auto-shrink: se texto de paragrafo transbordar, reduz fonte ate caber
        if (layer.textItem.kind === TextType.PARAGRAPHTEXT) {
          var minSize = 8;
          var originalSize = layer.textItem.size;
          var currentSize = originalSize;
          while (currentSize > minSize) {
            try {
              // Verificar overflow usando o bounding box vs bounds reais
              var tBounds = layer.bounds;
              var tBox    = layer.textItem.boundingBox;
              // Se altura do texto ultrapassar a caixa, reduz
              if ((tBounds[3].value - tBounds[1].value) > (tBox[3].value - tBox[1].value) + 2) {
                currentSize -= 1;
                layer.textItem.size = new UnitValue(currentSize, "pt");
              } else {
                break;
              }
            } catch(se) { break; }
          }
          if (currentSize !== originalSize) {
            appendLog("Auto-shrink '" + name + "': " + originalSize + "pt -> " + currentSize + "pt");
          }
        }

        appendLog("OK: '" + name + "' atualizado para: " + content.substring(0, 30));
      } catch(e) {
        appendLog("ERRO em '" + name + "': " + e.message + " | kind=" + layer.kind + " | número=" + e.number);
      }
    } else {
      appendLog("NAO ENCONTRADA: '" + name + "'");
    }
  } catch(e) {
    appendLog("EXCECAO em editTextLayer('" + name + "'): " + e.message);
  }
}

function replaceFoto(doc, photoPath) {
  try {
    var layer = findLayer(doc, "foto");
    if (!layer) return;
    doc.activeLayer = layer;
    // Substituir conteudo do smart object
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(photoPath));
    executeAction(stringIDToTypeID("placedLayerReplaceContents"), desc, DialogModes.NO);
  } catch(e) {
    try {
      var photoFile = new File(photoPath);
      doc.place(photoFile);
    } catch(e2) {}
  }
}

function findLayer(container, name) {
  try {
    var all = container.layers;
    for (var i = 0; i < all.length; i++) {
      if (all[i].name === name) return all[i];
      try {
        if (all[i].layers && all[i].layers.length > 0) {
          var found = findLayer(all[i], name);
          if (found) return found;
        }
      } catch(e) {}
    }
  } catch(e) {}
  return null;
}
`;
}

// ── GERAR VBSCRIPT pra rodar o JSX no Photoshop via COM ────
function buildVBS(jsxPath) {
  const fwdPath = jsxPath.replace(/\\/g, '\\\\');
  return `
On Error Resume Next

Dim psApp
Set psApp = CreateObject("Photoshop.Application")

If Err.Number <> 0 Then
  WScript.Echo "ERRO: Photoshop nao encontrado - " & Err.Description
  WScript.Quit 1
End If

' Suprimir TODOS os dialogos antes de qualquer operacao (3 = DialogModes.NO)
psApp.DisplayDialogs = 3
psApp.Visible = True

Dim jsxFile
jsxFile = "${fwdPath}"

psApp.DoJavaScriptFile jsxFile

WScript.Echo "OK"
Set psApp = Nothing
`;
}

// ── UTILITÁRIOS ─────────────────────────────────────────────

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Redirect
        file.close();
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function runScript(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (stdout) console.log('[VBS]', stdout.trim());
      if (err && !stdout?.includes('OK')) {
        return reject(new Error(stderr || err.message));
      }
      resolve(stdout);
    });
  });
}

// ── TUNNEL CLOUDFLARED (acesso externo) ─────────────────────
let tunnelUrl = null;
let tunnelProcess = null;

app.post('/start-tunnel', (req, res) => {
  if (tunnelUrl) return res.json({ ok: true, url: tunnelUrl, msg: 'Tunnel ja ativo' });

  const logPath = path.join(__dirname, 'tunnel.log');
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);

  tunnelProcess = exec(`cloudflared tunnel --url http://localhost:4000 --logfile "${logPath}"`);
  tunnelProcess.on('exit', () => { tunnelUrl = null; tunnelProcess = null; });

  // Aguarda URL aparecer no log
  let attempts = 0;
  const check = setInterval(() => {
    attempts++;
    if (fs.existsSync(logPath)) {
      const log = fs.readFileSync(logPath, 'utf8');
      const match = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        tunnelUrl = match[0];
        clearInterval(check);
        console.log('[TUNNEL] URL publica:', tunnelUrl);
        return res.json({ ok: true, url: tunnelUrl });
      }
    }
    if (attempts > 20) { clearInterval(check); res.status(500).json({ error: 'Timeout aguardando URL do tunnel' }); }
  }, 1500);
});

app.get('/tunnel-url', (req, res) => {
  res.json({ ok: !!tunnelUrl, url: tunnelUrl });
});

app.post('/stop-tunnel', (req, res) => {
  if (tunnelProcess) { tunnelProcess.kill(); tunnelUrl = null; }
  res.json({ ok: true, msg: 'Tunnel encerrado' });
});

// ── SERVIR ARQUIVOS MAC (privado entre vocês) ──────────────
app.use('/mac-files', express.static(path.join(__dirname, 'mac-files')));

app.get('/mac-files-list', (req, res) => {
  const macFilesDir = path.join(__dirname, 'mac-files');
  const files = fs.readdirSync(macFilesDir);
  const fileList = files.map(file => ({
    name: file,
    url: `http://192.168.48.133:4000/mac-files/${file}`,
    size: fs.statSync(path.join(macFilesDir, file)).size
  }));
  res.json({ files: fileList, total: files.length });
});

// ── SISTEMA DE MENSAGENS CLAUDE CODE Mac ↔ Windows ─────────
const messages = {
  toMac: [],      // Windows → Mac
  toWindows: []   // Mac → Windows
};

// Windows envia pro Mac
app.post('/send-to-mac', (req, res) => {
  const { message, from } = req.body;
  if (!message) return res.status(400).json({ error: 'message obrigatorio' });
  const msg = { id: Date.now(), message, from: from || 'Claude Windows', timestamp: new Date().toISOString(), read: false };
  messages.toMac.push(msg);
  console.log(`[->Mac] ${msg.from}: ${message.slice(0, 60)}`);
  res.json({ success: true, messageId: msg.id });
});

// Mac envia pro Windows
app.post('/send-to-windows', (req, res) => {
  const { message, from } = req.body;
  if (!message) return res.status(400).json({ error: 'message obrigatorio' });
  const msg = { id: Date.now(), message, from: from || 'Claude Mac', timestamp: new Date().toISOString(), read: false };
  messages.toWindows.push(msg);
  console.log(`[->Win] ${msg.from}: ${message.slice(0, 60)}`);
  res.json({ success: true, messageId: msg.id });
});

// Mac lê mensagens do Windows
app.get('/messages-mac', (req, res) => {
  res.json({ messages: messages.toMac, total: messages.toMac.length, allMessages: messages.toMac.length });
});

// Windows lê mensagens do Mac
app.get('/messages', (req, res) => {
  res.json({ messages: messages.toWindows, total: messages.toWindows.length, allMessages: messages.toWindows.length });
});

// Marcar como lida
app.post('/mark-read', (req, res) => {
  const { messageId, target } = req.body;
  const msgList = target === 'mac' ? messages.toMac : messages.toWindows;
  const msg = msgList.find(m => m.id === messageId);
  if (msg) { msg.read = true; res.json({ success: true }); }
  else res.status(404).json({ error: 'Mensagem nao encontrada' });
});

// Limpar mensagens lidas
app.post('/clear-messages', (req, res) => {
  const { target } = req.body;
  if (target === 'mac') {
    const before = messages.toMac.length;
    messages.toMac = messages.toMac.filter(m => !m.read);
    res.json({ success: true, removed: before - messages.toMac.length });
  } else {
    const before = messages.toWindows.length;
    messages.toWindows = messages.toWindows.filter(m => !m.read);
    res.json({ success: true, removed: before - messages.toWindows.length });
  }
});

// ── START ───────────────────────────────────────────────────
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================');
  console.log(' Tilika Photoshop Server rodando na porta', PORT);
  console.log(' PSD:', CONFIG.PSD_PATH);
  console.log(' PSD existe:', fs.existsSync(CONFIG.PSD_PATH));
  console.log(' Mac Files: http://192.168.48.133:4000/mac-files-list');
  console.log('==============================================');
});
