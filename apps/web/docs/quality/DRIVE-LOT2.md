# YAMOO DRIVE — LOT 2

**Branche :** `feature/drive-foundations`  
**Commit de départ :** `caf6289` (LOT 1, non poussé)  
**Statut :** commit local de clôture. Non poussé, non fusionné, non déployé.  
**LOT 3 :** implémenté localement, non commité. Voir `DRIVE-LOT3.md`.

La page `/:lang/drive/resultats` cherche, filtre, trie et compare les cinq véhicules du catalogue. Elle transmet une sélection au wizard existant. Elle ne crée pas de réservation et ne confirme pas une disponibilité à une date.

---

## 1. Ce qui fonctionne

- Recherche des trois services déjà actifs : journée, trajet immédiat, trajet programmé. Les champs exigés suivent `services.ts`. Aucun autre service n'est proposé.
- Validation avant affichage des véhicules : service inconnu, date illisible, fin avant début, lieu manquant, passagers hors 1–8. Le formulaire garde la saisie ; une date illisible n'est pas réécrite.
- URL canonique : `service`, `start`, `end` (journée seulement), `pickup`, `dropoff`, `passengers`, `luggage`, `category`, `q`, `sort`, `unavailable`, `compare`. Pas de coordonnées, pas de paiement. Un paramètre `price` est signalé puis ignoré.
- Page de résultats : résumé, formulaire de modification, compteur, filtres, tri, cartes, état vide, mention de démonstration, comparaison, bouton Réserver.
- Filtres combinables sur les données réelles : catégorie, places (passagers), bagages, texte, drapeau `available` du catalogue. Pastille retirable, réinitialisation, compteur à jour, filtres dans l'URL.
- Tri : prix croissant, prix décroissant, capacité en places. Le prix est celui du service. Égalité départagée par identifiant de véhicule. Pas de tri « recommandé ».
- Comparaison de deux ou trois véhicules sur nom, catégorie, places, bagages, prix du service, état catalogue et mention démo. Retrait et remise à zéro. À 375 et 390 px, le tableau défile dans son cadre ; la page ne s'élargit pas et chaque bouton Retirer peut être amené dans la zone visible.
- Réserver ouvre `/drive` avec le véhicule et les critères. Avant l'étape coordonnées : URL, service, dates, lieux, passagers, bagages, capacité, état catalogue, puis tarif recalculé par `pricing.ts`. Un échec renvoie à l'étape concernée. Une valeur illisible (`abc`, bagages `xx`, date `nope`) reste affichée ou vide, avec une erreur, et le bouton suivant ne change pas d'étape. Aucune valeur de remplacement n'est acceptée. `/drive` sans paramètres garde l'ancien wizard, avec 2 passagers et 0 bagage par défaut.
- FR et EN. Le changement de langue conserve la query. `basename` GitHub Pages inchangé.
- `pricing.ts`, `status.ts` et `store.ts` ne sont pas modifiés. Les critères ne sont pas écrits dans `yamoo.drive.v1`.

## 2. Preuves

Gate `npm run quality` revérifié à la clôture, le 15 novembre 2026 : typecheck, build, `test:drive`, Playwright. **38 passed, 7 skipped.**

`test:drive` : `drive pricing + status checks OK` et `drive search checks OK`. Le contrôle de recherche vérifie le départage par identifiant, l'exclusion d'un véhicule indisponible, 3 jours × 85 000 = 255 000 FCFA, le trajet à 25 000 FCFA, le refus de `service=yacht`, l'ignorance de `price=1`, le wizard sans paramètres, le refus d'un véhicule indisponible, et le maintien des valeurs `abc`, `xx` et d'une date illisible hors de l'étape coordonnées.

Playwright Drive résultats, desktop 1440 et mobile 390 :

