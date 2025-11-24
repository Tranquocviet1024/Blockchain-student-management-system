# Student Record Management (Blockchain)

End-to-end DApp for managing student records that mirror to an on-chain `StudentRegistry` contract. The repo is organized as a monorepo:

- `blockchain/` - Hardhat workspace that owns the Solidity contract and deployment scripts.
- `backend/` - Express + TypeScript API that issues MetaMask nonces, verifies signatures, and syncs records to the registry.
- `frontend/` - React + Vite client with MetaMask login, CRUD tooling, dashboard, and blockchain timelines.

## Prerequisites

- Node.js 18 or newer and npm 9+
- MetaMask (or another wallet) configured to talk to your local Hardhat network
- Git and a shell (examples assume PowerShell or bash)

## Install dependencies

```bash
cd blockchain && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

## Configure environment variables

### 1. Deploy the contract
1. Start a local Hardhat node:
	```bash
	cd blockchain
	npx hardhat node
	```
2. In a new terminal, deploy the registry to the local network:
	```bash
	cd blockchain
	npx hardhat run scripts/deploy.ts --network localhost
	```
3. Copy the deployed `StudentRegistry` contract address from the script output.

### 2. Backend `.env`
Create `backend/.env` and provide the contract address plus signer credentials (use one of the private keys printed by `npx hardhat node`).

```ini
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-me
LOCAL_RPC_URL=http://127.0.0.1:8545
REGISTRY_ADDRESS=0xYourRegistryAddress
DEPLOYER_KEY=0xyourhardhatprivatekey
MUTATION_FEE_ETH=0.01
# Optional: override fee in wei instead of ETH by providing MUTATION_FEE_WEI
FEE_TREASURY_ADDRESS=0xYourTreasuryAddress
```

### 3. Frontend `.env`

```ini
VITE_API_URL=http://localhost:4000
VITE_MUTATION_FEE_ETH=0.01
VITE_MUTATION_FEE_RECIPIENT=0xYourTreasuryAddress
```

> The backend stores student data in-memory for demo purposes. Restarting the API or Hardhat node clears state. When running against a persistent chain, swap in a real database for `student.service.ts`.

## Run the stack

1. **Hardhat node**
	```bash
	cd blockchain
	npx hardhat node
	```
2. **Backend API**
	```bash
	cd backend
	npm run dev
	```
3. **Frontend**
	```bash
	cd frontend
	npm run dev -- --host
	```
4. Connect MetaMask to `http://127.0.0.1:8545`, import one of the funded Hardhat accounts via its private key, and browse to `http://localhost:5173`.

## Using the application

- **Authentication** - From the login page, click "Sign in with MetaMask". The backend issues a nonce, MetaMask signs it, and the API returns a JWT stored in `localStorage` for one hour.
- **Dashboard** - Overview cards show total/active students plus the latest on-chain block. The recent activity panels display the five newest students and contract events.
- **Students** - Full CRUD UI with modal forms. Creating or updating a record writes to the in-memory store and calls `StudentRegistry.upsertRecord` with hashed payload data. Deactivate toggles the student to inactive and triggers `StudentRegistry.deactivate`.
- **Timeline** - Live event feed sourced from `/blockchain/events`. Click "View Tx" on any item to inspect transaction status, sender, recipient, gas used, and confirmations.
- **Transactions** - Detailed ledger sourced from `/blockchain/history` showing every StudentRegistry mutation fee transaction (status, block, gas, hash) so you can audit balance changes.

## Useful commands

| Action | Command |
| --- | --- |
| Lint backend | `cd backend && npm run lint` |
| Type-check backend | `cd backend && npm run typecheck` |
| Run backend tests | `cd backend && npm test` |
| Compile contracts | `cd blockchain && npx hardhat compile` |
| Run frontend in dev | `cd frontend && npm run dev -- --host` |

## Troubleshooting

- **401 errors** - Tokens expire after one hour. Re-authenticate via MetaMask to obtain a new JWT.
- **Missing events** - Ensure `REGISTRY_ADDRESS` matches the contract you deployed and the backend has access to the signer specified by `DEPLOYER_KEY`.
- **MetaMask chain mismatch** - Switch MetaMask to the Hardhat localhost network and reset the account if nonces get out of sync.
- **Hardhat restarts** - Restarting the node invalidates contract addresses. Redeploy and update `REGISTRY_ADDRESS` when this occurs.
