
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Terminal, Loader2, Cpu, Command } from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { UserProfile, Task, MainQuest, FriendChallenge, Friend, Difficulty, SkillCategory, ChatMessage } from '../../types';

interface AIAssistantProps {
  user: UserProfile;
  tasks: Task[];
  quests: MainQuest[];
  friends: Friend[];
  challenges: FriendChallenge[];
  onAddTask: (task: any) => void;
  onAddQuest: (title: string, categories?: any[]) => void;
  onAddChallenge: (challenge: any) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const FormattedMessage = ({ text }: { text: string }) => {
  if (!text) return null;
  
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-black text-primary uppercase tracking-wider mt-3 mb-1">{line.replace(/^###\s+/, '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-black text-white uppercase tracking-wider mt-4 mb-2">{line.replace(/^##\s+/, '')}</h2>;
        }
        
        // List items
        let content = line;
        let isList = false;
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            isList = true;
            content = line.trim().substring(2);
        }

        // Bold parsing
        const parts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={j} className="font-bold text-white">{part.slice(2, -2)}</span>;
            }
            return part;
        });

        if (isList) {
            return (
                <div key={i} className="flex gap-2 ml-1">
                    <span className="text-primary mt-2 w-1 h-1 rounded-full bg-current flex-shrink-0"></span>
                    <p className="text-gray-300 leading-relaxed">{parts}</p>
                </div>
            );
        }

        if (line.trim() === '') return <div key={i} className="h-1"></div>;

        return <p key={i} className="text-gray-300 leading-relaxed">{parts}</p>;
      })}
    </div>
  );
};

