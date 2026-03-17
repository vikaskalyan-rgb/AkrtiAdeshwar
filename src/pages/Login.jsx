import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/config'
import { Building2, Phone, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [tab, setTab] = useState('resident')

  // Admin state
  const [adminForm, setAdminForm] = useState({ username: '', password: '' })
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  // Resident state
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resolvedUser, setResolvedUser] = useState(null)

  // Admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setAdminError('')
    setAdminLoading(true)
    try {
      const res = await api.post('/api/auth/admin/login', adminForm)
      login({ ...res.data, role: 'admin' })
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setAdminLoading(false)
    }
  }

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setPhoneError('')
    if (!phone.match(/^[0-9]{10}$/)) {
      setPhoneError('Enter a valid 10-digit phone number')
      return
    }
    setOtpLoading(true)
    try {
      await api.post('/api/auth/send-otp', { phone })
      setStep('otp')
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Phone not registered')
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError('')
    setOtpLoading(true)
    try {
      const res = await api.post('/api/auth/verify-otp', { phone, otp })
      login({
        ...res.data,
        role: res.data.role?.toLowerCase(),
      })
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--surface-2)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--indigo)' }}>
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-[26px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>Akriti Adeshwar</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--ink-3)' }}>Society Management Portal</p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
          {[['resident', 'Resident / Owner'], ['admin', 'Admin']].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setStep('phone'); setPhoneError(''); setOtpError(''); setAdminError('') }}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{
                background: tab === key ? 'white' : 'transparent',
                color: tab === key ? 'var(--indigo)' : 'var(--ink-3)',
                boxShadow: tab === key ? '0 1px 4px rgba(26,26,46,0.08)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>

        <div className="card p-6" style={{ boxShadow: '0 4px 20px rgba(26,26,46,0.08)' }}>

          {tab === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--ink-3)' }}>Username</label>
                <input className="input w-full" placeholder="admin" value={adminForm.username}
                  onChange={e => { setAdminForm(f => ({...f, username: e.target.value})); setAdminError('') }} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--ink-3)' }}>Password</label>
                <input className="input w-full" type="password" placeholder="••••••••" value={adminForm.password}
                  onChange={e => { setAdminForm(f => ({...f, password: e.target.value})); setAdminError('') }} />
              </div>
              {adminError && <p className="text-[12px] font-medium" style={{ color: 'var(--rose)' }}>{adminError}</p>}
              <button type="submit" disabled={adminLoading} className="btn-primary w-full justify-center mt-2">
                <ShieldCheck size={15} />
                {adminLoading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </form>

          ) : step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--indigo-lt)' }}>
                  <Phone size={22} style={{ color: 'var(--indigo)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>Enter your phone number</h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>We'll send an OTP via WhatsApp</p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--ink-3)' }}>Mobile Number</label>
                <div className="flex gap-2">
                  <span className="input flex items-center px-3 font-medium text-[13px] flex-shrink-0 w-14 justify-center" style={{ color: 'var(--ink-2)' }}>+91</span>
                  <input className="input flex-1" type="tel" maxLength={10} placeholder="98XXXXXXXX" value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g,'')); setPhoneError('') }} />
                </div>
              </div>
              {phoneError && <p className="text-[12px] font-medium" style={{ color: 'var(--rose)' }}>{phoneError}</p>}
              <button type="submit" disabled={otpLoading} className="btn-primary w-full justify-center">
                {otpLoading ? 'Sending...' : <><span>Send OTP</span> <ArrowRight size={14} /></>}
              </button>
            </form>

          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--indigo-lt)' }}>
                  <KeyRound size={22} style={{ color: 'var(--indigo)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>Enter OTP</h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>Sent to WhatsApp +91 {phone}</p>
              </div>

              {resolvedUser && (
                <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: 'var(--indigo)' }}>
                    {resolvedUser.name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{resolvedUser.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>Flat {resolvedUser.flatNo}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--ink-3)' }}>OTP</label>
                <input className="input w-full text-center text-[20px] font-bold tracking-[0.5em]"
                  maxLength={6} placeholder="------" value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setOtpError('') }} />
              </div>
              {otpError && <p className="text-[12px] font-medium" style={{ color: 'var(--rose)' }}>{otpError}</p>}
              <button type="submit" disabled={otpLoading} className="btn-primary w-full justify-center">
                {otpLoading ? 'Verifying...' : <><span>Verify & Login</span> <ArrowRight size={14} /></>}
              </button>
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setOtpError('') }}
                className="w-full text-center text-[12px] font-medium" style={{ color: 'var(--ink-3)' }}>
                ← Change number
              </button>
            </form>
          )}
        </div>

        {/* Note about simulate mode */}
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--ink-4)' }}>
          OTP is sent via WhatsApp (simulate mode: check server logs)
        </p>
      </div>
    </div>
  )
}