import { NextResponse } from "next/server";
import { handleVerificationCallback } from "@/services/verificationPaymentService";

/**
 * POST /api/webhooks/wayforpay/verification
 * 
 * WayForPay callback endpoint for verification payments.
 * This endpoint is called by WayForPay after a verification payment is processed.
 * It validates the signature and updates the payment account verification status.
 * 
 * Access: Public (called by WayForPay)
 * 
 * Security: Signature validation is performed to ensure the callback is authentic
 */
export async function POST(request: Request) {
  try {
    // Parse the callback data
    const callbackData = await request.json();

    console.log("[WayForPay Verification Callback] Received callback:", {
      orderReference: callbackData.orderReference,
      transactionStatus: callbackData.transactionStatus,
      merchantAccount: callbackData.merchantAccount,
    });

    // Handle the verification callback
    const result = await handleVerificationCallback(callbackData);

    if (result.success) {
      console.log("[WayForPay Verification Callback] Success:", result.message);
      
      // WayForPay expects a specific response format
      return NextResponse.json({
        orderReference: callbackData.orderReference,
        status: "accept",
        time: Math.floor(Date.now() / 1000),
      });
    } else {
      console.error("[WayForPay Verification Callback] Failed:", result.message);
      
      // Still return accept to prevent retries, but log the failure
      return NextResponse.json({
        orderReference: callbackData.orderReference,
        status: "accept",
        time: Math.floor(Date.now() / 1000),
      });
    }
  } catch (error) {
    console.error("[WayForPay Verification Callback] Error processing callback:", error);
    
    // Return a 200 response even on error to prevent WayForPay from retrying
    // The error is logged and can be investigated
    return NextResponse.json({
      status: "accept",
      time: Math.floor(Date.now() / 1000),
    });
  }
}
