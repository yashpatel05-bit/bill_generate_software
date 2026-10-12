import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  Receipt,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Search,
  Store,
  User,
  Phone,
  Utensils,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  X,
  Share2,
  MapPin,
  Tag,
  Building2,
} from 'lucide-react'

const BillGenerator = () => {
  const [searchParams] = useSearchParams()
  const { restaurants, activeRestaurant, setActiveRestaurant, fetchRestaurants } = useRestaurant()
  const navigate = useNavigate()

  // Selected restaurant
  const queryRestId = searchParams.get('restaurantId')
  const [selectedRestId, setSelectedRestId] = useState(
    queryRestId || activeRestaurant?._id || (restaurants[0] && restaurants[0]._id) || ''
  )
  const currentRestaurant = restaurants.find((r) => r._id === selectedRestId) || activeRestaurant

  // Synchronize with activeRestaurant changes from header
  useEffect(() => {
    if (activeRestaurant && activeRestaurant._id !== selectedRestId) {
      setSelectedRestId(activeRestaurant._id)
    }
  }, [activeRestaurant])

  // Branches of current restaurant
  const availableBranches = useMemo(() => {
    if (currentRestaurant?.branches && currentRestaurant.branches.length > 0) {
      return currentRestaurant.branches
    }
    // Fallback default branches (2-4 places)
    return [
      { name: 'Vesu Branch', address: 'Vesu Main Road', isMain: true },
      { name: 'Ghod Dod Road Branch', address: 'Ghod Dod Road' },
      { name: 'City Light Branch', address: 'City Light Hub' },
    ]
  }, [currentRestaurant])

  const [selectedBranch, setSelectedBranch] = useState(
    availableBranches[0]?.name || 'Vesu Branch'
  )

  // Update selected branch when restaurant changes
  useEffect(() => {
    if (availableBranches.length > 0) {
      setSelectedBranch(availableBranches[0].name)
    }
  }, [availableBranches])

  // Menu items and categories
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [tables, setTables] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Order Details
  const [orderType, setOrderType] = useState('dine-in')
  const [selectedTable, setSelectedTable] = useState('Table 1')
  const [customerName, setCustomerName] = useState('Walk-in Guest')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState(0)

  // Cart
  const [cart, setCart] = useState([])

  // Generated Invoice Modal
  const [generatedInvoice, setGeneratedInvoice] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Modals for "+ Insert Dish", "+ Custom Table", and "+ Add Branch"
  const [showAddDishModal, setShowAddDishModal] = useState(false)
  const [showAddTableModal, setShowAddTableModal] = useState(false)
  const [showAddBranchModal, setShowAddBranchModal] = useState(false)

  // Insert Dish Form State
  const [newDishName, setNewDishName] = useState('')
  const [newDishPrice, setNewDishPrice] = useState('')
  const [newDishCategory, setNewDishCategory] = useState('')
  const [newDishIsVeg, setNewDishIsVeg] = useState(true)
  const [addingDish, setAddingDish] = useState(false)

  // Custom Table Form State
  const [customTableName, setCustomTableName] = useState('')
  const [customTableCapacity, setCustomTableCapacity] = useState(4)
  const [addingTable, setAddingTable] = useState(false)

  // Add Branch Form State
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchAddress, setNewBranchAddress] = useState('')
  const [newBranchPhone, setNewBranchPhone] = useState('')
  const [savingBranch, setSavingBranch] = useState(false)

  useEffect(() => {
    if (selectedRestId) {
      loadRestaurantData(selectedRestId)
    }
  }, [selectedRestId])

  const loadRestaurantData = async (rId) => {
    setLoading(true)
    try {
      // 1. Menu Items
      const menuRes = await fetch(`/api/menu/${rId}/menu`, { credentials: 'include' })
      const menuData = await menuRes.json()
      if (menuData.success) {
        setMenuItems(menuData.items || [])
      }

      // 2. Categories
      const catRes = await fetch(`/api/menu/${rId}/categories`, { credentials: 'include' })
      const catData = await catRes.json()
      if (catData.success) {
        setCategories(catData.categories || [])
      }

      // 3. Tables
      const tabRes = await fetch(`/api/tables?restaurantId=${rId}`, { credentials: 'include' })
      const tabData = await tabRes.json()
      if (tabData.success && tabData.tables?.length > 0) {
        setTables(tabData.tables)
        setSelectedTable(tabData.tables[0].name || 'Table 1')
      } else {
        // Fallback default tables 1-6
        const defaultTabs = [
          { name: 'Table 1', capacity: 2 },
          { name: 'Table 2', capacity: 4 },
          { name: 'Table 3', capacity: 2 },
          { name: 'Table 4', capacity: 4 },
          { name: 'Table 5', capacity: 6 },
          { name: 'Table 6', capacity: 4 },
        ]
        setTables(defaultTabs)
        setSelectedTable('Table 1')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Deduplicate categories by clean name
  const uniqueCategories = useMemo(() => {
    const list = []
    const seen = new Set()
    categories.forEach((c) => {
      const norm = (c.name || '').trim().toLowerCase()
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        list.push(c)
      }
    })
    return list
  }, [categories])

  // Cart Operations
  const addToCart = (item) => {
    const unitPrice = Number(item.sellingPrice ?? item.price ?? 0)
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem === item._id)
      if (existing) {
        return prev.map((i) =>
          i.menuItem === item._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          priceAtOrder: unitPrice,
          priceAtInvoice: unitPrice,
          quantity: 1,
        },
      ]
    })
  }

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItem === itemId) {
            const newQ = i.quantity + delta
            return newQ > 0 ? { ...i, quantity: newQ } : null
          }
          return i
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.menuItem !== itemId))
  }

  // Handle Add Dish Modal Submit
  const handleInsertDish = async (e) => {
    e.preventDefault()
    if (!newDishName.trim() || !newDishPrice) {
      alert('Please provide a dish name and valid price.')
      return
    }

    setAddingDish(true)
    try {
      const payload = {
        name: newDishName.trim(),
        price: Number(newDishPrice),
        category: newDishCategory || undefined,
        isVegetarian: newDishIsVeg,
      }

      const res = await fetch(`/api/menu/${selectedRestId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        // Reload menu
        await loadRestaurantData(selectedRestId)
        // Auto add new item to cart
        if (data.item) {
          addToCart(data.item)
        }
        setShowAddDishModal(false)
        setNewDishName('')
        setNewDishPrice('')
      } else {
        alert(data.message || 'Failed to insert dish')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating dish')
    } finally {
      setAddingDish(false)
    }
  }

  // Handle Add Custom Table Submit
  const handleAddCustomTable = async (e) => {
    e.preventDefault()
    const name = customTableName.trim()
    if (!name) {
      alert('Please enter table name/number (e.g., Table 4, Table 5, Rooftop 1).')
      return
    }

    setAddingTable(true)
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          restaurantId: selectedRestId,
          name,
          capacity: Number(customTableCapacity) || 4,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        const newTab = data.table || { name, capacity: customTableCapacity }
        setTables((prev) => [...prev, newTab])
        setSelectedTable(name)
        setShowAddTableModal(false)
        setCustomTableName('')
      } else {
        // Even if DB error, allow selection locally for billing
        setTables((prev) => [...prev, { name, capacity: customTableCapacity }])
        setSelectedTable(name)
        setShowAddTableModal(false)
        setCustomTableName('')
      }
    } catch (err) {
      console.error(err)
      // Allow fallback local table
      setTables((prev) => [...prev, { name, capacity: customTableCapacity }])
      setSelectedTable(name)
      setShowAddTableModal(false)
      setCustomTableName('')
    } finally {
      setAddingTable(false)
    }
  }

  // Handle Add Branch Modal Submit
  const handleInsertBranch = async (e) => {
    e.preventDefault()
    if (!newBranchName.trim()) {
      alert('Branch name is required.')
      return
    }

    setSavingBranch(true)
    try {
      const res = await fetch(`/api/restaurants/${selectedRestId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newBranchName.trim(),
          address: newBranchAddress.trim(),
          phone: newBranchPhone.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (fetchRestaurants) await fetchRestaurants()
        setSelectedBranch(newBranchName.trim())
        setShowAddBranchModal(false)
        setNewBranchName('')
        setNewBranchAddress('')
        setNewBranchPhone('')
      } else {
        alert(data.message || 'Failed to add branch')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating branch')
    } finally {
      setSavingBranch(false)
    }
  }

  // Totals calculation
  const subtotal = cart.reduce((acc, curr) => {
    const price = Number(curr.priceAtOrder ?? curr.priceAtInvoice ?? 0)
    return acc + price * curr.quantity
  }, 0)

  const cgstRate = currentRestaurant?.taxConfiguration?.cgstRate ?? 2.5
  const sgstRate = currentRestaurant?.taxConfiguration?.sgstRate ?? 2.5
  const cgst = Math.round(subtotal * (cgstRate / 100) * 100) / 100
  const sgst = Math.round(subtotal * (sgstRate / 100) * 100) / 100
  const grandTotal = Math.max(0, Math.round((subtotal + cgst + sgst - Number(discount || 0)) * 100) / 100)

  // Generate Invoice Handler
  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items to create a bill.')
      return
    }

    if (!selectedRestId) {
      alert('Please select a restaurant outlet.')
      return
    }

    setGenerating(true)
    try {
      const payload = {
        customerName: customerName || 'Walk-in Guest',
        customerPhone: customerPhone || undefined,
        orderType,
        branch: selectedBranch,
        tableNumber: orderType === 'dine-in' ? selectedTable : undefined,
        items: cart.map((i) => {
          const unitPrice = Number(i.priceAtOrder ?? i.priceAtInvoice ?? 0)
          return {
            menuItem: i.menuItem,
            name: i.name,
            quantity: i.quantity,
            priceAtOrder: unitPrice,
            priceAtInvoice: unitPrice,
            total: Math.round(unitPrice * i.quantity * 100) / 100,
          }
        }),
        discount: Number(discount) || 0,
        paymentStatus,
        paymentMethod,
      }

      const res = await fetch(`/api/invoices/${selectedRestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setGeneratedInvoice({
          ...data.invoice,
          branch: selectedBranch,
          restaurantDetails: currentRestaurant,
        })
        setCart([])
        setDiscount(0)
      } else {
        alert(data.message || 'Failed to create invoice')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to billing service')
    } finally {
      setGenerating(false)
    }
  }

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat =
      selectedCategory === 'all' ||
      (item.category && (item.category._id === selectedCategory || item.category === selectedCategory || item.category?.name === selectedCategory))
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6">
      {/* Top Banner & Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#2D372E] tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#758C76]" />
            <span>Live POS Bill Generator</span>
          </h1>
          <p className="text-xs text-[#78857A] font-medium mt-0.5">
            Fast checkout, order customizer, live tax calculation, and thermal/A4 receipt printing.
          </p>
        </div>

        {/* Outlet & Branch Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Restaurant Outlet selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">Outlet:</span>
            <select
              value={selectedRestId}
              onChange={(e) => {
                setSelectedRestId(e.target.value)
                const selected = restaurants.find((r) => r._id === e.target.value)
                if (selected) {
                  setActiveRestaurant(selected)
                }
              }}
              className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] shadow-xs focus:outline-none focus:border-[#758C76] cursor-pointer"
            >
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Restaurant Branch selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#88938A] uppercase tracking-wider">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => {
                if (e.target.value === '__add_custom_branch__') {
                  setShowAddBranchModal(true)
                } else {
                  setSelectedBranch(e.target.value)
                }
              }}
              className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] shadow-xs focus:outline-none focus:border-[#758C76] cursor-pointer"
            >
              {availableBranches.map((b, idx) => (
                <option key={idx} value={b.name}>
                  {b.name}
                </option>
              ))}
              <option value="__add_custom_branch__">+ Add Branch...</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAddBranchModal(true)}
              title="Add new branch"
              className="px-2.5 py-1.5 rounded-xl bg-[#EEF4EE] hover:bg-[#758C76] hover:text-white border border-[#D3E5D4] text-[#3E6842] text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Catalog (60%), Right Cart (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Catalog */}
        <div className="lg:col-span-7 space-y-4">
          {/* Order Preferences (Type + Table + Customer) */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Order Type Tabs */}
              <div className="flex p-1 bg-[#FAF8F5] rounded-2xl border border-[#E8E1D7]">
                {['dine-in', 'takeaway', 'delivery'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      orderType === type
                        ? 'bg-[#758C76] text-white shadow-xs'
                        : 'text-[#78857A] hover:text-[#2D372E]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Table Selector (if dine-in) with Manual Add Table Option */}
              {orderType === 'dine-in' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#88938A]">Table:</span>
                  <select
                    value={selectedTable}
                    onChange={(e) => {
                      if (e.target.value === '__add_custom__') {
                        setShowAddTableModal(true)
                      } else {
                        setSelectedTable(e.target.value)
                      }
                    }}
                    className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76] cursor-pointer"
                  >
                    {tables.map((t, idx) => (
                      <option key={t._id || idx} value={t.name}>
                        {t.name} (Cap: {t.capacity || 4})
                      </option>
                    ))}
                    <option value="__add_custom__">+ Add Custom Table...</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAddTableModal(true)}
                    title="Add new table manually"
                    className="px-2.5 py-1.5 rounded-xl bg-[#EEF4EE] hover:bg-[#758C76] hover:text-white border border-[#D3E5D4] text-[#3E6842] text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>
              )}
            </div>

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8E1D7]">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#88938A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#88938A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>
            </div>
          </div>

          {/* Menu Catalog Controls & Grid */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E1D7] shadow-xs space-y-4">
            {/* Top row: Search input and "+ Insert Dish" button */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#88938A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick find dishes by name..."
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#88938A] hover:text-[#2D372E]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Insert Dish with Price Button */}
              <button
                type="button"
                onClick={() => setShowAddDishModal(true)}
                className="px-4 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Dish with Price</span>
              </button>
            </div>

            {/* Second row: Category pills (proper wrapping, deduplicated, zero clipping) */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E8E1D7]/60">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#758C76] text-white shadow-xs'
                    : 'bg-[#FAF8F5] border border-[#E8E1D7] hover:bg-[#F2EDE5] text-[#2D372E]'
                }`}
              >
                All ({menuItems.length})
              </button>
              {uniqueCategories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === c._id
                      ? 'bg-[#758C76] text-white shadow-xs'
                      : 'bg-[#FAF8F5] border border-[#E8E1D7] hover:bg-[#F2EDE5] text-[#2D372E]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            {filteredMenuItems.length === 0 ? (
              <div className="p-12 text-center text-[#88938A] text-xs space-y-2">
                <Utensils className="w-8 h-8 mx-auto text-[#D5C7B8]" />
                <p className="font-semibold text-[#2D372E]">No dishes match your filter.</p>
                <p className="text-[11px] text-[#78857A]">
                  Click &ldquo;Insert Dish with Price&rdquo; above to quickly add dishes to this restaurant.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredMenuItems.map((item) => {
                  const dishPrice = Number(item.sellingPrice ?? item.price ?? 0)
                  return (
                    <div
                      key={item._id}
                      onClick={() => addToCart(item)}
                      className="p-3.5 rounded-2xl border border-[#E8E1D7] hover:border-[#758C76] hover:bg-[#EEF4EE]/30 bg-white transition cursor-pointer flex flex-col justify-between group shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div
                            className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 ${
                              item.isVegetarian ? 'border-[#3E6842]' : 'border-[#A04838]'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVegetarian ? 'bg-[#3E6842]' : 'bg-[#A04838]'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] text-[#78857A] font-semibold truncate max-w-[100px]">
                            {item.category?.name || 'Dish'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[#2D372E] line-clamp-1 group-hover:text-[#758C76] transition">
                          {item.name}
                        </h4>
                      </div>

                      {/* Explicitly Visible Dish Price with + Button */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E8E1D7]">
                        <span className="font-black text-sm text-[#2D372E] tracking-tight">
                          ₹{dishPrice.toFixed(2)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-[#EEF4EE] text-[#3E6842] font-black flex items-center justify-center group-hover:bg-[#758C76] group-hover:text-white transition text-xs shadow-xs">
                          +
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Bill Calculation */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E1D7] shadow-sm p-6 sticky top-20 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-[#2D372E]">Order Cart</h2>
              <span className="bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] font-bold text-xs px-2.5 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-[#88938A] hover:text-[#A04838] font-medium cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-12 text-center text-[#88938A]">
              <Utensils className="w-10 h-10 mx-auto mb-2 text-[#D5C7B8]" />
              <p className="text-xs font-bold text-[#2D372E]">Cart is empty</p>
              <p className="text-[11px] text-[#78857A] mt-0.5">
                Click any dish from the catalog on the left to add.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item) => {
                const itemUnitPrice = Number(item.priceAtOrder ?? item.priceAtInvoice ?? 0)
                const itemTotal = itemUnitPrice * item.quantity
                return (
                  <div
                    key={item.menuItem}
                    className="flex items-center justify-between p-2.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E1D7]"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-[#2D372E] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#78857A]">
                        ₹{itemUnitPrice.toFixed(2)} × {item.quantity} = ₹{itemTotal.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.menuItem, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#E8E1D7] text-[#2D372E] hover:bg-[#FAF8F5] flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black w-5 text-center text-[#2D372E]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#E8E1D7] text-[#2D372E] hover:bg-[#FAF8F5] flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menuItem)}
                        className="p-1 text-[#88938A] hover:text-[#A04838] ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="space-y-2 pt-3 border-t border-[#E8E1D7] text-xs">
            <div className="flex justify-between text-[#78857A]">
              <span>Subtotal</span>
              <span className="font-semibold text-[#2D372E]">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#78857A]">
              <span>CGST ({cgstRate}%)</span>
              <span className="font-semibold text-[#2D372E]">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#78857A]">
              <span>SGST ({sgstRate}%)</span>
              <span className="font-semibold text-[#2D372E]">₹{sgst.toFixed(2)}</span>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#78857A]">Special Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-20 bg-[#FAF8F5] border border-[#E8E1D7] rounded-lg px-2 py-1 text-right text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
              />
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-baseline pt-3 border-t border-[#E8E1D7] text-[#2D372E] font-black text-base">
              <span>Total Payable</span>
              <span className="text-xl text-[#758C76] font-black">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method / Status */}
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / QR', icon: QrCode },
                { id: 'card', label: 'Card', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      paymentMethod === m.id
                        ? 'border-[#758C76] bg-[#EEF4EE] text-[#3E6842]'
                        : 'border-[#E8E1D7] hover:bg-[#FAF8F5] text-[#78857A]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#88938A] font-semibold">Payment State:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaymentStatus('paid')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                    paymentStatus === 'paid'
                      ? 'bg-[#758C76] text-white shadow-xs'
                      : 'bg-[#FAF8F5] border border-[#E8E1D7] text-[#78857A]'
                  }`}
                >
                  ✓ Paid
                </button>
                <button
                  onClick={() => setPaymentStatus('unpaid')}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition ${
                    paymentStatus === 'unpaid'
                      ? 'bg-[#D5C7B8] text-[#2D372E] shadow-xs'
                      : 'bg-[#FAF8F5] border border-[#E8E1D7] text-[#78857A]'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleGenerateInvoice}
            disabled={cart.length === 0 || generating}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#758C76] hover:bg-[#627763] text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Generate Invoice & Print Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal: Insert Dish with Price */}
      {showAddDishModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E1D7] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#758C76]" />
                <h3 className="font-bold text-base text-[#2D372E]">Insert Dish with Price</h3>
              </div>
              <button
                onClick={() => setShowAddDishModal(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertDish} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Cheese Burst Pizza, Hakka Noodles..."
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newDishPrice}
                  onChange={(e) => setNewDishPrice(e.target.value)}
                  placeholder="e.g. 250.00"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Category (Optional)
                </label>
                <select
                  value={newDishCategory}
                  onChange={(e) => setNewDishCategory(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                >
                  <option value="">Default Category</option>
                  {uniqueCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1.5">
                  Dietary Classification
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDishIsVeg(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      newDishIsVeg
                        ? 'bg-[#EEF4EE] border-[#3E6842] text-[#3E6842]'
                        : 'bg-[#FAF8F5] border-[#E8E1D7] text-[#78857A]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#3E6842]" />
                    <span>Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDishIsVeg(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      !newDishIsVeg
                        ? 'bg-[#FBF1EF] border-[#A04838] text-[#A04838]'
                        : 'bg-[#FAF8F5] border-[#E8E1D7] text-[#78857A]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#A04838]" />
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDish}
                  className="px-5 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {addingDish ? 'Saving Dish...' : 'Save & Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manually Add Table */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#E8E1D7] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
              <h3 className="font-bold text-base text-[#2D372E]">Add Table Manually</h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Table Name or Number *
                </label>
                <input
                  type="text"
                  required
                  value={customTableName}
                  onChange={(e) => setCustomTableName(e.target.value)}
                  placeholder="e.g. Table 4, Table 5, Rooftop 1"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Seating Capacity (Guests)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customTableCapacity}
                  onChange={(e) => setCustomTableCapacity(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTable}
                  className="px-5 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {addingTable ? 'Adding...' : 'Set & Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Branch to Restaurant */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#E8E1D7] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#758C76]" />
                <h3 className="font-bold text-base text-[#2D372E]">Add New Branch</h3>
              </div>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInsertBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Branch Name or Area *
                </label>
                <input
                  type="text"
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. Vesu Branch, City Light, Adajan"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-bold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Street Address (Optional)
                </label>
                <input
                  type="text"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  placeholder="e.g. Main Avenue, Surat"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475448] mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="text"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E1D7]">
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
                  {savingBranch ? 'Adding...' : 'Save & Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Modal */}
      {generatedInvoice && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E8E1D7] overflow-hidden max-h-[92vh] flex flex-col justify-between">
            {/* Modal Header: Renamed to "Invoice Receipt" */}
            <div className="p-4 border-b border-[#E8E1D7] flex items-center justify-between bg-[#FAF8F5] no-print">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#3E6842]" />
                <span className="font-bold text-sm text-[#2D372E]">Invoice Receipt</span>
              </div>
              <button
                onClick={() => setGeneratedInvoice(null)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Canvas: Zero NaN Guarantee */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-[#2D372E]" id="receipt-area">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#D5C7B8]">
                <h2 className="text-lg font-black text-[#2D372E] tracking-wider">
                  {generatedInvoice.restaurantDetails?.name || 'BILLU RESTAURANT'}
                </h2>
                {generatedInvoice.branch && (
                  <p className="text-[11px] font-bold text-[#758C76]">
                    {generatedInvoice.branch}
                  </p>
                )}
                <p className="text-[11px] text-[#78857A]">
                  Invoice Receipt • Official Bill of Supply
                </p>
                <p className="text-[11px] text-[#78857A]">
                  Phone: {generatedInvoice.restaurantDetails?.phone || '+91 98765 43210'}
                </p>
                {generatedInvoice.restaurantDetails?.gstin && (
                  <p className="text-[10px] text-[#88938A] font-mono">
                    GSTIN: {generatedInvoice.restaurantDetails.gstin}
                  </p>
                )}
              </div>

              <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-[#D5C7B8]">
                <div className="flex justify-between">
                  <span>Invoice: <strong>{generatedInvoice.invoiceNumber}</strong></span>
                  <span>Date: {new Date(generatedInvoice.invoiceDate || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest: {generatedInvoice.customerName}</span>
                  <span className="capitalize">{generatedInvoice.orderType}</span>
                </div>
                {generatedInvoice.tableNumber && (
                  <div>Table: {generatedInvoice.tableNumber}</div>
                )}
              </div>

              {/* Items List: Guaranteed Valid Numbers, Zero NaN */}
              <div className="space-y-1.5 pb-3 border-b border-dashed border-[#D5C7B8]">
                <div className="flex justify-between font-bold text-[11px] text-[#78857A]">
                  <span>Item</span>
                  <span>Qty × Price = Total</span>
                </div>
                {generatedInvoice.items?.map((item, idx) => {
                  const qty = Number(item.quantity) || 1
                  const unitPrice = Number(
                    item.priceAtInvoice ?? 
                    item.priceAtOrder ?? 
                    item.price ?? 
                    item.sellingPrice ?? 
                    (item.total && qty ? item.total / qty : 0)
                  ) || 0
                  const lineTotal = Number(item.total) || (qty * unitPrice) || 0

                  return (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="font-medium truncate pr-2">{item.name}</span>
                      <span className="whitespace-nowrap font-mono">
                        {qty} × ₹{unitPrice.toFixed(2)} = ₹{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs pb-3 border-b border-dashed border-[#D5C7B8]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{(Number(generatedInvoice.subtotal) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#78857A]">
                  <span>CGST</span>
                  <span>₹{(Number(generatedInvoice.cgst) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#78857A]">
                  <span>SGST</span>
                  <span>₹{(Number(generatedInvoice.sgst) || 0).toFixed(2)}</span>
                </div>
                {Number(generatedInvoice.discount) > 0 && (
                  <div className="flex justify-between text-[#3E6842]">
                    <span>Discount</span>
                    <span>-₹{(Number(generatedInvoice.discount) || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-[#2D372E] pt-1 border-t border-[#E8E1D7]">
                  <span>FINAL TOTAL</span>
                  <span className="text-[#758C76]">₹{(Number(generatedInvoice.total) || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-[#78857A] pt-1 space-y-1">
                <p className="font-semibold text-[#2D372E]">
                  Status: {(generatedInvoice.paymentStatus || 'PAID').toUpperCase()} ({paymentMethod.toUpperCase()})
                </p>
                <p className="italic">
                  {generatedInvoice.invoiceFooter || 'Thank you for dining with us!'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E1D7] flex items-center justify-end gap-2 no-print">
              <button
                onClick={() => setGeneratedInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#F2EDE5] transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillGenerator
