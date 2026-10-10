# Liste des matériaux

Canapé de **196 cm** de long (202 cm avec les montants). Liste calculée le 10 octobre 2026.

> - Document généré par `node tools/materiaux.js` : il se recalcule si une cote change, donc ne pas le modifier à la main.
> - Ce qui est marqué « à remplir » se saisit dans le bloc `SOFT` de `js/sofa-bom.js`.
> - Prix relevés sur les sites des vendeurs les 5 et 6 octobre 2026 : à vérifier avant d'acheter.

## 1. Bois et panneaux

Magasin : Leroy Merlin.

| Article | Qté | Prix | Total | Sert à |
|---|---|---|---|---|
| Chevron sapin traité 50 × 70 mm, 3 m | 6 | 7,89 € | 47,34 € | 2 × longeron de dossier de 196 cm ; 6 × entretoise de dossier de 12,9 cm ; 2 × renfort de pivot de 85 cm ; 2 × longeron d'assise de 190,6 cm ; 6 × traverse d'assise de 75 cm |
| Planche sapin rabotée 27 × 140 mm, 2,4 m | 1 | 18,90 € | 18,90 € | 2 × flanc de 85 cm |
| Panneau MDF 18 mm, 250 × 122 cm | 1 | 49,90 € | 49,90 € | 1 × plateau d'assise de 180,6 × 85 cm |
| Panneau MDF 10 mm, 250 × 122 cm | 1 | 44,90 € | 44,90 € | 2 × peau de dossier de 196 × 26,9 cm |

Sous-total : **161,04 €**

### Plan de coupe

Trait de scie compté : 4 mm.

**Chevron sapin traité 50 × 70 mm, 3 m**

