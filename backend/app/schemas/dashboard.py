from datetime import date
from uuid import UUID

from pydantic import BaseModel


class DashboardMemberCounts(BaseModel):
    total: int
    active: int
    inactive: int


class DashboardMembershipCounts(BaseModel):
    total: int
    scheduled: int
    active: int
    frozen: int
    expired: int
    cancelled: int
    renewals: int


class DashboardAttendanceCounts(BaseModel):
    open_visits: int
    today_checkins: int
    last_7_days_checkins: int


class DashboardExpiringMembership(BaseModel):
    membership_id: UUID
    member_id: UUID
    member_code: str
    member_name: str
    plan_code: str
    plan_name: str
    end_date: date
    days_remaining: int


class DashboardAttendanceDay(BaseModel):
    date: date
    checkins: int


class DashboardPlanDistribution(BaseModel):
    plan_id: UUID
    plan_code: str
    plan_name: str
    memberships: int


class DashboardOverview(BaseModel):
    as_of: date
    members: DashboardMemberCounts
    memberships: DashboardMembershipCounts
    attendance: DashboardAttendanceCounts
    expiring_soon: list[DashboardExpiringMembership]
    attendance_trend: list[DashboardAttendanceDay]
    plan_distribution: list[DashboardPlanDistribution]
