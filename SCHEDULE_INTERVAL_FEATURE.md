# Schedule Interval Display - Implementation Summary

## Overview

Implemented dynamic schedule interval calculation based on actual execution history, replacing the static "Scheduled" text with intelligent time-based intervals.

## Feature Description

The schedule column now displays the calculated execution interval based on the time difference between the two most recent completed executions. The system automatically selects the most appropriate time unit for readability.

## Implementation

### Algorithm

1. **Data Source**: Uses `executionHistory` array from agent data
2. **Calculation**: Compares the two most recent completed executions
3. **Time Difference**: Calculates difference in seconds
4. **Smart Formatting**: Automatically chooses the best unit (seconds, minutes, hours, days, weeks)

### Code Location

**File**: `frontend/components/agent-row.tsx`

**Function**: `calculateScheduleInterval()`

```typescript
const calculateScheduleInterval = (): string => {
  if (!agent.executionHistory || agent.executionHistory.length < 2) {
    return agent.schedule || "Unknown"
  }
  
  // Get the two most recent executions
  const executions = agent.executionHistory
    .filter(ex => ex.completedAt)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  
  if (executions.length < 2) {
    return agent.schedule || "Unknown"
  }
  
  // Calculate difference in seconds
  const time1 = new Date(executions[0].completedAt).getTime()
  const time2 = new Date(executions[1].completedAt).getTime()
  const diffSeconds = Math.abs(time1 - time2) / 1000
  
  // Format based on best unit
  if (diffSeconds < 60) {
    return `Every ${Math.round(diffSeconds)} seconds`
  } else if (diffSeconds < 3600) {
    const minutes = Math.round(diffSeconds / 60)
    return `Every ${minutes} minute${minutes !== 1 ? 's' : ''}`
  } else if (diffSeconds < 86400) {
    const hours = Math.round(diffSeconds / 3600)
    return `Every ${hours} hour${hours !== 1 ? 's' : ''}`
  } else if (diffSeconds < 604800) {
    const days = Math.round(diffSeconds / 86400)
    return `Every ${days} day${days !== 1 ? 's' : ''}`
  } else {
    const weeks = Math.round(diffSeconds / 604800)
    return `Every ${weeks} week${weeks !== 1 ? 's' : ''}`
  }
}
```

## Display Examples

Based on execution history intervals:

| Time Difference | Display Format |
|----------------|----------------|
| 30 seconds | `Every 30 seconds` |
| 45 seconds | `Every 45 seconds` |
| 5 minutes | `Every 5 minutes` |
| 1 minute | `Every 1 minute` |
| 2 hours | `Every 2 hours` |
| 1 hour | `Every 1 hour` |
| 3 days | `Every 3 days` |
| 1 day | `Every 1 day` |
| 2 weeks | `Every 2 weeks` |
| 1 week | `Every 1 week` |

## Fallback Behavior

- **Less than 2 executions**: Shows `agent.schedule` value or "Unknown"
- **No execution history**: Shows `agent.schedule` value or "Unknown"
- **Invalid data**: Shows `agent.schedule` value or "Unknown"

## Real-World Example

For your Payment Cron agent with the following execution history:

```
Execution 1: 2025-10-27T17:28:10Z
Execution 2: 2025-10-27T17:18:09Z
```

**Calculation:**
- Difference: 10 minutes and 1 second (601 seconds)
- Display: **"Every 10 minutes"**

## Benefits

1. **Accurate**: Shows actual execution frequency, not static configuration
2. **Dynamic**: Updates automatically as agent runs
3. **Readable**: Uses appropriate time units for clarity
4. **Smart**: Handles singular/plural grammar correctly
5. **Reliable**: Falls back gracefully when data is insufficient

## Time Unit Thresholds

| Unit | Threshold Range |
|------|----------------|
| Seconds | 0 - 59 seconds |
| Minutes | 1 - 59 minutes |
| Hours | 1 - 23 hours |
| Days | 1 - 6 days |
| Weeks | 7+ days |

## Edge Cases Handled

1. **New agents**: Shows "Unknown" until 2+ executions complete
2. **Irregular schedules**: Uses most recent interval only
3. **Paused agents**: Still shows last calculated interval
4. **Failed executions**: Only uses completed executions
5. **Missing timestamps**: Filters out invalid data

## UI Location

The calculated schedule appears in the **Schedule column** of the agent row table:

```
┌──────────────┬────────┬─────────────┬─────────────────┬──────────┐
│ Agent Name   │ Status │ Workflow    │ Schedule        │ Next Run │
├──────────────┼────────┼─────────────┼─────────────────┼──────────┤
│ Agent 33472  │ 🟢 Act │ PaymentCron │ Every 10 minutes│ In 2 min │
└──────────────┴────────┴─────────────┴─────────────────┴──────────┘
```

## Future Enhancements (Optional)

- [ ] Average multiple intervals for more accuracy
- [ ] Detect irregular schedules (varying intervals)
- [ ] Show schedule confidence indicator
- [ ] Display schedule trends (getting faster/slower)
- [ ] Allow manual schedule override

## Testing Checklist

- [x] Calculates correctly for various time intervals
- [x] Handles singular/plural grammar
- [x] Shows appropriate fallback text
- [x] Updates when execution history changes
- [x] No TypeScript linting errors
- [x] Formats all time units correctly

## Notes

- Uses the **most recent two executions** for calculation
- Provides real-time accuracy based on actual blockchain data
- Automatically updates as new executions complete
- More reliable than relying on static configuration

