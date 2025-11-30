# Security Policy

## Supported versions
Internal project; security fixes are applied continuously on `develop` and merged to `main`.

## Reporting a vulnerability
- Do not open public issues with sensitive details.
- Contact the maintainer directly (repo owner) with steps to reproduce and impact.

## Secrets management
- Do not commit secrets. Client uses anon keys only.
- Server secrets (SERVICE_ROLE) live in environment variables and GitHub Actions secrets.

## Data protection
- Follow `DEVELOPMENT_SAFEGUARDS.md` and `SUPABASE_STORAGE_*` docs for HIPAA-aligned storage and RLS.
