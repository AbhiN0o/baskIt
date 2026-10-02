import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/user.route.js";
import sellerRoutes from "./routes/seller.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import cartRoutes from "./routes/cart.route.js";
import statsRoutes from "./routes/stats.route.js";
import reviewRoutes from "./routes/review.route.js";
import aiRoutes from "./routes/ai.route.js";

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// Render (and most hosts) sit behind a reverse proxy. Without this, Express
// thinks every request is plain HTTP and will refuse to set `Secure` cookies.
app.set("trust proxy", 1);

// FRONTEND_URL can be a single URL or a comma separated list.
// e.g. https://baskit.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools (curl, health checks) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      const err = new Error(`CORS blocked for origin: ${origin}`);
      err.status = 403;
      return cb(err);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Health check (used by Render + handy for uptime pings)
app.get("/", (req, res) => res.json({ name: "Baskit API", status: "ok" }));
app.get("/health", (req, res) => res.status(200).send("ok"));

app.use("/api/user", userRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);

// Fallback error handler (e.g. CORS errors, multer errors)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const startServer = async () => {
  // Listen first so Render's port scan succeeds immediately,
  // then connect to the database.
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (${isProd ? "production" : "development"})`);
    console.log("Allowed origins:", allowedOrigins.join(", "));
  });

  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

startServer();
