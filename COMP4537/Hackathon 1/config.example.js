// Copy this file to config.js and paste in your Gemini API key.
const CONFIG = {
    GEMINI_API_KEY: "YOUR_API_KEY_HERE",
    GEMINI_MODEL: "gemini-flash-latest",
    // Tried in order when the main model is overloaded (HTTP 429/500/503).
    GEMINI_FALLBACK_MODELS: ["gemini-3-flash-preview", "gemini-flash-lite-latest"],
};
