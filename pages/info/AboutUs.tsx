import React from 'react';
import BaseInfoPage from './BaseInfoPage';
import { Zap, Globe, Heart, Rocket, Users, Target, Sparkles, Quote, Image } from 'lucide-react';

const AboutUs = () => {
  const values = [
    {
      icon: <Zap size={24} className="text-primary" />,
      title: "Action Oriented",
      desc: "We believe in the power of doing. Every feature we build is designed to reduce friction and encourage immediate action."
    },
    {
      icon: <Sparkles size={24} className="text-pink-500" />,
      title: "Sustainable Growth",
      desc: "Self-improvement doesn't have to be overwhelming. We combine psychology with simple tools to make growth sustainable."
    },
    {
      icon: <Globe size={24} className="text-blue-500" />,
      title: "Global Community",
      desc: "Productivity is a universal challenge. We're building a community that supports professionals from all walks of life."
    }
  ];

  const timeline = [
    { year: '2024', event: 'The first lines of XPeak were written in a small apartment in Berlin.', icon: <Rocket size={16} /> },
    { year: '2025', event: 'Reached 10,000 active users and launched team collaboration features.', icon: <Users size={16} /> },
    { year: '2026', event: 'XPeak becomes a leading platform for professional productivity.', icon: <Target size={16} /> }
  ];

  // Placeholder image component
  const PlaceholderImage = ({ label }: { label: string }) => (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex flex-col items-center justify-center">
      <Image size={32} className="text-primary/40 mb-2" />
      <span className="text-[10px] font-bold text-secondary/40 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <BaseInfoPage title="About XPeak">
      <div className="space-y-32">
        {/* Intro Section */}
        <section className="space-y-12">
          <div className="relative">
             <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
             <p className="text-3xl md:text-4xl text-secondary/90 leading-tight max-w-4xl font-black italic tracking-tight">
               In a world filled with distractions, we asked a simple question: 
               <span className="text-white block mt-4 not-italic">"What if improving your productivity felt rewarding and clear?"</span>
             </p>
          </div>
          
          <div className="aspect-video w-full bg-[#1e293b] rounded-[3.5rem] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-[0_0_50px_-10px_rgba(59,130,246,0.6)] cursor-pointer hover:scale-110 transition-transform duration-500">
                <Zap size={40} fill="white" className="text-white ml-1" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2 block">Our Vision 2026</span>
                <span className="text-xl font-bold text-white">Watch Our Story</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-32 h-32 border border-white/5 rounded-3xl rotate-12 opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 border border-white/5 rounded-full -rotate-12 opacity-20 pointer-events-none"></div>
          </div>
        </section>

        {/* Story Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
               Our Origins
            </div>
            <h2 className="text-4xl font-black text-white leading-tight">Born from a passion for clarity and meaningful progress.</h2>
            <div className="space-y-6">
              <p className="text-secondary/80 leading-relaxed text-lg">
                XPeak started as a small project between two friends who were tired of complicated, overwhelming productivity apps. 
                We realized that while there were many tools available, most felt like burdens rather than helpers.
              </p>
              <div className="p-8 bg-white/5 border-l-4 border-primary rounded-r-3xl italic relative">
                <Quote size={40} className="absolute -top-4 -right-4 text-primary/10" />
                <p className="text-white font-medium text-lg leading-relaxed">
                  "We decided to build something different. A tool that tracked progress simply and clearly, and within months, we were achieving more than we ever had."
                </p>
                <div className="mt-4 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30"></div>
                   <span className="text-xs font-black text-secondary/60 uppercase tracking-widest">Mark & Sarah, Founders</span>
                </div>
              </div>
              <p className="text-secondary/80 leading-relaxed text-lg">
                Today, XPeak has evolved into a platform serving thousands of users worldwide, helping people turn their daily work into clear paths toward their goals.
              </p>
            </div>
          </div>
          
          <div className="relative">
             <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="aspect-[4/5] bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                  <PlaceholderImage label="Team Photo" />
                </div>
                <div className="aspect-[4/5] bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden mt-12 transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                  <PlaceholderImage label="Office Meeting" />
                </div>
             </div>
             {/* Timeline decoration */}
             <div className="absolute top-1/2 -left-10 -translate-y-1/2 space-y-12 hidden md:block">
                {timeline.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                     <div className="w-12 h-12 rounded-2xl bg-[#0f172a] border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                        {item.icon}
                     </div>
                     <div className="bg-[#0f172a]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 max-w-xs shadow-2xl">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{item.year}</div>
                        <div className="text-xs text-white/80 leading-tight">{item.event}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
             <h2 className="text-4xl font-black text-white italic">Our Core Values</h2>
             <p className="text-secondary/60 max-w-2xl mx-auto text-lg leading-relaxed">The principles that drive every update and every feature we build.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-xl">
                    {v.icon}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{v.title}</h3>
                  <p className="text-secondary/60 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Join Section */}
        <section className="bg-gradient-to-br from-primary to-blue-700 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden group shadow-2xl shadow-primary/20">
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative z-10 space-y-10">
            <div className="inline-flex p-4 bg-white/10 rounded-3xl backdrop-blur-md mb-4 shadow-2xl">
               <Heart size={48} className="text-white" fill="white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">Join Our Team</h2>
            <p className="text-white/80 text-xl max-w-3xl mx-auto font-medium leading-relaxed">
              We are always looking for passionate builders, designers, and product thinkers to help us shape the future of productivity. 
              Ready to make an impact?
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <button className="bg-white text-primary px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-2xl shadow-black/20">
                Explore Open Roles
              </button>
              <button className="bg-black/20 backdrop-blur-md text-white border border-white/10 px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-black/30 transition-all">
                Our Culture
              </button>
            </div>
          </div>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default AboutUs;
