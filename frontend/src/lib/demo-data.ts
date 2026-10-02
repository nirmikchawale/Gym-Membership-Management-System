export type MemberStatus = 'Active' | 'Paused'
export type MembershipStatus = 'Active' | 'Expiring' | 'Scheduled'
export type AttendanceStatus = 'In gym' | 'Completed'
export type PaymentStatus = 'Paid' | 'Pending'

export type DemoMember = {
  code: string
  name: string
  email: string
  phone: string
  joinedOn: string
  planCode: string
  membershipEnds: string
  status: MemberStatus
}

export type DemoPlan = {
  code: string
  name: string
  duration: string
  price: number
  activeMembers: number
  availability: 'Active' | 'Archived'
  description: string
}

export type DemoMembership = {
  id: string
  memberCode: string
  memberName: string
  planCode: string
  planName: string
  startsOn: string
  endsOn: string
  status: MembershipStatus
  value: number
}

export type DemoAttendance = {
  id: string
  memberCode: string
  memberName: string
  date: string
  checkIn: string
  checkOut: string | null
  status: AttendanceStatus
}

export type DemoPayment = {
  receipt: string
  memberCode: string
  memberName: string
  date: string
  amount: number
  method: 'UPI' | 'Card' | 'Cash' | 'Bank transfer'
  status: PaymentStatus
}

export const demoMembers: DemoMember[] = [
  {
    code: 'GST-1001',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    phone: '+91 90000 10001',
    joinedOn: '2026-01-12',
    planCode: 'ELITE-12M',
    membershipEnds: '2027-01-11',
    status: 'Active',
  },
  {
    code: 'GST-1002',
    name: 'Isha Kulkarni',
    email: 'isha.kulkarni@example.com',
    phone: '+91 90000 10002',
    joinedOn: '2026-02-03',
    planCode: 'PRO-6M',
    membershipEnds: '2026-10-18',
    status: 'Active',
  },
  {
    code: 'GST-1003',
    name: 'Rohan Shah',
    email: 'rohan.shah@example.com',
    phone: '+91 90000 10003',
    joinedOn: '2026-03-21',
    planCode: 'PLUS-3M',
    membershipEnds: '2026-10-09',
    status: 'Active',
  },
  {
    code: 'GST-1004',
    name: 'Sneha Patil',
    email: 'sneha.patil@example.com',
    phone: '+91 90000 10004',
    joinedOn: '2026-04-10',
    planCode: 'ELITE-12M',
    membershipEnds: '2027-04-09',
    status: 'Active',
  },
  {
    code: 'GST-1005',
    name: 'Kabir Desai',
    email: 'kabir.desai@example.com',
    phone: '+91 90000 10005',
    joinedOn: '2026-05-14',
    planCode: 'PRO-6M',
    membershipEnds: '2026-11-10',
    status: 'Active',
  },
  {
    code: 'GST-1006',
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    phone: '+91 90000 10006',
    joinedOn: '2026-06-01',
    planCode: 'PLUS-3M',
    membershipEnds: '2026-10-05',
    status: 'Active',
  },
  {
    code: 'GST-1007',
    name: 'Vihaan Joshi',
    email: 'vihaan.joshi@example.com',
    phone: '+91 90000 10007',
    joinedOn: '2026-06-26',
    planCode: 'BASIC-1M',
    membershipEnds: '2026-10-22',
    status: 'Active',
  },
  {
    code: 'GST-1008',
    name: 'Meera Nair',
    email: 'meera.nair@example.com',
    phone: '+91 90000 10008',
    joinedOn: '2026-07-08',
    planCode: 'PRO-6M',
    membershipEnds: '2027-01-04',
    status: 'Active',
  },
  {
    code: 'GST-1009',
    name: 'Arjun Bhat',
    email: 'arjun.bhat@example.com',
    phone: '+91 90000 10009',
    joinedOn: '2026-07-19',
    planCode: 'PLUS-3M',
    membershipEnds: '2026-10-17',
    status: 'Paused',
  },
  {
    code: 'GST-1010',
    name: 'Nisha Verma',
    email: 'nisha.verma@example.com',
    phone: '+91 90000 10010',
    joinedOn: '2026-08-02',
    planCode: 'ELITE-12M',
    membershipEnds: '2027-08-01',
    status: 'Active',
  },
  {
    code: 'GST-1011',
    name: 'Dev Malhotra',
    email: 'dev.malhotra@example.com',
    phone: '+91 90000 10011',
    joinedOn: '2026-08-28',
    planCode: 'PRO-6M',
    membershipEnds: '2027-02-24',
    status: 'Active',
  },
  {
    code: 'GST-1012',
    name: 'Tara Iyer',
    email: 'tara.iyer@example.com',
    phone: '+91 90000 10012',
    joinedOn: '2026-09-16',
    planCode: 'PLUS-3M',
    membershipEnds: '2026-12-15',
    status: 'Active',
  },
]

