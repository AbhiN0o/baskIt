import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: function () {
        return !this.seller; 
      },
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: function () {
        return !this.product; 
      },
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per product, and one per user per seller.
// partialFilterExpression stops "no product" (seller reviews) from colliding as null.
reviewSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { product: { $type: "objectId" } } }
);
reviewSchema.index(
  { user: 1, seller: 1 },
  { unique: true, partialFilterExpression: { seller: { $type: "objectId" } } }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
