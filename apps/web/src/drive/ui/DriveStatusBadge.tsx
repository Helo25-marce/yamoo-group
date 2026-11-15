import { useTranslation } from "react-i18next"
import type { DriveBookingStatus } from "../types"

export function DriveStatusBadge({ status }: { status: DriveBookingStatus }) {
  const { t } = useTranslation()
  return <span className="drive-status">{t(`drive.status.${status}`)}</span>
}
