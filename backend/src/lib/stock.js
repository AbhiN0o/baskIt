import Product from "../models/product.model.js";

/**
 * Put stock back (used when an order can't be completed).
 * lines: [{ productId, quantity }]
 */
export const releaseStock = async (lines) => {
  await Promise.all(
    lines.map((l) =>
      Product.updateOne({ _id: l.productId }, { $inc: { quantity: l.quantity } })
    )
  );
};

/**
 * Reserve stock for every line, atomically per product.
 *
 * Each reservation is ONE database command: "reduce quantity by N, but only
 * if quantity is at least N". MongoDB applies a single-document update
 * atomically, so two buyers racing for the last unit can never both win -
 * the second one's filter simply doesn't match.
 *
 * If any line fails, everything reserved so far is put back, so an order is
 * all-or-nothing.
 *
 * lines: [{ productId, quantity }]
 * returns { ok: true } or { ok: false, failedProductId }
 */
export const reserveStock = async (lines) => {
  const reserved = [];
  try {
    for (const line of lines) {
      const updated = await Product.findOneAndUpdate(
        { _id: line.productId, isActive: true, quantity: { $gte: line.quantity } },
        { $inc: { quantity: -line.quantity } },
        { new: true }
      );
      if (!updated) {
        await releaseStock(reserved);
        return { ok: false, failedProductId: line.productId };
      }
      reserved.push(line);
    }
    return { ok: true };
  } catch (err) {
    // database error half-way through: undo what we took, then bubble up
    await releaseStock(reserved);
    throw err;
  }
};
