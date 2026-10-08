import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true, 
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "general",
    },
    images: [
      {
        type: String, 
      }
    ],
    tags: [
      {
        type: String,
      }
    ],
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"], // last line of defence against overselling
    },
    rating: {
      type: Number,
      default: 0, 
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Denormalised from the seller so the marketplace can filter by region
    // without a join. Kept in sync when the seller changes their region.
    state: { type: String, default: "", index: true },
    city: { type: String, default: "", index: true },
    isActive: {
      type: Boolean,
      default: true, 
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
