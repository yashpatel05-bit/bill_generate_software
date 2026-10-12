import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RestaurantProvider } from './context/RestaurantContext'
import DashboardLayout from './components/layout/DashboardLayout'
import AuthLayout from './components/layout/AuthLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/admin/Dashboard'
import RestaurantManagement from './pages/admin/RestaurantManagement'
import Restaurants from './pages/admin/Restaurants'
import RestaurantDashboard from './pages/restaurants/RestaurantDashboard'
import MenuManagement from './pages/menu/MenuManagement'
import Billing from './pages/billing/BillGenerator'
import BillingHistory from './pages/billing/History'
import Reports from './pages/reports/Reports'
import PremiumFeatures from './pages/premium/PremiumFeatures'

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#758C76]/20 border-t-[#758C76] rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-[#2D372E]">Starting BILLU POS...</p>
        <p className="text-xs text-[#78857A] mt-1">Connecting to server session</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Login />
      </AuthLayout>
    )
  }

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/restaurants" element={<RestaurantManagement />} />
        <Route path="/restaurants/create" element={<Restaurants />} />
        <Route path="/restaurants/:restaurantId/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurants/:restaurantId/menu" element={<MenuManagement />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing-history" element={<BillingHistory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/premium" element={<PremiumFeatures />} />
        <Route path="/premium-features" element={<PremiumFeatures />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <Router>
          <AppRoutes />
        </Router>
      </RestaurantProvider>
    </AuthProvider>
  )
}

export default App