const AIAssistantView: React.FC<AIAssistantProps> = ({ 
  user, 
  tasks, 
  quests, 
  friends, 
  challenges, 
  onAddTask, 
  onAddQuest, 
  onAddChallenge,
  messages,
  setMessages
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Helper to append message with auto-delete limit (approx 25 interactions = 50 messages)
  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => {
        const updated = [...prev, msg];
        if (updated.length > 50) {
            return updated.slice(updated.length - 50);
        }
        return updated;
    });
  };

  // --- Tool Definitions ---

  const createTaskTool: FunctionDeclaration = {
    name: "create_task",
    description: "Create a new task, habit, or to-do item. EXECUTE THIS ONLY when the user explicitly says 'add', 'create', 'remind me', or 'set a task'. DO NOT use this for general advice or suggestions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title of the task" },
        description: { type: Type.STRING, description: "Brief description of the objective" },
        difficulty: { type: Type.STRING, enum: Object.values(Difficulty), description: "Difficulty level" },
        skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory), description: "Related skill attribute" },
        isHabit: { type: Type.BOOLEAN, description: "True if this is a recurring habit, False if one-time task" }
      },
      required: ["title", "difficulty", "skillCategory", "isHabit"]
    }
  };

  const createQuestTool: FunctionDeclaration = {
    name: "create_quest",
    description: "Initialize a new Main Quest. Use this ONLY for large, multi-step projects. You MUST generate a detailed breakdown of 'categories' (phases) and 'tasks' (steps) to populate the quest plan.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The epic title of the quest" },
        categories: {
            type: Type.ARRAY,
            description: "Detailed breakdown of the quest into phases/sections",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Phase title (e.g., 'Phase 1: Research')" },
                    tasks: {
                        type: Type.ARRAY,
                        description: "Actionable steps for this phase",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Actionable task name" },
                                difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
                                skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory) },
                                description: { type: Type.STRING, description: "Short description/context" }
                            },
                            required: ["name", "difficulty", "skillCategory"]
                        }
                    }
                },
                required: ["title", "tasks"]
            }
        }
      },
      required: ["title", "categories"]
    }
  };

  const createChallengeTool: FunctionDeclaration = {
    name: "create_challenge",
    description: "Create a competitive challenge against a friend/operative. You MUST ALWAYS generate a detailed breakdown of 'categories' (phases) and 'tasks' (steps) for the challenge. Example: For a fitness challenge, create categories like 'Week 1: Warmup', 'Week 2: Intensity', each with multiple specific tasks like 'Run 5km', 'Do 50 pushups', etc. NEVER create a challenge without tasks!",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Name of the challenge" },
        description: { type: Type.STRING, description: "Terms of the challenge" },
        opponentName: { type: Type.STRING, description: "Name of the friend to challenge (must match a friend in the list)" },
        categories: {
            type: Type.ARRAY,
            description: "Detailed breakdown of the challenge into phases/sections with tasks",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Phase title (e.g., 'Week 1: Fundamentals')" },
                    tasks: {
                        type: Type.ARRAY,
                        description: "Actionable tasks for this phase that both you and your opponent will complete",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Actionable task name" },
                                difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
                                skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory) },
                                description: { type: Type.STRING, description: "Short description/context" }
                            },
                            required: ["name", "difficulty", "skillCategory"]
                        }
                    }
                },
                required: ["title", "tasks"]
            }
        }
      },
      required: ["title", "opponentName", "categories"]
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input };
    addMessage(userMsg);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Construct Context
      const activeTasksCount = tasks.filter(t => !t.completed).length;
      const systemPrompt = `
        You are the XPeak OS AI. You are helpful, strategic, and concise. 
        You speak like a sci-fi system interface or a tactical handler.
        
        CURRENT USER STATUS:
        Name: ${user.name}
        Level: ${user.level}
        Total XP: ${user.totalXP}
        Identity Core: "${user.identity}"
        
        Active Tasks: ${activeTasksCount}
        Active Quests: ${quests.length}
        Friends: ${friends.map(f => f.name).join(', ')}
        
        DECISION PROTOCOL:
        1. **GENERAL INQUIRY / CHAT**: If the user asks a question, seeks advice, or chats (e.g., "How do I get fit?", "What is XP?", "Suggest some habits"), JUST REPLY with text. DO NOT use any tools.
        2. **SINGLE TASK**: ONLY if the user explicitly COMMANDS to add an item (e.g., "Add a task to...", "Remind me to...", "Create a habit..."), use 'create_task'.
        3. **COMPLEX QUEST**: ONLY if the user COMMANDS to start a large project (e.g., "Start a quest to...", "I want to build a...", "Plan a..."), use 'create_quest'. You MUST generate a full breakdown of categories and tasks for the quest.
        4. **COMPETITION**: Use 'create_challenge' ONLY for explicit PvP requests (e.g., "Challenge [friend] to...", "Create a challenge against..."). 
           CRITICAL: You MUST ALWAYS generate a detailed breakdown with:
           - Multiple categories (at least 2-3 phases/sections)
           - Multiple tasks per category (at least 3-5 tasks per section)
           - Each task must have: name, difficulty, skillCategory, and optional description
           - Think of creative, competitive tasks that both players can complete

        Gamify everything.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text || '' }]
            })),
            { role: 'user', parts: [{ text: input }] }
        ],
        config: {
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations: [createTaskTool, createQuestTool, createChallengeTool] }],
        }
      });

      const functionCalls = response.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
         const functionResponses: any[] = [];

         for (const call of functionCalls) {
             let result = { status: 'ok', message: 'Action executed successfully.' };
             
             try {
                if (call.name === 'create_task') {
                    onAddTask(call.args);
                    result.message = `Task "${call.args.title}" added to database.`;
                } else if (call.name === 'create_quest') {
                    onAddQuest(call.args.title as string, call.args.categories as any[]);
                    result.message = `Quest protocol "${call.args.title}" initialized with ${(call.args.categories as any[])?.length || 0} phases.`;
                } else if (call.name === 'create_challenge') {
                    const args = call.args as any;
                    const opponent = friends.find(f => f.name.toLowerCase().includes(args.opponentName.toLowerCase()));
                    if (opponent) {
                        // Transform AI-generated categories to proper format with task IDs and status
                        const formattedCategories = (args.categories || []).map((cat: any, catIndex: number) => ({
                            id: `cat-${Date.now()}-${catIndex}`,
                            title: cat.title,
                            tasks: (cat.tasks || []).map((task: any, taskIndex: number) => ({
                                task_id: `task-${Date.now()}-${catIndex}-${taskIndex}`,
                                name: task.name,
                                myStatus: 'pending' as const,
                                opponentStatus: 'pending' as const,
                                difficulty: task.difficulty,
                                skillCategory: task.skillCategory,
                                description: task.description
                            }))
                        }));
                        
                        console.log('Creating challenge with categories:', formattedCategories);
                        
                        onAddChallenge({ 
                            title: args.title,
                            description: args.description || '',
                            opponentId: opponent.id,
                            categories: formattedCategories
                        });
                        const taskCount = formattedCategories.reduce((sum: number, cat: any) => sum + (cat.tasks?.length || 0), 0);
                        result.message = `Challenge contract "${args.title}" deployed against ${opponent.name} with ${taskCount} tasks across ${formattedCategories.length} phases.`;
                    } else {
                         result = { status: 'error', message: `Target operative "${args.opponentName}" not found in network.` };
                    }
                }
             } catch (err) {
                 result = { status: 'error', message: 'Execution failed.' };
             }

             functionResponses.push({
                 id: call.id,
                 name: call.name,
                 response: { result }
             });
             
             // Add tool notification to chat
             addMessage({ 
                 id: crypto.randomUUID(), 
                 role: 'system', 
                 text: `> EXECUTING ${call.name.toUpperCase()}... ${result.message}`,
                 isTool: true
             });
         }
         
         // Send function response back to model to get final text
         const finalResponse = await ai.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: [
                ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text || '' }] })),
                { role: 'user', parts: [{ text: input }] },
                response.candidates![0].content, // The model's tool call turn
                { role: 'user', parts: functionResponses.map(fr => ({ functionResponse: fr })) } // Our response
             ],
             config: {
                 systemInstruction: systemPrompt, // Ensure system prompt is present in follow-up too
             }
         });
         
         addMessage({ id: crypto.randomUUID(), role: 'model', text: finalResponse.text || "Directives executed." });

      } else {
         addMessage({ id: crypto.randomUUID(), role: 'model', text: response.text || "Standby..." });
      }

    } catch (error) {
      console.error(error);
      addMessage({ id: crypto.randomUUID(), role: 'model', text: "ERROR: Connection to mainframe unstable. Please retry." });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-6 px-1 flex-none">
         <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(0,225,255,0.2)]">
            <Bot size={28} className="text-primary" />
         </div>
         <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">System Oracle</h1>
            <p className="text-secondary font-medium tracking-wide text-sm flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               AI Neural Link Active
            </p>
         </div>
      </header>

      <div className="flex-1 bg-surface/50 border border-secondary/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm relative">
         {/* Decorative grid background */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,225,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,225,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
            {messages.filter(m => !m.isTool).map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex-none flex items-center justify-center ${msg.role === 'user' ? 'bg-secondary/20 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role !== 'user' && <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 opacity-50">Oracle System</span>}
                        <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-lg ${
                            msg.role === 'user' 
                            ? 'bg-secondary/10 border border-secondary/20 text-gray-100 rounded-tr-none' 
                            : 'bg-surface border border-primary/20 text-gray-200 rounded-tl-none shadow-primary/5 w-full'
                        }`}>
                            <FormattedMessage text={msg.text || ''} />
                        </div>
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex-none flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin" />
                    </div>
                    <div className="flex items-center gap-1 text-primary text-xs font-black uppercase tracking-widest h-8">
                        Processing...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         <div className="p-4 bg-background/80 border-t border-secondary/20 backdrop-blur-md relative z-10">
            <form onSubmit={handleSendMessage} className="relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter command or query..."
                    className="w-full bg-surface border border-secondary/30 rounded-xl py-4 pl-12 pr-14 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none font-medium placeholder-secondary/40 shadow-inner"
                    disabled={isTyping}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                    <Command size={18} />
                </div>
                <button 
                    type="submit" 
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-background rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:bg-secondary/20 disabled:text-secondary transition-all"
                >
                    <Send size={18} />
                </button>
            </form>
         </div>
      </div>
    </div>
  );
};

export default AIAssistantView;
