# AVEP

Automated Vulnerable Environment Provisioning.

## Starting

- Just use `./start.sh dev`

Then, write to `/etc/hosts`
```
127.0.0.1 vulnavep.com
${minikube ip} k8s.vulnavep.com grafana.vulnavep.com cb52db8f-2d13-40a4-aa9d-d6a9adbd925d.vulnavep.com
```

Replace `${minikube ip}` with actual minikube ip.

## Notes

- The admin demo credentials shown on the login page are `admin` / `change-me`.
