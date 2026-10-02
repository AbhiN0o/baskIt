import { Router } from "express";
import {  
  signupHandler, 
  loginHandler, 
  logoutHandler, 
  updateProfileHandler, 
  checkAuthHandler,
  getFollowersHandler,
  sendVerificationHandler,
  verifySeller
} from "../controllers/seller.controller.js"; 
import { protectRoute, sellerOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupHandler);

router.post("/login", loginHandler);

router.post("/logout", protectRoute, sellerOnly, logoutHandler);

router.put("/profile", protectRoute, sellerOnly, updateProfileHandler);

router.get("/check", protectRoute, sellerOnly, checkAuthHandler);

router.get("/:id/followers", protectRoute, sellerOnly, getFollowersHandler);

router.post("/send-verification", protectRoute, sellerOnly, sendVerificationHandler);

router.get("/verify", verifySeller);

export default router;
