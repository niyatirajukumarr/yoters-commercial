'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Check authentication status and redirect accordingly
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Unauthenticated → show the landing page (with Log in / Sign up)
        router.push('/?splash=true')
      } else {
        // Authenticated → check if vendor or student
        const { data: cafeteria } = await supabase
          .from('cafeterias')
          .select('id')
          .eq('vendor_email', session.user.email)
          .single()

        if (cafeteria) {
          // Vendor → go to vendor dashboard
          router.push('/vendor')
        } else {
          // Student → go to landing page (with splash=true to skip redirect loop)
          router.push('/?splash=true')
        }
      }
    }, 3500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf8f5 0%, #fff5f0 50%, #fef1ec 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(232, 51, 74, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        top: '-100px',
        right: '-100px',
        animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(232, 51, 74, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        bottom: '-50px',
        left: '-50px',
        animation: 'float 8s ease-in-out infinite reverse',
      }} />

      {/* Logo container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
      }}>
        {/* Outer glow circle - WHITE - Dramatic */}
        <div style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-glow 2s ease-in-out infinite',
          filter: 'blur(40px)',
        }} />

        {/* Mid glow circle - WHITE */}
        <div style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.7) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-glow 2.3s ease-in-out infinite reverse',
          filter: 'blur(35px)',
        }} />

        {/* Inner glow circle - WHITE */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.85) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-inner 2.5s ease-in-out infinite',
          filter: 'blur(28px)',
        }} />

        {/* Logo Image - visible for 3 seconds */}
        <img
          src="/logo.png"
          alt="Yoters"
          style={{
            position: 'relative',
            zIndex: 5,
            width: '220px',
            height: '220px',
            objectFit: 'contain',
            animation: 'zoom-in 3s ease-out 0s, fade-out 0.5s ease-in 3s forwards',
            filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.7)) drop-shadow(0 0 100px rgba(255, 255, 255, 0.4))',
          }}
        />

        {/* YOTERS Text - appears at 3 seconds */}
        <div style={{
          position: 'absolute',
          zIndex: 5,
          fontSize: '72px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          whiteSpace: 'nowrap',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
          animation: 'fade-in-text 0.5s ease-out 3s forwards',
        }}>
          {'YOTERS'.split('').map((letter, index) => (
            <span
              key={`letter-${index}`}
              style={{
                display: 'inline-block',
                animation: `glitch-letter 0.6s ease-in-out ${index * 0.08}s infinite`,
                color: '#E8334A',
                textShadow: '0 0 10px rgba(232, 51, 74, 0.8)',
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: `${40 + i * 8}px`,
            height: `${40 + i * 8}px`,
            background: `radial-gradient(circle, rgba(255, 255, 255, ${0.15 - i * 0.01}) 0%, transparent 70%)`,
            borderRadius: '50%',
            left: `${20 + i * 10}%`,
            top: `${30 + i * 5}%`,
            animation: `float-particle ${3 + i * 0.5}s ease-in-out infinite`,
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Styles */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.2;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(1.3);
          }
        }

        @keyframes pulse-inner {
          0%, 100% {
            opacity: 0.1;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes zoom-in {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(30px);
          }
        }

        @keyframes float-particle {
          0% {
            opacity: 0;
            transform: translateY(100px) translateX(0px);
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) translateX(50px);
          }
        }

        @keyframes pulse-text {
          0%, 100% {
            opacity: 0;
            transform: translateY(20px);
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes glitch-letter {
          0%, 100% {
            color: #E8334A;
            text-shadow: 0 0 0 rgba(232, 51, 74, 0);
          }
          50% {
            color: #E8334A;
            text-shadow: 3px 0 0 #ff4d5e, -3px 0 0 #ff0000;
          }
        }

        @keyframes fade-out {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes fade-in-text {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
