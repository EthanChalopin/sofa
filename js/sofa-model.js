/*
 * Modèle paramétrique du canapé convertible, d'après OPP Dřevovýroba (Tchécoslovaquie, années 1970),
 * avec une modification personnelle : une seconde inclinaison du dossier (position « détente »),
 * obtenue par une barre traversante qui porte un taquet à deux positions à chaque bout.
 *
 * Unités : centimètres.
 * Repère : x = largeur (0 au centre), y = hauteur depuis le sol, z = profondeur (positif vers l'avant).
 * « d » désigne une distance mesurée depuis le nez (avant) des panneaux latéraux, vers l'arrière.
 *
 * Deux ensembles tournent autour d'un axe parallèle à x :
 *   - « back » : le dossier et ses deux montants, autour des boulons de pivot.
 *     Repère : t = distance au pivot le long du dossier, p = distance au pivot perpendiculairement
 *     au dossier (positif vers la face arrière du dossier).
 *   - « cam » : la barre et ses deux taquets, autour de l'axe de la barre.
 *     Repère : u = le long du taquet (positif vers le nez), v = en travers (positif du côté du manche).
 *
 * Lecture des cotes vendeur : les 87 cm incluent le débord des coussins à l'arrière,
 * les 131 cm vont de l'arrière des panneaux au bord du dossier rabattu.
 *
 * La banquette ne bouge jamais : pour cela le dossier est raccourci par le bas et le pivot déplacé
 * par rapport à l'original. Le lit est donc moins profond que les 131 cm annoncés par le vendeur.
 *
 * Ce fichier ne dépend d'aucune bibliothèque : il décrit les pièces, app.js les dessine.
 * Une pièce « symbolic » est dessinée pour situer la quincaillerie : sa taille à l'écran n'est pas une cote.
 * Quatre rendus, par couches : le bois seul, puis le MDF (pièces layer « mdf »), la mousse (layer « foam »)
 * et enfin le garnissage (layer « cover »). Sous le garnissage, tout ce qu'il enferme est masqué : la mousse,
 * le MDF et les pièces de bois marquées « core ».
 */
