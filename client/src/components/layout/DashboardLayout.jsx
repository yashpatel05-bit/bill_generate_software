import Sidebar from './Sidebar'
import { Outlet, Link } from 'react-router-dom'
import { useRestaurant } from '../../context/RestaurantContext'
import { Plus, Receipt, ChevronDown, Store } from 'lucide-react'

const DashboardLayout = () => {
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurant()

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#2D372E]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E8E1D7] px-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 min-w-0">
            {activeRestaurant ? (
              <div className="flex items-center gap-3">
                {/* Brand Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs flex-shrink-0"
                  style={{
                    backgroundColor: activeRestaurant.primaryColor || '#758C76',
                  }}
                >
                  {activeRestaurant.name ? activeRestaurant.name[0] : 'R'}
                </div>

                {/* Dropdown to change active restaurant directly in the header */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="relative inline-flex items-center">
                      <select
                        id="header-restaurant-selector"
                        value={activeRestaurant._id}
                        onChange={(e) => {
                          const chosen = restaurants.find((r) => r._id === e.target.value)
                          if (chosen) setActiveRestaurant(chosen)
                        }}
                        className="appearance-none bg-transparent hover:bg-[#F2EDE5]/60 rounded-lg pr-6 pl-1 py-0.5 font-bold text-sm text-[#2D372E] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#758C76]"
                      >
                        {restaurants.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-[#88938A] absolute right-1 pointer-events-none" />
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeRestaurant.status === 'open'
                          ? 'bg-[#EEF4EE] text-[#3E6842] border border-[#D3E5D4]'
                          : 'bg-[#FBF1EF] text-[#A04838] border border-[#EED1CB]'
                      }`}
                    >
                      {activeRestaurant.status || 'open'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#78857A] pl-1 font-medium">
                    {activeRestaurant.cuisine || 'Restaurant Brand'} • {activeRestaurant.phone || 'Active Outlet'}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-sm font-semibold text-[#88938A]">No outlet selected</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/billing"
              className="hidden sm:inline-flex items-center gap-2 bg-[#758C76] hover:bg-[#627763] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Create Bill</span>
            </Link>
            <Link
              to="/restaurants/create"
              className="inline-flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE5] text-[#475448] border border-[#D5C7B8] text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Outlet</span>
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout