import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  Store,
  Receipt,
  UtensilsCrossed,
  TrendingUp,
  MapPin,
  Phone,
  Percent,
  Plus,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Clock,
  Printer,
  CheckCircle2,
  Trash2,
  X,
  Building2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const RestaurantDashboard = () => {
  const { restaurantId } = useParams()
  const { restaurants, activeRestaurant, setActiveRestaurant, fetchRestaurants } = useRestaurant()
  const navigate = useNavigate()

  const currentRestaurant =
    restaurants.find((r) => r._id === restaurantId) || activeRestaurant

  const [activeTab, setActiveTab] = useState('overview')
  const [invoices, setInvoices] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [chartData, setChartData] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  // Add Branch Modal State
  const [showAddBranchModal, setShowAddBranchModal] = useState(false)
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchPhone, setBranchPhone] = useState('')
  const [branchIsMain, setBranchIsMain] = useState(false)
  const [savingBranch, setSavingBranch] = useState(false)

  useEffect(() => {
    if (currentRestaurant && currentRestaurant._id) {
      if (activeRestaurant?._id !== currentRestaurant._id) {
        setActiveRestaurant(currentRestaurant)
      }
      setBranches(currentRestaurant.branches || [])
      fetchRestaurantDashboardData(currentRestaurant._id)
    }
  }, [currentRestaurant?._id])

  const fetchRestaurantDashboardData = async (rId) => {
    setLoading(true)
    try {
      // 1. Fetch invoices for this restaurant
      const invRes = await fetch(`/api/invoices?restaurantId=${rId}`, { credentials: 'include' })
      const invData = await invRes.json()
      const invList = invData.success && Array.isArray(invData.invoices) ? invData.invoices : []
      setInvoices(invList)

      // 2. Fetch menu items for this restaurant
      const menuRes = await fetch(`/api/menu/${rId}/menu`, { credentials: 'include' })
      const menuData = await menuRes.json()
      const mList = menuData.success && Array.isArray(menuData.items) ? menuData.items : []
      setMenuItems(mList)

      // 3. Fetch branches specifically
      const branchRes = await fetch(`/api/restaurants/${rId}/branches`, { credentials: 'include' })
      const branchData = await branchRes.json()
      if (branchData.success && Array.isArray(branchData.branches)) {
        setBranches(branchData.branches)
      }

      // 4. Build 7-day revenue trend for this specific restaurant
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const dateStr = d.toDateString()

        const dayRev = invList
          .filter((inv) => new Date(inv.createdAt).toDateString() === dateStr)
          .reduce((sum, inv) => sum + (inv.total || 0), 0)

        return {
          day: days[d.getDay()],
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          sales: Math.round(dayRev),
        }
      })
      setChartData(last7Days)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle Add Branch
  const handleAddBranch = async (e) => {
    e.preventDefault()
    if (!branchName.trim()) {
      alert('Branch name is required (e.g. Vesu Branch, City Light Branch).')
      return
    }

    setSavingBranch(true)
    try {
      const res = await fetch(`/api/restaurants/${currentRestaurant._id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: branchName.trim(),
          address: branchAddress.trim(),
          phone: branchPhone.trim(),
          isMain: branchIsMain,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setBranches(data.branches || [])
        setShowAddBranchModal(false)
        setBranchName('')
        setBranchAddress('')
        setBranchPhone('')
        setBranchIsMain(false)
        if (fetchRestaurants) await fetchRestaurants()
      } else {
        alert(data.message || 'Failed to add branch')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to server to add branch')
    } finally {
      setSavingBranch(false)
    }
  }

  // Handle Delete Branch
  const handleDeleteBranch = async (branchId, name) => {
    if (!window.confirm(`Are you sure you want to remove the "${name}" branch?`)) {
      return
    }

    try {
      const res = await fetch(`/api/restaurants/${currentRestaurant._id}/branches/${branchId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBranches(data.branches || [])
        if (fetchRestaurants) await fetchRestaurants()
      } else {
        alert(data.message || 'Failed to delete branch')
      }
    } catch (err) {
      console.error(err)
      alert('Error deleting branch')
    }
  }

  if (!currentRestaurant) {
    return (
      <div className="bg-white rounded-3xl border border-[#E8E1D7] p-12 text-center">
        <Store className="w-12 h-12 text-[#88938A] mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#2D372E]">Outlet not found</h2>
        <p className="text-xs text-[#78857A] mt-1 mb-4">The requested restaurant profile could not be loaded.</p>
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-1.5 bg-[#758C76] text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Restaurants</span>
        </Link>
      </div>
    )
  }

  const todayStr = new Date().toDateString()
  const todayInvoices = invoices.filter(
    (inv) => new Date(inv.createdAt).toDateString() === todayStr
  )
  const todayRevenue = todayInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0)
  const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header Card */}
      <div className="bg-white rounded-3xl border border-[#E8E1D7] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              to="/restaurants"
              className="p-2.5 rounded-xl border border-[#E8E1D7] hover:bg-[#FAF8F5] text-[#2D372E] transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#758C76]" />
            </Link>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xs"
                style={{
                  backgroundColor: currentRestaurant.primaryColor || '#758C76',
                }}
              >
                {currentRestaurant.logo && currentRestaurant.logo.startsWith('http') ? (
                  <img
                    src={currentRestaurant.logo}
                    alt={currentRestaurant.name}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span>{currentRestaurant.name ? currentRestaurant.name[0] : 'R'}</span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#2D372E] tracking-tight">
                    {currentRestaurant.name}
                  </h1>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      currentRestaurant.status === 'open'
                        ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]'
                        : 'bg-[#FBF1EF] text-[#A04838] border border-[#EED1CB]'
                    }`}
                  >
                    {currentRestaurant.status || 'open'}
                  </span>
                </div>
                <p className="text-xs text-[#78857A] flex items-center gap-2 mt-0.5">
                  <span>{currentRestaurant.cuisine || 'Cuisine'}</span>
                  <span>•</span>
                  <span>{currentRestaurant.phone || 'Phone'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Add Branch Button */}
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="bg-[#FAF8F5] hover:bg-[#F2EDE5] text-[#2D372E] border border-[#E8E1D7] text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-[#758C76]" />
              <span>+ Add Branch</span>
            </button>

            <Link
              to={`/billing?restaurantId=${currentRestaurant._id}`}
              className="bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Create Bill</span>
            </Link>

            <Link
              to={`/restaurants/${currentRestaurant._id}/menu`}
              className="bg-[#FAF8F5] hover:bg-[#F2EDE5] text-[#2D372E] border border-[#E8E1D7] text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#758C76]" />
              <span>Manage Menu</span>
            </Link>
          </div>
        </div>

        {/* Restaurant Contact / Details Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#E8E1D7] text-xs text-[#78857A]">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#88938A]" />
            <span>
              {typeof currentRestaurant.address === 'string'
                ? currentRestaurant.address
                : currentRestaurant.address?.street || 'Location specified in system'}
            </span>
          </div>
          {currentRestaurant.gstin && (
            <div className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#88938A]" />
              <span className="font-mono">GSTIN: {currentRestaurant.gstin}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#88938A]" />
            <span>CGST: {currentRestaurant.taxConfiguration?.cgstRate ?? 2.5}% | SGST: {currentRestaurant.taxConfiguration?.sgstRate ?? 2.5}%</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            Today Revenue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              ₹{todayRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-[#3E6842] bg-[#EEF4EE] px-2.5 py-0.5 rounded-full border border-[#D3E5D4]">
              Gross
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            Today Bills
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              {todayInvoices.length}
            </span>
            <span className="text-xs font-bold text-[#758C76] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E8E1D7]">
              Finalized
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            Total Menu Items
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              {menuItems.length}
            </span>
            <Link
              to={`/restaurants/${currentRestaurant._id}/menu`}
              className="text-xs font-bold text-[#758C76] hover:underline"
            >
              View Menu →
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            All-Time Revenue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-[#78857A]">
              {invoices.length} total bills
            </span>
          </div>
        </div>
      </div>

      {/* Branches Section (Admin Manage Branches) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#758C76]" />
              <h2 className="text-base font-bold text-[#2D372E]">
                Restaurant Branches ({branches.length})
              </h2>
            </div>
            <p className="text-xs text-[#78857A] mt-0.5">
              Admin configured branch locations (e.g., Vesu, Ghod Dod Road, City Light) available for live billing
            </p>
          </div>

          <button
            onClick={() => setShowAddBranchModal(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-[#E8E1D7] rounded-2xl text-center space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-[#D5C7B8]" />
            <p className="text-xs font-bold text-[#2D372E]">No branches added for this restaurant yet.</p>
            <p className="text-[11px] text-[#78857A]">
              Click &ldquo;Add Branch&rdquo; to insert locations like Vesu, Ghod Dod Road, City Light, etc.
            </p>
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] text-xs font-bold cursor-pointer hover:bg-[#758C76] hover:text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Branch</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {branches.map((b, idx) => (
              <div
                key={b._id || idx}
                className="p-4 rounded-2xl border border-[#E8E1D7] bg-[#FAF8F5] hover:bg-white hover:border-[#758C76] transition shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-white border border-[#E8E1D7] flex items-center justify-center text-[#758C76] shadow-xs">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div className="flex items-center gap-1">
                      {b.isMain && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] px-2 py-0.5 rounded-full">
                          Main
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteBranch(b._id || b.name, b.name)}
                        title="Delete branch"
                        className="p-1 text-[#88938A] hover:text-[#A04838] transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-[#2D372E] group-hover:text-[#758C76] transition">
                    {b.name}
                  </h3>
                  <p className="text-xs text-[#78857A] mt-1 line-clamp-1">
                    {b.address || 'Address on file'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E8E1D7] flex items-center justify-between text-[11px] text-[#88938A]">
                  <span className="font-medium">{b.phone || currentRestaurant.phone || '+91 98765 43210'}</span>
                  <Link
                    to={`/billing?restaurantId=${currentRestaurant._id}`}
                    className="text-[#758C76] font-bold hover:underline"
                  >
                    Bill Here →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2-Column: Sales Trend Chart & Top Menu Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#2D372E]">7-Day Sales Trend</h2>
              <p className="text-xs text-[#78857A]">Daily revenue totals finalized at this outlet</p>
            </div>
            <span className="text-xs font-bold text-[#3E6842] bg-[#EEF4EE] px-2.5 py-1 rounded-full border border-[#D3E5D4]">
              Live Records
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="restDashColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#758C76" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#758C76" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EDE5" />
                <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#E8E1D7' }} tick={{ fill: '#78857A', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#78857A', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    color: '#2D372E',
                    borderRadius: '12px',
                    border: '1px solid #E8E1D7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#758C76" strokeWidth={2.5} fillOpacity={1} fill="url(#restDashColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Menu Catalog Snapshot */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#2D372E]">Menu Snapshot</h2>
              <Link
                to={`/restaurants/${currentRestaurant._id}/menu`}
                className="text-xs font-bold text-[#758C76] hover:underline"
              >
                Catalog ({menuItems.length})
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {menuItems.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="p-2.5 rounded-xl border border-[#E8E1D7] bg-[#FAF8F5] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#2D372E] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#78857A]">
                      {item.isVegetarian ? '🌱 Veg' : '🍗 Non-Veg'} • {item.category?.name || 'Item'}
                    </p>
                  </div>
                  <span className="font-black text-xs text-[#2D372E]">
                    ₹{(item.sellingPrice || item.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to={`/billing?restaurantId=${currentRestaurant._id}`}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Generate Bill for this Outlet</span>
          </Link>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-3xl border border-[#E8E1D7] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E8E1D7] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#2D372E]">
              Recent Bills at {currentRestaurant.name}
            </h2>
            <p className="text-xs text-[#78857A]">Live finalized receipts for this location</p>
          </div>
          <Link
            to={`/billing-history`}
            className="text-xs font-bold text-[#758C76] hover:underline flex items-center gap-1"
          >
            <span>All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-[#88938A] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#2D372E]">No bills for this branch yet</p>
            <p className="text-xs text-[#78857A] mt-1 mb-4">Start by creating the first invoice!</p>
            <Link
              to={`/billing?restaurantId=${currentRestaurant._id}`}
              className="inline-flex items-center gap-2 bg-[#758C76] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#627763] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Bill</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#78857A] font-bold uppercase tracking-wider border-b border-[#E8E1D7]">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D7] text-[#2D372E] font-medium">
                {invoices.slice(0, 8).map((inv) => (
                  <tr key={inv._id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#2D372E]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-6 text-[#78857A]">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      {inv.customerName || 'Walk-in Guest'}
                    </td>
                    <td className="py-3.5 px-6 capitalize">
                      <span className="bg-[#EEF4EE] text-[#475448] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        {inv.orderType || 'Dine-in'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#2D372E]">
                      ₹{(Number(inv.total) || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]'
                            : 'bg-[#FAF0E6] text-[#8C6D48] border border-[#ECD9C6]'
                        }`}
                      >
                        {inv.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to="/billing-history"
                        className="text-[#758C76] hover:text-[#627763] font-bold hover:underline cursor-pointer"
                      >
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Branch to Restaurant */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E1D7] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#758C76]" />
                <h3 className="font-bold text-base text-[#2D372E]">
                  Add Branch to {currentRestaurant.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Branch Name or Location *
                </label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Vesu Branch, Ghod Dod Road, City Light"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Branch Street Address
                </label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="e.g. Shop 4, Rajhans Synfonia, Vesu Main Road"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Branch Contact Phone
                </label>
                <input
                  type="text"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="branchIsMain"
                  checked={branchIsMain}
                  onChange={(e) => setBranchIsMain(e.target.checked)}
                  className="w-4 h-4 rounded text-[#758C76] focus:ring-[#758C76] border-[#E8E1D7] cursor-pointer"
                />
                <label htmlFor="branchIsMain" className="text-xs font-semibold text-[#2D372E] cursor-pointer">
                  Mark as Primary / Main Branch
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBranch}
                  className="px-5 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {savingBranch ? 'Saving...' : 'Save & Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantDashboard
