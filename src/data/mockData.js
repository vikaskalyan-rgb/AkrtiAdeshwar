// Flat numbering: 4 floors, North Wing A-F, South Wing G,H,J,K (no I)
export const NORTH_WING = ['A', 'B', 'C', 'D', 'E', 'F']
export const SOUTH_WING = ['G', 'H', 'J', 'K']
export const FLOORS = [1, 2, 3, 4]
export const MONTHLY_MAINTENANCE = 4200

// Admin credentials
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  name: 'Ramesh Kumar',
  phone: '9840000000',
}

// ownerType: 'Owner-Occupied' | 'Rented' | 'Vacant'
// For Rented: residentName/phone = tenant, ownerName/ownerPhone = owner
// For Owner-Occupied: residentName/phone = owner (same as ownerName/ownerPhone)
// For Vacant: residentName/phone = null, ownerName/ownerPhone = owner who pays dues
function generateFlats() {
  const flats = []

  const data = [
    // Floor 1
    { flatNo:'1A', ownerType:'Owner-Occupied', ownerName:'Ramesh Kumar',        ownerPhone:'9840012345', residentName:'Ramesh Kumar',        residentPhone:'9840012345' },
    { flatNo:'1B', ownerType:'Rented',         ownerName:'Suresh Babu',         ownerPhone:'9840023456', residentName:'Priya Venkat',        residentPhone:'9840034567' },
    { flatNo:'1C', ownerType:'Rented',         ownerName:'Anand Krishnan',      ownerPhone:'9840045678', residentName:'Suresh Iyer',         residentPhone:'9840056789' },
    { flatNo:'1D', ownerType:'Owner-Occupied', ownerName:'Meena Sharma',        ownerPhone:'9840067890', residentName:'Meena Sharma',        residentPhone:'9840067890' },
    { flatNo:'1E', ownerType:'Owner-Occupied', ownerName:'Anil Reddy',          ownerPhone:'9840078901', residentName:'Anil Reddy',          residentPhone:'9840078901' },
    { flatNo:'1F', ownerType:'Rented',         ownerName:'Gopinath Warrier',    ownerPhone:'9840089012', residentName:'Kavitha Nair',        residentPhone:'9840090123' },
    { flatNo:'1G', ownerType:'Owner-Occupied', ownerName:'Vinod Pillai',        ownerPhone:'9840101234', residentName:'Vinod Pillai',        residentPhone:'9840101234' },
    { flatNo:'1H', ownerType:'Rented',         ownerName:'Sridhar Nair',        ownerPhone:'9840112345', residentName:'Sunita Rao',          residentPhone:'9840123456' },
    { flatNo:'1J', ownerType:'Owner-Occupied', ownerName:'Rajan Menon',         ownerPhone:'9840134567', residentName:'Rajan Menon',         residentPhone:'9840134567' },
    { flatNo:'1K', ownerType:'Owner-Occupied', ownerName:'Deepa Krishnan',      ownerPhone:'9840145678', residentName:'Deepa Krishnan',      residentPhone:'9840145678' },
    // Floor 2
    { flatNo:'2A', ownerType:'Owner-Occupied', ownerName:'Anand Bose',          ownerPhone:'9840156789', residentName:'Anand Bose',          residentPhone:'9840156789' },
    { flatNo:'2B', ownerType:'Rented',         ownerName:'Prakash Hegde',       ownerPhone:'9840167890', residentName:'Lakshmi Subramanian', residentPhone:'9840178901' },
    { flatNo:'2C', ownerType:'Owner-Occupied', ownerName:'Mohan Das',           ownerPhone:'9840189012', residentName:'Mohan Das',           residentPhone:'9840189012' },
    { flatNo:'2D', ownerType:'Owner-Occupied', ownerName:'Radha Gopal',         ownerPhone:'9840190123', residentName:'Radha Gopal',         residentPhone:'9840190123' },
    { flatNo:'2E', ownerType:'Vacant',         ownerName:'Sanjay Mehta',        ownerPhone:'9840201234', residentName:null,                  residentPhone:null },
    { flatNo:'2F', ownerType:'Rented',         ownerName:'Vijay Shetty',        ownerPhone:'9840212345', residentName:'Usha Patel',          residentPhone:'9840223456' },
    { flatNo:'2G', ownerType:'Rented',         ownerName:'Bhaskar Reddy',       ownerPhone:'9840234567', residentName:'Harish Babu',         residentPhone:'9840245678' },
    { flatNo:'2H', ownerType:'Owner-Occupied', ownerName:'Nirmala Joshi',       ownerPhone:'9840256789', residentName:'Nirmala Joshi',       residentPhone:'9840256789' },
    { flatNo:'2J', ownerType:'Rented',         ownerName:'Arjun Rao',           ownerPhone:'9840267890', residentName:'Prakash Hegde',       residentPhone:'9840278901' },
    { flatNo:'2K', ownerType:'Owner-Occupied', ownerName:'Saritha Nambiar',     ownerPhone:'9840289012', residentName:'Saritha Nambiar',     residentPhone:'9840289012' },
    // Floor 3
    { flatNo:'3A', ownerType:'Rented',         ownerName:'Dinesh Shetty',       ownerPhone:'9840290123', residentName:'Asha Thomas',         residentPhone:'9840301234' },
    { flatNo:'3B', ownerType:'Owner-Occupied', ownerName:'Rajan Menon',         ownerPhone:'9840312345', residentName:'Rajan Menon',         residentPhone:'9840312345' },
    { flatNo:'3C', ownerType:'Owner-Occupied', ownerName:'Kaveri Sharma',       ownerPhone:'9840323456', residentName:'Kaveri Sharma',       residentPhone:'9840323456' },
    { flatNo:'3D', ownerType:'Rented',         ownerName:'Murali Menon',        ownerPhone:'9840334567', residentName:'Parvathi Nambiar',    residentPhone:'9840345678' },
    { flatNo:'3E', ownerType:'Owner-Occupied', ownerName:'Ravi Pillai',         ownerPhone:'9840356789', residentName:'Ravi Pillai',         residentPhone:'9840356789' },
    { flatNo:'3F', ownerType:'Owner-Occupied', ownerName:'Sudha Bose',          ownerPhone:'9840367890', residentName:'Sudha Bose',          residentPhone:'9840367890' },
    { flatNo:'3G', ownerType:'Rented',         ownerName:'Venkat Iyer',         ownerPhone:'9840378901', residentName:'Chandrika Rao',       residentPhone:'9840389012' },
    { flatNo:'3H', ownerType:'Owner-Occupied', ownerName:'Smitha Reddy',        ownerPhone:'9840390123', residentName:'Smitha Reddy',        residentPhone:'9840390123' },
    { flatNo:'3J', ownerType:'Vacant',         ownerName:'Kishore Kumar',       ownerPhone:'9840401234', residentName:null,                  residentPhone:null },
    { flatNo:'3K', ownerType:'Rented',         ownerName:'Leela Menon',         ownerPhone:'9840412345', residentName:'Prakash Hegde',       residentPhone:'9840423456' },
    // Floor 4
    { flatNo:'4A', ownerType:'Owner-Occupied', ownerName:'Sanjay Mehta',        ownerPhone:'9840434567', residentName:'Sanjay Mehta',        residentPhone:'9840434567' },
    { flatNo:'4B', ownerType:'Rented',         ownerName:'Naresh Babu',         ownerPhone:'9840445678', residentName:'Geetha Krishnan',     residentPhone:'9840456789' },
    { flatNo:'4C', ownerType:'Owner-Occupied', ownerName:'Padma Iyer',          ownerPhone:'9840467890', residentName:'Padma Iyer',          residentPhone:'9840467890' },
    { flatNo:'4D', ownerType:'Owner-Occupied', ownerName:'Manjula Das',         ownerPhone:'9840478901', residentName:'Manjula Das',         residentPhone:'9840478901' },
    { flatNo:'4E', ownerType:'Rented',         ownerName:'Chandrika Rao',       ownerPhone:'9840489012', residentName:'Vijay Shetty',        residentPhone:'9840490123' },
    { flatNo:'4F', ownerType:'Rented',         ownerName:'Rekha Pillai',        ownerPhone:'9840501234', residentName:'Sunil Kumar',         residentPhone:'9840512345' },
    { flatNo:'4G', ownerType:'Owner-Occupied', ownerName:'Ravi Pillai',         ownerPhone:'9840523456', residentName:'Ravi Pillai',         residentPhone:'9840523456' },
    { flatNo:'4H', ownerType:'Rented',         ownerName:'Geetha Krishnan',     ownerPhone:'9840534567', residentName:'Sunita Rao',          residentPhone:'9840545678' },
    { flatNo:'4J', ownerType:'Rented',         ownerName:'Sridhar Nair',        ownerPhone:'9840556789', residentName:'Asha Thomas',         residentPhone:'9840567890' },
    { flatNo:'4K', ownerType:'Vacant',         ownerName:'Dinesh Shetty',       ownerPhone:'9840578901', residentName:null,                  residentPhone:null },
  ]

  data.forEach((d, idx) => {
    const floor = parseInt(d.flatNo[0])
    const unit  = d.flatNo.slice(1)
    const wing  = NORTH_WING.includes(unit) ? 'North' : 'South'
    flats.push({
      id: d.flatNo,
      flatNo: d.flatNo,
      floor,
      unit,
      wing,
      ownerType: d.ownerType,
      // Owner info — always present
      ownerName:  d.ownerName,
      ownerPhone: d.ownerPhone,
      ownerEmail: `${d.ownerName.toLowerCase().replace(/\s+/g,'.')}@gmail.com`,
      // Resident info — null if vacant
      residentName:  d.residentName,
      residentPhone: d.residentPhone,
      residentEmail: d.residentPhone ? `${d.residentName?.toLowerCase().replace(/\s+/g,'.')}@gmail.com` : null,
      // Legacy aliases for compatibility
      isVacant: d.ownerType === 'Vacant',
      phone: d.residentPhone || d.ownerPhone,
      parkingSlot: `P${idx + 1}`,
    })
  })

  // 3 ground floor units
  flats.push(
    { id:'GF1', flatNo:'GF1', floor:0, unit:'GF1', wing:'Ground', ownerType:'Society', ownerName:'Society', ownerPhone:null, residentName:'Society Office', residentPhone:'9840000001', isVacant:false, phone:'9840000001', parkingSlot:null },
    { id:'GF2', flatNo:'GF2', floor:0, unit:'GF2', wing:'Ground', ownerType:'Society', ownerName:'Society', ownerPhone:null, residentName:'Security Post',  residentPhone:'9840000002', isVacant:false, phone:'9840000002', parkingSlot:null },
    { id:'GF3', flatNo:'GF3', floor:0, unit:'GF3', wing:'Ground', ownerType:'Vacant',  ownerName:null,      ownerPhone:null, residentName:null,             residentPhone:null,         isVacant:true,  phone:null,         parkingSlot:null }
  )

  return flats
}

