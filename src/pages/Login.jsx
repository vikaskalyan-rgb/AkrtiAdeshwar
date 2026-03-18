import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/config'
import { Building2, KeyRound, ArrowRight, Eye, EyeOff, Mail } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()

  const [step, setStep]                 = useState('login')
  const [identifier, setIdentifier]     = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError]     = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Forgot password state
  const [fpIdentifier, setFpIdentifier] = useState('')
  const [fpEmail, setFpEmail]           = useState('')
  const [fpOtp, setFpOtp]               = useState('')
  const [fpNewPw, setFpNewPw]           = useState('')
  const [fpShowPw, setFpShowPw]         = useState(false)
  const [fpStep, setFpStep]             = useState('request')
  const [fpError, setFpError]           = useState('')
  const [fpLoading, setFpLoading]       = useState(false)
  const [fpSuccess, setFpSuccess]       = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    if (!identifier.trim() || !password.trim()) {
      setLoginError('Please enter your identifier and password')
      return
    }
    setLoginLoading(true)
    try {
      const res = await api.post('/api/auth/login', {
        identifier: identifier.trim(),
        password,
      })
      login({
        ...res.data,
        role: res.data.role?.toLowerCase(),
      })
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid identifier or password')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleForgotRequest = async (e) => {
    e.preventDefault()
    setFpError('')
    if (!fpIdentifier.trim() || !fpEmail.trim()) {
      setFpError('Please fill all fields')
      return
    }
    setFpLoading(true)
    try {
      await api.post('/api/auth/forgot-password', {
        identifier: fpIdentifier.trim(),
        email:      fpEmail.trim(),
      })
      setFpStep('otp')
    } catch (err) {
      setFpError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setFpLoading(false)
    }
  }

  const handleForgotReset = async (e) => {
    e.preventDefault()
    setFpError('')
    if (fpNewPw.length < 6) {
      setFpError('Password must be at least 6 characters')
      return
    }
    if (fpOtp.length !== 6) {
      setFpError('Please enter the 6-digit OTP')
      return
    }
    setFpLoading(true)
    try {
      await api.post('/api/auth/reset-password', {
        identifier:  fpIdentifier.trim(),
        email:       fpEmail.trim(),
        otp:         fpOtp.trim(),
        newPassword: fpNewPw,
      })
      setFpSuccess(true)
      setTimeout(() => {
        setStep('login')
        setFpStep('request')
        setFpIdentifier('')
        setFpEmail('')
        setFpOtp('')
        setFpNewPw('')
        setFpSuccess(false)
        setFpError('')
      }, 2000)
    } catch (err) {
      setFpError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--surface-2)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'var(--indigo)' }}>
            <Building2 size={30} className="text-white" />
          </div>
          <h1 className="text-[26px] font-bold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
            Akriti Adeshwar
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>
            Society Management Portal
          </p>
        </div>

        <div className="card p-6"
          style={{ boxShadow: '0 4px 20px rgba(26,26,46,0.08)' }}>

          {/* ── Main Login ── */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--indigo-lt)' }}>
                  <KeyRound size={22} style={{ color: 'var(--indigo)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
                  Welcome back
                </h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
                  Sign in to your society portal
                </p>
              </div>

              {/* Identifier */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>Login ID</label>
                <input className="input w-full"
                  placeholder="e.g. 2H, 4B_tenant, SUP"
                  value={identifier}
                  autoFocus
                  onChange={e => {
                    setIdentifier(e.target.value)
                    setLoginError('')
                  }} />
                <p className="text-[10px] mt-1.5" style={{ color: 'var(--ink-4)' }}>
                  Owners & admins: flat number (2H) · Tenants: flat_tenant (4B_tenant)
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>Password</label>
                <div className="relative">
                  <input
                    className="input w-full pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setLoginError('')
                    }} />
                  <button type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--ink-4)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-[12px] font-medium"
                  style={{ color: 'var(--rose)' }}>{loginError}</p>
              )}

              <button type="submit" disabled={loginLoading}
                className="btn-primary w-full justify-center mt-2">
                {loginLoading
                  ? 'Signing in...'
                  : <><span>Sign In</span><ArrowRight size={14} /></>
                }
              </button>

              <button type="button"
                onClick={() => { setStep('forgot'); setLoginError('') }}
                className="w-full text-center text-[12px] font-medium pt-1"
                style={{ color: 'var(--indigo)' }}>
                Forgot password?
              </button>
            </form>
          )}

          {/* ── Forgot Password — Step 1: Request OTP ── */}
          {step === 'forgot' && fpStep === 'request' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--indigo-lt)' }}>
                  <Mail size={22} style={{ color: 'var(--indigo)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
                  Reset Password
                </h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
                  Enter your login ID and registered email
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>Login ID</label>
                <input className="input w-full"
                  placeholder="e.g. 2H or 4B_tenant"
                  value={fpIdentifier}
                  autoFocus
                  onChange={e => { setFpIdentifier(e.target.value); setFpError('') }} />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>Registered Email</label>
                <input className="input w-full" type="email"
                  placeholder="your@email.com"
                  value={fpEmail}
                  onChange={e => { setFpEmail(e.target.value); setFpError('') }} />
              </div>

              {fpError && (
                <p className="text-[12px] font-medium"
                  style={{ color: 'var(--rose)' }}>{fpError}</p>
              )}

              <button type="submit" disabled={fpLoading}
                className="btn-primary w-full justify-center">
                {fpLoading
                  ? 'Sending OTP...'
                  : <><span>Send OTP to Email</span><ArrowRight size={14} /></>
                }
              </button>

              <button type="button"
                onClick={() => { setStep('login'); setFpError('') }}
                className="w-full text-center text-[12px] font-medium"
                style={{ color: 'var(--ink-3)' }}>
                ← Back to login
              </button>
            </form>
          )}

          {/* ── Forgot Password — Step 2: OTP + New Password ── */}
          {step === 'forgot' && fpStep === 'otp' && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#ecfdf5' }}>
                  <KeyRound size={22} style={{ color: 'var(--emerald)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
                  Set New Password
                </h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
                  OTP sent to {fpEmail}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>6-digit OTP</label>
                <input
                  className="input w-full text-center text-[22px] font-bold tracking-[0.4em]"
                  maxLength={6} placeholder="——————"
                  value={fpOtp}
                  autoFocus
                  onChange={e => {
                    setFpOtp(e.target.value.replace(/\D/g, ''))
                    setFpError('')
                  }} />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>New Password</label>
                <div className="relative">
                  <input className="input w-full pr-10"
                    type={fpShowPw ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={fpNewPw}
                    onChange={e => { setFpNewPw(e.target.value); setFpError('') }} />
                  <button type="button"
                    onClick={() => setFpShowPw(!fpShowPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--ink-4)' }}>
                    {fpShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {fpError && (
                <p className="text-[12px] font-medium"
                  style={{ color: 'var(--rose)' }}>{fpError}</p>
              )}

              {fpSuccess ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                  <span className="text-[13px] font-semibold"
                    style={{ color: 'var(--emerald)' }}>
                    Password reset successfully ✓
                  </span>
                </div>
              ) : (
                <button type="submit" disabled={fpLoading}
                  className="btn-primary w-full justify-center">
                  {fpLoading
                    ? 'Resetting...'
                    : <><span>Reset Password</span><ArrowRight size={14} /></>
                  }
                </button>
              )}

              <button type="button"
                onClick={() => { setFpStep('request'); setFpError('') }}
                className="w-full text-center text-[12px] font-medium"
                style={{ color: 'var(--ink-3)' }}>
                ← Change email
              </button>
            </form>
          )}
        </div>

        {/* Footer hint */}
        <div className="mt-4 space-y-1 text-center">
          <p className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
            Default password: your login ID followed by @123
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
            e.g. Login ID <span style={{ color:'var(--indigo)' }}>2H</span> → password <span style={{ color:'var(--indigo)' }}>2H@123</span>
          </p>
        </div>
      </div>
    </div>
  )
}