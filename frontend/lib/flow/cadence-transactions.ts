/**
 * Cadence transaction to initialize the PaymentCronTransactionHandler
 * This must be run once before scheduling any payment cron jobs
 */
export const INIT_PAYMENT_HANDLER_TX = `
import "FlowTransactionScheduler"
import "PaymentCronTransactionHandler"

transaction {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, SaveValue, PublishCapability) &Account) {
        if signer.storage.borrow<&PaymentCronTransactionHandler.Handler>(from: /storage/PaymentCronTransactionHandler) != nil {
            log("Payment Cron Transaction Handler already initialized")
            return
        }

        let handler <- PaymentCronTransactionHandler.createHandler()
        signer.storage.save(<-handler, to: /storage/PaymentCronTransactionHandler)

        signer.capabilities.storage.issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(
            /storage/PaymentCronTransactionHandler
        )

        let publicHandlerCap = signer.capabilities.storage.issue<&{FlowTransactionScheduler.TransactionHandler}>(
            /storage/PaymentCronTransactionHandler
        )
        signer.capabilities.publish(publicHandlerCap, at: /public/PaymentCronTransactionHandler)

        log("Payment Cron Transaction Handler initialized successfully")
    }
}
`

/**
 * Cadence transaction to schedule a recurring payment cron job
 * 
 * @param recipientAddress - The address to receive payments
 * @param paymentAmount - Amount of FLOW to send per payment
 * @param intervalSeconds - Time between payments in seconds
 * @param priority - 0=High, 1=Medium, 2=Low
 * @param executionEffort - Computational resources allocated (minimum 10)
 * @param maxExecutions - Maximum number of payments (nil for unlimited)
 * @param baseTimestamp - When to start payments (nil for now)
 */
export const SCHEDULE_PAYMENT_CRON_TX = `
import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowToken"
import "FungibleToken"
import "PaymentCronTransactionHandler"

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

        let pr = priority == 0
            ? FlowTransactionScheduler.Priority.High
            : priority == 1
                ? FlowTransactionScheduler.Priority.Medium
                : FlowTransactionScheduler.Priority.Low

        var handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>? = nil
        let controllers = signer.capabilities.storage.getControllers(forPath: /storage/PaymentCronTransactionHandler)
        
        if controllers.length == 0 {
            panic("Payment Cron Transaction Handler not initialized. Please run InitPaymentCronTransactionHandler transaction first.")
        }

        // Iterate through all controllers to find the one with Execute authorization
        var i = 0
        while i < controllers.length {
            if let cap = controllers[i].capability as? Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}> {
                handlerCap = cap
                break
            }
            i = i + 1
        }
        
        if handlerCap == nil {
            panic("Could not find authorized handler capability. The handler may not be properly initialized.")
        }

        if signer.storage.borrow<&AnyResource>(from: FlowTransactionSchedulerUtils.managerStoragePath) == nil {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            let managerCapPublic = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerCapPublic, at: FlowTransactionSchedulerUtils.managerPublicPath)
        }

        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow Manager reference")

        let managerCap = signer.capabilities.storage
            .issue<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )

        let feeProviderCap = signer.capabilities.storage
            .issue<auth(FungibleToken.Withdraw) &FlowToken.Vault>(/storage/flowTokenVault)

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

        let firstExecutionTime = cronConfig.getNextExecutionTime()

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

        let vaultRef = signer.storage
            .borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("missing FlowToken vault")
        let fees <- vaultRef.withdraw(amount: est.flowFee ?? 0.0) as! @FlowToken.Vault

        let totalRequired = paymentAmount + (est.flowFee ?? 0.0)
        assert(
            vaultRef.balance >= totalRequired,
            message: "Insufficient FLOW balance. Required: ".concat(totalRequired.toString()).concat(", Available: ").concat(vaultRef.balance.toString())
        )

        let transactionId = manager.schedule(
            handlerCap: handlerCap!,
            data: cronConfig,
            timestamp: firstExecutionTime,
            priority: pr,
            executionEffort: executionEffort,
            fees: <-fees
        )

        log("✅ Scheduled payment cron job (id: ".concat(transactionId.toString()).concat(")"))
    }
}
`