export const flats = generateFlats()

// All valid phone numbers for login (resident phones + owner phones)
export function getAllValidPhones() {
  const phones = new Set()
  flats.forEach(f => {
    if (f.floor === 0) return
    if (f.ownerPhone)    phones.add(f.ownerPhone)
    if (f.residentPhone) phones.add(f.residentPhone)
  })
  return phones
}

// Identify role and flat from phone
export function identifyByPhone(phone) {
  for (const flat of flats) {
    if (flat.floor === 0) continue
    // Resident (physically living)
    if (flat.residentPhone === phone) {
      return {
        role: flat.ownerType === 'Owner-Occupied' ? 'owner' : 'tenant',
        flatNo: flat.flatNo,
        name: flat.residentName,
        phone,
        isResident: true,
      }
    }
    // Owner of rented / vacant flat
    if (flat.ownerPhone === phone && flat.residentPhone !== phone) {
      return {
        role: 'owner',
        flatNo: flat.flatNo,
        name: flat.ownerName,
        phone,
        isResident: flat.ownerType === 'Vacant', // vacant owner is also "resident payer"
      }
    }
  }
  return null
}

// Payer for a flat — for maintenance dues
// Vacant → owner pays | Rented → tenant pays | Owner-Occupied → owner pays
export function getPayerForFlat(flat) {
  if (flat.ownerType === 'Rented') {
    return { name: flat.residentName, phone: flat.residentPhone, role: 'tenant' }
  }
  return { name: flat.ownerName, phone: flat.ownerPhone, role: 'owner' }
}

