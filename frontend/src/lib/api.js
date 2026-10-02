import { axiosInstance, API_BASE_URL } from './axios';
export const userSignup = async (signupData) => {
  const response = await axiosInstance.post('/user/signup', signupData);
  return response.data;
};
export const sellerSignup = async (signupData) => {
  const response = await axiosInstance.post('/seller/signup', signupData);
  return response.data;
};


export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get('/user/check');
    return res.data;
  } catch (error) {
    try {
      const res = await axiosInstance.get('/seller/check');
      return res.data;
    } catch (error) {
      console.log('Error fetching seller and user:', error);
      return null;
    }
    console.log('Error fetching user:', error);
    return null;
  }
};

export const getAllProducts = async ()=>{
  try {
    const res=await axiosInstance.get("/products");
    return res.data
  } catch (error) {
    console.log("lawda")
  }
}

export const getProduct = async (id)=>{
  try {
    const res= await axiosInstance.get(`/products/${id}`);
    console.log(res)
    return res.data
  } catch (error) {
    console.log("lawda product",error)
  }
}

export const createProduct = async (productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach(key => {
    if (key === 'images') {
      productData.images.forEach(image => formData.append('images', image));
    } else if (key === 'tags') {
      formData.append(key, productData[key].join(','));
    } else {
      formData.append(key, productData[key]);
    }
  });
  const response = await axiosInstance.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};


export const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

// Fetch followers for a seller
export const getFollowers = async (sellerId) => {
  const response = await axiosInstance.get(`/seller/${sellerId}/followers`); // Adjust endpoint if needed
  return response.data;
};

export const addToCart = async({productId,quantity})=>{
  try {
      const res=await axiosInstance.post("/cart/add",{productId,quantity});
      console.log(res)
  } catch (error) {
    
  }
}


export const getCart        = ()            => axiosInstance.get   ("/cart").then(r => r.data);

export const updateCartItem = ({productId, quantity})   =>
                              axiosInstance.put  ("/cart/update" , {productId, quantity}).then(r => r.data);
export const removeCartItem =  productId               =>
                              axiosInstance.delete("/cart/remove", {data:{productId}}).then(r => r.data);
export const clearCart      = ()            => axiosInstance.delete("/cart/clear").then(r => r.data);
export const checkoutCart   = body          => axiosInstance.post ("/cart/checkout", body).then(r => r.data);

export const getProductReviews = async (productId) => {
  const response = await axiosInstance.get(`/reviews/product/${productId}`, { withCredentials: true });
  return response.data;
};

// Fetch all reviews for a seller
export const getSellerReviews = async (sellerId) => {
  const response = await axiosInstance.get(`/reviews/seller/${sellerId}`, { withCredentials: true });
  return response.data;
};

// Create a review (user must be logged in, credentials/cookies sent)
export const createReview = async (reviewData) => {
  const response = await axiosInstance.post('/reviews', reviewData, { withCredentials: true });
  return response.data;
};

// Delete a review (user must be logged in)
export const deleteReview = async (reviewId) => {
  const response = await axiosInstance.delete(`/reviews/${reviewId}`, { withCredentials: true });
  return response.data;
};

// Get review summary for a product
export const getProductReviewsSummary = async (productId) => {
  const response = await axiosInstance.get(`/reviews/product/${productId}/summary`, { withCredentials: true });
  return response.data;
};

// Get review summary for a seller
export const getSellerReviewsSummary = async (sellerId) => {
  const response = await axiosInstance.get(`/reviews/seller/${sellerId}/summary`, { withCredentials: true });
  return response.data;
};

// AI-generated product info now comes from our own backend (which holds the
// Gemini key), so no API keys are shipped to the browser.
export const generateProductDetails = async (product) => {
  try {
    const res = await axiosInstance.get(`/ai/product/${product._id}/details`);
    return res.data;
  } catch (error) {
    console.error("Error generating product details:", error);
    return {
      material: "Quality materials",
      dimensions: "Standard dimensions",
      weight: "Appropriate weight",
      origin: "Carefully crafted",
      craftTime: "Artisan made",
      packaging: "Protective packaging",
    };
  }
};

export const generateCareGuide = async (product) => {
  try {
    const res = await axiosInstance.get(`/ai/product/${product._id}/care`);
    return res.data;
  } catch (error) {
    console.error("Error generating care guide:", error);
    return {
      generalCare: "Please handle with care.",
      cleaning: { title: "Cleaning", description: "Clean as appropriate for the material." },
      storage: { title: "Storage", description: "Store in a safe place." },
      maintenance: { title: "Maintenance", description: "Regular care recommended." },
      warnings: { title: "Warnings", description: "Handle carefully." },
    };
  }
};

