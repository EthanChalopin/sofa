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

- **Deux blocs** garnis, assise et dossier. Les montants en Y, les accoudoirs et le taquet restent en bois apparent.
- **Trois positions** : canapé (dossier à 23,7°), détente (31,7°), lit.
- **Mécanisme** : le dossier pivote sur deux boulons. Un tube d'acier traversant porte à chaque bout un taquet
  en bois à deux positions (nez = position droite, flanc = détente) et un levier. En lit, le dossier bascule
  vers l'avant ; son bord pose au sol par deux pieds qu'on visse au montant, les accoudoirs restent au-dessus du sol.
- **Montants** : en contreplaqué 30 mm, en branches. La queue part du boulon, droite (le taquet appuie dessus), et
  rejoint la tige vissée au dossier, qui s'arrête en demi-cercle 12 cm sous son haut (`MOD.upright.below`). De la
  tige se détache, haut, l'accoudoir : une branche courbe de 6,5 à 4 cm de large, qui descend vers l'avant puis file
  à plat, au niveau de l'assise, jusqu'à une pointe arrondie. Entre la branche et le tronc, le montant est évidé ; le
  creux finit par un trou de 30 mm (scie cloche).
- **Pieds du lit, amovibles** : un pied en hêtre par côté, qu'on visse en position lit sur l'extérieur du haut du
  montant, par deux vis à bouton dans deux inserts filetés. Il descend droit au sol, à 18 cm du bord du lit. En canapé on
  les dévisse et on les range : rien ne dépasse du montant.
