import { Navigate, Route, Routes } from "react-router-dom";
import NavigationBar from "./components/NavigationBar.jsx";
import Home from "./pages/Home.jsx";
import ArtisanMarketplace from "./pages/MarketPlace.jsx";
import ProductDetailPage from "./pages/ProductDetail.jsx";
import SellerProfilePage from "./pages/SellerProfile.jsx";
import UserProfilePage from "./pages/UserPofilePage.jsx";
import UserSignupPage from "./pages/UserSignup.jsx";
import SellerSignupPage from "./pages/SellerSignup.jsx";
import useAuthUser from "./hooks/useAuthUser";
import SellerCorner from "./pages/SellerCorner.jsx";
import CartPage from "./pages/Cart.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SellerLoginPage from "./pages/SellerLoginPage.jsx";
import UserLoginPage from "./pages/UserLoginPage.jsx";
import VerifySeller from "./pages/VerifySeller.jsx";
import OrderDetailsPage from "./pages/OrderDetails.jsx";

import { Toaster } from 'react-hot-toast';
import { BouncingDotsLoader } from "./components/Loading.jsx";
import AdminOrderManagement from "./pages/AdminOrderManagement.jsx";

function App() {
  const { isLoading, authUser, type } = useAuthUser();
  const isAuthenticated = Boolean(authUser);
  const homeFor = (t) => (t === "seller" ? "/seller/dashboard" : "/market");
  const sellerOnly = (page) =>
    isAuthenticated && type === "seller" ? page : <Navigate to="/seller/login" replace />;

  if (isLoading) {
    return <BouncingDotsLoader />;
  }

  return (
    <>
      {/* Toaster styled to match dark editorial theme */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1c1917',       // stone-900
            color: '#d6d3d1',            // stone-300
            border: '1px solid #292524', // stone-800
            borderRadius: '0px',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.05em',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#d97706', secondary: '#1c1917' }, // amber-600
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#1c1917' },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/market" element={<ArtisanMarketplace />} />

        <Route
          path="/orders/:orderId"
          element={isAuthenticated && type === "user" ? <OrderDetailsPage /> : <Navigate to="/user/login" />}
        />

        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* Public artisan page - anyone can browse a local maker's shop */}
        <Route path="/seller/:id" element={<SellerProfilePage />} />

        <Route
          path="/user"
          element={isAuthenticated && type === "user" ? <UserProfilePage /> : <Navigate to="/user/login" />}
        />

        <Route
          path="/user/signup"
          element={!isAuthenticated ? <UserSignupPage /> : <Navigate to={homeFor(type)} />}
        />
        <Route
          path="/user/login"
          element={!isAuthenticated ? <UserLoginPage /> : <Navigate to={homeFor(type)} />}
        />
        <Route
          path="/seller/signup"
          element={!isAuthenticated ? <SellerSignupPage /> : <Navigate to={homeFor(type)} />}
        />
        <Route
          path="/seller/login"
          element={!isAuthenticated ? <SellerLoginPage /> : <Navigate to={homeFor(type)} />}
        />

        <Route
          path="/cart"
          element={isAuthenticated && type === "user" ? <CartPage /> : <Navigate to="/user/login" />}
        />

        {/* Seller area */}
        <Route path="/seller/dashboard" element={sellerOnly(<Dashboard />)} />
        <Route path="/seller/products" element={sellerOnly(<SellerCorner />)} />
        <Route path="/seller/orders" element={sellerOnly(<AdminOrderManagement />)} />

        {/* Old URLs kept so existing emails/bookmarks still work */}
        <Route path="/sellermarket" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/sellermarket/verify" element={<VerifySeller />} />
        <Route path="/admin" element={<Navigate to="/seller/orders" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <NavigationBar />
    </>
  );
}

export default App;
