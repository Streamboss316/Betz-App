# Punk Out Feature - BETZ App

## Overview
**Punk Out** is a penalty system that applies when a user backs out of a bet without an approved reason.

---

## How It Works

### Default Calculation
- **Punk Out Amount = 10% of TOTAL bet**
- Total bet = Your bet amount × 2 (both parties contribute equally)

### Example:
```
User A bets: $500
User B bets: $500
Total bet: $1,000
Punk Out penalty: $100 (10% of $1,000)
```

---

## When Does Punk Out Apply?

### Applies When:
- User backs out after bet is accepted
- User cancels during active bet
- No valid/approved reason for cancellation

### Does NOT Apply When:
- Admin cancels the bet
- Mutual agreement to cancel
- Technical issues (admin approved)
- Bet is still in "pending" status (opponent hasn't accepted yet)

---

## Punk Out Process

### Step 1: User Decides to Back Out
- User clicks "Punk Out" button on bet details
- System shows penalty amount confirmation

### Step 2: Penalty Payment
- Punk out amount deducted from user who backed out
- Amount added to other party's balance
- Bet status changed to "cancelled"

### Step 3: Notification
- Other party receives notification
- Shows punk out amount received
- Bet marked as cancelled in history

---

## Admin Configuration

### Changing Punk Out Percentage

**Location:** Admin Panel → Settings → Platform Fees & Limits

**Default:** 10%

**How to Change:**
1. Login as admin (streamboss316@gmail.com)
2. Go to Settings
3. Find "Punk Out Penalty (%)" field
4. Change percentage (e.g., 15%, 20%, 5%)
5. Click "Save Settings"

**Takes Effect:** Immediately for all new bets

---

## API Endpoints

### 1. Create Bet (Auto-calculates Punk Out)
```
POST /api/bets/create
Body: {
  "opponent_id": "user123",
  "amount": 500
}

Response: {
  "bet_id": "...",
  "amount": 500,
  "punk_out_amount": 100,  // 10% of $1000 total
  "status": "pending"
}
```

### 2. Punk Out (Back Out of Bet)
```
PUT /api/bets/{bet_id}/punk-out
Headers: Authorization: Bearer {token}

Response: {
  "success": true,
  "punk_out_paid": 100,
  "message": "Punk out penalty of $100.00 paid"
}
```

### 3. Update Punk Out Amount (Creator Only, Before Accept)
```
PUT /api/bets/{bet_id}/update-punk-out?punk_out_amount=150
Headers: Authorization: Bearer {token}

Response: {
  "success": true
}
```

---

## Frontend Display

### Bet Details Page
Shows punk out information:
```
┌─────────────────────────────┐
│ Bet Amount: $500            │
│ Total Pool: $1,000          │
│ Punk Out: $100              │
│                             │
│ If you back out, you will   │
│ pay $100 to your opponent   │
└─────────────────────────────┘
```

### Place Bet Page
Shows calculated punk out when creating bet:
```
Your Bet: $500
Opponent Bets: $500
Total: $1,000

⚠️ Punk Out Penalty: $100
   (10% of total if you back out)
```

---

## Database Schema

### Bet Document
```javascript
{
  "bet_id": "uuid",
  "creator_id": "user1",
  "opponent_id": "user2",
  "amount": 500,
  "punk_out_amount": 100,  // 10% of total
  "status": "active",
  "cancelled_by": null,     // Set if punked out
  "punk_out_paid": false,   // True if penalty was paid
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### Platform Settings
```javascript
{
  "platform_fee_percentage": 3.0,
  "punk_out_percentage": 10.0,  // Configurable by admin
  "min_bet_amount": 10.0,
  "max_bet_amount": 100000.0,
  ...
}
```

---

## User Flow Example

### Scenario: Sarah Punks Out

**Initial State:**
- Sarah bets $1,000
- Mike bets $1,000
- Total: $2,000
- Punk out: $200 (10%)
- Status: Active

**Sarah Backs Out:**
1. Sarah clicks "Punk Out" button
2. Confirms she understands $200 penalty
3. System processes:
   - Sarah's balance: -$200
   - Mike's balance: +$200
   - Bet status: Cancelled
   - cancelled_by: Sarah

**Result:**
- Mike receives $200 compensation
- Bet is closed
- Both can see bet in history as "Cancelled (Punk Out)"

---

## Business Rules

### 1. Punk Out Calculation
- Always based on TOTAL bet (both parties' contributions)
- Admin can set any percentage (0-100%)
- Calculated at bet creation time
- Displayed prominently

### 2. When Punk Out Can Occur
- ✅ After bet is accepted (status: active/accepted)
- ✅ Before race/event starts
- ❌ After bet is completed
- ❌ While bet is disputed
- ❌ If bet is pending (no penalty, just reject)

### 3. Who Can Punk Out
- Either party (creator or opponent)
- Must be participant in the bet
- Must have sufficient balance for penalty

### 4. Payment Flow
- Instant deduction from punker
- Instant credit to other party
- Transaction recorded in database
- Notification sent immediately

---

## Admin Override

### Cancel Without Penalty
Admins can cancel bets without punk out:
```
PUT /api/admin/bets/{bet_id}/cancel
Reason: "Technical issue" / "Mutual agreement"
```

This sets status to "cancelled" but doesn't apply punk out penalty.

---

## Future Enhancements (Optional)

1. **Approved Reasons:**
   - User can submit reason for backing out
   - Admin reviews and approves
   - If approved, no punk out penalty

2. **Dispute Punk Out:**
   - User disputes the punk out
   - Admin reviews case
   - Can reverse if justified

3. **Punk Out History:**
   - Track punk out frequency per user
   - Show "reliability score"
   - Warn users about frequent punkers

4. **Variable Punk Out:**
   - Different percentages for different bet sizes
   - Time-based (closer to event = higher penalty)
   - Custom punk out per bet

---

## Summary

✅ **Punk out = 10% of TOTAL bet (configurable)**
✅ **Automatic calculation on bet creation**
✅ **Admin can change percentage in settings**
✅ **Penalty paid instantly when backing out**
✅ **Other party receives full punk out amount**
✅ **Displayed clearly on all bet screens**

**Ready to use!** Punk out feature is fully functional and integrated! 💪
