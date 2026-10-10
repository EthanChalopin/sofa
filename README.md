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
| Mousse et ouate : fournisseur, qualité et prix, **encore à remplir** | `SOFT` dans [js/sofa-bom.js](js/sofa-bom.js) |
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
- **Trois positions** : canapé (dossier à 23,7°), détente (35,7°), lit.
- **Mécanisme** : le dossier pivote sur deux boulons. Un tube d'acier traversant porte à chaque bout un taquet
  en bois à deux positions (nez = position droite, flanc = détente) et un levier. En lit, le dossier bascule
  vers l'avant et les accoudoirs deviennent les pieds.
- **Structure** : chevrons de sapin 50 × 70 mm, plateau et peaux en MDF cloué, mousse (20 cm à l'assise ;
  15 cm de bois et de mousse au dossier), ouate et tissu.
- **Cotes** : 202 × 87 × 81 cm en canapé, assise à 39,8 cm, 97,4 cm de profondeur en détente, lit de 115,9 cm.
- **Achats de structure** : 254 € (214 € relevés chez Leroy Merlin, 40 € de quincaillerie estimés).

La page propose quatre rendus, dans l'ordre de fabrication (structure, MDF, mousse, habillé), et dix-neuf tissus.

## Décisions prises par Ethan

À respecter, sauf demande contraire de sa part :

- **Simple et robuste** avant tout : le moins de pièces et de réglages possible.
- Changement d'inclinaison par **barre à taquets** (les butées à ressorts et cordelettes ont été écartées).
- **Dossier d'un seul bloc rigide et banquette fixe** (le rabat articulé et le nez en mousse ont été écartés).
  Conséquences acceptées : un lit moins profond que l'original et un jour sous le dossier en position assise.
- **MDF cloué, pas collé** : le cadre du dossier porte donc seul, d'où ses chevrons posés à plat.
- **Chevrons bruts 50 × 70** plutôt que tasseaux rabotés, pour le prix.
- Hauteur d'origine conservée (81 cm).
- **Les montants en Y et les manchettes d'accoudoir sont réalisés par un ami** : ils ne figurent pas dans les achats.

## Ce qui est sûr, ce qui ne l'est pas

- **Géométrie** : vérifiée par calcul (`tools/verif.js`), dans les trois positions et pendant les bascules.
- **Solidité** : estimations par formules de poutre simples, pas des essais. Les assemblages (vis, pointes,
  colle) ne sont pas calculés. Pièce la plus chargée : le tube de commande (76 % de sa limite).
- **À essayer sur maquette avant tout** : la tenue du lit quand on s'assoit sur son bord avant, et le retour
  du taquet par le seul poids du levier.
- **Prix** : relevés sur les sites des vendeurs les 5 et 6 octobre 2026, à vérifier. Certains tissus étaient
  presque épuisés (voir leurs remarques dans `js/fabrics.js`).
- **Tissus** : plusieurs échelles de motif sont estimées, faute de règle sur la photo ; c'est indiqué pour
  chacun. Le métrage suppose le tissu posé d'avant en arrière.
- **Non chiffrés** : la mousse et la ouate (dimensions connues, fournisseur et prix à remplir), les montants et les manchettes.

## État du dépôt

- Branche courante : `tissu`, commitée en local. Elle n'est pas encore poussée sur GitHub, où seules `main` et
  `habillage-blocs` existent.
- Le dépôt GitHub est public. `tissus/` et `reference/` contiennent des photos de vendeurs.
- `proposition-mecanisme.png` est périmé : il montre un ancien taquet à manche.

## Pour modifier

- **Une cote ou la longueur** : changer la valeur dans `MOD` (ou `EST`), puis relancer `node tools/verif.js`
  et `node tools/materiaux.js`.
- **Un prix ou un article de bois** : `CATALOG` dans `js/sofa-bom.js`. Chaque pièce du modèle déclare ses
  coupes dans un champ `cuts`.
- **Un tissu** : une entrée de plus dans `js/fabrics.js` (rayures décrites en centimètres, ou photo dans
  `tissus/<id>.jpg` suivie de `node tools/tissus.js`). Le format est expliqué en tête du fichier.
