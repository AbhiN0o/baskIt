import Product from "../models/product.model.js";
import { generateProductDetails, generateCareGuide } from "../lib/ai.js";

// Loads the product from the DB so the client can't make us run
// arbitrary prompts through our Gemini key.
export const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(await generateProductDetails(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate product details" });
  }
};

export const getProductCareGuide = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(await generateCareGuide(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate care guide" });
  }
};
