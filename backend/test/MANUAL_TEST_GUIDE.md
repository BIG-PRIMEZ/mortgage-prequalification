# Manual Multi-Client Testing Guide

This guide helps you manually verify that the application properly isolates data between multiple concurrent users.

## Prerequisites

1. Backend server running (`npm run start:dev`)
2. Frontend running (`npm run dev` in frontend directory)
3. Multiple browser windows/tabs or different browsers

## Test Scenarios

### Scenario 1: Basic Isolation Test

**Goal**: Verify that two users can have separate conversations simultaneously.

**Steps**:

1. **Browser 1 (User A)**:
   - Open the application
   - Start a conversation: "I want to purchase"
   - Enter income: "$75,000"
   - Enter monthly debts: "$500"

2. **Browser 2 (User B)**:
   - Open the application in a different browser or incognito window
   - Start a conversation: "I want to refinance"
   - Enter income: "$120,000"
   - Enter monthly debts: "$1,200"

3. **Verification**:
   - ✓ User A should only see purchase-related questions
   - ✓ User B should only see refinance-related questions
   - ✓ Neither user should see the other's data
   - ✓ Check browser console for session IDs - they should be different

### Scenario 2: Verification Code Isolation

**Goal**: Ensure verification codes don't leak between users.

**Steps**:

1. **Both Users**: Complete data entry up to verification
2. **User A**: Enter phone number ending in "1234"
3. **User B**: Enter phone number ending in "5678"
4. **Check server logs**: Each user should receive different verification codes
5. **Try cross-verification**: User A's code should NOT work for User B

### Scenario 3: Results Isolation

**Goal**: Verify calculation results are user-specific.

**Steps**:

1. **User A**: 
   - Income: $75,000, Debts: $500
   - Purchase price: $300,000, Down payment: $60,000

2. **User B**:
   - Income: $120,000, Debts: $1,200
   - Property value: $450,000, Loan amount: $350,000

3. **Verification**:
   - Each user should see different borrowing capacities
   - Results should match their specific inputs

### Scenario 4: Session Persistence

**Goal**: Verify sessions persist across page refreshes.

**Steps**:

1. Start a conversation and enter some data
2. Refresh the page
3. Continue the conversation
4. ✓ The conversation should continue from where you left off
5. ✓ Previously entered data should be remembered

### Scenario 5: Concurrent Message Test

**Goal**: Test rapid concurrent messaging.

**Steps**:

1. Open 3+ browser windows
2. Start conversations in all windows simultaneously
3. Type messages rapidly in all windows
4. ✓ Each conversation should remain separate
5. ✓ No messages should appear in wrong windows

## What to Look For

### ✅ Success Indicators:
- Each user has a unique session ID
- Conversations don't mix
- Data remains isolated
- Verification codes are user-specific
- Results match individual inputs

### ❌ Failure Indicators:
- Seeing another user's name/email/phone
- Receiving messages meant for another user
- Verification codes working across users
- Results showing wrong calculations
- Session data mixing after refresh

## Checking Logs

Monitor the backend logs for:

```bash
# Session creation
📍 Express Session ID: sess_1234567_abc123

# WebSocket connections
Client sess_1234567_abc123 connected with session sess_1234567_abc123

# Message routing
Message sent to 1 client(s) for session sess_1234567_abc123

# Verification isolation
💾 Stored code in session for phone: 4155551234
```

## Browser Developer Tools

1. Open Developer Tools (F12)
2. Go to Application/Storage → Local Storage
3. Check `mortgage-session-id` - should be unique per user
4. Network tab → WS → Check WebSocket messages
5. Console → Look for session-related logs

## Common Issues to Test

1. **Cookie Blocking**: Test with third-party cookies blocked
2. **Multiple Tabs**: Same user in multiple tabs should share session
3. **Different Browsers**: Different browsers should have different sessions
4. **Incognito Mode**: Should create new session
5. **VPN/Proxy**: Should still maintain separate sessions

## Reporting Issues

If you find any data leakage or session mixing:

1. Note the exact steps to reproduce
2. Save browser console logs
3. Save backend server logs
4. Take screenshots of both users' screens
5. Check session IDs in both browsers

## Success Criteria

The system passes multi-client testing when:

- [ ] 5+ concurrent users can complete full conversations
- [ ] No data leakage between any users
- [ ] All verification codes remain isolated
- [ ] Results are calculated correctly for each user
- [ ] Sessions persist properly across refreshes
- [ ] WebSocket messages go only to intended recipients
- [ ] Rate limiting prevents spam without affecting normal use