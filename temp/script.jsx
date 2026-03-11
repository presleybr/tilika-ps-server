
#target photoshop
app.displayDialogs = DialogModes.NO;

// Limpar log anterior
try { var _cl = new File("C:/tilika-ps-server/temp/error.log"); _cl.open("w"); _cl.close(); } catch(e) {}

try {

  // ── 1. Abrir PSD ───────────────────────────────────────
  var doc = app.open(new File("C:/Users/Victor/Documents/lilika/Arte_Feed.psd"));
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
  dbgFile.write(layerNames.join("\n"));
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
  editTextLayer(doc, "titulo", "Quem é a enfermeira que vai cuidar do seu familiar?");
  editTextLayer(doc, "gancho", "\"Antes de confiar sua família a alguém, você precisa saber quem é essa pessoa\"");
  editTextLayer(doc, "cta",    "Chama no direct — vamos conversar");
  app.refresh(); // forcar re-render das camadas de texto

  // ── 5. Substituir foto ────────────────────────────────
  replaceFoto(doc, "C:/tilika-ps-server/temp/photo_1773214120749.jpg");
  app.refresh(); // forcar re-render da foto

  // ── 6. Exportar PNG com camadas editadas (camada-final oculta) ──
  var outFile    = new File("C:/tilika-ps-server/output/art_1773214121069.png");
  var pngOptions = new PNGSaveOptions();
  pngOptions.compression = 3;
  pngOptions.interlaced  = false;
  doc.saveAs(outFile, pngOptions, true, Extension.LOWERCASE);
  appendLog("PNG exportado: C:/tilika-ps-server/output/art_1773214121069.png");

  // ── 10. Fechar sem salvar ─────────────────────────────
  doc.close(SaveOptions.DONOTSAVECHANGES);

} catch (e) {
  var logFile = new File("C:/tilika-ps-server/temp/error.log");
  logFile.open("a");
  logFile.write("ERRO GLOBAL: " + e.message + "\nLine: " + e.line);
  logFile.close();
}

// ── Helpers ────────────────────────────────────────────────

function appendLog(msg) {
  try {
    var logF = new File("C:/tilika-ps-server/temp/error.log");
    logF.open("a");
    logF.write(msg + "\n");
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
