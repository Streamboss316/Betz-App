# User Invite System - BETZ App

## Overview
Send bets to users who don't have the BETZ app installed yet. They'll receive an invite link to download the app.

---

## How It Works

### For Existing Users (Have App)
1. Search by **username**, **Betz ID**, or **phone number**
2. Select user from search results
3. Send bet normally

### For New Users (Don't Have App)
1. Toggle to "Invite New User" mode
2. Enter their **phone number** OR **email address**
3. Send bet - they receive invite link to download BETZ
4. When they join, bet becomes active

---

## User Flow

### Sending Bet to Existing User

**Step 1:** Place Bet → Enter amount & stipulation
**Step 2:** Click "Search Users" tab (default)
**Step 3:** Search by name, ID, or phone
**Step 4:** Select opponent from results
**Step 5:** Click "Send Bet"

### Sending Bet to New User (Invite)

**Step 1:** Place Bet → Enter amount & stipulation
**Step 2:** Click "Invite New User" tab
**Step 3:** Choose "Phone Number" or "Email Address"
**Step 4:** Enter contact info
**Step 5:** Click "Send Bet & Invite"

**Result:**
- Bet created with status `pending_invite`
- Invite link sent to contact (SMS or Email)
- User downloads app via link
- User registers and accepts bet
- Bet becomes active

---

## Frontend Components

### Place Bet Page - Step 2 (Select Opponent)

**Two Modes:**

1. **Search Users Mode:**
   - Search existing BETZ users
   - Shows user cards with name, ID, W/L record
   - Select to choose opponent

2. **Invite New User Mode:**
   - Toggle between Phone/Email input
   - Enter contact information
   - Shows confirmation of invite contact
   - Alert message explaining invite process

**UI Features:**
- Toggle buttons to switch modes
- Different input fields per mode
- Visual confirmation of selection
- Disabled send button until opponent selected or contact entered

---

## Backend Implementation

### Database Collections

**1. invites Collection:**
```javascript
{
  "invite_id": "uuid",
  "invited_by": "user_id",
  "contact": "phone_or_email",
  "contact_type": "phone" | "email",
  "placeholder_id": "invited_xxxxx",
  "status": "pending",
  "created_at": "timestamp"
}
```

**2. Updated bets Collection:**
```javascript
{
  "bet_id": "uuid",
  "creator_id": "user_id",
  "opponent_id": "user_id" | "invited_xxxxx",
  "amount": 500,
  "status": "pending_invite" | "pending" | "active",
  "stipulation": "race rules",
  "invited_contact": "phone_or_email" | null,
  "created_at": "timestamp"
}
```

### API Endpoints

**1. Create Bet with Invite**
```
POST /api/bets/create
Body: {
  "amount": 500,
  "stipulation": "rules",
  // Option A: Existing user
  "opponent_id": "user123"
  
  // Option B: New user (phone)
  "opponent_phone": "+1234567890"
  
  // Option C: New user (email)
  "opponent_email": "user@example.com"
}

Response: {
  "bet_id": "...",
  "status": "pending_invite" | "pending",
  "opponent_id": "...",
  "invited_contact": "..." | null
}
```

**2. Check Contact Exists**
```
POST /api/users/check-contact
Body: {
  "phone": "+1234567890"
  // OR
  "email": "user@example.com"
}

Response: {
  "exists": true,
  "user": {...}
  // OR
  "exists": false,
  "message": "User not found. An invite will be sent."
}
```

---

## Invite Delivery System

### SMS Invite (Phone Number)
```
Message:
"You've been challenged to a $500 bet on BETZ! 
Download the app to accept: https://betz.app/invite/abc123"
```

### Email Invite
```
Subject: You've been challenged to a bet on BETZ!

Body:
[Friend's Name] has challenged you to a $500 racing bet!

Download BETZ to accept the challenge:
https://betz.app/invite/abc123

See you on the track! 🏁
```

### Invite Link Handling
1. User clicks invite link
2. Redirects to App Store/Play Store
3. User downloads and installs BETZ
4. Opens app with deep link to bet
5. Completes registration
6. Bet automatically appears in "Pending Bets"

---

## Bet Status Flow

### Without Invite (Existing User)
```
pending → accepted → active → completed
```

### With Invite (New User)
```
pending_invite → [user joins] → pending → accepted → active → completed
```

---

## Edge Cases & Handling

### 1. User Already Has Account
**Scenario:** Enter phone/email of existing user in invite mode
**Handling:** Backend checks if contact exists, links to existing user

### 2. Multiple Invites Same Contact
**Scenario:** Send 3 bets to same phone number
**Handling:** Store 3 separate invite records, all link when user joins

### 3. Invite Expires
**Scenario:** User doesn't join within X days
**Handling:** 
- Bet remains `pending_invite` for 7 days
- After 7 days, status changes to `expired`
- Creator gets refund automatically

### 4. Wrong Contact Info
**Scenario:** Entered wrong phone/email
**Handling:** 
- Creator can cancel bet before it's accepted
- Receives punk out refund (no penalty for invite bets)

### 5. User Joins But Different Number
**Scenario:** Invited via phone A, registers with phone B
**Handling:** 
- Manual linking via support
- Or bet stays pending, new search required

---

## Future Enhancements

### 1. Invite Tracking Dashboard
- View all sent invites
- See who joined via your invite
- Invite rewards/referral bonuses

### 2. Bulk Invites
- Invite multiple contacts at once
- Import from phone contacts
- Social media integration

### 3. Custom Invite Messages
- Personalize invite text
- Add voice/video message
- Include race details in invite

### 4. Invite Analytics
- Track invite conversion rate
- See which channel works best (SMS vs Email)
- A/B test invite messages

### 5. Retry Failed Invites
- Resend if delivery failed
- Try alternate contact method
- Queue for retry

---

## Testing Checklist

- [ ] Search existing user by name
- [ ] Search existing user by phone
- [ ] Search existing user by Betz ID
- [ ] Toggle to invite mode
- [ ] Enter phone number for invite
- [ ] Enter email for invite
- [ ] Send bet to existing user
- [ ] Send bet with phone invite
- [ ] Send bet with email invite
- [ ] Verify bet status is `pending_invite`
- [ ] Check invite record in database
- [ ] Test invalid phone format
- [ ] Test invalid email format
- [ ] Test switching between modes
- [ ] Verify contact confirmation display

---

## Summary

✅ **Two-way opponent selection**
✅ **Search existing users** (name, ID, phone)
✅ **Invite new users** (phone or email)
✅ **Invite link sent** to non-users
✅ **Bet pending until they join**
✅ **Backend handles both flows**
✅ **Clean UI toggle between modes**

**Ready to onboard new users through betting!** 🚀
