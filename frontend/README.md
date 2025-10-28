# FlowPilot Frontend

Next.js + Flow React SDK UI for creating and managing on‑chain agents.

## Features

- Agent Cockpit UI with Active/Completed states
- Agent Builder with Automatic Payment (Payment Cron) template
- Execution logs viewer (fees, timestamps, errors, explorer links)
- Dynamic schedule interval (derived from history)
- Flowscan links for contracts and transactions
- Dark/light theme, responsive UI

## Architecture

- Next.js App Router
- FCL + Flow React SDK for wallet and tx signing
- Backend API client as single source of truth (no direct chain indexing)

## Developer Guide

### Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Configuration

Create `.env.local`:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Flow Network Configuration
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_DISCOVERY_WALLET=https://fcl-discovery.onflow.org/testnet/authn

# App Details (optional - defaults provided)
NEXT_PUBLIC_APP_TITLE=FlowPilot Agent Cockpit
NEXT_PUBLIC_APP_ICON=https://flowpilot.app/icon.png
NEXT_PUBLIC_APP_DESCRIPTION=Manage your on-chain automation agents
NEXT_PUBLIC_APP_URL=https://flowpilot.app

# WalletConnect Configuration (optional - default provided)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=20011d073e05a979e592a9faa846bfab
```

**Note**: All configuration values have sensible defaults, so you only need to override the values you want to change.

### Key Files

- `components/agent-cockpit-wrapper.tsx` – Loads agents via backend, maps status/metrics
- `components/agent-row.tsx` – Row UI, logs dialog, schedule interval
- `components/template-config-panel.tsx` – Builder UI with handler readiness
- `lib/api/client.ts` – Backend client and types
- `lib/flow/*` – FCL config, hooks, Cadence tx templates

### Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- Frontend does not index blockchain directly; it relies on the backend’s smart scan and caching.
- For Cadence imports and addresses, see project `flow.json` and backend docs.


