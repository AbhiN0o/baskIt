import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { reserveStock, releaseStock } from "../lib/stock.js";

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("products.product", "title price images");

    if (!cart) {
      cart = new Cart({ user: req.user._id, products: [], totalAmount: 0 });
      await cart.save();
    }

    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, products: [], totalAmount: 0 });
    }

    const existingItemIndex = cart.products.findIndex(p => p.product.toString() === productId);

    if (existingItemIndex > -1) {
      cart.products[existingItemIndex].quantity += quantity || 1;
    } else {
      cart.products.push({ product: product._id, quantity: quantity || 1 });
    }

    cart.totalAmount = 0;
    for (const item of cart.products) {
      const prod = await Product.findById(item.product);
      cart.totalAmount += prod.price * item.quantity;
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity)
      return res.status(400).json({ message: "Product ID and quantity are required" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.products.findIndex(p => p.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: "Product not in cart" });

    cart.products[itemIndex].quantity = quantity;

    cart.totalAmount = 0;
    for (const item of cart.products) {
      const prod = await Product.findById(item.product);
      cart.totalAmount += prod.price * item.quantity;
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter(p => p.product.toString() !== productId);

    cart.totalAmount = 0;
    for (const item of cart.products) {
      const prod = await Product.findById(item.product);
      cart.totalAmount += prod.price * item.quantity;
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();

    res.json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const checkoutCart = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("products.product");
    if (!cart || cart.products.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    // Skip items whose product was deleted since being added to the cart
    const items = cart.products.filter((item) => item.product);
    if (items.length === 0) return res.status(400).json({ message: "Cart is empty" });

    // Price from the live product, not the cart's stored total (which can be stale)
    const orderProducts = items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
    }));
    const totalAmount = orderProducts.reduce((sum, l) => sum + l.price * l.quantity, 0);

    // Atomic, all-or-nothing stock reservation (see lib/stock.js)
    const stockLines = orderProducts.map((l) => ({ productId: l.product, quantity: l.quantity }));
    const reservation = await reserveStock(stockLines);
    if (!reservation.ok) {
      const failed = items.find((i) => i.product._id.toString() === reservation.failedProductId.toString());
      return res.status(409).json({
        message: `Sorry, "${failed?.product.title || "an item"}" just sold out or doesn't have enough stock left`,
      });
    }

    const order = new Order({
      user: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "online" ? "pending" : "completed",
    });

    try {
      await order.save();
    } catch (saveErr) {
      await releaseStock(stockLines);
      throw saveErr;
    }

    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
