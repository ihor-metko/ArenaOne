# Real Payment Verification Flow

## Overview

This document describes the owner-initiated real payment verification system for Payment Accounts in ArenaOne. This verification ensures that merchant payment credentials are valid and can process real payments, providing confidence that the payment account can handle actual bookings.

## Problem Statement

Previously, Payment Accounts used only technical/sandbox API verification, which:
- Was unreliable with WayForPay sandbox
- Didn't guarantee real payment processing capability
- Couldn't verify that funds would actually flow to the merchant account

## Solution

Implement a real, owner-initiated payment verification flow where:
1. Owner initiates a minimal verification payment (1 UAH)
2. Payment is processed through actual WayForPay checkout (not sandbox)
3. Platform validates the WayForPay callback signature
4. Payment Account is marked as verified only after successful callback
5. Regular bookings can only use verified payment accounts
6. Funds go directly to the merchant account (platform never holds funds)

## Database Schema

### PaymentAccount Model Updates

```prisma
model PaymentAccount {
  // ... existing fields ...
  
  // Status tracking
  status              PaymentAccountStatus             @default(PENDING)
  verificationLevel   PaymentAccountVerificationLevel  @default(NOT_VERIFIED)
  
  // Timestamps
  lastVerifiedAt      DateTime?  // Technical verification
  lastRealVerifiedAt  DateTime?  // Real payment verification
  
  // Relations
  verificationPayments VerificationPayment[]
}

enum PaymentAccountStatus {
  PENDING       // Credentials saved but not verified
  TECHNICAL_OK  // Passed sandbox/API verification
  VERIFIED      // Real payment verification completed
  INVALID       // Credentials failed verification
  DISABLED      // Manually disabled
}

enum PaymentAccountVerificationLevel {
  NOT_VERIFIED  // No real payment verification
  VERIFIED      // Real payment verification completed
}
```

### VerificationPayment Model

```prisma
model VerificationPayment {
  id                String         @id @default(uuid())
  paymentAccountId  String
  paymentAccount    PaymentAccount @relation(...)
  
  // Payment details
  orderReference    String         @unique
  amount            Int            // 100 (1 UAH in kopiykas)
  currency          String         @default("UAH")
  status            String         @default("pending")
  
  // WayForPay response data
  transactionId     String?
  authCode          String?
  cardPan           String?
  cardType          String?
  signatureValid    Boolean?
  callbackData      String?        @db.Text
  errorMessage      String?        @db.Text
  
  // Timestamps
  initiatedBy       String
  createdAt         DateTime       @default(now())
  completedAt       DateTime?
}
```

## Architecture

### Backend Components

#### 1. Verification Payment Service
**Location**: `src/services/verificationPaymentService.ts`

**Key Functions:**
- `initiateRealPaymentVerification()` - Creates verification payment intent
- `handleVerificationCallback()` - Processes WayForPay callbacks
- `validateWayForPaySignature()` - Validates callback signatures
- `getVerificationPayment()` - Retrieves verification payment status

#### 2. API Endpoints

**Initiate Verification:**
```
POST /api/admin/clubs/[id]/payment-accounts/[accountId]/verify-real
POST /api/admin/organizations/[id]/payment-accounts/[accountId]/verify-real
```
- Access: Club Owner or Organization Admin
- Creates verification payment intent
- Returns checkout URL

**Webhook Callback:**
```
POST /api/webhooks/wayforpay/verification
```
- Public endpoint (called by WayForPay)
- Validates signature
- Updates payment account verification status

**Status Check:**
```
GET /api/admin/verification-payments/[id]
```
- Access: Authenticated users
- Returns verification payment status
- Used by return page for polling

#### 3. Payment Resolution Updates

The `resolvePaymentAccountForBooking()` function now filters by `verificationLevel`:

```typescript
const clubPaymentAccount = await prisma.paymentAccount.findFirst({
  where: {
    clubId,
    scope: PaymentAccountScope.CLUB,
    verificationLevel: "VERIFIED", // Only verified accounts
  },
});
```

### Frontend Components

#### 1. PaymentAccountList Component
**Location**: `src/components/admin/payment-accounts/PaymentAccountList.tsx`

**Updates:**
- New "Verify Payment Account" button
- Verification level badge display (🟡 Pending / 🟢 Verified)
- Updated status rendering for new enum values
- Helper tooltip explaining verification process

#### 2. Payment Accounts Page
**Location**: `src/app/(pages)/admin/payment-accounts/page.tsx`

**New Handler:**
```typescript
const handleVerifyReal = async (account: MaskedPaymentAccount) => {
  // Call verify-real API endpoint
  // Redirect to WayForPay checkout URL
};
```

#### 3. Verification Return Page
**Location**: `src/app/(pages)/admin/payment-accounts/verification-return/page.tsx`

**Features:**
- Receives `id` query parameter (verification payment ID)
- Polls verification payment status every 2 seconds
- Displays loading/success/failure states
- Auto-redirects to payment accounts page on completion

## Verification Flow

### Step-by-Step Process

1. **Owner Initiates Verification**
   - Owner clicks "Verify Payment Account" button
   - Frontend calls `POST /api/admin/.../verify-real`
   - Backend creates `VerificationPayment` record
   - Backend generates WayForPay checkout URL
   - Frontend redirects to checkout URL

2. **Owner Completes Payment**
   - Owner enters payment details on WayForPay
   - WayForPay processes 1 UAH payment
   - Funds go directly to merchant account

