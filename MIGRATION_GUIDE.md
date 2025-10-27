# Database Migration Guide

## Critical: Run This First!

Before testing the new implementation, you **MUST** run the database migration to add the new fields to your MongoDB schema.

## Step-by-Step Migration

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

This updates the Prisma client with the new schema definitions.

### 3. Run Database Migration
```bash
npx prisma migrate dev --name add-execution-tracking
```

**What this does:**
- Adds new fields to Agent model:
  - `handlerUuid`
  - `totalRuns`
  - `successfulRuns`
  - `failedRuns`
  - `lastExecutionAt`
  - `completedTransactionId`
  - `executionHistory`
- Creates new `AgentExecution` collection
- Updates indexes

### 4. Verify Migration
```bash
npx prisma studio
```

This opens Prisma Studio where you can visually inspect:
- Agent model now has the new fields
- AgentExecution model is created

## If Migration Fails

### Issue: "Field already exists"
This might happen if running migration multiple times.

**Solution:**
```bash
# Reset the database (WARNING: Deletes all data!)
npx prisma migrate reset

# Or manually update schema in MongoDB Atlas if needed
```

### Issue: Connection Error
**Check:**
1. `DATABASE_URL` is correct in `.env`
2. MongoDB cluster is accessible
3. Network allows connection to MongoDB

## Testing After Migration

### 1. Start Backend
```bash
npm run dev
```

### 2. Test Sync Endpoint
```bash
curl -X POST http://localhost:5000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"address": "0x6cc67be8d78c0bd1", "forceRefresh": true}'
```

### 3. Check Response
You should see:
```json
{
  "success": true,
  "message": "Smart Scan completed with state reconciliation",
  "data": {
    "agents": [
      {
        "id": "...",
        "scheduledTxId": "33450",
        "totalRuns": 10,
        "successfulRuns": 9,
        "failedRuns": 1,
        "lastExecutionAt": "2025-10-27T17:08:10.000Z",
        "executionHistory": [...]
      }
    ]
  }
}
```

### 4. Start Frontend
```bash
cd ../frontend
npm run dev
```

### 5. Test UI
1. Open http://localhost:3000
2. Connect wallet with address `0x6cc67be8d78c0bd1`
3. Agent 33450 should appear immediately
4. Should show:
   - Total Runs: 10
   - Last Run: Recent timestamp
   - Status: Scheduled

## Common Issues

### "Agents array is empty"
**Cause:** Migration not run, or backend not fetching properly

**Debug:**
```bash
# Check backend logs
# Should see: "✅ Found X total transactions"
# Should see: "✅ Identified X active agents with execution history"
```

### "Agent 33450 not in MongoDB"
**Cause:** Sync hasn't run yet, or still cached

**Fix:**
```bash
# Force refresh via API
curl -X POST http://localhost:5000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"address": "0x6cc67be8d78c0bd1", "forceRefresh": true}'
```

### "totalRuns is 0"
**Possible causes:**
1. FindLabs API not returning completed transactions
2. `handler_uuid` mismatch preventing chain building
3. Execution history not being processed

**Debug:**
```bash
# Check raw API response
curl -u "username:password" \
  "https://api.find.xyz/flow/v1/scheduled-transaction?owner=0x6cc67be8d78c0bd1"
```

## Success Indicators

✅ Migration ran without errors
✅ Backend starts successfully
✅ Sync endpoint returns agents with execution data
✅ MongoDB has agent 33450 with totalRuns > 0
✅ Frontend displays agent 33450 on initial load
✅ Force refresh works and updates data

## Support

If you encounter issues:
1. Check backend console logs for errors
2. Verify MongoDB connection
3. Confirm FindLabs API credentials are correct
4. Review IMPLEMENTATION_SUMMARY.md for architecture details

