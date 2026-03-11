@echo off
echo Criando tarefa automatica no Windows...
schtasks /create /tn "Tilika PS Server" /tr "C:\tilika-ps-server\start-server.bat" /sc onlogon /rl highest /f
echo.
echo Tarefa criada! O servidor iniciara automaticamente ao fazer login.
pause
