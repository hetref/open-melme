import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
            Start Free. Upgrade anytime.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join businesses using MelMe to manage their domain emails professionally
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