- **Structure** : chevrons de sapin 50 × 70 mm, plateau et peaux en MDF cloué, mousse (16 cm à l'assise ;
  au dossier, 10 cm côté assise et 5 cm côté couchage, autour d'un cadre de 7 cm), ouate et tissu.
- **Cotes** : 202 × 97,5 × 90,4 cm en canapé, assise à 35,8 cm, accoudoir à plat à 41,8 cm du sol (6 cm
  au-dessus de l'assise), dossier fini de
  43 × 24 cm, bloc d'assise de 75 cm, 106,5 cm de profondeur en détente, lit de 120 cm.
- **Achats de structure** : 267 € (214 € relevés chez Leroy Merlin, 52 € de quincaillerie estimés).
- **Mousse** : 244 € estimés (HD 40 kg/m³ très ferme chez Matelas pour tous, hors frais de port).

La page propose quatre rendus, dans l'ordre de fabrication (structure, MDF, mousse, habillé), et dix-neuf tissus.
Un mannequin de 1,80 m (bouton « Mannequin ») s'assoit contre le dossier, dont il suit l'inclinaison, ou se couche
sur le lit en chien de fusil.

## Décisions prises par Ethan

À respecter, sauf demande contraire de sa part :

- **Simple et robuste** avant tout : le moins de pièces et de réglages possible.
- Changement d'inclinaison par **barre à taquets** (les butées à ressorts et cordelettes ont été écartées).
- **Dossier d'un seul bloc rigide et banquette fixe** (le rabat articulé et le nez en mousse ont été écartés).
  Conséquences acceptées : un lit moins profond que l'original et un jour sous le dossier en position assise.
- **MDF cloué, pas collé** : le cadre du dossier porte donc seul, d'où ses chevrons posés à plat.
- **Chevrons bruts 50 × 70** plutôt que tasseaux rabotés, pour le prix.
- **Mousse rééquilibrée** : 16 cm à l'assise (au lieu de 20) ; au dossier, 10 cm côté assise et 5 cm côté
  couchage (au lieu de 3 + 5). Ethan voulait 10 + 10 : impossible avec cette assise, car en lit le dossier
  se couche devant elle, à sa hauteur ; épais de 29 cm, il ne laisserait que 5 cm de manchette et mettrait
  le boulon de pivot au ras du dessous du cadre. Conséquences du 10 + 5 : assise à 35,8 cm du sol,
  manchettes de 11 cm. Trois réglages en découlent, à ne pas défaire :
  - le coin avant-haut des flancs et des renforts est abattu de 5 cm (`MOD.frame.nose`), sans quoi le bas
    du dossier les touche en basculant vers le lit ;
  - le taquet est éloigné du pivot (`MOD.cam.t` = 18) pour que le tube passe au-dessus du plateau ;
  - le haut du montant (la tige) affleure l'arrière du cadre du dossier, où il est vissé.
- **Accoudoirs bas, pieds du lit amovibles, dossier haut** (18 novembre 2026). Les accoudoirs ne servent plus de
  pieds : en lit, ils restent au-dessus du sol. Le bord du lit est porté par
  **deux pieds amovibles** (`MOD.bedLeg`), vissés au montant par des vis à bouton en position lit, rangés en
  canapé. Sans eux, l'assise se soulèverait quand on s'assoit au bord du lit ; avec eux, la bascule tombe à 48 % de la limite (0 % tant qu'ils étaient au bord ; ils ont reculé de 12 cm
  avec la tige raccourcie).
  Cela a permis de **rehausser le dossier de 10 cm** (43 cm au lieu de 33) et de **raccourcir d'autant le bloc
  d'assise** (75 cm au lieu de 85, `MOD.seatDepth`), par l'arrière : le lit garde 120 cm et la profondeur
  utile pour s'asseoir ne change pas. Conséquence acceptée : en canapé, le bas du dossier dépasse de 3,2 cm
  derrière le bloc d'assise.
- **Accoudoir en branche** (18 novembre 2026, d'après les croquis d'Ethan) : la manchette rapportée est supprimée,
  la tige est raccourcie et arrondie, et l'accoudoir est une branche courbe (`MOD.upright.branch`).
  Le 19 novembre, elle a été remontée : elle quitte la tige plus haut et file à plat au niveau de l'assise, comme
  sur le second croquis. Sa longueur vers l'avant est limitée par le lit : en lit, la pointe passe à 1,5 cm du sol
  (`MOD.upright.clear`). Largeur hors tout : 202 cm (205 cm avec les leviers).
- **Détente à +8°** (`MOD.extraLean`, au lieu de +12°), pour réduire le jour sous le dossier : 5,6 cm à
  l'arrière et 15,3 cm à l'avant en canapé, 0 à 12,6 cm en détente. Ce réglage abaisse le pivot : il a fallu
  1 cm de mousse de plus à l'assise (16 au lieu des 15 voulus) pour garder du bois autour du boulon.
- **Les montants et les pieds du lit sont réalisés par un ami** : ils ne figurent
  pas dans les achats (leurs vis à bouton et leurs inserts, si).

## Ce qui est sûr, ce qui ne l'est pas

- **Géométrie** : vérifiée par calcul (`tools/verif.js`), dans les trois positions et pendant les bascules.
- **Solidité** : estimations par formules de poutre simples, pas des essais. Les assemblages (vis, pointes,
  colle) ne sont pas calculés. Pièces les plus chargées : le cadre du dossier en lit (60 %), le longeron d'assise
  (48 %), le tube de commande (42 %). Bascule du lit : 48 % avec les pieds amovibles (masses du bloc d'assise et
  du dossier estimées d'après le volume des pièces).
- **À essayer sur maquette avant tout** : la tenue des pieds du lit (deux vis à bouton à 3,3 cm d'entraxe), et le retour
  du taquet par le seul poids du levier.
- **Prix** : relevés sur les sites des vendeurs les 5 et 6 octobre 2026, à vérifier. Certains tissus étaient
  presque épuisés (voir leurs remarques dans `js/fabrics.js`).
- **Tissus** : plusieurs échelles de motif sont estimées, faute de règle sur la photo ; c'est indiqué pour
  chacun. Le métrage suppose le tissu posé d'avant en arrière.
- **Mousse** : prix estimé au prorata du volume, à partir d'un seul prix relevé sur matelaspourtous.com le
  10 octobre 2026 (274 € la plaque de 200 × 100 × 20 cm). À confirmer plaque par plaque dans le configurateur
  du site ; hors de ses épaisseurs standard, compter 43 % de plus.
- **Non chiffrés** : la ouate (surface connue, fournisseur et prix à remplir), les montants et les pieds du lit.

## État du dépôt

- Tout le travail est sur `main`, poussé sur GitHub. Les branches `habillage-blocs` et `tissu` y sont fusionnées.
- Le dépôt GitHub est public. `tissus/` et `reference/` contiennent des photos de vendeurs.
- `proposition-mecanisme.png` est périmé : il montre un ancien taquet à manche.

## Pour modifier

- **Une cote ou la longueur** : changer la valeur dans `MOD` (ou `EST`), puis relancer `node tools/verif.js`
  et `node tools/materiaux.js`.
- **Un prix ou un article de bois** : `CATALOG` dans `js/sofa-bom.js`. Chaque pièce du modèle déclare ses
  coupes dans un champ `cuts`.
- **Le prix de la mousse** : `FOAM_QUOTE` dans `js/sofa-bom.js` (la plaque relevée et son prix). Le prix de
  chaque plaque du canapé s'en déduit au volume.
- **Un tissu** : une entrée de plus dans `js/fabrics.js` (rayures décrites en centimètres, ou photo dans
  `tissus/<id>.jpg` suivie de `node tools/tissus.js`). Le format est expliqué en tête du fichier.
