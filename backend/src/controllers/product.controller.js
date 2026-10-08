import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import Seller from "../models/seller.model.js";
import mongoose from "mongoose";

const toTags = (tags) => {
  if (!tags) return [];
  const arr = Array.isArray(tags) ? tags : String(tags).split(",");
  return arr.map((t) => t.trim()).filter(Boolean);
};
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");



export const createProduct = async (req, res) => {
  try {
 const { title, description, price, category, tags, quantity } = req.body;
    const seller = await Seller.findById(req.user._id).select("state city");
    
    let imageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(file.buffer);
        });
        imageUrls.push(result.secure_url);
      }
    }

    const newProduct = new Product({
      seller: req.user.sellerId,
      title,
      description,
      price,
      category,
      images: imageUrls,
      tags: toTags(tags),
      quantity,
      state: seller?.state || "",
      city: seller?.city || "",
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
// backend/src/controllers/product.controller.js

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own products" });
    }
    const { title, description, price, category, tags, quantity, keepImages } = req.body;

    if (title) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined && price !== "") product.price = price;
    if (category) product.category = category;
    if (tags !== undefined) product.tags = toTags(tags);
    // `if (quantity)` would make it impossible to set stock to 0
    if (quantity !== undefined && quantity !== "") product.quantity = quantity;

    // The client sends `keepImages[]` (the URLs to keep). If it's absent we keep
    // every existing image rather than silently deleting them all.
    if (keepImages !== undefined) {
      const keep = Array.isArray(keepImages) ? keepImages : [keepImages];
      const imagesToDelete = product.images.filter((img) => !keep.includes(img));
      for (const url of imagesToDelete) {
        const segments = url.split("/");
        const filename = segments[segments.length - 1];
        const publicId = `products/${filename.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }
      product.images = product.images.filter((img) => keep.includes(img));
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (err, result) => (err ? reject(err) : resolve(result))
          );
          stream.end(file.buffer);
        });
        product.images.push(result.secure_url);
      }
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, seller, state, city, sort } = req.query;

    let filter = { isActive: true };

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (search) filter.title = { $regex: escapeRegex(String(search)), $options: "i" };
    if (seller) {
      if (!mongoose.isValidObjectId(seller)) return res.json([]);
      filter.seller = seller;
    }
    if (state) filter.state = state;
    if (city) filter.city = city;

    const sorts = {
      newest: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      rating: { rating: -1, createdAt: -1 },
    };

    const products = await Product.find(filter)
      .populate("seller", "businessName verified state city")
      .sort(sorts[sort] || sorts.newest);

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "businessName verified state city profilePic description");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Product not found" });
    if (existing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own products" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);

    for (const url of product.images) {
      const segments = url.split("/");
      const filename = segments[segments.length - 1]; 
      const publicId = `products/${filename.split(".")[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getProductBySellerId = async (req, res) => {
  try {
    const sellerId = req.params.id;
    if (!mongoose.isValidObjectId(sellerId)) return res.json([]);

    const products = await Product.find({ seller: sellerId, isActive: true })
      .populate("seller", "businessName verified") // populate basic seller info
      .sort({ createdAt: -1 }); // newest first

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
