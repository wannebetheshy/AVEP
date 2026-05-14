#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

Write-Step "Проверка kubectl"
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Error "kubectl не найден в PATH."
}
kubectl version --client --output=yaml | Out-Null

Write-Step "Сборка kustomize (без подключения к API; kubectl apply --dry-run на части версий всё равно ходит за OpenAPI)"
$kout = kubectl kustomize $root 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "kubectl kustomize завершился с ошибкой: $kout"
}
Write-Host "OK: kustomize build"

Write-Step "Проверка контекста кластера"
$ctx = kubectl config current-context 2>$null
if (-not $ctx) {
    Write-Warning "Нет текущего контекста kubectl. Запустите minikube start и повторите."
    exit 1
}
Write-Host "Текущий контекст: $ctx"

Write-Step "Применение kustomize"
kubectl apply -k $root

Write-Step "Ожидание готовности деплойментов (juice-shop/dvwa до 8 мин, webgoat до 120 мин)"
kubectl rollout status deployment/juice-shop -n vuln-lab --timeout=480s
kubectl rollout status deployment/dvwa -n vuln-lab --timeout=480s
kubectl rollout status deployment/webgoat -n vuln-lab --timeout=7200s

Write-Step "Проверка: Job с теми же NetworkPolicy не должен успешно сходить на Kubernetes API"
$probeYaml = @'
apiVersion: batch/v1
kind: Job
metadata:
  name: k8s-api-egress-probe
  namespace: vuln-lab
spec:
  ttlSecondsAfterFinished: 60
  backoffLimit: 0
  template:
    metadata:
      labels:
        app.kubernetes.io/part-of: vuln-lab
    spec:
      restartPolicy: Never
      automountServiceAccountToken: false
      containers:
        - name: curl
          image: curlimages/curl:8.5.0
          command:
            - sh
            - -c
            - "if curl -k -sf --connect-timeout 5 --max-time 10 https://kubernetes.default >/dev/null; then echo UNEXPECTED_OK; exit 1; else echo BLOCKED_OR_FAILED; exit 0; fi"
'@
kubectl delete job k8s-api-egress-probe -n vuln-lab --ignore-not-found 2>$null | Out-Null
$probeYaml | kubectl apply -f -
$jobDone = $false
for ($i = 0; $i -lt 60; $i++) {
    $s = kubectl get job k8s-api-egress-probe -n vuln-lab -o jsonpath="{.status.succeeded}" 2>$null
    $f = kubectl get job k8s-api-egress-probe -n vuln-lab -o jsonpath="{.status.failed}" 2>$null
    if ($s -eq "1") { $jobDone = $true; break }
    if ($f -eq "1") { $jobDone = $true; break }
    Start-Sleep -Seconds 2
}
$logs = kubectl logs job/k8s-api-egress-probe -n vuln-lab 2>$null
Write-Host "Логи пробы: $logs"
$succeeded = kubectl get job k8s-api-egress-probe -n vuln-lab -o jsonpath="{.status.succeeded}" 2>$null
if ($succeeded -eq "1") {
    Write-Host "OK: Job завершился успехом — egress к API из изолированного пода заблокирован или недоступен."
} else {
    Write-Warning "Job не в ожидаемом состоянии succeeded=1. Проверьте CNI и kubectl describe job -n vuln-lab k8s-api-egress-probe"
}

Write-Step "Очистка пробы"
kubectl delete job k8s-api-egress-probe -n vuln-lab --ignore-not-found | Out-Null

Write-Step "Ingress (если включён addon ingress)"
kubectl get ingress -n vuln-lab
Write-Host "`nДобавьте в hosts IP minikube и имена juicelab.local dvwalab.local webgoatlab.local (см. README)."

Write-Host "`nГотово." -ForegroundColor Green
