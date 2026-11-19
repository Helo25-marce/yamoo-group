# Drive — conformité visuelle du lot B

Date de contrôle : 2026-11-18. Périmètre : page de résultats (`/drive` et `/drive/resultats`) seulement. Les lots C à H (fiche enrichie, extras, protections, checkout, paiement, QA de ces lots) ne sont pas traités.

Les captures Booking servent de géométrie. La marque, le jaune de surbrillance, les logos de loueurs, les notes et les montants européens ne sont pas repris.

## Lot A — écarts avant correction

| Sujet | Attendu | Constaté avant ce lot | Fichiers |
| --- | --- | --- | --- |
| Barre | Une seule barre : lieu, date, heure, date de retour, heure, Rechercher | Lieu, dates, puis un second champ « type de prestation » dans la même rangée ; cases « autre lieu » et « âge » | `DriveSearchForm.tsx` |
| Secondaire | Prestation, passagers, bagages ; destination seulement si le service l'exige | Cases décoratives et carte déclenchée à part | `DriveSearchForm.tsx` |
| Colonnes | Sidebar ~28 %, résultats ~72 %, carte seulement si un lieu catalogue a des coordonnées | Sidebar fixe 16,5 rem ; carte pleine largeur sur demande, tous les lieux du pays | `DriveCatalog.tsx`, `global.css` |
| Carte | Photo stable, identité, prix, « Voir l'offre » dans la zone prix, pied prestataire | Prix et boutons mélangés ; « Choisir » en action principale | `VehicleCard.tsx` |
| Filtres | Uniquement ceux qui filtrent des données réelles, compteurs du catalogue filtré | Compteurs sur tout le catalogue ; paragraphe sur les données absentes | `DriveCatalog.tsx` |
| Modale | Rubriques chauffeur, sans caution ni kilomètres inventés | Rubriques de location européenne reformulées (caution, dommages, carburant, kilométrage) | `ImportantInfo.tsx` |
| Tri | Recommandé (règle explicite), prix, capacité. Pas de note | Prix et capacité seulement | `search.ts` |

Critères d'acceptation du lot B : recherche datée 20–22 nov. 2026, 48 véhicules, 14 SUV, Corolla 255 000 FCFA, S-Class en tête au prix décroissant, Patrol indisponible et masqué tant que le filtre n'est pas ouvert, FR/EN, basename inchangé, `yamoo.drive.v1` non réécrit.

Risques : le bouton principal ouvre la fiche puis la commande, il ne saute plus à l'étape contact du wizard. Le wizard étape par étape reste en place. Un tri « recommandé » ne remplace pas le tri par prix par défaut, pour garder la Corolla en tête sur une recherche datée sans paramètre `sort`.

## Matrice des filtres (chauffeur YAMOO)

| Filtre de la référence | Statut | Effet dans l'interface |
| --- | --- | --- |
| Localisation (aéroport, terminal) | PRÉVU | Pas de stock de comptoirs. La miniature n'apparaît que si le lieu saisi est un lieu du catalogue Cameroun, avec ses coordonnées. |
| Transmission | PRÉVU | Aucun véhicule n'a `facts.transmission`. Non affiché. |
| Prestataire | ACTIF | Partenaires de démonstration du catalogue. Compteur après les autres filtres. |
| Kilométrage | NON APPLICABLE | Aucun forfait publié. Non affiché. |
| Extras | PRÉVU | Choisis plus tard dans le parcours. Ils ne filtrent pas le catalogue. |
| Bagages | ACTIF | Minimum, combiné aux autres filtres. |
| Catégorie | ACTIF | Berline, SUV, van, prestige, pick-up. Même valeur que la rangée de pictogrammes. |
| Prix / jour | ACTIF | Quatre tranches du tarif journalier réel, en FCFA. |
| Places | ACTIF | Minimum de places. |
| Avis | NON APPLICABLE | Aucun avis réel. Pas de filtre, pas de tri par note. |
| Protection | PRÉVU | Lot ultérieur. Non affichée comme filtre. |
| Moment du paiement | PRÉVU | Non affiché. |
| Caractéristiques | PRÉVU | Pas de faits publiés (clim, etc.). Non affiché. |
| Motorisation | PRÉVU | Pas de carburant publié. Non affiché. |
| Caution | NON APPLICABLE | Aucun montant publié. |
| Politique carburant | NON APPLICABLE | Aucune règle publiée. |
| Marque | ACTIF | Donnée catalogue. « Afficher plus » au-delà de 6 marques. |
| Texte (nom, catégorie) | ACTIF | Champ déjà branché sur le nom, la marque, le modèle et la catégorie. |
| Indisponibles | ADAPTÉ | Nissan Patrol et Range Rover Autobiography. Masqués sur une recherche datée tant que la case n'est pas cochée. Visibles dans le catalogue sans dates. |
| Comparaison | ACTIF | Tableau réel (nom, catégorie, places, bagages, prix, statut) dès deux offres. Pas d'interrupteur marketing. |

