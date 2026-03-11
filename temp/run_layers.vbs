
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
jsxFile = "C:\\tilika-ps-server\\temp\\script_layers.jsx"

psApp.DoJavaScriptFile jsxFile

WScript.Echo "OK"
Set psApp = Nothing