export const demoPlans: DemoPlan[] = [
  {
    code: 'BASIC-1M',
    name: 'Starter',
    duration: '30 days',
    price: 1499,
    activeMembers: 1,
    availability: 'Active',
    description: 'A flexible one-month plan for members who want a low-commitment start.',
  },
  {
    code: 'PLUS-3M',
    name: 'Momentum',
    duration: '90 days',
    price: 3899,
    activeMembers: 4,
    availability: 'Active',
    description: 'Quarterly access with a better monthly rate for consistent training.',
  },
  {
    code: 'PRO-6M',
    name: 'Forge',
    duration: '180 days',
    price: 6999,
    activeMembers: 4,
    availability: 'Active',
    description: 'Six months of uninterrupted access for established routines.',
  },
  {
    code: 'ELITE-12M',
    name: 'Summit',
    duration: '365 days',
    price: 11999,
    activeMembers: 3,
    availability: 'Active',
    description: 'Annual access with the strongest long-term value for committed members.',
  },
]

export const demoMemberships: DemoMembership[] = [
  {
    id: 'MS-2401',
    memberCode: 'GST-1001',
    memberName: 'Aarav Mehta',
    planCode: 'ELITE-12M',
    planName: 'Summit',
    startsOn: '2026-01-12',
    endsOn: '2027-01-11',
    status: 'Active',
    value: 11999,
  },
  {
    id: 'MS-2402',
    memberCode: 'GST-1002',
    memberName: 'Isha Kulkarni',
    planCode: 'PRO-6M',
    planName: 'Forge',
    startsOn: '2026-04-22',
    endsOn: '2026-10-18',
    status: 'Expiring',
    value: 6999,
  },
  {
    id: 'MS-2403',
    memberCode: 'GST-1003',
    memberName: 'Rohan Shah',
    planCode: 'PLUS-3M',
    planName: 'Momentum',
    startsOn: '2026-07-12',
    endsOn: '2026-10-09',
    status: 'Expiring',
    value: 3899,
  },
  {
    id: 'MS-2404',
    memberCode: 'GST-1004',
    memberName: 'Sneha Patil',
    planCode: 'ELITE-12M',
    planName: 'Summit',
    startsOn: '2026-04-10',
    endsOn: '2027-04-09',
    status: 'Active',
    value: 11999,
  },
  {
    id: 'MS-2405',
    memberCode: 'GST-1005',
    memberName: 'Kabir Desai',
    planCode: 'PRO-6M',
    planName: 'Forge',
    startsOn: '2026-05-14',
    endsOn: '2026-11-10',
    status: 'Active',
    value: 6999,
  },
  {
    id: 'MS-2406',
    memberCode: 'GST-1006',
    memberName: 'Ananya Rao',
    planCode: 'PLUS-3M',
    planName: 'Momentum',
    startsOn: '2026-07-08',
    endsOn: '2026-10-05',
    status: 'Expiring',
    value: 3899,
  },
  {
    id: 'MS-2407',
    memberCode: 'GST-1007',
    memberName: 'Vihaan Joshi',
    planCode: 'BASIC-1M',
    planName: 'Starter',
    startsOn: '2026-09-23',
    endsOn: '2026-10-22',
    status: 'Active',
    value: 1499,
  },
  {
    id: 'MS-2408',
    memberCode: 'GST-1008',
    memberName: 'Meera Nair',
    planCode: 'PRO-6M',
    planName: 'Forge',
    startsOn: '2026-07-08',
    endsOn: '2027-01-04',
    status: 'Active',
    value: 6999,
  },
  {
    id: 'MS-2409',
    memberCode: 'GST-1009',
    memberName: 'Arjun Bhat',
    planCode: 'PLUS-3M',
    planName: 'Momentum',
    startsOn: '2026-07-20',
    endsOn: '2026-10-17',
    status: 'Active',
    value: 3899,
  },
  {
    id: 'MS-2410',
    memberCode: 'GST-1010',
    memberName: 'Nisha Verma',
    planCode: 'ELITE-12M',
    planName: 'Summit',
    startsOn: '2026-08-02',
    endsOn: '2027-08-01',
    status: 'Active',
    value: 11999,
  },
  {
    id: 'MS-2411',
    memberCode: 'GST-1011',
    memberName: 'Dev Malhotra',
    planCode: 'PRO-6M',
    planName: 'Forge',
    startsOn: '2026-08-28',
    endsOn: '2027-02-24',
    status: 'Active',
    value: 6999,
  },
  {
    id: 'MS-2412',
    memberCode: 'GST-1012',
    memberName: 'Tara Iyer',
    planCode: 'PLUS-3M',
    planName: 'Momentum',
    startsOn: '2026-09-16',
    endsOn: '2026-12-15',
    status: 'Active',
    value: 3899,
  },
  {
    id: 'MS-2413',
    memberCode: 'GST-1003',
    memberName: 'Rohan Shah',
    planCode: 'PLUS-3M',
    planName: 'Momentum',
    startsOn: '2026-10-10',
    endsOn: '2027-01-07',
    status: 'Scheduled',
    value: 3899,
  },
]

