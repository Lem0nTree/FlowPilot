// Note: These are placeholder transactions
// Actual Cadence code will depend on your deployed contracts

export const PAUSE_AGENT_TRANSACTION = `
import "FlowTransactionScheduler"

transaction(scheduledTxId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Get the scheduled transaction and cancel it
    let scheduler = FlowTransactionScheduler.getScheduler()
    scheduler.cancel(id: scheduledTxId)
  }
}
`

export const RESUME_AGENT_TRANSACTION = `
import "FlowTransactionScheduler"

transaction(scheduledTxId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Reschedule the transaction
    // Implementation depends on your agent contract design
  }
}
`

export const DELETE_AGENT_TRANSACTION = `
import "FlowTransactionScheduler"

transaction(scheduledTxId: String) {
  prepare(signer: auth(Storage) &Account) {
    // Cancel and remove the scheduled transaction
    let scheduler = FlowTransactionScheduler.getScheduler()
    scheduler.cancel(id: scheduledTxId)
    // Additional cleanup if needed
  }
}
`
