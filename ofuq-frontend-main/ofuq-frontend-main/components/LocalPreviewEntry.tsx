'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isLocalPreview } from '@/lib/localPreview'

export default function LocalPreviewEntry() {
  const path = usePathname()
  const router = useRouter()
  useEffect(() => {
    if (!isLocalPreview || !['/auth','/login','/login_old','/register','/register_old'].includes(path)) return
    const params = new URLSearchParams(window.location.search)
    const next = params.get('redirect') || params.get('next') || '/user'
    router.replace(next.startsWith('/') && !next.startsWith('//') && !/^\/(auth|login|register)/.test(next) ? next : '/user')
  }, [path, router])
  return null
}
