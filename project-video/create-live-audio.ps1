param([Parameter(Mandatory=$true)][string]$AssetDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
New-Item -ItemType Directory -Force -Path $AssetDirectory | Out-Null
$projectLiveSteps = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'live-steps.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$projectLiveVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $projectLiveVoice.SelectVoice('Microsoft David Desktop')
    $projectLiveVoice.Rate = 1
    foreach ($projectLiveStep in $projectLiveSteps) {
        $projectLiveVoice.SetOutputToWaveFile((Join-Path $AssetDirectory ($projectLiveStep.id + '.wav')))
        $projectLiveVoice.Speak($projectLiveStep.narration)
        $projectLiveVoice.SetOutputToNull()
        Write-Output ('Live narration ready: ' + $projectLiveStep.id)
    }
} finally { $projectLiveVoice.Dispose() }
