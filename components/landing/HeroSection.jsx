import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-20 pb-24 sm:pt-24 sm:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Main Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Create unlimited business emails for your domain{" "}
            <span className="text-blue-600">in seconds</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl max-w-3xl mx-auto">
            Create custom email IDs for your domain, receive them in your MelMe inbox or forward anywhere,
            reply using the same alias, and control everything from one powerful dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8 py-6 rounded-full border-2 hover:bg-gray-50"
              >
                Login
              </Button>
            </Link>
          </div>

          {/* Trust Line */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4 text-green-600" />
            <span>No credit card required · Setup in minutes</span>
          </div>

          {/* Visual Element */}
          <div className="mt-16 relative">
            <div className="relative rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10 p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    S
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">sales@yourdomain.com</div>
                    <div className="text-sm text-gray-500">Forward to team@company.com</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Active
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                    S
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">support@yourdomain.com</div>
                    <div className="text-sm text-gray-500">Receive in MelMe Mailbox</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Active
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold">
                    T
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">team@yourdomain.com</div>
                    <div className="text-sm text-gray-500">Receive in MelMe Mailbox</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
