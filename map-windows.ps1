# ================================================================
# Windows API Mapper - Mapeia TUDO que pode ser controlado via API
# Salva em C:\tilika-ps-server\windows-map\
# ================================================================

$outputDir = "C:\tilika-ps-server\windows-map"
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function Save-Json($data, $filename) {
    $data | ConvertTo-Json -Depth 6 | Set-Content "$outputDir\$filename" -Encoding UTF8
    Write-Host "Salvo: $filename"
}

Write-Host "=== WINDOWS API MAPPER INICIADO ==="

# ── 1. MODULOS E CMDLETS POWERSHELL ──────────────────────────
Write-Host "[1/12] Mapeando modulos PowerShell..."
$modules = Get-Module -ListAvailable | Select-Object Name, Version, ModuleType, Description | Sort-Object Name
Save-Json $modules "01-powershell-modules.json"

$cmdlets = Get-Command -CommandType Cmdlet,Function | Select-Object Name, ModuleName, CommandType | Sort-Object Name
Save-Json $cmdlets "02-powershell-cmdlets.json"

# ── 2. OBJETOS COM INSTALADOS (Word, Excel, Photoshop, etc) ──
Write-Host "[2/12] Mapeando objetos COM (aplicacoes automativaveis)..."
$comObjects = @()
$regPath = "HKLM:\SOFTWARE\Classes"
Get-ChildItem $regPath -ErrorAction SilentlyContinue | ForEach-Object {
    $name = $_.PSChildName
    if ($name -match '^\w+\.\w+$' -and $name -notmatch '^\d') {
        $clsid = (Get-ItemProperty "$regPath\$name\CLSID" -ErrorAction SilentlyContinue).'(default)'
        if ($clsid) {
            $comObjects += [PSCustomObject]@{ ProgId = $name; CLSID = $clsid }
        }
    }
}
Save-Json $comObjects "03-com-objects.json"

# ── 3. APLICACOES INSTALADAS ─────────────────────────────────
Write-Host "[3/12] Mapeando aplicacoes instaladas..."
$apps = @()
$regPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
)
foreach ($path in $regPaths) {
    Get-ChildItem $path -ErrorAction SilentlyContinue | ForEach-Object {
        $app = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
        if ($app.DisplayName) {
            $apps += [PSCustomObject]@{
                Nome        = $app.DisplayName
                Versao      = $app.DisplayVersion
                Publisher   = $app.Publisher
                InstallDir  = $app.InstallLocation
                Executavel  = $app.DisplayIcon
            }
        }
    }
}
Save-Json ($apps | Sort-Object Nome) "04-apps-instaladas.json"

# ── 4. SERVICOS WINDOWS ───────────────────────────────────────
Write-Host "[4/12] Mapeando servicos Windows..."
$services = Get-Service | Select-Object Name, DisplayName, Status, StartType | Sort-Object Name
Save-Json $services "05-windows-services.json"

# ── 5. PROCESSOS RODANDO ─────────────────────────────────────
Write-Host "[5/12] Mapeando processos ativos...")
$processes = Get-Process | Select-Object Id, Name, CPU, WorkingSet, Path | Sort-Object Name
Save-Json $processes "06-processos-ativos.json"

# ── 6. HARDWARE E SISTEMA ────────────────────────────────────
Write-Host "[6/12] Mapeando hardware...")
$cpu     = Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, MaxClockSpeed
$ram     = Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Speed, Manufacturer
$discos  = Get-CimInstance Win32_DiskDrive | Select-Object Model, Size, InterfaceType
$gpu     = Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion
$os      = Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, TotalVisibleMemorySize

$hardware = @{ CPU = $cpu; RAM = $ram; Discos = $discos; GPU = $gpu; OS = $os }
Save-Json $hardware "07-hardware.json"

# ── 7. REDE ──────────────────────────────────────────────────
Write-Host "[7/12] Mapeando interfaces de rede..."
$adapters   = Get-NetAdapter | Select-Object Name, Status, MacAddress, LinkSpeed
$ipConfigs  = Get-NetIPAddress | Select-Object InterfaceAlias, AddressFamily, IPAddress, PrefixLength
$firewall   = Get-NetFirewallRule | Where-Object Enabled -eq True | Select-Object Name, Direction, Action, Protocol | Select-Object -First 50
$shares     = Get-SmbShare | Select-Object Name, Path, Description

$network = @{ Adapters = $adapters; IPs = $ipConfigs; Firewall = $firewall; Shares = $shares }
Save-Json $network "08-rede.json"

# ── 8. AGENDADOR DE TAREFAS ──────────────────────────────────
Write-Host "[8/12] Mapeando tarefas agendadas...")
$tasks = Get-ScheduledTask | Select-Object TaskName, TaskPath, State, Description | Sort-Object TaskName
Save-Json $tasks "09-scheduled-tasks.json"

# ── 9. REGISTRO — CHAVES UTEIS ───────────────────────────────
Write-Host "[9/12] Mapeando chaves de registro uteis...")
$regMap = @{
    StartupPrograms     = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue)
    StartupProgramsUser = (Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue)
    FileAssociations    = @()
    InstalledFonts      = (Get-ChildItem "C:\Windows\Fonts" | Select-Object Name, Length)
}
Save-Json $regMap "10-registry-map.json"

# ── 10. IMPRESSORAS E PERIFERICOS ────────────────────────────
Write-Host "[10/12] Mapeando impressoras e perifericos...")
$printers   = Get-Printer | Select-Object Name, DriverName, PortName, Shared
$usb        = Get-PnpDevice | Where-Object {$_.Class -eq "USB"} | Select-Object FriendlyName, Status
$monitors   = Get-CimInstance Win32_DesktopMonitor | Select-Object Name, ScreenWidth, ScreenHeight

$peripherals = @{ Impressoras = $printers; USB = $usb; Monitors = $monitors }
Save-Json $peripherals "11-perifericos.json"

# ── 11. WMI CLASSES DISPONIVEIS ──────────────────────────────
Write-Host "[11/12] Mapeando classes WMI disponiveis...")
$wmiClasses = Get-CimClass -Namespace root/cimv2 |
    Where-Object { $_.CimClassName -notmatch '^__' } |
    Select-Object CimClassName | Sort-Object CimClassName
Save-Json $wmiClasses "12-wmi-classes.json"

# ── 12. RESUMO FINAL ─────────────────────────────────────────
Write-Host "[12/12] Gerando resumo...")
$summary = @{
    geradoEm        = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    computador      = $env:COMPUTERNAME
    usuario         = $env:USERNAME
    totalModulos    = $modules.Count
    totalCmdlets    = $cmdlets.Count
    totalComObjects = $comObjects.Count
    totalApps       = $apps.Count
    totalServicos   = $services.Count
    arquivosGerados = (Get-ChildItem $outputDir).Count
    diretorio       = $outputDir
    endpoints       = @(
        "GET /windows-map — lista todos os arquivos mapeados",
        "GET /windows-map/apps — apps instaladas",
        "GET /windows-map/com — objetos COM automativaveis",
        "GET /windows-map/services — servicos Windows",
        "GET /windows-map/hardware — info de hardware",
        "GET /windows-map/cmdlets — todos cmdlets PowerShell"
    )
}
Save-Json $summary "00-RESUMO.json"

Write-Host ""
Write-Host "=== MAPEAMENTO CONCLUIDO ==="
Write-Host "Arquivos em: $outputDir"
Write-Host "Total COM Objects: $($comObjects.Count)"
Write-Host "Total Apps: $($apps.Count)"
Write-Host "Total Cmdlets: $($cmdlets.Count)"
