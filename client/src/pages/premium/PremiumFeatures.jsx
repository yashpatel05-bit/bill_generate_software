import { useState, useEffect } from 'react'
import { useRestaurant } from '../../context/RestaurantContext'
import { useAuth } from '../../context/AuthContext'
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Send,
  AlertTriangle,
  RotateCcw,
  Clock,
  TrendingUp,
  CreditCard,
  QrCode,
  X,
  Crown,
  Smartphone,
  Boxes,
  Tv,
  MessageSquare,
  Store,
  Building2,
  RefreshCw,
  Power,
  Layers,
  HelpCircle,
} from 'lucide-react'

// Icon mapping helper for dynamic plans
const ICON_COMPONENTS = {
  MessageSquare,
  Boxes,
  Tv,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  Store,
}

const COLOR_PRESETS = [
  { name: 'Sage Green', color: '#758C76', bgLight: '#EEF4EE', accentBorder: '#D3E5D4' },
  { name: 'Forest Green', color: '#3E6842', bgLight: '#EEF4EE', accentBorder: '#D3E5D4' },
  { name: 'Warm Terracotta', color: '#8A7969', bgLight: '#FAF5EE', accentBorder: '#EFE5D7' },
  { name: 'Slate Gray', color: '#576759', bgLight: '#F2EDE5', accentBorder: '#E2D9CE' },
  { name: 'Amber Clay', color: '#966838', bgLight: '#FAF0E6', accentBorder: '#ECD9C6' },
]

