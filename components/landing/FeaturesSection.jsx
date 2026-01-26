import { Mail, Forward, Inbox, Filter, Paperclip, Shield } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Mail,
      title: "Create Business Email IDs Instantly",
      description: "Unlimited aliases like sales@, support@, team@",
      points: [
        "No mail server setup required",
        "Works with your domain",
        "Instant activation"
      ]
    },
    {
      icon: Forward,
      title: "Flexible Email Handling",
      description: "You decide how emails are received",
      points: [
        "Forward emails to any address",
        "Or receive in private mailbox inside MelMe",
        "Control per alias"
      ]
    },
    {
      icon: Inbox,
      title: "Full Mailbox Experience",
      description: "Complete inbox for your aliases",
      points: [
        "Inbox for aliases",
        "Reply from same address",
        "Gmail-style conversation threads",
        "Secure mailbox login"
      ]
    },
    {
      icon: Paperclip,
      title: "Attachments Handling",
      description: "Safe and efficient file management",
      points: [
        "Detect attachments automatically",
        "Process only when needed",
        "Download safely"
      ]
    },
    {
      icon: Filter,
      title: "Smart Filtering & Control",
      description: "Only receive emails you want",
      points: [
        "Emails only for active aliases",
        "Invalid emails auto removed",
        "Organized per domain & alias"
      ]
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade email security",
      points: [
        "Session-based authentication",
        "Encrypted storage",
        "99.9% uptime"
      ]
    }
  ];

  return (
    <section className="py-20 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Everything you need to manage business emails
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional email management without the complexity
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
