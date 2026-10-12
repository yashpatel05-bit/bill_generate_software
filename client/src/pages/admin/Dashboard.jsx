import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  Store,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Utensils,
  ChevronRight,
  Sparkles,
  DollarSign,
  AlertCircle,
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

const Dashboard = () => {
  const { admin } = useAuth()
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurant()
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalInvoices: 0,
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [activeRestaurant])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch invoices
      const invUrl = activeRestaurant
        ? `/api/invoices?restaurantId=${activeRestaurant._id}`
        : '/api/invoices'
      const invRes = await fetch(invUrl, { credentials: 'include' })
      const invData = await invRes.json()

      // 2. Fetch orders
      const orderUrl = activeRestaurant
        ? `/api/orders?restaurantId=${activeRestaurant._id}`
        : '/api/orders'
      const ordRes = await fetch(orderUrl, { credentials: 'include' })
      const ordData = await ordRes.json()

      const invoices = invData.success ? invData.invoices || [] : []
      const orders = ordData.success ? ordData.orders || [] : []

      // Calculate totals
      const today = new Date().toDateString()
      const todayInvoices = invoices.filter(
        (inv) => new Date(inv.createdAt).toDateString() === today
      )
      const todayRev = todayInvoices.reduce((acc, curr) => acc + (curr.total || 0), 0)
      const pending = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length
      const completed = orders.filter((o) => o.status === 'completed' || o.status === 'served').length

      setStats({
        todayRevenue: todayRev,
        todayOrders: todayInvoices.length || orders.length,
        pendingOrders: pending,
        completedOrders: completed,
        totalInvoices: invoices.length,
      })

      setRecentInvoices(invoices.slice(0, 6))

      // Generate last 7 days chart data (Deterministic, NO random values)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const dayStr = d.toDateString()
        const dayRev = invoices
          .filter((inv) => new Date(inv.createdAt).toDateString() === dayStr)
          .reduce((sum, inv) => sum + (inv.total || 0), 0)
        return {
          day: days[d.getDay()],
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          sales: Math.round(dayRev),
        }
      })
      setChartData(last7Days)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    {
      title: 'Total Outlets',
      value: restaurants.length || 0,
      icon: Store,
      bgColor: 'bg-[#EEF4EE]',
      textColor: 'text-[#758C76]',
      link: '/restaurants',
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      bgColor: 'bg-[#F2F6F2]',
      textColor: 'text-[#5B775C]',
      link: '/billing-history',
    },
    {
      title: "Today's Bills",
      value: stats.todayOrders,
      icon: Receipt,
      bgColor: 'bg-[#F7F4F0]',
      textColor: 'text-[#8A7969]',
      link: '/billing',
    },
    {
      title: 'Active Invoices',
      value: stats.totalInvoices,
      icon: ShoppingBag,
      bgColor: 'bg-[#F3EFEA]',
      textColor: 'text-[#7A6A5C]',
      link: '/billing-history',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E1D7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#EEF4EE] text-[#758C76] border border-[#D3E5D4] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Control Center
            </span>
            <span className="text-[#88938A] text-xs font-medium">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D372E] tracking-tight">
            Welcome back, To Billu Bill Centre ! 👋
          </h1>
          <p className="text-[#78857A] text-xs sm:text-sm mt-1 max-w-xl">
            Managing billing, orders, and tables across{' '}
            <strong className="text-[#2D372E] font-bold">{restaurants.length} restaurant branches</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/billing"
            className="bg-[#758C76] hover:bg-[#627763] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate New Bill</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Link
              key={idx}
              to={kpi.link}
              className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs hover:border-[#758C76] transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
                  {kpi.title}
                </span>
                <div className={`w-10 h-10 rounded-xl ${kpi.bgColor} ${kpi.textColor} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#2D372E] tracking-tight">
                  {kpi.value}
                </span>
                <span className="text-xs text-[#758C76] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Charts & Quick Restaurant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#2D372E]">
                {activeRestaurant ? `Revenue Trend (Last 7 Days) • ${activeRestaurant.name}` : 'Network Revenue Trend (Last 7 Days)'}
              </h2>
              <p className="text-xs text-[#78857A]">
                {activeRestaurant ? 'Daily sales for active outlet' : 'Performance across all restaurant branches'}
              </p>
            </div>
            <span className="text-xs font-bold text-[#3E6842] bg-[#EEF4EE] px-2.5 py-1 rounded-full border border-[#D3E5D4]">
              Live Records
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashSalesGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="sales" stroke="#758C76" strokeWidth={2.5} fillOpacity={1} fill="url(#dashSalesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Restaurant Switcher & Status */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E1D7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#2D372E]">Restaurant Outlets</h2>
              <Link to="/restaurants" className="text-xs font-bold text-[#758C76] hover:underline">
                View All ({restaurants.length})
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {restaurants.slice(0, 6).map((r) => {
                const isSelected = activeRestaurant?._id === r._id
                return (
                  <div
                    key={r._id}
                    onClick={() => setActiveRestaurant(r)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${isSelected
                        ? 'border-[#758C76] bg-[#EEF4EE] shadow-xs'
                        : 'border-[#E8E1D7] hover:border-[#D5C7B8] bg-[#FAF8F5]'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#758C76] text-white' : 'bg-[#D5C7B8] text-[#2D372E]'
                          }`}
                      >
                        {r.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D372E] truncate">{r.name}</p>
                        <p className="text-[10px] text-[#78857A] truncate">{r.cuisine || 'Restaurant'}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'open'
                          ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]'
                          : 'bg-[#FBF1EF] text-[#A04838] border border-[#EED1CB]'
                        }`}
                    >
                      {r.status || 'open'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <Link
            to="/restaurants/create"
            className="w-full mt-4 py-2.5 px-4 rounded-xl border border-dashed border-[#D5C7B8] hover:border-[#758C76] hover:bg-[#EEF4EE]/40 text-[#5B775C] text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#758C76]" />
            <span>Add Another Restaurant Outlet</span>
          </Link>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-3xl border border-[#E8E1D7] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E8E1D7] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#2D372E]">Recent Generated Bills</h2>
            <p className="text-xs text-[#78857A]">Live invoices across restaurants</p>
          </div>
          <Link
            to="/billing-history"
            className="text-xs font-bold text-[#758C76] hover:underline flex items-center gap-1"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-[#88938A] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#2D372E]">No bills generated yet</p>
            <p className="text-xs text-[#78857A] mt-1 mb-4">Start by creating a new bill for any restaurant!</p>
            <Link
              to="/billing"
              className="inline-flex items-center gap-2 bg-[#758C76] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#627763] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate First Bill</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#78857A] font-bold uppercase tracking-wider border-b border-[#E8E1D7]">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Restaurant</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Payment</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D7] text-[#2D372E] font-medium">
                {recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-[#FAF8F5]/80 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-[#2D372E]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-6 font-semibold">
                      {inv.restaurant?.name || 'Restaurant'}
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
                      ₹{inv.total?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.paymentStatus === 'paid'
                            ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]'
                            : 'bg-[#FAF0E6] text-[#8C6D48] border border-[#ECD9C6]'
                          }`}
                      >
                        {inv.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => navigate('/billing-history')}
                        className="text-[#758C76] hover:text-[#627763] font-bold hover:underline cursor-pointer"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
