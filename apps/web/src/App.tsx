import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router"
import { LangLayout } from "./components/layout/LangLayout"
import { ClientPreviewPage } from "./pages/ClientPreviewPage"
import { DriveAccountPage } from "./pages/DriveAccountPage"
import { DriveAdminPage } from "./pages/DriveAdminPage"
import { DriveLoginPage } from "./pages/DriveLoginPage"
import { DrivePage } from "./pages/DrivePage"
import { DriveReservationPage } from "./pages/DriveReservationPage"
import { DriveResultsPage } from "./pages/DriveResultsPage"
import { DriveCheckoutPage } from "./pages/DriveCheckoutPage"
import { DriveVehiclePage } from "./pages/DriveVehiclePage"
import { DrivePartnerPage } from "./pages/DrivePartnerPage"
import { AboutPage } from "./pages/AboutPage"
import { HomePage } from "./pages/HomePage"
import { InfoPage } from "./pages/InfoPage"
import { MediaPage } from "./pages/MediaPage"
import { SearchPage } from "./pages/SearchPage"
import { TravelPage } from "./pages/TravelPage"

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function routerBasename() {
  const base = import.meta.env.BASE_URL || "/"
  if (base === "/") return undefined
  return base.replace(/\/$/, "") || undefined
}

export function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/fr" replace />} />
        <Route path="/:lang" element={<LangLayout />}>
          <Route index element={<HomePage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="drive" element={<DrivePage />} />
          <Route path="drive/resultats" element={<DriveResultsPage />} />
          <Route path="drive/reservation" element={<DriveReservationPage />} />
          <Route path="drive/vehicules/:vehicleId" element={<DriveVehiclePage />} />
          <Route path="drive/entreprises/:partnerId" element={<DrivePartnerPage />} />
          <Route path="drive/commande" element={<DriveCheckoutPage />} />
          <Route path="drive/connexion" element={<DriveLoginPage />} />
          <Route path="drive/compte" element={<DriveAccountPage />} />
          <Route path="drive/admin" element={<DriveAdminPage />} />
          <Route path="travel" element={<TravelPage />} />
          <Route path="recherche" element={<SearchPage />} />
          <Route path="a-propos" element={<AboutPage />} />
          <Route path="informations" element={<InfoPage />} />
          <Route path="apercu-client" element={<ClientPreviewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/fr" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
