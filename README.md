# AVEP

Automated Vulnerable Environment Provisioning.

## Prerequisites

- Docker and Docker Compose
- A `.env` file in the repository root

The repo already ships with `.env.example`. Copy it to `.env` and keep the defaults unless you need custom credentials or URLs.

## Production

1. Build and launch the images:

   ```bash
   make prod
   ```

2. Open the app in the browser:
   - Frontend: http://localhost
   - Backend health: http://localhost:8000/api/v1/health

## Development

The development stack runs the frontend and backend in hot-reload mode. The frontend service mounts `./frontend:/app`, so editing files on the host updates the browser after Vite refreshes.

1. Start the dev stack:

   ```bash
   make dev
   ```

2. Open the app in the browser:
   - Frontend: http://localhost:5173
   - Backend health: http://localhost:8000/api/v1/health

## Notes

- The current backend keeps Kubernetes behavior mocked behind service methods. The UI is already wired to the backend, so replacing the mock internals should not require frontend changes.
- The admin demo credentials shown on the login page are `admin` / `change-me`.
