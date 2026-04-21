# DarkPool Markets

Minimal monorepo scaffold for:

- `apps/web` (Next.js frontend)
- `apps/api` (Node/Express backend)
- `packages/contracts` (Hardhat contracts package)

## Project Structure

```text
darkpool-markets/
  apps/
    web/        # Next.js frontend
    api/        # Node/Express backend
  packages/
    contracts/  # Hardhat contracts package
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start each app/package:

```bash
# Frontend
pnpm --filter @darkpool/web dev

# Backend API
pnpm --filter @darkpool/api dev

# Local Hardhat chain
pnpm --filter @darkpool/contracts node
```

## Workspace Scripts

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:contracts
pnpm build
pnpm test
pnpm lint
```
