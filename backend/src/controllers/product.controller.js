import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";


export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, tags, quantity } = req.body;
    
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
      tags: Array.isArray(tags) ? tags : tags.split(","),
      quantity,
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
    const { title, description, price, category, tags, quantity, images } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (tags) product.tags = Array.isArray(tags) ? tags : tags.split(",");
    if (quantity) product.quantity = quantity;
    const keepImages = Array.isArray(images) ? images : []; //edge case checkin
    const imagesToDelete = product.images.filter(img => !keepImages.includes(img));
    for (const url of imagesToDelete) {
      const segments = url.split("/");
      const filename = segments[segments.length - 1]; 
      const publicId = `products/${filename.split(".")[0]}`;

      await cloudinary.uploader.destroy(publicId);
    }

    product.images = keepImages || [];

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
    const { category, minPrice, maxPrice, search } = req.query;

    let filter = { isActive: true };

    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (search) filter.title = { $regex: search, $options: "i" }; 

    const products = await Product.find(filter)
      .populate("seller", "businessName verified") 
      .sort({ createdAt: -1 }); 

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "businessName verified");

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

    const products = await Product.find({ seller: sellerId })
      .populate("seller", "businessName verified") // populate basic seller info
      .sort({ createdAt: -1 }); // newest first

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found for this seller" });
    }

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
