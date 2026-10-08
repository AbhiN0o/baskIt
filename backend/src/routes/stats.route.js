import { Router } from "express";
import { getMySellerStats, getPublicStats } from "../controllers/stats.controller.js";
import { protectRoute, sellerOnly } from "../middlewares/auth.middleware.js";

const router = Router();

// Per-seller analytics: only the logged-in seller's own data.
router.get("/seller", protectRoute, sellerOnly, getMySellerStats);

// Landing-page numbers (counts only, nothing private).
router.get("/public", getPublicStats);

export default router;
