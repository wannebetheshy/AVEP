#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

step() { printf '\n=== %s ===\n' "$1"; }

step "Проверка kubectl"
command -v kubectl >/dev/null || { echo "kubectl не найден в PATH"; exit 1; }
kubectl version --client >/dev/null

step "Сборка kustomize (без apply — только локальная проверка YAML)"
kubectl kustomize "$ROOT" >/dev/null
echo "OK: kustomize build"

step "Проверка контекста кластера"
if ! kubectl config current-context >/dev/null 2>&1; then
  echo "Нет текущего контекста. Запустите: minikube start"
  exit 1
fi
echo "Текущий контекст: $(kubectl config current-context)"

step "Применение kustomize"
kubectl apply -k "$ROOT"

step "Ожидание готовности деплойментов (juice-shop/dvwa до 8 мин, webgoat до 120 мин)"
kubectl rollout status deployment/juice-shop -n vuln-lab --timeout=480s
kubectl rollout status deployment/dvwa -n vuln-lab --timeout=480s
kubectl rollout status deployment/webgoat -n vuln-lab --timeout=7200s

step "Проверка: Job не должен успешно достучаться до Kubernetes API по HTTPS"
kubectl delete job k8s-api-egress-probe -n vuln-lab --ignore-not-found >/dev/null 2>&1 || true
kubectl apply -f - <<'EOF'
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
EOF

for _ in $(seq 1 60); do
  s="$(kubectl get job k8s-api-egress-probe -n vuln-lab -o jsonpath='{.status.succeeded}' 2>/dev/null || true)"
  f="$(kubectl get job k8s-api-egress-probe -n vuln-lab -o jsonpath='{.status.failed}' 2>/dev/null || true)"
  if [[ "$s" == "1" || "$f" == "1" ]]; then break; fi
  sleep 2
done

logs="$(kubectl logs job/k8s-api-egress-probe -n vuln-lab 2>/dev/null || true)"
echo "Логи пробы: $logs"
succeeded="$(kubectl get job k8s-api-egress-probe -n vuln-lab -o jsonpath='{.status.succeeded}' 2>/dev/null || true)"
if [[ "$succeeded" == "1" ]]; then
  echo "OK: Job успешен — egress к API из изолированного пода заблокирован или недоступен."
else
  echo "Предупреждение: Job не в состоянии succeeded=1. Смотри: kubectl describe job -n vuln-lab k8s-api-egress-probe" >&2
fi

step "Очистка пробы"
kubectl delete job k8s-api-egress-probe -n vuln-lab --ignore-not-found >/dev/null 2>&1 || true

step "Ingress"
kubectl get ingress -n vuln-lab || true
echo
echo "Добавь в /etc/hosts строки с IP minikube (minikube ip): juicelab.local dvwalab.local webgoatlab.local"
echo "Готово."
