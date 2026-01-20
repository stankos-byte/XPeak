# 🗡️ XPeak - Gamified Life Management System

Transform your daily life into an epic RPG adventure! XPeak helps you level up by completing tasks, conquering quests, and building productive habits.

## 🚀 Features

- **📊 XP & Leveling System** - Gain experience points and level up across multiple skill categories
- **🎯 Quest System** - Break down large goals into structured, multi-stage quests
- **✅ Task Management** - Create and track daily tasks with difficulty-based XP rewards
- **🔥 Habit Tracking** - Build streaks and maintain daily habits
- **👥 Social Challenges** - Compete or cooperate with friends on shared objectives
- **🤖 AI Assistant** - Get help breaking down goals and managing your progression
- **⏱️ Pomodoro Timer** - Built-in focus timer for productivity sessions
- **📈 Progress Analytics** - Visualize your growth with detailed statistics

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **AI:** Google Gemini API
- **Build Tool:** Vite
- **Router:** React Router v7

## 📦 Installation

```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Project Structure

```
levelup-life/
├── components/          # Reusable UI components
│   ├── cards/          # Card components (TaskCard, etc.)
│   ├── charts/         # Chart components (SkillRadar, etc.)
│   ├── modals/         # Modal dialogs
│   ├── widgets/        # Dashboard widgets
│   └── ErrorBoundary.tsx
├── contexts/           # React contexts
│   ├── ThemeContext.tsx
│   ├── AppStateContext.tsx
│   └── ModalContext.tsx
├── hooks/              # Custom React hooks
│   ├── useTimer.ts
│   ├── useHabitSync.ts
│   ├── useXPSystem.ts
│   └── useLocalStorage.ts
├── pages/              # Page components
│   ├── app/           # Main app pages
│   │   ├── Dashboard.tsx
│   │   ├── Quests.tsx
│   │   ├── Profile.tsx
│   │   ├── Tools.tsx
│   │   ├── Friends.tsx
│   │   ├── Assistant.tsx
│   │   └── Settings.tsx
│   ├── auth/          # Authentication pages
│   └── landing/       # Landing page
├── services/           # Service layer
│   └── localStorage.ts
├── utils/              # Utility functions
│   ├── gamification.ts
│   └── validation.ts
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants
├── App.tsx             # Root app component
├── AppLayout.tsx       # Main app layout
└── index.tsx          # Entry point
```

## 🎮 Core Concepts

### Skill Categories
- **Physical** 💪 - Fitness, sports, physical activities
- **Mental** 🧠 - Learning, reading, problem-solving
- **Professional** 💼 - Career, work projects, skills
- **Social** 👥 - Relationships, networking, communication
- **Creative** 🎨 - Art, music, creative projects

### Difficulty Levels
- **Easy** (10 XP) - Simple, quick tasks
- **Medium** (15 XP) - Moderate effort required
- **Hard** (20 XP) - Challenging objectives
- **Epic** (30 XP) - Major accomplishments

### Quest System
Quests are multi-stage objectives with:
- **Categories** - Logical sections of the quest
- **Tasks** - Individual actionable items
- **Bonuses** - +20 XP for completing categories, +80-180 XP for full quests

### Leveling Curve
```
Level 1-5:   100 XP per level
Level 6-10:  200 XP per level
Level 11-15: 350 XP per level
Level 16-20: 600 XP per level
Level 21+:   Scaling requirements
```

## 🔒 Recent Improvements

We've recently enhanced the codebase with:
- ✅ **Error Boundaries** - Graceful error handling
- ✅ **Safe localStorage** - Protected data storage
- ✅ **Input Validation** - Prevents corrupted data
- ✅ **TypeScript Strict Mode** - Enhanced type safety
- ✅ **Custom Hooks** - Better code organization
- ✅ **Context Providers** - Improved state management

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed information.

## 🐛 Bug Prevention

The codebase now includes:
1. **Validation** - All user inputs are validated and sanitized
2. **Error Handling** - Try-catch blocks around critical operations
3. **Type Safety** - Strict TypeScript configuration
4. **Fallbacks** - Default values for all data operations
5. **Error Boundaries** - Component-level error isolation

## 📱 Responsive Design

XPeak is fully responsive and works on:
- 📱 Mobile devices
- 💻 Tablets
- 🖥️ Desktop computers

## 🌙 Theme Support

The app includes a theme system with customizable colors:
- **Primary** - Cyan (#00e1ff)
- **Background** - Dark theme optimized for focus
- **Surface** - Elevated card backgrounds
- **Secondary** - Muted text and borders

## 🔐 Data Privacy

- All data is stored locally in your browser
- No server-side data collection
- API key required only for AI features (optional)

## 🤝 Contributing

This is a personal project, but feedback is welcome!

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🎯 Roadmap

- [ ] Backend API for data sync
- [ ] Mobile app (React Native)
- [ ] Social features expansion
- [ ] Advanced analytics dashboard
- [ ] Export/import data functionality
- [ ] Achievements & badges system
- [ ] Customizable themes

## 💡 Tips for Success

1. **Start Small** - Begin with easy tasks to build momentum
2. **Build Habits** - Use the habit system for daily routines
3. **Break Down Goals** - Use quests for complex objectives
4. **Track Progress** - Check your profile regularly
5. **Challenge Friends** - Social accountability boosts success
6. **Use the Timer** - Pomodoro technique for focused work

---

**Level up your life, one XP at a time!** 🚀✨