export const demoAttendance: DemoAttendance[] = [
  {
    id: 'AT-8801',
    memberCode: 'GST-1001',
    memberName: 'Aarav Mehta',
    date: '2026-10-02',
    checkIn: '06:42',
    checkOut: '07:58',
    status: 'Completed',
  },
  {
    id: 'AT-8802',
    memberCode: 'GST-1004',
    memberName: 'Sneha Patil',
    date: '2026-10-02',
    checkIn: '07:05',
    checkOut: '08:19',
    status: 'Completed',
  },
  {
    id: 'AT-8803',
    memberCode: 'GST-1008',
    memberName: 'Meera Nair',
    date: '2026-10-02',
    checkIn: '07:31',
    checkOut: '08:40',
    status: 'Completed',
  },
  {
    id: 'AT-8804',
    memberCode: 'GST-1002',
    memberName: 'Isha Kulkarni',
    date: '2026-10-02',
    checkIn: '08:12',
    checkOut: null,
    status: 'In gym',
  },
  {
    id: 'AT-8805',
    memberCode: 'GST-1005',
    memberName: 'Kabir Desai',
    date: '2026-10-02',
    checkIn: '08:27',
    checkOut: null,
    status: 'In gym',
  },
  {
    id: 'AT-8806',
    memberCode: 'GST-1011',
    memberName: 'Dev Malhotra',
    date: '2026-10-02',
    checkIn: '08:46',
    checkOut: '09:41',
    status: 'Completed',
  },
  {
    id: 'AT-8807',
    memberCode: 'GST-1003',
    memberName: 'Rohan Shah',
    date: '2026-10-02',
    checkIn: '09:18',
    checkOut: null,
    status: 'In gym',
  },
  {
    id: 'AT-8808',
    memberCode: 'GST-1012',
    memberName: 'Tara Iyer',
    date: '2026-10-02',
    checkIn: '09:54',
    checkOut: null,
    status: 'In gym',
  },
  {
    id: 'AT-8799',
    memberCode: 'GST-1006',
    memberName: 'Ananya Rao',
    date: '2026-10-01',
    checkIn: '18:04',
    checkOut: '19:12',
    status: 'Completed',
  },
  {
    id: 'AT-8798',
    memberCode: 'GST-1010',
    memberName: 'Nisha Verma',
    date: '2026-10-01',
    checkIn: '19:16',
    checkOut: '20:28',
    status: 'Completed',
  },
]

export const demoPayments: DemoPayment[] = [
  {
    receipt: 'RCPT-6108',
    memberCode: 'GST-1012',
    memberName: 'Tara Iyer',
    date: '2026-09-16',
    amount: 3899,
    method: 'UPI',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6107',
    memberCode: 'GST-1011',
    memberName: 'Dev Malhotra',
    date: '2026-08-28',
    amount: 6999,
    method: 'Card',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6106',
    memberCode: 'GST-1010',
    memberName: 'Nisha Verma',
    date: '2026-08-02',
    amount: 11999,
    method: 'Bank transfer',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6105',
    memberCode: 'GST-1009',
    memberName: 'Arjun Bhat',
    date: '2026-07-20',
    amount: 3899,
    method: 'UPI',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6104',
    memberCode: 'GST-1008',
    memberName: 'Meera Nair',
    date: '2026-07-08',
    amount: 6999,
    method: 'Card',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6103',
    memberCode: 'GST-1006',
    memberName: 'Ananya Rao',
    date: '2026-07-08',
    amount: 3899,
    method: 'UPI',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6102',
    memberCode: 'GST-1005',
    memberName: 'Kabir Desai',
    date: '2026-05-14',
    amount: 6999,
    method: 'Cash',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6101',
    memberCode: 'GST-1004',
    memberName: 'Sneha Patil',
    date: '2026-04-10',
    amount: 11999,
    method: 'Card',
    status: 'Paid',
  },
  {
    receipt: 'RCPT-6110',
    memberCode: 'GST-1003',
    memberName: 'Rohan Shah',
    date: '2026-10-01',
    amount: 3899,
    method: 'UPI',
    status: 'Pending',
  },
]

export const demoRevenueByMonth = [
  { month: 'May', amount: 16896 },
  { month: 'Jun', amount: 14794 },
  { month: 'Jul', amount: 25792 },
  { month: 'Aug', amount: 25997 },
  { month: 'Sep', amount: 18897 },
  { month: 'Oct', amount: 7798 },
]

export const demoDataset = {
  generatedFor: 'Gridstone public product preview',
  asOf: '2026-10-02',
  source: 'Synthetic demonstration records',
  note: 'No real member or payment credentials are included.',
}

export const demoMetrics = {
  members: demoMembers.length,
  activeMembers: demoMembers.filter((member) => member.status === 'Active').length,
  expiringMemberships: demoMemberships.filter((membership) => membership.status === 'Expiring')
    .length,
  visitsToday: demoAttendance.filter((visit) => visit.date === demoDataset.asOf).length,
  inGymNow: demoAttendance.filter(
    (visit) => visit.date === demoDataset.asOf && visit.status === 'In gym',
  ).length,
  collectedRevenue: demoPayments
    .filter((payment) => payment.status === 'Paid')
    .reduce((sum, payment) => sum + payment.amount, 0),
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00+05:30`))
}
