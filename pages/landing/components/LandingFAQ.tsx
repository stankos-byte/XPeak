import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'What is a "Skill Plan"?',
    answer: 'A Skill Plan is a visual guide for your professional growth. It shows how building over time to get more advanced skills, giving you a clear path for your career.',
  },
  {
    question: 'How do Team Challenges work?',
    answer: 'Team Challenges let you set shared goals with colleagues or friends. Everyone contributes to a common objective, with progress tracked transparently for all members.',
  },
  {
    question: 'How is my data protected?',
    answer: 'Your data is encrypted and stored securely. We never share your personal information with third parties. You can export or delete your data at any time.',
  },
];

export const LandingFAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Common <span className="text-primary">Questions</span>
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-surface/50 border border-secondary/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-white font-bold">{faq.question}</span>
              <ChevronDown 
                size={20} 
                className={`text-primary transition-transform ${openFaq === index ? 'rotate-180' : ''}`} 
              />
            </button>
            {openFaq === index && (
              <div className="px-6 pb-6">
                <p className="text-secondary/70 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