// Months
export const months = [
  { month:10, year:2024, label:'Oct 2024' },
  { month:11, year:2024, label:'Nov 2024' },
  { month:12, year:2024, label:'Dec 2024' },
  { month:1,  year:2025, label:'Jan 2025' },
  { month:2,  year:2025, label:'Feb 2025' },
  { month:3,  year:2025, label:'Mar 2025' },
]

function generatePayments() {
  const payments = []
  let pid = 1

  const unpaidPerMonth = {
    'Oct 2024': ['1C','2G','3B','4H'],
    'Nov 2024': ['2D','3K','1F','2J','4A'],
    'Dec 2024': ['1B','3G'],
    'Jan 2025': ['2C','4F','1G','3H','2B'],
    'Feb 2025': ['1D','3A','4J'],
    'Mar 2025': ['1C','2G','3B','4H','1F','2J','2E','3J'],
  }

  for (const m of months) {
    const billedFlats = flats.filter(f => f.floor > 0 && f.wing !== 'Ground')
    for (const flat of billedFlats) {
      const unpaid = unpaidPerMonth[m.label] || []
      const isUnpaid = unpaid.includes(flat.flatNo)
      const payer = getPayerForFlat(flat)

      payments.push({
        id: `PAY${pid++}`,
        flatNo: flat.flatNo,
        payerName:  payer.name,
        payerPhone: payer.phone,
        payerRole:  payer.role,
        ownerName:  flat.ownerName,
        ownerPhone: flat.ownerPhone,
        ownerType:  flat.ownerType,
        month:      m.month,
        year:       m.year,
        monthLabel: m.label,
        amount:     isUnpaid ? 0 : MONTHLY_MAINTENANCE,
        status:     isUnpaid ? 'unpaid' : 'paid',
        paidOn:     isUnpaid ? null : new Date(m.year, m.month-1, Math.floor(Math.random()*12)+1).toISOString().split('T')[0],
        paymentMode: isUnpaid ? null : ['UPI','Cash','Bank Transfer','Cheque'][pid % 4],
        markedByResident: !isUnpaid,
      })
    }
  }
  return payments
}

