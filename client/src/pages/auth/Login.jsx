import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Lock, Mail, ArrowRight, ShieldCheck, ChefHat } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setIsAuthenticated, setAdmin } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setIsAuthenticated(true)
        if (data.admin) setAdmin(data.admin)
        navigate('/')
      } else {
        setError(data.message || 'Invalid email or password')
      }
    } catch (err) {
      console.error(err)
      setError('Cannot connect to backend server. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E8E1D7] p-8 sm:p-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EEF4EE] text-[#758C76] border border-[#D3E5D4] mb-4">
          <ChefHat className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2D372E]">
            BILL<span className="text-[#758C76]">U</span>
          </h1>
          <span className="text-xs font-bold uppercase tracking-wider bg-[#EEF4EE] text-[#3E6842] px-2.5 py-0.5 rounded-full border border-[#D3E5D4]">
            Admin POS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#78857A] mt-2 font-medium">
          Multi-Restaurant Billing & Order Management
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-[#FBF1EF] border border-[#EED1CB] text-[#A04838] text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A04838] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#78857A] mb-1.5">
            Admin Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88938A]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2D372E] font-medium focus:outline-none focus:border-[#758C76] focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#78857A] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88938A]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#FAF8F5] border border-[#E8E1D7] rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#2D372E] font-medium focus:outline-none focus:border-[#758C76] focus:bg-white transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#758C76] hover:bg-[#627763] text-white font-bold py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#E8E1D7] flex items-center justify-center gap-2 text-xs text-[#78857A]">
        <ShieldCheck className="w-4 h-4 text-[#758C76]" />
        <span>Admin Protected Workspace • Billu</span>
      </div>
    </div>
  )
}

export default Login