import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRestaurant } from '../../context/RestaurantContext'
import { Store, ArrowLeft, CheckCircle2, AlertCircle, Building2, Phone, MapPin, Receipt, Percent } from 'lucide-react'

const Restaurants = () => {
  const { fetchRestaurants } = useRestaurant()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    cuisine: '',
    address: '',
    phone: '',
    gstin: '',
    currency: 'INR',
    cgstRate: 2.5,
    sgstRate: 2.5,
    invoiceFooter: 'Thank you for dining with us! Please visit again.',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Restaurant name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = {
        name: formData.name,
        cuisine: formData.cuisine,
        address: formData.address,
        phone: formData.phone,
        gstin: formData.gstin,
        currency: formData.currency,
        taxConfiguration: {
          cgstRate: Number(formData.cgstRate) || 2.5,
          sgstRate: Number(formData.sgstRate) || 2.5,
        },
        invoiceFooter: formData.invoiceFooter,
      }

      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        await fetchRestaurants()
        navigate('/restaurants')
      } else {
        setError(data.message || 'Failed to create restaurant outlet')
      }
    } catch (err) {
      console.error(err)
      setError('Network error creating restaurant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/restaurants"
          className="p-2.5 rounded-xl border border-[#E8E1D7] bg-white hover:bg-[#FAF8F5] text-[#2D372E] transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#758C76]" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#2D372E] tracking-tight">
            Register New Restaurant Outlet
          </h1>
          <p className="text-xs text-[#78857A] font-medium">
            Setup brand profile, tax rules, address, and invoice configurations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FBF1EF] border border-[#EED1CB] text-[#A04838] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E8E1D7] shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#758C76] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Outlet Information</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                Restaurant Brand Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Chai Point, D Pizza, Punjab Grill"
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                Cuisine / Specialty
              </label>
              <input
                type="text"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                placeholder="e.g. South Indian, Beverages & Snacks"
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                Physical Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Shop 12, Food Court, MG Road, Bengaluru"
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E1D7]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#758C76] mb-4 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            <span>Taxes & Compliance</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                placeholder="e.g. 24AAABC1234D1Z5"
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                CGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="cgstRate"
                value={formData.cgstRate}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
                SGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="sgstRate"
                value={formData.sgstRate}
                onChange={handleChange}
                className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E1D7]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#758C76] mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span>Invoice Branding</span>
          </h2>
          <div>
            <label className="block text-xs font-bold text-[#2D372E] mb-1.5">
              Receipt Footer Note
            </label>
            <input
              type="text"
              name="invoiceFooter"
              value={formData.invoiceFooter}
              onChange={handleChange}
              placeholder="e.g. Thank you for visiting! Scan QR code for 10% discount on next order."
              className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl px-4 py-2.5 text-xs font-medium text-[#2D372E] focus:outline-none focus:border-[#758C76] focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E1D7] flex items-center justify-end gap-3">
          <Link
            to="/restaurants"
            className="px-5 py-2.5 rounded-xl border border-[#E8E1D7] text-[#78857A] hover:bg-[#FAF8F5] text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Registering...' : 'Create Restaurant'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Restaurants
