import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { DishesPage } from './pages/DishesPage';
import { LoginPage } from './pages/LoginPage';
import { ManagePage } from './pages/ManagePage';
import { OrderPage } from './pages/OrderPage';
import { RegisterPage } from './pages/RegisterPage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { RestaurantsPage } from './pages/RestaurantsPage';

export function AppRoutes() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="container main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/restaurants"
            element={
              <ProtectedRoute>
                <RestaurantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurants/:id"
            element={
              <ProtectedRoute>
                <RestaurantDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dishes"
            element={
              <ProtectedRoute>
                <DishesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order"
            element={
              <ProtectedRoute>
                <OrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage"
            element={
              <ProtectedRoute requiredRole="ROLE_OWNER">
                <ManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/restaurants" replace />} />
          <Route path="*" element={<Navigate to="/restaurants" replace />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container">
          FreshPlate Food Delivery — React + TypeScript Frontend
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrderProvider>
          <AppRoutes />
        </OrderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
