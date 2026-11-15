import type { DriveBookingStatus, DriveRole } from "./types"

const transitions: Record<DriveBookingStatus, Partial<Record<Exclude<DriveRole, null>, DriveBookingStatus[]>>> = {
  pending: {
    client: ["cancelled"],
    admin: ["confirmed", "refused"],
  },
  confirmed: {
    client: ["cancelled"],
    admin: ["completed", "cancelled"],
  },
  refused: {},
  cancelled: {},
  completed: {},
}

export function canTransition(
  from: DriveBookingStatus,
  to: DriveBookingStatus,
  role: Exclude<DriveRole, null>,
): boolean {
  return transitions[from][role]?.includes(to) ?? false
}

export function nextStatuses(from: DriveBookingStatus, role: Exclude<DriveRole, null>): DriveBookingStatus[] {
  return transitions[from][role] ?? []
}
