import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRestaurant } from '../../context/RestaurantContext'
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  Clock,
  Layers,
  X,
  AlertCircle,
} from 'lucide-react'

const MenuManagement = () => {
  const { restaurantId } = useParams()
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurant()
  const navigate = useNavigate()

  const currentRestaurantId = restaurantId || activeRestaurant?._id || (restaurants[0] && restaurants[0]._id)
  const currentRestaurant = restaurants.find((r) => r._id === currentRestaurantId)

  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    isVegetarian: true,
    preparationTime: 15,
  })

  useEffect(() => {
    if (currentRestaurantId) {
      fetchMenuData(currentRestaurantId)
    }
  }, [currentRestaurantId])

  const fetchMenuData = async (rId) => {
    setLoading(true)
    try {
      // 1. Fetch Categories
      const catRes = await fetch(`/api/menu/${rId}/categories`, { credentials: 'include' })
      const catData = await catRes.json()
      if (catData.success && Array.isArray(catData.categories)) {
        setCategories(catData.categories)
        if (catData.categories.length > 0 && !newItem.category) {
          setNewItem((prev) => ({ ...prev, category: catData.categories[0]._id }))
        }
      }

      // 2. Fetch Menu Items
      const menuRes = await fetch(`/api/menu/${rId}/menu`, { credentials: 'include' })
      const menuData = await menuRes.json()
      if (menuData.success && Array.isArray(menuData.items)) {
        setMenuItems(menuData.items)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      const res = await fetch(`/api/menu/${currentRestaurantId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCategoryName }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNewCategoryName('')
        setShowCategoryModal(false)
        await fetchMenuData(currentRestaurantId)
      } else {
        alert(data.message || 'Failed to create category')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Create Item
  const handleCreateItem = async (e) => {
    e.preventDefault()
    if (!newItem.name || !newItem.price) return

    try {
      const payload = {
        name: newItem.name,
        price: Number(newItem.price),
        category: newItem.category || (categories[0] && categories[0]._id),
        description: newItem.description,
        isVegetarian: newItem.isVegetarian,
        preparationTime: Number(newItem.preparationTime) || 15,
      }

      const res = await fetch(`/api/menu/${currentRestaurantId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setNewItem({
          name: '',
          price: '',
          category: categories[0]?._id || '',
          description: '',
          isVegetarian: true,
          preparationTime: 15,
        })
        setShowItemModal(false)
        await fetchMenuData(currentRestaurantId)
      } else {
        alert(data.message || 'Failed to add item')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Toggle Availability
  const handleToggleAvailability = async (itemId) => {
    try {
      const res = await fetch(`/api/menu/${currentRestaurantId}/menu/${itemId}/toggle-availability`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((it) => (it._id === itemId ? { ...it, availability: !it.availability } : it))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Item
  const handleDeleteItem = async (itemId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      const res = await fetch(`/api/menu/${currentRestaurantId}/menu/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setMenuItems((prev) => prev.filter((it) => it._id !== itemId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCat =
      selectedCategory === 'all' ||
      (item.category && (item.category._id === selectedCategory || item.category === selectedCategory))
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/restaurants"
            className="p-2.5 rounded-xl border border-[#E8E1D7] bg-white hover:bg-[#FAF8F5] text-[#2D372E] transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#758C76]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#2D372E] tracking-tight">
                {currentRestaurant?.name || 'Restaurant'} Menu
              </h1>
              <span className="text-xs bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] font-bold px-2 py-0.5 rounded-md">
                {menuItems.length} items
              </span>
            </div>
            <p className="text-xs text-[#78857A] font-medium">
              Manage dishes, categories, pricing, and live kitchen availability.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-[#D5C7B8] bg-white hover:bg-[#FAF8F5] text-[#2D372E] text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#758C76]" />
            <span>+ Add Category</span>
          </button>

          <button
            onClick={() => {
              if (categories.length > 0 && !newItem.category) {
                setNewItem((prev) => ({ ...prev, category: categories[0]._id }))
              }
              setShowItemModal(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Restaurant Switcher Tabs if multiple */}
      {restaurants.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-[#88938A] whitespace-nowrap mr-1">
            Outlets:
          </span>
          {restaurants.map((rest) => (
            <button
              key={rest._id}
              onClick={() => {
                setActiveRestaurant(rest)
                navigate(`/restaurants/${rest._id}/menu`)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                rest._id === currentRestaurantId
                  ? 'bg-[#758C76] text-white shadow-xs'
                  : 'bg-white border border-[#E8E1D7] text-[#2D372E] hover:border-[#D5C7B8]'
              }`}
            >
              {rest.name}
            </button>
          ))}
        </div>
      )}

      {/* Category Filter Pills & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8E1D7] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#758C76] text-white shadow-xs'
                : 'bg-[#FAF8F5] border border-[#E8E1D7] hover:bg-[#F2EDE5] text-[#2D372E]'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat._id
                  ? 'bg-[#758C76] text-white shadow-xs'
                  : 'bg-[#FAF8F5] border border-[#E8E1D7] hover:bg-[#F2EDE5] text-[#2D372E]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search className="w-4 h-4 text-[#88938A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish name..."
            className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="bg-white p-16 text-center rounded-3xl border border-[#E8E1D7]">
          <div className="w-8 h-8 border-3 border-[#758C76]/30 border-t-[#758C76] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-[#78857A]">Loading restaurant menu catalog...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-[#E8E1D7]">
          <UtensilsCrossed className="w-12 h-12 text-[#88938A] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#2D372E]">No menu items found</h3>
          <p className="text-xs text-[#78857A] mt-1 mb-4">
            Add items to this category or create a new delicious dish.
          </p>
          <button
            onClick={() => setShowItemModal(true)}
            className="inline-flex items-center gap-1.5 bg-[#758C76] text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white rounded-3xl border p-4.5 shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                item.availability ? 'border-[#E8E1D7]' : 'border-[#E8E1D7]/50 bg-[#FAF8F5]/50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Veg/Non-veg mark */}
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center p-0.5 flex-shrink-0 ${
                        item.isVegetarian
                          ? 'border-[#3E6842] bg-white'
                          : 'border-[#A04838] bg-white'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.isVegetarian ? 'bg-[#3E6842]' : 'bg-[#A04838]'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#88938A] uppercase tracking-wider">
                      {item.category?.name || 'Item'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleAvailability(item._id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                      item.availability
                        ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4] hover:bg-[#E3EEE3]'
                        : 'bg-[#F2EDE5] text-[#78857A] hover:bg-[#E8E1D7]'
                    }`}
                  >
                    {item.availability ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>

                <h3 className="font-bold text-sm text-[#2D372E] leading-snug">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-[11px] text-[#78857A] mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-[#E8E1D7] flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-[#2D372E]">
                    ₹{(item.sellingPrice || item.price || 0).toFixed(2)}
                  </span>
                  {item.preparationTime > 0 && (
                    <span className="text-[10px] text-[#88938A] ml-1.5">
                      • {item.preparationTime}m
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteItem(item._id, item.name)}
                    className="p-1.5 rounded-lg border border-[#E8E1D7] text-[#88938A] hover:text-[#A04838] hover:border-[#EED1CB] hover:bg-[#FBF1EF] transition cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-[#E8E1D7]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#2D372E]">Add Menu Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Starters, Main Course, Drinks"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#758C76] text-white hover:bg-[#627763] shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Menu Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-[#2D372E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-[#E8E1D7] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#2D372E]">Add New Menu Item</h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-[#88938A] hover:text-[#2D372E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                  Dish / Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Butter Paneer Masala, Masala Chai"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="e.g. 150"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Short description of ingredients or taste..."
                  rows={2}
                  className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl p-3 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Food Type
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[#2D372E] cursor-pointer">
                      <input
                        type="radio"
                        checked={newItem.isVegetarian}
                        onChange={() => setNewItem({ ...newItem, isVegetarian: true })}
                        className="accent-[#758C76]"
                      />
                      <span>Veg</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[#2D372E] cursor-pointer">
                      <input
                        type="radio"
                        checked={!newItem.isVegetarian}
                        onChange={() => setNewItem({ ...newItem, isVegetarian: false })}
                        className="accent-[#758C76]"
                      />
                      <span>Non-Veg</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    value={newItem.preparationTime}
                    onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E1D7]">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#78857A] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#758C76] text-white hover:bg-[#627763] shadow-xs cursor-pointer"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuManagement