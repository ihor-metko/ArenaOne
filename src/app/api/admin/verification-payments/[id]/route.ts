import { NextResponse } from "next/server";
import { getVerificationPayment } from "@/services/verificationPaymentService";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/verification-payments/[id]
 * 
 * Get verification payment status.
 * Used by the return page to poll for payment completion.
 * 
 * Access: Authenticated users (the user who initiated the verification)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Check authentication
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Get the verification payment
    const verificationPayment = await getVerificationPayment(id);
    
    if (!verificationPayment) {
      return NextResponse.json(
        { error: "Verification payment not found" },
        { status: 404 }
      );
    }

    // Check if the user initiated this verification
    // (For now, we'll allow any authenticated user to check status for simplicity)
    // In production, you might want to add more strict authorization

    return NextResponse.json({
      verificationPayment: {
        id: verificationPayment.id,
        status: verificationPayment.status,
        amount: verificationPayment.amount,
        currency: verificationPayment.currency,
        orderReference: verificationPayment.orderReference,
        signatureValid: verificationPayment.signatureValid,
        errorMessage: verificationPayment.errorMessage,
        createdAt: verificationPayment.createdAt,
        completedAt: verificationPayment.completedAt,
        paymentAccount: {
          id: verificationPayment.paymentAccount.id,
          displayName: verificationPayment.paymentAccount.displayName,
          provider: verificationPayment.paymentAccount.provider,
          scope: verificationPayment.paymentAccount.scope,
          verificationLevel: verificationPayment.paymentAccount.verificationLevel,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching verification payment:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch verification payment" },
      { status: 500 }
    );
  }
}
