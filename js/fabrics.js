/*
 * Tissus proposés pour le garnissage. Pour en ajouter un : une entrée de plus dans la liste.
 *
 * Trois façons de décrire un tissu :
 *  - « stripes » : des rayures [couleur, largeur en cm], dans l'ordre, qui se répètent. Sur le canapé elles
 *    courent d'avant en arrière sur l'assise et montent sur le dossier.
 *  - « paint » + « tile » : un motif dessiné sur un carreau de « size » pixels de côté (64 par défaut),
 *    qui couvre tile [cm, cm] et se répète.
 *  - « image » + « tile » : une photo du tissu, rangée dans tissus/<id>.jpg puis embarquée par
 *    « node tools/tissus.js ». Elle couvre tile [cm, cm] et se répète.
 *
 * Pour le métrage : « width » est la laize en cm, « price » le prix au mètre, « repeat » le raccord du motif
 * dans la longueur du rouleau (0 pour un uni ou des rayures). « weft: true » signale des rayures tissées en
 * travers du rouleau. Si le tissu est assez large, il se pose tourné d'un quart de tour et les rayures courent
 * d'avant en arrière comme les autres ; sinon elles courent dans la longueur du canapé.
 * « swatch » est la couleur de la pastille dans la liste des pièces.
 * Couleurs et largeurs relevées sur les photos des vendeurs : elles donnent l'effet d'ensemble, pas la teinte exacte.
 */
