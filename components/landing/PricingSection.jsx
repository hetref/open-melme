"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");

  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out MelMe",
      price: {
        monthly: 0,
        yearly: 0
      },
      features: [
        "1 Domain",
        "10 Aliases",
        "1 Mailbox",
        "Receive & reply emails",
        "Manual attachment processing",
        "Community support"
      ],
      cta: "Start Free",
      href: "/register",
      highlighted: false
    },
    {
      name: "Growth",
      description: "Best for growing businesses",
      price: {
        monthly: 29,
        yearly: 290
      },
      features: [
        "5 Domains",
        "250 Aliases",
        "10 Mailboxes",
        "Conversations & replies",
        "Automatic attachments",
        "Priority email support",
        "Advanced filtering"
      ],
      cta: "Start Growth Plan",
      href: "/register",
      highlighted: true,
      badge: "Most Popular"
    },
    {
      name: "Pro",
      description: "For businesses at scale",
      price: {
        monthly: 99,
        yearly: 990
      },
      features: [
        "Unlimited Domains",
        "Unlimited Aliases",
        "Unlimited Mailboxes",
        "Advanced inbox features",
        "Custom subdomain support",
        "Dedicated support",
        "SLA guarantee",
        "Custom plan available"
      ],
      cta: "Start Pro Plan",
      href: "/register",
      highlighted: false
    }
  ];

  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Start free, upgrade as you grow
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs text-green-600 font-semibold">Save 17%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl ${
                  plan.highlighted
                    ? "bg-linear-to-b from-blue-50 to-white border-2 border-blue-500 shadow-xl"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium shadow-lg">
                      <Star className="h-4 w-4 fill-current" />
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${plan.price[billingPeriod]}
                      </span>
                      {plan.price.monthly > 0 && (
                        <span className="text-gray-600">
                          /{billingPeriod === "monthly" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                    {billingPeriod === "yearly" && plan.price.yearly > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${(plan.price.yearly / 12).toFixed(2)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link href={plan.href}>
                    <Button
                      className={`w-full mb-6 ${
                        plan.highlighted
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Enterprise Note */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Need a custom plan for your enterprise?{" "}
              <a href="mailto:enterprise@melme.com" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
