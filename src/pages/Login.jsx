import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/config'
import { Building2, Phone, KeyRound, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()

  const [step, setStep]               = useState('phone')
  const [phone, setPhone]             = useState('')
  const [otp, setOtp]                 = useState('')
  const [phoneError, setPhoneError]   = useState('')
  const [otpError, setOtpError]       = useState('')
  const [otpLoading, setOtpLoading]   = useState(false)

  const resetPhone = () => {
    setStep('phone')
    setPhone('')
    setOtp('')
    setPhoneError('')
    setOtpError('')
  }

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
      setPhoneError(err.response?.data?.message || 'Phone number not registered')
    } finally {
      setOtpLoading(false)
    }
  }

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

        <div className="card p-6" style={{ boxShadow: '0 4px 20px rgba(26,26,46,0.08)' }}>
          {step === 'phone' ? (

            /* ── Phone entry ── */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--indigo-lt)' }}>
                  <Phone size={22} style={{ color: 'var(--indigo)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
                  Welcome back
                </h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
                  Enter your registered mobile number
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>Mobile Number</label>
                <div className="flex gap-2">
                  <span className="input flex items-center px-3 font-medium text-[13px] flex-shrink-0 w-14 justify-center"
                    style={{ color: 'var(--ink-2)' }}>+91</span>
                  <input className="input flex-1" type="tel" maxLength={10}
                    placeholder="98XXXXXXXX" value={phone}
                    autoFocus
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g,''))
                      setPhoneError('')
                    }} />
                </div>
                {phoneError && (
                  <p className="text-[12px] font-medium mt-1.5"
                    style={{ color: 'var(--rose)' }}>{phoneError}</p>
                )}
              </div>

              <button type="submit" disabled={otpLoading}
                className="btn-primary w-full justify-center mt-2">
                {otpLoading
                  ? 'Sending OTP...'
                  : <><span>Send OTP via WhatsApp</span> <ArrowRight size={14} /></>
                }
              </button>

              <p className="text-center text-[11px] pt-1" style={{ color: 'var(--ink-4)' }}>
                Works for residents, owners and committee members
              </p>
            </form>

          ) : (

            /* ── OTP entry ── */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--indigo-lt)' }}>
                  <KeyRound size={22} style={{ color: 'var(--indigo)' }} />
                </div>
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
                  Enter OTP
                </h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--ink-3)' }}>
                  Sent to WhatsApp +91 {phone}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--ink-3)' }}>6-digit OTP</label>
                <input
                  className="input w-full text-center text-[26px] font-bold tracking-[0.5em]"
                  maxLength={6} placeholder="——————" value={otp}
                  autoFocus
                  onChange={e => {
                    setOtp(e.target.value.replace(/\D/g,''))
                    setOtpError('')
                  }} />
                {otpError && (
                  <p className="text-[12px] font-medium mt-1.5"
                    style={{ color: 'var(--rose)' }}>{otpError}</p>
                )}
              </div>

              <button type="submit" disabled={otpLoading}
                className="btn-primary w-full justify-center">
                {otpLoading
                  ? 'Verifying...'
                  : <><span>Verify & Login</span> <ArrowRight size={14} /></>
                }
              </button>

              <button type="button" onClick={resetPhone}
                className="w-full text-center text-[12px] font-medium pt-1"
                style={{ color: 'var(--ink-3)' }}>
                ← Change number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--ink-4)' }}>
          Akriti Adeshwar · Society Management Portal
        </p>
      </div>
    </div>
  )
}