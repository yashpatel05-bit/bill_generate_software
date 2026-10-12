import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Store,
  Receipt,
  History,
  BarChart3,
  LogOut,
  ChefHat,
  Sparkles,
} from 'lucide-react'

const Sidebar = () => {
  const { logout, admin } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Restaurants', path: '/restaurants', icon: Store },
    { name: 'Bill Generator', path: '/billing', icon: Receipt },
    { name: 'Billing History', path: '/billing-history', icon: History },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'Premium Features', path: '/premium', icon: Sparkles, badge: 'PRO' },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#E8E1D7] flex flex-col justify-between sticky top-0 left-0 z-20 flex-shrink-0 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E8E1D7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#758C76] text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#2D372E]">
                  BILLU
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EEF4EE] text-[#3E6842] px-1.5 py-0.5 rounded border border-[#D3E5D4]">
                  POS
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#78857A]">Multi-Restaurant</p>
            </div>
          </div>
        </div>


        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                id={`nav-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#758C76] text-white shadow-xs font-semibold'
                      : 'text-[#475448] hover:text-[#2D372E] hover:bg-[#FAF8F5]'
                  }`
                }
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#3E6842] border border-[#D3E5D4] pointer-events-none">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* User / Footer & Logout */}
      <div className="p-4 border-t border-[#E8E1D7] bg-[#FAF8F5]/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#E4ECE4] text-[#3E6842] font-bold text-xs flex items-center justify-center flex-shrink-0">
              {admin?.name ? admin.name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#2D372E] truncate">
                {admin?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-[#88938A] truncate">
                {admin?.email || 'admin@billor.com'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#E8E1D7] bg-white hover:bg-[#FBF1EF] hover:text-[#A04838] hover:border-[#EED1CB] text-[#475448] text-xs font-semibold transition shadow-xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar