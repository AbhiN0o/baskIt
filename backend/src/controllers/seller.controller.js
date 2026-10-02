import { generateToken, cookieOptions } from '../lib/utils.js';
import Seller from '../models/seller.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import { createVerificationToken, sendVerificationEmail } from "../lib/utils.js";
import crypto from "crypto";
export const signupHandler = async (req, res) => {
  try {
    const { email, fullName, password, businessName, description } = req.body;

    if (!email || !fullName || !password || !businessName) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

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
    const { profilePic, description, businessName } = req.body;

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

    if (description) updatedFields.description = description;
    if (businessName) updatedFields.businessName = businessName;

    const updatedSeller = await Seller.findByIdAndUpdate(
      req.user._id,
      updatedFields,
      { new: true }
    );

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
    const sellerId = req.params.sellerId;
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
