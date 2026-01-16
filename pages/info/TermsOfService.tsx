import React from 'react';
import BaseInfoPage from './BaseInfoPage';

const TermsOfService = () => {
  return (
    <BaseInfoPage title="Terms of Service">
      <div className="space-y-8 text-secondary/80 leading-relaxed">
        <p className="italic text-secondary/40">Last Updated: January 15, 2026</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using XPeak, you agree to be bound by these Terms of Service. If you do not agree to all of 
            these terms, you may not use our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. User Conduct</h2>
          <p>
            You are responsible for your use of XPeak and for any content you post. You agree not to use the service for 
            any unlawful purpose or in a way that interferes with the rights of others.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. Intellectual Property</h2>
          <p>
            The XPeak service, including its original content, features, and functionality, is and will remain the 
            exclusive property of XPeak. Our trademarks and trade dress may not be used in connection with any product 
            or service without our prior written consent.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the service immediately, without prior notice or 
            liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">5. Limitation of Liability</h2>
          <p>
            In no event shall XPeak be liable for any indirect, incidental, special, consequential, or punitive damages, 
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default TermsOfService;
