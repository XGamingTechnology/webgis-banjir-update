# GitHub → VPS Staging Workflow

Repository: `XGamingTechnology/webgis-banjir-update`

## Branch model

- `main`: stable/approved baseline.
- `Staging`: VPS staging deployment source.
- Feature branches: implementation work before review and merge into `Staging`.

## VPS staging target

- Application: `webgis-banjir-staging`
- Internal application port: `3000`
- Host-only port: `127.0.0.1:3100`
- Public staging hostname: `webgis-staging.43-134-231-84.sslip.io`

## Deployment principle

GitHub is the source of truth. Avoid editing application source directly on the VPS. Changes should be committed to a feature branch, reviewed, merged to `Staging`, then deployed to the VPS from that branch.

## Legacy baseline

The legacy system remains a read-only migration/reference source. It must not be overwritten by the v2 repository.
