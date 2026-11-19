import { useTranslation } from "react-i18next"

/** Persistent demo notice. Not a production guarantee. */
export function DriveDemoBanner() {
  const { t } = useTranslation()
  return (
    <div className="drive-demo-banner">
      <p className="text-[0.75rem] font-semibold tracking-wide text-[var(--drive-warning)] uppercase">{t("drive.demoBadge")}</p>
      <p className="text-sm text-[var(--drive-text)]">{t("drive.demoPersist")}</p>
    </div>
  )
}
