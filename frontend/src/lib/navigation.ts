import {
  Activity,
  BadgeCheck,
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ModuleDefinition = {
  label: string
  path: string
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  capabilities: string[]
}

export const moduleDefinitions: ModuleDefinition[] = [
  {
    label: 'Members',
    path: '/members',
    icon: Users,
    eyebrow: 'Member operations',
    title: 'Members',
    description:
      'A focused workspace for member records, contact details, membership context and lifecycle actions.',
    capabilities: ['Search and filtering', 'Member profiles', 'Create and edit', 'Active status controls'],
  },
  {
    label: 'Plans',
    path: '/plans',
    icon: ClipboardList,
    eyebrow: 'Commercial setup',
    title: 'Membership plans',
    description:
      'A clean catalogue for plan duration, pricing, availability and the rules staff rely on at the desk.',
    capabilities: ['Plan catalogue', 'Duration and pricing', 'Availability controls', 'Safe historical pricing'],
  },
  {
    label: 'Memberships',
    path: '/memberships',
    icon: BadgeCheck,
    eyebrow: 'Lifecycle control',
    title: 'Memberships & renewals',
    description:
      'The operational view of starts, expiries, renewals and the membership history attached to every member.',
    capabilities: ['Assign memberships', 'Expiry visibility', 'Renewal lineage', 'Lifecycle status'],
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: Activity,
    eyebrow: 'Front-desk flow',
    title: 'Attendance',
    description:
      'A fast check-in surface designed for repeat use, current occupancy awareness and searchable visit history.',
    capabilities: ['Check in', 'Check out', 'Open visits', 'Attendance history'],
  },
  {
    label: 'Payments',
    path: '/payments',
    icon: CreditCard,
    eyebrow: 'Transaction record',
    title: 'Payments',
    description:
      'A staff-safe ledger for payment metadata, status, method and references without storing payment secrets.',
    capabilities: ['Record payments', 'Method and status', 'Reference tracking', 'Payment history'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: BarChart3,
    eyebrow: 'Operational insight',
    title: 'Reports',
    description:
      'A future reporting surface for meaningful attendance, membership and revenue signals once workflows are live.',
    capabilities: ['Date filters', 'Membership trends', 'Attendance patterns', 'Revenue summaries'],
  },
]

export const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  ...moduleDefinitions.map(({ label, path, icon }) => ({ label, path, icon })),
]
