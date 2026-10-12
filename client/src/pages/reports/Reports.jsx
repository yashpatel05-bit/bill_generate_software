import { useEffect, useState } from 'react'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  BarChart3,
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const renderRotatedTick = (props) => {
  const { x, y, payload } = props
  const label = payload?.value || ''
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        dx={-4}
        textAnchor="end"
        fill="#78857A"
        fontSize={10}
        fontWeight={600}
        transform="rotate(-25)"
      >
        {label}
      </text>
    </g>
  )
}

const Reports = () => {
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurant()
  
  // Initialize with activeRestaurant if available
  const [selectedRestId, setSelectedRestId] = useState(activeRestaurant?._id || 'all')
  const [dailyData, setDailyData] = useState({ revenue: 0, taxCollected: 0, orderCount: 0 })
  const [chartData, setChartData] = useState([])
  const [dishWiseData, setDishWiseData] = useState([])
  const [loading, setLoading] = useState(true)

  const [outletChartData, setOutletChartData] = useState([])
  const [trendChartData, setTrendChartData] = useState([])

  // Sync selectedRestId when activeRestaurant changes from header
  useEffect(() => {
    if (activeRestaurant && selectedRestId !== activeRestaurant._id) {
      setSelectedRestId(activeRestaurant._id)
    }
  }, [activeRestaurant])

  useEffect(() => {
    fetchReports()
  }, [selectedRestId, restaurants])

  const handleOutletChange = (restId) => {
    setSelectedRestId(restId)
    if (restId !== 'all') {
      const found = restaurants.find((r) => r._id === restId)
      if (found) {
        setActiveRestaurant(found)
      }
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const restParam = selectedRestId !== 'all' ? `?restaurantId=${selectedRestId}` : ''

      // 1. Daily / Summary report
      const dailyRes = await fetch(`/api/reports/daily${restParam}`, { credentials: 'include' })
      const dailyJson = await dailyRes.json()
      if (dailyJson.success && dailyJson.data) {
        setDailyData(dailyJson.data)
      }

      // 2. Invoices for revenue chart calculation
      const revRes = await fetch('/api/reports/restaurant/revenue', { credentials: 'include' })
      const revJson = await revRes.json()
      const allInvoices = revJson.success && revJson.data?.invoices ? revJson.data.invoices : []

      // Always build stable Revenue by Restaurant Outlet comparison from DB
      const restaurantMap = {}
      restaurants.forEach((r) => {
        restaurantMap[r._id] = { name: r.name, revenue: 0, id: r._id }
      })

      allInvoices.forEach((inv) => {
        const rId = inv.restaurant?._id || inv.restaurant
        if (restaurantMap[rId]) {
          restaurantMap[rId].revenue += inv.total || 0
        }
      })

      const formatChartName = (name) => {
        if (!name) return ''
        if (name === 'The Belgian Waffle Co.') return 'Belgian Waffle'
        if (name.length > 18) return name.substring(0, 17) + '…'
        return name
      }

      const comparisonList = Object.values(restaurantMap).map((item) => ({
        id: item.id,
        name: formatChartName(item.name),
        fullName: item.name,
        revenue: Math.round(item.revenue),
        isSelected: selectedRestId !== 'all' && item.id === selectedRestId,
      }))

      setOutletChartData(comparisonList)

      // 3. Last 7 days trend (for selected restaurant or chain)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const relevantInvoices = selectedRestId === 'all'
        ? allInvoices
        : allInvoices.filter((inv) => (inv.restaurant?._id || inv.restaurant) === selectedRestId)

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        const dateStr = d.toDateString()

        const dayRev = relevantInvoices
          .filter((inv) => new Date(inv.createdAt).toDateString() === dateStr)
          .reduce((sum, inv) => sum + (inv.total || 0), 0)

        return {
          day: days[d.getDay()],
          date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          revenue: Math.round(dayRev),
        }
      })

      setTrendChartData(last7Days)

      // 4. Dish-wise report
      const dishRes = await fetch(`/api/reports/dish-wise${restParam}`, { credentials: 'include' })
      const dishJson = await dishRes.json()
      if (dishJson.success && Array.isArray(dishJson.data)) {
        setDishWiseData(dishJson.data.slice(0, 8))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedRestaurantObj = restaurants.find((r) => r._id === selectedRestId)

  // Light aesthetic palette matching user swatch (Cream, Sage Green, Sand, White)
  const PALETTE_COLORS = [
    '#758C76', // Primary Sage Green
    '#8FA690', // Light Sage Green
    '#D5C7B8', // Soft Sand / Cashmere
    '#C2B1A0', // Warm Almond
    '#AEC2AE', // Celadon Sage
    '#9AA89B', // Olive Gray
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D372E] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#758C76]" />
            <span>Business Reports & Sales Analytics</span>
          </h1>
          <p className="text-xs text-[#78857A] font-medium mt-0.5">
            Financial reports, dish popularity, GST collected, and outlet revenue breakdowns.
          </p>
        </div>

        {/* Outlet Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">Outlet:</span>
          <select
            id="reports-outlet-selector"
            value={selectedRestId}
            onChange={(e) => handleOutletChange(e.target.value)}
            className="bg-white border border-[#E8E1D7] rounded-xl px-3.5 py-2 text-xs font-bold text-[#2D372E] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#758C76] cursor-pointer"
          >
            <option value="all">All Restaurants Network</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            Total Revenue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              ₹{dailyData.revenue?.toLocaleString('en-IN') || '0.00'}
            </span>
            <span className="text-xs font-bold text-[#3E6842] bg-[#EEF4EE] px-2.5 py-0.5 rounded-full border border-[#D3E5D4]">
              Gross Sales
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            Total Tax Collected (GST)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              ₹{dailyData.taxCollected?.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs font-bold text-[#4B6B55] bg-[#F4F7F4] px-2.5 py-0.5 rounded-full border border-[#E0EAE1]">
              CGST + SGST
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A]">
            Total Bills Finalized
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#2D372E] tracking-tight">
              {dailyData.orderCount || 0}
            </span>
            <span className="text-xs font-bold text-[#758C76] bg-[#F2F5F2] px-2.5 py-0.5 rounded-full border border-[#E2ECE2]">
              Receipts
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outlet Revenue Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#2D372E]">
                Revenue by Restaurant Outlet
              </h2>
              <p className="text-xs text-[#78857A]">
                {selectedRestId === 'all'
                  ? 'Total earnings comparison across all restaurant branches'
                  : `Comparison across outlets • Highlighted: ${selectedRestaurantObj?.name || 'Selected'}`}
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#758C76]" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outletChartData} margin={{ top: 10, right: 15, left: -10, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EDE5" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={renderRotatedTick}
                  tickLine={false}
                  axisLine={{ stroke: '#E8E1D7' }}
                  height={55}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#78857A', fontSize: 11 }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    color: '#2D372E',
                    borderRadius: '12px',
                    border: '1px solid #E8E1D7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {outletChartData.map((entry, index) => {
                    let fill = PALETTE_COLORS[index % PALETTE_COLORS.length]
                    if (selectedRestId !== 'all') {
                      fill = entry.isSelected ? '#758C76' : '#D5C7B8'
                    }
                    return <Cell key={`cell-${index}`} fill={fill} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Dishes */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E1D7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#2D372E]">Top Selling Menu Items</h2>
                <p className="text-xs text-[#78857A]">
                  {selectedRestId === 'all'
                    ? 'Highest grossing dishes across network'
                    : `Popular dishes for ${selectedRestaurantObj?.name || 'outlet'}`}
                </p>
              </div>
              <UtensilsCrossed className="w-4 h-4 text-[#758C76]" />
            </div>

            {dishWiseData.length === 0 ? (
              <div className="py-14 text-center text-[#88938A] text-xs">
                Dish sales data will automatically appear as bills are generated.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dishWiseData.map((dish, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E1D7]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#E4ECE4] text-[#4B5B4C] font-black text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-[#2D372E]">{dish.name}</p>
                        <p className="text-[10px] text-[#78857A]">{dish.quantity} orders fulfilled</p>
                      </div>
                    </div>
                    <span className="font-black text-[#2D372E]">
                      ₹{dish.revenue?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Sales Trend Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E1D7] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2D372E]">
              {selectedRestId === 'all'
                ? 'Network 7-Day Revenue Trend'
                : `7-Day Sales Performance • ${selectedRestaurantObj?.name || 'Selected Outlet'}`}
            </h2>
            <p className="text-xs text-[#78857A]">
              Daily revenue totals from finalized customer receipts
            </p>
          </div>
          <span className="text-xs font-bold text-[#3E6842] bg-[#EEF4EE] px-2.5 py-1 rounded-full border border-[#D3E5D4]">
            Actual Sales
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="reportsColorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#758C76" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#758C76" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EDE5" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#E8E1D7' }}
                tick={{ fill: '#78857A', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#78857A', fontSize: 11 }}
                tickFormatter={(v) => `₹${v}`}
              />
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#758C76"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#reportsColorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Reports
