export function handleFCLError(error: any) {
  if (error.message?.includes("Declined: User rejected signature")) {
    return {
      title: "Transaction Cancelled",
      description: "You declined the transaction",
    }
  }
  
  if (error.message?.includes("insufficient balance")) {
    return {
      title: "Insufficient Balance",
      description: "Not enough FLOW to complete transaction",
    }
  }

  if (error.message?.includes("timeout")) {
    return {
      title: "Transaction Timeout",
      description: "Transaction took too long. Please try again",
    }
  }

  return {
    title: "Transaction Failed",
    description: error.message || "Unknown error occurred",
  }
}
