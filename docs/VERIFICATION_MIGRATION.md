# Payment Verification Migration Guide

## Quick Start

This PR implements owner-initiated real payment verification for Payment Accounts. Follow these steps to deploy:

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add-verification-payment-support
```

This will:
- Add `verificationLevel` field to PaymentAccount
- Update `PaymentAccountStatus` enum with new values (TECHNICAL_OK, VERIFIED)
- Create `VerificationPayment` table for tracking verification attempts
- Add `lastRealVerifiedAt` timestamp

### 2. Set Environment Variable

Ensure this is set in your `.env` file:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

This is used for WayForPay callback and return URLs.

### 3. Deploy Changes

Deploy the application with the new code.

### 4. Verify Webhook Endpoint

Ensure the webhook endpoint is publicly accessible:

```
POST https://your-domain.com/api/webhooks/wayforpay/verification
```

WayForPay needs to be able to reach this endpoint to send payment callbacks.

## What Changed

### For Existing Payment Accounts

After migration, all existing payment accounts will:
- Have `verificationLevel = NOT_VERIFIED`
- Show a yellow "Pending verification" badge
- Display a "Verify Payment Account" button
- **Cannot be used for new bookings until verified**

### For Owners

Owners will see:
1. A "Verify Payment Account" button next to each account
2. Clicking it initiates a 1 UAH verification payment
3. They'll be redirected to WayForPay to complete payment
4. After successful payment, account is marked as VERIFIED
5. Only VERIFIED accounts can process bookings

### Status Transitions

**Before Migration:**
- PENDING → ACTIVE (via sandbox check)

**After Migration:**
- PENDING → TECHNICAL_OK (via sandbox check)
- TECHNICAL_OK → VERIFIED (via real payment verification)

## Testing

### Test in Development First

1. Use WayForPay sandbox credentials:
   ```
   merchantAccount: test_merch_n1
   merchantSecretKey: flk3409refn54t54t*FNJRET
   ```

2. Create a payment account
3. Wait for technical verification (status → TECHNICAL_OK)
4. Click "Verify Payment Account"
5. Use test card: `4111 1111 1111 1111` (any CVV, future expiry)
6. Complete payment
7. Verify account shows VERIFIED status

### Production Deployment

1. Inform owners about the new verification requirement
2. Provide clear instructions on the verification process
3. Monitor logs for any webhook callback issues

## Rollback Plan

If issues arise, you can:

1. **Temporarily allow unverified accounts for bookings:**
   In `src/services/paymentAccountService.ts`, change:
   ```typescript
   verificationLevel: "VERIFIED"
   ```
   to:
   ```typescript
   status: { in: ["VERIFIED", "TECHNICAL_OK"] }
   ```

2. **Revert database migration:**
   ```bash
   npx prisma migrate resolve --rolled-back [migration_name]
   ```
   Then revert code changes.

## FAQs

### Q: Will existing bookings be affected?
A: No. The verification requirement only applies to new bookings. Existing bookings with pending payments will continue to work.

### Q: What happens if verification fails?
A: The account status becomes INVALID. Owner can retry verification by clicking "Retry Technical Verification" or updating credentials.

### Q: Is the 1 UAH charged to customers?
A: No. The verification payment is made by the owner to verify their own merchant account. It goes directly to their account, not through the platform.

### Q: Can root admins verify payment accounts?
A: No. Only owners (Club Owners, Organization Admins) can initiate verification because it requires access to payment methods.

### Q: What if WayForPay callback is delayed?
A: The return page will poll for up to 30 seconds. If still pending, user can check back later. The callback will eventually arrive and update the status.

## Monitoring

### Key Logs to Watch

```bash
# Successful verification
[VerificationPaymentService] Payment account {id} marked as VERIFIED

# Failed verification
[VerificationPaymentService] Invalid callback signature for account {id}

# Webhook received
[WayForPay Verification Callback] Received callback: {orderReference}
```

### Database Queries

Check verification status:
```sql
SELECT id, displayName, status, verificationLevel, lastRealVerifiedAt
FROM "PaymentAccount"
WHERE verificationLevel = 'NOT_VERIFIED';
```

Check recent verifications:
```sql
SELECT * FROM "VerificationPayment"
ORDER BY createdAt DESC
LIMIT 10;
```

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify webhook endpoint is accessible
3. Test with sandbox credentials first
4. Contact support with verification payment ID

## Summary

✅ **Benefits:**
- Reliable verification of merchant credentials
- Confidence that payment accounts can process real payments
- Clear owner-initiated flow
- No platform handling of funds

⚠️ **Important Notes:**
- Existing accounts need verification
- Only verified accounts can process bookings
- Minimal cost (1 UAH per account)
- Owner-initiated (not automatic)

🎯 **Goal:**
Ensure all payment accounts on the platform are verified to work with real payments, maintaining the highest level of reliability and trust.
