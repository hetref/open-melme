import { X, Check } from "lucide-react";

export default function ProblemSolutionSection() {
  const problems = [
    "Too many emails mixed in one inbox",
    "Spam hitting important business addresses",
    "No structured departmental emails",
    "Hard to control forwarded emails",
    "Missing replies & tracking issues"
  ];

  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Problem Side */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Common Business Email Challenges
            </h2>
            <p className="text-lg text-gray-600">
              Managing business emails shouldn't be complicated
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Problems */}
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex-shrink-0 mt-0.5">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-gray-700">{problem}</p>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="flex flex-col justify-center">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    MelMe Solves This
                  </h3>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  All your domain emails organized, controlled and secure.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Create unlimited business email addresses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Forward or receive in private mailbox</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Reply from the same address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">One dashboard to control everything</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
