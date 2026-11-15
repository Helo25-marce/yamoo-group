# AUDIT qualité — YAMOO

**Dernière mise à jour :** 2026-11-15 (LOT 1 Drive — fondations)  
**Gate :** `npm run quality` — **PASS** (35 passed, 4 skipped volontaires)  
**Détail du lot :** `DRIVE-LOT1.md`  
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

### B. YAMOO DRIVE — LOT 1

| Élément | Statut |
|---|---|
| Tokens sémantiques `.ui-booking` (turquoise / nuit, doré non dominant) | Implémenté, captures inspectées |
| Wizard inchangé dans son ordre, ses prix et ses statuts | Testé (parcours + alerte + pricing) |
| Store `yamoo.drive.v1` déjà rempli | Testé (YD-KEEP + tarif 123456 conservés) |
| Mention « visuel de démonstration » sur les cartes | Visible sur `vehicles-*` |
| Admin et espace client | Non refondus (voulu) |
| Port API / Django | Documenté, non codé |

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
| Q-06 | Espace client | Thème nuit institutionnel, pas aligné sur le parcours clair | Basse (lot suivant) |
| Q-07 | Admin | Accent doré et densité laissés tels quels au LOT 1 | Basse |
| Q-08 | Captures | En-tête fixe parfois dupliqué sur screenshot pleine page | Outil, pas la page |

---

## 5. Non testé

- Remplacement photos par masters flotte officielle
- Filtres admin sur jeu rempli (confirm/refuse end-to-end admin↔client)
- WCAG / Lighthouse
- Viewports 375, 1024 et 1280 : débordement seulement (captures `landing-w*`), pas un parcours complet
- Contraste au-delà du bouton principal (pas d’audit WCAG complet)

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
| 2026-11-15 | **LOT 1** sur `feature/drive-foundations` : tokens, 4 composants UI, validation extraite, images démo. Gate **35 passed / 4 skipped**. Non déployé. |
