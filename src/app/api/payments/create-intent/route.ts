import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePaymentAccountForBooking } from "@/services/paymentAccountService";
import { PaymentProvider } from "@/types/paymentAccount";
import { CreatePaymentIntentRequest, CreatePaymentIntentResponse } from "@/types/booking";

/**
 * POST /api/payments/create-intent
 * 
 * Create a payment intent for a booking
 * 
 * Request body:
 * - bookingId: string
 * 
 * Response:
 * - provider: Payment provider (wayforpay | liqpay)
 * - paymentUrl: Payment URL for redirect
 * - formData: Form data for payment submission
 * - merchantAccount: Masked merchant ID for display
 * - amount: Payment amount in cents
 * - currency: Payment currency
 * - orderReference: Unique order reference
 * 
 * Errors:
 * - 401: Unauthorized (not logged in)
 * - 400: Bad request (missing bookingId)
 * - 404: Booking not found
 * - 403: Forbidden (user doesn't own the booking or booking already paid)
 * - 503: PAYMENT_NOT_AVAILABLE (no active payment account configured)
 */
export async function POST(request: Request): Promise<NextResponse<CreatePaymentIntentResponse | { error: string; code?: string }>> {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as CreatePaymentIntentRequest;
    const { bookingId } = body;

    // Validate request
    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing required field: bookingId" },
        { status: 400 }
      );
    }

    // Fetch the booking with all required information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          select: {
            clubId: true,
            club: {
              select: {
                name: true,
                defaultCurrency: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Check if booking exists
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if user owns the booking
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to pay for this booking" },
        { status: 403 }
      );
    }

    // Check if booking is already paid
    if (booking.paymentStatus === "Paid") {
      return NextResponse.json(
        { error: "This booking has already been paid" },
        { status: 403 }
      );
    }

    // Check if booking is cancelled
    if (booking.bookingStatus === "Cancelled") {
      return NextResponse.json(
        { error: "Cannot pay for a cancelled booking" },
        { status: 403 }
      );
    }

    // Resolve the payment account using the fallback logic
    // This re-evaluates payment availability at payment creation time (security requirement)
    const paymentAccount = await resolvePaymentAccountForBooking(booking.court.clubId);

    if (!paymentAccount) {
      return NextResponse.json(
        { 
          error: "Payment processing is not available for this booking",
          code: "PAYMENT_NOT_AVAILABLE"
        },
        { status: 503 }
      );
    }

    // Generate unique order reference
    const orderReference = `booking-${booking.id}-${Date.now()}`;
    const currency = booking.court.club.defaultCurrency || "UAH";
    const amount = booking.price;

    // Map PaymentProvider enum to lowercase string for response
    const providerMap: Record<PaymentProvider, 'wayforpay' | 'liqpay'> = {
      [PaymentProvider.WAYFORPAY]: 'wayforpay',
      [PaymentProvider.LIQPAY]: 'liqpay',
    };
    const provider = providerMap[paymentAccount.provider];

    // Build response based on provider
    // Note: This is a simplified version - actual implementation would need
    // to generate proper signatures and payment forms for each provider
    const response: CreatePaymentIntentResponse = {
      provider,
      merchantAccount: maskMerchantId(paymentAccount.merchantId),
      amount,
      currency,
      orderReference,
      paymentUrl: generatePaymentUrl(paymentAccount.provider),
      formData: generateFormData(
        paymentAccount.provider,
        paymentAccount.merchantId,
        amount,
        currency,
        orderReference,
        booking
      ),
    };

    // Create a payment record to track this intent
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: provider,
        status: "pending",
        amount: amount,
      },
    });

    // Update booking payment status to PaymentPending
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "PaymentPending",
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PaymentIntent] Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Mask merchant ID for display (show only last 4 characters)
 */
function maskMerchantId(merchantId: string): string {
  if (merchantId.length <= 4) {
    return "****";
  }
  return "****" + merchantId.slice(-4);
}

/**
 * Generate payment URL based on provider
 * In production, these would be actual provider URLs
 */
function generatePaymentUrl(provider: PaymentProvider): string {
  switch (provider) {
    case PaymentProvider.WAYFORPAY:
      return "https://secure.wayforpay.com/pay";
    case PaymentProvider.LIQPAY:
      return "https://www.liqpay.ua/api/3/checkout";
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

/**
 * Generate form data for payment submission
 * Note: This is a simplified placeholder implementation
 * In production, this would generate proper signatures and required fields for each provider
 */
function generateFormData(
  provider: PaymentProvider,
  merchantId: string,
  amount: number,
  currency: string,
  orderReference: string,
  booking: { id: string; user: { email: string; name: string | null } }
): Record<string, unknown> {
  const baseData = {
    merchantAccount: merchantId,
    orderReference,
    amount: (amount / 100).toFixed(2), // Convert cents to currency units
    currency,
    orderDate: new Date().getTime(),
    productName: `Booking ${booking.id}`,
    productCount: 1,
    clientEmail: booking.user.email,
  };

  switch (provider) {
    case PaymentProvider.WAYFORPAY:
      return {
        ...baseData,
        merchantDomainName: process.env.NEXTAUTH_URL || "https://arenaone.com",
        // Note: In production, merchantSignature would be generated here using secretKey
        // merchantSignature: generateSignature(...)
      };
    case PaymentProvider.LIQPAY:
      return {
        ...baseData,
        description: `Payment for booking ${booking.id}`,
        // Note: In production, signature and data would be generated here
        // signature: generateSignature(...)
        // data: base64encode(...)
      };
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
