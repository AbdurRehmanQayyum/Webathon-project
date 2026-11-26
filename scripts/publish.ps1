# Builds one self-contained deployment: the API, the React app and the database bundle.
param(
    [string]$Output = "artifacts/publish",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = if ([IO.Path]::IsPathRooted($Output)) { $Output } else { Join-Path $root $Output }
$app = Join-Path $target "app"
$database = Join-Path $target "database"

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

if (-not (Test-Path (Join-Path $root "src/CampusConnect.Api/appsettings.Production.json"))) {
    Write-Warning "appsettings.Production.json is missing. Create it before deploying (see docs/DEPLOYMENT.md)."
}

Push-Location (Join-Path $root "client")
try {
    Invoke-Step "Install client packages" { npm ci --no-audit --no-fund }
    Invoke-Step "Build client" { npm run build }
}
finally {
    Pop-Location
}

Invoke-Step "Publish API" {
    dotnet publish (Join-Path $root "src/CampusConnect.Api") -c Release -r $Runtime --self-contained true -o $app
}

$webRoot = Join-Path $app "wwwroot"
New-Item -ItemType Directory -Force $webRoot | Out-Null
Copy-Item (Join-Path $root "client/dist/*") $webRoot -Recurse -Force

# Development settings and keys never ship with a deployment
foreach ($name in "appsettings.Development.json", "appsettings.Local.json") {
    $path = Join-Path $app $name
    if (Test-Path $path) { Remove-Item $path }
}

New-Item -ItemType Directory -Force $database | Out-Null
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
Copy-Item (Join-Path $root "database/*") $database -Recurse -Force

Write-Host "Published to $target"
Write-Host "  app\       copy to the server and run CampusConnect.Api.exe (or host it in IIS)"
Write-Host "  database\  run campusconnect-db.exe on the server to create or update the database"