export const payments = generatePayments()

export const expenses = [
  { id:'EXP001', category:'Staffing',    description:'Security Staff Salaries',      amount:38000, date:'2025-03-01', month:3, year:2025, addedBy:'Admin' },
  { id:'EXP002', category:'Maintenance', description:'Cleaning & Housekeeping',      amount:14500, date:'2025-03-01', month:3, year:2025, addedBy:'Admin' },
  { id:'EXP003', category:'Utilities',   description:'Common Area Electricity',      amount:22400, date:'2025-03-05', month:3, year:2025, addedBy:'Admin' },
  { id:'EXP004', category:'Repairs',     description:'Lift Maintenance AMC',         amount:8200,  date:'2025-03-08', month:3, year:2025, addedBy:'Admin' },
  { id:'EXP005', category:'Upkeep',      description:'Garden & Landscaping',         amount:6100,  date:'2025-03-10', month:3, year:2025, addedBy:'Admin' },
  { id:'EXP006', category:'Repairs',     description:'Water Pump Repair',            amount:4500,  date:'2025-03-12', month:3, year:2025, addedBy:'Admin' },
  { id:'EXP007', category:'Staffing',    description:'Security Staff Salaries',      amount:38000, date:'2025-02-01', month:2, year:2025, addedBy:'Admin' },
  { id:'EXP008', category:'Maintenance', description:'Cleaning & Housekeeping',      amount:14500, date:'2025-02-01', month:2, year:2025, addedBy:'Admin' },
  { id:'EXP009', category:'Utilities',   description:'Common Area Electricity',      amount:19800, date:'2025-02-05', month:2, year:2025, addedBy:'Admin' },
  { id:'EXP010', category:'Upkeep',      description:'Painting - B-wing staircase', amount:12000, date:'2025-02-15', month:2, year:2025, addedBy:'Admin' },
]

