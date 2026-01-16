import React from 'react';
import BaseInfoPage from './BaseInfoPage';
import { Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react';

const Support = () => {
  const supportChannels = [
    {
      icon: <HelpCircle className="text-primary" />,
      title: "Help Center",
      description: "Browse our comprehensive guides and articles for immediate answers.",
      buttonText: "Visit Help Center"
    },
    {
      icon: <MessageCircle className="text-emerald-500" />,
      title: "Community Discord",
      description: "Join our active community to get help from fellow adventurers.",
      buttonText: "Join Discord"
    },
    {
      icon: <Mail className="text-pink-500" />,
      title: "Email Support",
      description: "Need direct assistance? Our support team is here to help.",
      buttonText: "Send Email"
    },
    {
      icon: <FileText className="text-orange-500" />,
      title: "Status Page",
      description: "Check the real-time status of our servers and services.",
      buttonText: "View Status"
    }
  ];

  return (
    <BaseInfoPage title="Support">
      <div className="space-y-12">
        <p className="text-lg text-secondary/80 leading-relaxed max-w-2xl">
          We're here to help you on your journey. Whether you're encountering a bug or have a question about how to use XPeak, 
          choose the channel that works best for you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {supportChannels.map((channel, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                {channel.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{channel.title}</h3>
              <p className="text-secondary/60 text-sm leading-relaxed mb-8 flex-1">
                {channel.description}
              </p>
              <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-bold transition-all text-sm">
                {channel.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center max-w-2xl mx-auto">
          <h4 className="text-white font-bold mb-2">Technical Issue?</h4>
          <p className="text-secondary/70 text-sm mb-6">
            If you're experiencing a technical problem, please include your device type and account email when contacting us.
          </p>
          <a href="mailto:support@xpeak.app" className="text-primary font-black hover:underline">support@xpeak.app</a>
        </div>
      </div>
    </BaseInfoPage>
  );
};

export default Support;
