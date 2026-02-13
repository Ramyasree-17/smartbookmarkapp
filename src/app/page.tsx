'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      router.push('/dashboard')
    }
  }

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <button
        onClick={signIn}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Login with Google
      </button>
    </div>
  )
}
