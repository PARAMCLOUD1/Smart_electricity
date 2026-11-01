param([Parameter(Mandatory=$true)][string]$AssetDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectScenes = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'storyboard.json') -Raw -Encoding UTF8 | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $AssetDirectory | Out-Null
$projectNarrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $projectNarrator.SelectVoice('Microsoft David Desktop')
    $projectNarrator.Rate = 0
    foreach ($projectScene in $projectScenes) {
        $projectAudioPath = Join-Path $AssetDirectory ($projectScene.id + '.wav')
        $projectNarrator.SetOutputToWaveFile($projectAudioPath)
        $projectNarrator.Speak($projectScene.narration)
        $projectNarrator.SetOutputToNull()
        Write-Output ('Narration ready: ' + $projectScene.id)
    }
} finally {
    $projectNarrator.Dispose()
}