(function (root) {
  'use strict';

  var DEG = Math.PI / 180;

  // Cotes données par le vendeur (justchairs.eu) — les seules mesures certaines.
  var LISTING = {
    width: 200,
    depthSofa: 87,
    depthBed: 131,
    height: 81,
    seatHeight: 39
  };

  // Cotes estimées d'après les photos (± 1 à 2 cm). À ajuster ici.
  var EST = {
    plyT: 2,                                              // épaisseur des panneaux latéraux et des montants
    panel: { length: 85, top: 30, endH: 8, lowD: 30, lowH: 9.5 },
    rail: { h: 4.5, t: 2.5, inset: 0.5, top: 28 },
    deck: { t: 1.5 },                                     // hypothèse : non visible sur les photos
    leg: { top: 5, bottom: 3, fromEnd: 26, fromEdge: 1 },
    seat: { t: 11, depth: 85, front: 2, count: 3, radius: 2.5 },
    back: { t: 11, radius: 2.5 },
    pivot: { d: 29.5, h: 16.5, r: 0.8 },                  // pivot de l'original ; la version modifiée le déplace
    peg: { r: 1.5, length: 3 },                           // butée d'origine : rayon et saillie hors du panneau
    screw: { r: 0.6 }
  };

  // Modification personnelle : position « détente ». Cotes de conception, à valider à l'atelier.
  var MOD = {
    width: 196,                                           // LONGUEUR DU CANAPÉ : celle des deux blocs, entre les montants. Tout le reste suit.
    extraLean: 8,                                         // degrés d'inclinaison en plus
    // PROFONDEUR DU BLOC D'ASSISE (85 sur l'original). On ne la raccourcit que par l'arrière : la profondeur utile pour
    // s'asseoir (de l'avant au dossier) ne change pas. En dessous de 80, le bas du dossier dépasse derrière le bloc en canapé.
    seatDepth: 75,
    // PROFONDEUR DU LIT : avec la profondeur du bloc d'assise, elle fixe la hauteur du dossier. Le bord du lit est porté
    // par les pieds amovibles : sa longueur ne fait plus basculer l'assise.
    bedDepth: 120,
    cam: {
      t: 18,                                           // où le taquet touche la queue du montant (distance au pivot) ; règle la hauteur du tube
      flank: 2,                                           // de l'axe au flanc : appui en position détente
      heel: 4.5,                                          // de l'axe au talon
      thick: 3                                            // même épaisseur que le montant qu'il porte
    },
    lever: { length: 15, hub: 2.75, tip: 1.5, t: 1.5 },   // levier de commande, contre le taquet
    bar: { r: 0.8, sleeve: 1.25 },                        // tube d'acier ø 16 de 2 m, dans un fourreau ø 25 à la traversée de la mousse
    pin: { r: 0.6 },                                      // pion de fin de course
    liftMargin: 0.3,                                      // degrés de marge pour dégager le taquet
    bedLeg: { w: 4, t: 3, fromTop: 5, edge: 1.6 },   // pieds amovibles du lit : largeur, épaisseur, axe sous le haut de la tige, vis à cette distance des chants de la tige
    // Montant : stem, largeur de la tige ; below, la tige s'arrête, arrondie, à cette distance sous le haut du dossier ; clear, garde
    // au sol de la pointe de l'accoudoir, en lit. branch : l'accoudoir, une branche qui part de la tige à « from » de sa hauteur,
    // la quitte vers l'avant à « angle » degrés et finit en pointe de rayon tipR, à « tip » du pivot le long du dossier ; elle y
    // arrive en descendant de « slope » degrés en position droite (0 : à plat) ; leave et arrive règlent sa courbure au départ
    // et à la pointe ; le creux entre la branche et le tronc finit en demi-cercle de rayon notch.
    upright: { stem: 6.5, below: 12, clear: 1.5, branch: { from: 0.7, angle: 50, tip: 26, tipR: 2, slope: 0, leave: 0.25, arrive: 0.45, notch: 1.5 } },
    seat: { foam: 16 },                                   // plaque de mousse de l'assise, posée sur le plateau ; le tube de commande passe dans son épaisseur
    // Dossier : un cadre de chevrons posés à plat, une peau de MDF clouée sur chaque face, entre deux plaques de mousse.
    back: { foam: [10, 5], skin: 1, rib: 5, ribW: 7 },     // foam : plaque côté assise, plaque côté couchage
    // Bâti de l'assise : un cadre fermé en tasseaux sous un plateau, et un flanc en contreplaqué de chaque côté.
    frame: {
      beam: 5,                                            // chevron 50 × 70 : épaisseur des longerons et des traverses, posés sur chant
      beamH: 7,                                           // … et leur hauteur
      flank: 2.7,                                         // flancs : planche rabotée 27 × 140
      nose: 5,                                         // chanfrein du coin avant-haut des flancs et des renforts : le bas du dossier passe devant en basculant
      deck: 1.8,                                          // plateau en MDF
      maxPitch: 40,                                       // entraxe maximal des traverses : le MDF demande des appuis rapprochés
      maxLegSpan: 95,                                     // portée maximale d'un longeron entre deux pieds
      legInset: 6,                                        // retrait des pieds d'angle par rapport au bout du cadre
      upright: 3                                          // épaisseur des montants
    },
    // Garnissage : ouate + tissu, une seule housse par bloc. Montants, accoudoirs et taquets restent apparents.
    cover: {
      wad: 1,                                             // ouate, par face garnie
      radius: 3,                                          // arrondi que la ouate donne aux arêtes
      bottom: 10                                          // bas du bloc d'assise : hauteur des pieds du commerce
    }
  };

  // ---------------------------------------------------------------- géométrie 2D

  function arc(cx, cy, r, a0, a1, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
  }

  function quad(p0, c, p1, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var s = i / n, k = 1 - s;
      out.push([k * k * p0[0] + 2 * k * s * c[0] + s * s * p1[0],
                k * k * p0[1] + 2 * k * s * c[1] + s * s * p1[1]]);
    }
    return out;
  }

  // Courbe lisse (Catmull-Rom) passant par tous les points.
  function spline(pts, n) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      for (var k = 0; k < n; k++) {
        var s = k / n, s2 = s * s, s3 = s2 * s;
        out.push([0, 1].map(function (j) {
          return 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 +
                        (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * s3);
        }));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function join(segments) {
    var out = [];
    segments.forEach(function (seg) {
      seg.forEach(function (pt) {
        var last = out[out.length - 1];
        if (!last || Math.abs(last[0] - pt[0]) > 1e-6 || Math.abs(last[1] - pt[1]) > 1e-6) out.push(pt);
      });
    });
    return out;
  }

  function bounds(pts) {
    var b = { min: [Infinity, Infinity], max: [-Infinity, -Infinity] };
    pts.forEach(function (pt) {
      for (var j = 0; j < 2; j++) {
        b.min[j] = Math.min(b.min[j], pt[j]);
        b.max[j] = Math.max(b.max[j], pt[j]);
      }
    });
    return b;
  }

  function round1(v) { return Math.round(v * 10) / 10; }
  function fr(v) { return String(round1(v)).replace('.', ','); }

  // ---------------------------------------------------------------- construction

  function build() {
    var L = LISTING, E = EST, M = MOD;
    var K = M.cover, F = M.frame;
    var P = M.seatDepth;                           // profondeur du bloc d'assise (de ses flancs)
    // Hauteur d'assise finie : l'empilement pieds + tasseau + MDF + mousse + ouate.
    var S = K.bottom + F.beamH + F.deck + M.seat.foam + K.wad;
    // La mécanique se règle sur les enveloppes finies, ouate comprise.
    var boxT = 2 * M.back.skin + M.back.rib;       // caisson du dossier : deux peaux et le cadre
    var backT = M.back.foam[0] + boxT + M.back.foam[1] + 2 * K.wad;          // épaisseur finie du dossier
    var frontD = -K.wad;                           // face avant finie du bloc d'assise
    var foamTop = S - K.wad;                       // dessus de la mousse d'assise
    var deckTop = foamTop - M.seat.foam;           // dessus du plateau

    var xPanelOut = M.width / 2;            // flanc des deux blocs : les montants sont plaqués dessus, à l'extérieur
    var xOut = xPanelOut + F.upright;       // face extérieure des montants
    var xPanelIn = xPanelOut - F.flank;
    var xFrame = xPanelIn - F.beam;         // face intérieure des traverses de bout
    var frameW = 2 * xFrame, fullW = 2 * xPanelIn;   // entre les traverses de bout ; entre les deux flancs
    // Nombres de pièces déduits de la longueur du canapé.
    var nCross = Math.max(1, Math.ceil((fullW - F.beam) / F.maxPitch) - 1);          // traverses intermédiaires de l'assise
    var nRibs = Math.max(1, Math.ceil((M.width - M.back.ribW) / F.maxPitch) - 1);    // entretoises intermédiaires du dossier
    var legReach = xPanelIn - F.legInset, legBays = Math.max(1, Math.ceil(2 * legReach / F.maxLegSpan));
    var legPitch = 2 * legReach / legBays;         // portée d'un longeron entre deux pieds
    var z = function (d) { return P / 2 - d; };

    // --- Géométrie d'origine : pivot relevé sur les photos, inclinaison déduite de la hauteur annoncée ---
    var tTop0 = E.pivot.d + L.depthBed - E.panel.length;
    var pFront0 = L.seatHeight - E.pivot.h - E.back.t;
    var lean = Math.acos((L.height - E.pivot.h) / Math.hypot(tTop0, pFront0)) - Math.atan2(pFront0, tTop0);
    var leanLounge = lean + M.extraLean * DEG;

    // --- Pivot de la version modifiée ---
    // Le dossier reste un bloc rigide, coupé droit. Il est raccourci par le bas, juste assez pour que son
    // arête arrière affleure la banquette en position détente, et le pivot est déplacé pour que, dossier
    // rabattu, ce bas arrive contre la banquette, qui ne bouge jamais.
    // Deux conditions fixent la position du pivot : (1) en lit, le bas du dossier s'arrête sur l'avant des
    // coussins ; (2) en position droite, le dossier reste exactement là où il est sur l'original.
    function cutAt(hp) {                            // bas du dossier : son arête arrière au niveau de l'assise, en détente
      return (S - hp) * (1 + Math.sin(leanLounge)) / Math.cos(leanLounge);
    }
    function pivotFor(hp) {
      return { d: frontD + cutAt(hp), h: hp, pF: S - hp - backT };
    }
    // Position de la face avant du dossier, en position droite.
    function facePlane(pivot, pF) { return pivot.d * Math.cos(lean) - pivot.h * Math.sin(lean) + pF; }
    function solvePivot() {
      var target = facePlane(E.pivot, pFront0), low = 0, high = S - E.back.t;
      for (var k = 0; k < 50; k++) {
        var trial = pivotFor((low + high) / 2);
        if (facePlane(trial, trial.pF) > target) low = trial.h; else high = trial.h;
      }
      return pivotFor((low + high) / 2);
    }
    var pv = solvePivot();
    // Les cotes relevées sur les photos partent de l'ancien pivot : (shiftT, shiftP) les ramène au nouveau.
    var shiftT = (E.pivot.d - pv.d) * Math.sin(lean) + (E.pivot.h - pv.h) * Math.cos(lean);
    var shiftP = (E.pivot.d - pv.d) * Math.cos(lean) - (E.pivot.h - pv.h) * Math.sin(lean);

    // --- Ensemble pivotant ---
    // En position lit le dossier est à plat devant l'assise, à la même hauteur qu'elle,
    // et le coin des accoudoirs reste juste au-dessus du sol.
    // Haut du dossier : là où il est sur l'original, ou plus haut si une profondeur de lit est demandée.
    var tTop = M.bedDepth ? M.bedDepth - P - K.wad + pv.d : tTop0 + shiftT;
    var pRear = S - pv.h;               // face arrière du dossier (dessus du couchage en lit)
    var pFront = pRear - backT;
    var pCore = pFront + K.wad + M.back.foam[0];   // face avant du caisson du dossier
    var pFoot = -pv.h;                             // niveau du sol, en lit

    // Position (d, hauteur) d'un point de l'ensemble pivotant, dossier incliné de « a ».
    function place(t, p, a) {
      return [pv.d + t * Math.sin(a) + p * Math.cos(a), pv.h + t * Math.cos(a) - p * Math.sin(a)];
    }

    // --- Dossier : un bloc rigide, coupé droit ---
    var tBottom = cutAt(pv.h);
    var backH = tTop - tBottom;
    var backCoreH = backH - 2 * K.wad, tMid = (tBottom + tTop) / 2;
    // Jour entre l'assise et le bas du dossier : [arête avant, arête arrière], dans chaque position assise.
    var gapUpright = [pFront, pRear].map(function (p) { return place(tBottom, p, lean)[1] - S; });
    var gapLounge = place(tBottom, pFront, leanLounge)[1] - S;
    var bedDepth = tTop - pv.d + P + K.wad;               // du bord du dossier rabattu à l'arrière du bloc d'assise
    var sofaTop = place(tTop, pFront, lean)[1];                        // hauteur hors tout en canapé

    // Contour du montant, en branches. La queue part du boulon, droite (le taquet appuie sur son chant arrière), et
    // rejoint la tige, vissée au dossier, qui s'arrête en arrondi sous le haut du dossier. De la tige se détache une
    // branche courbe, l'accoudoir : elle descend vers l'avant puis file à plat, au niveau de l'assise, jusqu'à une pointe arrondie.
    // Entre la branche et la queue, le montant est évidé. Points [t, p].
    var capR = 2.6, Y = M.upright, B = Y.branch;
    // La tige est vissée dans le cadre du dossier : son chant arrière affleure la face arrière du cadre.
    var frameRear = pCore + M.back.skin + M.back.rib;
    var yRear = frameRear, yFront = yRear - Y.stem, yTop = tTop - K.wad - Y.below, yMid = (yFront + yRear) / 2;
    // Le chant arrière de la queue (sur lequel appuie le taquet) va du boulon au coude, en ligne droite.
    var kink = [40.4 + shiftT, yRear];
    var aRear = Math.atan2(kink[1], kink[0]) - Math.asin(capR / Math.hypot(kink[0], kink[1]));
    var tailRearDir = [Math.cos(aRear), Math.sin(aRear)];
    var capStart = [capR * Math.cos(aRear + Math.PI / 2), capR * Math.sin(aRear + Math.PI / 2)];
    // Chant avant de la queue : parallèle au chant arrière, tangent au bout arrondi côté avant.
    var tailN = [Math.sin(aRear), -Math.cos(aRear)];                     // vers l'avant de la queue
    var capFront = [capR * tailN[0], capR * tailN[1]];
    function bezier(p0, p1, p2, p3, n) {
      var out = [];
      for (var i = 0; i <= n; i++) {
        var s = i / n, k = 1 - s;
        out.push([0, 1].map(function (j) {
          return k * k * k * p0[j] + 3 * k * k * s * p1[j] + 3 * k * s * s * p2[j] + s * s * s * p3[j];
        }));
      }
      return out;
    }
    // Chant avant du tronc (queue puis tige) : celui de la queue jusqu'en J, où il rejoint celui de la tige, droit jusqu'en haut.
    var sJ = (yFront - capFront[1]) / tailRearDir[1];
    var J = [capFront[0] + sJ * tailRearDir[0], yFront];
    function inTrunk(q) {                          // > 0 : le point est dans la matière du tronc
      var behindTail = -((q[0] - capFront[0]) * tailN[0] + (q[1] - capFront[1]) * tailN[1]);
      return q[0] < J[0] ? behindTail : Math.max(behindTail, q[1] - yFront);
    }
    // Branche : son axe part du milieu de la tige, à B.from de sa hauteur au-dessus du bas du dossier, la quitte vers
    // l'avant en faisant l'angle B.angle avec elle, puis se courbe jusqu'au centre de la pointe. En lit, la pointe est le
    // point le plus bas du montant : elle reste à Y.clear du sol. Sa largeur passe de celle de la tige à celle de la pointe.
    var pMin = pFoot + Y.clear;
    var tipC = [B.tip, pMin + B.tipR];
    // La branche arrive à la pointe vers l'avant, en descendant de B.slope degrés en position droite.
    var tipDir = [-Math.sin(lean) * Math.cos(B.slope * DEG) - Math.cos(lean) * Math.sin(B.slope * DEG), -Math.cos(lean) * Math.cos(B.slope * DEG) + Math.sin(lean) * Math.sin(B.slope * DEG)];
    var start = [tBottom + B.from * (yTop - tBottom), yMid];
    var reach = Math.hypot(start[0] - tipC[0], start[1] - tipC[1]);
    var leaveDir = [-Math.cos(B.angle * DEG), -Math.sin(B.angle * DEG)];
    var axisPts = bezier(start, [start[0] + B.leave * reach * leaveDir[0], start[1] + B.leave * reach * leaveDir[1]],
                         [tipC[0] - B.arrive * reach * tipDir[0], tipC[1] - B.arrive * reach * tipDir[1]], tipC, 60);
    var upper = [], lower = [];
    axisPts.forEach(function (c, i) {
      var a = axisPts[Math.max(0, i - 1)], b = axisPts[Math.min(axisPts.length - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty);
      var n = [-ty / l, tx / l], half = (Y.stem + (2 * B.tipR - Y.stem) * i / (axisPts.length - 1)) / 2;   // n : côté du dessus
      upper.push([c[0] + half * n[0], c[1] + half * n[1]]);
      lower.push([c[0] - half * n[0], c[1] - half * n[1]]);
    });
    // Où un chant de la branche sort du tronc : le point (interpolé) et l'indice du premier point dehors.
    function leaveTrunk(edge) {
      var i = 1;
      while (i < edge.length && inTrunk(edge[i]) > 0) i++;
      var a = edge[i - 1], b = edge[i];
      for (var it = 0; it < 40; it++) {
        var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (inTrunk(m) > 0) a = m; else b = m;
      }
      return { at: a, i: i };
    }
    function past(edge, from, q, dist) {           // premier indice, à partir de from, à plus de dist de q
      var i = from;
      while (i < edge.length - 1 && Math.hypot(edge[i][0] - q[0], edge[i][1] - q[1]) < dist) i++;
      return i;
    }
    // Dessous de la branche : il sort du tronc dans un creux étroit, qui finit en demi-cercle de rayon B.notch (un trou
    // percé à la scie cloche, puis deux traits de scie sauteuse). Le centre du trou est à B.notch du tronc et de la branche.
    var crotch = leaveTrunk(lower).at, r = B.notch, prev = null, centre, side, j;
    for (j = 1; j < lower.length - 1; j++) {
      var tx = axisPts[j + 1][0] - axisPts[j - 1][0], ty = axisPts[j + 1][1] - axisPts[j - 1][1], tl = Math.hypot(tx, ty);
      var cand = [lower[j][0] + r * ty / tl, lower[j][1] - r * tx / tl];   // à r sous la branche
      var gap = -inTrunk(cand) - r;                                         // > 0 : à plus de r du tronc
      if (gap >= 0 && prev) {
        var f = prev.gap / (prev.gap - gap);
        centre = [prev.c[0] + f * (cand[0] - prev.c[0]), prev.c[1] + f * (cand[1] - prev.c[1])];
        side = [lower[j - 1][0] + f * (lower[j][0] - lower[j - 1][0]), lower[j - 1][1] + f * (lower[j][1] - lower[j - 1][1])];
        break;
      }
      prev = { c: cand, gap: gap };
    }
    var behind = (centre[0] - capFront[0]) * tailN[0] + (centre[1] - capFront[1]) * tailN[1];
    var onTail = centre[0] < J[0] || behind < yFront - centre[1];
    var foot = onTail ? [centre[0] - r * tailN[0], centre[1] - r * tailN[1]] : [centre[0], yFront];
    var a0 = Math.atan2(foot[1] - centre[1], foot[0] - centre[0]);
    var sweep = Math.atan2(side[1] - centre[1], side[0] - centre[0]) - a0;
    sweep = ((sweep % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);        // dans le sens direct…
    var midA = a0 + sweep / 2;
    if ((crotch[0] - centre[0]) * Math.cos(midA) + (crotch[1] - centre[1]) * Math.sin(midA) < 0) sweep -= 2 * Math.PI;   // …ou l'autre, côté fond du creux
    var footS = onTail ? (foot[0] - capFront[0]) * tailRearDir[0] + (foot[1] - capFront[1]) * tailRearDir[1] : sJ + foot[0] - J[0];
    // Dessus de la branche : il quitte le chant avant de la tige par un arrondi.
    var top = leaveTrunk(upper), joint = top.at;
    var u = past(upper, top.i, joint, 4);
    var aTip = Math.atan2(-tipDir[0], tipDir[1]);                       // direction du dessous de la branche, à la pointe
    var stemR = Y.stem / 2;
    var uprightOutline = join([
      arc(0, 0, capR, aRear + Math.PI / 2, aRear + 1.5 * Math.PI, 16),                    // bout arrondi autour du boulon
      footS > sJ ? [J, foot] : [foot],                                                      // chant avant du tronc
      arc(centre[0], centre[1], r, a0, a0 + sweep, 12),                                     // fond du creux
      lower.slice(j),
      arc(tipC[0], tipC[1], B.tipR, aTip, aTip + Math.PI, 12),                              // pointe
      upper.slice(u).reverse(),                                                             // dessus de la branche : l'accoudoir
      quad(upper[u], joint, [joint[0] + 4, yFront], 6),                                     // arrondi sous la tige
      arc(yTop - stemR, yMid, stemR, -Math.PI / 2, Math.PI / 2, 16),                        // haut de la tige
      quad([kink[0] + 4.5, yRear], kink,                                                    // coude
           [kink[0] - 5 * tailRearDir[0], kink[1] - 5 * tailRearDir[1]], 8),
      [capStart]
    ]);
    uprightOutline.pop();                          // le contour se referme tout seul
    var ub = bounds(uprightOutline);
    // L'accoudoir en canapé : hauteur du dessus de la branche là où elle quitte le dossier, et de sa pointe.
    var armHigh = place(joint[0], joint[1], lean)[1], armTip = place(tipC[0], tipC[1], lean)[1] + B.tipR;

    // --- Pieds amovibles du lit ---
    // Un pied en hêtre par côté, vissé en position lit sur l'extérieur de la tige du montant, près du bord du lit :
    // ce bord n'est plus en porte-à-faux. Deux vis à bouton le serrent dans deux inserts filetés de la tige, une près
    // de chaque chant. En canapé on dévisse les boutons et on range les pieds. Points [t, p] ; en lit le pied est vertical.
    var G = M.bedLeg, legT = yTop - G.fromTop;
    var legScrews = [yRear - G.edge, yFront + G.edge];   // p des deux vis
    var legOutline = arc(legT, legScrews[0], G.w / 2, 0, Math.PI, 12)                       // bout arrondi autour de la vis du haut
      .concat([[legT - G.w / 2, pFoot], [legT + G.w / 2, pFoot]]);
    var legLen = legScrews[0] + G.w / 2 - pFoot;
    var legFootD = pv.d - legT;                    // pied au sol, en lit

    // --- Barre à taquets ---
    // Le chant arrière de la queue du montant est une droite. L'axe de la barre est placé à « flank » sous
    // cette droite en position détente : le montant repose alors sur le flanc du taquet couché. En position
    // droite la droite est plus haute, et le montant repose sur le nez du taquet relevé.
    var C = M.cam;
    var edgeP = function (t) { return capStart[1] + (t - capStart[0]) * tailRearDir[1] / tailRearDir[0]; };
    var axis = place(C.t - C.flank * tailRearDir[1], edgeP(C.t) + C.flank * tailRearDir[0], leanLounge);
    // Distance de l'axe de la barre au chant du montant, dossier incliné de « a ».
    function edgeDist(a) {
      var p0 = place(capStart[0], capStart[1], a);
      return Math.abs((axis[0] - p0[0]) * Math.cos(a + aRear) - (axis[1] - p0[1]) * Math.sin(a + aRear));
    }
    var normal = function (a) { return Math.PI - (a + aRear); };       // direction de l'axe vers le chant du montant
    var nose = edgeDist(lean);                                         // de l'axe au bout du nez
    var corner = Math.hypot(nose, C.flank), cornerA = Math.atan2(C.flank, nose);
    var camEngaged = normal(lean);                                     // direction du nez, taquet relevé
    var camRetracted = normal(leanLounge) + Math.PI / 2;               // taquet couché le long du montant
    // Pour tourner, le taquet relevé doit dégager son coin : le dossier se soulève jusqu'à leanLift.
    var lo = lean - 6 * DEG, hi = lean;
    for (var i = 0; i < 40; i++) {
      var mid = (lo + hi) / 2;
      if (edgeDist(mid) > corner) lo = mid; else hi = mid;
    }
    var leanLift = lo - M.liftMargin * DEG;
    // Quand on redresse le dossier, le taquet rappelé par son manche suit le montant, un coin en appui dessus.
    function camFollow(a) { return normal(a) + cornerA + Math.acos(Math.min(1, edgeDist(a) / corner)); }
    var follow = [];
    for (i = 0; i <= 24; i++) {
      var a = leanLounge + (leanLift - leanLounge) * i / 24;
      follow.push([-a, camFollow(a)]);
    }

    var camLen = nose + C.heel;
    var camOutline = [[nose, -C.flank], [nose, C.flank], [-C.heel, C.flank], [-C.heel, -C.flank]];
    // Levier : calé sur le bout de la barre, à l'opposé du nez. Son poids rappelle le taquet en position relevée.
    var V = M.lever;
    var leverOutline = join([arc(0, 0, V.hub, -Math.PI / 2, Math.PI / 2, 10), arc(-V.length, 0, V.tip, Math.PI / 2, 1.5 * Math.PI, 8)]);
    // Position (d, hauteur) d'un point du taquet, nez orienté selon « phi ».
    function camPoint(u, v, phi) {
      return [axis[0] + u * Math.cos(phi) - v * Math.sin(phi), axis[1] + u * Math.sin(phi) + v * Math.cos(phi)];
    }
    // Pion de fin de course : un seul par côté. Il est placé là où le flanc du taquet vient le toucher
    // dans ses deux positions extrêmes, relevé comme couché.
    var pinK = C.flank + M.pin.r;
    var pin = camPoint(-pinK * Math.tan((camRetracted - camEngaged) / 2), pinK, camEngaged);
    var xLever = xPanelOut + C.thick;              // le levier est plaqué contre le taquet
    var xBarEnd = xPanelOut + C.thick - 1;         // le tube s'arrête dans le taquet : il tient dans 2 m

    // Repère de l'ensemble « back » : (x, y, z) = (x, t, -p) ; de l'ensemble « cam » : (x, y, z) = (x, v, -u).
    var local = function (pt) { return [-pt[1], pt[0]]; };
    var uprightPts = uprightOutline.map(local);
    var backPts = [[tBottom, pFront], [tTop, pFront], [tTop, pRear], [tBottom, pRear]].map(local);
    var toCam = function (pt) { return [-pt[0], pt[1]]; };
    var camPts = camOutline.map(toCam), leverPts = leverOutline.map(toCam);

    var toBase = function (pt) { return [z(pt[0]), pt[1]]; };
    // Panneaux latéraux rectangulaires, arasés au niveau du plateau : le coussin passe par-dessus.
    var panelTop = 2 * (deckTop - F.deck) - K.bottom;   // deux tasseaux empilés : la traverse de bout et son renfort
    // Le coin avant-haut est abattu : en basculant vers le lit, le bas du dossier descend juste devant.
    function nosed(low) {
      var corner = F.nose > 0 ? [[0, panelTop - F.nose], [F.nose, panelTop]] : [[0, panelTop]];
      return corner.concat([[P, panelTop], [P, low], [0, low]]).map(toBase);
    }
    var panelPts = nosed(K.bottom);

    var beamT = F.beam, beamH = deckTop - F.deck - K.bottom, beamY = K.bottom + beamH / 2;   // section et hauteur d'axe des poutres du cadre
    var legXs = Array.apply(null, { length: legBays + 1 }).map(function (unused, i) { return -legReach + i * legPitch; });
    var barPitch = (fullW - beamT) / (nCross + 1);   // entraxe des traverses du cadre
    var sleeveTop = axis[1] + M.bar.sleeve;        // dessus du fourreau de la tige
    // Profondeur d'assise : de l'avant des coussins à la face avant du dossier, au niveau de l'assise.
    var seatUsable = Math.round(place((S - pv.h + pFront * Math.sin(lean)) / Math.cos(lean), pFront, lean)[0] - frontD);
    var screwTs = [tBottom + 4, (tBottom + yTop - G.fromTop) / 2, yTop - G.fromTop - 4];   // la vis du haut sous les inserts des pieds
    // Les vis se placent au milieu de la partie du cadre que le montant recouvre.
    var screwP = (Math.max(pCore + M.back.skin, yFront) + Math.min(pCore + boxT - M.back.skin, yRear)) / 2;
    var xWide = xOut;                              // les montants sont ce qu'il y a de plus large
    var loungeTop = place(tTop, pFront, leanLounge)[1];
    var rearD = P + K.wad;            // face arrière finie du bloc d'assise
    var loungeRear = Math.max(rearD, place(tTop, pRear, leanLounge)[0]);
    var swing = (camRetracted - camEngaged) / DEG;

    function mirror(make) { return [make(1), make(-1)]; }
    function span(sign, a, b) { return sign > 0 ? { x0: a, x1: b } : { x0: -b, x1: -a }; }

    var parts = [
      {
        id: 'upright', group: 'back', color: 'mahogany', qty: 2,
        name: 'Montant',
        size: [round1(ub.max[0] - ub.min[0]), round1(ub.max[1] - ub.min[1]), F.upright],
        material: 'Contreplaqué bouleau 30 mm (deux épaisseurs de 15 collées), teinté',
        dims: [
          ['Encombrement — longueur', round1(ub.max[0] - ub.min[0]), 'p'],
          ['Encombrement — largeur', round1(ub.max[1] - ub.min[1]), 'p'],
          ['Épaisseur', F.upright, 'm'],
          ['Pivot → sommet', round1(yTop), 'm'],
          ['Largeur de la tige (le long du dossier)', Y.stem, 'm'],
          ['Accoudoir : dessus, là où il quitte la tige, depuis le sol, en canapé', round1(armHigh), 'm'],
          ['Accoudoir : dessus de la partie à plat, depuis le sol, en canapé', round1(armTip), 'm'],
          ['Accoudoir : largeur de la branche', fr(Y.stem) + ' → ' + fr(2 * B.tipR) + ' cm', 'm'],
          ['Garde au sol de la pointe, en lit', Y.clear, 'm'],
          ['Haut de la tige, sous le haut du dossier', round1(tTop - yTop), 'm'],
          ['Rayon du bout arrondi', capR, 'p'],
          ['Fond du creux sous l\'accoudoir : trou de', fr(2 * B.notch * 10) + ' mm', 'm']
        ],
        note: 'Pièce clé du mécanisme. La queue est boulonnée au panneau latéral, la tige est vissée au dossier (3 vis). ' +
              'La tige s\'arrête en demi-cercle, ' + fr(tTop - yTop) + ' cm sous le haut du dossier. De la tige se détache ' +
              'une branche courbe, l\'accoudoir (chant de 3 cm, poncé et arrondi) : elle descend vers l\'avant puis file ' +
              'à plat, au niveau de l\'assise, jusqu\'à une pointe arrondie. Entre la branche et le tronc, le montant est évidé : ' +
              'un trou de ' + fr(2 * B.notch * 10) + ' mm à la scie cloche au fond du creux, puis deux traits de scie sauteuse. Le chant ' +
              'arrière de la queue, bien droit, repose sur le taquet : sur son nez en position droite, sur son flanc en ' +
              'position détente. En lit la pointe de la branche passe à ' + fr(Y.clear) + ' cm du sol, sans le toucher. ' +
              'Deux inserts filetés M8, en haut de la tige, reçoivent les vis des pieds amovibles. ' +
              'Le pivot étant déplacé, la queue est plus courte que sur l\'original : ' + fr(Math.hypot(kink[0], kink[1])) +
              ' cm du boulon au coude, au lieu de 46.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelOut, xOut);
          return { type: 'profile', pts: uprightPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'backFrame', group: 'back', color: 'honey', qty: 1, core: true,
        name: 'Cadre du dossier',
        cuts: [
          { stock: 'chevron', length: 2 * xPanelOut, qty: 2, label: 'Longeron de dossier' },
          { stock: 'chevron', length: backCoreH - 2 * M.back.ribW, qty: nRibs + 2, label: 'Entretoise de dossier' }
        ],
        size: [2 * xPanelOut, round1(backCoreH), M.back.rib],
        material: 'Même chevron 50 × 70 mm que l\'assise, posé à plat',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Hauteur', round1(backCoreH), 'm'],
          ['Épaisseur', M.back.rib, 'm'],
          ['2 longerons', fr(2 * xPanelOut) + ' cm', 'm'],
          [(nRibs + 2) + ' entretoises', fr(backCoreH - 2 * M.back.ribW) + ' cm', 'm'],
          ['Entraxe des entretoises', round1((2 * xPanelOut - M.back.ribW) / (nRibs + 1)), 'm']
        ],
        note: 'Deux longerons et des entretoises, assemblés en échelle. Posés à plat, les deux longerons portent ' +
              'seuls le dossier : les peaux de MDF étant clouées et non collées, elles ne participent pas à sa ' +
              'raideur. En lit, ce cadre franchit les 196 cm entre les deux montants. Les montants se vissent dans ' +
              'les entretoises de bout.',
        shapes: [tBottom + K.wad + M.back.ribW / 2, tTop - K.wad - M.back.ribW / 2].map(function (t) {
          return { type: 'box', size: [2 * xPanelOut, M.back.ribW, M.back.rib], center: [0, t, -(pCore + boxT / 2)] };
        }).concat(Array.apply(null, { length: nRibs + 2 }).map(function (unused, i) {
          var reach = xPanelOut - M.back.ribW / 2;
          return {
            type: 'box', size: [M.back.ribW, backCoreH - 2 * M.back.ribW, M.back.rib],
            center: [-reach + i * 2 * reach / (nRibs + 1), tMid, -(pCore + boxT / 2)]
          };
        }))
      },
      {
        id: 'backSkin', group: 'back', color: 'deck', qty: 2, core: true, layer: 'mdf',
        name: 'Peau du dossier',
        cuts: [{ stock: 'mdf10', length: 2 * xPanelOut, width: backCoreH, qty: 2, label: 'Peau de dossier' }],
        size: [2 * xPanelOut, round1(backCoreH), M.back.skin],
        material: 'MDF 10 mm, cloué sur le cadre',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Hauteur', round1(backCoreH), 'm'],
          ['Épaisseur', M.back.skin, 'm'],
          ['Cadre + 2 peaux', round1(boxT), 'm']
        ],
        note: 'Une peau clouée sur chaque face du cadre : c\'est sur elles qu\'on colle la mousse. Elles ne portent ' +
              'que sur ' + fr(backCoreH - 2 * M.back.ribW) + ' cm entre les deux longerons. Clouées, elles ne raidissent pas le ' +
              'dossier ; collées en plein, elles permettraient un cadre plus mince et donc plus de mousse.',
        shapes: [pCore + M.back.skin / 2, pCore + boxT - M.back.skin / 2].map(function (pp) {
          return { type: 'box', size: [2 * xPanelOut, backCoreH, M.back.skin], center: [0, tMid, -pp] };
        })
      },
      {
        id: 'backFoam', group: 'back', color: 'foam', qty: 2, layer: 'foam',
        name: 'Mousse du dossier',
        size: [2 * xPanelOut, round1(backCoreH), M.back.foam[0] + M.back.foam[1]],
        material: 'Deux plaques de mousse, collées sur les peaux de MDF',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Hauteur', round1(backCoreH), 'm'],
          ['Plaque côté assise', M.back.foam[0], 'm'],
          ['Plaque côté couchage', M.back.foam[1], 'm'],
          ['Bloc bois + mousse', round1(M.back.foam[0] + boxT + M.back.foam[1]), 'm']
        ],
        note: 'Les épaisseurs se règlent dans MOD.back : ' +
              'ce qu\'on donne au cadre est pris à la mousse.',
        shapes: [
          { type: 'box', size: [2 * xPanelOut, backCoreH, M.back.foam[0]], center: [0, tMid, -(pCore - M.back.foam[0] / 2)] },
          { type: 'box', size: [2 * xPanelOut, backCoreH, M.back.foam[1]], center: [0, tMid, -(pCore + boxT + M.back.foam[1] / 2)] }
        ]
      },
      {
        id: 'backCover', group: 'back', color: 'fabric', qty: 1, layer: 'cover',
        name: 'Garnissage du dossier',
        size: [2 * xPanelOut, round1(backH), round1(backT)],
        material: 'Ouate + tissu, une seule housse',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Hauteur finie', round1(backH), 'm'],
          ['Épaisseur finie', round1(backT), 'm'],
          ['Ouate, par face', K.wad, 'm'],
          ['Inclinaison en position droite', fr(lean / DEG) + '°', 'p'],
          ['Inclinaison en position détente', fr(leanLounge / DEG) + '°', 'm'],
          ['Jour sous le dossier, position droite', fr(gapUpright[1]) + ' à ' + fr(gapUpright[0]) + ' cm', 'm'],
          ['Jour sous le dossier, détente', '0 à ' + fr(gapLounge) + ' cm', 'm']
        ],
        note: 'La ouate adoucit les arêtes des plaques, le tissu enveloppe le tout sauf les deux bouts, plaqués contre ' +
              'les montants. La mécanique est réglée sur ces cotes finies : en détente l\'arête arrière affleure ' +
              'l\'assise, en lit le bas vient contre le bloc d\'assise.',
        shapes: [{ type: 'box', size: [2 * xPanelOut, backH, backT], radius: K.radius, center: [0, tMid, -(pFront + pRear) / 2] }]
      },
      {
        id: 'bedLeg', group: 'back', color: 'padwood', qty: 2, bedOnly: true,
        name: 'Pied amovible du lit',
        size: [round1(legLen), G.w, G.t],
        material: 'Hêtre massif 40 × 30 mm, teinté, patin feutre sous le bout',
        dims: [
          ['Longueur (du bout arrondi au sol)', round1(legLen), 'm'],
          ['Largeur', G.w, 'm'],
          ['Épaisseur', G.t, 'm'],
          ['Axe, sous le haut de la tige', G.fromTop, 'm'],
          ['Entraxe des deux vis', round1(legScrews[0] - legScrews[1]), 'm'],
          ['Distance au bord du lit', round1(tTop - legT), 'm']
        ],
        note: 'Ne sert qu\'en lit. On rabat le dossier, on présente le pied contre l\'extérieur du montant, en haut de ' +
              'la tige, et on le serre par deux vis à bouton dans les inserts du montant : il descend droit jusqu\'au sol ' +
              'et porte le bord du lit, qui n\'est plus en porte-à-faux. On peut s\'y asseoir sans que l\'assise se ' +
              'soulève. En canapé on dévisse les boutons et on range les pieds. Couper à la longueur qui touche le sol ' +
              '(patin feutre compris), dossier rabattu.',
        shapes: mirror(function (s) {
          var sp = span(s, xOut, xOut + G.t);
          return { type: 'profile', pts: legOutline.map(local), x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'legScrew', group: 'back', color: 'metal', qty: 4, bedOnly: true,
        name: 'Vis à bouton des pieds',
        cuts: [{ stock: 'knob', qty: 4 }, { stock: 'insert', qty: 4 }],
        material: 'Vis à bouton étoile M8 × 50 ; insert fileté M8 à visser dans le bois',
        dims: [
          ['Par pied', '2 vis', 'm'],
          ['Sous le haut de la tige', G.fromTop, 'm'],
          ['Des chants de la tige', G.edge, 'm']
        ],
        note: 'Les inserts sont vissés une fois pour toutes dans l\'extérieur de la tige du montant ; rien ne dépasse ' +
              'en canapé. Les boutons se serrent à la main : aucun outil pour monter ou ranger les pieds.',
        shapes: [1, -1].reduce(function (acc, s) {
          var sp = span(s, xOut - 2, xOut + G.t + 0.6);
          return acc.concat(legScrews.map(function (p) {
            return { type: 'cylinder', r: 0.4, x0: sp.x0, x1: sp.x1, y: legT, z: -p };
          }));
        }, [])
      },
      {
        id: 'screw', group: 'back', color: 'metal', qty: 6, symbolic: true,
        name: 'Vis montant → dossier',
        material: 'Vis à tête fendue',
        dims: [
          ['Par montant', '3 vis', 'p'],
          ['Entraxe', round1(screwTs[1] - screwTs[0]), 'm'],
          ['Du chant arrière du montant', round1(yRear - screwP), 'm']
        ],
        note: 'Alignées au milieu de la partie du cadre que le montant recouvre. Elles solidarisent le dossier et les deux montants.',
        shapes: [1, -1].reduce(function (acc, s) {
          return acc.concat(screwTs.map(function (t) {
            var sp = span(s, xOut, xOut + 0.3);
            return { type: 'cylinder', r: E.screw.r, x0: sp.x0, x1: sp.x1, y: t, z: -screwP };
          }));
        }, [])
      },
      {
        id: 'seatFoam', group: 'base', color: 'foam', qty: 1, layer: 'foam',
        name: 'Mousse d\'assise',
        size: [2 * xPanelOut, P, M.seat.foam],
        material: 'Plaque de mousse, posée sur le plateau',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Profondeur', P, 'm'],
          ['Épaisseur', M.seat.foam, 'm'],
          ['Entaille à chaque bout', fr(F.flank + beamT) + ' × ' + fr(panelTop - deckTop) + ' cm', 'm'],
          ['Saignée dessous, pour le fourreau', 'ø ' + fr(2 * M.bar.sleeve) + ' cm, à ' + fr(axis[1] - deckTop) + ' cm du plateau', 'm']
        ],
        note: 'Une seule plaque. Elle est entaillée à chaque bout pour coiffer le haut des panneaux, et rainurée ' +
              'dessous d\'une saignée pour le fourreau de la tige ; elle est collée sur le plateau. La profondeur utile devant le ' +
              'dossier est d\'environ ' + seatUsable + ' cm.',
        shapes: [
          { type: 'box', size: [frameW, panelTop - deckTop, P], center: [0, (panelTop + deckTop) / 2, z(P / 2)] },
          { type: 'box', size: [2 * xPanelOut, foamTop - panelTop, P], center: [0, (foamTop + panelTop) / 2, z(P / 2)] }
        ]
      },
      {
        id: 'seatCover', group: 'base', color: 'fabric', qty: 1, layer: 'cover',
        name: 'Garnissage de l\'assise',
        size: [2 * xPanelOut, P + 2 * K.wad, S - K.bottom],
        material: 'Ouate + tissu, une seule housse du socle au dessus',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Profondeur finie', P + 2 * K.wad, 'm'],
          ['Hauteur', S - K.bottom, 'm'],
          ['Dessus par rapport au sol', S, 'v'],
          ['Ouate', K.wad, 'm']
        ],
        note: 'Le même tissu descend d\'un seul tenant du dessus de la mousse jusqu\'au bas du socle : l\'assise se lit ' +
              'comme un bloc. Ouate sur le dessus, l\'avant et l\'arrière ; sur les flancs le tissu est tendu à même ' +
              'les panneaux, pour laisser le montant et le taquet travailler (une rondelle sous chacun).',
        shapes: [{
          type: 'box', size: [2 * xPanelOut, S - K.bottom, P + 2 * K.wad], radius: K.radius,
          center: [0, (S + K.bottom) / 2, z(P / 2)]
        }]
      },
      {
        id: 'panel', group: 'base', color: 'honey', qty: 2, core: true,
        name: 'Panneau latéral',
        cuts: [{ stock: 'plank', length: P, qty: 2, label: 'Flanc' }],
        size: [P, panelTop - K.bottom, F.flank],
        material: 'Planche de sapin rabotée 27 × 140 mm',
        dims: [
          ['Longueur', P, 'm'],
          ['Hauteur', panelTop - K.bottom, 'm'],
          ['Épaisseur', F.flank, 'p'],
          ['Chant supérieur par rapport au sol', panelTop, 'm'],
          ['Dépassement au-dessus du plateau', round1(panelTop - deckTop), 'm'],
          ['Chanfrein du coin avant-haut', fr(F.nose) + ' × ' + fr(F.nose) + ' cm', 'm'],
          ['Perçage de la tige', 'ø ' + fr(2 * M.bar.r + 0.2) + ' cm', 'm']
        ],
        note: 'Simple planche, collée et vissée sur la traverse de bout et sur son renfort : c\'est le flanc ' +
              'du bloc d\'assise, et la face sur laquelle travaillent le montant et le taquet. Il reçoit le boulon ' +
              'de pivot, la tige (perçage large, elle doit tourner librement) et le pion de fin de course. ' +
              'La mousse le coiffe, le tissu de l\'assise le recouvre. Son coin avant-haut est abattu, comme celui du ' +
              'renfort : le bas du dossier descend juste devant quand on le rabat en lit.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelIn, xPanelOut);
          return { type: 'profile', pts: panelPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'brace', group: 'base', color: 'honey', qty: 2, core: true,
        name: 'Renfort de pivot',
        cuts: [{ stock: 'chevron', length: P, qty: 2, label: 'Renfort de pivot' }],
        size: [P, beamH, beamT],
        material: 'Même chevron que le cadre, posé sur chant sur la traverse de bout',
        dims: [
          ['Longueur', P, 'm'],
          ['Hauteur', beamH, 'm'],
          ['Épaisseur', beamT, 'm'],
          ['Dessus par rapport au sol', panelTop, 'm'],
          ['Chanfrein du coin avant-haut', fr(F.nose) + ' × ' + fr(F.nose) + ' cm', 'm'],
          ['Bois traversé par le pivot et la tige', F.flank + beamT, 'm']
        ],
        note: 'Second tasseau, empilé sur la traverse de bout et sur le bout des deux longerons, collé et vissé. ' +
              'Il est à la hauteur de la tige et du pion : avec le panneau, ils traversent ' +
              fr(F.flank + beamT) + ' cm de bois au lieu de ' + fr(F.flank) + '. Le boulon de pivot traverse ' +
              (pv.h > panelTop - beamH ? 'lui aussi ce renfort' : 'la traverse de bout, juste dessous') +
              ', à ' + fr(Math.abs(pv.h - (panelTop - beamH))) + ' cm du joint entre les deux tasseaux. Le plateau en MDF vient buter contre lui.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelIn - beamT, xPanelIn);
          return { type: 'profile', pts: nosed(panelTop - beamH), x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'longeron', group: 'base', color: 'honey', qty: 2, core: true,
        name: 'Longeron avant / arrière',
        cuts: [{ stock: 'chevron', length: fullW, qty: 2, label: 'Longeron d\'assise' }],
        size: [fullW, beamH, beamT],
        material: 'Chevron de sapin traité 50 × 70 mm, brut de sciage, posé sur chant',
        dims: [
          ['Longueur', fullW, 'm'],
          ['Hauteur', beamH, 'm'],
          ['Épaisseur', beamT, 'm'],
          ['Portée entre deux pieds', round1(legPitch), 'm']
        ],
        note: 'Les deux grands côtés du cadre d\'assise, d\'un flanc à l\'autre ; le tissu s\'agrafe dessus. Chacun ' +
              'repose sur ' + legXs.length + ' pieds. Sur cette portée, une personne assise au milieu le fait fléchir d\'environ ' +
              '1 mm (estimation). Les traverses se vissent entre les deux.',
        shapes: [beamT / 2, P - beamT / 2].map(function (d) {
          return { type: 'box', size: [fullW, beamH, beamT], center: [0, beamY, z(d)] };
        })
      },
      {
        id: 'crossbar', group: 'base', color: 'honey', qty: nCross + 2, core: true,
        name: 'Traverse',
        cuts: [{ stock: 'chevron', length: P - 2 * beamT, qty: nCross + 2, label: 'Traverse d\'assise' }],
        size: [P - 2 * beamT, beamH, beamT],
        material: 'Même chevron que les longerons, posé sur chant',
        dims: [
          ['Longueur', P - 2 * beamT, 'm'],
          ['Hauteur', beamH, 'm'],
          ['Épaisseur', beamT, 'm'],
          ['Entraxe', round1(barPitch), 'm']
        ],
        note: 'Deux traverses de bout ferment le cadre en rectangle et reçoivent les flancs ; ' + nCross +
              ' traverses intermédiaires portent le plateau tous les ' + fr(barPitch) +
              ' cm. Toutes vissées à travers les longerons. Le cadre s\'assemble à plat, avant de poser les flancs.',
        shapes: Array.apply(null, { length: nCross + 2 }).map(function (unused, i) {
          var reach = xPanelIn - beamT / 2;
          return {
            type: 'box', size: [beamT, beamH, P - 2 * beamT],
            center: [-reach + i * 2 * reach / (nCross + 1), beamY, z(P / 2)]
          };
        })
      },
      {
        id: 'deck', group: 'base', color: 'deck', qty: 1, core: true, layer: 'mdf',
        name: 'Plateau d\'assise',
        cuts: [{ stock: 'mdf18', length: frameW, width: P, qty: 1, label: 'Plateau d\'assise' }],
        size: [frameW, P, F.deck],
        material: 'MDF 18 mm, cloué sur le cadre',
        dims: [
          ['Longueur', frameW, 'm'],
          ['Profondeur', P, 'm'],
          ['Épaisseur', F.deck, 'm'],
          ['Dessus par rapport au sol', deckTop, 'm']
        ],
        note: 'Ferme le cadre et le contrevente ; la mousse est collée dessus. Le MDF est trois fois moins raide ' +
              'que le contreplaqué et flue sous charge : il ne porte ici que sur ' + fr(barPitch - beamT) +
              ' cm entre deux tasseaux. Percer des trous d\'aération (ø 3 cm, tous les 20 cm) : une mousse collée sur ' +
              'un panneau plein ne respire pas par le dessous.',
        shapes: [{ type: 'box', size: [frameW, F.deck, P], center: [0, deckTop - F.deck / 2, z(P / 2)] }]
      },
      {
        id: 'sleeve', group: 'base', color: 'metal', qty: 1, core: true,
        name: 'Fourreau de la tige',
        cuts: [{ stock: 'sleeve', length: frameW, qty: 1, label: 'Fourreau' }],
        size: [frameW, 2 * M.bar.sleeve, 2 * M.bar.sleeve],
        material: 'Tube IRL ø 25 mm (gaine électrique rigide), tenu par des colliers sur cales',
        dims: [
          ['Longueur', frameW, 'm'],
          ['Diamètre', 2 * M.bar.sleeve, 'm'],
          ['Axe au-dessus du plateau', round1(axis[1] - deckTop), 'm'],
          ['Axe depuis l\'avant du panneau', round1(axis[0]), 'm'],
          ['Mousse restante au-dessus', round1(foamTop - sleeveTop), 'm']
        ],
        note: 'La tige traverse le bas de la mousse ; ce tube la laisse tourner librement. Il remplace l\'ancien ' +
              'carter : 2,5 cm de large au lieu de 7, et plus bas. La mousse reçoit une simple saignée dessous.',
        shapes: [{ type: 'cylinder', r: M.bar.sleeve, x0: -xFrame, x1: xFrame, y: axis[1], z: z(axis[0]) }]
      },
      {
        id: 'leg', group: 'base', color: 'honey', qty: 2 * legXs.length,
        name: 'Pied',
        cuts: [{ stock: 'foot', qty: 2 * legXs.length }],
        size: [K.bottom, beamT, beamT],
        material: 'Pieds de meuble du commerce, hauteur 10 cm, vissés sous les longerons',
        dims: [
          ['Hauteur', K.bottom, 'm'],
          ['Section en haut', fr(beamT) + ' × ' + fr(beamT) + ' cm', 'm'],
          ['Section en bas', fr(beamT - 1) + ' × ' + fr(beamT - 1) + ' cm', 'm'],
          ['Retrait des pieds d\'angle', F.legInset, 'm']
        ],
        note: legXs.length + ' sous chaque longeron, régulièrement espacés : un longeron ne porte jamais sur plus de ' +
              F.maxLegSpan + ' cm. Ce sont les pieds intermédiaires qui rendent le cadre vraiment rigide. Courts, ils ' +
              'restent discrets sous le bloc.',
        shapes: [beamT / 2, P - beamT / 2].reduce(function (acc, d) {
          return acc.concat(legXs.map(function (x) {
            return { type: 'frustum', top: beamT, bottom: beamT - 1, y0: 0, y1: K.bottom, x: x, z: z(d) };
          }));
        }, [])
      },
      {
        id: 'cam', group: 'cam', color: 'padwood', qty: 2,
        name: 'Taquet',
        size: [round1(camLen), 2 * C.flank, C.thick],
        material: 'Hêtre massif, fil dans la longueur',
        dims: [
          ['Longueur', round1(camLen), 'm'],
          ['Largeur', 2 * C.flank, 'm'],
          ['Épaisseur', C.thick, 'm'],
          ['Axe → bout du nez', round1(nose), 'm'],
          ['Axe → flanc', C.flank, 'm'],
          ['Axe → talon', C.heel, 'm'],
          ['Perçage', 'ø ' + fr(2 * M.bar.r) + ' cm', 'm'],
          ['Rotation entre les deux positions', fr(swing) + '°', 'm']
        ],
        note: 'Simple bloc rectangulaire, fixé sur la barre contre le panneau, bien visible sous le montant. Relevé, il porte ' +
              'le montant sur son nez : position droite. Couché, il le porte sur son flanc : position détente. Tant que ' +
              'le dossier appuie sur le nez, le taquet ne peut pas tourner : il faut d\'abord soulager le dossier. ' +
              'On le manœuvre par le levier. Coller et visser un seul des deux taquets, l\'autre seulement ' +
              'vissé, pour pouvoir démonter la barre.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelOut, xPanelOut + C.thick);
          return { type: 'profile', pts: camPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'lever', group: 'cam', color: 'padwood', qty: 2,
        name: 'Levier de commande',
        size: [round1(V.length + V.hub + V.tip), 2 * V.hub, V.t],
        material: 'Hêtre massif, collé et vissé sur la face du taquet',
        dims: [
          ['Longueur hors tout', round1(V.length + V.hub + V.tip), 'm'],
          ['Axe → bout', round1(V.length + V.tip), 'm'],
          ['Largeur au moyeu', 2 * V.hub, 'm'],
          ['Largeur au bout', 2 * V.tip, 'm'],
          ['Épaisseur', V.t, 'm']
        ],
        note: 'Plaqué contre le taquet, en bout de barre, comme la manette d\'un siège de voiture. Pour s\'incliner on le lève ; son poids ramène ensuite le taquet ' +
              'en position relevée. Un de chaque côté : ils tournent ensemble. Collé et vissé sur le taquet, à l\'opposé de son nez.',
        shapes: mirror(function (s) {
          var sp = span(s, xLever, xLever + V.t);
          return { type: 'profile', pts: leverPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'bar', group: 'cam', color: 'honey', qty: 1,
        name: 'Tige traversante',
        cuts: [{ stock: 'tube', length: 2 * xBarEnd, qty: 1, label: 'Tube de commande' }],
        size: [round1(2 * xBarEnd), 2 * M.bar.r, 2 * M.bar.r],
        material: 'Tube d\'acier rond ø 16 mm, longueur du commerce : 2 m',
        dims: [
          ['Diamètre', 2 * M.bar.r, 'm'],
          ['Longueur', round1(2 * xBarEnd), 'm'],
          ['Axe depuis l\'avant du panneau', round1(axis[0]), 'm'],
          ['Axe sous le chant supérieur', round1(panelTop - axis[1]), 'm'],
          ['Axe par rapport au sol', round1(axis[1]), 'm']
        ],
        note: 'Traverse le canapé dans le bas de la mousse, à l\'intérieur d\'un fourreau. Elle porte de chaque ' +
              'côté un taquet et son levier : tout tourne ensemble. Elle ne transmet que l\'effort de ' +
              'la main ; le poids du dossier passe du taquet au panneau, juste à côté. Chaque bout entre de 2 cm dans son ' +
              'taquet et y est goupillé par une vis traversante.',
        shapes: [{ type: 'cylinder', r: M.bar.r, x0: -xBarEnd, x1: xBarEnd, y: 0, z: 0 }]
      },
      {
        id: 'pin', group: 'base', color: 'mahogany', qty: 2,
        name: 'Pion de fin de course',
        size: [C.thick, 2 * M.pin.r, 2 * M.pin.r],
        material: 'Tourillon hêtre collé dans le panneau',
        dims: [
          ['Diamètre', 2 * M.pin.r, 'm'],
          ['Saillie', C.thick, 'm'],
          ['Position depuis l\'avant du panneau', round1(pin[0]), 'm'],
          ['Position sous le chant supérieur', round1(panelTop - pin[1]), 'm'],
          ['Distance à l\'axe de la barre', round1(Math.hypot(pin[0] - axis[0], pin[1] - axis[1])), 'm']
        ],
        note: 'Un seul par côté, sous la barre. Le même flanc du taquet vient le toucher dans ses deux positions ' +
              'extrêmes : taquet relevé (le nez se présente à plat sous le montant) et taquet couché (le flanc est ' +
              'parallèle au montant qui descend). Le positionner à l\'atelier, taquet en place.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelOut, xPanelOut + C.thick);
          return { type: 'cylinder', r: M.pin.r, x0: sp.x0, x1: sp.x1, y: pin[1], z: z(pin[0]) };
        })
      },
      {
        id: 'bolt', group: 'base', color: 'metal', qty: 2, symbolic: true,
        name: 'Boulon de pivot',
        cuts: [{ stock: 'bolt', qty: 2 }],
        material: 'Boulon traversant M10 + rondelles larges',
        dims: [
          ['Position depuis l\'avant du panneau', round1(pv.d), 'm'],
          ['Position sous le chant supérieur', round1(panelTop - pv.h), 'm'],
          ['Hauteur par rapport au sol', round1(pv.h), 'm']
        ],
        note: 'Axe de rotation de tout l\'ensemble dossier. Sa position règle à la fois l\'inclinaison du dossier ' +
              'et la jonction du lit. Par rapport à l\'original (' + fr(E.pivot.d) + ' cm de l\'avant, ' + fr(E.pivot.h) +
              ' cm du sol), il est reculé de ' + fr(pv.d - E.pivot.d) + ' cm et remonté de ' + fr(pv.h - E.pivot.h) +
              ' cm : c\'est ce qui permet à la banquette de rester fixe. Diamètre non mesurable sur les photos.',
        shapes: mirror(function (s) {
          var sp = span(s, xFrame, xOut + 0.4);
          return { type: 'cylinder', r: E.pivot.r, x0: sp.x0, x1: sp.x1, y: pv.h, z: z(pv.d) };
        })
      }
    ];

    return {
      listing: L,
      width: M.width,
      seatDepth: P,
      // Enveloppes à garnir, pour le calcul du tissu (sofa-bom.js).
      cover: {
        seat: { length: 2 * xPanelOut, depth: P + 2 * K.wad, drop: S - K.bottom },
        back: { length: 2 * xPanelOut, height: backH, thick: backT }
      },
      // Ce dont l'audit de solidité a besoin (sofa-bom.js).
      audit: {
        beamT: beamT, beamH: beamH, legSpan: legPitch, crossSpan: P - beamT, pitch: barPitch, deckT: F.deck,
        backSpan: M.width, ribW: M.back.ribW, rib: M.back.rib,
        lever: Math.hypot(axis[0] - pv.d, axis[1] - pv.h), camT: C.thick, barR: M.bar.r, uprightT: F.upright,
        // Lit : bord avant du dossier rabattu, pieds du lit, pivots, pieds avant et milieu du bloc d'assise (distances « d »).
        bed: { edge: pv.d - tTop, leg: legFootD, pivot: pv.d, frontLeg: beamT / 2, rearLeg: P - beamT / 2 },
        // Pied amovible : nombre et diamètre des vis, épaisseur du pied.
        bedLeg: { screws: legScrews.length, boltD: 0.8, t: G.t }
      },
      parts: parts,
      // Fixation des montants, en distance au pivot perpendiculairement au dossier : chants du haut du montant, faces du cadre, ligne des vis.
      stem: { front: yFront, rear: yRear, frame: [pCore + M.back.skin, pCore + boxT - M.back.skin], screw: screwP },
      // Axes de rotation des deux ensembles mobiles.
      pivot: { back: { y: pv.h, z: z(pv.d) }, cam: { y: axis[1], z: z(axis[0]) } },
      // Rotation de l'ensemble dossier autour de l'axe x. « lift » : dossier soulagé, le temps de tourner le taquet.
      angle: { lounge: -leanLounge, sofa: -lean, lift: -leanLift, bed: Math.PI / 2 },
      // Pour installer un mannequin : dessus fini de l'assise, et face avant du dossier (distance p au pivot, dans son repère).
      sitter: { seat: S, face: pFront },
      // Rotation des taquets. « follow » : angle du taquet qui suit le montant, pour chaque angle du dossier.
      cam: { engaged: camEngaged, retracted: camRetracted, follow: follow },
      // Zone à cadrer pour observer le mécanisme.
      focus: { min: [xPanelIn - 6, axis[1] - 20, z(axis[0] + 30)], max: [xBarEnd + 1, axis[1] + 22, z(axis[0] - 30)] },
      flipDeg: Math.round(90 + lean / DEG),
      // Ce que la modification change, pour la vue d'ensemble.
      custom: [
        ['Inclinaison du dossier — droite', fr(lean / DEG) + '°', 'p'],
        ['Inclinaison du dossier — détente', fr(leanLounge / DEG) + '°', 'm'],
        ['Largeur hors tout', round1(2 * xWide), 'm'],
        ['Largeur avec les leviers', round1(2 * (xLever + V.t)), 'm'],
        ['Profondeur en canapé', round1(Math.max(rearD, place(tTop, pRear, lean)[0]) - frontD), 'm'],
        ['Hauteur en canapé', round1(sofaTop), 'm'],
        ['Profondeur en lit', round1(bedDepth), 'm'],
        ['Dossier fini (hauteur × épaisseur)', fr(backH) + ' × ' + fr(backT) + ' cm', 'm'],
        ['Profondeur en détente', round1(loungeRear - frontD), 'm'],
        ['Hauteur en détente', round1(loungeTop), 'm'],
        ['Jour sous le dossier, position droite', fr(gapUpright[1]) + ' à ' + fr(gapUpright[0]) + ' cm', 'm'],
        ['Jour sous le dossier, détente', '0 à ' + fr(gapLounge) + ' cm', 'm'],
        ['Rotation du taquet', fr(swing) + '°', 'm'],
        ['Dossier à soulager pour tourner le taquet', fr((lean - leanLift) / DEG) + '°', 'm']
      ],
      // Encombrement hors tout (hors leviers et bouts de barre).
      overall: {
        lounge: { min: [-xWide, 0, z(loungeRear)], max: [xWide, loungeTop, z(frontD)] },
        sofa: { min: [-xWide, 0, z(Math.max(rearD, place(tTop, pRear, lean)[0]))], max: [xWide, sofaTop, z(frontD)] },
        bed: { min: [-xWide, 0, z(rearD)], max: [xWide, S, z(pv.d - tTop)] }
      }
    };
  }

  var api = { LISTING: LISTING, EST: EST, MOD: MOD, build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaModel = api;
})(typeof self !== 'undefined' ? self : this);
