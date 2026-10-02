import { describe, expect, it } from 'vitest'
import { demoMembers } from './demo-data'
import {
  additionalRegisteredDemoMembers,
  registeredDemoMemberMetrics,
  registeredDemoMembers,
} from './registered-demo-members'

describe('registered demo members', () => {
  it('adds exactly 100 synthetic entries to the original 12 records', () => {
    expect(demoMembers).toHaveLength(12)
    expect(additionalRegisteredDemoMembers).toHaveLength(100)
    expect(registeredDemoMembers).toHaveLength(112)
    expect(registeredDemoMemberMetrics.total).toBe(112)
  })

  it('keeps member codes, emails and phones unique', () => {
    expect(new Set(registeredDemoMembers.map((member) => member.code)).size).toBe(112)
    expect(new Set(registeredDemoMembers.map((member) => member.email)).size).toBe(112)
    expect(new Set(registeredDemoMembers.map((member) => member.phone)).size).toBe(112)
  })

  it('uses only synthetic example.com contact addresses', () => {
    expect(registeredDemoMembers.every((member) => member.email.endsWith('@example.com'))).toBe(true)
  })
})
