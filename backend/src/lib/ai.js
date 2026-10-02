import { GoogleGenAI } from "@google/genai";

// Model is configurable because Google retires models regularly
// (gemini-1.5-flash no longer exists). Set GEMINI_MODEL in your env to change it.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

let client;
const getClient = () => {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
};

const generate = async (prompt) => {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  return (
    response?.text?.trim() ||
    response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    ""
  );
};

// Gemini sometimes wraps JSON in ```json fences - strip them before parsing.
const parseJSON = (text) => JSON.parse(text.replace(/```json|```/g, "").trim());

export const generateAISummary = async (text, promptPrefix = "") => {
  try {
    if (!text || text.trim() === "") return "No reviews available to summarize.";

    const prompt = `
      ${promptPrefix}
      You are given some customer reviews.
      Write a short, neutral, professional summary of 3-5 sentences for a person reading the reviews.
      Rules:
      - Do NOT mention seller IDs, product IDs, usernames, or system-related details.
      - Do NOT start with generic phrases like "Customer reviews for seller ID...".
      - If the reviews are very short or vague, say so briefly and summarise what little they convey.

      Here are the reviews:
      ${text}
    `;
    return (await generate(prompt)) || "No summary generated.";
  } catch (error) {
    console.error("Error generating AI summary:", error.message);
    return "Failed to generate summary.";
  }
};

const productInfo = (p = {}) => `
Product Title: ${p.title || "Unknown Product"}
Category: ${p.category || "General"}
Description: ${p.description || "No description"}
Tags: ${Array.isArray(p.tags) ? p.tags.join(", ") : "None"}
Price: ${p.price ?? 0}
`;

export const generateProductDetails = async (product) => {
  const fallback = {
    material: "High-quality materials",
    dimensions: "Standard size",
    weight: "Lightweight",
    origin: "Handcrafted",
    craftTime: "Made to order",
    packaging: "Eco-friendly packaging",
  };
  try {
    const prompt = `
You are a product specification expert. Based on the product below, produce realistic specifications.
${productInfo(product)}
Respond with ONLY valid JSON (no markdown) in exactly this shape:
{"material":"","dimensions":"","weight":"","origin":"","craftTime":"","packaging":""}
Be specific to the product category, use sensible units, and keep it professional.`;
    return { ...fallback, ...parseJSON(await generate(prompt)) };
  } catch (error) {
    console.error("Error generating product details:", error.message);
    return fallback;
  }
};

export const generateCareGuide = async (product) => {
  const fallback = {
    generalCare: "Handle with care and store in a safe place.",
    cleaning: { title: "Cleaning Instructions", description: "Clean gently with methods appropriate for the material." },
    storage: { title: "Storage Guidelines", description: "Store in a cool, dry place away from direct sunlight." },
    maintenance: { title: "Maintenance Tips", description: "Regular gentle maintenance will extend the product's lifespan." },
    warnings: { title: "Important Warnings", description: "Avoid harsh chemicals and extreme temperatures." },
  };
  try {
    const prompt = `
You are a product care expert. Write practical care instructions for the product below.
${productInfo(product)}
Respond with ONLY valid JSON (no markdown) in exactly this shape:
{"generalCare":"2-3 sentences","cleaning":{"title":"Cleaning Instructions","description":""},"storage":{"title":"Storage Guidelines","description":""},"maintenance":{"title":"Maintenance Tips","description":""},"warnings":{"title":"Important Warnings","description":""}}`;
    return { ...fallback, ...parseJSON(await generate(prompt)) };
  } catch (error) {
    console.error("Error generating care guide:", error.message);
    return fallback;
  }
};
