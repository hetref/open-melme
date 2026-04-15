"use client"

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSolutionSection from "@/components/landing/ProblemSolutionSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import FreemiumSection from "@/components/landing/FreemiumSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  MelMe
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {isPending ? (
                <div className="h-10 w-28 rounded-full bg-gray-100" />
              ) : session ? (
                <Link
                  href="/domains"
                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium transition-colors"
                >
                  Manage
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Landing Page Sections */}
      <HeroSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <FreemiumSection />
      <PricingSection />
      <FinalCTASection />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-white mb-4">MelMe</div>
              <p className="text-sm">
                Professional domain-based email management for businesses.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} MelMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
