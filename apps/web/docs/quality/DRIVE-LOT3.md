# YAMOO DRIVE — LOT 3

**Branche :** `feature/drive-foundations`  
**Commit de départ :** `c50a260`  
**Statut :** implémenté localement, non commité. Non poussé, non fusionné, non déployé.  
**Gate :** `npm run quality` — PASS, 40 passed, 8 skipped. Le test de fiche est sauté sur le projet tablette 768 ; cette largeur est mesurée dans la boucle desktop (`sheet-w768.png`).  
**LOT 4 :** non commencé.

La route `/:lang/drive/vehicules/:vehicleId` présente un véhicule du catalogue. Elle ne crée pas de réservation et n'ajoute aucune caractéristique absente des données.

---

## 1. Ce qui fonctionne

- Ouverture depuis « Voir la fiche » sur les résultats et sur les cartes du wizard. L'adresse emporte les critères, les filtres et le tri.
- Fil d'Ariane Drive / Résultats / nom. Le retour conserve la recherche.
- Galerie : image principale, texte alternatif de démonstration, agrandissement, Échap, flèches. L'agrandissement est porté sur `document.body`, fond bleu nuit opaque, bouton Fermer en haut à droite. Les miniatures et les boutons précédent / suivant n'apparaissent que s'il y a plusieurs images. Aucun véhicule du catalogue n'en a plus d'une.
- Mention visible : ce n'est pas une photographie distincte de la flotte.
- Image absente ou illisible : un texte de remplacement, sans fausse photo.
- Fiche : nom, catégorie, places, bagages, état catalogue. Les champs prévus pour plus tard (transmission, carburant, climatisation, assurance, kilométrage, conditions) ne s'affichent que s'ils sont renseignés. Ils ne le sont pas.
- Récapitulatif calculé par `pricing.ts`. Un paramètre `price` est signalé et ignoré.
- Recherche incomplète ou invalide : invitation à compléter, pas de bouton Réserver.
- Véhicule indisponible : bouton désactivé. Véhicule inconnu : page dédiée, pas de réservation.
- Réserver ouvre le wizard existant. La demande n'est pas créée sur la fiche.
- FR / EN conserve l'adresse. `pricing.ts`, `status.ts` et `store.ts` ne sont pas modifiés.

## 2. Limites

- Les cinq visuels restent des recadrages de démonstration.
- Pas de miniatures en situation réelle, faute d'une seconde image.
- Pas de marque, de modèle, ni de conditions contractuelles.
- `available` reste l'état du catalogue, pas un créneau confirmé.
- Une capture pleine page peut replacer l'en-tête fixe au milieu de l'image. Les captures `sheet-desktop-viewport` et `sheet-gallery-viewport-*` montrent le viewport réel.

## 3. Fichiers

Ajoutés : `src/drive/gallery.ts`, `src/drive/gallery.check.mjs`, `src/drive/ui/VehicleGallery.tsx`, `src/pages/DriveVehiclePage.tsx`, ce document.

Modifiés : `src/App.tsx`, `src/drive/types.ts`, `src/drive/VehicleCard.tsx`, `src/drive/BookingWizard.tsx`, `src/pages/DriveResultsPage.tsx`, `src/i18n/messages.ts`, `src/styles/global.css`, `e2e/drive.spec.ts`, `package.json`, `docs/quality/AUDIT.md`.

Non touchés : photographies des fondateurs, `qa.zip`, pages institutionnelles, `pricing.ts`, `status.ts`, `store.ts`.
