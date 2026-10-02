import { Activity, BadgeCheck, CalendarClock, DoorOpen, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardOverview as DashboardData } from '../lib/dashboard-api'
import { Badge } from './ui'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00+05:30`))
}

function weekday(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00+05:30`))
}

function barWidth(value: number, maximum: number) {
  if (value <= 0 || maximum <= 0) return '0%'
  return `${Math.max(7, Math.round((value / maximum) * 100))}%`
}

export function DashboardOverviewPanels({ data }: { data: DashboardData }) {
  const liveMemberships =
    data.memberships.active + data.memberships.scheduled + data.memberships.frozen
  const attendanceMaximum = Math.max(1, ...data.attendance_trend.map((day) => day.checkins))
  const planMaximum = Math.max(1, ...data.plan_distribution.map((plan) => plan.memberships))

  return (
    <>
      <section className="metric-strip" aria-label="Operational metrics">
        <article className="metric-card">
          <span className="metric-card__icon" aria-hidden="true">
            <UsersRound size={18} />
          </span>
          <div>
            <span>Active members</span>
            <strong>{data.members.active}</strong>
            <small>
              {data.members.inactive} inactive · {data.members.total} total
            </small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-card__icon" aria-hidden="true">
            <BadgeCheck size={18} />
          </span>
          <div>
            <span>Live memberships</span>
            <strong>{liveMemberships}</strong>
            <small>
              {data.memberships.active} active · {data.memberships.scheduled} scheduled ·{' '}
              {data.memberships.frozen} frozen
            </small>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-card__icon" aria-hidden="true">
            <DoorOpen size={18} />
          </span>
          <div>
            <span>Open visits</span>
            <strong>{data.attendance.open_visits}</strong>
            <small>
              {data.attendance.today_checkins} today · {data.attendance.period_checkins} in last{' '}
              {data.trend_days} days
            </small>
          </div>
        </article>
      </section>

      <section className="report-grid" aria-label="Membership and attendance reporting">
        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Membership lifecycle</p>
              <h2>Current state</h2>
            </div>
            <Badge tone="neutral">{data.memberships.total} records</Badge>
          </div>
          <div className="compact-list">
            <div className="compact-list__row">
              <span>
                <strong>Active</strong>
                <small>Access-valid memberships covering today</small>
              </span>
              <span>
                <strong>{data.memberships.active}</strong>
                <small>memberships</small>
              </span>
            </div>
            <div className="compact-list__row">
              <span>
                <strong>Scheduled</strong>
                <small>Starts in the future</small>
              </span>
              <span>
                <strong>{data.memberships.scheduled}</strong>
                <small>memberships</small>
              </span>
            </div>
            <div className="compact-list__row">
              <span>
                <strong>Frozen</strong>
                <small>Temporarily paused access</small>
              </span>
              <span>
                <strong>{data.memberships.frozen}</strong>
                <small>memberships</small>
              </span>
            </div>
            <div className="compact-list__row">
              <span>
                <strong>Expired / cancelled</strong>
                <small>Retained lifecycle history</small>
              </span>
              <span>
                <strong>{data.memberships.expired + data.memberships.cancelled}</strong>
                <small>
                  {data.memberships.expired} expired · {data.memberships.cancelled} cancelled
                </small>
              </span>
            </div>
            <div className="compact-list__row">
              <span>
                <strong>Renewals</strong>
                <small>Memberships with renewal lineage</small>
              </span>
              <span>
                <strong>{data.memberships.renewals}</strong>
                <small>renewal records</small>
              </span>
            </div>
          </div>
        </article>

        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Expiry queue</p>
              <h2>Action in the next {data.expiring_within_days} days</h2>
            </div>
            <Badge tone={data.expiring_soon.length ? 'warning' : 'success'}>
              {data.expiring_soon.length} due
            </Badge>
          </div>
          {data.expiring_soon.length ? (
            <div className="compact-list">
              {data.expiring_soon.map((membership) => (
                <div className="compact-list__row" key={membership.membership_id}>
                  <span>
                    <strong>{membership.member_name}</strong>
                    <small>
                      {membership.member_code} · {membership.plan_code}
                    </small>
                  </span>
                  <span>
                    <strong>{formatDate(membership.end_date)}</strong>
                    <small>
                      {membership.days_remaining === 0
                        ? 'Ends today'
                        : `${membership.days_remaining} days remaining`}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="data-empty">No active or frozen memberships expire in this window.</p>
          )}
        </article>

        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Attendance trend</p>
              <h2>Last {data.trend_days} days</h2>
            </div>
            <Badge tone="accent">
              <Activity size={13} aria-hidden="true" />
              {data.attendance.period_checkins} check-ins
            </Badge>
          </div>
          {data.attendance_trend.some((day) => day.checkins > 0) ? (
            <div className="bar-list">
              {data.attendance_trend.map((day) => (
                <div className="bar-row" key={day.date}>
                  <span title={formatDate(day.date)}>{weekday(day.date)}</span>
                  <span className="bar-track" aria-hidden="true">
                    <span style={{ width: barWidth(day.checkins, attendanceMaximum) }} />
                  </span>
                  <strong>{day.checkins} check-ins</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="data-empty">No check-ins were recorded in this reporting window.</p>
          )}
        </article>

        <article className="data-card">
          <div className="data-card__header">
            <div>
              <p className="card-eyebrow">Plan distribution</p>
              <h2>Live memberships by plan</h2>
            </div>
            <span className="insight-list__icon" aria-hidden="true">
              <CalendarClock size={18} />
            </span>
          </div>
          {data.plan_distribution.length ? (
            <div className="bar-list">
              {data.plan_distribution.map((plan) => (
                <div className="bar-row" key={plan.plan_id}>
                  <span title={plan.plan_name}>{plan.plan_code.slice(0, 5)}</span>
                  <span className="bar-track" aria-hidden="true">
                    <span style={{ width: barWidth(plan.memberships, planMaximum) }} />
                  </span>
                  <strong>{plan.memberships} live</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="data-empty">No live memberships are available for plan distribution.</p>
          )}
        </article>
      </section>

      <p className="data-empty">
        Metrics are derived from persisted member, membership and attendance records as of{' '}
        {formatDate(data.as_of)}. <Link to="/reports">Open reporting controls</Link>.
      </p>
    </>
  )
}
