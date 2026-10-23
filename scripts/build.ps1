param([string]$Go='go',[string]$Version='0.1.0-preview.1',[string]$Out='dist')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Push-Location (Join-Path $root 'web')
try{npm ci --no-audit --no-fund;if($LASTEXITCODE){throw 'Dependencies failed'};npm run build;if($LASTEXITCODE){throw 'Frontend build failed'}}finally{Pop-Location}
New-Item -ItemType Directory -Path (Join-Path $root $Out) -Force|Out-Null
Push-Location $root
try{& $Go build -buildvcs=false -trimpath -ldflags "-s -w -X main.version=$Version" -o (Join-Path $Out 'My3D.exe') ./cmd/my-3d;if($LASTEXITCODE){throw 'Native build failed'}}finally{Pop-Location}
