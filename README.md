# 🚀 Flowmatic - Flow Blockchain Agent Platform

A decentralized agent platform built on Flow blockchain, featuring scheduled transactions, automated recurring payments, and a consumer-grade UI for creating and managing on-chain automation agents.

**Live Demo:**  
- **Mainnet**: [flowmatic.up.railway.app](https://flowmatic.up.railway.app/)  
- **Testnet**: [flowpilot.up.railway.app](https://flowpilot.up.railway.app)

**Built for:** Flow Forte Hacks Hackathon 2025  
**Status:** ✅ Production Ready (95% complete)

---

## 🏆 Hackathon Bounties & Features

### 🎯 Primary Bounty: Best Killer App - Consumer

**Consumer-oriented agent platform** bringing Flow's Scheduled Transactions to everyone with:

- **No-Code Agent Creation** - Visual interface for building agents without Cadence knowledge
- **Agent Cockpit** - Simple dashboard with Active/Completed agents and execution history
- **Payment Agent Template** - Automated recurring FLOW transfers (subscriptions, salaries, rent)
- **Real-time Sync** - Backend discovers agents via Find Labs API with smart caching
- **Transaction Chaining** - Handlers automatically schedule next execution for true recurring flows

**Status:** ✅ **READY** - Full end-to-end implementation working on testnet and mainnet

### 🔌 Find Labs Integration

**Flow Blockchain Transaction Discovery API:**

- **AgentScannerService** - Direct integration with Find Labs API for scheduled transaction discovery
- **Execution Chain Building** - Groups transactions by scheduled_transaction → completed_transaction linkage
- **State Reconciliation** - Compares API data with local database for accurate agent tracking
- **Smart Caching** - 5-minute cache interval with force refresh option
- **Pagination Support** - Handles large transaction sets (up to 1000 records)

**Implementation:**
```typescript
// Backend services:
backend/src/services/agentScannerService.js       // 405 lines - Find Labs client & chain building
backend/src/routes/sync.js                         // 636 lines - Smart scan with state reconciliation
backend/src/routes/agents.js                       // Agent CRUD operations
```

**API Endpoints Used:**
- `GET /flow/v1/scheduled-transaction` - Query scheduled transactions by owner
- `GET /flow/v1/scheduled-transaction/:id` - Get transaction details
- Uses Basic Auth: `FIND_LABS_USERNAME` / `FIND_LABS_PASSWORD`
- Supports both testnet and mainnet via `FLOW_NETWORK` env var

**Status:** ✅ Fully integrated and working

### 🤖 Flow Forte Actions & Workflows

**Scheduled Transactions (FLIP 330) Implementation:**

- **PaymentCronTransactionHandler** - Production-ready Cadence contract implementing `FlowTransactionScheduler.TransactionHandler`
- **Transaction Chaining** - Handlers schedule next execution during current execution
- **Execution History Tracking** - Complete history with fees, timestamps, errors, block heights
- **Cancellation Support** - Cancel scheduled transactions with fee refunds
- **Priority Levels** - High/Medium/Low priority execution (affects fees)

**Implementation:**
```cadence
cadence/PaymentAgent/contracts/PaymentCronTransactionHandler.cdc  // Main handler contract
cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc  // Setup transaction
cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc         // Schedule payments
cadence/PaymentAgent/transactions/CancelPaymentCron.cdc           // Cancel payments
cadence/PaymentAgent/scripts/GetPaymentCronStatus.cdc             // Query status
```

**Deployed Contracts:**
- **Mainnet**: `PaymentCronTransactionHandler` at `0x651079a7b572ef10`
- **Testnet**: `PaymentCronTransactionHandler` at `0x6cc67be8d78c0bd1`

**Status:** ✅ Fully deployed and working on both networks

---

## 🔗 Data Sources & APIs

### Blockchain Data

#### 1. **Find Labs API** ✅

- **Purpose:** Scheduled transaction discovery and monitoring
- **Status:** Fully integrated
- **Endpoint:** Environment-specific (testnet/mainnet)
- **Authentication:** Basic Auth (username/password)
- **Data:** Scheduled transactions, execution history, transaction chains, fees
- **Features:**
  - Pagination support (100 records per page, up to 1000 total)
  - Filters by owner address
  - Tracks both scheduled and completed transactions
  - Transaction chain linking (scheduled_transaction → completed_transaction)

**Backend Integration:**
```javascript
backend/src/services/agentScannerService.js  // 405 lines
  - scanForAgents(userAddress)               // Fetch all transactions
  - buildExecutionChains(transactions)       // Group into chains
  - buildAgentFromChain(chain, isActive)     // Build agent data
```

#### 2. **Flow Blockchain (Direct FCL)** ✅

- **Purpose:** Execute Cadence scripts and transactions
- **Integration:** `@onflow/fcl` library + Flow React SDK
- **Network:** Testnet (`https://rest-testnet.onflow.org`) or Mainnet
- **Usage:**
  - Execute Cadence scripts (read data)
  - User wallet transaction signing
  - Account balance queries
  - Contract interaction

**Frontend Integration:**
```typescript
frontend/lib/flow/                                  // FCL integration
  - auth.ts                                         // Wallet connection
  - cadence-transactions.ts                         // Transaction templates
  - scheduled-transactions.ts                       // Scheduled tx hooks
  - payment-agent-hooks.ts                          // Payment agent hooks
```

---

## ⚡ Flow Blockchain Features Used

### 1. Scheduled Transactions (FLIP 330) ✅

**Status:** FULLY IMPLEMENTED AND WORKING

**Payment Agent Handler:**
- ✅ `PaymentCronTransactionHandler.cdc` - Implements `FlowTransactionScheduler.TransactionHandler`
- ✅ Transaction chaining - Each execution schedules the next
- ✅ Fee estimation and payment
- ✅ Priority levels (High/Medium/Low)
- ✅ Execution effort management
- ✅ Cancellation with refunds

**Contracts:**
```cadence
cadence/PaymentAgent/contracts/PaymentCronTransactionHandler.cdc  // 198 lines
```

**Transactions:**
- ✅ `InitPaymentCronTransactionHandler.cdc` - One-time handler setup
- ✅ `SchedulePaymentCron.cdc` - Schedule recurring payments
- ✅ `CancelPaymentCron.cdc` - Cancel scheduled payments

**Scripts:**
- ✅ `GetPaymentCronStatus.cdc` - Query payment status

**Deployed:** Mainnet + Testnet

### 2. Flow Client Library (FCL) ✅

**Full wallet integration for user-signed transactions:**

```typescript
// frontend/lib/flow/auth.ts
import * as fcl from "@onflow/fcl";

fcl.config({
  'flow.network': 'testnet',
  'accessNode.api': 'https://rest-testnet.onflow.org',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/testnet/authn',
});

// User signs transactions with their wallet
const txId = await fcl.mutate({
  cadence: transactionCode,
  args: [...],
  limit: 9999,
});
```

**Features:**
- ✅ Wallet connection (Dapper + others via Flow React SDK)
- ✅ Transaction signing (user-controlled)
- ✅ Account balance queries
- ✅ Cadence script execution
- ✅ React hooks for state management

**Integration:**
```typescript
frontend/lib/flow/
  - auth.ts                    // FCL configuration
  - cadence-transactions.ts    // Transaction templates
  - scheduled-transactions.ts  // Scheduled tx React hooks
  - payment-agent-hooks.ts     // Payment agent hooks
  - error-handler.ts           // Error handling
```

### 3. Cadence Smart Contracts ✅

**Payment Agent Contract:**
- `PaymentCronTransactionHandler.cdc` - Main handler contract (198 lines)
  - Implements `FlowTransactionScheduler.TransactionHandler`
  - Handles recurring FLOW token transfers
  - Manages payment configuration and state
  - Emits `PaymentExecuted` and `PaymentCronCompleted` events

**Deployed on:**
- **Mainnet**: `0x651079a7b572ef10`
- **Testnet**: `0x6cc67be8d78c0bd1`

**Total Cadence Code:** ~500 lines across contracts, transactions, and scripts

### 4. Flow Transaction Scheduler ✅

**Native Flow scheduling system integration:**

- ✅ Handler capability issuance (`auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}`)
- ✅ Fee estimation before scheduling
- ✅ Transaction scheduling with priority, effort, and timestamp
- ✅ Cancellation support
- ✅ Execution tracking and history

**Dependencies:**
- `FlowTransactionScheduler` - Main scheduler contract
- `FlowTransactionSchedulerUtils` - Utility functions
- `FlowToken` - For fee payments
- `FungibleToken` - Token standard

**Status:** ✅ Fully integrated and working

---

## 🏗️ Technical Architecture

### Smart Contracts (Cadence)

**Payment Agent Contract - FULLY WORKING ✅**

- `PaymentCronTransactionHandler.cdc` - Main handler contract (198 lines)
  - Implements `FlowTransactionScheduler.TransactionHandler`
  - Handles recurring FLOW token transfers
  - Payment configuration management
  - Event emission for monitoring
  - Balance and recipient validation
  - Transaction chaining for recurring payments

**Deployed:** `0x651079a7b572ef10` (mainnet), `0x6cc67be8d78c0bd1` (testnet)

**Transactions (3/3 - ALL CREATED):**
```
✅ InitPaymentCronTransactionHandler.cdc - Initialize handler (one-time setup)
✅ SchedulePaymentCron.cdc - Schedule recurring payments
✅ CancelPaymentCron.cdc - Cancel scheduled payments
```

**Scripts (1/1 - ALL CREATED):**
```
✅ GetPaymentCronStatus.cdc - Query payment status
```

**Total Deployed:** 1 contract, ~500 lines working code on mainnet + testnet

### Backend (Node.js + Express)

**API Services:**
- `AgentScannerService` - Find Labs API integration and execution chain building (405 lines)
- `sync.js` - Smart scan endpoint with state reconciliation (636 lines)
- `agents.js` - Agent CRUD operations
- `users.js` - User management

**Data Integrations:**
- Find Labs API (scheduled transaction discovery)
- MongoDB (agent state and user data)
- Prisma ORM (type-safe database client)

**Database:**
- MongoDB with Prisma ORM
- Models: User, Agent, ScanHistory, AgentExecution
- Indexes for performance optimization

**Key Features:**
- State reconciliation (compares API data with local DB)
- Smart caching (5-minute cache with force refresh)
- Execution chain building (groups transactions by linkage)
- Pagination support (handles large datasets)

**Backend Structure:**
```
backend/
├── src/
│   ├── services/
│   │   └── agentScannerService.js     // 405 lines - Find Labs client
│   ├── routes/
│   │   ├── sync.js                    // 636 lines - Smart scan
│   │   ├── agents.js                  // Agent CRUD
│   │   └── users.js                   // User management
│   ├── config/
│   │   └── prisma.js                  // Database client
│   └── middleware/
│       ├── validation.js              // Request validation
│       └── errorHandler.js            // Error handling
└── prisma/
    └── schema.prisma                  // Database schema
```

### Frontend (Next.js 15 + TypeScript)

**Framework:**
- Next.js 15.5.4 App Router
- TypeScript strict mode
- Tailwind CSS 4
- Flow React SDK for wallet integration
- Radix UI components

**Key Features:**
- Agent Cockpit UI (Active/Completed agents with color-coded statuses)
- Agent Builder (Visual interface for creating agents)
- Execution History Viewer (Fees, timestamps, errors, explorer links)
- Real-time sync with backend
- Dark/light theme support
- Responsive design

**Frontend Structure:**
```
frontend/
├── components/
│   ├── agent-cockpit-wrapper.tsx      // 902 lines - Main dashboard
│   ├── agent-row.tsx                  // Agent row UI
│   ├── agent-template-sidebar.tsx     // Template selection
│   ├── template-config-panel.tsx      // Agent configuration
│   ├── onboarding-*.tsx               // Onboarding flow
│   └── ui/                            // Radix UI components
├── lib/
│   ├── flow/
│   │   ├── auth.ts                    // FCL configuration
│   │   ├── cadence-transactions.ts    // Transaction templates
│   │   ├── scheduled-transactions.ts  // Scheduled tx hooks
│   │   └── payment-agent-hooks.ts     // Payment agent hooks
│   └── api/
│       ├── client.ts                  // Backend API client
│       └── types.ts                   // TypeScript types
└── app/
    └── page.tsx                       // Main page
```

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
MongoDB (Atlas or local instance)
Flow CLI 2.7.1+ (for contract deployment)
Flow Wallet (for testnet: https://wallet.flow.com)
Find Labs API credentials (contact Find Labs team)
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd FlowPilot

# Backend setup
cd backend
npm install
cp env.example .env
# Edit .env with MongoDB URL and Find Labs credentials:
# DATABASE_URL=mongodb://...
# FIND_LABS_USERNAME=...
# FIND_LABS_PASSWORD=...
# FIND_LABS_API_BASE_TESTNET=...
# FIND_LABS_API_BASE_MAINNET=...
# FLOW_NETWORK=testnet
npm run db:generate
npm run db:push
npm run dev  # Starts on http://localhost:5000

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

**Access:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Swagger Docs: `http://localhost:5000/api-docs`

---

## 📊 What's Implemented (Updated 2025)

### ✅ Fully Working (95%+)

**Payment Agent:**
- ✅ Contract deployed on mainnet + testnet
- ✅ 3/3 transactions created and tested
- ✅ 1/1 scripts created and tested
- ✅ Transaction chaining working
- ✅ Cancellation with refunds
- ✅ Execution history tracking
- ✅ FCL wallet transaction signing
- ✅ Backend API complete

**Agent Discovery:**
- ✅ Find Labs API integration
- ✅ Execution chain building
- ✅ State reconciliation
- ✅ Smart caching (5-minute interval)
- ✅ Pagination support
- ✅ Active/Completed agent separation

**Frontend UI:**
- ✅ Agent Cockpit dashboard
- ✅ Agent Builder interface
- ✅ Execution history viewer
- ✅ Real-time sync with backend
- ✅ Dark/light theme
- ✅ Responsive design
- ✅ Wallet connection (Flow React SDK)

**Backend API:**
- ✅ Smart scan endpoint (`POST /api/sync`)
- ✅ Agent CRUD operations
- ✅ User management
- ✅ Scan history tracking
- ✅ State reconciliation logic
- ✅ Error handling and validation

**Database:**
- ✅ MongoDB with Prisma ORM
- ✅ User, Agent, ScanHistory models
- ✅ Indexes for performance
- ✅ Relationship management

### ⚠️ Known Issues (Non-Blocking)

**Agent Discovery:**
- ⚠️ Large transaction sets (>1000) may require multiple scan requests
- ⚠️ Cache may show stale data for up to 5 minutes (use force refresh)

**Frontend:**
- ⚠️ Some UI polish needed for edge cases
- ⚠️ Agent deletion confirmation could be improved

**Backend:**
- ⚠️ Error messages could be more user-friendly
- ⚠️ Rate limiting not implemented (basic only)

### ❌ Not Implemented (Out of Scope)

- Multiple agent templates (only Payment Agent currently)
- Advanced agent analytics
- Agent templates marketplace
- Multi-signature agent management
- Agent sharing/collaboration features

---

## 🎯 Bounty Eligibility Summary

| Bounty | Status | Completion | Notes |
|--------|--------|------------|-------|
| **Best Killer App - Consumer** | ✅ READY | ~100% | Full end-to-end platform working |
| **Best Use of Flow Forte Workflows** | ✅ READY | ~100% | Scheduled transactions fully implemented |
| **Find Labs API Integration** | ✅ READY | ~100% | Fully integrated and working |

**READY TO SUBMIT:** All eligible bounties! 🎉

**Breakdown:**
- ✅ Best Killer App - Consumer: Full implementation
- ✅ Flow Forte Workflows: Scheduled transactions + chaining
- ✅ Find Labs Integration: Complete API integration

---

## 📈 Current Status

**Overall Completion:** **100%** of core features ✅

**What Works Right Now:**
1. ✅ Payment Agent contract deployed (mainnet + testnet)
2. ✅ All transactions and scripts working
3. ✅ Agent discovery via Find Labs API
4. ✅ Execution chain building and tracking
5. ✅ State reconciliation and caching
6. ✅ Frontend dashboard with real-time sync
7. ✅ Agent builder UI
8. ✅ Execution history viewer
9. ✅ Wallet integration (Flow React SDK)
10. ✅ Backend API complete

**Production Readiness:** ✅ **95%**
- Code: ✅ 100%
- TypeScript: ✅ 0 errors
- Backend build: ✅ SUCCESS
- Testnet: ✅ Contracts deployed
- Mainnet: ✅ Contracts deployed
- E2E testing: ✅ Working

---

## 🔒 Security

- ✅ User-signed transactions (FCL - no backend signing)
- ✅ Environment variables for secrets
- ✅ Input validation (Express middleware)
- ✅ MongoDB injection prevention (Prisma)
- ⚠️ Rate limiting (basic only)
- ⚠️ CORS (configured for production)

---

## 📝 Development

### Project Structure

```
FlowPilot/
├── backend/                          # Node.js + Express backend
│   ├── src/
│   │   ├── services/                 # Business logic
│   │   │   └── agentScannerService.js
│   │   ├── routes/                   # API endpoints
│   │   │   ├── sync.js
│   │   │   ├── agents.js
│   │   │   └── users.js
│   │   ├── config/                   # Configuration
│   │   └── middleware/               # Express middleware
│   └── prisma/
│       └── schema.prisma             # Database schema
├── frontend/                         # Next.js frontend
│   ├── components/                   # React components
│   │   ├── agent-cockpit-wrapper.tsx
│   │   ├── agent-row.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── flow/                     # Flow integration
│   │   └── api/                      # Backend client
│   └── app/
│       └── page.tsx
├── cadence/                          # Cadence contracts
│   └── PaymentAgent/
│       ├── contracts/
│       ├── transactions/
│       └── scripts/
└── flow.json                         # Flow configuration
```

### API Endpoints

**Sync:**
- `POST /api/sync` - Smart scan (discover agents via Find Labs API)
- `GET /api/sync/status/:address` - Get scan status and history

**Agents:**
- `GET /api/agents/:userId` - Get all agents for user
- `GET /api/agents/agent/:agentId` - Get agent details
- `PUT /api/agents/agent/:agentId` - Update agent metadata
- `DELETE /api/agents/agent/:agentId` - Deactivate agent
- `GET /api/agents/stats/:userId` - Get agent statistics

**Users:**
- `GET /api/users/:address` - Get user profile
- `PUT /api/users/:address` - Update user profile
- `GET /api/users/:address/scan-history` - Get scan history
- `GET /api/users/:address/dashboard` - Get dashboard data

**Swagger Documentation:** Available at `/api-docs` when backend is running

---

## 📚 Documentation

### Technical Deep Dives

- **[Frontend Documentation](frontend/README.md)** - Next.js setup, components, Flow integration
- **[Backend Documentation](backend/README.md)** - API endpoints, database schema, Find Labs integration
- **[Payment Agent Guide](cadence/PaymentAgent/README.md)** - Complete Cadence implementation guide

### Official Resources

- **Flow Documentation**: https://developers.flow.com
- **Cadence Language**: https://cadence-lang.org/docs
- **Flow React SDK**: https://react.flow.com
- **Scheduled Transactions**: https://developers.flow.com/build/advanced-concepts/scheduled-transactions
- **FLIP 330 Specification**: https://github.com/onflow/flips/blob/main/protocol/20250609-scheduled-callbacks.md
- **Find Labs API**: Contact Find Labs team for API access

---

## 🤝 Hackathon Links

- **Flow Forte Hacks**: [dorahacks.io/hackathon/forte-hacks](https://dorahacks.io/hackathon/forte-hacks)
- **Find Labs Docs**: [docs.find.xyz](https://docs.find.xyz)
- **Flow Docs**: [developers.flow.com](https://developers.flow.com)
- **FCL Documentation**: [developers.flow.com/tools/fcl-js](https://developers.flow.com/tools/fcl-js)

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Flow Team** - For the incredible blockchain platform and Scheduled Transactions feature
- **Find Labs** - For the transaction discovery API
- **Radix UI** - For the accessible component library
- **Vercel** - For Next.js and deployment platform

---

**Built with ❤️ for Flow Forte Hacks 2025**
