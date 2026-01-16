
export interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  authorRole?: string;
  category: string;
  image: string;
  readTime: string;
  views?: string;
}

export interface BlogData {
  featuredPost: BlogPost;
  recentPosts: BlogPost[];
}

export const blogData: BlogData = {
  featuredPost: {
    title: "The Complete Guide to Better Goal Setting",
    excerpt: "Learn the proven framework behind why some goals feel impossible while others keep you in the flow. We break down the practical approach for busy professionals.",
    date: "Jan 12, 2026",
    author: "Alex Johnson",
    authorRole: "Lead Writer",
    category: "Strategy",
    image: "placeholder",
    readTime: "12 min read"
  },
  recentPosts: [
    {
      title: "The Psychology of Progress: Why Tracking Matters",
      excerpt: "Explore the scientific reasons behind why visual progress tracking is a powerful tool for building habits.",
      date: "Jan 05, 2026",
      author: "Dr. Sarah Chen",
      category: "Psychology",
      image: "placeholder",
      readTime: "8 min read",
      views: "1.2k views"
    },
    {
      title: "Top 5 Habits for Professional Growth in 2026",
      excerpt: "Our data shows these five habits have the highest impact on career progression for professionals.",
      date: "Dec 28, 2025",
      author: "Marcus Thorne",
      category: "Career",
      image: "placeholder",
      readTime: "6 min read",
      views: "2.1k views"
    },
    {
      title: "Team Collaboration 2.0: Working Better Together",
      excerpt: "Everything you need to know about the new team features and how to boost your group's productivity.",
      date: "Dec 20, 2025",
      author: "The Dev Team",
      category: "Updates",
      image: "placeholder",
      readTime: "5 min read",
      views: "950 views"
    },
    {
      title: "Mastering Deep Focus: A Practical Approach",
      excerpt: "Deep dive into the techniques that trigger hyper-focus and how to use our new timer tools effectively.",
      date: "Jan 15, 2026",
      author: "Nova Williams",
      category: "Strategy",
      image: "placeholder",
      readTime: "10 min read",
      views: "3.4k views"
    }
  ]
};
