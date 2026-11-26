# Creates the database and connects the existing IIS website to it, then restarts the site.
# Copy the site files into the website folder first, then run Setup.cmd as Administrator.
[CmdletBinding()]
param(
    # Only needed when more than one website contains the application
    [string]$SiteName = ""
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Text) { Write-Host "`n==> $Text" -ForegroundColor Magenta }

$current = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script as Administrator."
}
if (-not (Test-Path "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll")) {
    throw ("The ASP.NET Core module is missing. Install the .NET 10 Hosting Bundle from " +
        "https://dotnet.microsoft.com/download/dotnet/10.0, run 'iisreset', then run this again.")
}
Import-Module WebAdministration
Get-ChildItem $PSScriptRoot -Recurse -File | Unblock-File

# ---------------------------------------------------------------- Website
Write-Step "Finding the website"
$websites = @(Get-Website)
$matching = @($websites | Where-Object {
        (-not $SiteName -or $_.name -eq $SiteName) -and
        (Test-Path (Join-Path ([Environment]::ExpandEnvironmentVariables($_.physicalPath)) "CampusConnect.Api.exe"))
    })
if ($matching.Count -eq 0) {
    throw "No website folder contains CampusConnect.Api.exe. Copy the site files into the website folder first."
}
if ($matching.Count -gt 1) {
    throw "Several websites contain the app: $($matching.name -join ', '). Run: Setup.cmd -SiteName <name>"
}
$site = $matching[0]
$path = [Environment]::ExpandEnvironmentVariables($site.physicalPath)
$pool = $site.applicationPool
$poolPath = "IIS:\AppPools\$pool"
Write-Host "Website: $($site.name) | Folder: $path | Application pool: $pool"

# The account the application runs as, which needs access to the database and folders
$model = Get-ItemProperty $poolPath -Name processModel
$account = switch ("$($model.identityType)") {
    "SpecificUser" { $model.userName -replace '^\.\\', "$env:COMPUTERNAME\" }
    "NetworkService" { "NT AUTHORITY\NETWORK SERVICE" }
    "LocalService" { "NT AUTHORITY\LOCAL SERVICE" }
    "LocalSystem" { "NT AUTHORITY\SYSTEM" }
    default { "IIS APPPOOL\$pool" }
}

if ((Get-WebAppPoolState $pool).Value -ne "Stopped") {
    Stop-WebAppPool $pool
    for ($i = 0; $i -lt 30 -and (Get-WebAppPoolState $pool).Value -ne "Stopped"; $i++) {
        Start-Sleep -Seconds 1
    }
}

# ---------------------------------------------------------------- Database
Write-Step "Creating or updating the database"
$settings = Get-Content (Join-Path $path "appsettings.Production.json") -Raw | ConvertFrom-Json
$connection = $settings.ConnectionStrings.CampusConnect
& (Join-Path $PSScriptRoot "campusconnect-db.exe") --connection $connection
if ($LASTEXITCODE -ne 0) {
    throw "The database update failed. Check that SQL Server is running and that you may create databases."
}

Write-Step "Giving $account read and write access to the database"
function Invoke-Sql([string]$Database, [string]$Query) {
    $builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder($connection)
    $builder["Initial Catalog"] = $Database
    $sql = New-Object System.Data.SqlClient.SqlConnection($builder.ConnectionString)
    try {
        $sql.Open()
        $command = $sql.CreateCommand()
        $command.CommandText = $Query
        [void]$command.ExecuteNonQuery()
    }
    finally { $sql.Dispose() }
}

$text = $account.Replace("'", "''")
$name = "[" + $account.Replace("]", "]]") + "]"
$databaseName = (New-Object System.Data.SqlClient.SqlConnectionStringBuilder($connection))["Initial Catalog"]
Invoke-Sql "master" "IF SUSER_ID(N'$text') IS NULL CREATE LOGIN $name FROM WINDOWS;"
Invoke-Sql $databaseName @"
DECLARE @sid varbinary(85) = SUSER_SID(N'$text');
IF EXISTS (SELECT 1 FROM sys.databases WHERE database_id = DB_ID() AND owner_sid = @sid) RETURN;
DECLARE @user sysname = (SELECT name FROM sys.database_principals WHERE sid = @sid);
IF @user IS NULL
BEGIN
    CREATE USER $name FOR LOGIN $name;
    SET @user = N'$text';
END
EXEC sp_addrolemember N'db_datareader', @user;
EXEC sp_addrolemember N'db_datawriter', @user;
"@

# ---------------------------------------------------------------- Folders and pool
Write-Step "Setting folder permissions"
icacls $path /grant "${account}:(OI)(CI)RX" /Q | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Setting folder permissions failed." }
foreach ($folder in "App_Data", "logs") {
    $target = Join-Path $path $folder
    New-Item -ItemType Directory -Force $target | Out-Null
    icacls $target /grant "${account}:(OI)(CI)M" /Q | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Setting permissions on $folder failed." }
}

$others = @($websites | Where-Object { $_.applicationPool -eq $pool -and $_.name -ne $site.name })
if ($others.Count -eq 0) {
    Set-ItemProperty $poolPath managedRuntimeVersion ""
}
else {
    Write-Warning ("The application pool '$pool' is also used by: $($others.name -join ', '). " +
        "This app needs a pool of its own; otherwise IIS reports error 500.35.")
}

# WebDAV would block the PUT and DELETE requests the app uses
if (Get-WebGlobalModule -Name WebDAVModule) {
    & "$env:windir\system32\inetsrv\appcmd.exe" set config $site.name -section:system.webServer/modules `
        "/-[name='WebDAVModule']" /commit:apphost | Out-Null
}

# ---------------------------------------------------------------- Restart
Write-Step "Restarting the website"
Start-WebAppPool $pool
if ((Get-WebsiteState $site.name).Value -ne "Started") { Start-Website $site.name }

$binding = Get-WebBinding -Name $site.name -Protocol https | Select-Object -First 1
if (-not $binding) {
    Write-Warning "The website has no HTTPS binding. Sign-in works over HTTPS only."
}
elseif (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    $parts = $binding.bindingInformation -split ':'
    $port = $parts[-2]
    $hostName = if ($parts[-1]) { $parts[-1] } else { "localhost" }
    $address = "https://${hostName}:$port"
    $status = "000"
    for ($i = 0; $i -lt 15 -and $status -ne "200"; $i++) {
        Start-Sleep -Seconds 2
        $status = curl.exe -k -s -o NUL -w "%{http_code}" --resolve "${hostName}:${port}:127.0.0.1" "$address/health"
        if ($status -ne "200") { $status = curl.exe -k -s -o NUL -w "%{http_code}" "$address/health" }
    }
    if ($status -eq "200") { Write-Host "Health check passed: $($address -replace ':443$', '')" -ForegroundColor Green }
    else {
        Write-Warning "Health check returned $status. See $path\logs and Event Viewer > Windows Logs > Application."
    }
}

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  Admin email   : $($settings.AdminBootstrap.Email)"
Write-Host "  Admin password: AdminBootstrap > Password in $path\appsettings.Production.json"
Write-Host "                  You are asked to change it at the first sign-in."
