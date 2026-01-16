import React from 'react';
import BaseInfoPage from './BaseInfoPage';

const PrivacyPolicy = () => {
  return (
    <BaseInfoPage title="Privacy Policy">
      <div className="space-y-8 text-secondary/80 leading-relaxed">
        <p className="italic text-secondary/40">Last Updated: January 15, 2026</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
          <p>
            When you use XPeak, we collect information that you provide directly to us, such as when you create an account, 
            update your profile, create quests, and complete tasks. This may include your username, email address, and 
            productivity data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services;</li>
            <li>Personalize your experience and track your progress;</li>
            <li>Communicate with you about updates, challenges, and support;</li>
            <li>Analyze usage patterns to improve app performance and user experience.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information only in limited circumstances, 
            such as with your consent, to comply with legal obligations, or with service providers who assist in our operations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
          <p>
            We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access. 
            However, no internet transmission is 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">5. Your Choices</h2>
          <p>
            You can access and update your profile information through the app settings. You may also delete your account 
            at any time, which will remove your personal data from our active systems.
          </p>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default PrivacyPolicy;
