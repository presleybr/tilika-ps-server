
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

var psdFile = new File("C:/Users/Victor/Documents/lilika/Arte_Feed.psd");
var doc = app.open(psdFile);
collectLayers(doc, '');
doc.close(SaveOptions.DONOTSAVECHANGES);

var outFile = new File("C:/tilika-ps-server/temp/layers.json");
outFile.open("w");
outFile.write(JSON.stringify(result));
outFile.close();
