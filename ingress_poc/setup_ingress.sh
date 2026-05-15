#!/usr/bin/env bash
set -euo pipefail

log() { echo -e "\e[1;34m[$(date +'%H:%M:%S')]\e[0m $*"; }

log "=== Starting AVEP Infrastructure Setup ==="

log "Starting Minikube..."
minikube start --driver=docker --cpus=2 --memory=3500 --kubernetes-version=v1.28.3

log "Enabling addons (ingress, dashboard, metrics-server)..."
minikube addons enable ingress
minikube addons enable dashboard
minikube addons enable metrics-server

log "Updating Helm repos & Installing kube-prometheus-stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword="admin" \
  --wait --timeout 10m

log "Deploying Dummy Auth Backend..."
if [ ! -f "test_admin.py" ]; then
    echo "Ошибка: Файл test_admin.py не найден в текущей директории!"
    exit 1
fi

# 1. Создаем ConfigMap прямо из файла test_admin.py
kubectl create configmap dummy-auth-code --from-file=test_admin.py --dry-run=client -o yaml | kubectl apply -f -

# 2. Поднимаем сам деплоймент
kubectl apply -f dummy-auth.yaml

log "Applying Ingress rules..."
kubectl apply -f ingress.yaml

MINIKUBE_IP=$(minikube ip)

log "=== Setup Complete ==="
echo -e "\e[1;32mТвоя SSO система готова!\e[0m"
echo -e "Теперь, если ты зайдешь на http://grafana.avep.com, тебя откинет на http://avep.com"
echo ""
echo -e "\e[1;31mНе забудь обновить /etc/hosts (если еще не делал):\e[0m"
echo "echo \"${MINIKUBE_IP} grafana.avep.com k8s.avep.com avep.com\" | sudo tee -a /etc/hosts"
