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

// ── RENDER ─────────────────────────────────────────────────
app.post('/render', async (req, res) => {
  const { titulo, gancho, cta, pilar, photoUrl } = req.body;

  console.log('[PS Server] Render request:', titulo?.slice(0, 40));

  try {
    // 1. Baixar foto do Pexels pra arquivo temp
    const photoPath = path.join(CONFIG.TEMP_DIR, `photo_${Date.now()}.jpg`);
    await downloadFile(photoUrl, photoPath);
    console.log('[PS Server] Foto baixada:', photoPath);

    // 2. Caminho do JPG de saída
    const outputPath = path.join(CONFIG.OUTPUT_DIR, `art_${Date.now()}.jpg`);

    // 3. Gerar script ExtendScript
    const jsx = buildJSX({ titulo, gancho, cta, photoPath, outputPath });
    fs.writeFileSync(CONFIG.PS_SCRIPT, jsx, 'utf8');
    console.log('[PS Server] Script JSX gerado');

    // 4. Executar via VBScript (controla PS pelo COM do Windows)
    const vbs = buildVBS(CONFIG.PS_SCRIPT);
    fs.writeFileSync(CONFIG.VBS_SCRIPT, vbs, 'utf8');

    await runScript(`cscript //NoLogo "${CONFIG.VBS_SCRIPT}"`);
    console.log('[PS Server] Photoshop executou o script');

    // 5. Ler JPG exportado e retornar em base64
    if (!fs.existsSync(outputPath)) {
      throw new Error('Photoshop não gerou o arquivo de saída: ' + outputPath);
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
  // Escapar strings pra JavaScript
  const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

  // Normalizar caminhos pra forward slash (PS prefere assim)
  const psdPath    = CONFIG.PSD_PATH.replace(/\\/g, '/');
  const photoFwd   = photoPath.replace(/\\/g, '/');
  const outputFwd  = outputPath.replace(/\\/g, '/');

  return `
// Script gerado automaticamente — Tilika PS Server
#target photoshop

// Suprimir TODOS os dialogos — roda silencioso
app.displayDialogs = DialogModes.NO;

try {
  // ── Abrir PSD ──────────────────────────────────────────
  var psdFile = new File("${psdPath}");
  if (!psdFile.exists) { throw new Error("PSD nao encontrado: ${psdPath}"); }

  var doc = app.open(psdFile);
  app.activeDocument = doc;

  // ── Editar camadas de texto ────────────────────────────
  editTextLayer(doc, "titulo",  "${esc(titulo)}");
  editTextLayer(doc, "gancho",  "${esc(gancho)}");
  editTextLayer(doc, "cta",     "${esc(cta)}");

  // ── Substituir foto ────────────────────────────────────
  replaceFoto(doc, "${photoFwd}");

  // ── Exportar como JPG ──────────────────────────────────
  var outFile = new File("${outputFwd}");
  var opts    = new JPEGSaveOptions();
  opts.quality = 12; // máximo
  doc.saveAs(outFile, opts, true, Extension.LOWERCASE);

  // ── Fechar sem salvar ──────────────────────────────────
  doc.close(SaveOptions.DONOTSAVECHANGES);

} catch (e) {
  // Sem alert — logar no console do servidor
  var logFile = new File("C:/tilika-ps-server/temp/error.log");
  logFile.open("w");
  logFile.write("ERRO: " + e.message);
  logFile.close();
}

// ── Funções auxiliares ─────────────────────────────────────

function editTextLayer(doc, name, content) {
  if (!content) return;
  try {
    var layer = findLayer(doc, name);
    if (layer && layer.kind === LayerKind.TEXT) {
      layer.textItem.contents = content;
    }
  } catch (e) {
    // Camada nao encontrada — ignora
  }
}

function replaceFoto(doc, photoPath) {
  try {
    var layer = findLayer(doc, "foto");
    if (!layer) return;

    doc.activeLayer = layer;

    // Tentar substituir conteudo do smart object
    try {
      var desc = new ActionDescriptor();
      desc.putPath(charIDToTypeID("null"), new File(photoPath));
      executeAction(stringIDToTypeID("placedLayerReplaceContents"), desc, DialogModes.NO);
      return;
    } catch (e) {}

    // Fallback: abrir e fazer place manual
    try {
      var photoFile = new File(photoPath);
      var placed = doc.place(photoFile);
      placed.name = "foto_nova";
    } catch (e2) {}

  } catch (e) {
    // Se nao conseguir substituir a foto, continua sem ela
  }
}

function findLayer(container, name) {
  // Buscar em artLayers diretos
  try {
    var layers = container.artLayers;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].name === name) return layers[i];
    }
  } catch(e) {}
  // Buscar recursivamente em todos os grupos/layerSets
  try {
    var groups = container.layerSets;
    for (var g = 0; g < groups.length; g++) {
      // Checar o proprio grupo
      if (groups[g].name === name) return groups[g];
      // Buscar dentro do grupo
      var found = findLayer(groups[g], name);
      if (found) return found;
    }
  } catch(e) {}
  // Buscar em layers (mistura artLayers + layerSets)
  try {
    var allLayers = container.layers;
    for (var l = 0; l < allLayers.length; l++) {
      if (allLayers[l].name === name) return allLayers[l];
      if (allLayers[l].layers) {
        var found2 = findLayer(allLayers[l], name);
        if (found2) return found2;
      }
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

// ── START ───────────────────────────────────────────────────
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================');
  console.log(' Tilika Photoshop Server rodando na porta', PORT);
  console.log(' PSD:', CONFIG.PSD_PATH);
  console.log(' PSD existe:', fs.existsSync(CONFIG.PSD_PATH));
  console.log('==============================================');
});
