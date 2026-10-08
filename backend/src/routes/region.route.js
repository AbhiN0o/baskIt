import { Router } from "express";
import { regionsForClient } from "../lib/regions.js";

const router = Router();
const payload = regionsForClient();

// { "Karnataka": ["Bengaluru", ...], ... } - drives every state/city dropdown.
router.get("/", (req, res) => {
  res.set("Cache-Control", "public, max-age=86400");
  res.json(payload);
});

export default router;
