import { Sparkles } from "lucide-react";

export default function FreemiumSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-blue-100">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Try MelMe Free
              </h2>
            </div>
            
            <p className="text-lg text-gray-700 text-center mb-8 max-w-2xl mx-auto">
              Start with our free plan and experience the power of organized business emails. 
              Create your first domain, set up aliases, and manage emails from one dashboard—no credit card required.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl font-bold text-blue-600 mb-1">1</div>
                <div className="text-sm text-gray-600">Domain</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl font-bold text-blue-600 mb-1">10</div>
                <div className="text-sm text-gray-600">Email Aliases</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gray-50">
                <div className="text-3xl font-bold text-blue-600 mb-1">1</div>
                <div className="text-sm text-gray-600">Mailbox</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Perfect for testing MelMe with your domain. Upgrade anytime as your needs grow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
