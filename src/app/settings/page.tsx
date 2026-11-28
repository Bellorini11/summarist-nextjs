"use client";

import Link from "next/link";
import { useSession } from "@/components/Providers";

export default function Settings() {
  const {
    user,
    loading,
    premium,
    subscriptionPlan,
    premiumLoading,
    openLogin,
  } = useSession();

  // Wait for Firebase to check the current login session.
  if (loading || premiumLoading) {
    return (
      <div
        className="mx-auto max-w-3xl"
        role="status"
        aria-label="Loading settings"
      >
        <h1 className="mb-8 text-4xl font-black text-gray-900">Settings</h1>

        <div className="animate-pulse space-y-8">
          <section>
            <h2 className="text-sm font-medium text-gray-500">
              Your Subscription Plan
            </h2>

            <div className="mt-3 h-6 w-32 rounded bg-gray-200" />

            <div className="mt-5 h-14 w-full max-w-md rounded-lg bg-gray-200" />
          </section>

          <hr className="border-gray-200" />

          <section>
            <h2 className="text-sm font-medium text-gray-500">Email</h2>

            <div className="mt-3 h-6 w-full max-w-xs rounded bg-gray-200" />
          </section>
        </div>
      </div>
    );
  }

  // Only signed-out visitors must log in.
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <img
          src="/assets/login.png"
          alt="Login illustration"
          className="mb-8 max-h-72 w-full object-contain"
        />

        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Log in to your account to see your details.
        </h1>

        <button
          type="button"
          onClick={openLogin}
          className="mt-8 w-full max-w-sm rounded-lg bg-emerald-400 px-8 py-4 text-base font-bold text-gray-900 transition hover:bg-emerald-500"
        >
          Login
        </button>
      </div>
    );
  }

  // Guests always have a Basic subscription.
  const isGuest = user.isAnonymous;
  const hasPremium = !isGuest && premium;

  const plan = hasPremium
    ? subscriptionPlan === "yearly"
      ? "Premium Plus"
      : "Premium"
    : "Basic";

  // Display the requested guest email without sharing Firebase accounts.
  const email = isGuest
    ? "guest@gmail.com"
    : user.email || "No email associated with this account";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-4xl font-black text-gray-900">Settings</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-medium text-gray-500">
            Your Subscription Plan
          </h2>

          <p className="mt-2 text-xl font-bold text-gray-900">{plan}</p>

          {!hasPremium && (
            <Link
              href="/choose-plan"
              className="mt-5 flex w-full max-w-md items-center justify-center rounded-lg bg-emerald-400 px-6 py-4 font-bold text-gray-900 transition hover:bg-emerald-500"
            >
              Upgrade to Premium
            </Link>
          )}
        </section>

        <hr className="border-gray-200" />

        <section>
          <h2 className="text-sm font-medium text-gray-500">Email</h2>

          <p className="mt-2 break-all text-lg font-bold text-gray-900">
            {email}
          </p>
        </section>
      </div>
    </div>
  );
}
