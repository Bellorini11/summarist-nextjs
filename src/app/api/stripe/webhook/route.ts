import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/server/firebaseAdmin";
import { stripeClient } from "@/lib/server/stripe";
export const runtime = "nodejs";

async function syncSubscription(subscriptionId: string) {
  const stripe = stripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const uid = subscription.metadata.firebaseUID;
  if (!uid) throw new Error("Subscription missing firebaseUID metadata");
  const ref = adminDb().collection("customers").doc(uid);
  const existing = await ref.get();
  const existingSub = existing.data()?.stripeSubscriptionId;
  // Never let events from a different subscription overwrite a currently active one.
  if (existingSub && existingSub !== subscription.id) {
    const other = await stripe.subscriptions
      .retrieve(existingSub)
      .catch(() => null);
    if (other && (other.status === "active" || other.status === "trialing"))
      return;
  }
  await ref.set(
    {
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionPlan: subscription.metadata.plan || null,
      premium:
        subscription.status === "active" || subscription.status === "trialing",
      subscriptionUpdatedAt: Date.now(),
    },
    { merge: true },
  );
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        await syncSubscription(
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id,
        );
      }
    }
    if (
      [
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ].includes(event.type)
    ) {
      await syncSubscription((event.data.object as Stripe.Subscription).id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
