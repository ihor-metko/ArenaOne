# Email Service Documentation

## Overview

The ArenaOne platform uses a centralized email service for sending transactional emails. The service is built using [Resend](https://resend.com) as the email provider and is designed to be easily replaceable if needed in the future.

## Architecture

### Email Service Layer (`src/services/emailService.ts`)

The email service is completely isolated from business logic and provides a simple API for sending emails:

- **No database access**: The service doesn't query or modify the database
- **No permission checks**: Business logic handles all authorization
- **Provider abstraction**: Resend is abstracted behind a simple interface

### Current Features

1. **Invite Emails**: Send invitations to users for organizations and clubs
2. **Resend Support**: Ability to resend invites with new tokens
3. **Error Handling**: Graceful failure handling with logging

## Configuration

### Environment Variables

```bash
# Required: Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Optional: Custom sender email
EMAIL_FROM="ArenaOne <noreply@yourdomain.com>"

# Required: Application base URL for generating links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Getting a Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Navigate to API Keys section
3. Create a new API key
4. Add it to your `.env` file as `RESEND_API_KEY`

### Verifying Email Domain

For production use, you should verify your sending domain:

1. Go to Resend dashboard → Domains
2. Add your domain
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Wait for verification
5. Update `EMAIL_FROM` to use your verified domain

## Usage

### Sending Invite Emails

The invite email is automatically sent when creating an invite via the API:

```typescript
// POST /api/invites
{
  "email": "user@example.com",
  "role": "ORGANIZATION_ADMIN",
  "organizationId": "org-123"
}
```

This will:
1. Create the invite in the database
2. Generate a secure token
3. Send an email with the invite link
4. Return the invite details

The email sending happens asynchronously and won't block the invite creation. If email sending fails, the invite is still created and can be resent later.

### Resending Invites

To resend an invite:

```typescript
// POST /api/invites/[inviteId]/resend
```

This will:
1. Validate the invite is still valid (PENDING status, not expired)
2. Check permissions (only inviter or admin can resend)
3. Generate a new token
4. Send the email
5. Return success

## Email Templates

### Invite Email Template

The invite email includes:

- **Professional HTML design** with responsive layout
- **Clear call-to-action button** for accepting the invite
- **Role information**: What role the user is being invited to
- **Organization/Club name**: Which entity they're joining
- **Inviter name** (if available): Who sent the invitation
- **Expiration notice**: Reminder that invite expires in 7 days
- **Branded footer** with support contact

## Security

### Token Security

- Tokens are randomly generated using 256 bits of entropy
- Only token hashes are stored in the database (SHA-256)
- Tokens are single-use and expire after 7 days
- Tokens are only returned once at creation time

### Email Security

- No sensitive data is included in email bodies
- Links use secure tokens that can't be guessed
- Failed invites can be tracked and monitored

## Error Handling

The email service handles errors gracefully:

1. **Email sending failure**: Logs error but doesn't fail invite creation
2. **Provider unavailable**: Returns error details for resend attempts
3. **Invalid configuration**: Logs warning if RESEND_API_KEY is missing

## Testing

### Unit Tests

Tests are located in `src/__tests__/email-service.test.ts` and cover:

- Successful email sending
- Error handling
- Template rendering
- Role formatting
- Inviter name inclusion

Run tests with:

```bash
npm test -- email-service.test.ts
```

### Testing in Development

In development, you can use Resend's test mode which won't send actual emails but will show them in the Resend dashboard.

## Future Extensibility

The email service is designed to support additional email types:

- Password reset emails
- Welcome emails
- Notification emails
- Booking confirmations
- Payment receipts

To add a new email type:

1. Create a new function in `emailService.ts` (e.g., `sendPasswordResetEmail`)
2. Create an HTML template function
3. Add appropriate parameters interface
4. Export the function

Example:

```typescript
export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams
): Promise<EmailResult> {
  // Implementation
}
```

## Replacing the Email Provider

To replace Resend with another provider:

1. Install new provider SDK: `npm install other-provider`
2. Update imports in `emailService.ts`
3. Replace Resend client initialization
4. Update the `send` call in each email function
5. Update tests to mock new provider
6. Update environment variable documentation

The rest of the application code won't need to change because it only depends on the `emailService` API, not the provider directly.

## Monitoring

### Logs

All email sending attempts are logged:

```typescript
// Success
console.log(`Invite email sent successfully to ${to}, messageId: ${messageId}`);

// Failure
console.error("Failed to send invite email (invite was still created):", error);
```

### Resend Dashboard

Monitor email delivery, bounces, and complaints in the Resend dashboard:
- https://resend.com/emails

## Troubleshooting

### Emails Not Sending

1. **Check API key**: Ensure `RESEND_API_KEY` is set correctly
2. **Check domain verification**: For production, verify your sending domain
3. **Check logs**: Look for error messages in application logs
4. **Check Resend dashboard**: See if emails are being rejected

### Emails Going to Spam

1. **Verify domain**: Make sure SPF, DKIM, and DMARC records are configured
2. **Warm up domain**: Send emails gradually when starting
3. **Monitor reputation**: Check domain reputation in Resend dashboard
4. **Content**: Avoid spam trigger words in templates

### Rate Limits

Resend has rate limits based on your plan:

- Free tier: 100 emails/day
- Pro tier: Higher limits

If you hit rate limits:
1. Upgrade your Resend plan
2. Implement email queuing
3. Batch email sends

## API Reference

### `sendInviteEmail(params: InviteEmailParams): Promise<EmailResult>`

Sends an invitation email.

**Parameters:**
```typescript
{
  to: string;              // Recipient email
  inviteLink: string;      // Full URL to accept invite
  role: string;            // Invite role (ORGANIZATION_ADMIN, etc.)
  organizationName?: string;  // Organization name (for org invites)
  clubName?: string;       // Club name (for club invites)
  inviterName?: string;    // Name of person sending invite
}
```

**Returns:**
```typescript
{
  success: boolean;        // Whether email was sent successfully
  messageId?: string;      // Resend message ID (if successful)
  error?: string;          // Error message (if failed)
}
```

### `isEmailServiceConfigured(): boolean`

Checks if email service is properly configured.

**Returns:** `true` if RESEND_API_KEY is set, `false` otherwise.

## Best Practices

1. **Always use email service**: Never call email providers directly from business logic
2. **Handle failures gracefully**: Don't block operations if email fails
3. **Log everything**: Log both successes and failures for monitoring
4. **Test templates**: Preview email templates before deploying
5. **Keep it simple**: Email templates should be clean and responsive
6. **Respect privacy**: Don't include sensitive data in emails
7. **Provide alternatives**: Allow users to access features even if they miss the email

## Support

For issues or questions:
- Check Resend documentation: https://resend.com/docs
- Review application logs
- Contact support: support@arenaone.com
