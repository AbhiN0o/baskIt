import { Router } from "express";
import { 
  getCategoriesStats,
  getSellerStats
} from "../controllers/stats.controller.js";
// import { protectRoute, userOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/categories", getCategoriesStats);
router.get("/sales", getSellerStats);

export default router;