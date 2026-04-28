'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isValidLogin } from './credentials'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSignIn(e) {
    e.preventDefault()
    if (isValidLogin(email, password)) {
      router.push('/home')
    } else {
      setError('Email หรือ Password ไม่ถูกต้อง')
    }
  }

  return (
    <main className="w-full min-h-screen bg-[#89BFC4] flex justify-center">
    <div className="w-full max-w-md px-6 pb-8 flex flex-col">
      {/* Hero Image Area */}
      <div className="relative flex justify-center items-center mt-4 mb-6" style={{ height: 280 }}>
        <img
        src="/login.png"
        alt="Login Hero"
        className="w-auto h-full object-contain" />
      </div>

      {/* Title */}
      <h1 className="text-2xl font-extrabold text-black mb-1">Let's Match Up!</h1>
      <p className="text-sm text-black mb-6 leading-relaxed">
        Today is your game. Go find your match.<br/>Sign in to start playing.
      </p>

      <form onSubmit={handleSignIn}>
        {/* Email */}
        <label className="text-sm font-medium text-black mb-1 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Example@email.com"
          className="w-full bg-[#F3F2EB] border border-gray-950 px-4 py-3 text-sm text-black placeholder:text-gray-500 outline-none mb-4 focus:border-gray-500"
          required
        />

        {/* Password */}
        <label className="text-sm font-medium text-black mb-1 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full bg-[#F3F2EB] border border-gray-950 px-4 py-3 text-sm text-black placeholder:text-gray-500 outline-none mb-2 focus:border-gray-500"
          required
        />

        {/* Forgot Password */}
        <div className="flex justify-end mb-4">
          <a href="#" className="text-sm text-[#1E4AE9]">Forgot Password?</a>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 mb-3 text-center">{error}</p>
        )}

        {/* Sign In Button */}
        <button
          type="submit"
          className="w-full bg-[#162D3A] text-white py-4 font-light text-base mb-6 block text-center hover:opacity-90"
        >
          Sign in
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#CFDFE2]"/>
        <span className="text-sm text-[#294957]">Or sign in with</span>
        <div className="flex-1 h-px bg-[#CFDFE2]"/>
      </div>

      {/* Social Buttons */}

      {/* Google */}
      <div className="flex gap-3 mb-6 ">
        <button className="flex-1 flex items-center justify-center gap-2 bg-[#F3F2EB] py-3 text-sm font-medium text-[#294957] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        {/* Facebook */}
        <button className="flex-1 flex items-center justify-center gap-2 bg-[#F3F2EB] py-3 text-sm font-medium text-[#294957] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>
      </div>

      {/* Sign Up */}
      <p className="text-center text-sm text-[#294957]">
        Don't you have an account?{' '}
        <Link href="/signup" className="text-[#1E4AE9] font-medium">Sign up</Link>
      </p>
      </div>
    </main>
  )
}
