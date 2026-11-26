# Builds the React app and publishes the API with it as one same-origin deployment.
param(
    [string]$Output = "artifacts/publish",
    [string]$Runtime = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$target = if ([IO.Path]::IsPathRooted($Output)) { $Output } else { Join-Path $root $Output }

function Invoke-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE." }
}

Push-Location (Join-Path $root "client")
try {
    Invoke-Step "Install client packages" { npm ci --no-audit --no-fund }
    Invoke-Step "Build client" { npm run build }
}
finally {
    Pop-Location
}

$arguments = @("publish", (Join-Path $root "src/CampusConnect.Api"), "-c", "Release", "-o", $target)
if ($Runtime) { $arguments += @("-r", $Runtime, "--self-contained", "true") }
Invoke-Step "Publish API" { dotnet @arguments }

$webRoot = Join-Path $target "wwwroot"
New-Item -ItemType Directory -Force $webRoot | Out-Null
Copy-Item (Join-Path $root "client/dist/*") $webRoot -Recurse -Force

# Development settings never ship with a deployment
$developmentSettings = Join-Path $target "appsettings.Development.json"
if (Test-Path $developmentSettings) { Remove-Item $developmentSettings }

Write-Host "Published to $target"
