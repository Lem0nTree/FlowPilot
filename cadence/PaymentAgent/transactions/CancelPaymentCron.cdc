import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowToken"
import "FungibleToken"

/// Cancel a scheduled payment cron job
/// This returns a partial refund of the fees paid
///
/// Parameters:
/// - transactionId: The ID of the scheduled transaction to cancel
transaction(transactionId: UInt64) {
    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow the manager
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow Manager reference. Make sure you have scheduled transactions.")

        // Get the vault where the refund should be deposited
        let vault = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault")

        // Cancel the transaction and receive refund
        let refund <- manager.cancel(id: transactionId)
        let refundAmount = refund.balance
        vault.deposit(from: <-refund)

        log("✅ Cancelled scheduled payment cron transaction (id: ".concat(transactionId.toString()).concat(")"))
        log("   Refund received: ".concat(refundAmount.toString()).concat(" FLOW"))
    }
}

