import React from 'react';
import BaseInfoPage from './BaseInfoPage';

const TermsOfService = () => {
  return (
    <BaseInfoPage title="Terms of Use">
      <div className="space-y-8 text-secondary/80 leading-relaxed">
        <p className="italic text-secondary/40">Effective Date: January 18, 2026</p>
        <p>
          By initiating the Xpeak system ("the Service"), you agree to be bound by the following terms. These terms are a legal agreement between you and [Company Name/Your Name] ("the Operator"). If you do not agree, do not deploy the Service.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">1. Scope of Service & Eligibility</h2>
          <div className="space-y-2">
            <p>
              <strong>Professional Tool:</strong> Xpeak is a productivity utility designed for professional and educational use.
            </p>
            <p>
              <strong>Age Requirement:</strong> You must be at least 18 years of age (or the age of majority in your jurisdiction) to use the Service.
            </p>
            <p>
              <strong>Account Responsibility:</strong> You are responsible for maintaining the security of your "Protocol" credentials and all activity that occurs under your account.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">2. AI "System Oracle" & Quest Deployment</h2>
          <div className="space-y-2">
            <p>
              <strong>No Guarantee of Accuracy:</strong> Xpeak utilizes Artificial Intelligence (Google Gemini) to generate task descriptions, quest breakdowns, and advice. You acknowledge that AI is prone to "hallucinations" and may provide incorrect, incomplete, or impractical information.
            </p>
            <p>
              <strong>User Verification Required:</strong> It is your sole responsibility to verify the accuracy, safety, and professional validity of any directive provided by the Oracle or generated through AI "Quest Deployment".
            </p>
            <p>
              <strong>No Professional Advice:</strong> The Oracle is an assistant, not a professional advisor. Directives should not be treated as legal, medical, financial, or certified professional advice.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">3. Gamification, XP, and Competitive Contracts</h2>
          <div className="space-y-2">
            <p>
              <strong>No Monetary Value:</strong> "XP," "Levels," and "Wagers" are purely digital metrics within the Xpeak ecosystem. They have no monetary value and cannot be exchanged for currency or real-world assets.
            </p>
            <p>
              <strong>Anti-Exploit Policy:</strong> You agree not to use automated scripts, bots, or fraudulent data entry to manipulate your XP, level, or "Global Network" rankings. We reserve the right to reset any account found to be exploiting the system.
            </p>
            <p>
              <strong>Competitive Integrity:</strong> During "Competitive Contracts," you agree to truthful task reporting. Repeated false reporting may result in being banned from the Global Network features.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">4. User Conduct & Professionalism</h2>
          <div className="space-y-2">
            <p>
              <strong>The Global Network:</strong> When interacting with other "Operatives," you must maintain a professional standard of conduct. Harassment, hate speech, or abuse in challenge titles or descriptions will result in immediate "System Deletion".
            </p>
            <p>
              <strong>Content Rights:</strong> You retain ownership of your "Identity Core" and "Major Objectives". However, by creating tasks and quests, you grant Xpeak a license to process this data to provide the Service.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">5. Limitation of Liability</h2>
          <div className="space-y-2">
            <p>
              <strong>Productivity Disclaimer:</strong> Xpeak is a tool to facilitate growth. We do not guarantee specific career outcomes, salary increases, or academic success.
            </p>
            <p>
              <strong>Loss of Data:</strong> While we implement professional-grade security, we are not liable for any loss of task history, quest progress, or "Intel Data" due to system failures or unauthorized access.
            </p>
            <p>
              <strong>Indirect Damages:</strong> To the maximum extent permitted by law, the Operator shall not be liable for any indirect, incidental, or consequential damages (including loss of profits) arising from your use of Xpeak.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">6. Termination of Service</h2>
          <div className="space-y-2">
            <p>
              <strong>Right to Terminate:</strong> We reserve the right to suspend or terminate your access to the Service at our discretion, without notice, for violations of these Terms or behavior that compromises the integrity of the Global Network.
            </p>
            <p>
              <strong>Account Deletion:</strong> You may delete your account at any time via the "Profile" tab. Upon deletion, all un-synced data will be purged according to our Privacy Policy.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">7. Subscription & Payments (If Applicable)</h2>
          <div className="space-y-2">
            <p>
              <strong>Billing:</strong> If you choose an "Elite Operator" (Premium) plan, you agree to the recurring billing cycle presented at checkout.
            </p>
            <p>
              <strong>Refunds:</strong> Refunds are handled on a case-by-case basis unless otherwise required by local consumer law.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">8. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of [Insert Your Country/State], without regard to its conflict of law provisions.
          </p>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default TermsOfService;
