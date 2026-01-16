import React from 'react';
import BaseInfoPage from './BaseInfoPage';
import { HelpCircle, ChevronRight, Search, Book, Shield, Zap, Users, Info } from 'lucide-react';

const FAQ = () => {
  const categories = [
    {
      name: "Getting Started",
      icon: <Info size={18} />,
      items: [
        {
          question: "What is XPeak?",
          answer: "XPeak is a productivity platform that helps you track your tasks and measure your progress across different areas of life. By completing tasks, you build momentum and see your growth visualized in clear, motivating ways."
        },
        {
          question: "How do I track my progress?",
          answer: "Progress is tracked automatically when you complete tasks. The amount of progress depends on the difficulty and importance you assign to each task. Daily habits provide consistent growth, while major projects offer larger milestones."
        },
        {
          question: "Is XPeak available on mobile?",
          answer: "Yes! XPeak is a cross-platform application. You can track your progress on iOS, Android, and Web. Your data is synced automatically across all devices."
        }
      ]
    },
    {
      name: "Features",
      icon: <Zap size={18} />,
      items: [
        {
          question: "What are Skill Categories?",
          answer: "Skill Categories are how we organize your personal growth. We currently have five core areas: Physical (fitness/health), Mental (learning/focus), Professional (work/career), Social (relationships), and Creative (hobbies/projects). As you complete tasks in these areas, that specific category shows your progress."
        },
        {
          question: "What happens if I miss a deadline?",
          answer: "In XPeak, there's no harsh punishment—just gentle feedback. If you miss a deadline for a recurring habit, you might see your streak reset, but you can always restart and rebuild. We focus on progress, not perfection."
        },
        {
          question: "How does Team Collaboration work?",
          answer: "You can invite up to 4 colleagues or friends to join your team. Once in a team, you can tackle group challenges together, share motivation in the team chat, and see each other's recent progress on the team dashboard."
        }
      ]
    },
    {
      name: "Account & Privacy",
      icon: <Shield size={18} />,
      items: [
        {
          question: "Is my data secure?",
          answer: "Absolutely. We use industry-standard encryption to protect your data. Your productivity logs are private by default and are only shared with your team members if you explicitly choose to do so."
        },
        {
          question: "Can I export my data?",
          answer: "Yes, you can export your entire task history and progress logs at any time from the Settings menu in CSV or JSON format."
        }
      ]
    },
    {
      name: "Teams",
      icon: <Users size={18} />,
      items: [
        {
          question: "How many people can be on a team?",
          answer: "Teams are limited to 5 members (including you). This ensures everyone stays accountable and the experience remains personal and focused."
        },
        {
          question: "What are Team Challenges?",
          answer: "Team Challenges are group goals with shared rewards. They require every team member to complete specific tasks within a timeframe to achieve the shared objective and celebrate together."
        }
      ]
    }
  ];

  return (
    <BaseInfoPage title="Frequently Asked Questions">
      <div className="space-y-20">
        <header className="space-y-8">
          <p className="text-2xl text-secondary/80 leading-relaxed max-w-3xl">
            New to XPeak? Here's everything you need to know about getting started and making the most of the platform.
          </p>

          <div className="relative max-w-2xl group">
             <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search size={20} className="text-secondary/40 group-focus-within:text-primary transition-colors" />
             </div>
             <input 
                type="text" 
                placeholder="Search questions (e.g., 'how to track progress')"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-white placeholder:text-secondary/40 focus:outline-none focus:border-primary focus:bg-white/10 transition-all shadow-xl shadow-black/10"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                <span className="text-[10px] font-black text-secondary/40 uppercase">Press</span>
                <span className="text-[10px] font-black text-white px-1.5 py-0.5 bg-white/10 rounded-md">/</span>
                <span className="text-[10px] font-black text-secondary/40 uppercase">to search</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
          {/* Quick Nav Sidebar */}
          <aside className="lg:col-span-1 space-y-4 sticky top-32 hidden lg:block">
            <div className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Book size={12} /> Categories
            </div>
            {categories.map((category, i) => (
              <button 
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-secondary/60 hover:text-white transition-all text-sm font-bold border border-transparent hover:border-white/5"
              >
                <span className="text-primary/60">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </aside>

          {/* FAQ Content */}
          <div className="lg:col-span-3 space-y-16">
            {categories.map((category, catIndex) => (
              <div key={catIndex} className="space-y-8">
                <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                    {category.icon}
                  </div>
                  {category.name}
                </h2>
                
                <div className="grid grid-cols-1 gap-4">
                  {category.items.map((item, itemIndex) => (
                    <details 
                      key={itemIndex} 
                      className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                    >
                      <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                        <span className="text-lg font-black text-white group-open:text-primary transition-colors pr-8 leading-tight">
                          {item.question}
                        </span>
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                          <ChevronRight className="group-open:rotate-90 transition-transform" />
                        </div>
                      </summary>
                      <div className="px-8 pb-8 pt-0">
                        <div className="h-px bg-white/5 mb-8"></div>
                        <p className="text-secondary/70 leading-relaxed text-base font-medium">
                          {item.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <section className="relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[3rem] p-12 md:p-16 text-center border border-white/10 overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(59,130,246,0.1),_transparent)] pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 transform group-hover:rotate-12 transition-transform duration-500">
              <HelpCircle size={40} className="text-white" />
            </div>
            <h3 className="text-3xl font-black text-white mb-6">Still have questions?</h3>
            <p className="text-secondary/80 mb-10 max-w-xl mx-auto leading-relaxed text-lg">
              Our support team is standing by 24/7 to help you with any technical issues or questions. We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-primary text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                Contact Support
              </button>
              <button className="px-8 py-5 text-white/60 hover:text-white transition-colors font-bold text-sm">
                Join our community
              </button>
            </div>
          </div>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default FAQ;
