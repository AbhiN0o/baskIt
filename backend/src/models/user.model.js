import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    follows: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
      }
    ],
    profilePic: {
      type: String,
      default: "https://img.myloview.com/stickers/default-avatar-profile-icon-vector-social-media-user-photo-700-205577532.jpg",
    },
    orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      }
    ],
    address: {
      type: String,
      default: "",
    },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      }
    ],
  },

  {
    timestamps: true,
  }
);


const stripSecrets = (doc, ret) => {
  delete ret.password;
  delete ret.verificationToken;
  delete ret.verificationTokenExpires;
  delete ret.__v;
  return ret;
};
userSchema.set("toJSON", { transform: stripSecrets });

const User = mongoose.model("User", userSchema);
export default User;