const PremiumFeatures = () => {
  const { restaurants, activeRestaurant } = useRestaurant()
  const { admin } = useAuth()

  // Selected restaurant for outlet view & subscription management
  const [selectedRestId, setSelectedRestId] = useState(activeRestaurant?._id || '')
  const currentRestaurant = restaurants.find((r) => r._id === selectedRestId) || activeRestaurant

  useEffect(() => {
    if (activeRestaurant && !selectedRestId) {
      setSelectedRestId(activeRestaurant._id)
    }
  }, [activeRestaurant])

  // View Mode: 'admin' (100% free with CRUD controls) or 'owner' (simulation of paid purchase)
  const [viewMode, setViewMode] = useState('admin')

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState('plans') // 'plans' | 'whatsapp' | 'inventory' | 'kds'

  // Dynamic Plans from Database
  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  // Subscriptions of selected restaurant
  const [subscriptions, setSubscriptions] = useState([])
  const [loadingSubs, setLoadingSubs] = useState(false)

  // Notifications
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', text: '' }

  // Admin CRUD Modals
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null) // null = create new, object = edit
  const [savingPlan, setSavingPlan] = useState(false)

  // Delete Confirmation Modal
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState(null)
  const [deletingPlan, setDeletingPlan] = useState(false)

  // Restaurant Owner Checkout Modal
  const [checkoutModal, setCheckoutModal] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [activating, setActivating] = useState(false)

  // Plan Form State for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: 799,
    durationMonths: 3,
    badge: 'PRO MODULE',
    headline: '',
    valueJustification: '',
    capabilitiesText: '',
    iconKey: 'Sparkles',
    colorPresetIdx: 0,
    tabId: 'plans',
    isActive: true,
  })

  // Interactive Live Tool States:
  // 1. WhatsApp Tool
  const [testGuestName, setTestGuestName] = useState('Rahul Sharma')
  const [testGuestPhone, setTestGuestPhone] = useState('+91 98765 43210')
  const [testBillAmount, setTestBillAmount] = useState('450')
  const [whatsappSent, setWhatsappSent] = useState(false)

  // 2. Inventory Tool
  const [inventoryItems, setInventoryItems] = useState([
    { id: '1', name: 'Mozzarella Cheese Blend', current: 2.4, min: 5.0, unit: 'kg', status: 'critical', cost: 420 },
    { id: '2', name: 'Amul Salted Butter', current: 4.8, min: 4.0, unit: 'kg', status: 'normal', cost: 260 },
    { id: '3', name: 'Paneer Block (Fresh)', current: 1.2, min: 3.5, unit: 'kg', status: 'low', cost: 340 },
    { id: '4', name: 'Refined Flour / Maida', current: 18.0, min: 10.0, unit: 'kg', status: 'normal', cost: 45 },
    { id: '5', name: 'Tomato Pizza Puree', current: 3.0, min: 6.0, unit: 'liters', status: 'low', cost: 180 },
  ])

  // 3. KDS Kitchen Tool
  const [kitchenOrders, setKitchenOrders] = useState([
    { id: 'KDS-101', table: 'Table 2', items: ['1x Veggie Supreme Pizza', '2x Garlic Breadsticks'], timer: 4, status: 'cooking' },
    { id: 'KDS-102', table: 'Table 5', items: ['2x Cheese Burst Pizza', '1x Chocolate Brownie'], timer: 9, status: 'ready' },
    { id: 'KDS-103', table: 'Takeaway #14', items: ['1x Paneer Tikka Pizza'], timer: 1, status: 'cooking' },
  ])

  // Auto-dismiss notifications
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4500)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Fetch Plans from DB
  const fetchPlans = async () => {
    setLoadingPlans(true)
    try {
      const res = await fetch('/api/premium-plans', { credentials: 'include' })
      const data = await res.json()
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans)
      }
    } catch (err) {
      console.error('Failed to load plans:', err)
      setFeedback({ type: 'error', text: 'Could not connect to premium plans API' })
    } finally {
      setLoadingPlans(false)
    }
  }

  // Fetch Subscriptions for Current Restaurant
  const fetchSubscriptions = async (rId) => {
    if (!rId) return
    setLoadingSubs(true)
    try {
      const res = await fetch(`/api/restaurants/${rId}/subscriptions`, { credentials: 'include' })
      const data = await res.json()
      if (data.success && Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions)
      } else if (currentRestaurant?.subscriptions) {
        setSubscriptions(currentRestaurant.subscriptions)
      }
    } catch (err) {
      console.error(err)
      if (currentRestaurant?.subscriptions) {
        setSubscriptions(currentRestaurant.subscriptions)
      }
    } finally {
      setLoadingSubs(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (currentRestaurant?._id) {
      fetchSubscriptions(currentRestaurant._id)
    }
  }, [currentRestaurant?._id])

  // Check if a feature is unlocked:
  // If viewMode === 'admin': 100% FREE for System Admin!
  // If viewMode === 'owner': check active subscription in database
  const isFeatureUnlocked = (featureCode) => {
    if (viewMode === 'admin') return true
    return subscriptions.some(
      (s) => (s.featureKey === featureCode || s.featureKey === featureCode.toLowerCase()) && s.status === 'active'
    )
  }

  // Open Modal to Create New Plan
  const handleOpenCreateModal = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      code: '',
      price: 799,
      durationMonths: 3,
      badge: 'PRO MODULE',
      headline: '',
      valueJustification: '',
      capabilitiesText: '',
      iconKey: 'Sparkles',
      colorPresetIdx: 0,
      tabId: 'plans',
      isActive: true,
    })
    setPlanModalOpen(true)
  }

  // Open Modal to Edit Existing Plan
  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan)
    const presetIdx = COLOR_PRESETS.findIndex((p) => p.color === plan.color)
    setFormData({
      name: plan.name || '',
      code: plan.code || '',
      price: plan.price || 0,
      durationMonths: plan.durationMonths || 3,
      badge: plan.badge || 'PRO MODULE',
      headline: plan.headline || '',
      valueJustification: plan.valueJustification || '',
      capabilitiesText: Array.isArray(plan.capabilities) ? plan.capabilities.join('\n') : '',
      iconKey: plan.iconKey || 'Sparkles',
      colorPresetIdx: presetIdx >= 0 ? presetIdx : 0,
      tabId: plan.tabId || 'plans',
      isActive: plan.isActive !== undefined ? plan.isActive : true,
    })
    setPlanModalOpen(true)
  }

  // Save Plan (Create or Update)
  const handleSavePlan = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || formData.price === '') {
      alert('Please provide a feature name and valid price.')
      return
    }

    setSavingPlan(true)
    const selectedPreset = COLOR_PRESETS[formData.colorPresetIdx] || COLOR_PRESETS[0]
    const capabilities = formData.capabilitiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      price: Number(formData.price),
      durationMonths: Number(formData.durationMonths) || 3,
      badge: formData.badge.trim(),
      headline: formData.headline.trim(),
      valueJustification: formData.valueJustification.trim(),
      capabilities,
      iconKey: formData.iconKey,
      color: selectedPreset.color,
      bgLight: selectedPreset.bgLight,
      accentBorder: selectedPreset.accentBorder,
      tabId: formData.tabId,
      isActive: formData.isActive,
      isFreeForAdmin: true,
    }

    try {
      let res
      if (editingPlan) {
        res = await fetch(`/api/premium-plans/${editingPlan._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/premium-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: editingPlan
            ? `Feature "${payload.name}" updated successfully!`
            : `New premium feature "${payload.name}" created!`,
        })
        setPlanModalOpen(false)
        await fetchPlans()
      } else {
        alert(data.message || 'Error saving plan')
      }
    } catch (err) {
      console.error(err)
      alert('Server error while saving plan')
    } finally {
      setSavingPlan(false)
    }
  }

  // Delete Plan
  const handleDeletePlan = async () => {
    if (!deleteConfirmPlan) return
    setDeletingPlan(true)
    try {
      const res = await fetch(`/api/premium-plans/${deleteConfirmPlan._id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `Premium feature "${deleteConfirmPlan.name}" has been deleted.`,
        })
        setDeleteConfirmPlan(null)
        await fetchPlans()
      } else {
        alert(data.message || 'Error deleting plan')
      }
    } catch (err) {
      console.error(err)
      alert('Server error while deleting plan')
    } finally {
      setDeletingPlan(false)
    }
  }

  // Toggle Plan Status (Active/Paused)
  const handleTogglePlanStatus = async (plan) => {
    try {
      const res = await fetch(`/api/premium-plans/${plan._id}/toggle`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `"${plan.name}" is now ${data.plan?.isActive ? 'Active' : 'Paused'}.`,
        })
        await fetchPlans()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Restore Default Plans
  const handleRestoreDefaults = async () => {
    if (!window.confirm('Restore default 3 tiers (₹799, ₹1,199, ₹1,599 for 3 months)? Any custom features will be reset.')) {
      return
    }
    try {
      const res = await fetch('/api/premium-plans/seed', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: 'Default 3 premium feature plans restored successfully!' })
        await fetchPlans()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Admin Direct Grant/Revoke for Current Restaurant
  const handleAdminToggleRestaurantAccess = async (plan) => {
    if (!currentRestaurant?._id) return
    const isSubscribed = subscriptions.some(
      (s) => s.featureKey === plan.code && s.status === 'active'
    )

    if (isSubscribed) {
      // Revoke
      if (!window.confirm(`Revoke "${plan.name}" access for "${currentRestaurant.name}"?`)) return
      try {
        const res = await fetch(`/api/restaurants/${currentRestaurant._id}/subscriptions/${plan.code}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await res.json()
        if (data.success) {
          setSubscriptions(data.subscriptions || [])
          setFeedback({ type: 'success', text: `Revoked "${plan.name}" for ${currentRestaurant.name}.` })
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      // Grant Free / Admin Override
      try {
        const res = await fetch(`/api/restaurants/${currentRestaurant._id}/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            featureKey: plan.code,
            planName: plan.name,
            price: 0,
            billingCycleMonths: plan.durationMonths || 3,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSubscriptions(data.subscriptions || [])
          setFeedback({
            type: 'success',
            text: `Admin Granted: "${plan.name}" is now active for ${currentRestaurant.name}!`,
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Restaurant Owner Purchase Simulation
  const handlePurchaseSubscription = async (e) => {
    e.preventDefault()
    if (!checkoutModal || !currentRestaurant?._id) return

    setActivating(true)
    try {
      const res = await fetch(`/api/restaurants/${currentRestaurant._id}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          featureKey: checkoutModal.code,
          planName: checkoutModal.name,
          price: checkoutModal.price,
          billingCycleMonths: checkoutModal.durationMonths || 3,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSubscriptions(data.subscriptions || [])
        setFeedback({
          type: 'success',
          text: `Success! "${checkoutModal.name}" activated for ${checkoutModal.durationMonths || 3} months (₹${checkoutModal.price}).`,
        })
        setCheckoutModal(null)
      } else {
        alert(data.message || 'Failed to activate plan')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to subscription gateway')
    } finally {
      setActivating(false)
    }
  }

  // Restock inventory simulation
  const handleRestock = (itemId) => {
    setInventoryItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, current: Number((item.current + 5).toFixed(1)), status: 'normal' }
          : item
      )
    )
  }

  // Bump KDS order simulation
  const handleBumpOrder = (orderId) => {
    setKitchenOrders((prev) =>
      prev
        .map((o) => {
          if (o.id === orderId) {
            if (o.status === 'cooking') return { ...o, status: 'ready' }
            if (o.status === 'ready') return { ...o, status: 'served' }
          }
          return o
        })
        .filter((o) => o.status !== 'served')
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-[#EEF4EE] border-[#D3E5D4] text-[#3E6842]'
              : 'bg-[#FBF1EF] border-[#EED1CB] text-[#A04838]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#3E6842]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#A04838]" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-[#E8E1D7] p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-[#2D372E] tracking-tight">
                Premium Features & Management
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#758C76] text-white">
                ADMIN CRUD
              </span>
            </div>
            <p className="text-xs text-[#78857A] font-medium mt-1">
              Create, customize, and manage paid add-on modules. Features are 100% free for Admin and paid for restaurant owners.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Active Outlet Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">Outlet:</span>
              <select
                value={selectedRestId}
                onChange={(e) => setSelectedRestId(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] shadow-xs focus:outline-none focus:border-[#758C76] cursor-pointer"
              >
                {restaurants.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher: Admin (Free + CRUD) vs Restaurant Owner (Paid) */}
            <div className="flex items-center p-1 bg-[#FAF8F5] rounded-2xl border border-[#E8E1D7]">
              <button
                onClick={() => setViewMode('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'admin'
                    ? 'bg-[#758C76] text-white shadow-xs'
                    : 'text-[#78857A] hover:text-[#2D372E]'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Admin View (100% Free + CRUD)</span>
              </button>
              <button
                onClick={() => setViewMode('owner')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'owner'
                    ? 'bg-[#758C76] text-white shadow-xs'
                    : 'text-[#78857A] hover:text-[#2D372E]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Owner View (Paid)</span>
              </button>
            </div>

            {/* Admin Action: Add New Feature Button */}
            {viewMode === 'admin' && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Feature</span>
              </button>
            )}
          </div>
        </div>

        {/* Informative Banner on Admin Privilege & Pricing Policy */}
        <div
          className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            viewMode === 'admin'
              ? 'bg-[#EEF4EE]/60 border-[#D3E5D4]'
              : 'bg-[#FAF5EE] border-[#EFE5D7]'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                viewMode === 'admin'
                  ? 'bg-[#3E6842] text-white'
                  : 'bg-[#8A7969] text-white'
              }`}
            >
              {viewMode === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#2D372E]">
                {viewMode === 'admin'
                  ? 'Admin Master Privilege: All Features 100% Free • Full CRUD Control Enabled'
                  : `Restaurant Owner Billing Policy: Active for "${currentRestaurant?.name || 'Selected Restaurant'}"`}
              </h3>
              <p className="text-[11px] text-[#78857A] mt-0.5">
                {viewMode === 'admin'
                  ? 'As an Administrator, you can Create new modules, Edit pricing (₹799, ₹1,199, ₹1,599), Delete features, and toggle restaurant access without paying any fee.'
                  : 'Individual restaurant owners must subscribe on a quarterly basis: ₹799 (WhatsApp), ₹1,199 (AI Inventory), ₹1,599 (KDS & Sync).'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            {viewMode === 'admin' && (
              <button
                onClick={handleRestoreDefaults}
                className="px-3 py-1 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#78857A] hover:text-[#2D372E] border border-[#E8E1D7] text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                title="Restore original 3 tiers (₹799, ₹1,199, ₹1,599)"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            )}
            <span
              className={`text-[11px] font-extrabold px-3 py-1 rounded-full border ${
                viewMode === 'admin'
                  ? 'bg-white text-[#3E6842] border-[#D3E5D4]'
                  : 'bg-white text-[#8A7969] border-[#EFE5D7]'
              }`}
            >
              {viewMode === 'admin' ? '👑 FULL ACCESS' : `${subscriptions.length} of ${plans.length} Subscribed`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'plans', label: `Feature Plans & CRUD (${plans.length})`, icon: Crown },
          { id: 'whatsapp', label: 'WhatsApp Digital Invoicing', icon: MessageSquare },
          { id: 'inventory', label: 'AI Inventory & Alerts', icon: Boxes },
          { id: 'kds', label: 'Kitchen Display (KDS) & Sync', icon: Tv },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-[#758C76] text-white shadow-xs'
                  : 'bg-white border border-[#E8E1D7] text-[#475448] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: Pricing Plans & Feature Cards with Admin CRUD */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {loadingPlans ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E1D7]">
              <div className="w-8 h-8 border-3 border-[#758C76]/20 border-t-[#758C76] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-[#78857A]">Loading premium features...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E1D7] space-y-3">
              <Sparkles className="w-10 h-10 text-[#758C76] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-[#2D372E]">No Premium Features Found</h3>
              <p className="text-xs text-[#78857A] max-w-sm mx-auto">
                No active features in the database. You can restore the 3 default tiers or add custom features.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleRestoreDefaults}
                  className="px-4 py-2 rounded-xl bg-[#758C76] text-white text-xs font-bold hover:bg-[#627763] cursor-pointer"
                >
                  Restore 3 Default Plans
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E1D7] text-[#2D372E] text-xs font-bold hover:bg-[#F2EDE5] cursor-pointer"
                >
                  + Add Custom Feature
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((feat) => {
                const Icon = ICON_COMPONENTS[feat.iconKey] || Sparkles
                const isUnlocked = isFeatureUnlocked(feat.code)
                const isRestaurantSubscribed = subscriptions.some(
                  (s) => (s.featureKey === feat.code || s.featureKey === feat.code?.toLowerCase()) && s.status === 'active'
                )

                return (
                  <div
                    key={feat._id}
                    className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative ${
                      feat.isActive ? 'border-[#E8E1D7] hover:border-[#758C76]' : 'border-dashed border-[#D5C7B8] opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top Header: Badge, Icon & Admin CRUD Controls */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: feat.bgLight || '#FAF8F5', color: feat.color || '#758C76' }}
                          >
                            <Icon className="w-5 h-5" />
                          </span>
                          <div>
                            <span
                              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-block"
                              style={{
                                backgroundColor: feat.bgLight || '#FAF8F5',
                                color: feat.color || '#758C76',
                                borderColor: feat.accentBorder || '#E8E1D7',
                              }}
                            >
                              {feat.badge || 'PRO MODULE'}
                            </span>
                            {!feat.isActive && (
                              <span className="block text-[9px] font-bold text-[#A04838] uppercase tracking-wider mt-0.5">
                                [Paused / Inactive]
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Admin Action Buttons (Edit, Pause, Delete) */}
                        {viewMode === 'admin' && (
                          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E1D7]">
                            <button
                              onClick={() => handleOpenEditModal(feat)}
                              title="Edit Feature Plan"
                              className="p-1.5 rounded-lg text-[#78857A] hover:text-[#2D372E] hover:bg-white transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTogglePlanStatus(feat)}
                              title={feat.isActive ? 'Pause Plan' : 'Activate Plan'}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                feat.isActive
                                  ? 'text-[#3E6842] hover:bg-white'
                                  : 'text-[#A04838] hover:bg-white'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmPlan(feat)}
                              title="Delete Plan"
                              className="p-1.5 rounded-lg text-[#88938A] hover:text-[#A04838] hover:bg-[#FBF1EF] transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title & Headline */}
                      <h3 className="font-extrabold text-base text-[#2D372E] leading-snug group-hover:text-[#758C76] transition">
                        {feat.name}
                      </h3>
                      {feat.headline && (
                        <p className="text-xs text-[#78857A] mt-1.5 leading-relaxed">
                          {feat.headline}
                        </p>
                      )}

                      {/* Price Tag */}
                      <div className="my-5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D7]">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-[#2D372E] tracking-tight">
                            ₹{feat.price}
                          </span>
                          <span className="text-xs font-bold text-[#78857A]">
                            / {feat.durationMonths || 3} Months
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-[#88938A]">
                          <span>
                            Effective ₹{Math.round(feat.price / (feat.durationMonths || 3))} / mo
                          </span>
                          <span className="text-[#3E6842] font-bold">
                            {feat.durationMonths || 3}-Month Plan
                          </span>
                        </div>
                      </div>

                      {/* Value Justification (ROI Note) */}
                      {feat.valueJustification && (
                        <div className="mb-4 p-3 rounded-xl bg-[#FAF8F5]/80 border border-[#E8E1D7] text-[11px] text-[#475448] font-medium flex items-start gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-[#758C76] mt-0.5 flex-shrink-0" />
                          <span>{feat.valueJustification}</span>
                        </div>
                      )}

                      {/* Capabilities Checklist */}
                      {Array.isArray(feat.capabilities) && feat.capabilities.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#E8E1D7]/60">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#88938A]">
                            Included Features:
                          </p>
                          {feat.capabilities.map((cap, cIdx) => (
                            <div key={cIdx} className="flex items-start gap-2 text-xs text-[#2D372E]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#3E6842] mt-0.5 flex-shrink-0" />
                              <span>{cap}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Area */}
                    <div className="pt-6 border-t border-[#E8E1D7] mt-5 space-y-2.5">
                      {/* Admin Mode Controls */}
                      {viewMode === 'admin' ? (
                        <div>
                          {feat.tabId && feat.tabId !== 'plans' && (
                            <button
                              onClick={() => setActiveTab(feat.tabId)}
                              className="w-full py-2.5 px-4 rounded-xl bg-[#EEF4EE] hover:bg-[#758C76] text-[#3E6842] hover:text-white border border-[#D3E5D4] text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mb-2"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Launch Interactive Tool (Free)</span>
                            </button>
                          )}

                          {/* Admin toggle for the selected restaurant */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-[11px] text-[#78857A]">
                              {currentRestaurant?.name}:
                            </span>
                            <button
                              onClick={() => handleAdminToggleRestaurantAccess(feat)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                                isRestaurantSubscribed
                                  ? 'bg-[#EEF4EE] text-[#3E6842] border-[#D3E5D4] hover:bg-[#FBF1EF] hover:text-[#A04838] hover:border-[#EED1CB]'
                                  : 'bg-[#FAF8F5] text-[#758C76] border-[#E8E1D7] hover:bg-[#EEF4EE]'
                              }`}
                            >
                              {isRestaurantSubscribed ? '✓ Subscribed (Click Revoke)' : '+ Grant Free Access'}
                            </button>
                          </div>
                          <p className="text-[10px] text-center text-[#88938A] font-semibold mt-1">
                            👑 100% Free for Admin
                          </p>
                        </div>
                      ) : (
                        /* Restaurant Owner Mode Controls */
                        <div>
                          {isUnlocked ? (
                            <div className="space-y-1">
                              <button
                                onClick={() => feat.tabId && setActiveTab(feat.tabId)}
                                className="w-full py-2.5 px-4 rounded-xl bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Active Subscription • Open Tool</span>
                              </button>
                              <p className="text-[10px] text-center text-[#88938A]">
                                Valid for {feat.durationMonths || 3} months
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCheckoutModal(feat)}
                              className="w-full py-3 px-4 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Subscribe for ₹{feat.price} / {feat.durationMonths || 3} Months</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bundle Banner */}
          <div className="bg-white rounded-3xl border border-[#E8E1D7] p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] flex items-center justify-center shadow-xs flex-shrink-0">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[#2D372E]">
                    All-in-One Restaurant Growth Bundle
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#FAF0E6] text-[#8C6D48] border border-[#ECD9C6] px-2 py-0.5 rounded-full">
                    SAVE ₹799
                  </span>
                </div>
                <p className="text-xs text-[#78857A] mt-1 max-w-xl">
                  Get WhatsApp Invoicing (₹799) + AI Inventory (₹1,199) + KDS Multi-Branch (₹1,599) together in a single discounted package for outlet owners.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <p className="text-xs text-[#88938A] line-through">₹3,597 / 3 mos</p>
                <p className="text-2xl font-black text-[#758C76]">₹2,798</p>
              </div>
              <button
                onClick={() => {
                  if (viewMode === 'admin') {
                    alert('Admin accounts already have all features unlocked for free!')
                  } else {
                    setCheckoutModal({
                      code: 'bundle',
                      name: 'All-in-One Growth Bundle',
                      price: 2798,
                      durationMonths: 3,
                    })
                  }
                }}
                className="py-3 px-5 rounded-2xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                {viewMode === 'admin' ? 'Included Free for Admin' : 'Get Complete Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live WhatsApp Digital Invoicing Console */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-3xl border border-[#E8E1D7] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D7]">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#3E6842]" />
                <h2 className="text-base font-bold text-[#2D372E]">
                  Smart WhatsApp & SMS Digital Invoicing Console
                </h2>
              </div>
              <p className="text-xs text-[#78857A] mt-0.5">
                Send professional digital tax receipts with interactive download links straight to your guests.
              </p>
            </div>
            <span className="text-xs font-bold text-[#3E6842] bg-[#EEF4EE] px-3 py-1 rounded-full border border-[#D3E5D4]">
              Quarterly: ₹799 / 3 Months
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Tester Form */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
                Dispatch Interactive Digital Invoice
              </h3>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">Guest Name</label>
                <input
                  type="text"
                  value={testGuestName}
                  onChange={(e) => setTestGuestName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">WhatsApp / Phone Number</label>
                <input
                  type="text"
                  value={testGuestPhone}
                  onChange={(e) => setTestGuestPhone(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">Bill Amount (₹)</label>
                <input
                  type="number"
                  value={testBillAmount}
                  onChange={(e) => setTestBillAmount(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <button
                onClick={() => {
                  setWhatsappSent(true)
                  setTimeout(() => setWhatsappSent(false), 4000)
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#3E6842] hover:bg-[#2D4D30] text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Sending WhatsApp Invoice</span>
              </button>

              {whatsappSent && (
                <div className="p-3.5 rounded-xl bg-[#EEF4EE] border border-[#D3E5D4] text-xs font-bold text-[#3E6842] flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Invoice receipt successfully dispatched to {testGuestPhone} via WhatsApp API!</span>
                </div>
              )}
            </div>

            {/* Right: Live WhatsApp Preview */}
            <div className="lg:col-span-6 bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E1D7] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#88938A]">
                <span>Customer Smartphone Preview</span>
                <Smartphone className="w-4 h-4" />
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8E1D7] shadow-xs space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 border-b border-[#E8E1D7] pb-2">
                  <div className="w-6 h-6 rounded-full bg-[#3E6842] text-white flex items-center justify-center text-[10px] font-bold">
                    B
                  </div>
                  <span className="font-bold text-[#2D372E]">
                    {currentRestaurant?.name || 'BILLU RESTAURANT'} (Official)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#2D372E]">
                  <p>
                    Hello <strong>{testGuestName}</strong>! 👋
                  </p>
                  <p className="text-[#78857A]">
                    Thank you for dining at <strong>{currentRestaurant?.name}</strong>. Here is your verified digital tax receipt:
                  </p>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E1D7] space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span>Invoice #:</span>
                      <strong>INV-2026-9042</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <strong className="text-[#3E6842]">₹{Number(testBillAmount).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-[#88938A]">
                      <span>Payment Status:</span>
                      <span>PAID (CASH/UPI)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#78857A]">
                    📄 Tap below to view your digital receipt & download PDF:
                  </p>
                  <div className="pt-1">
                    <span className="inline-block py-1.5 px-3 rounded-lg bg-[#EEF4EE] text-[#3E6842] font-mono font-bold text-[10px] border border-[#D3E5D4]">
                      https://billu.pos/r/INV-2026-9042
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live AI Inventory & Low-Stock Alerts */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-[#E8E1D7] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D7]">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#8A7969]" />
                <h2 className="text-base font-bold text-[#2D372E]">
                  AI Inventory Forecaster & Low-Stock Auto-Alerts
                </h2>
              </div>
              <p className="text-xs text-[#78857A] mt-0.5">
                Live raw material tracking linked directly to billed dishes. Predicts shortages before dinner rush.
              </p>
            </div>
            <span className="text-xs font-bold text-[#8A7969] bg-[#FAF5EE] px-3 py-1 rounded-full border border-[#EFE5D7]">
              Quarterly: ₹1,199 / 3 Months
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">
                Raw Material Stocks ({inventoryItems.length} Monitored Items)
              </span>
              <span className="text-[11px] text-[#3E6842] font-bold">
                ✓ Auto-Depletion Active on Live POS Bills
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryItems.map((item) => {
                const isCritical = item.current < item.min
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                      isCritical ? 'bg-[#FBF1EF]/60 border-[#EED1CB]' : 'bg-white border-[#E8E1D7]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-[#2D372E]">{item.name}</span>
                        {isCritical ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#FBF1EF] text-[#A04838] border border-[#EED1CB] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mt-3">
                        <div>
                          <span className="text-2xl font-black text-[#2D372E]">{item.current}</span>
                          <span className="text-xs text-[#78857A] font-semibold ml-1">
                            {item.unit}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#88938A]">
                          Safety Min: {item.min} {item.unit}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#E8E1D7] h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-[#A04838]' : 'bg-[#758C76]'
                          }`}
                          style={{
                            width: `${Math.min(100, (item.current / (item.min * 2)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E8E1D7] mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-[#88938A]">
                        Est. Cost: ₹{item.cost}/{item.unit}
                      </span>
                      <button
                        onClick={() => handleRestock(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#EEF4EE] hover:text-[#3E6842] border border-[#E8E1D7] text-xs font-bold cursor-pointer transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restock +5</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Live Kitchen Display System (KDS) & Multi-Branch Sync */}
      {activeTab === 'kds' && (
        <div className="bg-white rounded-3xl border border-[#E8E1D7] p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D7]">
            <div>
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-[#758C76]" />
                <h2 className="text-base font-bold text-[#2D372E]">
                  Multi-Branch Live Sync & Kitchen Display System (KDS)
                </h2>
              </div>
              <p className="text-xs text-[#78857A] mt-0.5">
                Real-time digital ticket screen for chef stations + synchronized menu pricing across all outlets.
              </p>
            </div>
            <span className="text-xs font-bold text-[#758C76] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#E8E1D7]">
              Quarterly: ₹1,599 / 3 Months
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">
                Live Kitchen Screen ({kitchenOrders.length} Pending Tickets)
              </span>
              <button
                onClick={() => {
                  const newTicket = {
                    id: `KDS-${Math.floor(100 + Math.random() * 900)}`,
                    table: `Table ${Math.floor(1 + Math.random() * 6)}`,
                    items: ['1x Margherita Pizza', '1x Cold Coffee'],
                    timer: 0,
                    status: 'cooking',
                  }
                  setKitchenOrders((prev) => [newTicket, ...prev])
                }}
                className="px-3 py-1.5 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                + Inject Simulated POS Ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kitchenOrders.map((order) => {
                const isReady = order.status === 'ready'
                return (
                  <div
                    key={order.id}
                    className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                      isReady ? 'bg-[#EEF4EE]/60 border-[#D3E5D4]' : 'bg-white border-[#E8E1D7]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E8E1D7]">
                        <span className="font-mono font-black text-xs text-[#2D372E]">
                          {order.id}
                        </span>
                        <span className="text-xs font-bold text-[#758C76]">{order.table}</span>
                      </div>

                      <div className="py-3 space-y-1.5 font-medium text-xs text-[#2D372E]">
                        {order.items.map((it, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#758C76]" />
                            <span>{it}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E8E1D7] flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-[#78857A]">
                        <Clock className="w-3.5 h-3.5 text-[#88938A]" />
                        <span>{order.timer}m in prep</span>
                      </div>

                      <button
                        onClick={() => handleBumpOrder(order.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${
                          isReady
                            ? 'bg-[#3E6842] text-white hover:bg-[#2D4D30]'
                            : 'bg-[#758C76] text-white hover:bg-[#627763]'
                        }`}
                      >
                        {isReady ? '✓ Mark Served' : 'Mark Ready'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CREATE / EDIT PLAN MODAL */}
      {planModalOpen && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#E8E1D7] overflow-hidden my-8 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#758C76]" />
                <h3 className="font-extrabold text-base text-[#2D372E]">
                  {editingPlan ? 'Edit Premium Feature Plan' : 'Create New Premium Feature'}
                </h3>
              </div>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Feature Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">
                    Feature Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Smart WhatsApp Invoicing"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">
                    Unique Code / Key
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. whatsapp_invoicing"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-mono font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 799"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-extrabold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">
                    Tier Badge
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Tier 1 • High ROI"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  1-Line Headline Description
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Cut thermal paper costs & message digital GST bills to phones in 2 seconds"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              {/* Value / ROI Justification */}
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Value Justification (Justifies the price to restaurant owner)
                </label>
                <textarea
                  rows="2"
                  value={formData.valueJustification}
                  onChange={(e) => setFormData({ ...formData, valueJustification: e.target.value })}
                  placeholder="e.g. Saves up to ₹1,500/quarterly in paper rolls while collecting customer phone numbers..."
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl p-3 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              {/* Capabilities checklist */}
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Included Capabilities (Enter 1 capability per line)
                </label>
                <textarea
                  rows="4"
                  value={formData.capabilitiesText}
                  onChange={(e) => setFormData({ ...formData, capabilitiesText: e.target.value })}
                  placeholder="Instant 1-Click WhatsApp digital invoice delivery&#10;Automatic thank-you SMS containing order breakdown&#10;Eco-friendly 100% paperless billing"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl p-3 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              {/* Icon & Theme Color Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">Icon</label>
                  <select
                    value={formData.iconKey}
                    onChange={(e) => setFormData({ ...formData, iconKey: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  >
                    <option value="Sparkles">Sparkles (Special)</option>
                    <option value="MessageSquare">MessageSquare (WhatsApp/SMS)</option>
                    <option value="Boxes">Boxes (Inventory)</option>
                    <option value="Tv">Tv (Kitchen Display Screen)</option>
                    <option value="ShieldCheck">ShieldCheck (Security/Compliance)</option>
                    <option value="Zap">Zap (Instant Automation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475448] mb-1">Color Palette</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, colorPresetIdx: idx })}
                        className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                          formData.colorPresetIdx === idx
                            ? 'border-[#2D372E] scale-110 shadow-sm'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-[#758C76] focus:ring-[#758C76] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-[#2D372E] cursor-pointer">
                  Feature is Active & Available for Subscriptions
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex justify-end gap-2 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-5 py-2.5 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {savingPlan ? 'Saving...' : editingPlan ? 'Update Feature Plan' : 'Create Feature Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmPlan && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E1D7] p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FBF1EF] text-[#A04838] border border-[#EED1CB] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#2D372E]">
                Delete Premium Feature?
              </h3>
              <p className="text-xs text-[#78857A] mt-1">
                Are you sure you want to permanently delete <strong>"{deleteConfirmPlan.name}"</strong>? This will remove the plan from all restaurant catalogs.
              </p>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-[#E8E1D7]">
              <button
                type="button"
                onClick={() => setDeleteConfirmPlan(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={deletingPlan}
                className="px-5 py-2.5 rounded-xl bg-[#A04838] hover:bg-[#85392B] text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                {deletingPlan ? 'Deleting...' : 'Delete Feature'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTAURANT OWNER CHECKOUT MODAL (Simulated Payment) */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E1D7] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#758C76]" />
                <h3 className="font-bold text-base text-[#2D372E]">
                  Subscribe to Premium Feature
                </h3>
              </div>
              <button
                onClick={() => setCheckoutModal(null)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubscription} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D7] space-y-1.5">
                <p className="text-xs font-bold text-[#88938A] uppercase tracking-wider">
                  Outlet Subscription
                </p>
                <p className="text-sm font-black text-[#2D372E]">{checkoutModal.name}</p>
                <p className="text-[11px] text-[#78857A]">
                  For Outlet: <strong>{currentRestaurant?.name || 'Selected Restaurant'}</strong>
                </p>
                <div className="flex items-baseline justify-between pt-2 border-t border-[#E8E1D7] text-xs">
                  <span className="text-[#78857A]">
                    Duration: {checkoutModal.durationMonths || 3} Months (90 Days)
                  </span>
                  <span className="text-xl font-black text-[#758C76]">₹{checkoutModal.price}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1.5">
                  Select Payment Method (Simulated Gateway)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                        paymentMethod === m.id
                          ? 'border-[#758C76] bg-[#EEF4EE] text-[#3E6842]'
                          : 'border-[#E8E1D7] bg-[#FAF8F5] text-[#78857A]'
                      }`}
                    >
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setCheckoutModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activating}
                  className="px-5 py-2.5 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {activating ? 'Processing Payment...' : `Pay ₹${checkoutModal.price} & Activate`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PremiumFeatures