3. **WayForPay Callback**
   - WayForPay sends callback to webhook endpoint
   - Backend validates signature using merchant secret key
   - Backend checks transaction status

4. **Status Update**
   - If signature valid + transaction approved:
     - `verificationPayment.status` → "completed"
     - `verificationPayment.signatureValid` → true
     - `paymentAccount.status` → "VERIFIED"
     - `paymentAccount.verificationLevel` → "VERIFIED"
   - If signature invalid or transaction failed:
     - `verificationPayment.status` → "failed"
     - `paymentAccount.status` → "INVALID"

5. **Owner Sees Result**
   - Return page polls verification payment status
   - Displays success or failure message
   - Owner returns to payment accounts page

## Security Considerations

### ✅ Signature Validation

All callbacks from WayForPay are validated using HMAC-MD5:

```typescript
const signatureString = [
  merchantAccount,
  orderReference,
  amount,
  currency,
  authCode,
  cardPan,
  transactionStatus,
  reasonCode,
].join(";");

const expectedSignature = crypto
  .createHmac("md5", secretKey)
  .update(signatureString)
  .digest("hex");
```

### ✅ No Credential Exposure

- Frontend never receives decrypted credentials
- Signature validation happens server-side only
- Secret keys remain encrypted in database

### ✅ Authorization

- Only owners/admins can initiate verification
- Root admins cannot access verification (no credential access)
- Each verification is tied to the initiating user

### ✅ Financial Separation

- Minimal amount (1 UAH) reduces cost
- Funds go directly to merchant account
- Platform never holds money
- No refund/chargeback handling needed

## UI/UX Flow

### Status Badges

**Technical Status:**
- 🟡 PENDING - "Verifying..."
- 🟢 TECHNICAL_OK - "Technical OK"
- 🟢 VERIFIED - "Verified"
- 🔴 INVALID - "Invalid credentials"
- ⚪ DISABLED - "Disabled"

**Verification Level:**
- 🟡 NOT_VERIFIED - "Pending verification"
- 🟢 VERIFIED - "Verified"

### Button Visibility

**"Verify Payment Account" button shown when:**
- `verificationLevel === NOT_VERIFIED`
- AND (`status === TECHNICAL_OK` OR `status === PENDING`)
- AND user has owner/admin permissions

### Translations

All labels support EN and UK locales:

```json
{
  "verificationLevel": {
    "verified": "Verified",
    "notVerified": "Pending verification",
    "helpText": "Real payment verification required..."
  },
  "actions": {
    "verifyReal": "Verify Payment Account"
  }
}
```

## Testing

### Manual Testing Checklist

1. ✅ Create payment account with valid credentials
2. ✅ Verify technical validation completes (status → TECHNICAL_OK)
3. ✅ Click "Verify Payment Account" button
4. ✅ Redirected to WayForPay checkout
5. ✅ Complete payment with test card
6. ✅ Redirected to return page
7. ✅ Return page shows "Processing..."
8. ✅ Status updates to "Verified" after callback
9. ✅ Payment account shows verification level = VERIFIED
10. ✅ Payment account can now be used for bookings

### Test Cards (WayForPay Sandbox)

```
Visa: 4111 1111 1111 1111
MasterCard: 5454 5454 5454 5454
CVV: Any 3 digits
Expiry: Any future date
```

### Test Credentials

```typescript
merchantAccount: "test_merch_n1"
merchantSecretKey: "flk3409refn54t54t*FNJRET"
```

## Error Handling

### Common Errors

**"Invalid merchant credentials"**
- Cause: Wrong merchant ID or secret key
- Solution: Update payment account with correct credentials

**"Verification callback signature validation failed"**
- Cause: Secret key mismatch
- Solution: Verify secret key is correct

**"Payment not approved"**
- Cause: Payment declined by bank
- Solution: Try again with different payment method

**"Verification taking too long"**
- Cause: Callback delay from WayForPay
- Solution: Check status later; callback may still arrive

## Migration Guide

### Database Migration

Run the following command to apply schema changes:

```bash
npx prisma migrate dev --name add-verification-payment-support
```

This creates the following changes:
1. Adds `verificationLevel` column to `PaymentAccount`
2. Updates `PaymentAccountStatus` enum with new values
3. Creates `VerificationPayment` table
4. Adds `lastRealVerifiedAt` timestamp

### Environment Variables

Ensure the following is set:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Used for return and callback URLs
```

### Existing Payment Accounts

After migration, all existing payment accounts will have:
- `verificationLevel = NOT_VERIFIED`
- Owners will need to complete verification for each account

## Future Enhancements

### Phase 2 (Optional)
- WebSocket updates instead of polling
- Email notification on verification completion
- Retry mechanism for failed verifications
- Detailed error codes from provider
- Support for LiqPay verification

### Phase 3 (Optional)
- Periodic re-verification (e.g., every 90 days)
- Verification history tracking
- Webhook retry with exponential backoff
- Background job queue for verification

## References

- [WayForPay API Documentation](https://wiki.wayforpay.com/en/)
- [WayForPay Signature Validation](https://wiki.wayforpay.com/en/view/852102)
- [WayForPay Response Codes](https://wiki.wayforpay.com/en/view/852131)

## Support

For issues with verification:
1. Check payment account credentials are correct
2. Verify environment variable `NEXT_PUBLIC_APP_URL` is set
3. Check webhook endpoint is publicly accessible
4. Review server logs for callback details
5. Test with WayForPay sandbox credentials first
