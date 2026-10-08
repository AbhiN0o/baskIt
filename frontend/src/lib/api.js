import { axiosInstance } from './axios';

// ---------------------------------------------------------------- auth
export const userSignup = async (signupData) => {
  const response = await axiosInstance.post('/user/signup', signupData);
  return response.data;
};
export const sellerSignup = async (signupData) => {
  const response = await axiosInstance.post('/seller/signup', signupData);
  return response.data;
};
export const userLogin = async (loginData) => {
  const response = await axiosInstance.post('/user/login', loginData);
  return response.data;
};
export const sellerLogin = async (loginData) => {
  const response = await axiosInstance.post('/seller/login', loginData);
  return response.data;
};
export const logout = async (type) => {
  const endpoint = type === 'seller' ? '/seller/logout' : '/user/logout';
  const response = await axiosInstance.post(endpoint);
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get('/user/check');
    return res.data;
  } catch {
    try {
      const res = await axiosInstance.get('/seller/check');
      return res.data;
    } catch {
      return null; // not logged in
    }
  }
};

// ------------------------------------------------------------- regions
// { "Karnataka": ["Bengaluru", ...], ... }
export const getRegions = async () => {
  const res = await axiosInstance.get('/regions');
  return res.data;
};

// ------------------------------------------------------------ products
// params: { search, category, seller, state, city, sort, minPrice, maxPrice }
export const getAllProducts = async (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const res = await axiosInstance.get('/products', { params: clean });
  return res.data;
};

export const getProduct = async (id) => {
  const res = await axiosInstance.get(`/products/${id}`);
  return res.data;
};

export const getSellerProducts = async (sellerId) => {
  const res = await axiosInstance.get(`/products/seller/${sellerId}`);
  return res.data;
};

export const createProduct = async (productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    if (key === 'images') {
      productData.images.forEach((image) => formData.append('images', image));
    } else if (key === 'keepImages') {
      // only meaningful when editing
    } else if (key === 'tags') {
      formData.append(key, productData[key].join(','));
    } else {
      formData.append(key, productData[key]);
    }
  });
  const response = await axiosInstance.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const formData = new FormData();

  Object.keys(productData).forEach((key) => {
    if (key !== 'images' && key !== 'keepImages') {
      if (key === 'tags' && Array.isArray(productData.tags)) {
        productData.tags.forEach((tag) => formData.append('tags[]', tag));
      } else {
        formData.append(key, productData[key]);
      }
    }
  });

  (productData.images || []).forEach((file) => {
    if (file instanceof File) formData.append('images', file);
  });

  // Always tell the server which existing images to keep (an empty list means
  // "remove all"), so editing a product never silently wipes its photos.
  const keep = productData.keepImages || [];
  if (keep.length === 0) formData.append('keepImages', '');
  keep.forEach((imgUrl) => formData.append('keepImages[]', imgUrl));

  const response = await axiosInstance.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

// ---------------------------------------------------------------- cart
export const addToCart = async ({ productId, quantity }) => {
  const res = await axiosInstance.post('/cart/add', { productId, quantity });
  return res.data;
};
export const getCart = () => axiosInstance.get('/cart').then((r) => r.data);
export const updateCartItem = ({ productId, quantity }) =>
  axiosInstance.put('/cart/update', { productId, quantity }).then((r) => r.data);
export const removeCartItem = (productId) =>
  axiosInstance.delete('/cart/remove', { data: { productId } }).then((r) => r.data);
export const clearCart = () => axiosInstance.delete('/cart/clear').then((r) => r.data);
export const checkoutCart = (body) => axiosInstance.post('/cart/checkout', body).then((r) => r.data);

// ------------------------------------------------------------- reviews
export const getProductReviews = async (productId) =>
  (await axiosInstance.get(`/reviews/product/${productId}`)).data;
export const getSellerReviews = async (sellerId) =>
  (await axiosInstance.get(`/reviews/seller/${sellerId}`)).data;
export const createReview = async (reviewData) =>
  (await axiosInstance.post('/reviews', reviewData)).data;
