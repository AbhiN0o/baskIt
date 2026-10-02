import { Router } from "express";
import {
  createReview,
  deleteReview,
  getProductReviews,
  getSellerReviews,
  getProductReviewsSummary,
  getSellerReviewsSummary
} from "../controllers/review.controller.js";
import { protectRoute, userOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", protectRoute, userOnly, createReview);

router.delete("/:id", protectRoute, userOnly, deleteReview);

router.get("/product/:productId", getProductReviews);

router.get("/product/:productId/summary", getProductReviewsSummary);

router.get("/seller/:sellerId", getSellerReviews);

router.get("/seller/:sellerId/summary", getSellerReviewsSummary);

export default router;
