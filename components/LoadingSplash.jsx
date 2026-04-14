'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function LoadingSplash() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldHide, setShouldHide] = useState(false)

  useEffect(() => {
    const handleLoad = () => {
      setIsLoaded(true)
      setTimeout(() => setShouldHide(true), 600)
    }

    if (document.readyState === 'complete') {
      setTimeout(handleLoad, 800)
    } else {
      window.addEventListener('load', handleLoad)
      const timeout = setTimeout(handleLoad, 5000)
      return () => {
        window.removeEventListener('load', handleLoad)
        clearTimeout(timeout)
      }
    }
  }, [])

  if (shouldHide) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        transition: 'opacity 0.5s ease-out',
        opacity: isLoaded ? 0 : 1,
        pointerEvents: isLoaded ? 'none' : 'auto',
      }}
    >
      <Image
        src="/images/logo.webp"
        alt="Klassrun"
        width={180}
        height={140}
        priority
        unoptimized
        className="max-w-[180px] w-auto h-auto animate-[splashPulse_1.8s_ease-in-out_infinite]"
      />
      <style>{`
        @keyframes splashPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}