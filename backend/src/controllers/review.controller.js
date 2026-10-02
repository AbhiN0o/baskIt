import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import Seller from "../models/seller.model.js";
import { generateAISummary } from "../lib/ai.js"; //helper

export const createReview = async (req, res) => {
  try {
    const { productId, sellerId, rating, comment } = req.body;

    if (!rating || (!productId && !sellerId)) {
      return res.status(400).json({ message: "Rating and productId or sellerId are required" });
    }
    const reviewExists = await Review.findOne({
      user: req.user._id,
      ...(productId ? { product: productId } : {}),
      ...(sellerId ? { seller: sellerId } : {}),
    });
    if (reviewExists) {
      return res.status(400).json({ message: "You have already reviewed this product/seller" });
    }
    const review = new Review({
      user: req.user._id,
      product: productId,
      seller: sellerId,
      rating,
      comment,
    });

    const savedReview = await review.save();

    if (sellerId) {
      const seller = await Seller.findById(sellerId);
      if (seller) {
        seller.totalReviews += 1;

        // Recalculate avg rating: (oldTotal * oldAvg + newRating) / newTotal
        seller.rating =
          (seller.rating * (seller.totalReviews - 1) + rating) /
          seller.totalReviews;

        await seller.save();
      }
    }
    //also doing the saame to product
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        product.totalReviews += 1;
        product.rating =
          (product.rating * (product.totalReviews - 1) + rating) /
          product.totalReviews;
        await product.save();
      }
    }

    res.status(201).json({ message: "Review created successfully", review: savedReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();

    // keep the cached average rating / count on product + seller in sync
    const recalc = async (Model, field, id) => {
      if (!id) return;
      const stats = await Review.aggregate([
        { $match: { [field]: id } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
      await Model.findByIdAndUpdate(id, {
        rating: stats[0]?.avg || 0,
        totalReviews: stats[0]?.count || 0,
      });
    };
    await recalc(Product, "product", review.product);
    await recalc(Seller, "seller", review.seller);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "fullName profilePic")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId })
      .populate("user", "fullName profilePic")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getProductReviewsSummary = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId });
    const comments = reviews.map(r => r.comment).join("\n");

    const summary = await generateAISummary(comments, `Summarize product reviews for productId ${req.params.productId}`);

    res.json({ productId: req.params.productId, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate AI summary", error: err.message });
  }
};

export const getSellerReviewsSummary = async (req, res) => {
  try {
    const reviews = await Review.find({ seller: req.params.sellerId });
    const comments = reviews.map(r => r.comment).join("\n");

    const summary = await generateAISummary(comments, `Summarize seller reviews for sellerId ${req.params.sellerId}`);

    res.json({ sellerId: req.params.sellerId, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate AI summary", error: err.message });
  }
};
