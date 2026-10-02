import type { DashboardOverview } from './dashboard-api'
import { getInteractiveDemoDashboard } from './demo-runtime'

export function getPreviewDashboard(
  trendDays: 7 | 14 | 30 = 7,
  expiringDays: 30 | 60 | 90 = 30,
): DashboardOverview {
  return getInteractiveDemoDashboard(trendDays, expiringDays)
}
