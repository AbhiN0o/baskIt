import { Router } from "express";
import { 
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductBySellerId
} from "../controllers/product.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { protectRoute, sellerOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getProducts);          
router.get("/:id", getProductById);  
router.get("/seller/:id", getProductBySellerId);    

//(Seller only)
router.post("/", protectRoute, sellerOnly, upload.array("images", 5), createProduct);  
router.put("/:id", protectRoute, sellerOnly, upload.array("images", 5), updateProduct); 
router.delete("/:id", protectRoute, sellerOnly, deleteProduct);

export default router;