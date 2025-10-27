# Backend API Configuration Fix

## Problem

The backend is returning 0 agents even though FindLabs API has data. This is because the backend is not properly configured to connect to the FindLabs **testnet** API.

## Root Cause

Your `backend/.env` file is missing the correct environment variables for the FindLabs API endpoints. The `agentScannerService.js` expects:
- `FIND_LABS_API_BASE_TESTNET` 
- `FIND_LABS_API_BASE_MAINNET`

But your `.env` file might only have `FIND_LABS_API_URL`.

## Quick Fix

### 1. Update Your `.env` File

Open `backend/.env` and update/add these variables:

```bash
# Server Configuration
PORT=5000
NODE_ENV=testnet  # ⚠️ IMPORTANT: Set to "testnet" for testnet API

# Database
DATABASE_URL="mongodb+srv://your-connection-string"

# Find Labs API Configuration
FIND_LABS_API_BASE_TESTNET="https://api.test-find.xyz"
FIND_LABS_API_BASE_MAINNET="https://api.find.xyz"
FIND_LABS_USERNAME="your_actual_username"
FIND_LABS_PASSWORD="your_actual_password"

# Rest of your config...
```

**Key Changes:**
1. Change `NODE_ENV` to `testnet` (not `development`)
2. Add `FIND_LABS_API_BASE_TESTNET="https://api.test-find.xyz"`
3. Add `FIND_LABS_API_BASE_MAINNET="https://api.find.xyz"`
4. Ensure username and password are correct

### 2. Restart Backend

```bash
# Stop the backend (Ctrl+C)
# Start it again
cd backend
npm run dev
```

You should see in the console:
```
🚀 AgentScannerService initialized for TESTNET
--> Using API endpoint: https://api.test-find.xyz
```

### 3. Test Again

```bash
curl -X POST http://localhost:5000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"address": "0x6cc67be8d78c0bd1", "forceRefresh": true}'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Smart Scan completed with state reconciliation",
  "data": {
    "agents": [
      {
        "id": "...",
        "scheduledTxId": "33472",
        "handlerUuid": "199011604789475",
        "totalRuns": 11,
        "successfulRuns": 10,
        "failedRuns": 1,
        "status": "scheduled"
      }
    ],
    "scanSummary": {
      "totalFound": 1,
      "processed": 1
    }
  }
}
```

## Verification Checklist

### Check Backend Console

When the backend starts, look for:
```
🚀 AgentScannerService initialized for TESTNET
--> Using API endpoint: https://api.test-find.xyz
```

If you see:
```
🚀 AgentScannerService initialized for MAINNET
--> Using API endpoint: https://api.find.xyz
```

Then `NODE_ENV` is not set to `testnet` correctly.

### Check API Call Logs

When you run sync, you should see in backend console:
```
🔄 Starting Smart Scan for address: 0x6cc67be8d78c0bd1
👤 User processed with ID: ...
🔍 Scanning for all transactions for address: 0x6cc67be8d78c0bd1
✅ Found 17 total transactions for 0x6cc67be8d78c0bd1
✅ Identified 1 active agents with execution history
📝 Created 1 new agents
✅ State reconciliation complete: Created 1, Updated 0, Deactivated 0
```

## Troubleshooting

### Issue: Still returning 0 agents

**Possible causes:**

1. **Environment variables not loaded**
   ```bash
   # Check if .env is in the correct location
   ls backend/.env
   
   # Ensure backend is reading .env
   # Add console.log in agentScannerService.js temporarily
   ```

2. **API credentials wrong**
   ```bash
   # Test API directly
   curl -u "username:password" \
     "https://api.test-find.xyz/flow/v1/scheduled-transaction?owner=0x6cc67be8d78c0bd1&limit=1"
   ```

3. **Cache not cleared**
   ```bash
   # Delete scan history from MongoDB
   # Or wait 5 minutes for cache to expire
   # Or use forceRefresh: true in the API call
   ```

### Issue: "Find Labs API is not responding"

**Check:**
1. API credentials are correct
2. Network can reach `api.test-find.xyz`
3. Username/password are not expired

**Test:**
```bash
curl -u "your_username:your_password" \
  "https://api.test-find.xyz/flow/v1/scheduled-transaction?limit=1"
```

Should return JSON, not 401 error.

### Issue: "buildExecutionChains is not a function"

**Fix:**
1. Make sure you've applied all the code changes
2. Restart the backend (changes weren't picked up)

## Expected Behavior After Fix

### Agent 33472 (Currently Scheduled)
- Should appear as active agent
- `totalRuns`: 11 (based on the execution history)
- `successfulRuns`: 10
- `failedRuns`: 1 (ID 33192 failed)
- `status`: "scheduled"
- `lastExecutionAt`: 2025-10-27T17:28:10Z

### MongoDB Should Contain

```javascript
{
  _id: ObjectId("..."),
  scheduledTxId: "33472",
  handlerUuid: "199011604789475",
  status: "scheduled",
  totalRuns: 11,
  successfulRuns: 10,
  failedRuns: 1,
  executionHistory: [
    { scheduledTxId: "33461", status: "executed", ... },
    { scheduledTxId: "33450", status: "executed", ... },
    { scheduledTxId: "33439", status: "executed", ... },
    // ... 8 more executions
  ]
}
```

## Quick Debug Script

Create `backend/test-api.js`:

```javascript
require('dotenv').config();
const axios = require('axios');

const apiUrl = process.env.NODE_ENV === 'testnet' 
  ? process.env.FIND_LABS_API_BASE_TESTNET 
  : process.env.FIND_LABS_API_BASE_MAINNET;

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', apiUrl);
console.log('Username:', process.env.FIND_LABS_USERNAME);

const client = axios.create({
  baseURL: apiUrl,
  auth: {
    username: process.env.FIND_LABS_USERNAME,
    password: process.env.FIND_LABS_PASSWORD
  }
});

async function test() {
  try {
    const response = await client.get('/flow/v1/scheduled-transaction', {
      params: {
        owner: '0x6cc67be8d78c0bd1',
        limit: 5
      }
    });
    console.log('✅ API connection successful!');
    console.log(`Found ${response.data.data.length} transactions`);
    console.log('First transaction:', response.data.data[0]?.id);
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

test();
```

Run it:
```bash
cd backend
node test-api.js
```

Should output:
```
Environment: testnet
API URL: https://api.test-find.xyz
Username: your_username
✅ API connection successful!
Found 5 transactions
First transaction: 33472
```

