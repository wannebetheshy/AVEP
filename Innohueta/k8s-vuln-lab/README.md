# Изолированная лаборатория уязвимых веб-приложений (minikube)

Цель: поднять **намеренно уязвимые** приложения так, чтобы практика не угрожала хосту и кластеру: нет сканирования внутренней сети, нет выхода к **Kubernetes API** из подов, ограничены ресурсы.

## Три «концептных» образа (известные лабораторные цели)

| Образ | Что это |
|--------|---------|
| `bkimminich/juice-shop` | OWASP Juice Shop — современный OWASP Top 10 в одном магазине. |
| `vulnerables/web-dvwa` | DVWA — классика для SQLi, XSS, CSRF и т.д. |
| `webgoat/webgoat` | OWASP WebGoat — пошаговые уроки по веб-уязвимостям. |

Все три **только для изолированной среды**. Не выставляйте их в интернет без дополнительного периметра (VPN, firewall, отдельная сеть).

## Что делает защита в манифестах

1. **NetworkPolicy**
   - **Ingress**: только из namespace `ingress-nginx` (после `minikube addons enable ingress`). Без аддона вход снаружи к подам не пройдёт политикой — см. раздел «Порт-форвард».
   - **Egress**: только DNS к подам CoreDNS в `kube-system` (UDP/TCP 53). Итог: поды **не достигают** `kubernetes.default`, другие namespace, metadata `169.254.169.254`, соседние поды по произвольным портам.
2. **ServiceAccount**: `automountServiceAccountToken: false` — в поде нет файла токена для захвата API.
3. **RBAC**: у SA нет прав на секреты, поды в других ns, cluster-admin и т.д.
4. **Лимиты CPU/RAM** и **ResourceQuota** — чтобы «легче» не положить ноду от DoS внутри лабы.

## Установка на Linux (kubectl + minikube + драйвер)

Нужны **виртуализация или Docker** и права на запуск minikube.

### 1. Docker (проще всего для minikube)

Debian/Ubuntu (официальный репозиторий Docker — см. [документацию Docker](https://docs.docker.com/engine/install/)) или кратко:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
# дальше по инструкции для твоего дистрибутива; после установки:
sudo usermod -aG docker "$USER"
newgrp docker   # или перелогинься
```

### 2. kubectl

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/
kubectl version --client
```

На **ARM** замени `amd64` на `arm64` в URL.

### 3. minikube

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube version
```

Для ARM: `minikube-linux-arm64`.

### 4. Запуск кластера и ingress

Из корня репозитория (где лежит каталог `k8s-vuln-lab/`):

```bash
minikube start --cpus=4 --memory=6144 --driver=docker
minikube addons enable ingress
```

Проверка, что контекст указывает на minikube:

```bash
kubectl config current-context   # должно быть minikube
```

### 5. Деплой лабы и проверка

```bash
chmod +x k8s-vuln-lab/scripts/verify-lab.sh
./k8s-vuln-lab/scripts/verify-lab.sh
```

Если при запуске **`env: 'bash\r': No such file or directory`** — в файле **Windows-окончания строк (CRLF)**. Исправление на Kali:

```bash
sed -i 's/\r$//' k8s-vuln-lab/scripts/verify-lab.sh
# или: dos2unix k8s-vuln-lab/scripts/verify-lab.sh
```

В репозитории добавлен **`.gitattributes`**: `*.sh` с `eol=lf`, чтобы при клонировании/чекауте скрипты на Linux не ломались.

Либо только применить манифесты:

```bash
kubectl apply -k k8s-vuln-lab/
```

### 6. Доступ с браузера

Узнай IP и пропиши имена (нужны **права root** на запись в `/etc/hosts`):

```bash
minikube ip
# пример:
# <IP_ИЗ_minikube_ip> juicelab.local dvwalab.local webgoatlab.local
```

Сайты: `http://juicelab.local`, `http://dvwalab.local`, `http://webgoatlab.local` (WebGoat обычно по пути `/WebGoat`).

**Если rollout WebGoat висит на `old replicas are pending termination`:** на малом minikube часто зависает старый под. Сразу:

```bash
kubectl get pods -n vuln-lab -l app.kubernetes.io/name=webgoat
kubectl delete pod -n vuln-lab -l app.kubernetes.io/name=webgoat --grace-period=0 --force
```

Deployment сам поднимет один новый под. Затем снова: `kubectl rollout status deployment/webgoat -n vuln-lab --timeout=7200s`.

В актуальном манифесте для WebGoat стоит стратегия **`Recreate`** (не два пода одновременно при обновлении).

**Если в логах WebGoat:** `Invalid value '${webgoat.port}'` или **`Port 8080 was already in use`** — WebGoat в кластере слушает **8090** (`WEBGOAT_PORT` / без дублирующего `SERVER_PORT`); Ingress снаружи по-прежнему **`http://webgoatlab.local/WebGoat`**. Сделай `kubectl apply -k` и пересоздай под.

Проверить сборку YAML **без кластера**:

```bash
kubectl kustomize k8s-vuln-lab/ >/dev/null && echo OK
```

На Windows вместо этого можно: `pwsh -File k8s-vuln-lab/scripts/verify-lab.ps1`.

## Порт-форвард (без Ingress)

Если нужен доступ без ingress-контроллера, временно примените только сервисы и деплойменты, **без** жёсткого `20-networkpolicy-ingress-nginx-only.yaml`, либо расширьте политику под ваш CNI (источник при port-forward зависит от драйвера). Для учебного сценария с ingress рекомендуется основной вариант из репозитория.

## Тесты из репозитория

**Linux:**

```bash
./k8s-vuln-lab/scripts/verify-lab.sh
```

**Windows (PowerShell):**

```powershell
pwsh -File k8s-vuln-lab/scripts/verify-lab.ps1
```

Скрипт применяет манифесты, ждёт rollout и запускает Job с попыткой `curl` к `https://kubernetes.default` из пода с теми же NetworkPolicy (при работающем CNI ожидается **блокировка**, Job завершается успехом с логом `BLOCKED_OR_FAILED`).

## Дополнительные шаблоны

В каталоге `templates/` лежат обобщённые YAML (с плейсхолдерами `CHANGE_ME_*`) для копирования в другие namespace.

## Структура файлов

| Файл | Назначение |
|------|------------|
| `00-namespace.yaml` | Namespace `vuln-lab` |
| `01-resource-quota.yaml` | Quota + LimitRange |
| `02-rbac.yaml` | Ограниченные Role/ServiceAccount |
| `20-networkpolicy-egress-dns-only.yaml` | Egress только к CoreDNS |
| `21-networkpolicy-ingress-nginx-only.yaml` | Ingress только с ingress-nginx |
| `30-deployments-services.yaml` | Juice Shop, DVWA, WebGoat + ClusterIP |
| `40-ingress.yaml` | Один Ingress на три хоста |
| `kustomization.yaml` | Сборка |

## Важно про CNI

NetworkPolicy в Kubernetes **работает только если в кластере есть поддерживающий CNI** (в minikube по умолчанию обычно есть). Если политики не применяются — проверьте: `kubectl get pods -n kube-system` и документацию драйвера minikube.
