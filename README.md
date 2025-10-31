# 🚀 Flowmatic

**Build, Schedule, and Deploy Flow Agents in a click.**


Flowmatic makes Flow's new Agents and Scheduled Transactions accessible to everyone. We align with Flow's vision of a consumer chain by lowering the technical barrier: before Flowmatic, building with agents and scheduled transactions required deep Cadence and infra expertise. Flowmatic abstracts that complexity with a clean UI, a robust backend, and production‑ready Cadence so anyone can automate on‑chain tasks.

[![Flow](https://img.shields.io/badge/Flow-Blockchain-00EF8B?style=flat&logo=flow&logoColor=white)](https://flow.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

### 🌐 Live Demo

- **TRY ON MAINNET**: [Flowmatic Mainnet](https://flowmatic.up.railway.app/)
- **TRY ON TESTNET**: [Flowmatic Testnet](https://flowpilot.up.railway.app)

---

## 🏆 Hackathon Categories

✅ **Best Killer App - Consumer:** Creating mass adoption on Flow agents for everyone
✅ **Best Use of Flow Forte Actions & Workflows:** Utilizing custom scheduled transactions and actions as agent templates  
✅ **Find Labs API Integration:** Backend fetches, caches, and chains scheduled transactions using the Find Labs API.


## ✨ Key features

### End‑to‑end product

- **No Code Agent Creation**: Visual interface for creating agents without writing Cadence code.
- **Agent Cockpit**: Simple list of Active and Completed agents with color‑coded statuses.
- **Execution History**: Fees, timestamps, errors, and links to explorers.
- **Smart Scan**: Backend discovers agents via FindLabs API (scheduled + completed).
- **Caching**: 5‑minute cache with force refresh; reduces API calls.
- **Transaction Concatenation**: Handlers schedule the next run during execution for true recurring flows.
- **Accurate Metrics**: Total/success/failed runs, last execution, and dynamic schedule interval (e.g., "Every 10 minutes").

## 🤖 Available Agent: Automatic Payment (Payment Cron/Loop)

### What it does

Automated, recurring FLOW token transfers to any recipient on a fixed cadence. Ideal for subscriptions, salaries, tips, rent, or automatic payments.

### Why it matters

- Turns Forte's scheduled transactions into a consumer‑grade experience.
- Handles fees, timing, and safety checks (recipient capability, balance) for you.
- Chains transactions automatically until completion.

### Parameters

```typescript
{
  recipientAddress: Address,    // Who receives payments
  paymentAmount: UFix64,        // FLOW amount per payment
  intervalSeconds: UFix64,      // Time between payments
  priority: UInt8,              // 0=High, 1=Med, 2=Low
  executionEffort: UInt64,      // >= 10
  maxExecutions: UInt64?,       // null = unlimited
  baseTimestamp: UFix64?        // null = now
}
```

### How it works

**Creation**: User connects wallet → configures payment parameters → system auto-initializes handler if needed → submits scheduling transaction → backend discovers agent via FindLabs API → agent appears in dashboard.

**Execution**: Flow blockchain executes at scheduled time → handler performs payment → calculates next execution time → schedules next transaction (if continuing) → FindLabs indexes both completed and new scheduled transactions → backend updates execution history.

**Status**:

| Status | Description | Display |
|--------|-------------|---------|
| **Active** | Agent has scheduled transaction, `isActive: true` | 🟢 Green (animated) |
| **Completed** | All executions finished (reached `maxExecutions`) | ⚪ Gray |
| **Failed** | Execution encountered error | 🔴 Red |
| **Paused** | User temporarily stopped execution | 🔵 Blue |
| **Stopped** | User cancelled scheduled transaction | 🟡 Yellow |

Contract: `PaymentCronTransactionHandler`
- **Mainnet**: `0x651079a7b572ef10`
- **Testnet**: `0x6cc67be8d78c0bd1`

---

## 🛠️ Tech Stack

### Blockchain & Flow
- **Flow React SDK** - Wallet connection and React hooks
- **FCL** - Flow Client Library for transactions
- **Cadence** - Smart contract language with custom handlers
- **Scheduled Transactions** - Native Flow scheduling system
- **FindLabs API** - Transaction discovery and monitoring

### Frontend
- **Next.js 15.5.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Styling framework
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form validation

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **Prisma ORM** - Type-safe database client
- **MongoDB** - Document database
- **Swagger/OpenAPI** - API documentation

> Looking for technical details?
>
> - **Frontend technical documentation**: see [`frontend/README.md`](frontend/README.md).
> - **Backend technical documentation and API details**: see [`backend/README.md`](backend/README.md).
> - **Cadence contracts and Payment Agent docs**: see [`cadence/PaymentAgent/README-PAYMENT-CRON.md`](cadence/PaymentAgent/README-PAYMENT-CRON.md).

---

## 🚀 Quick setup

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **MongoDB** Atlas account or local instance ([MongoDB Atlas](https://mongodb.com/cloud/atlas))
- **Flow CLI** 2.7.1+ ([Install Guide](https://developers.flow.com/tools/flow-cli/install))
- **Flow Wallet** for testnet ([Flow Wallet](https://wallet.flow.com))
- **FindLabs API** credentials (contact FindLabs team)

### Backend

```bash
cd backend
npm install
cp env.example .env
# Edit .env with MongoDB URL and FindLabs credentials
npm run db:generate
npm run db:push
npm run dev  # Starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

### Test the flow

1. **Open Flowmatic**: Navigate to http://localhost:3000
2. **Connect Wallet**: Click "Connect Wallet" and authenticate with Flow testnet wallet
3. **Ensure Testnet FLOW**: Make sure your wallet has testnet FLOW tokens ([Faucet](https://testnet-faucet.onflow.org))
4. **Build Agent**: Click "Build New Agent" button
5. **Configure Payment**:
   - Enter recipient address
   - Set payment amount (e.g., 0.1 FLOW)
   - Choose interval (e.g., Every 10 minutes)
   - Set number of repetitions (e.g., 5 payments)
6. **Create Agent**: Click "Create Agent" and approve blockchain transaction
7. **Wait for Sync**: Agent appears in dashboard (or use refresh button)
8. **Monitor Execution**: Watch status updates and execution history

**Troubleshooting:**
- If agent doesn't appear, click the floating refresh button
- Check backend console for FindLabs API connection logs
- Verify `NODE_ENV=testnet` in backend `.env`
- Ensure wallet has sufficient FLOW for payments + fees

---

## 📚 Documentation

### Technical Deep Dives

- **[Frontend Documentation](frontend/README.md)** - Next.js setup, components, Flow integration
- **[Backend Documentation](backend/README.md)** - API endpoints, database schema, FindLabs integration
- **[Payment Agent Guide](cadence/PaymentAgent/README-PAYMENT-CRON.md)** - Complete Cadence implementation guide

### Official Resources

- **Flow Documentation**: https://developers.flow.com
- **Cadence Language**: https://cadence-lang.org/docs
- **Flow React SDK**: https://react.flow.com
- **Scheduled Transactions**: https://developers.flow.com/build/advanced-concepts/scheduled-transactions
- **FLIP 330 Specification**: https://github.com/onflow/flips/blob/main/protocol/20250609-scheduled-callbacks.md

---


## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Flow Team** - For the incredible blockchain platform and Scheduled Transactions feature
- **FindLabs** - For the transaction discovery API
- **Radix UI** - For the accessible component library
- **Vercel** - For Next.js and deployment platform

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, fork the repository, and create pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for the Flow ecosystem**