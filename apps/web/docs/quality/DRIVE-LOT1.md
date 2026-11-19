# YAMOO DRIVE — LOT 1

**Branche :** `feature/drive-foundations`  
**Statut :** implémenté localement. Non poussé, non fusionné, non déployé.  
**Lots 2 à 8 :** non commencés.

Ce document distingue ce qui est vraiment en place de ce qui est seulement préparé.

---

## 1. Résumé

Le parcours client existant (Service → Trajet → Véhicule → Coordonnées → Confirmation) est conservé. Les règles de prix, les statuts, la clé `yamoo.drive.v1` et les pages institutionnelles ne changent pas.

Le lot pose des tokens sémantiques Drive, quatre composants d’interface réellement utilisés, une validation centralisée identique à l’ancienne, et un profil de champs pour les trois services déjà actifs. La galerie véhicule peut porter plusieurs images ; aujourd’hui chaque véhicule n’a qu’un recadrage de démonstration, indiqué comme tel.

## 2. Architecture

### Avant

- Styles Drive mélangés : classes Tailwind et hex dorés dans le wizard et les cartes.
- Validation du trajet et des coordonnées écrite dans `BookingWizard.tsx`.
- Véhicule : un seul `imageSrc`.
- Persistance : `localStorage` `yamoo.drive.v1`, merge catalogue pour l’image et le cadrage.

### Après

- `.ui-booking` porte les tokens `--drive-*`. Le focus des champs existants suit `--ui-accent`, désormais turquoise sur le parcours client. L’admin reste sur l’accent doré.
- `validation.ts` reprend les mêmes refus qu’avant (`dates`, `range`, `places`, `passengers`, `contact`, `email`).
- `services.ts` décrit les champs requis des trois services actifs. Aucun nouveau service n’est sélectionnable.
- `DriveVehicle.images` est optionnel. Le merge du store recopie le catalogue (donc `images`) et conserve disponibilité, tarifs et nom déjà enregistrés. La version du store reste `1`. Pas de migration.

### Préparé, non codé

Un port `DriveDataPort` (lecture véhicules / services / réservations, création, modification contrôlée, statuts) n’est pas introduit. Le store actuel est déjà le seul point d’écriture. Une deuxième interface maintenant ferait deux systèmes.

Répartition future, non implémentée :

| Frontend | Backend Django REST |
|---|---|
| Affichage, navigation, saisie | Authentification, autorisations |
| Validation ergonomique | Validation métier, tarif officiel |
| États visuels | Disponibilité, conflits, persistance |
| | Paiements, journalisation |

La démo navigateur n’est pas une sécurité de production. Les identifiants de service et les statuts (`pending`, `confirmed`, `refused`, `cancelled`, `completed`) restent les valeurs stables à reprendre côté serveur.

## 3. Composants créés

Sous `src/drive/ui/`, uniquement ceux branchés au parcours :

| Composant | Rôle |
|---|---|
| `DriveButton` | `primary` (bleu nuit, texte blanc), `secondary`, `link`. `disabled`, focus visible hérité, `to` optionnel. |
| `DriveDemoBanner` | Bandeau démo FR/EN. |
| `DriveAlert` | Message `role="alert"`. |
| `DriveStatusBadge` | Libellé de statut traduit. |

## 4. Composants réutilisés, non extraits

| Candidat | Décision |
|---|---|
| DriveInput, DriveSelect, DriveDateField | Les champs `.drive-field` existent déjà et restent les contrôles du wizard. |
| DriveCard | `VehicleCard` reste la carte véhicule. |
| DriveSectionHeader | Classe `.drive-title-section`. |
| DriveEmptyState, DriveLoadingState | Pas de nouvel écran vide ou de chargement dans ce lot. |
| Bouton institutionnel `Button` | Conservé pour le site, l’admin et l’espace client. Retiré du wizard. |

## 5. Fichiers de ce lot

- `src/styles/global.css` — tokens `.ui-booking`, boutons, choix, alerte, focus.
- `src/drive/ui/*` — composants ci-dessus.
- `src/drive/services.ts`, `src/drive/validation.ts`
- `src/drive/types.ts` — `images` optionnel, sans changement de version.
- `src/drive/catalog.ts` — une image `demo: true` par véhicule existant.
- `src/drive/BookingWizard.tsx` — habillage et appel de la validation. Ordre et payload inchangés.
- `src/drive/VehicleCard.tsx` — sélection turquoise / nuit, mention de visuel de démonstration.
- `src/i18n/messages.ts` — `drive.demoPhoto` FR et EN.
- `e2e/drive.spec.ts` — store déjà rempli, focus clavier, contraste, `/en/drive`, largeurs 375 / 1024 / 1280.

