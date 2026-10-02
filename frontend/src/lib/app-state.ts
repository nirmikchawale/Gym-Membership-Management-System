import type { HealthResponse } from './api'

export type HealthState =
  { kind: 'loading' } | { kind: 'loaded'; data: HealthResponse } | { kind: 'error' }
