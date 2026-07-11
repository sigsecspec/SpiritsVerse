import { GoogleGenAI, Type } from "@google/genai";
import { DrinkSuggestion } from "../types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSocialPost = async (topic: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, engaging social media post about this drink/nightlife topic: ${topic}. Keep it under 280 characters. Use emojis like 🍸, 🍺, 🍷, 🍹.`,
    });
    return response.text || "Cheers to the night!";
  } catch (e) {
    return "Cheers!";
  }
};

export const generateDrinkSuggestion = async (mood: string, occasion: string, preference: string): Promise<DrinkSuggestion | null> => {
  try {
    const ai = getAI();
    
    const fullPrompt = `
      You are a master mixologist and sommelier. A user wants a drink recommendation.
      Their preferences are:
      - Mood: "${mood}"
      - Occasion: "${occasion}"
      - Flavor Preference: "${preference}"
      
      Recommend one suitable cocktail, spirit, wine, beer, or mocktail.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drinkName: {
              type: Type.STRING,
              description: "The name of the recommended drink.",
            },
            description: {
              type: Type.STRING,
              description: "A brief, appetizing description of the drink.",
            },
            category: {
              type: Type.STRING,
              description: "The category (Whiskey, Vodka, Tequila, Gin, Rum, Brandy, Liqueur, Wine, Beer, Cocktail, Mocktail).",
            },
          },
          required: ["drinkName", "description", "category"],
        },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) return null;
    
    return JSON.parse(jsonText) as DrinkSuggestion;

  } catch (error) {
    console.error("Error generating drink suggestion:", error);
    return null;
  }
};

export const generateBarLensImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string | null> => {
  try {
    const ai = getAI();
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = { text: `User photo edit request. Keep the original person's likeness and pose, but apply this creative filter: "${prompt}". Make it look like a high-end bar, rave, neon nightlife, or cocktail lounge vibe.` };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts: [imagePart, textPart] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating Bar Lens image:", error);
    return null;
  }
};

export const generateCSSTheme = async (prompt: string, isGroup: boolean): Promise<string> => {
    const selectors = isGroup 
        ? `.ys-group-root, .ys-group-header, .ys-group-chat, .ys-message-bubble` 
        : `.ys-profile-root, .ys-header, .ys-avatar, .ys-bio, .ys-card`;
    
    const fullPrompt = `
        You are an expert CSS theme designer for a social media app called SpiritsVerse.
        A user wants a theme based on the prompt: "${prompt}".
        
        The theme will be applied to these CSS selectors: ${selectors}.
        
        Generate a CSS theme using ONLY CSS variables within a ":root" selector. Do NOT include any other CSS rules.
        The theme should be elegant, modern, and visually appealing (think bar, lounge, distillery, rave, or cocktail vibes).
        You MUST define variables for the following properties:
        --bg-main, --bg-card, --bg-hover, --bg-input, --border, --border-strong, 
        --text-main, --text-secondary, --text-muted, --accent, --accent-hover, --shadow-color.
        
        Make sure the colors have good contrast and are accessible.
        Return ONLY the CSS code inside a \`\`\`css code block.
    `;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        const cssText = response.text || '';
        const match = cssText.match(/```css\s*([\s\S]*?)\s*```/);
        return match ? match[1].trim() : `/* Sorry, couldn't generate a theme. */`;
    } catch (e) {
        console.error("Error generating CSS theme:", e);
        return `/* AI Error: Please try again. */`;
    }
};

export const generateDrunkenWisdom = async (): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Generate a short, funny, or profound "bar wisdom" or "drunk thought". Something you might hear after a few drinks. Keep it to one or two sentences.',
        });
        return response.text || "I'm not drunk, I'm just fluent in cursive.";
    } catch(e) {
        return "Alcohol creates a temporary personality that is often better than the original.";
    }
};

export const generateToastOfTheDay = async (): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Generate a short, classy, or funny toast for drinking with friends. Maximum 1-2 sentences.',
        });
        return response.text || "Here's to a long life and a merry one.";
    } catch(e) {
        return "May your glass be ever full.";
    }
};

export const moderatePostContent = async (content: string): Promise<{ isSafe: boolean; reason: string | null }> => {
    const prompt = `You are a content moderation AI for a social network about alcohol and nightlife. Analyze the following text for these violations ONLY:
1.  **Personal Identifiable Information**: Real-world addresses, phone numbers, email addresses.
2.  **Explicit Meet-up Instructions**: Phrases that specify a precise location and time for a meeting (e.g., "meet me at corner of X and Y right now").
3.  **Encouraging Dangerous Behavior**: Binge drinking contests, driving under the influence, violence, drugging.
The community discusses alcohol, so do NOT flag terms like "drunk," "wasted," "shots," or "bar." The goal is to prevent doxxing, unsafe meetups, and dangerous illegal acts.

If a violation is found, respond with JSON: \`{"isSafe": false, "reason": "A brief, user-friendly explanation of the violation."}\`.
If no violations are found, respond with JSON: \`{"isSafe": true, "reason": null}\`.

Text to analyze:
"${content}"`;

    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isSafe: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING, nullable: true },
                    },
                    required: ['isSafe', 'reason'],
                },
            },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) return { isSafe: false, reason: "AI moderation failed. Please try again." };
        
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error during content moderation:", error);
        return { isSafe: true, reason: null };
    }
};