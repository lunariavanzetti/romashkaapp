import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 dark:from-dark dark:via-primary-purple dark:to-primary-green">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 dark:bg-glassDark/80 backdrop-blur-glass rounded-2xl shadow-glass border border-white/20 dark:border-white/10 p-8">
          <h1 className="font-heading text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Privacy Policy
          </h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-primary-pink dark:text-primary-green mb-4">
                ROMASHKA Privacy Policy
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Information We Collect
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support. This may include your name, email address, 
                and any other information you choose to provide.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. How We Use Your Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, 
                to communicate with you, and to develop new features and services.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Information Sharing
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy or as required by law.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Data Security
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Third-Party Services
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our service may integrate with third-party platforms (such as Instagram, WhatsApp, 
                etc.) to provide enhanced functionality. These integrations are subject to the 
                respective platform's privacy policies.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Data Collection and Usage
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                ROMASHKA AI Platform collects and processes data to provide artificial intelligence-powered 
                customer service automation. We collect conversation data, user interactions, and performance 
                metrics to improve our AI responses and service quality.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. AI and Machine Learning
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Our platform uses artificial intelligence and machine learning to analyze and respond to 
                customer inquiries. We may use aggregated and anonymized data to improve our AI models, 
                but we do not share individual personal information with third parties.
              </p>
            </section>

            <section>
              <h3 className="font-heading text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Contact Us
              </h3>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <p className="mb-2">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="space-y-1">
                  <p><strong>Email:</strong> privacy@romashka.com</p>
                  <p><strong>Website:</strong> https://romashkaai.vercel.app</p>
                  <p><strong>Support:</strong> support@romashka.com</p>
                </div>
              </div>
            </section>

            <section className="pt-6 border-t border-gray-200 dark:border-white/20">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This privacy policy is effective as of {new Date().toLocaleDateString()} and will remain 
                in effect except with respect to any changes in its provisions in the future, which will 
                be in effect immediately after being posted on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 