import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  Store,
  Plus,
  Search,
  Receipt,
  Phone,
  MapPin,
  Trash2,
  Edit,
  ExternalLink,
  ChevronDown,
  Filter,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Percent,
  Palette,
  Info,
  X,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Building2,
} from 'lucide-react'

const RestaurantManagement = () => {
  const { restaurants, fetchRestaurants, setActiveRestaurant } = useRestaurant()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cuisineFilter, setCuisineFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')
  const [loading, setLoading] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)

  // Edit / Create Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [selectedRestId, setSelectedRestId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    address: '',
    phone: '',
    gstin: '',
    currency: 'INR',
    logo: '',
    primaryColor: '#758C76',
    secondaryColor: '#D5C7B8',
    invoiceFooter: 'Thank you for dining with us!',
    cgstRate: 2.5,
    sgstRate: 2.5,
  })

  const navigate = useNavigate()

  // Close overflow menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleToggleStatus = async (restaurantId, currentStatus, e) => {
    if (e) e.stopPropagation()
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (res.ok) {
        await fetchRestaurants()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (restaurantId, name, e) => {
    if (e) e.stopPropagation()
    setActiveMenuId(null)
    if (!window.confirm(`Are you sure you want to delete "${name}"? All associated orders and menus will be archived.`)) {
      return
    }

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        await fetchRestaurants()
      } else {
        alert('Failed to delete restaurant')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedRestId(null)
    setFormData({
      name: '',
      cuisine: '',
      address: '',
      phone: '',
      gstin: '',
      currency: 'INR',
      logo: '',
      primaryColor: '#758C76',
      secondaryColor: '#D5C7B8',
      invoiceFooter: 'Thank you for dining with us!',
      cgstRate: 2.5,
      sgstRate: 2.5,
    })
    setShowModal(true)
  }

  const openEditModal = (restaurant, e) => {
    if (e) e.stopPropagation()
    setActiveMenuId(null)
    setModalMode('edit')
    setSelectedRestId(restaurant._id)
    setFormData({
      name: restaurant.name || '',
      cuisine: restaurant.cuisine || '',
      address: typeof restaurant.address === 'string' ? restaurant.address : (restaurant.address?.street || ''),
      phone: restaurant.phone || '',
      gstin: restaurant.gstin || '',
      currency: restaurant.currency || 'INR',
      logo: restaurant.logo || '',
      primaryColor: restaurant.primaryColor || '#758C76',
      secondaryColor: restaurant.secondaryColor || '#D5C7B8',
      invoiceFooter: restaurant.invoiceFooter || 'Thank you for dining with us!',
      cgstRate: restaurant.taxConfiguration?.cgstRate ?? 2.5,
      sgstRate: restaurant.taxConfiguration?.sgstRate ?? 2.5,
    })
    setShowModal(true)
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        cuisine: formData.cuisine,
        address: formData.address,
        phone: formData.phone,
        gstin: formData.gstin,
        currency: formData.currency,
        logo: formData.logo,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        invoiceFooter: formData.invoiceFooter,
        taxConfiguration: {
          cgstRate: Number(formData.cgstRate) || 0,
          sgstRate: Number(formData.sgstRate) || 0,
        },
      }

      const url = modalMode === 'create' ? '/api/restaurants' : `/api/restaurants/${selectedRestId}`
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        await fetchRestaurants()
        setShowModal(false)
      } else {
        alert(data.message || 'Operation failed')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating restaurant')
    } finally {
      setLoading(false)
    }
  }

  // Extract unique cuisines
  const availableCuisines = Array.from(
    new Set(restaurants.map((r) => r.cuisine).filter(Boolean))
  )

  // Filter & Sort
  const filteredRestaurants = restaurants
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeof r.address === 'string' && r.address.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesCuisine = cuisineFilter === 'all' || r.cuisine === cuisineFilter
      return matchesSearch && matchesStatus && matchesCuisine
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'revenue-desc') return (b.todayRevenue || 0) - (a.todayRevenue || 0)
      if (sortBy === 'orders-desc') return (b.todayOrderCount || 0) - (a.todayOrderCount || 0)
      if (sortBy === 'items-desc') return (b.menuItemCount || 0) - (a.menuItemCount || 0)
      return 0
    })

  const formatLocation = (addr) => {
    if (!addr) return 'Location not specified'
    if (typeof addr === 'string') return addr
    return [addr.street, addr.city, addr.state].filter(Boolean).join(', ') || 'India'
  }

  return (
    <div className="space-y-6">
      {/* Demonstration Notice Badge */}
      <div className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-2xl p-4 text-[#5B4F43] text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-4 h-4 text-[#758C76] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-[#2D372E]">
            Demonstration Seed Data Active
          </p>
          <p className="text-[#78857A] text-[11px] leading-relaxed">
            The six prepopulated restaurants (Tea Post, Banne Dosa, D Pizza, Burger Farm, Honest Restaurant, The Belgian Waffle Co.) are demonstration records for this environment. All branding, logos, tax rates, menus, and details are completely configurable using the Edit action.
          </p>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D372E] tracking-tight flex items-center gap-2.5">
            <Store className="w-6 h-6 text-[#758C76]" />
            <span>Restaurant Management</span>
          </h1>
          <p className="text-xs text-[#78857A] font-medium mt-0.5">
            Manage multi-restaurant brands, individual outlet performance, live status, and branding.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#758C76] hover:bg-[#627763] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Restaurant</span>
        </button>
      </div>

      {/* Search, Filter & Sort Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E1D7] shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#88938A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, cuisine, location..."
            className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Cuisine filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#88938A] uppercase tracking-wider">Cuisine:</span>
            <select
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
            >
              <option value="all">All Cuisines</option>
              {availableCuisines.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#88938A] uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
            >
              <option value="all">All Status</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#88938A] uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2D372E] focus:outline-none focus:border-[#758C76]"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="revenue-desc">Today's Revenue (High to Low)</option>
              <option value="orders-desc">Orders Count (High to Low)</option>
              <option value="items-desc">Menu Items (Most)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Restaurant Cards Grid */}
      {filteredRestaurants.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-3xl border border-[#E8E1D7]">
          <Store className="w-12 h-12 text-[#88938A] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2D372E]">No restaurants match your filters</h3>
          <p className="text-xs text-[#78857A] mt-1 mb-4">Try clearing your search query or status filter.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setCuisineFilter('all')
            }}
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EDE5] text-xs font-bold text-[#2D372E] border border-[#E8E1D7]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => {
            const isOpen = restaurant.status === 'open'
            const isMenuOpen = activeMenuId === restaurant._id

            return (
              <div
                key={restaurant._id}
                className="bg-white rounded-3xl border border-[#E8E1D7] p-5 shadow-xs hover:shadow-md hover:border-[#758C76] transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Card Header with Logo/Avatar and Overflow Menu */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Logo or Branded Icon Avatar */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-xs flex-shrink-0"
                        style={{
                          backgroundColor: restaurant.primaryColor || '#758C76',
                        }}
                      >
                        {restaurant.logo && restaurant.logo.startsWith('http') ? (
                          <img
                            src={restaurant.logo}
                            alt={restaurant.name}
                            className="w-full h-full object-cover rounded-2xl"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span>{restaurant.name ? restaurant.name[0] : 'R'}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-bold text-sm text-[#2D372E] leading-tight truncate">
                          {restaurant.name}
                        </h2>
                        <span className="text-[11px] font-semibold text-[#3E6842] bg-[#EEF4EE] border border-[#D3E5D4] px-2 py-0.5 rounded-md mt-1 inline-block truncate max-w-[170px]">
                          {restaurant.cuisine || 'Restaurant Brand'}
                        </span>
                      </div>
                    </div>

                    {/* Status badge & Overflow Menu */}
                    <div className="flex items-center gap-1.5 relative flex-shrink-0">
                      <button
                        onClick={(e) => handleToggleStatus(restaurant._id, restaurant.status, e)}
                        title={`Click to ${isOpen ? 'Deactivate' : 'Activate'}`}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                          isOpen
                            ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] hover:bg-[#E3EEE3]'
                            : 'bg-[#FBF1EF] text-[#A04838] border border-[#EED1CB] hover:bg-[#F7E5E2]'
                        }`}
                      >
                        {isOpen ? '● Open' : '○ Closed'}
                      </button>

                      {/* Overflow 3-dot Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuId(isMenuOpen ? null : restaurant._id)
                        }}
                        className="p-1 rounded-lg text-[#88938A] hover:text-[#2D372E] hover:bg-[#FAF8F5] transition cursor-pointer"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-[#E8E1D7] py-1.5 z-30 text-xs font-semibold"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(null)
                              navigate(`/restaurants/${restaurant._id}/dashboard`)
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] text-[#2D372E] flex items-center gap-2 cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5 text-[#758C76]" />
                            <span>Manage Branches</span>
                          </button>
                          <button
                            onClick={(e) => openEditModal(restaurant, e)}
                            className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] text-[#2D372E] flex items-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#758C76]" />
                            <span>Edit Restaurant</span>
                          </button>
                          <button
                            onClick={(e) => {
                              handleToggleStatus(restaurant._id, restaurant.status, e)
                              setActiveMenuId(null)
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-[#FAF8F5] text-[#2D372E] flex items-center gap-2 cursor-pointer"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#8A7969]" />
                            <span>{isOpen ? 'Deactivate (Close)' : 'Activate (Open)'}</span>
                          </button>
                          <div className="border-t border-[#E8E1D7] my-1" />
                          <button
                            onClick={(e) => handleDelete(restaurant._id, restaurant.name, e)}
                            className="w-full px-3.5 py-2 text-left hover:bg-[#FBF1EF] text-[#A04838] flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Outlet</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Contact Info */}
                  <div className="space-y-1.5 text-xs text-[#78857A] mb-4">
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#88938A] flex-shrink-0" />
                      <span className="truncate">{formatLocation(restaurant.address)}</span>
                    </div>
                    {restaurant.phone && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-[#88938A] flex-shrink-0" />
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                    {/* Branches line */}
                    <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#758C76] flex-shrink-0" />
                      <span className="font-semibold text-[#2D372E]">
                        {restaurant.branches?.length || 0} Branches
                      </span>
                      {restaurant.branches && restaurant.branches.length > 0 && (
                        <span className="text-[#88938A] truncate max-w-[170px]">
                          ({restaurant.branches.map((b) => b.name.replace(' Branch', '')).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3 Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E1D7] text-center mb-5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#88938A]">Today Orders</p>
                      <p className="text-sm font-black text-[#2D372E] mt-0.5">
                        {restaurant.todayOrderCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#88938A]">Today Sales</p>
                      <p className="text-sm font-black text-[#2D372E] mt-0.5">
                        ₹{(restaurant.todayRevenue || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#88938A]">Menu Items</p>
                      <p className="text-sm font-black text-[#2D372E] mt-0.5">
                        {restaurant.menuItemCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prominent Visit Dashboard Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveRestaurant(restaurant)
                      navigate(`/restaurants/${restaurant._id}/dashboard`)
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Visit Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Restaurant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-[#E8E1D7] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E1D7] mb-6">
              <div>
                <h2 className="text-lg font-black text-[#2D372E]">
                  {modalMode === 'create' ? 'Register New Restaurant Outlet' : `Edit ${formData.name}`}
                </h2>
                <p className="text-xs text-[#78857A]">
                  Configure brand identity, colors, taxes, and receipt message.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Restaurant Brand Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Tea Post, Banne Dosa, D Pizza"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Cuisine / Category
                  </label>
                  <input
                    type="text"
                    value={formData.cuisine}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    placeholder="e.g. Tea & Snacks, South Indian, Italian"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 123 MG Road, Bengaluru, Karnataka"
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>
              </div>

              {/* Branding & Visuals */}
              <div className="pt-4 border-t border-[#E8E1D7]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#758C76] mb-3 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Brand Identity & Colors</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-[#E8E1D7] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-2.5 py-2 text-xs font-mono font-semibold text-[#2D372E]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-[#E8E1D7] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-2.5 py-2 text-xs font-mono font-semibold text-[#2D372E]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax & GST Compliance */}
              <div className="pt-4 border-t border-[#E8E1D7]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#758C76] mb-3 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Tax & Compliance</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                      GSTIN Number
                    </label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      placeholder="e.g. 24AAABC1234D1Z5"
                      className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-mono text-[#2D372E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                      CGST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.cgstRate}
                      onChange={(e) => setFormData({ ...formData, cgstRate: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs text-[#2D372E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                      SGST Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.sgstRate}
                      onChange={(e) => setFormData({ ...formData, sgstRate: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs text-[#2D372E]"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Footer */}
              <div>
                <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                  Receipt Footer Message
                </label>
                <input
                  type="text"
                  value={formData.invoiceFooter}
                  onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                  placeholder="Thank you for dining with us!"
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-medium text-[#2D372E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving...' : modalMode === 'create' ? 'Create Outlet' : 'Update Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantManagement