param([switch]$Fix)

$srvName = "_mongodb._tcp.eriwork.mn8sxef.mongodb.net"
function Show($ok, $msg) {
  if ($ok) { Write-Host "[ OK ] $msg" -ForegroundColor Green }
  else { Write-Host "[FAIL] $msg" -ForegroundColor Red }
}

# 1. Windows SRV lookup, default DNS, then via Google
$r1 = Resolve-DnsName $srvName -Type SRV -ErrorAction SilentlyContinue | Where-Object Type -eq 'SRV'
Show ([bool]$r1) "Windows SRV lookup (default DNS)"
$r2 = Resolve-DnsName $srvName -Type SRV -Server 8.8.8.8 -ErrorAction SilentlyContinue | Where-Object Type -eq 'SRV'
Show ([bool]$r2) "Windows SRV lookup via 8.8.8.8"

# 2. Node's own resolver (this is what MongoDB uses)
$js = @"
const dns = require('dns');
console.log('Node DNS servers: ' + dns.getServers().join(', '));
dns.resolveSrv('$srvName', (e) => {
  console.log(e ? 'NODE_DEFAULT_FAIL ' + e.code : 'NODE_DEFAULT_OK');
  dns.setServers(['8.8.8.8']);
  dns.resolveSrv('$srvName', (e2) => console.log(e2 ? 'NODE_GOOGLE_FAIL ' + e2.code : 'NODE_GOOGLE_OK'));
});
"@
$tmp = Join-Path $env:TEMP "dnscheck.js"
Set-Content -Path $tmp -Value $js
node $tmp

# 3. Is port 27017 reachable?
$target = ($r2 | Select-Object -First 1).NameTarget
if ($target) {
  $t = Test-NetConnection -ComputerName $target -Port 27017 -WarningAction SilentlyContinue
  Show $t.TcpTestSucceeded "TCP port 27017 to $target"
}

# 4. Fix: set IPv4 + IPv6 DNS on your active adapters (needs Administrator)
if ($Fix) {
  $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $isAdmin) { Write-Host "Open PowerShell as Administrator to use -Fix" -ForegroundColor Yellow; return }
  Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.HardwareInterface } | ForEach-Object {
    Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses ("8.8.8.8","1.1.1.1","2001:4860:4860::8888","2606:4700:4700::1111")
    Write-Host "DNS set on $($_.Name)" -ForegroundColor Cyan
  }
  Clear-DnsClientCache
  Write-Host "Done. Run the script again without -Fix." -ForegroundColor Cyan
}