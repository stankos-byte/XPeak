import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";

// Define the secret for Gemini API key
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function to proxy Gemini API requests
 * This function handles all AI interactions securely on the server-side
 */
export const geminiProxy = functions
  .runWith({
    secrets: [geminiApiKey],
    timeoutSeconds: 60,
    memory: "512MB",
  })
  .https
  .onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to use AI features"
      );
    }

    // Validate request data
    if (!data || typeof data !== "object") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Request data must be an object"
      );
    }

    const { action, payload } = data;

    if (!action || typeof action !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Action is required and must be a string"
      );
    }

    // Validate action is from allowed list (prevent injection)
    const allowedActions = [
      "generateQuest",
      "analyzeTask",
      "generateChatResponse",
      "generateFollowUpResponse",
    ];
    if (!allowedActions.includes(action)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid action specified"
      );
    }

    // Validate payload exists
    if (!payload || typeof payload !== "object") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Payload is required and must be an object"
      );
    }

    // Get API key from secrets
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new functions.https.HttpsError(
        "internal",
        "Gemini API key is not configured"
      );
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    try {
      switch (action) {
        case "generateQuest": {
          if (!payload || typeof payload.questTitle !== "string") {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "questTitle is required"
            );
          }

          // Sanitize and validate input length
          const questTitle = payload.questTitle.trim();
          if (questTitle.length === 0 || questTitle.length > 500) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "questTitle must be between 1 and 500 characters"
            );
          }

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Break down the operation "${questTitle}" into strategic phases and tasks. 
            For each phase, provide a comprehensive list of tasks. 
            Do not limit yourself to a small number; if a phase is complex, provide 5-10 actionable steps to fully complete it. 
            Adjust the objective count based on the complexity of the phase.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    tasks: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          name: { type: "STRING" },
                          difficulty: {
                            type: "STRING",
                            enum: ["Easy", "Medium", "Hard", "Epic"],
                          },
                          skillCategory: {
                            type: "STRING",
                            enum: [
                              "Physical",
                              "Mental",
                              "Professional",
                              "Social",
                              "Creative",
                              "Default",
                            ],
                          },
                        },
                        required: ["name", "difficulty", "skillCategory"],
                      },
                    },
                  },
                  required: ["title", "tasks"],
                },
              },
            },
          });

          const result = JSON.parse(response.text || "[]");
          return { success: true, data: result };
        }

        case "analyzeTask": {
          if (!payload || typeof payload.taskTitle !== "string") {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "taskTitle is required"
            );
          }

          // Sanitize and validate input length
          const taskTitle = payload.taskTitle.trim();
          if (taskTitle.length === 0 || taskTitle.length > 200) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "taskTitle must be between 1 and 200 characters"
            );
          }

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze this task title: "${taskTitle}". Determine the most appropriate SkillCategory (Physical, Mental, Professional, Social, Creative, Default) and Difficulty (Easy, Medium, Hard, Epic). Use 'Default' if the task doesn't fit specific skills.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  difficulty: {
                    type: "STRING",
                    enum: ["Easy", "Medium", "Hard", "Epic"],
                  },
                  skillCategory: {
                    type: "STRING",
                    enum: [
                      "Physical",
                      "Mental",
                      "Professional",
                      "Social",
                      "Creative",
                      "Default",
                    ],
                  },
                  suggestedDescription: { type: "STRING" },
                },
                required: ["difficulty", "skillCategory"],
              },
            },
          });

          const result = JSON.parse(response.text || "{}");
          return {
            success: true,
            data: {
              difficulty: result.difficulty,
              skillCategory: result.skillCategory,
              suggestedDescription: result.suggestedDescription,
            },
          };
        }

        case "generateChatResponse": {
          if (
            !payload ||
            !Array.isArray(payload.messages) ||
            typeof payload.userInput !== "string" ||
            typeof payload.systemPrompt !== "string"
          ) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "messages, userInput, and systemPrompt are required"
            );
          }

          // Validate input lengths
          const userInput = payload.userInput.trim();
          if (userInput.length === 0 || userInput.length > 2000) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "userInput must be between 1 and 2000 characters"
            );
          }

          if (payload.systemPrompt.length > 5000) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "systemPrompt must be less than 5000 characters"
            );
          }

          // Validate message count and length
          if (payload.messages.length > 50) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "Maximum 50 messages allowed"
            );
          }

          // Validate each message
          for (const msg of payload.messages) {
            if (msg.text && typeof msg.text === "string" && msg.text.length > 2000) {
              throw new functions.https.HttpsError(
                "invalid-argument",
                "Each message must be less than 2000 characters"
              );
            }
          }

          // Get tool definitions from payload (validate structure)
          const tools = Array.isArray(payload.tools) ? payload.tools : [];

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              ...payload.messages
                .filter((m: any) => m.role !== "system")
                .map((m: any) => ({
                  role: m.role === "user" ? "user" : "model",
                  parts: [{ text: m.text || "" }],
                })),
              { role: "user", parts: [{ text: userInput }] },
            ],
            config: {
              systemInstruction: payload.systemPrompt,
              tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
            },
          });

          return {
            success: true,
            data: {
              text: response.text,
              functionCalls: response.functionCalls,
              candidates: response.candidates,
            },
          };
        }

        case "generateFollowUpResponse": {
          if (
            !payload ||
            !Array.isArray(payload.messages) ||
            typeof payload.userInput !== "string" ||
            typeof payload.systemPrompt !== "string" ||
            !payload.previousResponse ||
            !Array.isArray(payload.functionResponses)
          ) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "All required fields must be provided"
            );
          }

          // Validate input lengths
          const userInput = payload.userInput.trim();
          if (userInput.length === 0 || userInput.length > 2000) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "userInput must be between 1 and 2000 characters"
            );
          }

          if (payload.systemPrompt.length > 5000) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "systemPrompt must be less than 5000 characters"
            );
          }

          // Validate message count
          if (payload.messages.length > 50) {
            throw new functions.https.HttpsError(
              "invalid-argument",
              "Maximum 50 messages allowed"
            );
          }

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              ...payload.messages.map((m: any) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.text || "" }],
              })),
              { role: "user", parts: [{ text: userInput }] },
              payload.previousResponse.candidates?.[0]?.content,
              {
                role: "user",
                parts: payload.functionResponses.map((fr: any) => ({
                  functionResponse: fr,
                })),
              },
            ],
            config: {
              systemInstruction: payload.systemPrompt,
            },
          });

          return {
            success: true,
            data: {
              text: response.text || "Directives executed.",
            },
          };
        }

        default:
          throw new functions.https.HttpsError(
            "invalid-argument",
            `Unknown action: ${action}`
          );
      }
    } catch (error: any) {
      console.error("Gemini API error:", error);
      
      // Don't expose internal errors to client
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while processing the AI request"
      );
    }
  });