(function (root) {
  'use strict';

  var HEMMERS = 'https://www.tissus-hemmers.fr/', MONDIAL = 'https://www.mondialtissus.fr/';
  var MERCERINE = 'https://www.mercerine.com/', ETOFFE = 'https://www.etoffe.com/tissu-ameublement/';

  var list = [
    {
      id: 'vert',
      name: 'Vert chiné',
      swatch: '#4e9463',
      width: 140,
      note: 'Le tissu du canapé d\'origine, d\'après les photos de l\'annonce. Laize supposée de 140 cm.',
      tile: [4, 4],
      paint: function (g, size) {
        var band = size / 4, dot = size / 8;
        g.fillStyle = '#58a26e';
        g.fillRect(0, 0, size, size);
        g.fillStyle = '#3b7551';
        for (var y = 0; y < size; y += band) g.fillRect(0, y, size, band * 7 / 16);
        g.fillStyle = '#58a26e';
        for (y = 0; y < size; y += band) for (var x = 0; x < size; x += dot) g.fillRect(x, y + band / 8, dot * 3 / 8, band * 3 / 16);
      }
    },
    {
      id: 'rayures-bleu-vert',
      name: 'Toile rayée bleu-vert',
      swatch: '#1a377b',
      width: 160, price: 17.09,
      note: 'Toile de store banne déperlante (Tissus Hemmers) : 160 cm de large, 220 g/m², 80 % polyacrylique ' +
            'et 20 % polyester, raccord de 10,6 cm. 17,09 € le mètre affiché.',
      url: HEMMERS + 'toile-store-banne-exterieur-160cm-deperlant-a-rayures-bleu-vert',
      stripes: [['#1a377b', 4.9], ['#c6a034', 0.4], ['#176551', 4.9], ['#c6a034', 0.4]]
    },
    {
      id: 'rayures-sicilia',
      name: 'Toile rayée Sicilia multicolore',
      swatch: '#e87653',
      width: 160, price: 17.09,
      note: 'Toile de store banne déperlante (Tissus Hemmers) : fines rayures multicolores, 160 cm de large, ' +
            '220 g/m², 100 % polyacrylique, raccord de 21,2 cm. 17,09 € le mètre affiché.',
      url: HEMMERS + 'toile-store-banne-exterieur-a-rayures-sicilia-160-cm-multicolore',
      // Un raccord complet, relevé automatiquement sur la photo du vendeur.
      stripes: [
        ['#eec5b3', 0.08], ['#ed7d55', 0.60], ['#e5cf75', 0.44], ['#8da7b5', 0.32], ['#5a5342', 0.40], ['#c0c0b4', 0.48],
        ['#b6938d', 0.16], ['#c7acaa', 0.24], ['#3c3b39', 0.67], ['#dfe0d4', 0.56], ['#ab6c52', 0.48], ['#eeb142', 0.44],
        ['#a86948', 0.36], ['#5b4e71', 1.15], ['#49443b', 0.71], ['#e7e6da', 0.91], ['#e87653', 0.52], ['#8ba2c4', 0.60],
        ['#f2bc3f', 0.64], ['#3b3937', 0.40], ['#9d6149', 0.75], ['#e1d2c3', 0.24], ['#9d6f6b', 0.12], ['#aea49b', 0.12],
        ['#587a6d', 0.32], ['#ccd0c5', 1.63], ['#615243', 0.28], ['#995c4a', 0.16], ['#eed7b7', 0.24], ['#f5bd45', 0.60],
        ['#af6942', 0.12], ['#664b52', 0.71], ['#a05448', 0.32], ['#e7e4d9', 0.71], ['#9e5a56', 0.20], ['#bfbbb1', 0.40],
        ['#4e5e77', 0.28], ['#453d44', 0.16], ['#9d4a44', 0.79], ['#d4d09f', 1.11], ['#f17c4e', 0.60], ['#e4e1da', 0.36],
        ['#5c4e51', 0.71], ['#964f46', 0.16]
      ]
    },
    {
      id: 'velours-cotele-roux',
      name: 'Velours côtelé fin roux',
      swatch: '#a64b27',
      width: 145, price: 14.99,
      note: 'Velours côtelé (Mondial Tissus) : qualité siège, 145 cm de large, 260 g/m², 100 % polyester. ' +
            '14,99 € le mètre affiché.',
      url: MONDIAL + 'tissu-velours-cotele-fin-roux-321669.html',
      // La largeur des côtes n'est pas donnée par le vendeur : estimée à 4 mm d'après ses photos.
      stripes: [['#b25530', 0.28], ['#7c3216', 0.12]]
    },
    {
      id: 'jacquard-peps-violet-orange',
      name: 'Jacquard Peps violet orange',
      swatch: '#482846',
      width: 280, price: 25.99, weft: true,
      note: 'Jacquard rayé (Mondial Tissus) : grande largeur de 280 cm, 306 g/m², 71 % polyester et 29 % coton, ' +
            'rayures en travers du rouleau, raccord de 7 cm. 25,99 € le mètre affiché. Vendu pour la déco et les ' +
            'rideaux : il n\'est pas classé « qualité siège » et sa résistance au frottement n\'est pas indiquée.',
      url: MONDIAL + 'tissu-jacquard-rayure-peps-violet-orange-318003.html',
      // Un raccord de 7 cm, relevé sur la photo à plat du vendeur.
      stripes: [['#482846', 3.25], ['#b85e3d', 0.52], ['#7ba08a', 0.4], ['#b85e3d', 0.5], ['#7ba08a', 0.4], ['#c56541', 0.4], ['#e6d6d2', 1.5]]
    },
    {
      id: 'jacquard-peps-vert-rose',
      name: 'Jacquard Peps vert rose',
      swatch: '#19402b',
      width: 280, price: 25.99, weft: true,
      note: 'Jacquard rayé (Mondial Tissus) : grande largeur de 280 cm, 313 g/m², 75 % polyester et 25 % coton, ' +
            'rayures en travers du rouleau, raccord de 7 cm. 25,99 € le mètre affiché. Vendu pour la déco et les ' +
            'rideaux : il n\'est pas classé « qualité siège » et sa résistance au frottement n\'est pas indiquée.',
      url: MONDIAL + 'tissu-jacquard-rayures-peps-vert-rose-318002.html',
      stripes: [['#19402b', 3.25], ['#cc7287', 1.45], ['#84211f', 0.41], ['#9ea5b1', 0.43], ['#84211f', 0.5], ['#9ea5b1', 0.43], ['#84211f', 0.5]]
    },
    {
      id: 'jacquard-paola-orange',
      name: 'Jacquard Paola orange',
      swatch: '#b0623a',
      width: 140, price: 21.8, repeat: 6.5,
      note: 'Jacquard géométrique seventies (Mercerine) : hexagones bleus, orange et ocre, 140 cm de large, 314 g/m², 54 % polyester et 46 % coton. 21,80 € le mètre affiché. Vendu pour les accessoires et la décoration : il n\'est pas donné pour l\'ameublement.',
      url: MERCERINE + 'tissu-jacquard-allover-paola-orange-53013.html',
      // Extrait de la photo du vendeur, à l'échelle de sa règle.
      image: true,
      tile: [15.1, 6.5]
    },
    {
      id: 'jacquard-geofle',
      name: 'Jacquard Geofle étoiles cuivrées',
      swatch: '#3a3531',
      width: 140, price: 14.9, repeat: 10.1,
      note: 'Jacquard à étoiles cuivrées sur fond noir (Mercerine) : 140 cm de large, 215 g/m², 50 % polyester, 40 % coton, 8 % lurex et 2 % viscose. 14,90 € le mètre affiché. Tissu léger, vendu pour les rideaux et les sacs. Il n\'en restait que 0,10 m en stock à la date du relevé.',
      url: MERCERINE + 'jacquard-geofle-35220.html',
      // Extrait de la photo du vendeur, à l'échelle de sa règle.
      image: true,
      tile: [11.9, 10.1]
    },
    {
      id: 'hollyhocks-spring',
      name: 'Hollyhocks Spring (House of Hackney)',
      swatch: '#9e8c7e',
      width: 137, price: 210, repeat: 121,
      note: 'Imprimé floral dense (House of Hackney, chez Etoffe.com) : 137 cm de large, lin 53 %, coton 35 %, nylon 12 %, 40 000 tours Martindale, raccord de 137 × 121 cm. 210 € le mètre affiché. L\'échelle de l\'aperçu est estimée : la photo du vendeur n\'a pas de règle.',
      url: ETOFFE + '30771-tissu-hollyhocks-house-of-hackney.html',
      // Photo à plat du vendeur, sans règle : largeur estimée à 105 cm.
      image: true,
      tile: [97, 97]
    },
    {
      id: 'oia-anthracite',
      name: 'Oia anthracite (Nobilis)',
      swatch: '#3f4250',
      width: 144, price: 198, repeat: 45,
      note: 'Jacquard lourd (Nobilis, chez Etoffe.com) : barrettes anthracite et colonne de pois rouges sur fond écru, 144 cm de large, 890 g au mètre, mélange viscose, polyester, coton, laine et lin, 60 000 tours Martindale, raccord de 36 × 45 cm. 198 € le mètre affiché.',
      url: ETOFFE + '35115-tissu-oia-nobilis.html#35115-314162',
      // Photo à plat du vendeur, calée sur son raccord horizontal de 36 cm.
      image: true,
      tile: [34.2, 30.6]
    },
    {
      id: 'oia-jaune',
      name: 'Oia jaune (Nobilis)',
      swatch: '#d99a2b',
      width: 144, price: 198, repeat: 45,
      note: 'Jacquard lourd (Nobilis, chez Etoffe.com) : barrettes jaunes et colonne de pois rouges sur fond écru, 144 cm de large, 890 g au mètre, mélange viscose, polyester, coton, laine et lin, 60 000 tours Martindale, raccord de 36 × 45 cm. 198 € le mètre affiché.',
      url: ETOFFE + '35115-tissu-oia-nobilis.html#35115-314159',
      // Photo à plat du vendeur, calée sur son raccord horizontal de 36 cm.
      image: true,
      tile: [34.2, 34.2]
    },
    {
      id: 'regimen-ruggine',
      name: 'Regimen ruggine (Dedar)',
      swatch: '#cb5b36',
      width: 315, price: 344,
      note: 'Rayures rouille, marine et blanc (Dedar, chez Etoffe.com) : très grande largeur de 315 cm, 100 % polyester Trevira CS non feu, raccord de 4,5 cm. 344 € le mètre affiché. Tissu léger (456 g au mètre, soit environ 145 g/m²), sans résistance au frottement indiquée : c\'est plutôt un tissu de rideaux.',
      url: ETOFFE + '56223-tissu-regimen-dedar.html#56223-518642',
      // Un raccord de 4,5 cm, relevé sur la photo du vendeur.
      stripes: [['#38324a', 0.54], ['#c95a35', 3.1], ['#38334b', 0.51], ['#dedbd6', 0.35]]
    },
    {
      id: 'regimen-carrot',
      name: 'Regimen carrot stick (Dedar)',
      swatch: '#d4924b',
      width: 315, price: 344,
      note: 'Rayures carotte, marine et blanc (Dedar, chez Etoffe.com) : très grande largeur de 315 cm, 100 % polyester Trevira CS non feu, raccord de 4,5 cm. 344 € le mètre affiché. Tissu léger (456 g au mètre, soit environ 145 g/m²), sans résistance au frottement indiquée : c\'est plutôt un tissu de rideaux.',
      url: ETOFFE + '56223-tissu-regimen-dedar.html#56223-518644',
      // Un raccord de 4,5 cm, relevé sur la photo du vendeur.
      stripes: [['#e8dbce', 0.33], ['#393241', 0.55], ['#d3914c', 3.09], ['#3a3142', 0.52]]
    },
    {
      id: 'almudaina-verde',
      name: 'Almudaina vert (Gastón y Daniela)',
      swatch: '#6f9160',
      width: 140, price: 87,
      note: 'Rayures marine et vert (Gastón y Daniela, chez Etoffe.com) : 140 cm de large, 100 % coton, 336 g au mètre, 22 000 tours Martindale, usage intensif. 87 € le mètre affiché.',
      url: ETOFFE + '43971-tissu-almudaina-gaston-y-daniela.html#43971-397879',
      // Rayures de 2,4 cm : 29 rayures vertes comptées sur les 140 cm de la photo pleine largeur.
      stripes: [['#2d315c', 2.25], ['#6e8f60', 2.56]]
    },
    {
      id: 'jacquard-rayures-bleu',
      name: 'Jacquard rayures bleu',
      swatch: '#2f4f78',
      width: 140, price: 25.99, weft: true,
      note: 'Jacquard à fines rayures bleues, grises et rouges (Mondial Tissus) : 140 cm de large, 370 g/m², 75 % polyester et 25 % coton. 25,99 € le mètre affiché. Rayures en travers du rouleau ; largeur des rayures estimée. Vendu pour la déco et les rideaux : il n\'est pas classé « qualité siège ».',
      url: MONDIAL + 'tissu-jacquard-rayures-bleu-240441.html',
      // Relevé sur la photo du vendeur, sans règle : échelle supposée identique à ses autres photos à plat.
      stripes: [
        ['#39454e', 0.57], ['#d6ccc3', 0.19], ['#cbb492', 0.83], ['#a8b5be', 0.14], ['#92a4b1', 0.28], ['#2a3531', 0.21],
        ['#c5bbad', 0.24], ['#357b9b', 0.76], ['#696968', 0.24], ['#88212c', 0.61], ['#726054', 0.17], ['#23426a', 0.19],
        ['#9c9282', 0.14], ['#6b6c6b', 1.77], ['#d3cac0', 0.19], ['#444445', 0.17], ['#1f426b', 0.57], ['#a8b5c0', 0.35],
        ['#273431', 0.21], ['#357794', 0.19], ['#50637f', 1.13], ['#94a2ad', 0.17], ['#cab391', 0.76], ['#6a6a68', 0.17],
        ['#20426b', 0.28], ['#516481', 0.26], ['#a0917e', 0.21], ['#86212c', 0.76], ['#37424b', 0.26], ['#92a3b1', 0.59],
        ['#397d9d', 0.19], ['#9f917e', 0.19], ['#726559', 0.12], ['#1f426a', 1.75], ['#c4bcb1', 0.17], ['#293433', 0.21],
        ['#357c9d', 0.54], ['#d6ccc2', 0.35], ['#676768', 0.24], ['#82232d', 0.17], ['#37444e', 0.4]
      ]
    },
    {
      id: 'tisse-teint-rose-vert',
      name: 'Tissé teint rayures rose vert',
      swatch: '#1b5e55',
      width: 150, price: 15.99,
      note: 'Tissé teint à rayures multicolores (Mondial Tissus) : vert, rose, jaune et rouille, 150 cm de large, 220 g/m², 100 % coton. 15,99 € le mètre affiché. Vendu pour la déco et les rideaux : il n\'est pas classé « qualité siège ».',
      url: MONDIAL + 'tissu-tisse-teint-rayures-multicolores-rose-vert-316061.html',
      // Un raccord de 13,2 cm, mesuré sur la photo du vendeur, qui montre une règle.
      stripes: [
        ['#195d57', 2.06], ['#97837f', 0.21], ['#9c4d39', 0.21], ['#9a837e', 0.21], ['#9c4c38', 0.19], ['#98817c', 0.21],
        ['#994b37', 0.19], ['#99827e', 0.21], ['#9a4c38', 0.19], ['#9b837e', 0.21], ['#9c4d39', 0.19], ['#98817c', 0.21],
        ['#9a4d3a', 0.19], ['#98827d', 0.19], ['#974c3e', 0.17], ['#ce496b', 0.47], ['#c6b045', 0.45], ['#ce4a6b', 0.45],
        ['#c1ad44', 0.52], ['#1e5a53', 0.33], ['#994731', 0.71], ['#1b5d57', 0.71], ['#9d4966', 0.85], ['#968582', 0.57],
        ['#1a5d57', 1.84], ['#c2ae44', 0.52], ['#994731', 0.97]
      ]
    },
    {
      id: 'cretonne-rhune-orange',
      name: 'Cretonne enduite Rhune orange',
      swatch: '#d0692f',
      width: 155, price: 16.99,
      note: 'Cretonne enduite à larges rayures basques (Mondial Tissus) : jaune, rouge, écru et orange, qualité siège, 155 cm de large, 225 g/m², 78 % coton et 22 % acrylique, 14 000 tours Martindale. 16,99 € le mètre affiché. Largeur des rayures et raccord estimés.',
      url: MONDIAL + 'cretonne-enduite-rhune-orange-358563.html',
      // La photo du vendeur, sans règle, prise comme un raccord entier d'environ 26 cm.
      stripes: [
        ['#e1a94d', 0.21], ['#2b465f', 0.28], ['#bd6434', 0.26], ['#2b4660', 0.28], ['#c36532', 0.31], ['#2b465d', 0.31],
        ['#f3b049', 4.16], ['#2d4a64', 0.31], ['#dad3ce', 0.28], ['#aa383f', 0.61], ['#dbd4ce', 0.28], ['#2b4a65', 0.33],
        ['#ad3740', 4.18], ['#2b4b67', 0.31], ['#f0f8fc', 0.31], ['#ddd6d0', 0.52], ['#f7f6f5', 0.19], ['#b57e2e', 0.61],
        ['#f8f5f1', 0.21], ['#cc6932', 1.06], ['#aa3740', 0.47], ['#2e4864', 0.26], ['#b07e33', 0.26], ['#2b4960', 0.33],
        ['#b37d2f', 0.28], ['#2b4a64', 0.33], ['#d9d4d0', 4.14], ['#2b4a62', 0.31], ['#edb452', 0.26], ['#b47c29', 0.66],
        ['#f1b44f', 0.31], ['#2e4860', 0.31], ['#cc6830', 2.86]
      ]
    },
    {
      id: 'panama-bloc-graphique-vert',
      name: 'Panama bloc graphique vert',
      swatch: '#2f9a5f',
      width: 140, price: 22.99,
      note: 'Toile semi-panama imprimée (Mondial Tissus) : blocs de rayures vertes, rouges et crème, qualité siège, 140 cm de large, 205 g/m², 100 % coton, 18 000 tours Martindale. 22,99 € le mètre affiché. Le vendeur ne donne ni la taille du motif ni son raccord : l\'échelle de l\'aperçu est estimée, et le métrage ne compte aucun raccord.',
      url: MONDIAL + 'toile-semi-panama-digitale-ligne-bloc-graphique-vert-354367.html',
      // Visuel du vendeur, sans règle : largeur estimée à 40 cm.
      image: true,
      tile: [40, 40]
    },
    {
      id: 'bachette-bleu-vert-jaune',
      name: 'Bachette rayure bleu vert jaune',
      swatch: '#27445a',
      width: 148, price: 12.99,
      note: 'Bachette à larges rayures bleu canard et vert, filet orangé (Mondial Tissus) : 148 cm de large, 218 g/m², 100 % coton. 12,99 € le mètre affiché. Vendu pour la déco : il n\'est pas classé « qualité siège ».',
      url: MONDIAL + 'tissu-bachette-rayure-bleu-vert-jaune-361953.html',
      // Un raccord de 10,6 cm, mesuré sur la photo du vendeur, qui montre une règle (la fiche annonce 9 cm).
      stripes: [['#12442b', 2.43], ['#254352', 5.3], ['#12452d', 2.39], ['#c2773e', 0.52]]
    }
  ];

  function byId(id) {
    return list.filter(function (f) { return f.id === id; })[0] || list[0];
  }

  var api = { list: list, byId: byId };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaFabrics = api;
})(typeof self !== 'undefined' ? self : this);
