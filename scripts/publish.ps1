# Builds two zips for a Windows server: the website (self-contained API with the React app)
# and the database setup (EF migration bundle and setup script).
param(
    [string]$Runtime = "win-x64",
    [switch]$CleanInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$artifacts = Join-Path $root "artifacts"
$staging = Join-Path $artifacts "package"
$site = Join-Path $staging "site"
$database = Join-Path $staging "database"
$siteZip = Join-Path $artifacts "CampusConnect-site.zip"
$databaseZip = Join-Path $artifacts "CampusConnect-database.zip"

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

if (-not (Test-Path (Join-Path $root "src\CampusConnect.Api\appsettings.Production.json"))) {
    throw "appsettings.Production.json is missing. Create it first (see docs/DEPLOYMENT.md)."
}

# Only this script writes to the staging folder, so each package starts empty
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force $site, $database | Out-Null

Push-Location (Join-Path $root "client")
try {
    # Reinstalling replaces node_modules, which would interrupt a running development server
    if ($CleanInstall -or -not (Test-Path "node_modules")) {
        Invoke-Step "Install client packages" { npm ci --no-audit --no-fund }
    }
    Invoke-Step "Build client" { npm run build }
}
finally {
    Pop-Location
}

Invoke-Step "Publish API" {
    dotnet publish (Join-Path $root "src\CampusConnect.Api") -c Release -r $Runtime --self-contained true -o $site
}

$webRoot = Join-Path $site "wwwroot"
New-Item -ItemType Directory -Force $webRoot, (Join-Path $site "App_Data"), (Join-Path $site "logs") | Out-Null
Copy-Item (Join-Path $root "client\dist\*") $webRoot -Recurse -Force

# Development settings and keys never ship with a deployment
foreach ($name in "appsettings.Development.json", "appsettings.Local.json") {
    $path = Join-Path $site $name
    if (Test-Path $path) { Remove-Item $path }
}

Push-Location $root
try {
    Invoke-Step "Restore .NET tools" { dotnet tool restore }
    # The EF tool reads project metadata, which exists only after a restore
    Invoke-Step "Restore database project" {
        dotnet restore tools/CampusConnect.DbMigrator --runtime $Runtime
    }
    Invoke-Step "Build database bundle" {
        dotnet ef migrations bundle --project tools/CampusConnect.DbMigrator --configuration Release `
            --self-contained --target-runtime $Runtime --force `
            --output (Join-Path $database "campusconnect-db.exe")
    }
}
finally {
    Pop-Location
}
Copy-Item (Join-Path $root "database\*") $database -Recurse -Force
Copy-Item (Join-Path $root "deploy\*") $database -Recurse -Force
# Windows line endings for the files people open and run on the server
foreach ($file in Get-ChildItem $database -File | Where-Object { $_.Extension -in ".cmd", ".ps1", ".txt" }) {
    $text = [IO.File]::ReadAllText($file.FullName) -replace "`r?`n", "`r`n"
    [IO.File]::WriteAllText($file.FullName, $text)
}

Write-Host "==> Create the zips"
Add-Type -AssemblyName System.IO.Compression.FileSystem
# The single zip made by earlier versions of this script is replaced by these two
foreach ($old in $siteZip, $databaseZip, (Join-Path $artifacts "CampusConnect-deploy.zip")) {
    if (Test-Path $old) { Remove-Item $old }
}
$level = [IO.Compression.CompressionLevel]::Optimal
[IO.Compression.ZipFile]::CreateFromDirectory($site, $siteZip, $level, $false)
[IO.Compression.ZipFile]::CreateFromDirectory($database, $databaseZip, $level, $false)

foreach ($file in $siteZip, $databaseZip) {
    Write-Host "Package: $file ($([math]::Round((Get-Item $file).Length / 1MB)) MB)"
}
Write-Host "The site zip contains production secrets. Copy it to the server only."
