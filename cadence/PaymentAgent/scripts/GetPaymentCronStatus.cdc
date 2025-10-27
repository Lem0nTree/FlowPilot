import "FlowTransactionSchedulerUtils"
import "FlowTransactionScheduler"

/// Get the status of all scheduled payment cron jobs for an account
///
/// Returns an array of transaction information including:
/// - Transaction ID
/// - Status
/// - Scheduled timestamp
/// - Priority
/// - Any associated data
access(all) fun main(account: Address): [{String: AnyStruct}] {
    let publicAccount = getAccount(account)
    
    // Borrow the public manager capability
    let managerCap = publicAccount.capabilities.get<&{FlowTransactionSchedulerUtils.Manager}>(
        FlowTransactionSchedulerUtils.managerPublicPath
    )
    
    if !managerCap.check() {
        return []
    }
    
    let manager = managerCap.borrow()
        ?? panic("Could not borrow Manager reference")
    
    let transactionIds = manager.getTransactionIds()
    let results: [{String: AnyStruct}] = []
    
    for id in transactionIds {
        if let txInfo = manager.getTransactionInfo(id: id) {
            let status = FlowTransactionScheduler.getStatus(id: id)
            
            results.append({
                "id": id,
                "status": status.rawValue,
                "timestamp": txInfo.timestamp,
                "priority": txInfo.priority.rawValue,
                "executionEffort": txInfo.executionEffort,
                "handlerType": txInfo.handlerTypeIdentifier
            })
        }
    }
    
    return results
}

