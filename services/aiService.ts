import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Difficulty, SkillCategory, ChatMessage } from "../types";
import { DEBUG_FLAGS } from "../config/debugFlags";

// Type definitions for AI tools (matching Google GenAI format)
type Type = "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT" | "ARRAY";

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: Type;
    properties?: Record<string, any>;
    items?: any;
    enum?: string[];
    required?: string[];
    description?: string;
  };
}

/**
 * AI Service for handling all Google Gemini API interactions.
 * 
 * All AI requests are proxied through Firebase Cloud Functions
 * to keep the API key secure on the server-side.
 */

// Initialize Firebase if not already initialized
const initializeFirebase = () => {
  if (getApps().length === 0) {
    // Firebase config should be provided via environment variables
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
      throw new Error(
        "Firebase is not configured. Please set VITE_FIREBASE_PROJECT_ID and other Firebase config in your .env file."
      );
    }

    return initializeApp(firebaseConfig);
  }
  return getApp();
};

// Get Firebase Functions instance
const getFirebaseFunctions = () => {
  const app = initializeFirebase();
  return getFunctions(app);
};

// Get the geminiProxy callable function
const getGeminiProxy = () => {
  const functions = getFirebaseFunctions();
  return httpsCallable(functions, "geminiProxy");
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
    // Verify user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to use AI features");
    }

    const geminiProxy = getGeminiProxy();
    const result = await geminiProxy({
      action: "generateQuest",
      payload: { questTitle },
    });

    if (result.data.success && result.data.data) {
      return result.data.data;
    }

    throw new Error("Failed to generate quest");
  } catch (error: any) {
    if (DEBUG_FLAGS.oracle) console.error("Error generating quest:", error);
    
    // Provide user-friendly error messages
    if (error.code === "unauthenticated") {
      throw new Error("Please sign in to use AI features");
    }
    if (error.code === "permission-denied") {
      throw new Error("You don't have permission to use this feature");
    }
    
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
    // Verify user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to use AI features");
    }

    const geminiProxy = getGeminiProxy();
    const result = await geminiProxy({
      action: "analyzeTask",
      payload: { taskTitle },
    });

    if (result.data.success && result.data.data) {
      return {
        difficulty: result.data.data.difficulty as Difficulty,
        skillCategory: result.data.data.skillCategory as SkillCategory,
        suggestedDescription: result.data.data.suggestedDescription,
      };
    }

    throw new Error("Failed to analyze task");
  } catch (error: any) {
    if (DEBUG_FLAGS.oracle) console.error("Error analyzing task:", error);
    
    // Provide user-friendly error messages
    if (error.code === "unauthenticated") {
      throw new Error("Please sign in to use AI features");
    }
    if (error.code === "permission-denied") {
      throw new Error("You don't have permission to use this feature");
    }
    
    throw error;
  }
};

/**
 * Tool definitions for the AI assistant chat interface.
 */
export const getAITools = (): FunctionDeclaration[] => {
  const createTaskTool: FunctionDeclaration = {
    name: "create_task",
    description: "Create a new objective, habit, or to-do item. EXECUTE THIS ONLY when the user explicitly says 'add', 'create', 'remind me', or 'set an objective'. DO NOT use this for general advice or suggestions.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Title of the task" },
        description: { type: "STRING", description: "Brief description of the objective" },
        difficulty: { type: "STRING", enum: Object.values(Difficulty), description: "Difficulty level" },
        skillCategory: { type: "STRING", enum: Object.values(SkillCategory), description: "Related skill attribute" },
        isHabit: { type: "BOOLEAN", description: "True if this is a recurring habit, False if one-time task" }
      },
      required: ["title", "difficulty", "skillCategory", "isHabit"]
    }
  };

  const createQuestTool: FunctionDeclaration = {
    name: "create_quest",
    description: "Initialize a new Operation. Use this ONLY for large, multi-step projects. You MUST generate a detailed breakdown of 'categories' (phases) and 'tasks' to populate the operation plan.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "The strategic title of the operation" },
        categories: {
            type: "ARRAY",
            description: "Detailed breakdown of the quest into phases/sections",
            items: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "Phase title (e.g., 'Phase 1: Research')" },
                    tasks: {
                        type: "ARRAY",
                        description: "Actionable steps for this phase",
                        items: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING", description: "Actionable task name" },
                                difficulty: { type: "STRING", enum: Object.values(Difficulty) },
                                skillCategory: { type: "STRING", enum: Object.values(SkillCategory) },
                                description: { type: "STRING", description: "Short description/context" }
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
    description: "Create a competitive challenge against a network connection. You MUST ALWAYS generate a detailed breakdown of 'categories' (phases) and 'tasks' for the challenge. Example: For a fitness challenge, create phases like 'Week 1: Foundation', 'Week 2: Intensity', each with multiple specific tasks like 'Run 5km', 'Do 50 pushups', etc. NEVER create a challenge without tasks!",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Name of the challenge" },
        description: { type: "STRING", description: "Terms of the challenge" },
        opponentName: { type: "STRING", description: "Name of the network connection to challenge (must match a connection in the list)" },
        categories: {
            type: "ARRAY",
            description: "Detailed breakdown of the challenge into phases/sections with tasks",
            items: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "Phase title (e.g., 'Week 1: Fundamentals')" },
                    tasks: {
                        type: "ARRAY",
                        description: "Actionable tasks for this phase that both you and your opponent will complete",
                        items: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING", description: "Actionable task name" },
                                difficulty: { type: "STRING", enum: Object.values(Difficulty) },
                                skillCategory: { type: "STRING", enum: Object.values(SkillCategory) },
                                description: { type: "STRING", description: "Short description/context" }
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
    // Verify user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to use AI features");
    }

    const geminiProxy = getGeminiProxy();
    const result = await geminiProxy({
      action: "generateChatResponse",
      payload: {
        messages,
        userInput,
        systemPrompt,
        tools: getAITools(),
      },
    });

    if (result.data.success && result.data.data) {
      return {
        text: result.data.data.text,
        functionCalls: result.data.data.functionCalls,
        candidates: result.data.data.candidates,
      };
    }

    throw new Error("Failed to generate chat response");
  } catch (error: any) {
    if (DEBUG_FLAGS.oracle) console.error("Error generating chat response:", error);
    
    // Provide user-friendly error messages
    if (error.code === "unauthenticated") {
      throw new Error("Please sign in to use AI features");
    }
    if (error.code === "permission-denied") {
      throw new Error("You don't have permission to use this feature");
    }
    
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
    // Verify user is authenticated
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to use AI features");
    }

    const geminiProxy = getGeminiProxy();
    const result = await geminiProxy({
      action: "generateFollowUpResponse",
      payload: {
        messages,
        userInput,
        systemPrompt,
        previousResponse,
        functionResponses,
      },
    });

    if (result.data.success && result.data.data) {
      return result.data.data.text || "Directives executed.";
    }

    throw new Error("Failed to generate follow-up response");
  } catch (error: any) {
    if (DEBUG_FLAGS.oracle) console.error("Error generating follow-up response:", error);
    
    // Provide user-friendly error messages
    if (error.code === "unauthenticated") {
      throw new Error("Please sign in to use AI features");
    }
    if (error.code === "permission-denied") {
      throw new Error("You don't have permission to use this feature");
    }
    
    throw error;
  }
};
