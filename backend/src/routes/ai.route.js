import { Router } from "express";
import { getProductDetails, getProductCareGuide } from "../controllers/ai.controller.js";

const router = Router();

router.get("/product/:productId/details", getProductDetails);
router.get("/product/:productId/care", getProductCareGuide);

export default router;