Hors lot, laissés tels quels dans l’arbre de travail : photos fondateurs et `apps/web/qa.zip`.

## 6. Migrations

Aucune. Clé `yamoo.drive.v1` inchangée. Les réservations déjà présentes ne sont ni supprimées ni réécrites par la lecture. Le champ `images` arrive par le merge catalogue à la prochaine écriture, sans toucher aux tarifs stockés.

## 7. Tests

Base avant modification : `typecheck` et `test:drive` passaient sur `main` au moment de la branche.

Après modification, gate `npm run quality` :

- Typecheck : PASS
- Build Vite : PASS (avertissement bundle JS > 500 kB, déjà connu)
- `test:drive` (3 jours × 85 000 = 255 000 FCFA, immédiat / programmé = tarif trajet, statuts) : PASS
- Playwright : **35 passed, 4 skipped**

Les 4 skips sont volontaires : le store prérempli et le contrôle focus/EN/largeurs ne tournent que sur `desktop-1440`, pour ne pas tripler la même session. Les parcours Drive, l’institutionnel et le FR/EN tournent sur 1440, 768 et 390.

Vérifications ajoutées :

- Navigateur avec un `yamoo.drive.v1` déjà rempli : la référence `YD-KEEP` reste visible au compte, le tarif journalier `123456` et le nom local restent après affichage du catalogue.
- Alerte de trajet immédiat sans lieux : inchangée.
- Bouton principal : contraste texte/fond ≥ 4,5:1. Focus clavier : contour non `none`.
- `/en/drive` affiche le bandeau de démonstration.
- Pas de débordement horizontal à 375, 1024 et 1280, en plus des projets 390 / 768 / 1440.

## 8. Captures

`apps/web/docs/quality/screenshots/drive/`

- `landing-desktop-1440.png`, `landing-tablet-768.png`, `landing-mobile-390.png`
- `landing-w375.png`, `landing-w1024.png`, `landing-w1280.png`
- `vehicles-*`, `booking-contact-*`, `booking-done-*`, `admin-*`

Inspection :

- Parcours client : fond ivoire, sélection turquoise, bouton principal bleu nuit. Le doré ne pilote plus les formulaires.
- Les cartes indiquent « Visuel de démonstration ». Les cinq fichiers restent des recadrages d’une même source.
- Mobile 390 et 375 : étapes sur deux lignes, recherche empilée, boutons visibles, pas de champ coupé hors écran (le test de débordement passe).
- Les captures pleine page du récapitulatif peuvent montrer l’en-tête fixe une seconde fois au milieu de l’image. L’en-tête est `position: fixed` dans `global.css`. La capture d’écran du viewport (étape service) n’a qu’un seul en-tête. La répétition vient de l’outil de capture, pas d’un second header dans la page.

## 9. Anomalies restantes

| Id | Sujet | Suite |
|---|---|---|
| Q-02 | Photos flotte = recadrages, pas cinq véhicules réels | Indication démo en place. Photos officielles plus tard. |
| Q-03 | Auth démo navigateur | Backend, hors lot. |
| Q-05 | Bundle > 500 kB | Inchangé. |
| Q-06 | Espace client encore sur le thème nuit institutionnel | Documenté, non refondu. |
| Q-07 | Admin : sidebar, table, accent doré | Volontairement non refondu. |
| Q-08 | Hero Drive utilise encore le visuel institutionnel `drive` | Hors formulaire. Non modifié. |

## 10. Risques

- Le merge catalogue écrase `imageSrc` par la graine. Un futur fichier officiel doit passer par le catalogue, pas seulement par le JSON local.
- `images` n’est pas encore une galerie à l’écran : une seule vignette est affichée.
- Aucune API. Ne pas présenter la démo comme une réservation opérationnelle.

## 11. LOT 2

Le lot 1 est une base suffisante pour un lot 2 qui resterait sur le même store et le même wizard.

Non prêt, et interdit sans nouvel accord :

- parcours recherche → résultats → fiche véhicule ;
- nouveaux services actifs ;
- refonte admin ou espace client ;
- Django, paiements, disponibilité réelle.

Recommandation pour le lot 2, si autorisé : une seule évolution visible (fiche ou résultats), en réutilisant `validation.ts`, les tokens `.ui-booking` et `DriveButton`, sans second store.
