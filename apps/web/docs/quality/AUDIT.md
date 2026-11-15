# AUDIT qualité — YAMOO

**Dernière mise à jour :** 2026-11-15 (itération Drive — feu vert structure)  
**Gate :** `npm run quality` — **PASS** (33/33 e2e)  
**Règle :** un typecheck/build OK ne prouve pas qu’une page est belle.

---

## 1. Synthèse

| Domaine | Statut |
|---|---|
| TypeScript / build | PASS |
| Pricing Drive | PASS |
| E2E institutionnel + Drive + i18n | PASS |
| Captures auto (incl. `vehicles-*`) | Générées |
| Inspection visuelle outil (session) | vehicles desktop + admin desktop **faites** |

---

## 2. Séparation des contrôles

### A. YAMOO GROUP — institutionnel

Inchangé fonctionnellement. Tokens CSS `.ui-institutional` sur le layout.

### B. YAMOO DRIVE — métier (cette itération)

| Élément | Statut |
|---|---|
| Photos catalogue distinctes (`/visuals/drive/vehicles/*`) | OK automatisé + inspecté |
| Barre recherche style booking (query / passagers / tri) | OK |
| Admin sidebar + table densifiée + panneau détail | OK inspecté |
| Tokens `.ui-booking` / `.ui-admin` | OK |
| Parcours métier (prix, statuts, localStorage) | Non cassé — e2e PASS |

---

## 3. Ce qui fonctionne réellement

- Catalogue : **≥ 2 `src` images distincts** assertés en e2e ; 4 véhicules dispo + 1 indispo.
- Étape véhicule : barre d’affinage + pastilles catégorie + case indisponibles.
- Admin : sidebar sombre (Réservations / Véhicules / Réserver / Déconnexion), tableau + détail.
- Store : merge catalogue → rafraîchit `imageSrc` / cadrage tout en gardant dispo & tarifs locaux.
- Gate : typecheck, build, pricing, Playwright.

---

## 4. Ce qui échoue / anomalies ouvertes

| ID | Domaine | Description | Sévérité |
|---|---|---|---|
| Q-02 | Drive photos | Les 5 JPG sont des **recadrages / grades** de `drive.jpg`, pas une flotte HQ réelle | Moyenne |
| Q-03 | Drive admin | Auth navigateur uniquement — pas une sécurité prod | Haute (prod) |
| Q-05 | Build | Bundle JS > 500 kB | Basse |
| Q-01 | Accueil | Vidéo FounderFilm parfois en fallback headless | Moyenne |

---

## 5. Non testé

- Remplacement photos par masters flotte officielle
- Filtres admin sur jeu rempli (confirm/refuse end-to-end admin↔client)
- WCAG / Lighthouse
- Viewports hors 390 / 768 / 1440

---

## 6. Fichiers modifiés (itération Drive)

- `src/drive/catalog.ts`
- `src/drive/store.ts` (merge médias)
- `src/drive/BookingWizard.tsx`
- `src/pages/DrivePage.tsx`, `DriveAdminPage.tsx`
- `src/styles/global.css` (tokens + search bar + admin sidebar)
- `src/i18n/messages.ts` FR/EN
- `src/components/layout/LangLayout.tsx`
- `e2e/drive.spec.ts`
- `public/visuals/drive/vehicles/*.jpg` (5 fichiers)

---

## 7. Captures

- `screenshots/drive/vehicles-{desktop-1440,tablet-768,mobile-390}.png`
- `screenshots/drive/admin-*.png` (sidebar visible desktop)
- Autres : landing / booking-contact / booking-done / institutional/*

---

## 8. Journal

| Date | Action |
|---|---|
| 2026-11-15 | Protocole qualité + gate PASS initial |
| 2026-11-15 | **Feu vert Drive** : photos distinctes, search bar, admin sidebar, tokens UI ; gate **33/33 PASS** ; inspection visuelle vehicles + admin |
