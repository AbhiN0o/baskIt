import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Seller from "../models/seller.model.js";

const DAY = 24 * 60 * 60 * 1000;
// Buckets are cut at midnight India time (UTC+5:30) so "today" matches what a
// seller in India sees on their own clock.
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const dayKey = (d) => new Date(new Date(d).getTime() + IST_OFFSET).toISOString().slice(0, 10);
const pctChange = (now, prev) => {
  if (prev === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - prev) / prev) * 1000) / 10;
};

// GET /api/stats/seller  (seller only)
// Everything on the seller dashboard, computed from this seller's real orders.
export const getMySellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const [products, seller] = await Promise.all([
      Product.find({ seller: sellerId }).select("title category quantity price images isActive"),
      Seller.findById(sellerId).select("followers rating totalReviews"),
    ]);
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orders = await Order.find({ "products.product": { $in: [...productMap.keys()] } })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    const now = Date.now();
    const statusCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    const categoryMap = new Map();
    const productSales = new Map();
    const daily = new Map();
    for (let i = 6; i >= 0; i--) daily.set(dayKey(now - i * DAY), 0);

    let revenue = 0, units = 0, countedOrders = 0;
    let rev30 = 0, revPrev30 = 0, ord30 = 0, ordPrev30 = 0;
    const recentOrders = [];

    for (const order of orders) {
      const mine = order.products.filter((l) => productMap.has(l.product.toString()));
      if (mine.length === 0) continue;

      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;
      const orderRevenue = mine.reduce((sum, l) => sum + l.price * l.quantity, 0);

      if (recentOrders.length < 5) {
        recentOrders.push({
          _id: order._id,
          customer: order.user?.fullName || "Customer",
          total: orderRevenue,
          status: order.orderStatus,
          createdAt: order.createdAt,
        });
      }

      // Cancelled orders don't count as sales.
      if (order.orderStatus === "cancelled") continue;

      countedOrders += 1;
      revenue += orderRevenue;
      const age = now - new Date(order.createdAt).getTime();
      if (age <= 30 * DAY) { rev30 += orderRevenue; ord30 += 1; }
      else if (age <= 60 * DAY) { revPrev30 += orderRevenue; ordPrev30 += 1; }

      const k = dayKey(order.createdAt);
      if (daily.has(k)) daily.set(k, daily.get(k) + orderRevenue);

      for (const l of mine) {
        const p = productMap.get(l.product.toString());
        const lineRevenue = l.price * l.quantity;
        units += l.quantity;
        const cat = (p.category || "general").trim() || "general";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + lineRevenue);
        const prev = productSales.get(p._id.toString()) || { title: p.title, revenue: 0, units: 0 };
        prev.revenue += lineRevenue;
        prev.units += l.quantity;
        productSales.set(p._id.toString(), prev);
      }
    }

    res.json({
      totals: {
        revenue,
        orders: countedOrders,
        unitsSold: units,
        products: products.length,
        followers: seller?.followers?.length || 0,
        rating: seller?.rating || 0,
        totalReviews: seller?.totalReviews || 0,
      },
      changes: {
        revenue: pctChange(rev30, revPrev30),
        orders: pctChange(ord30, ordPrev30),
        hasHistory: revPrev30 > 0 || ordPrev30 > 0,
      },
      dailyRevenue: [...daily.entries()].map(([date, amount]) => ({ date, amount })),
      categories: [...categoryMap.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6),
      topProducts: [...productSales.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      statusCounts,
      lowStock: products
        .filter((p) => p.isActive && p.quantity <= 3)
        .map((p) => ({ _id: p._id, title: p.title, quantity: p.quantity }))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5),
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

// GET /api/stats/public  (no auth) - honest numbers for the landing page.
export const getPublicStats = async (req, res) => {
  try {
    const [artisans, products, states, cities] = await Promise.all([
      Seller.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Seller.distinct("state", { state: { $ne: "" } }),
      Seller.distinct("city", { city: { $ne: "" } }),
    ]);
    res.json({ artisans, products, states: states.length, cities: cities.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
