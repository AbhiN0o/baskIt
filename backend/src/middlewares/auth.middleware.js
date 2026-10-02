import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Seller from "../models/seller.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: "Unauthorized access" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ message: "Invalid token" });

    // Check token type
    if (decoded.type === "seller") {
      const seller = await Seller.findById(decoded.id);
      if (!seller) return res.status(401).json({ message: "Seller not found" });
      req.user = seller;
      req.user.sellerId = seller._id; // used in product routes
      req.user.type = "seller";
    } else if (decoded.type === "user") {
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "User not found" });
      req.user = user;
      req.user.type = "user";
    } else {
      return res.status(401).json({ message: "Invalid token type" });
    }

    next();
  } catch (error) {
    console.error("Error in protectRoute:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const sellerOnly = (req, res, next) => {
  try {
    if (!req.user || req.user.type !== "seller") {
      return res.status(403).json({ message: "Access denied: sellers only" });
    }
    next();
  } catch (error) {
    console.error("Error in sellerOnly middleware:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const userOnly = (req, res, next) => {
  try {
    if (!req.user || req.user.type !== "user") {
      return res.status(403).json({ message: "Access denied: Users only" });
    }
    next();
  } catch (error) {
    console.error("Error in userOnly middleware:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// export const adminOnly = (req, res, next) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ message: "Access denied: Admins only" });
//   }
//   next();
// };