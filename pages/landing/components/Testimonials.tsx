import React from 'react';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer',
    quote: "This app has helped me set and reach my goals each day. It's become an essential part of my morning routine.",
    avatar: 'SC',
  },
  {
    name: 'Michael Torres',
    role: 'Product Designer',
    quote: "Working with the timer used to be difficult. Using the focus tools has made me more productive and less stressed.",
    avatar: 'MT',
  },
  {
    name: 'Emily Johnson',
    role: 'Marketing Manager',
    quote: "The data showed me how much time I was losing. Now I can see my real progress week over week and it's growing the business.",
    avatar: 'EJ',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Customer <span className="text-primary">Feedback</span>
        </h2>
        <p className="text-secondary/70 text-base mt-4">
          Hear from professionals using XPeak to improve their work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-surface/50 border border-secondary/10 rounded-2xl p-8 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {testimonial.avatar}
              </div>
              <div>
                <p className="text-white font-bold">{testimonial.name}</p>
                <p className="text-secondary/60 text-sm">{testimonial.role}</p>
              </div>
            </div>
            <p className="text-secondary/80 text-sm leading-relaxed italic">"{testimonial.quote}"</p>
          </div>
        ))}
      </div>
    </section>
  );
};
