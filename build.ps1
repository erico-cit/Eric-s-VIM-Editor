param(
  [string[]] $Browser = @("edge", "chrome", "firefox")
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$sharedPath = Join-Path $projectRoot "shared"
$browsersPath = Join-Path $projectRoot "browsers"

foreach ($targetBrowser in $Browser) {
  if ($targetBrowser -notin @("edge", "chrome", "firefox")) {
    throw "Unsupported browser '$targetBrowser'. Choose edge, chrome, or firefox."
  }
}

$templatePath = Join-Path $sharedPath "manifest.json"
$manifestTemplate = Get-Content -Raw $templatePath | ConvertFrom-Json

foreach ($targetBrowser in $Browser) {
  $outputPath = Join-Path $browsersPath $targetBrowser
  $resolvedOutputPath = [IO.Path]::GetFullPath($outputPath)
  $resolvedBrowsersPath = [IO.Path]::GetFullPath($browsersPath) + [IO.Path]::DirectorySeparatorChar
  if (-not $resolvedOutputPath.StartsWith($resolvedBrowsersPath, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to write outside the browsers output folder: $resolvedOutputPath"
  }

  if (Test-Path -LiteralPath $outputPath) {
    Remove-Item -LiteralPath $outputPath -Recurse -Force
  }
  New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
  Copy-Item -Path (Join-Path $sharedPath "*") -Destination $outputPath -Recurse -Force

  $manifest = $manifestTemplate | ConvertTo-Json -Depth 30 | ConvertFrom-Json
  $manifest.name = "Eric's VIM Editor"

  if ($targetBrowser -eq "firefox") {
    $manifest.background = [PSCustomObject]@{ scripts = @("background.js") }
    $manifest | Add-Member -NotePropertyName browser_specific_settings -NotePropertyValue ([PSCustomObject]@{
      gecko = [PSCustomObject]@{
        id = "monaco-vim-mode@erico.local"
        strict_min_version = "128.0"
        data_collection_permissions = [PSCustomObject]@{ required = @("none") }
      }
    }) -Force
  }

  $manifestJson = $manifest | ConvertTo-Json -Depth 30
  [IO.File]::WriteAllText((Join-Path $outputPath "manifest.json"), $manifestJson + [Environment]::NewLine)
}

Write-Host "Built browser packages in $browsersPath"
