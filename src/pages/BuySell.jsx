import { useState, useEffect } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import {
  PlusCircle, Trash2, Phone, Tag, Search,
  ShoppingBag, Sofa, Shirt, Tv, Car, BookOpen,
  Utensils, Dumbbell, Baby, Home, HelpCircle,
  IndianRupee, MessageCircle
} from 'lucide-react'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'FURNITURE',   label: 'Furniture',    icon: Sofa,         color: '#d97706', bg: '#fffbeb' },
  { value: 'ELECTRONICS', label: 'Electronics',  icon: Tv,           color: '#0284c7', bg: '#f0f9ff' },
  { value: 'CLOTHING',    label: 'Clothing',     icon: Shirt,        color: '#db2777', bg: '#fdf2f8' },
  { value: 'VEHICLE',     label: 'Vehicle',      icon: Car,          color: '#475569', bg: '#f8fafc' },
  { value: 'BOOKS',       label: 'Books',        icon: BookOpen,     color: '#7c3aed', bg: '#f3f0ff' },
  { value: 'KITCHEN',     label: 'Kitchen',      icon: Utensils,     color: '#ea580c', bg: '#fff7ed' },
  { value: 'FITNESS',     label: 'Fitness',      icon: Dumbbell,     color: '#16a34a', bg: '#f0fdf4' },
  { value: 'KIDS',        label: 'Kids',         icon: Baby,         color: '#e11d48', bg: '#fff1f2' },
  { value: 'PROPERTY',    label: 'Property',     icon: Home,         color: '#059669', bg: '#ecfdf5' },
  { value: 'OTHER',       label: 'Other',        icon: HelpCircle,   color: '#8888aa', bg: '#f7f7fb' },
]