Règle du tri recommandé, affichée sous le sélecteur : places les plus proches du nombre demandé, puis prix le plus bas. Le défaut sans paramètre `sort` reste le prix croissant.

## Écarts traités

| Composant | Attendu | Constaté | Correction | Résultat |
| --- | --- | --- | --- | --- |
| Barre | Une barre, ordre lieu / date / heure / retour / heure / Rechercher | Prestation dans la barre, cases âge et autre dépôt | Prestation, passagers et bagages sous la barre. Destination seulement pour immédiat et programmé | CONFORME sur la capture 1440 (bouton à x=1240, largeur 140 px) |
| Carte | Quatre zones, « Voir l'offre » à droite | « Choisir » à côté du prix, pied mélangé | Grille photo / identité / prix / pied | CONFORME — le test ouvre la fiche par « Voir l'offre » |
| Sidebar | ~28 % / ~72 %, tiroir ≤ 768 px | 16,5 rem, panneau replié jusqu'à 1024 px | Colonnes 28fr / 72fr dès 769 px, tiroir fixe en dessous | CONFORME — mesure 370 px / 951 px, soit 28 % / 71 % (l'écart est la gouttière) |
| Modale | Échap, retour du focus, conditions en accordéon | Sections location, pas de piège clavier | Neuf rubriques chauffeur, `<details>`, piège Tab | CONFORME — modale ouverte en capture, Échap couvert par Playwright |
| Devis | Lien seulement si l'envoi existe | Pas de parcours devis | Non affiché | NON APPLICABLE |
| « ou similaire » | Seulement si substitution réelle | Absent des données | Non affiché | CONFORME |
| Prix | Corolla 85 000 × 3 = 255 000 | Formule inchangée | Aucun changement de `pricing` | CONFORME — assertion Playwright 255 000 |

## Checklist

| Point | Statut |
| --- | --- |
| Barre unie et ordre des champs | CONFORME |
| Autocomplétion, Échap, dates, URL | CONFORME — champs existants conservés, rejoués par Playwright |
| Filtres sans compteur inventé | CONFORME — compteurs issus de `listBrowseVehicles` |
| 48 véhicules / 14 SUV sur recherche datée | CONFORME — Playwright desktop et mobile |
| Corolla 255 000, S-Class la plus chère, Patrol indisponible | CONFORME — Playwright |
| Carte horizontale, pas de note fictive, pas de logo loueur | CONFORME sur la structure. Le lien texte « Voir l'entreprise » reste, vers la fiche partenaire de démonstration |
| Modale accessible | CONFORME — ouverture, Échap, retour au scénario fiche |
| FR / EN, pas de lien Admin public | CONFORME — tests Drive du 2026-11-18 |
| Réservations `yamoo.drive.v1` | CONFORME — test store YD-KEEP |
| Heure native | PARTIEL — le champ heure suit la locale du navigateur (10:00 AM sur la machine de capture) |
| Lots C à H | NON FAIT |

## Mesures (recherche datée, viewport 1440)

Conteneur résultats 1337 px. Sidebar 370 px (28 %). Colonne résultats 951 px (71 %). Le pourcent restant est la gouttière de la grille. Pas de défilement horizontal (`scrollWidth` 1425, viewport 1440). À 390 px, `scrollWidth` = 390, filtres en `display: none` hors tiroir, compteur « 48 véhicule(s) ».

Captures : `apps/web/docs/quality/screenshots/drive/lot-b/results-desktop-1440.png`, `modal-desktop-1440.png`, `results-mobile-390.png`. La capture mobile montre le cadre de l'outil à droite du viewport 390 ; la page elle-même ne déborde pas.

## Exécution

- `tsc -p tsconfig.app.json --noEmit` : succès (aussi inclus dans `npm run build`).
- `npm run test:drive` : pricing, search, gallery, catalog, tous OK.
- `npx playwright test e2e/drive.spec.ts` : 19 réussis, 8 ignorés (projets tablette et scénarios desktop-only), 0 échec. Durée 2,3 min.
