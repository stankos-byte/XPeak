# 🗡️ XPeak - Gamified Life Management System

Transform your daily life into an epic RPG adventure! XPeak helps you level up by completing tasks, executing operations, and building productive habits.

## 🚀 Features

- **📊 XP & Leveling System** - Gain experience points and level up across multiple skill categories
- **🎯 Operations System** - Break down large goals into structured, multi-stage operations
- **✅ Task Management** - Create and track daily tasks with difficulty-based XP rewards
- **🔥 Habit Tracking** - Build streaks and maintain daily habits
- **👥 Social Challenges** - Compete or cooperate with friends on shared tasks
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

# Install Firebase Functions dependencies
cd functions && npm install && cd ..

# Create .env file (see Firebase Setup section below)
# Copy .env.example to .env and fill in your Firebase configuration

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔥 Firebase Setup

XPeak uses Firebase for secure AI API proxying and authentication. Follow these steps:

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one

2. **Set up Firebase Configuration**
   - Create a `.env` file in the root directory
   - Add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Set up Firebase Secrets (for AI API)**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Set your project: `firebase use your-project-id`
   - Set the Gemini API key secret:
     ```bash
     firebase functions:secrets:set GEMINI_API_KEY
     ```
   - Enter your Gemini API key when prompted

4. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup instructions.

## 🏗️ Project Structure

```
xpeak/
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
- **Hard** (20 XP) - Challenging tasks
- **Epic** (30 XP) - Major accomplishments

### Operations System
Operations are multi-stage tasks with:
- **Categories** - Logical sections of the operation
- **Tasks** - Individual actionable items
- **Bonuses** - +20 XP for completing categories, +80-180 XP for full operations

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

## 🔐 Data Privacy & Security

- **Secure AI API**: All AI requests are proxied through Firebase Cloud Functions
- **API Key Security**: Gemini API key is stored securely in Firebase Secrets Manager (never exposed to client)
- **Authentication Required**: All AI features require user authentication
- **Data Storage**: Currently uses localStorage (Firestore integration available)
- **No Data Collection**: We don't collect or share your personal data

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
3. **Break Down Goals** - Use operations for complex tasks
4. **Track Progress** - Check your profile regularly
5. **Challenge Friends** - Social accountability boosts success
6. **Use the Timer** - Pomodoro technique for focused work

---

**Level up your life, one XP at a time!** 🚀✨
