# 💸 Payment Agent - Automated Recurring Payments for Flow

A production-ready Cadence smart contract system that enables automated recurring FLOW token transfers using Flow's Scheduled Transactions (FLIP 330). Schedule one-time or recurring payments with configurable intervals, priorities, and execution limits.

## 🌐 Deployment Addresses

| Network | Contract Address | Contract Name |
|---------|-----------------|---------------|
| **Mainnet** | `0x651079a7b572ef10` | `PaymentCronTransactionHandler` |
| **Testnet** | `0x6cc67be8d78c0bd1` | `PaymentCronTransactionHandler` |
| **Emulator** | Deploy locally | `PaymentCronTransactionHandler` |

> **Note**: For emulator testing, deploy the contract locally using `flow project deploy --network=emulator`

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Monitoring](#monitoring)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## 🎯 Overview

The Payment Agent system provides a complete solution for automating FLOW token payments on the Flow blockchain. Built on Flow's Scheduled Transactions infrastructure, it enables:

- **Recurring Payments**: Schedule payments at fixed intervals (hourly, daily, weekly, monthly, etc.)
- **Flexible Configuration**: Set payment amounts, intervals, priorities, and execution limits
- **Automatic Execution**: Payments execute automatically without manual intervention
- **Cancellation Support**: Cancel scheduled payments and receive partial fee refunds
- **Event Monitoring**: Rich event emission for tracking payment execution
- **Production Ready**: Comprehensive error handling, validation, and security measures

### Use Cases

- 💼 **Employee Payroll**: Automated salary distribution
- 📅 **Subscription Services**: Recurring subscription payments
- 🏠 **Rent Payments**: Monthly rent distribution
- 🎨 **Creator Royalties**: Automatic royalty payments to content creators
- 💰 **DAO Distributions**: Scheduled treasury distributions to members
- 📊 **Staking Rewards**: Periodic reward distribution

## ✨ Features

### ✅ Core Features

- [x] **Recurring Payments**: Execute payments at configurable intervals
- [x] **Unlimited or Limited Executions**: Set maximum execution count or allow unlimited
- [x] **Priority Levels**: Choose between High, Medium, or Low priority (affects fees and timing)
- [x] **Cancellation**: Cancel scheduled payments and receive ~50% fee refund
- [x] **Balance Validation**: Pre-flight checks ensure sufficient funds
- [x] **Recipient Validation**: Verify recipient can receive tokens before scheduling
- [x] **Event Emission**: Rich events for payment tracking and monitoring
- [x] **Metadata Views**: Standard Flow metadata view support
- [x] **Comprehensive Error Handling**: Clear error messages and validation

### 🔧 Technical Highlights

- **Flow Scheduled Transactions**: Built on FLIP 330 specification
- **Cadence Best Practices**: Follows Flow development workflow and syntax patterns
- **Resource-Oriented Design**: Proper resource management and capability-based security
- **Type Safety**: Full Cadence type system utilization
- **Pre/Post Conditions**: Contract invariants and validation

## 🏗️ Architecture

### Contract Structure

```
PaymentAgent/
├── contracts/
│   └── PaymentCronTransactionHandler.cdc    # Main contract with Handler resource
├── transactions/
│   ├── InitPaymentCronTransactionHandler.cdc # Initialize handler (one-time setup)
│   ├── SchedulePaymentCron.cdc               # Schedule recurring payments
│   └── CancelPaymentCron.cdc                 # Cancel scheduled payments
└── scripts/
    └── GetPaymentCronStatus.cdc              # Query payment status
```

### Key Components

#### 1. PaymentCronTransactionHandler Contract

The main contract containing:
- **Handler Resource**: Implements `FlowTransactionScheduler.TransactionHandler` interface
- **PaymentCronConfig Struct**: Encapsulates payment configuration and state
- **Events**: `PaymentExecuted` and `PaymentCronCompleted` for monitoring

#### 2. Transactions

- **InitPaymentCronTransactionHandler**: One-time setup to create and store the Handler resource
- **SchedulePaymentCron**: Schedule a new recurring payment job
- **CancelPaymentCron**: Cancel an existing scheduled payment and get refund

#### 3. Scripts

- **GetPaymentCronStatus**: Query all scheduled payments for an account

### Data Flow

```
1. User sends SchedulePaymentCron transaction
   ↓
2. Transaction validates balance and recipient
   ↓
3. Handler resource schedules payment with FlowTransactionScheduler
   ↓
4. Scheduled transaction executes at specified intervals
   ↓
5. Handler.executeTransaction() is called by scheduler
   ↓
6. Payment is sent to recipient
   ↓
7. Next execution is scheduled (if not completed)
   ↓
8. PaymentExecuted event is emitted
```

## 🚀 Quick Start

### Prerequisites

- Flow CLI 2.7.1+ (required for scheduled transactions support)
- Flow account with FLOW tokens
- Emulator or Testnet access

### 3-Step Setup

#### Step 1: Deploy Contract

```bash
# Start emulator (if testing locally)
flow emulator

# Deploy to emulator
flow project deploy --network=emulator

# Or deploy to testnet
flow project deploy --network=testnet
```

#### Step 2: Initialize Handler

```bash
# Emulator
flow transactions send \
  cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=emulator \
  --signer=emulator-account

# Testnet
flow transactions send \
  cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=testnet \
  --signer=your-account
```

#### Step 3: Schedule Your First Payment

```bash
# Send 1 FLOW daily for 7 days
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xRECIPIENT_ADDRESS \
  1.0 \
  86400.0 \
  1 \
  1000 \
  7 \
  null \
  --network=emulator \
  --signer=emulator-account
```

## 📦 Installation

### 1. Project Setup

Ensure your `flow.json` includes the PaymentAgent contract:

```json
{
  "contracts": {
    "PaymentCronTransactionHandler": {
      "source": "cadence/PaymentAgent/contracts/PaymentCronTransactionHandler.cdc"
    }
  }
}
```

### 2. Dependencies

The contract requires these Flow standard contracts (already in `flow.json`):
- `FlowTransactionScheduler`
- `FlowTransactionSchedulerUtils`
- `FlowToken`
- `FungibleToken`

### 3. Network Configuration

Verify network aliases in `flow.json`:
- **Emulator**: `127.0.0.1:3569`
- **Testnet**: `access.devnet.nodes.onflow.org:9000`
- **Mainnet**: `access.mainnet.nodes.onflow.org:9000`

## 📖 Usage

### Initialization (One-Time Setup)

Before scheduling payments, initialize the handler in your account:

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=testnet \
  --signer=your-account
```

This transaction:
- Creates a `Handler` resource
- Stores it in `/storage/PaymentCronTransactionHandler`
- Publishes a capability at `/public/PaymentCronTransactionHandler`

### Scheduling Payments

#### Basic Syntax

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  <recipientAddress> \
  <paymentAmount> \
  <intervalSeconds> \
  <priority> \
  <executionEffort> \
  <maxExecutions> \
  <baseTimestamp> \
  --network=<network> \
  --signer=<signer>
```

#### Parameters

| Position | Name | Type | Description | Example |
|----------|------|------|-------------|---------|
| 1 | `recipientAddress` | `Address` | Recipient's Flow address | `0x1234567890abcdef` |
| 2 | `paymentAmount` | `UFix64` | FLOW amount per payment | `1.0` (1 FLOW) |
| 3 | `intervalSeconds` | `UFix64` | Time between payments (seconds) | `86400.0` (1 day) |
| 4 | `priority` | `UInt8` | Execution priority (0=High, 1=Med, 2=Low) | `1` |
| 5 | `executionEffort` | `UInt64` | Computation limit (min 10) | `1000` |
| 6 | `maxExecutions` | `UInt64?` | Max payments (`null` = unlimited) | `7` or `null` |
| 7 | `baseTimestamp` | `UFix64?` | Start time (`null` = immediate) | `null` |

### Common Time Intervals

| Interval | Seconds | Example |
|----------|---------|---------|
| 1 minute | 60.0 | Testing |
| 1 hour | 3600.0 | Hourly payments |
| 1 day | 86400.0 | Daily subscriptions |
| 1 week | 604800.0 | Weekly salaries |
| 1 month (30 days) | 2592000.0 | Monthly rent |

### Priority Levels

| Priority | Value | Multiplier | Use Case |
|----------|-------|-----------|----------|
| High | `0` | 10x | Time-critical payments |
| Medium | `1` | 5x | Regular payments (recommended) |
| Low | `2` | 2x | Micro-payments, non-urgent |

## 💡 Examples

### Daily Subscription ($10/day for 30 days)

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xSUBSCRIBER_ADDRESS \
  10.0 \
  86400.0 \
  1 \
  1000 \
  30 \
  null \
  --network=testnet \
  --signer=your-account
```

### Weekly Salary (100 FLOW/week, unlimited)

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xEMPLOYEE_ADDRESS \
  100.0 \
  604800.0 \
  1 \
  1000 \
  null \
  null \
  --network=testnet \
  --signer=your-account
```

### Hourly Micro-Payments (0.1 FLOW/hour for 24 hours)

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xCREATOR_ADDRESS \
  0.1 \
  3600.0 \
  2 \
  1000 \
  24 \
  null \
  --network=testnet \
  --signer=your-account
```

### Monthly Rent (500 FLOW on 1st of month)

```bash
# Calculate timestamp for next month's 1st at midnight
# Use: https://www.unixtimestamp.com/

flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xLANDLORD_ADDRESS \
  500.0 \
  2592000.0 \
  0 \
  1000 \
  12 \
  1735689600.0 \
  --network=testnet \
  --signer=your-account
```

### Immediate Single Payment

```bash
# Single payment with 0 interval and 1 max execution
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xRECIPIENT_ADDRESS \
  5.0 \
  0.0 \
  1 \
  1000 \
  1 \
  null \
  --network=testnet \
  --signer=your-account
```

## 🔍 Monitoring

### Check Payment Status

Query all scheduled payments for your account:

```bash
flow scripts execute \
  cadence/PaymentAgent/scripts/GetPaymentCronStatus.cdc \
  0xYOUR_ADDRESS \
  --network=testnet
```

The script returns:
- Transaction IDs
- Recipient addresses
- Payment amounts
- Execution counts
- Next execution times
- Completion status

### Watch Payment Events

Monitor payment executions in real-time:

```bash
# View PaymentExecuted events
flow events get \
  A.YOUR_ADDRESS.PaymentCronTransactionHandler.PaymentExecuted \
  --last 200 \
  --network=testnet

# View completion events
flow events get \
  A.YOUR_ADDRESS.PaymentCronTransactionHandler.PaymentCronCompleted \
  --last 200 \
  --network=testnet
```

### Event Structure

#### PaymentExecuted Event

```cadence
access(all) event PaymentExecuted(
    transactionId: UInt64,
    executionNumber: UInt64,
    recipient: Address,
    amount: UFix64,
    nextExecutionTime: UFix64?
)
```

#### PaymentCronCompleted Event

```cadence
access(all) event PaymentCronCompleted(executionCount: UInt64)
```

## 🛑 Canceling Payments

Cancel a scheduled payment and receive a partial fee refund:

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/CancelPaymentCron.cdc \
  <TRANSACTION_ID> \
  --network=testnet \
  --signer=your-account
```

**Note**: You'll receive approximately 50% refund of the fees paid when canceling.

## 🧪 Testing

### Automated Testing

For automated emulator testing, use the test script (if available):

```bash
# On Git Bash/WSL (Windows)
./cadence/PaymentAgent/TEST-PAYMENT-EMULATOR.sh
```

### Manual Testing Workflow

#### 1. Start Emulator

```bash
flow emulator
```

#### 2. Deploy Contracts

```bash
flow project deploy --network=emulator
```

#### 3. Initialize Handler

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=emulator \
  --signer=emulator-account
```

#### 4. Schedule Test Payment

```bash
# Small test payment: 0.001 FLOW every 60 seconds, 3 times
flow transactions send \
  cadence/PaymentAgent/transactions/SchedulePaymentCron.cdc \
  0xf8d6e0586b0a20c7 \
  0.001 \
  60.0 \
  1 \
  1000 \
  3 \
  null \
  --network=emulator \
  --signer=emulator-account
```

#### 5. Check Status

```bash
flow scripts execute \
  cadence/PaymentAgent/scripts/GetPaymentCronStatus.cdc \
  0xf8d6e0586b0a20c7 \
  --network=emulator
```

#### 6. Monitor Events

```bash
flow events get \
  A.f8d6e0586b0a20c7.PaymentCronTransactionHandler.PaymentExecuted \
  --last 50 \
  --network=emulator
```

### Testing Checklist

- [ ] Deploy to emulator successfully
- [ ] Initialize handler without errors
- [ ] Schedule payment with valid parameters
- [ ] Verify payment executes at scheduled time
- [ ] Check events are emitted correctly
- [ ] Query status returns correct information
- [ ] Cancel payment and verify refund
- [ ] Test with insufficient balance (should fail gracefully)
- [ ] Test with invalid recipient (should fail gracefully)

## 🚢 Deployment

### Deployment Workflow

#### 1. Emulator Testing

Always test thoroughly on emulator first:

```bash
flow emulator
flow project deploy --network=emulator
# Run all tests...
```

#### 2. Testnet Deployment

After successful emulator testing:

```bash
# Deploy to testnet
flow project deploy --network=testnet --update

# Initialize handler on testnet
flow transactions send \
  cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=testnet \
  --signer=testnet-account

# Test with small amounts
# Monitor closely for first few executions
```

#### 3. Mainnet Deployment

Before deploying to mainnet:

- [ ] Complete security audit
- [ ] Review all contract code
- [ ] Test extensively on testnet
- [ ] Verify all dependencies are correct
- [ ] Ensure sufficient FLOW for fees

```bash
flow project deploy --network=mainnet --update
```

### Pre-Deployment Checklist

- [ ] All contracts compile without errors
- [ ] Tested extensively on emulator
- [ ] Tested on testnet with real transactions
- [ ] All edge cases tested
- [ ] Documentation reviewed
- [ ] Security considerations addressed
- [ ] Flow.json configured correctly
- [ ] Account has sufficient FLOW

## 🔒 Security

### Security Features

- **Capability-Based Access**: Uses Flow capabilities for secure access control
- **Balance Validation**: Pre-flight checks prevent insufficient balance errors
- **Recipient Validation**: Verifies recipient can receive tokens before scheduling
- **Pre-Conditions**: Contract-level validation of all parameters
- **Resource Management**: Proper resource lifecycle management
- **Error Handling**: Comprehensive error messages prevent silent failures

### Best Practices

1. **Always test on emulator first** - Never deploy directly to mainnet
2. **Start with small amounts** - Verify behavior before scaling up
3. **Monitor your balance** - Ensure sufficient FLOW for all scheduled payments
4. **Verify recipient addresses** - Double-check addresses before scheduling
5. **Use Medium priority** - Best balance of cost and reliability
6. **Set max executions** - Prevent unintended account drainage
7. **Keep transaction receipts** - Store transaction IDs for cancellation
8. **Monitor events** - Watch for unexpected behavior

### Known Limitations

- **Fixed Intervals**: Cannot change interval after scheduling (must cancel and reschedule)
- **Fixed Amount**: Payment amount cannot be changed after scheduling
- **Single Recipient**: Each job pays only one recipient
- **Network Dependent**: Execution timing depends on network conditions
- **No Partial Refunds**: Cancellation refunds full fee minus overhead, not pro-rated

## ⚠️ Troubleshooting

### Common Issues

#### Error: "Payment Cron Transaction Handler not initialized"

**Solution**: Run `InitPaymentCronTransactionHandler.cdc` first. This is a one-time setup per account.

```bash
flow transactions send \
  cadence/PaymentAgent/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=testnet \
  --signer=your-account
```

#### Error: "Insufficient FLOW balance"

**Solution**: Ensure your account has enough FLOW to cover:
- All payment amounts
- Transaction fees
- Scheduling fees
- Recommended 10% buffer

#### Error: "Recipient account does not have a valid FlowToken receiver"

**Solution**: The recipient must have:
- Flow account set up
- FlowToken vault configured
- Public receiver capability at `/public/flowTokenReceiver`

Ask the recipient to set up their Flow account properly before scheduling payments.

#### Linter Errors in IDE

You may see import errors like:
```
cannot find type in this scope: FlowTransactionScheduler
```

**This is normal!** The contracts are deployed on testnet/mainnet (see `flow.json` dependencies). The code will work correctly when you run transactions. The IDE linter cannot resolve contracts deployed on-chain.

#### Payment Not Executing

**Check**:
1. Verify payment is scheduled: `GetPaymentCronStatus.cdc`
2. Check account balance is sufficient
3. Verify recipient can receive tokens
4. Check network status
5. Review priority level (Low priority may have delays)
6. Check events for error messages

#### Cancellation Not Working

**Check**:
1. Verify transaction ID is correct
2. Ensure payment hasn't already completed
3. Check you're the owner of the scheduled payment
4. Verify sufficient balance for cancellation fee

### Getting Help

1. **Check Documentation**: Review all documentation files in `cadence/PaymentAgent/`
2. **Test on Emulator**: Reproduce issue on emulator for easier debugging
3. **Review Events**: Check event logs for error details
4. **Flow Discord**: Join https://discord.gg/flow for community support
5. **Flow Docs**: See https://developers.flow.com/build/advanced-concepts/scheduled-transactions

## 💰 Fees and Costs

### Fee Structure

Scheduled transactions have different fees based on priority:

| Priority | Fee Multiplier | Estimated Cost |
|----------|---------------|----------------|
| High (0) | 10x base fee | Highest cost |
| Medium (1) | 5x base fee | Recommended |
| Low (2) | 2x base fee | Lowest cost |

### Cost Example

For 7 daily payments of 1 FLOW with Medium priority:

| Item | Cost |
|------|------|
| Payments (7 × 1.0 FLOW) | 7.0 FLOW |
| Scheduling Fee | ~0.001 FLOW |
| Storage Fee | ~0.0001 FLOW |
| **Total** | **~7.0011 FLOW** |

### Fee Refunds

When canceling a scheduled payment:
- Approximately 50% of fees are refunded
- Payment amounts are not refunded (only fees)
- Storage costs are not refunded

## 📚 API Reference

### Contract: PaymentCronTransactionHandler

#### Events

```cadence
access(all) event PaymentExecuted(
    transactionId: UInt64,
    executionNumber: UInt64,
    recipient: Address,
    amount: UFix64,
    nextExecutionTime: UFix64?
)

access(all) event PaymentCronCompleted(executionCount: UInt64)
```

#### Handler Resource

```cadence
access(all) resource Handler: FlowTransactionScheduler.TransactionHandler {
    access(FlowTransactionScheduler.Execute) fun executeTransaction(id: UInt64, data: AnyStruct?)
    access(all) fun executePayment(paymentConfig: PaymentCronConfig)
    access(all) view fun getViews(): [Type]
    access(all) fun resolveView(_ view: Type): AnyStruct?
}
```

#### PaymentCronConfig Struct

```cadence
access(all) struct PaymentCronConfig {
    access(all) let intervalSeconds: UFix64
    access(all) let baseTimestamp: UFix64
    access(all) let maxExecutions: UInt64?
    access(all) let executionCount: UInt64
    access(all) let recipientAddress: Address
    access(all) let paymentAmount: UFix64
    access(all) let schedulerManagerCap: Capability<...>
    access(all) let feeProviderCap: Capability<...>
    access(all) let priority: FlowTransactionScheduler.Priority
    access(all) let executionEffort: UInt64
}
```

## 📚 Resources

### Documentation Files

- **README-PAYMENT-CRON.md** - Alternative overview (duplicate content)
- **PAYMENT-CRON-QUICKSTART.md** - 5-minute quick start guide
- **PAYMENT-CRON-IMPLEMENTATION-NOTES.md** - Technical deep dive
- **PAYMENT-CRON-OVERVIEW.txt** - ASCII overview document

### External Resources

- **Scheduled Transactions Docs**: https://developers.flow.com/build/advanced-concepts/scheduled-transactions
- **FLIP 330 Specification**: https://github.com/onflow/flips/blob/main/protocol/20250609-scheduled-callbacks.md
- **Flow Core Contracts**: https://github.com/onflow/flow-core-contracts
- **Flow CLI Documentation**: https://developers.flow.com/tools/flow-cli
- **Cadence Language Reference**: https://developers.flow.com/cadence/language
- **Flow Discord**: https://discord.gg/flow

### Related Flow Standards

- **FungibleToken**: https://developers.flow.com/cadence/language/fungible-tokens
- **MetadataViews**: https://developers.flow.com/cadence/language/metadata
- **Capabilities**: https://developers.flow.com/cadence/language/accounts#account-capabilities

## 🎓 Key Implementation Details

### Critical Fix Applied

The Payment Agent implementation includes required metadata view functions that are essential for compilation:

```cadence
access(all) view fun getViews(): [Type] {
    return [Type<StoragePath>(), Type<PublicPath>()]
}

access(all) fun resolveView(_ view: Type): AnyStruct? {
    switch view {
        case Type<StoragePath>():
            return /storage/PaymentCronTransactionHandler
        case Type<PublicPath>():
            return /public/PaymentCronTransactionHandler
        default:
            return nil
    }
}
```

These functions are required by the `FlowTransactionScheduler.TransactionHandler` interface and enable:
- Metadata discovery by tools and explorers
- Standardized querying of handler information
- Integration with Flow ecosystem tools

See `PAYMENT-CRON-IMPLEMENTATION-NOTES.md` for complete technical details.

## 🤝 Contributing

This is a production-ready implementation. If you encounter issues or have suggestions:

1. Test thoroughly on emulator first
2. Document the issue clearly
3. Check existing documentation
4. Join Flow Discord for community support

## 📄 License

See the main project LICENSE file for license information.

---

## 🎉 Ready to Use!

The Payment Agent is production-ready and follows Flow best practices:

- ✅ Follows Cadence syntax patterns and best practices
- ✅ Uses Flow development workflow standards
- ✅ Implements Scheduled Transactions (FLIP 330) correctly
- ✅ Includes comprehensive documentation
- ✅ Provides complete testing examples
- ✅ Security-focused design

**Start with the [Quick Start](#quick-start) section and you'll be scheduling payments in minutes!**

---

**Note**: Always test thoroughly on emulator and testnet before deploying to mainnet with significant value.

