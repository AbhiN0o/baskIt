import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { reserveStock, releaseStock } from "../lib/stock.js";

// Orders a seller may touch = orders containing at least one of their products.
const sellerProductIds = (sellerId) => Product.find({ seller: sellerId }).distinct("_id");

const orderHasSellerItems = (order, idSet) =>
  order.products.some((l) => idSet.has((l.product?._id || l.product).toString()));


export const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;
    const userId = req.user._id; 

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required and cannot be empty" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // Validate shipping address fields


    // Validate each product in the array
    const validatedProducts = [];
    let totalAmount = 0;
    const outOfStockItems = [];
    const notFoundItems = [];

    for (const item of products) {
      const { productId, quantity } = item;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required for all items" });
      }

      // whole units only (never 0.5, never negative)
      const qty = Number.isInteger(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;

      // Find and validate product using your model fields
      const productDoc = await Product.findById(productId)
        .populate("seller", "businessName verified");

      if (!productDoc) {
        notFoundItems.push(productId);
        continue;
      }

      // Check if product is active (using your isActive field)
      if (!productDoc.isActive) {
        return res.status(400).json({ 
          message: `Product "${productDoc.title}" is no longer available`,
        });
      }

      // Check stock availability (using your quantity field)
      if (productDoc.quantity < qty) {
        outOfStockItems.push({
          productId: productDoc._id,
          productName: productDoc.title,
          requested: qty,
          available: productDoc.quantity
        });
        continue;
      }

      // Add to validated products (using your model field names)
      validatedProducts.push({
        product: productDoc._id,
        quantity: qty,
        price: productDoc.price,
        title: productDoc.title,
        category: productDoc.category,
        seller: productDoc.seller
      });

      // Calculate total using your price field
      totalAmount += productDoc.price * qty;
    }

    // Check for validation errors
    if (notFoundItems.length > 0) {
      return res.status(404).json({ 
        message: "Some products were not found", 
        notFoundItems 
      });
    }

    if (outOfStockItems.length > 0) {
      return res.status(400).json({ 
        message: "Some items are out of stock or don't have sufficient quantity", 
        outOfStockItems 
      });
    }

    if (validatedProducts.length === 0) {
      return res.status(400).json({ message: "No valid products to order" });
    }

    // Take the stock FIRST, atomically. The earlier stock check above is only
    // a friendly pre-check; this is the step that actually prevents overselling.
    const stockLines = validatedProducts.map((item) => ({ productId: item.product, quantity: item.quantity }));
    const reservation = await reserveStock(stockLines);
    if (!reservation.ok) {
      const failed = validatedProducts.find((i) => i.product.toString() === reservation.failedProductId.toString());
      return res.status(409).json({
        message: `Sorry, "${failed?.title || "an item"}" just sold out or doesn't have enough stock left`,
      });
    }

    // Create the order. If saving fails, give the stock back.
    const order = new Order({
      user: userId,
      products: validatedProducts.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
    });

    try {
      await order.save();
    } catch (saveErr) {
      await releaseStock(stockLines);
      throw saveErr;
    }

    // Populate the order with product details using your model fields
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'fullName email')
      .populate('products.product', 'title images price category seller tags rating totalReviews');

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
      summary: {
        totalItems: validatedProducts.length,
        totalQuantity: validatedProducts.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount
      }
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.product", "title price images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("products.product", "title price images");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const ids = new Set((await sellerProductIds(req.user._id)).map(String));
    if (!orderHasSellerItems(order, ids)) {
      return res.status(403).json({ message: "This order doesn't contain your products" });
    }

    const wasCancelled = order.orderStatus === "cancelled";
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // Put stock back (once) when an order is cancelled
    if (orderStatus === "cancelled" && !wasCancelled) {
      await Promise.all(
        order.products
          .filter((l) => ids.has(l.product.toString()))
          .map((l) => Product.findByIdAndUpdate(l.product, { $inc: { quantity: l.quantity } }))
      );
    }

    const updatedOrder = await order.save();
    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // An order can only be deleted by a seller when EVERY item in it is theirs,
    // otherwise they'd be erasing other artisans' sales.
    const ids = new Set((await sellerProductIds(req.user._id)).map(String));
    const allMine = order.products.every((l) => ids.has(l.product.toString()));
    if (!allMine) {
      return res.status(403).json({ message: "This order includes other artisans' products" });
    }

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

// Orders for the logged-in seller only, trimmed to that seller's line items.
export const getSellerOrders = async (req, res) => {
  try {
    const ids = await sellerProductIds(req.user._id);
    const idSet = new Set(ids.map(String));

    const orders = await Order.find({ "products.product": { $in: ids } })
      .populate("user", "fullName email city state")
      .populate("products.product", "title price images")
      .sort({ createdAt: -1 });

    const result = orders.map((o) => {
      const obj = o.toObject();
      obj.orderTotal = obj.totalAmount;
      obj.products = obj.products.filter((l) => l.product && idSet.has(l.product._id.toString()));
      obj.totalAmount = obj.products.reduce((sum, l) => sum + l.price * l.quantity, 0);
      return obj;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
