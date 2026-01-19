import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Difficulty, SkillCategory, ChatMessage } from "../types";

/**
 * AI Service for handling all Google Gemini API interactions.
 * 
 * This service abstracts the Google SDK so it can be easily replaced
 * with a Firebase Cloud Function or backend proxy in the future.
 * 
 * The API key is accessed via import.meta.env.VITE_GEMINI_API_KEY
 * to follow Vite's environment variable conventions.
 */

// Get API key from environment variables
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  VITE_GEMINI_API_KEY not found in environment variables');
  }
  return apiKey || '';
};

// Initialize Google GenAI client
const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generate a quest breakdown from a quest title.
 * This is used by the Quest Oracle feature.
 */
export const generateQuest = async (questTitle: string): Promise<Array<{
  title: string;
  tasks: Array<{
    name: string;
    difficulty: Difficulty;
    skillCategory: SkillCategory;
  }>;
}>> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Break down the quest "${questTitle}" into strategic categories and tasks. 
      For each category, provide a comprehensive list of tasks. 
      Do not limit yourself to a small number; if a category is complex, provide 5-10 actionable steps to fully complete it. 
      Adjust the task count based on the complexity of the section.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: { 
              title: { type: Type.STRING }, 
              tasks: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    name: { type: Type.STRING }, 
                    difficulty: { type: Type.STRING, enum: Object.values(Difficulty) }, 
                    skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory) } 
                  }, 
                  required: ["name", "difficulty", "skillCategory"] 
                } 
              } 
            }, 
            required: ["title", "tasks"] 
          } 
        } 
      }
    });
    
    const data = JSON.parse(response.text || '[]');
    return data;
  } catch (error) {
    console.error('Error generating quest:', error);
    throw error;
  }
};

/**
 * Analyze a task title and suggest difficulty, skill category, and description.
 * Used by the Smart Audit feature in CreateTaskModal.
 */
export const analyzeTask = async (taskTitle: string): Promise<{
  difficulty: Difficulty;
  skillCategory: SkillCategory;
  suggestedDescription?: string;
}> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this task title: "${taskTitle}". Determine the most appropriate SkillCategory (Physical, Mental, Professional, Social, Creative, Default) and Difficulty (Easy, Medium, Hard, Epic). Use 'Default' if the task doesn't fit specific skills.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficulty: { type: Type.STRING, enum: Object.values(Difficulty) },
            skillCategory: { type: Type.STRING, enum: Object.values(SkillCategory) },
            suggestedDescription: { type: Type.STRING }
          },
          required: ["difficulty", "skillCategory"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      difficulty: result.difficulty as Difficulty,
      skillCategory: result.skillCategory as SkillCategory,
      suggestedDescription: result.suggestedDescription
    };
  } catch (error) {
    console.error('Error analyzing task:', error);
    throw error;
  }
};

/**
 * Tool definitions for the AI assistant chat interface.
 */
export const getAITools = (): FunctionDeclaration[] => {
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

  return [createTaskTool, createQuestTool, createChallengeTool];
};

/**
 * Generate a chat response from the AI assistant.
 * This handles the main conversation flow in the Assistant view.
 */
export const generateChatResponse = async (
  messages: ChatMessage[],
  userInput: string,
  systemPrompt: string
): Promise<{
  text?: string;
  functionCalls?: Array<{
    id: string;
    name: string;
    args: any;
  }>;
  candidates?: any;
}> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
          ...messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text || '' }]
          })),
          { role: 'user', parts: [{ text: userInput }] }
      ],
      config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: getAITools() }],
      }
    });

    return {
      text: response.text,
      functionCalls: response.functionCalls,
      candidates: response.candidates
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

/**
 * Generate a follow-up response after function calls have been executed.
 * This is used to get the final text response from the AI after tool execution.
 */
export const generateFollowUpResponse = async (
  messages: ChatMessage[],
  userInput: string,
  systemPrompt: string,
  previousResponse: any,
  functionResponses: any[]
): Promise<string> => {
  try {
    const ai = getAIClient();
    const finalResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
         ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text || '' }] })),
         { role: 'user', parts: [{ text: userInput }] },
         previousResponse.candidates![0].content, // The model's tool call turn
         { role: 'user', parts: functionResponses.map(fr => ({ functionResponse: fr })) } // Our response
      ],
      config: {
          systemInstruction: systemPrompt,
      }
    });
    
    return finalResponse.text || "Directives executed.";
  } catch (error) {
    console.error('Error generating follow-up response:', error);
    throw error;
  }
};
