#!/usr/bin/env bash
set -euo pipefail

MODE=${1:-dev}
echo -e "\e[1;34m=== Запуск AVEP ($MODE) ===\e[0m"

# 1. Minikube & Addons
if ! minikube status &>/dev/null; then
    echo "🚀 Поднимаем Minikube..."
    minikube start --driver=docker --cpus=2 --memory=3500 --kubernetes-version=v1.28.3
    minikube addons enable ingress
    minikube addons enable dashboard
    minikube addons enable metrics-server
fi

# 2. Мониторинг (Grafana)
if ! helm ls -n monitoring | grep -q "kube-prometheus-stack"; then
    echo "📊 Установка Prometheus/Grafana..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    kubectl create ns monitoring --dry-run=client -o yaml | kubectl apply -f -
    helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
      --namespace monitoring --set grafana.adminPassword="admin" --wait
fi

# 3. Применяем ямлы
echo "🛡️  Накатываем манифесты..."
kubectl apply -k k8s-vuln-lab/
kubectl apply -f k8s-system-ingress.yaml

MINIKUBE_IP=$(minikube ip)

# 4. Напоминалка про /etc/hosts
echo -e "\e[1;33m⚠️ Убедись, что в /etc/hosts есть:\e[0m"
echo "127.0.0.1 vulnavep.com"
echo "$MINIKUBE_IP grafana.vulnavep.com k8s.vulnavep.com"

# 5. Запуск платформы
if [ "$MODE" = "dev" ]; then
    echo "🐳 Запуск Docker Compose (DEV)..."
    make dev
else
    echo "🐳 Запуск Docker Compose (PROD)..."
    make prod
fi