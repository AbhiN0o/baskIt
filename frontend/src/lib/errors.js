// Pull the most useful message out of an axios error.
export const errMsg = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
