import { generateToken, cookieOptions } from '../lib/utils.js';
import Seller from '../models/seller.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import { createVerificationToken, sendVerificationEmail } from "../lib/utils.js";
import crypto from "crypto";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { validateRegion } from "../lib/regions.js";
export const signupHandler = async (req, res) => {
  try {
    const { email, fullName, password, businessName, description, state, city } = req.body;

    if (!email || !fullName || !password || !businessName) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const regionError = validateRegion(state, city);
    if (regionError) return res.status(400).json({ message: regionError });

    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: "Seller already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSeller = await Seller.create({
      email,
      fullName,
      password: hashedPassword,
      businessName,
      description: description || "",
      state,
      city,
    });

    generateToken(newSeller._id, "seller", res);
    
    return res.status(201).json({
      message: "Seller created successfully",
      user: newSeller,
      type: "seller"
    });

  } catch (error) {
    console.error("Error in signupHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const loginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(400).json({ message: "Seller does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(seller._id, "seller", res);

    return res.status(200).json({
      message: "Login successful",
      user: seller,
      type: "seller"
    });

  } catch (error) {
    console.error("Error in loginHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const logoutHandler = async (req, res) => {
  try {
    res.clearCookie('jwt', cookieOptions);

    return res.status(200).json({ message: "Logout successful" });

  } catch (error) {
    console.error("Error in logoutHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateProfileHandler = async (req, res) => {
  try {
    const { profilePic, description, businessName, state, city } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    let updatedFields = {};

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "profilePics/sellers",
      });
      updatedFields.profilePic = uploadResponse.secure_url;
    }

    if (description !== undefined) updatedFields.description = description;
    if (businessName) updatedFields.businessName = businessName;

    // Region is edited as a pair so state/city can never disagree.
    const regionChanged = state !== undefined || city !== undefined;
    if (regionChanged) {
      const regionError = validateRegion(state, city);
      if (regionError) return res.status(400).json({ message: regionError });
      updatedFields.state = state;
      updatedFields.city = city;
    }

    const updatedSeller = await Seller.findByIdAndUpdate(
      req.user._id,
      updatedFields,
      { new: true }
    );

    // Keep the denormalised region on this seller's listings in sync.
    if (regionChanged) {
      await Product.updateMany({ seller: req.user._id }, { state, city });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedSeller,
      type: "seller"
    });

  } catch (error) {
    console.error("Error in updateProfileHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const checkAuthHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const seller = await Seller.findById(req.user._id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    return res.status(200).json({ user: seller,
      type: "seller" });

  } catch (error) {
    console.error("Error in checkAuthHandler:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getFollowersHandler = async (req, res) => {
  try {
    const sellerId = req.params.id;
    // A seller may only read their own follower count.
    if (sellerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own followers" });
    }
    const seller = await Seller.findById(sellerId);

    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const followersCount = seller.followers ? seller.followers.length : 0;
    res.json({ sellerId, followersCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const sendVerificationHandler = async (req, res) => {
  try {
    const sellerId = req.user._id; // from auth middleware
    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.verified) {
      return res.status(400).json({ message: "Seller already verified" });
    }

    const { token, hashedToken, expires } = createVerificationToken();
    seller.verificationToken = hashedToken;
    seller.verificationTokenExpires = expires;

    await seller.save();

    await sendVerificationEmail(seller.email, token);

    res.json({ message: "Verification email sent successfully" });
  } catch (err) {
    console.error("Error in sendVerificationHandler:", err);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

export const verifySeller = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const seller = await Seller.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!seller) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    seller.verified = true;
    seller.verificationToken = undefined;
    seller.verificationTokenExpires = undefined;

    await seller.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      verified: true,
    });
  } catch (err) {
    console.error("Error in verifySeller:", err);
    res.status(500).json({ message: "Verification failed in backmacha" });
  }
};


// Public artisan profile (no auth needed). `isFollowing` is filled in when the
// visitor happens to be a logged-in buyer.
export const getPublicSeller = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Artisan not found" });
    }

    const seller = await Seller.findById(id).select(
      "businessName fullName description profilePic verified rating totalReviews state city createdAt followers"
    );
    if (!seller) return res.status(404).json({ message: "Artisan not found" });

    const productsCount = await Product.countDocuments({ seller: id, isActive: true });
    const isFollowing =
      req.user?.type === "user" &&
      (req.user.follows || []).some((f) => f.toString() === id);

    res.json({
      _id: seller._id,
      businessName: seller.businessName,
      fullName: seller.fullName,
      description: seller.description,
      profilePic: seller.profilePic,
      verified: seller.verified,
      rating: seller.rating,
      totalReviews: seller.totalReviews,
      state: seller.state,
      city: seller.city,
      createdAt: seller.createdAt,
      followersCount: seller.followers?.length || 0,
      productsCount,
      isFollowing,
    });
  } catch (error) {
    console.error("Error in getPublicSeller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