| N° | Coupes (cm) | Chute |
|---|---|---|
| 1 | 196 (longeron de dossier) + 85 (renfort de pivot) + 12,9 (entretoise de dossier) | 5,3 cm |
| 2 | 196 (longeron de dossier) + 85 (renfort de pivot) + 12,9 (entretoise de dossier) | 5,3 cm |
| 3 | 190,6 (longeron d'assise) + 75 (traverse d'assise) + 12,9 (entretoise de dossier) + 12,9 (entretoise de dossier) | 7,4 cm |
| 4 | 190,6 (longeron d'assise) + 75 (traverse d'assise) + 12,9 (entretoise de dossier) + 12,9 (entretoise de dossier) | 7,4 cm |
| 5 | 75 (traverse d'assise) + 75 (traverse d'assise) + 75 (traverse d'assise) | 74,2 cm |
| 6 | 75 (traverse d'assise) | 225 cm |

**Planche sapin rabotée 27 × 140 mm, 2,4 m**

| N° | Coupes (cm) | Chute |
|---|---|---|
| 1 | 85 (flanc) + 85 (flanc) | 69,6 cm |

**Panneau MDF 18 mm, 250 × 122 cm**

| N° | Coupes (cm) | Chute |
|---|---|---|
| 1 | 180,6 × 85 (plateau d'assise) | — |

**Panneau MDF 10 mm, 250 × 122 cm**

| N° | Coupes (cm) | Chute |
|---|---|---|
| 1 | 196 × 26,9 (peau de dossier) | — |
| 1 | 196 × 26,9 (peau de dossier) | — |

## 2. Quincaillerie

| Article | Qté | Prix | Total | Sert à |
|---|---|---|---|---|
| Tube rond acier ø 16 mm, 2 m | 1 | 9,50 € | 9,50 € | 1 × tube de commande de 200 cm |
| Tube IRL ø 25 mm, 2 m | 1 | 2,29 € | 2,29 € | 1 × fourreau de 180,6 cm |
| Pied conique hêtre, 10 cm | 6 | 6,88 € | 41,28 € | 6 × pied |
| Boulon M10 × 120 avec écrou et rondelles *(estimation)* | 2 | 2,50 € | 5,00 € | 2 × boulon de pivot |
| Pointes crantées, vis, colliers, chute de hêtre, tourillon ø 12 *(estimation)* | 1 | 35,00 € | 35,00 € | — |

Sous-total : **93,07 €** (dont 40,00 € estimés).

À façonner dans la chute de hêtre et le tourillon :

| Pièce | Qté | Dimensions | Matière |
|---|---|---|---|
| Taquet | 2 | 8,5 × 4 × 3 cm | Hêtre massif, fil dans la longueur |
| Levier de commande | 2 | 19,3 × 5,5 × 1,5 cm | Hêtre massif, collé et vissé sur la face du taquet |
| Pion de fin de course | 2 | 3 × 1,2 × 1,2 cm | Tourillon hêtre collé dans le panneau |

## 3. Mousse

| Plaque | Qté | Dimensions | Volume | Densité et fermeté | Fournisseur | Référence | Prix |
|---|---|---|---|---|---|---|---|
| Mousse d'assise | 1 | 196 × 85 × 20 cm | 333,2 L | **à remplir** | **à remplir** | **à remplir** | **à remplir** |
| Mousse du dossier, côté assise | 1 | 196 × 26,9 × 3 cm | 15,8 L | **à remplir** | **à remplir** | **à remplir** | **à remplir** |
| Mousse du dossier, côté couchage | 1 | 196 × 26,9 × 5 cm | 26,4 L | **à remplir** | **à remplir** | **à remplir** | **à remplir** |

- La mousse d'assise se colle sur le plateau en MDF. Elle reçoit une entaille à chaque bout pour coiffer les flancs, et une saignée dessous pour le fourreau du tube : voir la pièce « Mousse d'assise » dans la page.
- Les deux plaques du dossier se collent de part et d'autre du cadre. La plus épaisse est du côté qui devient le couchage.
- Le prix des deux plaques du dossier se saisit en une seule ligne (`backFoam`).

## 4. Ouate

| Emplacement | Surface | Épaisseur posée | Grammage | Fournisseur | Référence | Prix |
|---|---|---|---|---|---|---|
| Assise : dessus, avant et arrière | 2,9 m² | 1 cm | **à remplir** | **à remplir** | **à remplir** |  |
| Dossier : tout le tour, sauf les deux bouts | 1,8 m² | 1 cm | idem | idem | idem |  |
| **Total** | **4,7 m²** |  |  |  |  | **à remplir** |

- Surfaces nettes, sans marge de coupe.
- Pas de ouate sur les flancs de l'assise : le tissu y est tendu à même le bois, pour laisser travailler le montant et le taquet.

## 5. Tissu

Surface à couvrir : **5,3 m²** (les deux blocs, sans le dessous de l'assise). Un seul tissu à choisir parmi les 19 ci-dessous.

Le métrage à acheter dépasse cette surface : le tissu se vend au mètre dans une largeur fixe, et il faut le plus souvent plusieurs largeurs cousues côte à côte. Il compte les coutures, 5 cm de retour agrafé sous le cadre, le raccord du motif quand il est connu et 10 % de marge.

| Tissu | Vendeur | Laize | Prix au mètre | À acheter | Soit | Prix | Pose |
|---|---|---|---|---|---|---|---|
| Vert chiné | — | 140 cm | — | 5,7 m | 8 m² | — | 2 largeurs par bloc |
| Toile rayée bleu-vert | Tissus Hemmers | 160 cm | 17,09 € | 5,7 m | 9,1 m² | 97,41 € | 2 largeurs par bloc |
| Toile rayée Sicilia multicolore | Tissus Hemmers | 160 cm | 17,09 € | 5,7 m | 9,1 m² | 97,41 € | 2 largeurs par bloc |
| Velours côtelé fin roux | Mondial Tissus | 145 cm | 14,99 € | 5,7 m | 8,3 m² | 85,44 € | 2 largeurs par bloc |
| Jacquard Peps violet orange | Mondial Tissus | 280 cm | 25,99 € | 2,6 m | 7,3 m² | 67,57 € | tourné d'un quart de tour, sans couture |
| Jacquard Peps vert rose | Mondial Tissus | 280 cm | 25,99 € | 2,6 m | 7,3 m² | 67,57 € | tourné d'un quart de tour, sans couture |
| Jacquard Paola orange | Mercerine | 140 cm | 21,80 € | 5,9 m | 8,3 m² | 128,62 € | 2 largeurs par bloc |
| Jacquard Geofle étoiles cuivrées | Mercerine | 140 cm | 14,90 € | 5,8 m | 8,1 m² | 86,42 € | 2 largeurs par bloc |
| Hollyhocks Spring (House of Hackney) | Etoffe.com | 137 cm | 210,00 € | 8 m | 11 m² | 1680,00 € | 2 largeurs par bloc |
| Oia anthracite (Nobilis) | Etoffe.com | 144 cm | 198,00 € | 7 m | 10,1 m² | 1386,00 € | 2 largeurs par bloc |
| Oia jaune (Nobilis) | Etoffe.com | 144 cm | 198,00 € | 7 m | 10,1 m² | 1386,00 € | 2 largeurs par bloc |
| Regimen ruggine (Dedar) | Etoffe.com | 315 cm | 344,00 € | 2,9 m | 9,1 m² | 997,60 € | 1 largeur, sans couture |
| Regimen carrot stick (Dedar) | Etoffe.com | 315 cm | 344,00 € | 2,9 m | 9,1 m² | 997,60 € | 1 largeur, sans couture |
| Almudaina vert (Gastón y Daniela) | Etoffe.com | 140 cm | 87,00 € | 5,7 m | 8 m² | 495,90 € | 2 largeurs par bloc |
| Jacquard rayures bleu | Mondial Tissus | 140 cm | 25,99 € | 5,7 m | 8 m² | 148,14 € | 2 largeurs par bloc, rayures dans la longueur |
| Tissé teint rayures rose vert | Mondial Tissus | 150 cm | 15,99 € | 5,7 m | 8,6 m² | 91,14 € | 2 largeurs par bloc |
| Cretonne enduite Rhune orange | Mondial Tissus | 155 cm | 16,99 € | 5,7 m | 8,8 m² | 96,84 € | 2 largeurs par bloc |
| Panama bloc graphique vert | Mondial Tissus | 140 cm | 22,99 € | 5,7 m | 8 m² | 131,04 € | 2 largeurs par bloc |
| Bachette rayure bleu vert jaune | Mondial Tissus | 148 cm | 12,99 € | 5,7 m | 8,4 m² | 74,04 € | 2 largeurs par bloc |

### Détail de chaque tissu

- **Vert chiné** — Le tissu du canapé d'origine, d'après les photos de l'annonce. Laize supposée de 140 cm.
- **Toile rayée bleu-vert** — Toile de store banne déperlante (Tissus Hemmers) : 160 cm de large, 220 g/m², 80 % polyacrylique et 20 % polyester, raccord de 10,6 cm. 17,09 € le mètre affiché. [Fiche du vendeur](https://www.tissus-hemmers.fr/toile-store-banne-exterieur-160cm-deperlant-a-rayures-bleu-vert)
- **Toile rayée Sicilia multicolore** — Toile de store banne déperlante (Tissus Hemmers) : fines rayures multicolores, 160 cm de large, 220 g/m², 100 % polyacrylique, raccord de 21,2 cm. 17,09 € le mètre affiché. [Fiche du vendeur](https://www.tissus-hemmers.fr/toile-store-banne-exterieur-a-rayures-sicilia-160-cm-multicolore)
- **Velours côtelé fin roux** — Velours côtelé (Mondial Tissus) : qualité siège, 145 cm de large, 260 g/m², 100 % polyester. 14,99 € le mètre affiché. [Fiche du vendeur](https://www.mondialtissus.fr/tissu-velours-cotele-fin-roux-321669.html)
- **Jacquard Peps violet orange** — Jacquard rayé (Mondial Tissus) : grande largeur de 280 cm, 306 g/m², 71 % polyester et 29 % coton, rayures en travers du rouleau, raccord de 7 cm. 25,99 € le mètre affiché. Vendu pour la déco et les rideaux : il n'est pas classé « qualité siège » et sa résistance au frottement n'est pas indiquée. [Fiche du vendeur](https://www.mondialtissus.fr/tissu-jacquard-rayure-peps-violet-orange-318003.html)
- **Jacquard Peps vert rose** — Jacquard rayé (Mondial Tissus) : grande largeur de 280 cm, 313 g/m², 75 % polyester et 25 % coton, rayures en travers du rouleau, raccord de 7 cm. 25,99 € le mètre affiché. Vendu pour la déco et les rideaux : il n'est pas classé « qualité siège » et sa résistance au frottement n'est pas indiquée. [Fiche du vendeur](https://www.mondialtissus.fr/tissu-jacquard-rayures-peps-vert-rose-318002.html)
- **Jacquard Paola orange** — Jacquard géométrique seventies (Mercerine) : hexagones bleus, orange et ocre, 140 cm de large, 314 g/m², 54 % polyester et 46 % coton. 21,80 € le mètre affiché. Vendu pour les accessoires et la décoration : il n'est pas donné pour l'ameublement. [Fiche du vendeur](https://www.mercerine.com/tissu-jacquard-allover-paola-orange-53013.html)
- **Jacquard Geofle étoiles cuivrées** — Jacquard à étoiles cuivrées sur fond noir (Mercerine) : 140 cm de large, 215 g/m², 50 % polyester, 40 % coton, 8 % lurex et 2 % viscose. 14,90 € le mètre affiché. Tissu léger, vendu pour les rideaux et les sacs. Il n'en restait que 0,10 m en stock à la date du relevé. [Fiche du vendeur](https://www.mercerine.com/jacquard-geofle-35220.html)
- **Hollyhocks Spring (House of Hackney)** — Imprimé floral dense (House of Hackney, chez Etoffe.com) : 137 cm de large, lin 53 %, coton 35 %, nylon 12 %, 40 000 tours Martindale, raccord de 137 × 121 cm. 210 € le mètre affiché. L'échelle de l'aperçu est estimée : la photo du vendeur n'a pas de règle. [Fiche du vendeur](https://www.etoffe.com/tissu-ameublement/30771-tissu-hollyhocks-house-of-hackney.html)
- **Oia anthracite (Nobilis)** — Jacquard lourd (Nobilis, chez Etoffe.com) : barrettes anthracite et colonne de pois rouges sur fond écru, 144 cm de large, 890 g au mètre, mélange viscose, polyester, coton, laine et lin, 60 000 tours Martindale, raccord de 36 × 45 cm. 198 € le mètre affiché. [Fiche du vendeur](https://www.etoffe.com/tissu-ameublement/35115-tissu-oia-nobilis.html#35115-314162)
- **Oia jaune (Nobilis)** — Jacquard lourd (Nobilis, chez Etoffe.com) : barrettes jaunes et colonne de pois rouges sur fond écru, 144 cm de large, 890 g au mètre, mélange viscose, polyester, coton, laine et lin, 60 000 tours Martindale, raccord de 36 × 45 cm. 198 € le mètre affiché. [Fiche du vendeur](https://www.etoffe.com/tissu-ameublement/35115-tissu-oia-nobilis.html#35115-314159)
- **Regimen ruggine (Dedar)** — Rayures rouille, marine et blanc (Dedar, chez Etoffe.com) : très grande largeur de 315 cm, 100 % polyester Trevira CS non feu, raccord de 4,5 cm. 344 € le mètre affiché. Tissu léger (456 g au mètre, soit environ 145 g/m²), sans résistance au frottement indiquée : c'est plutôt un tissu de rideaux. [Fiche du vendeur](https://www.etoffe.com/tissu-ameublement/56223-tissu-regimen-dedar.html#56223-518642)
- **Regimen carrot stick (Dedar)** — Rayures carotte, marine et blanc (Dedar, chez Etoffe.com) : très grande largeur de 315 cm, 100 % polyester Trevira CS non feu, raccord de 4,5 cm. 344 € le mètre affiché. Tissu léger (456 g au mètre, soit environ 145 g/m²), sans résistance au frottement indiquée : c'est plutôt un tissu de rideaux. [Fiche du vendeur](https://www.etoffe.com/tissu-ameublement/56223-tissu-regimen-dedar.html#56223-518644)
- **Almudaina vert (Gastón y Daniela)** — Rayures marine et vert (Gastón y Daniela, chez Etoffe.com) : 140 cm de large, 100 % coton, 336 g au mètre, 22 000 tours Martindale, usage intensif. 87 € le mètre affiché. [Fiche du vendeur](https://www.etoffe.com/tissu-ameublement/43971-tissu-almudaina-gaston-y-daniela.html#43971-397879)
- **Jacquard rayures bleu** — Jacquard à fines rayures bleues, grises et rouges (Mondial Tissus) : 140 cm de large, 370 g/m², 75 % polyester et 25 % coton. 25,99 € le mètre affiché. Rayures en travers du rouleau ; largeur des rayures estimée. Vendu pour la déco et les rideaux : il n'est pas classé « qualité siège ». [Fiche du vendeur](https://www.mondialtissus.fr/tissu-jacquard-rayures-bleu-240441.html)
- **Tissé teint rayures rose vert** — Tissé teint à rayures multicolores (Mondial Tissus) : vert, rose, jaune et rouille, 150 cm de large, 220 g/m², 100 % coton. 15,99 € le mètre affiché. Vendu pour la déco et les rideaux : il n'est pas classé « qualité siège ». [Fiche du vendeur](https://www.mondialtissus.fr/tissu-tisse-teint-rayures-multicolores-rose-vert-316061.html)
- **Cretonne enduite Rhune orange** — Cretonne enduite à larges rayures basques (Mondial Tissus) : jaune, rouge, écru et orange, qualité siège, 155 cm de large, 225 g/m², 78 % coton et 22 % acrylique, 14 000 tours Martindale. 16,99 € le mètre affiché. Largeur des rayures et raccord estimés. [Fiche du vendeur](https://www.mondialtissus.fr/cretonne-enduite-rhune-orange-358563.html)
- **Panama bloc graphique vert** — Toile semi-panama imprimée (Mondial Tissus) : blocs de rayures vertes, rouges et crème, qualité siège, 140 cm de large, 205 g/m², 100 % coton, 18 000 tours Martindale. 22,99 € le mètre affiché. Le vendeur ne donne ni la taille du motif ni son raccord : l'échelle de l'aperçu est estimée, et le métrage ne compte aucun raccord. [Fiche du vendeur](https://www.mondialtissus.fr/toile-semi-panama-digitale-ligne-bloc-graphique-vert-354367.html)
- **Bachette rayure bleu vert jaune** — Bachette à larges rayures bleu canard et vert, filet orangé (Mondial Tissus) : 148 cm de large, 218 g/m², 100 % coton. 12,99 € le mètre affiché. Vendu pour la déco : il n'est pas classé « qualité siège ». [Fiche du vendeur](https://www.mondialtissus.fr/tissu-bachette-rayure-bleu-vert-jaune-361953.html)

## 6. Réalisé à part

Les montants et les manchettes sont fabriqués par un ami : ils ne sont pas dans les achats.

| Pièce | Qté | Dimensions hors tout | Matière |
|---|---|---|---|
| Montant en Y | 2 | 70,2 × 30,1 × 3 cm | Contreplaqué bouleau 30 mm (deux épaisseurs de 15 collées), teinté |
| Manchette d'accoudoir | 2 | 22 × 6 × 2,5 cm | Bois massif (hêtre), teinté |

## Récapitulatif

| Poste | Montant |
|---|---|
| Bois et panneaux | 161,04 € |
| Quincaillerie | 93,07 € |
| Mousse | **à remplir** |
| Ouate | **à remplir** |
| Tissu | selon le tissu choisi (tableau du § 5) |
| **Total hors tissu** | 254,11 € + mousse et ouate |

Ne sont pas comptés : la colle pour la mousse, les agrafes et le fil, la finition du bois apparent.
