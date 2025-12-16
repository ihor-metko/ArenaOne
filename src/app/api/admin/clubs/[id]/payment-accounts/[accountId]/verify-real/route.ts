import { NextResponse } from "next/server";
import { requireClubOwner } from "@/lib/requireRole";
import { auditLog } from "@/lib/auditLog";
import {
  getMaskedPaymentAccount,
} from "@/services/paymentAccountService";
import { initiateRealPaymentVerification } from "@/services/verificationPaymentService";

/**
 * POST /api/admin/clubs/[id]/payment-accounts/[accountId]/verify-real
 * 
 * Initiate a real payment verification for a club payment account.
 * Creates a minimal payment intent (1 UAH) and returns checkout URL.
 * 
 * Access: Club Owner only
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  const resolvedParams = await params;
  const { id: clubId, accountId } = resolvedParams;

  const authResult = await requireClubOwner(clubId);

  if (!authResult.authorized) {
    return authResult.response;
  }

  // Root admins cannot initiate verification (no access to sensitive operations)
  if (authResult.isRoot) {
    return NextResponse.json(
      { error: "Root admins cannot initiate payment verification" },
      { status: 403 }
    );
  }

  try {
    // Verify the account exists and belongs to this club
    const existingAccount = await getMaskedPaymentAccount(accountId);
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: "Payment account not found" },
        { status: 404 }
      );
    }

    if (existingAccount.clubId !== clubId) {
      return NextResponse.json(
        { error: "Payment account does not belong to this club" },
        { status: 403 }
      );
    }

    // Initiate the verification payment
    const verificationIntent = await initiateRealPaymentVerification(
      accountId,
      authResult.userId
    );

    // Log audit event
    await auditLog(
      authResult.userId,
      "payment_account.verify_real",
      "club",
      clubId,
      {
        paymentAccountId: accountId,
        verificationPaymentId: verificationIntent.id,
      }
    );

    return NextResponse.json({
      message: "Verification payment initiated. Please complete the payment to verify your account.",
      verificationPayment: verificationIntent,
    });
  } catch (error) {
    console.error("Error initiating verification payment:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to initiate verification payment" },
      { status: 500 }
    );
  }
}