const getCat = v => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)    return 'just now'
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)    return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Listing Card ──────────────────────────────────────────
function ListingCard({ listing, user, onDelete, onContact }) {
  const cat     = getCat(listing.category)
  const Icon    = cat.icon
  const isAdmin = user?.role === 'admin'
  const isOwner = listing.flatNo === user?.flatNo

  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: cat.bg, color: cat.color }}>
            <Icon size={10} /> {cat.label}
          </span>
          {(isAdmin || isOwner) && (
            <button onClick={() => onDelete(listing)}
              className="w-6 h-6 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ color: 'var(--rose)', background: '#fff1f2' }}>
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <h3 className="text-[14px] font-bold mt-2 mb-1" style={{ color: 'var(--ink)' }}>{listing.title}</h3>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{listing.description}</p>

        {/* Price */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
            style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <IndianRupee size={13} style={{ color: '#059669' }} />
            <span className="text-[14px] font-bold" style={{ color: '#059669' }}>
              {listing.price === 0 ? 'Free' : listing.price.toLocaleString('en-IN')}
            </span>
            {listing.price > 0 && (
              <span className="text-[10px]" style={{ color: '#059669' }}>negotiable</span>
            )}
          </div>
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: cat.color }}>
            {listing.sellerName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>{listing.sellerName}</div>
            <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
              Flat {listing.flatNo}
              {listing.createdAt && <span> · {timeAgo(listing.createdAt)}</span>}
            </div>
          </div>
          {/* Contact button — only show to others, not the seller themselves */}
          {!isOwner && (
            <button
              onClick={() => onContact(listing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0 transition-all hover:scale-105"
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
              <MessageCircle size={12} /> Contact
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contact Modal ─────────────────────────────────────────
function ContactModal({ listing, open, onClose }) {
  if (!listing) return null
  return (
    <Modal open={open} onClose={onClose} title={`Contact Seller — Flat ${listing.flatNo}`}>
      <div className="space-y-3">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>Seller Details</div>
          <div className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{listing.sellerName}</div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Flat {listing.flatNo}</div>
          {listing.sellerPhone && (
            <div className="flex items-center gap-1.5 mt-1">
              <Phone size={12} style={{ color: 'var(--ink-4)' }} />
              <span className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{listing.sellerPhone}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl p-3" style={{ background: 'var(--indigo-lt)', border: '1px solid var(--indigo-md)' }}>
          <p className="text-[11px]" style={{ color: 'var(--indigo)' }}>
            <strong>Item:</strong> {listing.title}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--indigo)' }}>
            <strong>Price:</strong> ₹{listing.price === 0 ? 'Free' : listing.price.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          {listing.sellerPhone && (
            <>
              <button
                onClick={() => window.open(`tel:${listing.sellerPhone}`)}
                className="btn-ghost flex-1 justify-center">
                <Phone size={13} /> Call
              </button>
              <button
                onClick={() => window.open(`https://wa.me/91${listing.sellerPhone}`)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: '#25d366', color: 'white' }}>
                WhatsApp
              </button>
            </>
          )}
          {!listing.sellerPhone && (
            <p className="text-[12px] text-center w-full" style={{ color: 'var(--ink-3)' }}>
              Visit Flat {listing.flatNo} directly to inquire.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function BuySell() {
  const { user }  = useAuth()
  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [showAdd,  setShowAdd]  = useState(false)
  const [contact,  setContact]  = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})
  const [form,     setForm]     = useState({
    title: '', description: '', price: '', category: 'FURNITURE',
  })

  useEffect(() => { fetchListings() }, [])

  // Auto-fill seller info from logged-in user
  const sellerName  = user?.name  || ''
  const sellerPhone = user?.phone || ''
  const flatNo      = user?.flatNo || 'SUP'

  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/buy-sell')
      setListings(res.data)
    } catch { console.error('Failed to load listings') }
    finally { setLoading(false) }
  }

  const filtered = listings.filter(l => {
    const matchSearch = search === '' ||
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.sellerName?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || l.category === filter
    return matchSearch && matchFilter
  })

  const catCounts = CATEGORIES.map(c => ({
    ...c, count: listings.filter(l => l.category === c.value).length,
  })).filter(c => c.count > 0)

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title       = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = 'Enter a valid price (0 for free)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await api.post('/api/buy-sell', {
        ...form,
        price:       Number(form.price),
        flatNo,
        sellerName,
        sellerPhone,
      })
      setForm({ title: '', description: '', price: '', category: 'FURNITURE' })
      setShowAdd(false)
      await fetchListings()
    } catch { alert('Failed to post listing') }
    finally { setSaving(false) }
  }

  const handleDelete = async (listing) => {
    if (!confirm(`Remove listing "${listing.title}"?`)) return
    try {
      await api.delete(`/api/buy-sell/${listing.id}`)
      await fetchListings()
    } catch { alert('Failed to delete') }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Buy & Sell" subtitle="Community marketplace"
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <PlusCircle size={14} />
            <span className="hidden sm:inline"> Post Listing</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
          <input className="input pl-9 w-full"
            placeholder="Search listings..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category filter */}
        {catCounts.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setFilter('ALL')}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0"
              style={{
                background: filter === 'ALL' ? 'var(--indigo)' : 'white',
                color:      filter === 'ALL' ? 'white' : 'var(--ink-2)',
                border:     `1px solid ${filter === 'ALL' ? 'var(--indigo)' : 'var(--border)'}`,
              }}>
              All ({listings.length})
            </button>
            {catCounts.map(c => {
              const Icon = c.icon
              return (
                <button key={c.value}
                  onClick={() => setFilter(v => v === c.value ? 'ALL' : c.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex-shrink-0"
                  style={{
                    background: filter === c.value ? c.color : 'white',
                    color:      filter === c.value ? 'white' : 'var(--ink-2)',
                    border:     `1px solid ${filter === c.value ? c.color : 'var(--border)'}`,
                  }}>
                  <Icon size={11} />
                  {c.label} ({c.count})
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag size={36} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} strokeWidth={1} />
            <p className="text-[15px] font-bold" style={{ color: 'var(--ink-2)' }}>
              {listings.length === 0 ? 'No listings yet' : 'No listings match your search'}
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>
              {listings.length === 0 ? 'Be the first to post something for sale!' : 'Try a different search or category'}
            </p>
            {listings.length === 0 && (
              <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 mx-auto">
                <PlusCircle size={14} /> Post First Listing
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(listing => (
              <ListingCard key={listing.id} listing={listing} user={user}
                onDelete={handleDelete}
                onContact={l => setContact(l)} />
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* Contact Modal */}
      <ContactModal listing={contact} open={!!contact} onClose={() => setContact(null)} />

      {/* Add Listing Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Post a Listing" width="max-w-lg">
        <div className="space-y-4">

          {/* Seller info preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
              style={{ background: 'var(--indigo)' }}>
              {sellerName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>{sellerName}</div>
              <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                Flat {flatNo}
                {sellerPhone && ` · ${sellerPhone}`}
              </div>
            </div>
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--indigo-lt)', color: 'var(--indigo)' }}>
              Seller
            </span>
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--ink-2)' }}>Category</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                return (
                  <button key={c.value}
                    onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl text-[9px] font-semibold transition-all"
                    style={form.category === c.value
                      ? { background: c.color, color: 'white', border: `1px solid ${c.color}` }
                      : { background: 'var(--surface-3)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}>
                    <Icon size={14} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Item Title <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <input className="input" placeholder="e.g. Wooden dining table with 4 chairs"
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: undefined })) }} />
            {errors.title && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.title}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Description <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <textarea className="input resize-none h-20"
              placeholder="Condition, age, reason for selling..."
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: undefined })) }} />
            {errors.description && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.description}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
              Price (₹) <span style={{ color: 'var(--rose)' }}>*</span>
            </label>
            <div className="relative">
              <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-4)' }} />
              <input className="input pl-8" placeholder="0 for free item" type="number" min="0"
                value={form.price}
                onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setErrors(er => ({ ...er, price: undefined })) }} />
            </div>
            {errors.price && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--rose)' }}>{errors.price}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Posting...' : 'Post Listing'}
            </button>
            <button onClick={() => { setShowAdd(false); setErrors({}) }} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}