export const complaints = [
  { id:'CMP001', flatNo:'2G', residentName:'Harish Babu',      category:'Plumbing',   title:'Water leakage in B-wing staircase',          description:'Constant dripping from pipe joint near 2nd floor landing.',  status:'open',        priority:'high',   createdAt:'2025-03-13', updatedAt:'2025-03-13' },
  { id:'CMP002', flatNo:'3B', residentName:'Rajan Menon',      category:'Electrical', title:'Lift not working since Monday',               description:'Lift stuck at floor 3, doors not opening properly.',           status:'in-progress', priority:'high',   createdAt:'2025-03-12', updatedAt:'2025-03-14' },
  { id:'CMP003', flatNo:'1A', residentName:'Ramesh Kumar',     category:'Security',   title:'Streetlight near main gate broken',           description:'The streetlight near gate entry has been off for 4 days.',    status:'open',        priority:'medium', createdAt:'2025-03-11', updatedAt:'2025-03-11' },
  { id:'CMP004', flatNo:'4H', residentName:'Sunita Rao',       category:'Sanitation', title:'Dustbin overflow near D-block entrance',      description:'Overflow happening daily, needs larger bin.',                 status:'resolved',    priority:'low',    createdAt:'2025-03-09', updatedAt:'2025-03-13' },
  { id:'CMP005', flatNo:'2D', residentName:'Radha Gopal',      category:'Plumbing',   title:'Low water pressure in flat',                  description:'Morning pressure very low, barely enough for shower.',        status:'open',        priority:'medium', createdAt:'2025-03-10', updatedAt:'2025-03-10' },
  { id:'CMP006', flatNo:'1F', residentName:'Kavitha Nair',     category:'Noise',      title:'Loud music from adjacent flat at night',      description:'Happening past midnight on weekends.',                        status:'resolved',    priority:'low',    createdAt:'2025-03-08', updatedAt:'2025-03-11' },
  { id:'CMP007', flatNo:'3K', residentName:'Prakash Hegde',    category:'Electrical', title:'Corridor light flickering on Floor 3',        description:'South wing floor 3 corridor has been flickering for a week.', status:'in-progress', priority:'medium', createdAt:'2025-03-07', updatedAt:'2025-03-13' },
  { id:'CMP008', flatNo:'4A', residentName:'Sanjay Mehta',     category:'Structural', title:'Crack in wall near staircase on 4th floor',  description:'Hairline crack appeared after last rain.',                    status:'open',        priority:'high',   createdAt:'2025-03-06', updatedAt:'2025-03-06' },
]

// audience: 'everyone' | 'owners' | 'residents'
export const announcements = [
  { id:'ANN001', type:'notice', audience:'everyone', title:'Water supply shutdown on 18 Mar, 10 AM–2 PM', body:'Due to CMWSSB pipeline maintenance, water supply will be disrupted on 18th March from 10 AM to 2 PM. Please store water in advance.', postedBy:'Admin', postedAt:'2025-03-14', isPinned:true },
  { id:'ANN002', type:'event',  audience:'residents', title:'Monthly Society Meeting — March 22, 6:30 PM', body:'Agenda: Review of maintenance dues, new gate camera installation, budget discussion for terrace waterproofing. All residents are requested to attend.', postedBy:'Admin', postedAt:'2025-03-12', isPinned:true },
  { id:'ANN003', type:'urgent', audience:'everyone', title:'Garbage collection timing changed to 7 AM', body:'BBMP has revised garbage collection to 7 AM daily starting March 15. Please ensure bins are placed outside before 7 AM.', postedBy:'Admin', postedAt:'2025-03-10', isPinned:false },
  { id:'ANN004', type:'notice', audience:'owners',   title:'AGM Notice — Annual General Meeting April 5', body:'The Annual General Meeting for all flat owners will be held on April 5 at 10 AM in the community hall. Audited accounts will be presented.', postedBy:'Admin', postedAt:'2025-03-08', isPinned:false },
  { id:'ANN005', type:'event',  audience:'everyone', title:'Ugadi Celebrations on March 30 — Community Hall', body:'The society is organizing a community Ugadi celebration. All residents and families are invited. Lunch will be served.', postedBy:'Admin', postedAt:'2025-03-05', isPinned:false },
]

