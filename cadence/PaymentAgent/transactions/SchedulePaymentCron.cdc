import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowToken"
import "FungibleToken"
import "PaymentCronTransactionHandler"

/// Schedule a recurring payment using cron-like scheduled transactions
/// 
/// Parameters:
/// - recipientAddress: The address to receive payments
/// - paymentAmount: Amount of FLOW to send per payment
/// - intervalSeconds: Time between payments in seconds (e.g., 86400.0 for daily)
/// - priority: 0=High, 1=Medium, 2=Low
/// - executionEffort: Computational resources allocated (minimum 10, recommended 1000)
/// - maxExecutions: Maximum number of payments (nil for unlimited)
/// - baseTimestamp: When to start payments (nil for now)
transaction(
    recipientAddress: Address,
    paymentAmount: UFix64,
    intervalSeconds: UFix64,
    priority: UInt8,
    executionEffort: UInt64,
    maxExecutions: UInt64?,
    baseTimestamp: UFix64?
) {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, SaveValue, GetStorageCapabilityController, PublishCapability) &Account) {
        pre {
            paymentAmount > 0.0: "Payment amount must be greater than zero"
            intervalSeconds > 0.0: "Interval must be greater than zero"
            executionEffort >= 10: "Execution effort must be at least 10"
        }

        // Convert priority number to enum
        let pr = priority == 0
            ? FlowTransactionScheduler.Priority.High
            : priority == 1
                ? FlowTransactionScheduler.Priority.Medium
                : FlowTransactionScheduler.Priority.Low

        // Get the entitled handler capability
        // Need to check both controllers because the order of controllers is not guaranteed
        var handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>? = nil
        let controllers = signer.capabilities.storage.getControllers(forPath: /storage/PaymentCronTransactionHandler)
        
        if controllers.length == 0 {
            panic("Payment Cron Transaction Handler not initialized. Please run InitPaymentCronTransactionHandler transaction first.")
        }

        if let cap = controllers[0].capability as? Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}> {
            handlerCap = cap
        } else if controllers.length > 1 {
            handlerCap = controllers[1].capability as! Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>
        }

        // Initialize scheduler manager if not present
        if signer.storage.borrow<&AnyResource>(from: FlowTransactionSchedulerUtils.managerStoragePath) == nil {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            // Create a public capability for the Manager
            let managerCapPublic = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerCapPublic, at: FlowTransactionSchedulerUtils.managerPublicPath)
        }

        // Borrow the manager
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow Manager reference")

        // Create manager capability
        let managerCap = signer.capabilities.storage
            .issue<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )

        // Create fee provider capability
        let feeProviderCap = signer.capabilities.storage
            .issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(/storage/flowTokenVault)

        // Create payment cron configuration
        let cronConfig = PaymentCronTransactionHandler.createPaymentCronConfig(
            intervalSeconds: intervalSeconds,
            baseTimestamp: baseTimestamp,
            maxExecutions: maxExecutions,
            recipientAddress: recipientAddress,
            paymentAmount: paymentAmount,
            schedulerManagerCap: managerCap,
            feeProviderCap: feeProviderCap,
            priority: pr,
            executionEffort: executionEffort
        )

        // Determine the first execution time
        let firstExecutionTime = cronConfig.getNextExecutionTime()

        // Estimate fees
        let est = FlowTransactionScheduler.estimate(
            data: cronConfig,
            timestamp: firstExecutionTime,
            priority: pr,
            executionEffort: executionEffort
        )

        assert(
            est.timestamp != nil || pr == FlowTransactionScheduler.Priority.Low,
            message: est.error ?? "estimation failed"
        )

        // Withdraw fees
        let vaultRef = signer.storage
            .borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("missing FlowToken vault")
        let fees <- vaultRef.withdraw(amount: est.flowFee ?? 0.0) as! @FlowToken.Vault

        // Verify sender has enough FLOW for payment + fees
        let totalRequired = paymentAmount + (est.flowFee ?? 0.0)
        assert(
            vaultRef.balance >= totalRequired,
            message: "Insufficient FLOW balance. Required: ".concat(totalRequired.toString()).concat(", Available: ").concat(vaultRef.balance.toString())
        )

        // Schedule through the manager
        let transactionId = manager.schedule(
            handlerCap: handlerCap ?? panic("Could not get handler capability"),
            data: cronConfig,
            timestamp: firstExecutionTime,
            priority: pr,
            executionEffort: executionEffort,
            fees: <-fees
        )

        log("✅ Scheduled payment cron job (id: ".concat(transactionId.toString()).concat(")"))
        log("   Recipient: ".concat(recipientAddress.toString()))
        log("   Amount: ".concat(paymentAmount.toString()).concat(" FLOW per payment"))
        log("   Interval: ".concat(intervalSeconds.toString()).concat(" seconds"))
        log("   First execution: ".concat(firstExecutionTime.toString()))
        
        if let max = maxExecutions {
            log("   Max executions: ".concat(max.toString()))
            let totalAmount = paymentAmount * UFix64(max)
            log("   Total amount to be paid: ".concat(totalAmount.toString()).concat(" FLOW"))
        } else {
            log("   Max executions: Unlimited (runs until cancelled)")
        }
    }
}

