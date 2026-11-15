# Contrôle qualité YAMOO

Protocole permanent. Sépare **YAMOO GROUP (institutionnel)** et **YAMOO DRIVE (métier)**.

## Commandes

Depuis `apps/web` (après `npm run build` si besoin) :

```bash
npm run typecheck
npm run build
npm run test:drive
npm run test:e2e
npm run quality          # typecheck + build + unit drive + e2e Playwright
```

Sous-ensembles :

```bash
npm run test:e2e:institutional
npm run test:e2e:drive
```

Prérequis navigateur Playwright (une fois) :

```bash
npx playwright install chromium
```

## Preuves

| Emplacement | Contenu |
|---|---|
| `docs/quality/AUDIT.md` | Rapport vivant (fonctionne / échoue / non testé) |
| `docs/quality/screenshots/institutional/` | Captures Accueil, À propos, Media, Travel |
| `docs/quality/screenshots/drive/` | Captures Drive, parcours, admin |
| `docs/quality/reports/` | JSON / HTML Playwright, dernier gate |

## Règles

1. Un build TypeScript réussi **ne prouve pas** qu’une page est belle.
2. Les captures doivent être **inspectées visuellement** (humain ou vision outil) ; sinon noter « validation visuelle à faire ».
3. Ne pas casser les parcours métier pour installer ces contrôles.
4. Après chaque fonctionnalité : actualiser `AUDIT.md`.

## Viewports e2e

- desktop-1440
- tablet-768
- mobile-390
