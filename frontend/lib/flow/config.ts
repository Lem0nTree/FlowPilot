import * as fcl from "@onflow/fcl"

export const configureFlowClient = () => {
  fcl.config({
    "app.detail.title": "FlowPilot Agent Cockpit",
    "app.detail.icon": "https://flowpilot.app/icon.png",
    "app.detail.description": "Manage your on-chain automation agents",
    "accessNode.api": "https://rest-testnet.onflow.org",
    "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
    "flow.network": "testnet",
    // Contract addresses will be added as development progresses
  })
}