export const visitors = [
  { id:'VIS001', name:'Ravi Kumar',      purpose:'Plumber',   flatNo:'3B', residentName:'Rajan Menon',  phone:'9876543210', inTime:'2025-03-15T10:30:00', outTime:null,                    vehicleNo:null,        status:'in'  },
  { id:'VIS002', name:'Swiggy Delivery', purpose:'Delivery',  flatNo:'2G', residentName:'Harish Babu',  phone:'9876500001', inTime:'2025-03-15T13:15:00', outTime:'2025-03-15T13:22:00',  vehicleNo:'TN09BZ123', status:'out' },
  { id:'VIS003', name:'Anita Mehta',     purpose:'Guest',     flatNo:'1G', residentName:'Vinod Pillai', phone:'9876512345', inTime:'2025-03-15T15:40:00', outTime:null,                    vehicleNo:'TN07AB456', status:'in'  },
  { id:'VIS004', name:'Electrician - Suresh', purpose:'Maintenance', flatNo:'4A', residentName:'Sanjay Mehta', phone:'9876523456', inTime:'2025-03-15T09:00:00', outTime:'2025-03-15T11:30:00', vehicleNo:null, status:'out' },
  { id:'VIS005', name:'Amazon Delivery', purpose:'Delivery',  flatNo:'1D', residentName:'Meena Sharma', phone:'9876534567', inTime:'2025-03-15T11:45:00', outTime:'2025-03-15T11:50:00',  vehicleNo:'TN10CD789', status:'out' },
]

export const societyFund = {
  openingBalance: 325000, totalCollectedThisYear: 847200, totalExpensesThisYear: 612400, currentBalance: 382000, lastUpdated: '2025-03-15',
}

export function getPaymentsForMonth(month, year) {
  return payments.filter(p => p.month === month && p.year === year)
}

export function getMonthSummary(month, year) {
  const mp = getPaymentsForMonth(month, year)
  const paid   = mp.filter(p => p.status === 'paid')
  const unpaid = mp.filter(p => p.status === 'unpaid')
  const collected = paid.reduce((s, p) => s + p.amount, 0)
  const pending   = unpaid.length * MONTHLY_MAINTENANCE
  return { paid: paid.length, unpaid: unpaid.length, partial: 0, collected, pending, total: mp.length }
}

// Announcement recipient helpers
export function getAnnouncementRecipients(audience) {
  const occupied = flats.filter(f => f.floor > 0 && f.wing !== 'Ground')
  if (audience === 'owners') {
    // All owner phones (unique)
    return [...new Set(occupied.map(f => f.ownerPhone).filter(Boolean))]
  }
  if (audience === 'residents') {
    // Physically living residents: tenant if rented, owner if owner-occupied, owner if vacant
    return occupied.map(f => {
      if (f.ownerType === 'Rented') return f.residentPhone
      return f.ownerPhone
    }).filter(Boolean)
  }
  // everyone = owners + residents (all unique phones)
  const phones = new Set()
  occupied.forEach(f => {
    if (f.ownerPhone)    phones.add(f.ownerPhone)
    if (f.residentPhone) phones.add(f.residentPhone)
  })
  return [...phones]
}
