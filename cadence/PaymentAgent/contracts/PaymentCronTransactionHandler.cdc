import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowToken"
import "FungibleToken"

/// CRON Payment Handler for recurring FLOW token transfers
/// Schedules automatic payments at specified intervals to a recipient address
access(all) contract PaymentCronTransactionHandler {

    /// Event emitted when a payment is successfully executed
    access(all) event PaymentExecuted(
        transactionId: UInt64,
        executionNumber: UInt64,
        recipient: Address,
        amount: UFix64,
        nextExecutionTime: UFix64?
    )

    /// Event emitted when a payment cron job completes all executions
    access(all) event PaymentCronCompleted(executionCount: UInt64)

    /// Struct to hold payment cron configuration data
    access(all) struct PaymentCronConfig {
        access(all) let intervalSeconds: UFix64
        access(all) let baseTimestamp: UFix64
        access(all) let maxExecutions: UInt64?
        access(all) let executionCount: UInt64
        access(all) let recipientAddress: Address
        access(all) let paymentAmount: UFix64
        access(all) let schedulerManagerCap: Capability<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>
        access(all) let feeProviderCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>
        access(all) let priority: FlowTransactionScheduler.Priority
        access(all) let executionEffort: UInt64

        init(
            intervalSeconds: UFix64,
            baseTimestamp: UFix64,
            maxExecutions: UInt64?,
            executionCount: UInt64,
            recipientAddress: Address,
            paymentAmount: UFix64,
            schedulerManagerCap: Capability<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>,
            feeProviderCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>,
            priority: FlowTransactionScheduler.Priority,
            executionEffort: UInt64
        ) {
            pre {
                paymentAmount > 0.0: "Payment amount must be greater than zero"
                intervalSeconds > 0.0: "Interval must be greater than zero"
                executionEffort >= 10: "Execution effort must be at least 10"
            }
            self.intervalSeconds = intervalSeconds
            self.baseTimestamp = baseTimestamp
            self.maxExecutions = maxExecutions
            self.executionCount = executionCount
            self.recipientAddress = recipientAddress
            self.paymentAmount = paymentAmount
            self.schedulerManagerCap = schedulerManagerCap
            self.feeProviderCap = feeProviderCap
            self.priority = priority
            self.executionEffort = executionEffort
        }

        access(all) fun withIncrementedCount(): PaymentCronConfig {
            return PaymentCronConfig(
                intervalSeconds: self.intervalSeconds,
                baseTimestamp: self.baseTimestamp,
                maxExecutions: self.maxExecutions,
                executionCount: self.executionCount + 1,
                recipientAddress: self.recipientAddress,
                paymentAmount: self.paymentAmount,
                schedulerManagerCap: self.schedulerManagerCap,
                feeProviderCap: self.feeProviderCap,
                priority: self.priority,
                executionEffort: self.executionEffort
            )
        }

        access(all) fun shouldContinue(): Bool {
            if let max = self.maxExecutions {
                return self.executionCount < max
            }
            return true
        }

        access(all) fun getNextExecutionTime(): UFix64 {
            let currentTime = getCurrentBlock().timestamp
            
            // If baseTimestamp is in the future, use it as the first execution time
            if self.baseTimestamp > currentTime {
                return self.baseTimestamp
            }
            
            // Calculate next execution time based on elapsed intervals
            let elapsed = currentTime - self.baseTimestamp
            let intervals = UFix64(UInt64(elapsed / self.intervalSeconds)) + 1.0
            return self.baseTimestamp + (intervals * self.intervalSeconds)
        }
    }

    /// Handler resource that implements the Scheduled Transaction interface
    access(all) resource Handler: FlowTransactionScheduler.TransactionHandler {
        access(FlowTransactionScheduler.Execute) fun executeTransaction(id: UInt64, data: AnyStruct?) {
            // Extract payment configuration from transaction data
            let paymentConfig = data as! PaymentCronConfig? ?? panic("PaymentCronConfig data is required")
            
            // Perform the payment
            self.executePayment(transactionId: id, paymentConfig: paymentConfig)
            
            let updatedConfig = paymentConfig.withIncrementedCount()

            // Check if we should continue scheduling
            if !updatedConfig.shouldContinue() {
                emit PaymentCronCompleted(executionCount: updatedConfig.executionCount)
                log("Payment cron job completed after ".concat(updatedConfig.executionCount.toString()).concat(" executions"))
                return
            }

            // Calculate the next precise execution time
            let nextExecutionTime = paymentConfig.getNextExecutionTime()

            let estimate = FlowTransactionScheduler.estimate(
                data: updatedConfig,
                timestamp: nextExecutionTime,
                priority: paymentConfig.priority,
                executionEffort: paymentConfig.executionEffort
            )

            assert(
                estimate.timestamp != nil || paymentConfig.priority == FlowTransactionScheduler.Priority.Low,
                message: estimate.error ?? "estimation failed"
            )

            // Borrow fee provider and withdraw fees
            let feeVault = paymentConfig.feeProviderCap.borrow()
                ?? panic("Cannot borrow fee provider capability")
            let fees <- feeVault.withdraw(amount: estimate.flowFee ?? 0.0)

            // Schedule next transaction through the manager
            let schedulerManager = paymentConfig.schedulerManagerCap.borrow()
                ?? panic("Cannot borrow scheduler manager capability")
            
            // Use scheduleByHandler since this handler has already been used
            let transactionId = schedulerManager.scheduleByHandler(
                handlerTypeIdentifier: self.getType().identifier,
                handlerUUID: self.uuid,
                data: updatedConfig,
                timestamp: nextExecutionTime,
                priority: paymentConfig.priority,
                executionEffort: paymentConfig.executionEffort,
                fees: <-fees as! @FlowToken.Vault
            )

            emit PaymentExecuted(
                transactionId: id,
                executionNumber: updatedConfig.executionCount,
                recipient: paymentConfig.recipientAddress,
                amount: paymentConfig.paymentAmount,
                nextExecutionTime: nextExecutionTime
            )

            log("Next payment cron transaction scheduled (id: ".concat(transactionId.toString()).concat(") at ").concat(nextExecutionTime.toString()).concat(" (execution #").concat(updatedConfig.executionCount.toString()).concat(")"))
        }

        /// Execute the actual payment
        access(all) fun executePayment(transactionId: UInt64, paymentConfig: PaymentCronConfig) {
            // Borrow the fee provider vault which has withdraw capability
            let feeVault = paymentConfig.feeProviderCap.borrow()
                ?? panic("Cannot borrow fee provider capability")
            
            // Withdraw the payment amount
            let tokens <- feeVault.withdraw(amount: paymentConfig.paymentAmount)
            
            // Get the recipient account
            let recipient = getAccount(paymentConfig.recipientAddress)
            
            // Get the recipient's receiver capability
            let recipientReceiverCap = recipient.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            
            if recipientReceiverCap.check() {
                let recipientReceiver = recipientReceiverCap.borrow()
                    ?? panic("Cannot borrow recipient receiver")
                recipientReceiver.deposit(from: <-tokens)
                log("Payment executed: ".concat(paymentConfig.paymentAmount.toString()).concat(" FLOW sent to ").concat(paymentConfig.recipientAddress.toString()).concat(" (execution #").concat((paymentConfig.executionCount + 1).toString()).concat(")"))
            } else {
                // If recipient doesn't have a receiver capability, panic and return tokens
                destroy tokens
                panic("Recipient account ".concat(paymentConfig.recipientAddress.toString()).concat(" does not have a valid FlowToken receiver capability. Recipient must set up their account to receive tokens."))
            }
        }

        /// Returns the list of metadata views this handler supports
        access(all) view fun getViews(): [Type] {
            return [Type<StoragePath>(), Type<PublicPath>()]
        }

        /// Resolves a specific metadata view
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
    }

    /// Factory for the handler resource
    access(all) fun createHandler(): @Handler {
        return <- create Handler()
    }

    /// Helper function to create a payment cron configuration
    access(all) fun createPaymentCronConfig(
        intervalSeconds: UFix64,
        baseTimestamp: UFix64?,
        maxExecutions: UInt64?,
        recipientAddress: Address,
        paymentAmount: UFix64,
        schedulerManagerCap: Capability<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>,
        feeProviderCap: Capability<auth(FungibleToken.Withdraw) &FlowToken.Vault>,
        priority: FlowTransactionScheduler.Priority,
        executionEffort: UInt64
    ): PaymentCronConfig {
        let base = baseTimestamp ?? getCurrentBlock().timestamp
        return PaymentCronConfig(
            intervalSeconds: intervalSeconds,
            baseTimestamp: base,
            maxExecutions: maxExecutions,
            executionCount: 0,
            recipientAddress: recipientAddress,
            paymentAmount: paymentAmount,
            schedulerManagerCap: schedulerManagerCap,
            feeProviderCap: feeProviderCap,
            priority: priority,
            executionEffort: executionEffort
        )
    }
}