// Seller Profile API Functions

export const getSellerProducts = async (sellerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/seller/${sellerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seller products');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
};

// export const getSellerInfo = async (sellerId) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       throw new Error('Failed to fetch seller info');
//     }

//     return await response.json();
//   } catch (error) {
//     console.error('Error fetching seller info:', error);
//     throw error;
//   }
// };

export const getSellerFollowers = async (sellerId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/seller/${sellerId}/followers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch seller followers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seller followers:', error);
    throw error;
  }
};


export const checkIsFollowing = async (sellerId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/seller/${sellerId}/is-following`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { isFollowing: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { isFollowing: false };
  }
};
// Get seller info using /seller/check endpoint (uses cookies automatically)
export const getSellerInfo = async () => {
  console.log("hi")
  try {
    const response = await fetch(`${API_BASE_URL}/seller/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This ensures cookies are sent
    });
    if (!response.ok) {
      throw new Error('Failed to fetch seller info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching seller info:', error);
    throw error;
  }
};


export const followArtisan = async (artisanId) => {
  const res = await fetch(`${API_BASE_URL}/artisans/${artisanId}/follow`, { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error("Failed to follow artisan");
  return res.json();
};

export const followSeller = async (sellerId) => {
  const response = await axiosInstance.post(`/seller/${sellerId}/follow`, {}, { withCredentials: true });
  return response.data;
};
// Add this to your api.js file
export const createOrder = async (orderData) => {
  const response = await axiosInstance.post('/orders', orderData, { withCredentials: true });
  return response.data;
};


// Add this to your api.js file
export const getUserOrders = async () => {
  const response = await axiosInstance.get('/orders', { withCredentials: true });
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await axiosInstance.get(`/orders/${orderId}`, { withCredentials: true });
  return response.data;
};

// Update user profile (if you have this endpoint)
// Update user profile
export const updateUserProfile = async (file) => {
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Convert file → base64
  const base64Image = await toBase64(file);

  // Send to backend
  const response = await axiosInstance.put(
    "/user/profile",
    { profilePic: base64Image },
    { withCredentials: true }
  );

  return response.data;
};










export const userLogin = async (loginData) => {
  const response = await axiosInstance.post('/user/login', loginData);
  return response.data;
};

// Seller Login
export const sellerLogin = async (loginData) => {
  const response = await axiosInstance.post('/seller/login', loginData);
  return response.data;
};

export const logout = async (type) => {
  try {
    let endpoint = "/user/logout"; // default
    if (type === "seller") {
      endpoint = "/seller/logout";
    }

    const response = await axiosInstance.post(endpoint);
    return response.data;
  } catch (error) {
    console.error("Logout failed:", error.response?.data || error.message);
    throw error;
  }
};




export const updateProduct = async (id, productData) => {
  const formData = new FormData();

  // Append non-file fields
  Object.keys(productData).forEach(key => {
    if (key !== "images" && key !== "keepImages") {
      if (key === "tags" && Array.isArray(productData.tags)) {
        productData.tags.forEach(tag => formData.append("tags[]", tag));
      } else {
        formData.append(key, productData[key]);
      }
    }
  });

  // Append images (files)
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach(file => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });
  }

  // Append keepImages (for existing ones)
  if (productData.keepImages && productData.keepImages.length > 0) {
    productData.keepImages.forEach(imgUrl => formData.append("keepImages[]", imgUrl));
  }

  console.log("Sending FormData:", [...formData.entries()]);

  const response = await axiosInstance.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });

  return response.data;
};






export const sendVerificationEmail = async () => {
  const response = await axiosInstance.post("/seller/send-verification");
  console.log("Response from sendVerificationEmail:", response);
  return response.data;
};

// Verify seller (called when they click a verification link in email)
export const verifySellerEmail = async (token) => {
  const response = await axiosInstance.get(`/seller/verify?token=${token}`);
  return response.data;
};

// Add these to your api.js file
export const getAllOrders = async () => {
  const response = await axiosInstance.get('/orders/all', { withCredentials: true });
  return response.data;
};

export const updateOrderStatus = async (orderId, statusData) => {
  const response = await axiosInstance.put(`/orders/${orderId}/status`, statusData, { withCredentials: true });
  return response.data;
};

export const deleteOrder = async (orderId) => {
  const response = await axiosInstance.delete(`/orders/${orderId}`, { withCredentials: true });
  return response.data;
};
