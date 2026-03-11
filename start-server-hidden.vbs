Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "C:\tilika-ps-server\start-server.bat", 0, False
Set WshShell = Nothing
