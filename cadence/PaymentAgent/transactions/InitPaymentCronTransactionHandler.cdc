import "FlowTransactionScheduler"
import "PaymentCronTransactionHandler"

/// Initialize the Payment Cron Transaction Handler
/// This transaction must be run before scheduling any payment cron jobs
transaction {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, SaveValue, PublishCapability) &Account) {
        // Check if handler already exists
        if signer.storage.borrow<&PaymentCronTransactionHandler.Handler>(from: /storage/PaymentCronTransactionHandler) != nil {
            log("Payment Cron Transaction Handler already initialized")
            return
        }

        // Create and save the handler
        let handler <- PaymentCronTransactionHandler.createHandler()
        signer.storage.save(<-handler, to: /storage/PaymentCronTransactionHandler)

        // Create an entitled capability for the scheduler
        signer.capabilities.storage.issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(
            /storage/PaymentCronTransactionHandler
        )

        // Create a public capability for anyone to view
        let publicHandlerCap = signer.capabilities.storage.issue<&{FlowTransactionScheduler.TransactionHandler}>(
            /storage/PaymentCronTransactionHandler
        )
        signer.capabilities.publish(publicHandlerCap, at: /public/PaymentCronTransactionHandler)

        log("Payment Cron Transaction Handler initialized successfully")
    }
}

