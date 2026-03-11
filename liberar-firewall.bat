@echo off
echo Liberando porta 4000 no firewall...
netsh advfirewall firewall add rule name="Tilika PS Server" dir=in action=allow protocol=TCP localport=4000
echo.
echo Porta liberada com sucesso!
pause
