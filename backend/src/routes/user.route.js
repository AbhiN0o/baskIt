import { Router } from "express";
import {  
  signupHandler, 
  loginHandler, 
  logoutHandler, 
  updateProfileHandler, 
  checkAuthHandler,
  followSellerHandler,
  unfollowSellerHandler,
  getFavoritesHandler,
  addFavoriteHandler,
  removeFavoriteHandler
} from "../controllers/user.controller.js";
import { protectRoute, userOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signupHandler);

router.post("/login", loginHandler);

router.post("/logout", protectRoute, userOnly, logoutHandler);

router.put("/profile", protectRoute, userOnly, updateProfileHandler);

router.get("/check", protectRoute, userOnly, checkAuthHandler);

// Favourites. Declared before the /:sellerId routes so "favorites" is never
// mistaken for a seller id.
router.get("/favorites", protectRoute, userOnly, getFavoritesHandler);
router.post("/favorites/:productId", protectRoute, userOnly, addFavoriteHandler);
router.delete("/favorites/:productId", protectRoute, userOnly, removeFavoriteHandler);

router.post("/:sellerId/follow", protectRoute, userOnly, followSellerHandler);

router.post("/:sellerId/unfollow", protectRoute, userOnly, unfollowSellerHandler);

export default router;