export const deleteReview = async (reviewId) =>
  (await axiosInstance.delete(`/reviews/${reviewId}`)).data;
export const getProductReviewsSummary = async (productId) =>
  (await axiosInstance.get(`/reviews/product/${productId}/summary`)).data;
export const getSellerReviewsSummary = async (sellerId) =>
  (await axiosInstance.get(`/reviews/seller/${sellerId}/summary`)).data;

// ------------------------------------------------------------------ AI
// AI-generated product info comes from our own backend (which holds the
// Gemini key), so no API keys are shipped to the browser.
export const generateProductDetails = async (product) => {
  try {
    const res = await axiosInstance.get(`/ai/product/${product._id}/details`);
    return res.data;
  } catch (error) {
    console.error('Error generating product details:', error);
    return {
      material: 'Quality materials',
      dimensions: 'Standard dimensions',
      weight: 'Appropriate weight',
      origin: 'Carefully crafted',
      craftTime: 'Artisan made',
      packaging: 'Protective packaging',
    };
  }
};

export const generateCareGuide = async (product) => {
  try {
    const res = await axiosInstance.get(`/ai/product/${product._id}/care`);
    return res.data;
  } catch (error) {
    console.error('Error generating care guide:', error);
    return {
      generalCare: 'Please handle with care.',
      cleaning: { title: 'Cleaning', description: 'Clean as appropriate for the material.' },
      storage: { title: 'Storage', description: 'Store in a safe place.' },
      maintenance: { title: 'Maintenance', description: 'Regular care recommended.' },
      warnings: { title: 'Warnings', description: 'Handle carefully.' },
    };
  }
};

// ------------------------------------------------------------- artisans
export const getPublicSeller = async (sellerId) =>
  (await axiosInstance.get(`/seller/${sellerId}`)).data;
export const getFollowers = async (sellerId) =>
  (await axiosInstance.get(`/seller/${sellerId}/followers`)).data;
export const followSeller = async (sellerId) =>
  (await axiosInstance.post(`/user/${sellerId}/follow`)).data;
export const unfollowSeller = async (sellerId) =>
  (await axiosInstance.post(`/user/${sellerId}/unfollow`)).data;

export const updateSellerProfile = async (data) =>
  (await axiosInstance.put('/seller/profile', data)).data;

export const sendVerificationEmail = async () =>
  (await axiosInstance.post('/seller/send-verification')).data;
export const verifySellerEmail = async (token) =>
  (await axiosInstance.get(`/seller/verify?token=${token}`)).data;

// ------------------------------------------------------------ analytics
export const getSellerStats = async () => (await axiosInstance.get('/stats/seller')).data;
export const getPublicStats = async () => (await axiosInstance.get('/stats/public')).data;

// ----------------------------------------------------------- favourites
export const getFavorites = async () => (await axiosInstance.get('/user/favorites')).data;
export const addFavorite = async (productId) =>
  (await axiosInstance.post(`/user/favorites/${productId}`)).data;
export const removeFavorite = async (productId) =>
  (await axiosInstance.delete(`/user/favorites/${productId}`)).data;

// --------------------------------------------------------------- orders
export const createOrder = async (orderData) =>
  (await axiosInstance.post('/orders', orderData)).data;
export const getUserOrders = async () => (await axiosInstance.get('/orders')).data;
export const getOrderById = async (orderId) => (await axiosInstance.get(`/orders/${orderId}`)).data;

// seller side: only orders containing this seller's products
export const getSellerOrders = async () => (await axiosInstance.get('/orders/seller')).data;
export const updateOrderStatus = async (orderId, statusData) =>
  (await axiosInstance.put(`/orders/${orderId}/status`, statusData)).data;
export const deleteOrder = async (orderId) =>
  (await axiosInstance.delete(`/orders/${orderId}`)).data;

// --------------------------------------------------------- user profile
export const updateUserProfile = async (file) => {
  const toBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  const profilePic = await toBase64(file);
  return (await axiosInstance.put('/user/profile', { profilePic })).data;
};

// address / state / city
export const updateUserDetails = async (data) =>
  (await axiosInstance.put('/user/profile', data)).data;
