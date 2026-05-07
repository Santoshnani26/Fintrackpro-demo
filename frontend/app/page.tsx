'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const token = Cookies.get('token')
    router.replace(token ? '/dashboard' : '/login')
  }, [router])
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center animate-pulse">
          <span className="text-brand-400 text-2xl">₹</span>
        </div>
        <p className="text-slate-500 text-sm">Loading FinTrack Pro…</p>
      </div>
    </div>
  )
}
