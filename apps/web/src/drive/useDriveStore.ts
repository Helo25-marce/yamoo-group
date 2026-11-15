import { useEffect, useState, useSyncExternalStore } from "react"
import { getDriveState, subscribeDriveStore } from "./store"
import type { DriveStoreState } from "./types"

export function useDriveStore(): DriveStoreState {
  return useSyncExternalStore(subscribeDriveStore, getDriveState, getDriveState)
}

export function useDriveHydrated() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return ready
}
