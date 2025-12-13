# BETZ Bet Completion Flow

## Overview
Two different completion flows based on bet amount:

---

## Flow 1: Bets ≤ $1,000.00 (No DP Required)

### Step 1: Declare Winner
- **User 1** declares winner via: `PUT /api/bets/{bet_id}/declare-winner?winner_id={user_id}`
- Bet status → `awaiting_confirmation`
- **User 2** receives notification

### Step 2A: Accept (Happy Path)
- **User 2** confirms via: `PUT /api/bets/{bet_id}/confirm-winner`
- Bet completes immediately
- Winner receives payout (minus 3% platform fee)
- Status → `completed`

### Step 2B: Dispute
- **User 2** disputes via: `PUT /api/bets/{bet_id}/dispute-winner`
- Status → `disputed`
- **Admin intervention required**

---

## Flow 2: Bets > $1,000.00 (DP Required)

### Step 1: Declare Winner
- **User 1** declares winner via: `PUT /api/bets/{bet_id}/declare-winner?winner_id={user_id}`
- Bet status → `awaiting_confirmation`
- **User 2** receives notification

### Step 2: User Confirmation
- **User 2** confirms via: `PUT /api/bets/{bet_id}/confirm-winner`
- Status → `awaiting_dp_approval`
- **DP** receives notification

### Step 3: DP Approval
- **DP** approves via: `PUT /api/bets/{bet_id}/dp-approve`
- Bet completes
- Winner receives payout (minus 3% platform fee)
- Status → `completed`

---

## API Endpoints

### 1. Declare Winner
```
PUT /api/bets/{bet_id}/declare-winner?winner_id={user_id}
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "status": "awaiting_confirmation"
}
```

### 2. Confirm Winner
```
PUT /api/bets/{bet_id}/confirm-winner
Headers: Authorization: Bearer {token}
```
**Response (≤ $1,000):**
```json
{
  "success": true,
  "status": "completed",
  "platform_fee": 6.00,
  "winner_payout": 194.00
}
```

**Response (> $1,000):**
```json
{
  "success": true,
  "status": "awaiting_dp_approval",
  "message": "DP must approve to complete bet"
}
```

### 3. Dispute Winner
```
PUT /api/bets/{bet_id}/dispute-winner
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "status": "disputed",
  "message": "Admin intervention required"
}
```

### 4. DP Approve (Only for bets > $1,000)
```
PUT /api/bets/{bet_id}/dp-approve
Headers: Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "status": "completed",
  "platform_fee": 60.00,
  "winner_payout": 1940.00
}
```

---

## Bet Statuses

| Status | Description |
|--------|-------------|
| `pending` | Bet created, waiting for opponent to accept |
| `accepted` | Opponent accepted (for bets > $1,000, waiting for DP assignment) |
| `active` | Bet is active (≤ $1,000) or DP assigned (> $1,000) |
| `awaiting_confirmation` | Winner declared, waiting for other party to confirm/dispute |
| `awaiting_dp_approval` | Both parties agreed, waiting for DP to approve (> $1,000 only) |
| `disputed` | Parties disagree, admin intervention needed |
| `completed` | Bet finished, winner paid out |

---

## Frontend Updates Needed

### BetDetailsPage.js
1. **Show "Declare Winner" button** when bet is `active` or `accepted`
2. **Show "Confirm/Dispute" buttons** when bet is `awaiting_confirmation` and user is NOT the declarer
3. **Show "Waiting for confirmation" message** when bet is `awaiting_confirmation` and user IS the declarer
4. **Show "Waiting for DP approval" message** when bet is `awaiting_dp_approval`

### DPDashboard.js
1. **Show "Approve Winner" button** for bets with status `awaiting_dp_approval`
2. Call `/bets/{bet_id}/dp-approve` endpoint

---

## Example Scenarios

### Scenario 1: $500 Bet (No DP)
1. User A declares User B as winner
2. User B confirms → Bet completes immediately ✅
3. User B gets $485 (3% fee = $15)

### Scenario 2: $500 Bet with Dispute
1. User A declares User A as winner
2. User B disputes → Admin must resolve ⚠️

### Scenario 3: $2,000 Bet (DP Required)
1. User A declares User B as winner
2. User B confirms → Waits for DP
3. DP approves → Bet completes ✅
4. User B gets $3,880 (3% fee = $120)

---

## Notes
- **3% platform fee** always deducted from total pool
- **Both parties must agree** before completion (except admin override)
- **DP is final authority** for bets > $1,000
- **Admin can intervene** in disputed bets
