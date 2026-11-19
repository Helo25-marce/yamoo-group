# YAMOO DRIVE — LOT 2.5

**Branche :** `feature/drive-foundations`  
**Commit de départ :** `c50a260`  
**Statut :** implémenté localement, non commité. Non poussé, non fusionné, non déployé.  
**Gate :** `npm run quality` — PASS, 40 passed, 8 skipped.  
**LOT 3 :** déjà présent dans l'arbre de travail, non étendu. **LOT 4 :** non commencé.

`/:lang/drive` est la page de recherche et de catalogue. Le wizard n'est plus l'écran d'entrée. Il reste sur `/:lang/drive/reservation` pour finaliser une demande.

## Parcours

1. Le lien DRIVE ouvre le catalogue. Les cinq véhicules sont visibles, sans hero et sans recherche préalable.
2. La barre de recherche reprend `DriveSearchForm`. Les champs suivent le service choisi.
3. Les catégories présentes au catalogue filtrent immédiatement.
4. Les filtres, le tri et la comparaison restent ceux du LOT 2. La colonne gauche les présente en lignes à compteur : catégorie, places, bagages, statut catalogue. Ces comptes viennent des cinq véhicules. Aucun filtre n'est ajouté pour la transmission, le carburant, l'assurance, le kilométrage, les avis ou l'annulation.
5. Sans trajet complet, la carte dit « Renseignez votre trajet pour connaître le prix ». Aucun montant n'est inventé.
6. « Choisir » avec un trajet valide ouvre le wizard à l'étape coordonnées. « Voir l'offre » ouvre la fiche. Aucune demande n'est créée depuis le catalogue.
7. `/:lang/drive/resultats` affiche la même interface. `/:lang/recherche` n'est pas modifiée.

## Limites

- Sans trajet, le tri par prix suit le tarif journalier du catalogue. Le montant n'est pas affiché.
- À l'ouverture, le véhicule indisponible est visible et son bouton est désactivé. Une recherche chiffrée le masque tant que le filtre n'est pas coché.
- Les photos restent des recadrages de démonstration. La mention est affichée une fois au-dessus de la liste. Chaque carte garde le statut catalogue.
- `pricing.ts`, `status.ts` et `store.ts` ne sont pas modifiés.

## Fichiers

Ajoutés : `src/drive/ui/DriveCatalog.tsx`, `src/pages/DriveReservationPage.tsx`, ce document.

Modifiés : `src/pages/DrivePage.tsx`, `src/pages/DriveResultsPage.tsx`, `src/pages/DriveVehiclePage.tsx`, `src/App.tsx`, `src/drive/search.ts`, `src/drive/search.check.mjs`, `src/drive/ui/DriveSearchForm.tsx`, `src/drive/VehicleCard.tsx`, `src/i18n/messages.ts`, `src/styles/global.css`, `e2e/drive.spec.ts`, `docs/quality/AUDIT.md`.
