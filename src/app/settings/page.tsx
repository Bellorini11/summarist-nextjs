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
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-label="Loading settings"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500" />
      </div>
    );
  }

  // Guests and signed-out visitors must log in.
  const needsLogin = !user || user.isAnonymous;

  if (needsLogin) {
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

  // Registered members see their actual account details.
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-4xl font-black text-gray-900">Settings</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-medium text-gray-500">
            Your Subscription Plan
          </h2>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {premium
              ? subscriptionPlan === "yearly"
                ? "Premium Plus"
                : "Premium"
              : "Basic"}
          </p>

          {!premium && (
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
            {user.email || "No email associated with this account"}
          </p>
        </section>
      </div>
    </div>
  );
}
