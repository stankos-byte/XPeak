import React from 'react';
import BaseInfoPage from './BaseInfoPage';
import { Calendar, ArrowRight, Bookmark, Share2, Eye, Clock, Sparkles, Image } from 'lucide-react';
import { blogData } from '../../data/blogPosts';

// Placeholder image component
const PlaceholderImage = ({ category }: { category: string }) => {
  const colors: Record<string, string> = {
    'Strategy': 'from-primary/30 to-blue-600/30',
    'Psychology': 'from-pink-500/30 to-purple-500/30',
    'Career': 'from-orange-500/30 to-amber-500/30',
    'Updates': 'from-emerald-500/30 to-cyan-500/30',
  };
  
  return (
    <div className={`w-full h-full bg-gradient-to-br ${colors[category] || 'from-primary/30 to-blue-600/30'} flex flex-col items-center justify-center`}>
      <Image size={40} className="text-white/30 mb-2" />
      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Article Image</span>
    </div>
  );
};

const Blog = () => {
  const { featuredPost, recentPosts } = blogData;

  return (
    <BaseInfoPage title="Blog">
      <div className="space-y-24">
        {/* Featured Post */}
        <section className="group cursor-pointer relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative aspect-[21/9] w-full bg-[#1e293b] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl">
            <PlaceholderImage category={featuredPost.category} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-10 md:p-16 space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg shadow-lg">
                  {featuredPost.category}
                </span>
                <span className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
                  <Calendar size={12} className="text-primary" /> {featuredPost.date}
                </span>
                <span className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={12} className="text-primary" /> {featuredPost.readTime}
                </span>
              </div>
              
              <h2 className="text-3xl md:text-6xl font-black text-white leading-tight max-w-4xl group-hover:text-primary transition-colors italic tracking-tight">
                {featuredPost.title}
              </h2>
              
              <div className="flex items-center justify-between gap-8 pt-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black">
                       AJ
                    </div>
                    <div>
                       <div className="text-white font-bold text-sm">{featuredPost.author}</div>
                       <div className="text-secondary/40 text-[10px] font-black uppercase tracking-widest">{featuredPost.authorRole}</div>
                    </div>
                 </div>
                 <button className="hidden md:flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-2xl shadow-black/40">
                    Read Article <ArrowRight size={16} />
                 </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="flex flex-wrap items-center justify-between gap-8 border-b border-white/5 pb-12">
            <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              {['All Posts', 'Psychology', 'Career', 'Updates', 'Strategy'].map((tag, i) => (
                <button 
                  key={tag} 
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    i === 0 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white/5 border border-white/10 text-secondary/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6">
               <div className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Sort By</div>
               <select className="bg-transparent text-white font-black uppercase tracking-widest text-[10px] outline-none cursor-pointer hover:text-primary transition-colors">
                  <option>Latest Posts</option>
                  <option>Most Read</option>
                  <option>Trending</option>
               </select>
            </div>
        </section>

        {/* Recent Posts Grid */}
        <section className="space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {recentPosts.map((post, index) => (
              <article key={index} className="group cursor-pointer flex flex-col h-full">
                <div className="relative aspect-[4/3] w-full bg-[#1e293b] rounded-[2.5rem] overflow-hidden border border-white/10 mb-8 shadow-xl">
                  <PlaceholderImage category={post.category} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent"></div>
                  
                  {/* Hover Actions */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                     <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary transition-colors">
                        <Bookmark size={16} />
                     </button>
                     <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary transition-colors">
                        <Share2 size={16} />
                     </button>
                  </div>

                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                     <div className="px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-lg text-[8px] font-black text-white uppercase tracking-[0.2em]">
                        {post.category}
                     </div>
                  </div>
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-secondary/40 text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/60" /> {post.date}</span>
                    <span className="flex items-center gap-1.5"><Eye size={12} className="text-primary/60" /> {post.views || '1.2k views'}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight italic tracking-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-secondary/60 text-sm leading-relaxed line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                           {post.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{post.author}</span>
                     </div>
                     <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                        Read <ArrowRight size={14} />
                     </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          
          <div className="flex justify-center pt-12">
             <button className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 hover:border-white/20 transition-all">
                Load More Posts
             </button>
          </div>
        </section>

        {/* Newsletter / Join Section */}
        <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[4rem] p-12 md:p-20 text-center border border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,_rgba(59,130,246,0.1),_transparent)] pointer-events-none"></div>
          <div className="absolute top-10 left-10 opacity-10 group-hover:rotate-45 transition-transform duration-1000">
             <Sparkles size={120} className="text-primary" />
          </div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl font-black text-white tracking-tight italic">Never miss an update.</h2>
            <p className="text-secondary/80 text-lg leading-relaxed">
              Join 25,000+ subscribers who receive our weekly newsletter with productivity tips and platform updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 pt-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-5 text-white placeholder:text-secondary/40 focus:outline-none focus:border-primary focus:bg-white/10 transition-all"
              />
              <button className="bg-primary text-white px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                Subscribe
              </button>
            </form>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
               No spam. Only valuable content for your inbox.
            </p>
          </div>
        </section>
      </div>
    </BaseInfoPage>
  );
};

export default Blog;
