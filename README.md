# Canapé convertible — modèle, achats et tissus

Ethan fabrique lui-même un canapé convertible inspiré d'un modèle OPP Dřevovýroba des années 1970
([annonce d'origine](https://justchairs.eu/products/mid-century-convertible-sofa-by-opp-drevovyroba-1970s)),
avec ses propres modifications. Ce dépôt contient le modèle paramétrique du canapé, une visionneuse 3D et
les calculs qui en découlent : achats, plan de coupe, solidité, métrage de tissu.

Ce fichier est le point d'entrée pour reprendre le projet. **Le code fait foi** : les chiffres cités ici
sont un instantané du 10 octobre 2026, pour un canapé de 196 cm.

## Lancer

| Pour… | Faire |
|---|---|
| Voir le modèle | Ouvrir `index.html` dans un navigateur (double-clic, aucun serveur, hors ligne) |
| Liste d'achats, plan de coupe, solidité, tissu | `node tools/debit.js` |
| Essayer une autre longueur | `node tools/debit.js --largeur=180`, ou le champ « Longueur » dans la page |
| Refaire la liste complète des matériaux ([MATERIAUX.md](MATERIAUX.md)) | `node tools/materiaux.js` |
| Vérifier que le mécanisme fonctionne encore | `node tools/verif.js` (code de sortie 1 si un contrôle échoue) |
| Embarquer une nouvelle photo de tissu | `node tools/tissus.js` |

Aucune dépendance à installer : Node seul suffit pour les outils, three.js est dans `vendor/`.

## Où se trouve chaque information

| Information | Fichier |
|---|---|
| **Tout ce qu'il faut acheter**, en un seul document : bois, quincaillerie, mousse, ouate, tissus | [MATERIAUX.md](MATERIAUX.md) (généré) |
| Toutes les cotes du canapé, pièce par pièce | [js/sofa-model.js](js/sofa-model.js) |
| Prix et longueurs du bois et de la quincaillerie (Leroy Merlin) | `CATALOG` dans [js/sofa-bom.js](js/sofa-bom.js) |
| Mousse : fournisseur, qualité et prix relevé (`FOAM_QUOTE`), d'où un prix au litre | `SOFT` dans [js/sofa-bom.js](js/sofa-bom.js) |
| Ouate : fournisseur, grammage et prix, **encore à remplir** | `SOFT` dans [js/sofa-bom.js](js/sofa-bom.js) |
| Calcul des achats, du plan de coupe, de la solidité, du métrage de tissu | [js/sofa-bom.js](js/sofa-bom.js) |
| Tissus : laize, prix au mètre, raccord, motif, lien vendeur, remarques | [js/fabrics.js](js/fabrics.js) |
| Photos de tissus (extraits qui se répètent) | [tissus/](tissus/), embarquées dans `js/fabric-images.js` (généré) |
| Visionneuse : rendu 3D, animation, interface | [js/app.js](js/app.js), [index.html](index.html), [css/style.css](css/style.css) |
| Photos et fiche de l'annonce d'origine | [reference/](reference/) |

Dans `js/sofa-model.js`, trois blocs de paramètres en tête de fichier :

- `LISTING` : les cinq cotes annoncées par le vendeur du canapé d'origine.
- `EST` : les cotes relevées sur ses photos (± 1 à 2 cm).
- `MOD` : les choix d'Ethan. **`MOD.width` est la longueur du canapé** ; le nombre de traverses, de pieds et
  d'entretoises, les achats et le plan de coupe en découlent.

Chaque cote affichée porte sa source : `v` vendeur, `p` estimée sur photo, `h` hypothèse, `m` choix de conception.

## Le canapé, tel qu'il est modélisé

- **Deux blocs** garnis, assise et dossier. Les montants, les accoudoirs et les butées restent en bois apparent.
- **Deux positions** : canapé (dossier à 23,7°) et lit.
- **Mécanisme** : celui de l'original, simplifié. Le dossier et ses deux montants pivotent sur deux boulons. En
  canapé, la queue de chaque montant repose sur une **butée** fixe, un tourillon de hêtre ø 30 mm collé dans le flanc,
  à 15 cm du pivot. Pour faire le lit, on bascule le dossier vers l'avant : la queue quitte la butée et la pointe des
  accoudoirs pose au sol, à 19 cm du bord du lit. Ils servent de pieds au lit.
- **Montants** : en contreplaqué 30 mm, en branches. La queue part du boulon, droite (elle repose sur la butée), et
  rejoint la tige vissée au dossier, qui s'arrête en demi-cercle 12 cm sous son haut (`MOD.upright.below`). De la
  tige se détache l'accoudoir : une branche courbe de 6,5 à 4 cm de large, qui monte en biais vers l'avant comme le
  bras en Y de l'original, jusqu'à une pointe arrondie. Entre la branche et le tronc, le montant est évidé ; le creux
  finit par un trou de 30 mm (scie cloche). En lit, la branche est presque verticale : elle porte le lit en compression.
- **Structure** : chevrons de sapin 50 × 70 mm, plateau et peaux en MDF cloué, mousse (16 cm à l'assise ;
  au dossier, 10 cm côté assise et 5 cm côté couchage, autour d'un cadre de 7 cm), ouate et tissu.
- **Cotes** : 202 × 91,5 × 76,7 cm en canapé, assise à 30,8 cm sur des pieds de 5 cm, accoudoir de 54,7 cm (départ)
  à 63,2 cm du sol (pointe), dossier fini de 33 × 24 cm, jour de 6 à 15,7 cm sous le dossier, bloc d'assise de 85 cm, lit de 120 cm.
- **Achats de structure** : 244 € (161 € relevés chez Leroy Merlin, 83 € estimés, dont les pieds de 5 cm : prix
  du modèle de 10 cm en attendant un relevé).
- **Mousse** : 245 € estimés (HD 40 kg/m³ très ferme chez Matelas pour tous, hors frais de port).

La page propose quatre rendus, dans l'ordre de fabrication (structure, MDF, mousse, habillé), et dix-neuf tissus.
Un mannequin de 1,80 m (bouton « Mannequin ») s'assoit contre le dossier ou se couche
sur le lit en chien de fusil.

## Décisions prises par Ethan

À respecter, sauf demande contraire de sa part :

- **Simple et robuste** avant tout : le moins de pièces et de réglages possible.
- **Mécanisme de l'original, sans position détente** (19 novembre 2026) : la barre à taquets, ses leviers, son
  fourreau, le pion de fin de course et les pieds amovibles du lit ont été retirés. Le montant repose sur une butée
  fixe en canapé, et sur la pointe des accoudoirs en lit. Point de départ simple, à ajuster.
- **Dossier d'un seul bloc rigide et banquette fixe** (le rabat articulé et le nez en mousse ont été écartés).
  Conséquences acceptées : un lit moins profond que l'original et un jour sous le dossier en position assise.
- **MDF cloué, pas collé** : le cadre du dossier porte donc seul, d'où ses chevrons posés à plat.
- **Chevrons bruts 50 × 70** plutôt que tasseaux rabotés, pour le prix.
- **Mousse rééquilibrée** : 16 cm à l'assise (au lieu de 20) ; au dossier, 10 cm côté assise et 5 cm côté
  couchage (au lieu de 3 + 5). Ethan voulait 10 + 10 : impossible avec cette assise, car en lit le dossier
  se couche devant elle, à sa hauteur ; épais de 29 cm, il ne laisserait que 5 cm de manchette et mettrait
  le boulon de pivot au ras du dessous du cadre. Conséquences du 10 + 5 : assise à 35,8 cm du sol,
  manchettes de 11 cm (l'assise est depuis descendue de 5 cm avec les pieds). Deux réglages en découlent, à ne pas défaire :
  - le coin avant-haut des flancs et des renforts est abattu de 5 cm (`MOD.frame.nose`), sans quoi le bas
    du dossier les touche en basculant vers le lit ;
  - le haut du montant (la tige) affleure l'arrière du cadre du dossier, où il est vissé.
- **Lit stable sur les accoudoirs** (19 novembre 2026) : les proportions de l'original sont revenues, **bloc
  d'assise de 85 cm et dossier de 33 cm** (`MOD.seatDepth`), lit toujours à 120 cm. Avec le dossier de 43 cm et
  l'accoudoir bas, la pointe touchait le sol à 59 cm du bord : quelqu'un assis au bord du lit soulevait l'assise
  (bascule à 623 %) et la branche pliait (163 %). La pointe d'un accoudoir sert de pied : sa hauteur en canapé fixe
  sa distance au bord du lit. Elle est donc remontée (`MOD.upright.branch.tip` = 55 cm du pivot) : pied à 20 cm du
  bord, bascule à 66 %, branche à 7 %. Conséquence : l'accoudoir est haut (54,7 à 63,2 cm du sol avec les pieds
  de 5 cm). Un dossier
  plus court (assise plus profonde) permettrait un accoudoir plus bas, au prix d'un dossier plus bas encore.
- **Pieds de 5 cm** (19 novembre 2026, au lieu de 10, `MOD.cover.bottom`) : tout le canapé descend de 5 cm, assise
  à 30,8 cm. Le pivot descend aussi (8,3 cm du sol) et reste en plein bois du flanc.
- **Accoudoir en branche** (18 et 19 novembre 2026, d'après les croquis d'Ethan) : la manchette rapportée est
  supprimée, la tige est raccourcie et arrondie, et l'accoudoir est une branche courbe (`MOD.upright.branch`).
  Largeur hors tout : 202 cm.
- **Jour sous le dossier de 6 cm** à l'arrière en canapé (`MOD.backGap`) : il fixe la hauteur du pivot. Sans lui le
  pivot descendrait à 6,1 cm du sol, au ras du bas du flanc (5 cm) ; à 6 cm il est à 8,3 cm, en plein bois.
- **Les montants sont réalisés par un ami** : ils ne figurent pas dans les achats.

## Ce qui est sûr, ce qui ne l'est pas

- **Géométrie** : vérifiée par calcul (`tools/verif.js`), dans les deux positions et pendant la bascule.
- **Solidité** : estimations par formules de poutre simples, pas des essais. Les assemblages (vis, pointes,
  colle) ne sont pas calculés. Pièces les plus chargées : le cadre du dossier en lit (60 %), le longeron d'assise
  (48 %), la butée (63 %).
- **Bascule du lit : 63 %** de la limite, 100 kg assis au bord (masses estimées d'après le volume des pièces :
  50 kg pour le bloc d'assise, 22 kg pour le dossier). Les accoudoirs reçoivent alors 745 N chacun, presque dans
  leur axe (flexion à 10 %).
- **À essayer sur maquette avant tout** : la tenue de la butée (un tourillon en console, 1 660 N par côté quand trois
  personnes s'adossent) et la stabilité du lit, assis au bord.
- **Prix** : relevés sur les sites des vendeurs les 5 et 6 octobre 2026, à vérifier. Certains tissus étaient
  presque épuisés (voir leurs remarques dans `js/fabrics.js`).
- **Tissus** : plusieurs échelles de motif sont estimées, faute de règle sur la photo ; c'est indiqué pour
  chacun. Le métrage suppose le tissu posé d'avant en arrière.
- **Mousse** : prix estimé au prorata du volume, à partir d'un seul prix relevé sur matelaspourtous.com le
  10 octobre 2026 (274 € la plaque de 200 × 100 × 20 cm). À confirmer plaque par plaque dans le configurateur
  du site ; hors de ses épaisseurs standard, compter 43 % de plus.
- **Non chiffrés** : la ouate (surface connue, fournisseur et prix à remplir), les montants.

## État du dépôt

- Tout le travail est sur `main`, poussé sur GitHub. Les branches `habillage-blocs` et `tissu` y sont fusionnées.
- Le dépôt GitHub est public. `tissus/` et `reference/` contiennent des photos de vendeurs.
- `proposition-mecanisme.png` est périmé : il montre un ancien taquet à manche, abandonné depuis.

## Pour modifier

- **Une cote ou la longueur** : changer la valeur dans `MOD` (ou `EST`), puis relancer `node tools/verif.js`
  et `node tools/materiaux.js`.
- **Un prix ou un article de bois** : `CATALOG` dans `js/sofa-bom.js`. Chaque pièce du modèle déclare ses
  coupes dans un champ `cuts`.
- **Le prix de la mousse** : `FOAM_QUOTE` dans `js/sofa-bom.js` (la plaque relevée et son prix). Le prix de
  chaque plaque du canapé s'en déduit au volume.
- **Un tissu** : une entrée de plus dans `js/fabrics.js` (rayures décrites en centimètres, ou photo dans
  `tissus/<id>.jpg` suivie de `node tools/tissus.js`). Le format est expliqué en tête du fichier.
