import { demoMembers, type DemoMember, type MemberStatus } from './demo-data'

const firstNames = [
  'Aditya',
  'Aditi',
  'Akash',
  'Anika',
  'Arnav',
  'Diya',
  'Harsh',
  'Ira',
  'Karan',
  'Kavya',
  'Manav',
  'Mihika',
  'Neel',
  'Pooja',
  'Rahul',
  'Riya',
  'Sahil',
  'Sanya',
  'Ved',
  'Zoya',
]

const lastNames = [
  'Agarwal',
  'Chavan',
  'Gokhale',
  'Jain',
  'Kapoor',
  'Khatri',
  'Menon',
  'Mishra',
  'Naik',
  'Pillai',
  'Prasad',
  'Rane',
  'Saxena',
  'Shetty',
  'Singh',
  'Soni',
  'Thakur',
  'Trivedi',
  'Vyas',
  'Yadav',
]

const plans = ['BASIC-1M', 'PLUS-3M', 'PRO-6M', 'ELITE-12M'] as const

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function generatedMember(index: number): DemoMember {
  const sequence = index + 1
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length]
  const status: MemberStatus = sequence % 13 === 0 ? 'Paused' : 'Active'
  const codeNumber = 1100 + sequence

  return {
    code: `GST-${codeNumber}`,
    name: `${firstName} ${lastName}`,
    email: `demo.member${String(sequence).padStart(3, '0')}@example.com`,
    phone: `+91 91000 ${String(11000 + sequence).slice(-5)}`,
    joinedOn: addDays('2026-01-05', index * 2),
    planCode: plans[index % plans.length],
    membershipEnds: addDays('2026-10-02', 14 + ((index * 7) % 300)),
    status,
  }
}

export const additionalRegisteredDemoMembers: DemoMember[] = Array.from(
  { length: 100 },
  (_, index) => generatedMember(index),
)

export const registeredDemoMembers: DemoMember[] = [
  ...demoMembers,
  ...additionalRegisteredDemoMembers,
]

export const registeredDemoMemberMetrics = {
  total: registeredDemoMembers.length,
  active: registeredDemoMembers.filter((member) => member.status === 'Active').length,
  paused: registeredDemoMembers.filter((member) => member.status === 'Paused').length,
}
