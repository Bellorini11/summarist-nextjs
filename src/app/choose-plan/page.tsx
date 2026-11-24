"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  Sprout,
  Handshake,
  Check,
} from "lucide-react";
import { useSession } from "@/components/Providers";

type Plan = "yearly" | "monthly";

const benefits = [
  {
    Icon: FileText,
    text: "Key ideas in a few minutes with many books to read",
  },
  { Icon: Sprout, text: "Grow your knowledge every day" },
  {
    Icon: Handshake,
    text: "Recommendations and collections curated by experts",
  },
];

const questions = [
  {
    question: "How does the free 7-day trial work?",
    answer:
      "The Premium Plus Yearly plan includes a 7-day free trial. You can cancel before the trial ends to avoid the first yearly charge. After the trial, the subscription costs $99.99 per year unless cancelled.",
  },
  {
    question: "Does the monthly plan include a free trial?",
    answer:
      "No. Premium Monthly is $9.99 per month, with no trial. Billing begins when the monthly subscription is activated through Stripe.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes. You can manage or cancel your subscription through the Stripe customer portal.",
  },
  {
    question: "What does Premium include?",
    answer:
      "Premium unlocks Read and Listen for both free and Premium books, along with the features available to registered Basic members.",
  },
];

export default function ChoosePlan() {
  const [plan, setPlan] = useState<Plan>("yearly");
  const [expanded, setExpanded] = useState<number | null>(0);
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const { user, openLogin } = useSession();

  function selectPlan(next: Plan) {
    setPlan(next);
    setCheckoutNotice("");
  }

  async function handleCheckout() {
    if (!user || user.isAnonymous) {
      openLogin();
      return;
    }
    setCheckoutBusy(true);
    setCheckoutNotice("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok || !data.url)
        throw new Error(data.error || "Checkout could not start.");
      window.location.assign(data.url);
    } catch (error) {
      setCheckoutNotice(
        error instanceof Error ? error.message : "Checkout could not start.",
      );
      setCheckoutBusy(false);
    }
  }

  const yearly = plan === "yearly";

  return (
    <div className="min-h-screen bg-white text-[#063047]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 text-xl font-black">
          <BookOpen className="text-[#28d77e]" aria-hidden="true" />
          Summarist
        </Link>
        <Link href="/for-you" className="text-sm font-semibold hover:underline">
          Explore books
        </Link>
      </header>

      <main>
        <section className="bg-[#062e43] px-5 pt-16 text-center text-white md:pt-20">
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
            Get unlimited access to many amazing books to read
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed md:text-xl">
            Turn ordinary moments into amazing learning opportunities
          </p>
          <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-t-[50%] bg-white px-3 pt-7">
            <img
              src="/assets/pricing-top.png"
              alt="Illustration of a person presenting a book summary"
              className="mx-auto w-full object-contain"
            />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-6 pt-14 text-center">
          <div className="mx-auto mb-10 h-1 w-16 rounded-full bg-[#063047]" />
          <div className="grid gap-11">
            {benefits.map(({ Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-4">
                <Icon size={55} strokeWidth={2.3} aria-hidden="true" />
                <p className="max-w-xl text-lg font-semibold leading-relaxed md:text-xl">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="mx-auto max-w-3xl px-5 pb-20 pt-14"
          aria-labelledby="plans-heading"
        >
          <h2
            id="plans-heading"
            className="mb-9 text-center text-3xl font-extrabold md:text-4xl"
          >
            Choose the plan that fits you
          </h2>

          <div
            role="radiogroup"
            aria-label="Subscription plan"
            className="space-y-5"
          >
            <button
              type="button"
              role="radio"
              aria-checked={yearly}
              onClick={() => selectPlan("yearly")}
              className={`flex w-full items-start gap-6 rounded-lg border-[3px] bg-[#f0f6f5] p-6 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#063047] ${yearly ? "border-[#28d77e]" : "border-[#bacbd0]"}`}
            >
              <span
                className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[3px] border-black ${yearly ? "bg-white" : ""}`}
              >
                {yearly && <span className="h-3 w-3 rounded-full bg-black" />}
              </span>
              <span>
                <span className="block text-lg font-bold">
                  Premium Plus Yearly
                </span>
                <span className="mt-1 block text-2xl font-extrabold">
                  $99.99/year
                </span>
                <span className="mt-2 block text-sm text-gray-500">
                  7-day free trial included
                </span>
              </span>
            </button>

            <div className="flex items-center gap-5 px-6 text-gray-500">
              <span className="h-px flex-1 bg-gray-300" />
              or
              <span className="h-px flex-1 bg-gray-300" />
            </div>

            <button
              type="button"
              role="radio"
              aria-checked={!yearly}
              onClick={() => selectPlan("monthly")}
              className={`flex w-full items-start gap-6 rounded-lg border-[3px] bg-[#f0f6f5] p-6 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#063047] ${!yearly ? "border-[#28d77e]" : "border-[#bacbd0]"}`}
            >
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[3px] border-black">
                {!yearly && <span className="h-3 w-3 rounded-full bg-black" />}
              </span>
              <span>
                <span className="block text-lg font-bold">Premium Monthly</span>
                <span className="mt-1 block text-2xl font-extrabold">
                  $9.99/month
                </span>
                <span className="mt-2 block text-sm text-gray-500">
                  No trial included
                </span>
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutBusy}
            className="mx-auto mt-10 block w-full max-w-xl rounded-lg bg-[#28d77e] px-6 py-4 text-center text-lg font-semibold text-[#063047] transition hover:bg-[#22c76f]"
          >
            {checkoutBusy
              ? "Opening secure checkout..."
              : yearly
                ? "Start your free 7-day trial"
                : "Start your first month"}
          </button>
          {yearly && (
            <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-gray-500">
              Cancel your trial at any time before it ends, and you won’t be
              charged.
            </p>
          )}
          {!yearly && (
            <p className="mx-auto mt-4 max-w-xl text-center text-sm text-gray-500">
              No trial included. $9.99 per month, billed through Stripe.
            </p>
          )}
          {checkoutNotice && (
            <p
              role="status"
              className="mx-auto mt-5 max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-900"
            >
              {checkoutNotice}
            </p>
          )}

          <div className="mt-16 space-y-3">
            {questions.map(({ question, answer }, index) => (
              <div key={question} className="border-b border-gray-200 pb-4">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === index ? null : index)}
                  aria-expanded={expanded === index}
                  className="flex w-full items-center justify-between gap-4 py-3 text-left text-lg font-bold"
                >
                  {question}
                  <ChevronDown
                    className={`shrink-0 transition-transform ${expanded === index ? "rotate-180" : ""}`}
                    size={22}
                  />
                </button>
                {expanded === index && (
                  <p className="pb-3 leading-7 text-gray-700">{answer}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-gray-500">
            <Check size={16} aria-hidden="true" /> Secure checkout powered by
            Stripe
          </p>
        </section>
      </main>
    </div>
  );
}
