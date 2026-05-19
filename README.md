# DarkPool Markets

Monorepo for an fhEVM-based prediction market:

- `apps/web` (Next.js frontend)
- `apps/api` (Node/Express backend for encryption + AI helper)
- `packages/contracts` (Hardhat + Solidity contracts)

## Project Structure

```text
darkpool-markets/
  apps/
    web/        # Next.js frontend
    api/        # Node/Express backend
  packages/
    contracts/  # Hardhat contracts package
```

## Install

```bash
pnpm install
```

## Local Mode (Anvil/Hardhat)

1) Start local chain + auto deploy + web:

```bash
pnpm dev:local
```

2) Start API (local encryption mode):

```bash
cp apps/api/.env.example apps/api/.env.local
pnpm --filter @darkpool/api dev
```

3) Create market on local:

```bash
FACTORY_ADDRESS=$(grep NEXT_PUBLIC_FACTORY_ADDRESS apps/web/.env.local | cut -d= -f2) \
MARKET_QUESTION='Will ETH close above $5k by month end?' \
MARKET_METADATA_URI='ipfs://darkpool-demo-1' \
MARKET_DURATION_SECONDS=1800 \
pnpm --filter @darkpool/contracts create-market:local
```

## Sepolia Mode (Testnet)

### 1) Contracts env

Copy and fill:

```bash
cp packages/contracts/.env.example packages/contracts/.env
```

Required:

- `DEPLOYER_PRIVATE_KEY` (wallet with Sepolia ETH)
- `SEPOLIA_RPC_URL`

Deploy:

```bash
pnpm --filter @darkpool/contracts deploy:sepolia
```

Create first market:

```bash
FACTORY_ADDRESS=0xYourFactoryAddress \
MARKET_QUESTION='Will ETH close above $5k by month end?' \
MARKET_METADATA_URI='ipfs://darkpool-demo-1' \
MARKET_DURATION_SECONDS=86400 \
pnpm --filter @darkpool/contracts create-market:sepolia
```

### 2) API env (Sepolia encryption)

```bash
cp apps/api/.env.example apps/api/.env.local
```

Set at minimum:

- `FHEVM_ENCRYPTION_MODE=sepolia`
- `FHEVM_RPC_URL=<same sepolia rpc or another reliable one>`
- optional `ZAMA_FHEVM_API_KEY` if your relayer access requires it

Then run:

```bash
pnpm --filter @darkpool/api dev
```

### 3) Web env (Sepolia reads + tx links)

```bash
cp apps/web/.env.example apps/web/.env.local
```

Set:

- `NEXT_PUBLIC_CHAIN_ID=11155111`
- `NEXT_PUBLIC_RPC_URL=<sepolia rpc>`
- `NEXT_PUBLIC_FACTORY_ADDRESS=<deployed factory address>`
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000`
- optional `NEXT_PUBLIC_TX_EXPLORER_URL_PREFIX=https://sepolia.etherscan.io/tx`

Run web:

```bash
pnpm --filter @darkpool/web dev
```

## Common Scripts

- `pnpm dev:local` - local chain + deploy + web
- `pnpm dev:web` - run frontend
- `pnpm dev:api` - run backend
- `pnpm dev:contracts` - run local hardhat node
- `pnpm build` - build all workspaces
- `pnpm test` - run all tests
- `pnpm lint` - run lint scripts
