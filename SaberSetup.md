Terminal 1: Start Hardhat (KEEP THIS RUNNING)
cd /Users/mac/codes/darkpool-markets/packages/contracts
pnpm node
Never close this terminal - if you restart it, all deployed contracts are gone.
---
Terminal 2: One-Time Setup
cd /Users/mac/codes/darkpool-markets/packages/contracts
pnpm setup:local
This deploys everything + creates 4 test markets + updates .env.local
---
Terminal 3: Run Web App
cd /Users/mac/codes/darkpool-markets
pnpm dev:web
---
To Create MORE Markets Later
Just run (Terminal 2):
cd /Users/mac/codes/darkpool-markets/packages/contracts
# Default question
pnpm create-market:local
# Custom question
MARKET_QUESTION="Will AI replace developers by 2027?" MARKET_DURATION_SECONDS=2592000 pnpm hardhat run scripts/create-market.ts --network localhost
The new markets show up instantly at http://localhost:3000 - no redeployment needed.
---
Summary
Terminal	Command
1	pnpm node
2	pnpm setup:local (once)
3	pnpm dev:web
Key: Hardhat node = in-memory blockchain. Kill it = contracts gone = run setup:local again.