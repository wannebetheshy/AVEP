#!/usr/bin/env bash
set -euo pipefail

# Красивое логирование с цветами
log() {
  echo -e "\e[1;34m[$(date +'%H:%M:%S')]\e[0m $*"
}

error() {
  echo -e "\e[1;31m[ERROR]\e[0m $*"
  exit 1
}

log "=== Starting MVP infrastructure setup ==="

# Проверяем наличие базовых утилит
for cmd in curl jq docker; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Утилита '$cmd' не установлена. Сначала установи её через пакетный менеджер своей ОС."
  fi
done

# Проверяем, может ли текущий юзер дергать Docker (чтобы не было проблем с Minikube)
if ! docker info &>/dev/null; then
  error "Нет доступа к Docker. Убедись, что служба запущена, а твой юзер в группе docker: sudo usermod -aG docker \$USER && newgrp docker"
fi

# Настраиваем локальную директорию для бинарников
LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
export PATH="$LOCAL_BIN:$PATH"

# Установка kubectl, если нет
if ! command -v kubectl &>/dev/null; then
  log "Installing kubectl..."
  curl -sSL "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" -o "$LOCAL_BIN/kubectl"
  chmod +x "$LOCAL_BIN/kubectl"
fi

# Установка Helm, если нет
if ! command -v helm &>/dev/null; then
  log "Installing Helm..."
  curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

# Установка Minikube, если нет
if ! command -v minikube &>/dev/null; then
  log "Installing Minikube..."
  curl -sSL https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 -o "$LOCAL_BIN/minikube"
  chmod +x "$LOCAL_BIN/minikube"
fi

log "Starting Minikube (driver=docker, cpus=2, memory=3500)"
minikube start --driver=docker --cpus=2 --memory=3500 --kubernetes-version=v1.28.3

log "Waiting for nodes to be ready..."
kubectl wait --for=condition=Ready node --all --timeout=120s

log "Enabling addons: dashboard, metrics-server"
minikube addons enable dashboard
minikube addons enable metrics-server

log "Waiting for metrics-server to be ready..."
sleep 5
kubectl -n kube-system wait --for=condition=Available deploy/metrics-server --timeout=120s

log "Adding prometheus-community Helm repo..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

log "Creating monitoring namespace..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

log "Installing kube-prometheus-stack..."
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword="admin" \
  --set grafana.service.type=ClusterIP \
  --wait --timeout 10m

log "Waiting for prometheus-operator deployment..."
kubectl -n monitoring wait --for=condition=Available deploy/kube-prometheus-stack-operator --timeout=180s

log "Creating test nginx deployment (15 replicas) to generate load..."
kubectl create deployment nginx-load --image=nginx --replicas=15 --dry-run=client -o yaml | kubectl apply -f -

log "Waiting for nginx deployment rollout..."
kubectl rollout status deployment/nginx-load --timeout=180s

log "Verifying cluster state..."
kubectl get nodes -o wide
kubectl -n monitoring get pods
echo ""
log "=== Infrastructure setup complete ==="
echo -e "\e[1;32mГотово! Как подключиться к дашбордам:\e[0m"
echo "  Grafana:   kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 8080:80 (потом открой http://localhost:8080)"
echo "  Dashboard: minikube dashboard"
