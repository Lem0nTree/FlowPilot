# Payment CRON Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Deploy the Contract

```bash
# On Emulator (for testing)
flow emulator &
flow project deploy --network=emulator

# On Testnet (for production)
flow project deploy --network=testnet --update
```

### Step 2: Initialize the Handler

```bash
# On Emulator
flow transactions send \
  cadence/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=emulator \
  --signer=emulator-account

# On Testnet
flow transactions send \
  cadence/transactions/InitPaymentCronTransactionHandler.cdc \
  --network=testnet \
  --signer=flowpilot
```

### Step 3: Schedule Your First Payment

```bash
# Example: Send 1 FLOW daily for 7 days
flow transactions send \
  cadence/transactions/SchedulePaymentCron.cdc \
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

Replace `0xRECIPIENT_ADDRESS` with the actual recipient's address.

## 📋 Parameter Guide

### SchedulePaymentCron.cdc Parameters

| Position | Name | Type | Description | Example |
|----------|------|------|-------------|---------|
| 1 | recipientAddress | Address | Who receives the payments | `0x1234567890abcdef` |
| 2 | paymentAmount | UFix64 | FLOW amount per payment | `1.0` (1 FLOW) |
| 3 | intervalSeconds | UFix64 | Time between payments | `86400.0` (1 day) |
| 4 | priority | UInt8 | Fee priority (0=High, 1=Med, 2=Low) | `1` |
| 5 | executionEffort | UInt64 | Computation limit | `1000` |
| 6 | maxExecutions | UInt64? | Max payments (null=unlimited) | `7` or `null` |
| 7 | baseTimestamp | UFix64? | Start time (null=now) | `null` |

## 📊 Common Use Cases

### Daily Subscription ($10/day for 30 days)
```bash
flow transactions send cadence/transactions/SchedulePaymentCron.cdc \
  0xSUBSCRIBER 10.0 86400.0 1 1000 30 null \
  --network=testnet --signer=flowpilot
```

### Weekly Salary (100 FLOW/week, indefinite)
```bash
flow transactions send cadence/transactions/SchedulePaymentCron.cdc \
  0xEMPLOYEE 100.0 604800.0 1 1000 null null \
  --network=testnet --signer=flowpilot
```

### Hourly Micro-Payment (0.1 FLOW/hour for 24 hours)
```bash
flow transactions send cadence/transactions/SchedulePaymentCron.cdc \
  0xCREATOR 0.1 3600.0 2 1000 24 null \
  --network=testnet --signer=flowpilot
```

### Monthly Rent (500 FLOW on 1st of month)
```bash
# Calculate timestamp for next month's 1st at midnight
# Use: https://www.unixtimestamp.com/
flow transactions send cadence/transactions/SchedulePaymentCron.cdc \
  0xLANDLORD 500.0 2592000.0 0 1000 12 1735689600.0 \
  --network=testnet --signer=flowpilot
```

## 🔍 Monitoring

### Check All Scheduled Payments
```bash
flow scripts execute \
  cadence/scripts/GetPaymentCronStatus.cdc \
  0xYOUR_ADDRESS \
  --network=testnet
```

### Watch Payment Events Live
```bash
flow events get \
  A.YOUR_ADDRESS.PaymentCronTransactionHandler.PaymentExecuted \
  A.YOUR_ADDRESS.PaymentCronTransactionHandler.PaymentCronCompleted \
  --last 200 \
  --network=testnet
```

## 🛑 Canceling Payments

```bash
# Get transaction ID from scheduling output or status script
flow transactions send \
  cadence/transactions/CancelPaymentCron.cdc \
  TRANSACTION_ID \
  --network=testnet \
  --signer=flowpilot
```

You'll receive a ~50% refund of the fees paid.

## 💰 Cost Calculator

### Fee Structure
- **High Priority**: 10x base fee (guaranteed timing)
- **Medium Priority**: 5x base fee (best effort)
- **Low Priority**: 2x base fee (opportunistic)

### Example Cost Breakdown
For 7 daily payments of 1 FLOW with Medium priority:

| Item | Cost |
|------|------|
| Payment × 7 | 7.0 FLOW |
| Scheduling Fee | ~0.001 FLOW |
| Storage Fee | ~0.0001 FLOW |
| **Total** | **~7.0011 FLOW** |

💡 **Tip**: Use Medium priority for most use cases - it's 50% cheaper than High and much more reliable than Low.

## ✅ Pre-Flight Checklist

Before scheduling payments, ensure:

- [ ] Your account has enough FLOW (payments + fees + buffer)
- [ ] Recipient address is correct and active
- [ ] Recipient has FlowToken receiver set up
- [ ] You've tested on emulator first
- [ ] Handler is initialized on your account

## 🔧 Troubleshooting

### Error: "Payment Cron Transaction Handler not initialized"
**Solution**: Run `InitPaymentCronTransactionHandler.cdc` first.

### Error: "Insufficient FLOW balance"
**Solution**: Add more FLOW to cover all payments + fees.

### Error: "Recipient account does not have a valid FlowToken receiver"
**Solution**: Ask recipient to set up their Flow account properly.

### Linter Errors in IDE
**Note**: Import resolution errors in your IDE are expected. The contracts are deployed on testnet and will work correctly when you run transactions.

## 🎯 Best Practices

1. **Always test on emulator first** before going to testnet
2. **Use Medium priority** for most use cases (good balance)
3. **Set maxExecutions** to avoid draining your account
4. **Monitor your balance** regularly
5. **Keep some buffer** FLOW for unexpected fees
6. **Double-check recipient address** before scheduling
7. **Start with small amounts** for testing

## 📚 Full Documentation

See `EXAMPLE-PAYMENT-CRON.md` for complete documentation including:
- Detailed architecture explanation
- Advanced configuration options
- Security considerations
- Event monitoring guides
- Integration examples

## 🆘 Need Help?

- Check the full docs: `EXAMPLE-PAYMENT-CRON.md`
- View examples: `cadence/contracts/CounterCronTransactionHandler.cdc`
- Flow docs: https://developers.flow.com/build/advanced-concepts/scheduled-transactions
- FLIP 330: https://github.com/onflow/flips/blob/main/protocol/20250609-scheduled-callbacks.md

