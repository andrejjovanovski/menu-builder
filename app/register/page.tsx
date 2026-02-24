'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UtensilsCrossed,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { signUp, authActionLoading: loading, errorMsg } = useAuth()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return
    await signUp(email, password)
  }

  const passwordsMatch = confirmPassword === '' || password === confirmPassword
  const canSubmit = email.trim() && password.length >= 6 && passwordsMatch

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 selection:bg-indigo-100">
      <div className="w-full max-w-[440px] space-y-8">

        {/* BRANDING */}
        <div className="flex flex-col items-center">
          <div className="bg-indigo-600 p-3 rounded-[20px] shadow-xl shadow-indigo-200 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">Create account</h1>
          <p className="text-slate-500 font-medium mt-1 text-center">Register to add your restaurant and start building your menu</p>
        </div>

        {/* REGISTER CARD */}
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                Email address
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

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
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

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">
                Confirm password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  minLength={6}
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400 ${
                    confirmPassword && !passwordsMatch
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-indigo-600'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-rose-600 mt-1.5 ml-1">Passwords do not match</p>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700 font-medium leading-tight">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER */}
        <p className="text-center text-slate-500 text-sm font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
