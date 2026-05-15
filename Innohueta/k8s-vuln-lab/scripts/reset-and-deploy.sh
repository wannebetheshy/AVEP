#!/usr/bin/env bash
# Полный сброс minikube + деплой лабы. Запуск из любой директории:
#   bash k8s-vuln-lab/scripts/reset-and-deploy.sh
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ">>> minikube delete (весь кластер)"
minikube delete || true

echo ">>> minikube start (docker, 2 CPU, 4G RAM — меньше геморроя с WebGoat)"
minikube start --driver=docker --cpus=2 --memory=4096

echo ">>> ingress"
minikube addons enable ingress
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s

echo ">>> apply лабы"
kubectl apply -k "$LAB_DIR"

echo ">>> ждём деплойменты (WebGoat может идти долго)"
kubectl rollout status deployment/juice-shop -n vuln-lab --timeout=480s
kubectl rollout status deployment/dvwa -n vuln-lab --timeout=480s
kubectl rollout status deployment/webgoat -n vuln-lab --timeout=7200s || true

echo
echo "=== В /etc/hosts одна строка (через sudo): ==="
echo "$(minikube ip) juicelab.local dvwalab.local webgoatlab.local"
echo
echo "Сайты: http://juicelab.local  http://dvwalab.local  http://webgoatlab.local/WebGoat"
echo "Проверка: kubectl get pods -n vuln-lab"
