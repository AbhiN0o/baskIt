import { Router } from "express";
import { protectRoute, userOnly, sellerOnly } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAllOrders,
} from "../controllers/order.controller.js";

const router = Router();

//for users
router.post("/", protectRoute, userOnly, createOrder);
router.get("/", protectRoute, userOnly, getUserOrders);

//for sellers - PUT SPECIFIC ROUTES BEFORE PARAMETERIZED ROUTES
router.get("/all", protectRoute, sellerOnly, getAllOrders); // ✅ Move this BEFORE /:id
router.put("/:id/status", protectRoute, sellerOnly, updateOrderStatus);
router.delete("/:id", protectRoute, sellerOnly, deleteOrder);

// PUT PARAMETERIZED ROUTES LAST
router.get("/:id", protectRoute, userOnly, getOrderById); // ✅ Move this AFTER /all

export default router;
