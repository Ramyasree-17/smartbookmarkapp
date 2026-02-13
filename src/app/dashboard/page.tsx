'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type Bookmark = {
  id: string
  title: string
  url: string
}

export default function Dashboard() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  // ✅ Check user + Setup realtime
  useEffect(() => {
  checkUser()
  fetchBookmarks()

  const channel = supabase
    .channel('public:bookmarks')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookmarks',
      },
      () => {
        fetchBookmarks()
      }
    )
    .subscribe()

  // 🔥 This fixes inactive tab issue
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchBookmarks()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    supabase.removeChannel(channel)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [])



  // ✅ Check if logged in
  const checkUser = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/')
    }
  }

  // ✅ Fetch bookmarks
  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setBookmarks(data)
  }

  // ✅ Add bookmark
  const addBookmark = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!title || !url) return

    const { error } = await supabase.from('bookmarks').insert({
      title,
      url,
      user_id: user?.id,
    })

    if (!error) {
      fetchBookmarks() // immediate update in same tab
      setTitle('')
      setUrl('')
    } else {
      console.log('Insert error:', error)
    }
  }

  // ✅ Delete bookmark
  const deleteBookmark = async (id: string) => {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchBookmarks()
    } else {
      console.log('Delete error:', error)
    }
  }

  // ✅ Logout
  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Smart Bookmark App
        </h1>
        <button
          onClick={logout}
          className="text-red-500 font-medium"
        >
          Logout
        </button>
      </div>

      {/* Add Form */}
      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={addBookmark}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Bookmark
        </button>
      </div>

      {/* Empty State */}
      {bookmarks.length === 0 && (
        <p className="text-gray-500">
          No bookmarks yet.
        </p>
      )}

      {/* Bookmark List */}
      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="flex justify-between items-center border p-3 rounded"
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {bookmark.title}
            </a>

            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
