import { generateToken, cookieOptions } from '../lib/utils.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import Seller from '../models/seller.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import { validateRegion } from '../lib/regions.js';

export const signupHandler = async (req, res) => {
  try {
    const { email, fullName, password, address, state, city } = req.body;
    if (!email || !fullName || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const regionError = validateRegion(state, city);
    if (regionError) return res.status(400).json({ message: regionError });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 
    const newUser = await User.create({
      email,
      fullName,
      password: hashedPassword,
      address,
      state,
      city,
    });

    // Generate JWT for this user with type 'user'
    generateToken(newUser._id, "user", res);

    return res.status(201).json({ 
      message: "User created successfully", 
      user: newUser,
      type: "user"
    });

  } catch (error) {
    console.log("Error in signupHandler:", error);   
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT for this user with type 'user'
    generateToken(user._id, "user", res);

    return res.status(200).json({
      message: "Login successful",
      user,
      type: "user"
    });

  } catch (error) {
    console.log("Error in loginHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const logoutHandler = async (req, res) => {
  try {
    res.clearCookie('jwt', cookieOptions);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("Error in logoutHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateProfileHandler = async (req, res) => {
  try {
    const { profilePic, address, state, city } = req.body;
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const updates = {};

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "profilePics",
      });
      updates.profilePic = uploadResponse.secure_url;
    }

    if (typeof address === "string") updates.address = address.trim();

    // Region is edited as a pair so state/city can never disagree.
    if (state !== undefined || city !== undefined) {
      const regionError = validateRegion(state, city);
      if (regionError) return res.status(400).json({ message: regionError });
      updates.state = state;
      updates.city = city;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
      type: "user"
    });

  } catch (error) {
    console.log("Error in updateProfileHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const checkAuthHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user,
      type: "user" });

  } catch (error) {
    console.log("Error in checkAuthHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const followSellerHandler = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sellerId } = req.params;

    if (!sellerId) return res.status(400).json({ message: "Seller ID is required" });

    const user = await User.findById(userId);
    const seller = await Seller.findById(sellerId);

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (user.follows.includes(sellerId))
      return res.status(400).json({ message: "Already following this seller" });

    user.follows.push(sellerId);
    await user.save();

    seller.followers = seller.followers || [];
    seller.followers.push(userId);
    await seller.save();

    res.json({ message: `You are now following ${seller.businessName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};


export const unfollowSellerHandler = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sellerId } = req.params;

    if (!sellerId) return res.status(400).json({ message: "Seller ID is required" });

    const user = await User.findById(userId);
    const seller = await Seller.findById(sellerId);

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    user.follows = user.follows.filter(id => id.toString() !== sellerId);
    await user.save();

    seller.followers = (seller.followers || []).filter(id => id.toString() !== userId.toString());
    await seller.save();

    res.json({ message: `You have unfollowed ${seller.businessName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};



// ---- Favourites (wishlist) ---------------------------------------------
export const getFavoritesHandler = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favorites",
      match: { isActive: true },
      populate: { path: "seller", select: "businessName verified state city" },
    });
    res.json((user.favorites || []).filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const addFavoriteHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // $addToSet keeps this idempotent (double-clicks can't create duplicates)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: productId } },
      { new: true }
    );
    res.json({ message: "Saved", favorites: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const removeFavoriteHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: productId } },
      { new: true }
    );
    res.json({ message: "Removed", favorites: user.favorites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
