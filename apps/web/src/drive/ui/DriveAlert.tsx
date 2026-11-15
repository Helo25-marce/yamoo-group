export function DriveAlert({ children }: { children: string }) {
  if (!children) return null
  return (
    <p role="alert" className="drive-alert">
      {children}
    </p>
  )
}