- URL invalides et route institutionnelle `/fr/recherche` sans titre « Résultats ».
- `passengers=abc` avec un véhicule dans l'adresse : le champ garde `abc`, l'alerte passagers reste affichée, et le bouton suivant ne quitte pas l'étape trajet.
- Quatre véhicules, Berline en tête à 255 000 FCFA, filtre SUV, actualisation, retour arrière du tri, texte « van », réinitialisation, zéro résultat à 8 passagers, SUV Affaires non réservable, comparaison 2 puis 3, retrait, remise à zéro.
- `price=1` laisse 255 000 FCFA. Réserver arrive sur les coordonnées avec `vehicle=veh-berline-1` et sans `price=`.
- Changement FR vers EN par le sélecteur de langue : la query, dont `category=suv` et `passengers=1`, est conservée. Un lien anglais direct affiche « Results ».
- Largeurs 375, 768, 1024 et 1280 : pas de débordement horizontal du document. À 375, le comparateur défile dans `.drive-compare-scroll`.

Les 7 skips sont des répétitions, pas des tests absents :

| Test ignoré | Où il s'exécute |
|---|---|
| Store `YD-KEEP` sur tablette et mobile | desktop-1440 |
| Focus, contraste et routes EN sur tablette et mobile | desktop-1440 |
| URL invalides sur tablette et mobile | desktop-1440 |
| Script complet des résultats sur tablette | desktop-1440 et mobile-390. La largeur 768 est mesurée dans la session desktop (`results-w768.png`) |

Les tests wizard, admin, YD-KEEP, institutionnel et i18n de la même gate sont passés.

## 3. Captures

Dossier `apps/web/docs/quality/screenshots/drive/` (gitignoré) :

| Fichier | Ce qu'elle montre |
|---|---|
| `search-desktop.png` | Formulaire vide, message si la recherche est incomplète |
| `results-desktop-1440.png` | Colonne de filtres, 4 cartes, prix journée |
| `results-mobile-390.png` | Cartes verticales, bouton Filtres |
| `filters-open-mobile.png` | Panneau de filtres ouvert |
| `filters-desktop.png` | Filtres desktop |
| `filters-combined-*.png` | Filtre texte combiné |
| `results-empty-*.png` | Aucun véhicule |
| `results-unavailable-*.png` | SUV Affaires, bouton désactivé |
| `compare-*.png` | Tableau de comparaison |
| `wizard-from-results-*.png` | Étape coordonnées préremplie, 255 000 FCFA |
| `results-w375.png`, `results-w768.png`, `results-w1024.png`, `results-w1280.png` | Largeurs intermédiaires |

L'en-tête fixe peut apparaître deux fois sur une capture pleine page du wizard (`wizard-from-results-desktop-1440.png`). Le DOM n'a qu'un en-tête. C'est l'anomalie d'outil déjà notée Q-08.

## 4. Limites

- `available: true` est l'état du catalogue, pas une disponibilité confirmée pour les dates.
- Pas d'autocomplétion géographique : aucun référentiel de lieux.
- Pas de transmission, carburant, climatisation, assurance, avis ni promotion.
- Les cinq photographies restent des recadrages de démonstration.
- Une date impossible à lire ne peut pas rester dans un champ date : le champ reste vide, l'erreur s'affiche, et l'étape suivante reste bloquée.
- La page de résultats ne crée pas de demande. Le contact du wizard reste obligatoire.
- Ce n'est pas une plateforme de production et pas le LOT 3.

## 5. Fichiers

Ajoutés :

- `src/drive/search.ts`
- `src/drive/search.check.mjs`
- `src/drive/ui/DriveSearchForm.tsx`
- `src/pages/DriveResultsPage.tsx`

Modifiés :

- `src/App.tsx` (route `drive/resultats`)
- `src/pages/DrivePage.tsx` (lien vers la recherche)
- `src/drive/BookingWizard.tsx`
- `src/drive/VehicleCard.tsx`
- `src/i18n/messages.ts`
- `src/styles/global.css`
- `e2e/drive.spec.ts`
- `package.json` (`test:drive` enchaîne le contrôle de recherche)

Non touchés pour ce lot : `pricing.ts`, `status.ts`, `store.ts`, le catalogue, les pages institutionnelles, les photographies des fondateurs, `qa.zip`.
