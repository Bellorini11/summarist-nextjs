import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/server/firebaseAdmin";
import { stripeClient } from "@/lib/server/stripe";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer "))
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    const decoded = await adminAuth().verifyIdToken(authorization.slice(7));
    const user = await adminAuth().getUser(decoded.uid);
    if (!user.email || user.providerData.length === 0)
      return NextResponse.json(
        { error: "A registered account is required." },
        { status: 403 },
      );
    const { plan } = await request.json();
    if (plan !== "yearly" && plan !== "monthly")
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    const price =
      plan === "yearly"
        ? process.env.STRIPE_YEARLY_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID;
    if (!price)
      return NextResponse.json(
        { error: "Stripe price is not configured." },
        { status: 503 },
      );

    const origin =
      process.env.APP_URL?.trim() ||
      (process.env.VERCEL === "1"
        ? "https://summarist-nextjs.vercel.app"
        : "http://localhost:3000");

    const parsedUrl = new URL(origin);

    if (
      parsedUrl.protocol !== "https:" &&
      !(parsedUrl.protocol === "http:" && parsedUrl.hostname === "localhost")
    ) {
      throw new Error("APP_URL must be a trusted site URL");
    }

    const stripe = stripeClient();
    const record = await adminDb()
      .collection("customers")
      .doc(decoded.uid)
      .get();
    const existingCustomer = record.data()?.stripeCustomerId;
    const customerParams = existingCustomer
      ? { customer: existingCustomer as string }
      : { customer_email: user.email };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      ...customerParams,
      client_reference_id: decoded.uid,
      metadata: { firebaseUID: decoded.uid, plan },
      subscription_data: {
        metadata: { firebaseUID: decoded.uid, plan },
        ...(plan === "yearly" ? { trial_period_days: 7 } : {}),
      },
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/choose-plan?checkout=cancelled`,
      allow_promotion_codes: false,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error", error);
    return NextResponse.json(
      { error: "Unable to start checkout. Check server configuration." },
      { status: 500 },
    );
  }
}
