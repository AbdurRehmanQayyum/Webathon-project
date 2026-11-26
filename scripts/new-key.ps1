# Prints a cryptographically random base64 key.
#   Jwt:Key        -> powershell -File scripts/new-key.ps1 -Bytes 64
#   Encryption:Key -> powershell -File scripts/new-key.ps1 -Bytes 32
param([int]$Bytes = 32)

$buffer = New-Object byte[] $Bytes
$generator = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $generator.GetBytes($buffer)
}
finally {
    $generator.Dispose()
}

[Convert]::ToBase64String($buffer)
