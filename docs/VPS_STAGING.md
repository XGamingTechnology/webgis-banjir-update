# VPS Staging

## Current target

- VPS user: `ubuntu`
- Project path: `/opt/webgis-banjir/staging`
- Container: `webgis-banjir-staging`
- Internal port: `3000`
- Host-only port: `127.0.0.1:3100`
- Shared frontend network: `si-cuti-staging-frontend`
- Public hostname: `webgis-staging.43-134-231-84.sslip.io`

## Deploy

```bash
docker compose -f compose.staging.yml up -d --build
curl -fsS http://127.0.0.1:3100/health
```

The application joins the existing staging frontend Docker network so the Nginx edge container can proxy directly to `webgis-banjir-staging:3000`. The host port remains bound to localhost only.

## Acceptance

```bash
docker compose -f compose.staging.yml ps
curl -i http://127.0.0.1:3100/health
curl -I http://127.0.0.1:3100/
curl -I http://webgis-staging.43-134-231-84.sslip.io/
```

HTTPS certificate provisioning is managed separately from the application container.
