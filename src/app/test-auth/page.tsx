'use client'

import { useState } from 'react'
import { auth, type RegisterData } from '@/lib/auth'

export default function TestAuthPage() {
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'buyer' as const,
    phone_number: '',
    country: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'register') {
        const registerData: RegisterData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          phone_number: formData.phone_number || undefined,
          country: formData.country || undefined,
        }

        await auth.signUp(registerData)
        setMessage('Registration successful! Please check your email for verification.')
      } else {
        await auth.signIn(formData.email, formData.password)
        setMessage('Login successful!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      setMessage('Signed out successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Testing</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('register')}
          className={`px-4 py-2 rounded ${
            mode === 'register'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Register
        </button>
        <button
          onClick={() => setMode('login')}
          className={`px-4 py-2 rounded ${
            mode === 'login'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Login
        </button>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded bg-red-500 text-white"
        >
          Sign Out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {mode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'buyer' | 'seller' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Country (Optional)</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Processing...' : mode === 'register' ? 'Register' : 'Login'}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
