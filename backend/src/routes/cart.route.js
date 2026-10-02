import { Router } from "express";
import { protectRoute, userOnly } from "../middlewares/auth.middleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart
} from "../controllers/cart.controller.js";

const router = Router();

router.get("/", protectRoute, userOnly, getCart);

router.post("/add", protectRoute, userOnly, addToCart);

router.put("/update", protectRoute, userOnly, updateCartItem);

router.delete("/remove", protectRoute, userOnly, removeCartItem);

router.delete("/clear", protectRoute, userOnly, clearCart);

router.post("/checkout", protectRoute, userOnly, checkoutCart);

export default router;
