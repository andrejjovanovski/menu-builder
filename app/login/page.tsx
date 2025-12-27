'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth' // Import the hook
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UtensilsCrossed,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function LoginPage() {
  // UI ONLY STATE
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // HOOK LOGIC
  const { login, loading, errorMsg } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Call the logic from the hook
    await login(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 selection:bg-indigo-100">
      <div className="w-full max-w-[440px] space-y-8">

        {/* BRANDING SECTION */}
        <div className="flex flex-col items-center">
          <div className="bg-indigo-600 p-3 rounded-[20px] shadow-xl shadow-indigo-200 mb-4 animate-in fade-in zoom-in duration-500">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">Welcome Back</h1>
          <p className="text-slate-500 font-medium mt-1 text-center">Manage your restaurant menu with ease</p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            {/* EMAIL INPUT */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE (From hook) */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700 font-medium leading-tight">{errorMsg}</p>
              </div>
            )}

            {/* SUBMIT BUTTON (Loading state from hook) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER LINKS */}
        <p className="text-center text-slate-500 text-sm font-medium">
          Don't have an account? <a href="#" className="text-indigo-600 hover:text-indigo-700 font-bold decoration-2 underline-offset-4">Contact Sales</a>
        </p>
      </div>
    </div>
  )
}