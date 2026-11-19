/*
 * Modèle paramétrique du canapé convertible, d'après OPP Dřevovýroba (Tchécoslovaquie, années 1970).
 * Mécanisme de l'original, simplifié : le dossier et ses deux montants pivotent sur deux boulons ; en canapé
 * la queue du montant repose sur une butée fixe, en lit la pointe des accoudoirs pose au sol.
 *
 * Unités : centimètres.
 * Repère : x = largeur (0 au centre), y = hauteur depuis le sol, z = profondeur (positif vers l'avant).
 * « d » désigne une distance mesurée depuis le nez (avant) des panneaux latéraux, vers l'arrière.
 *
 * Un ensemble tourne autour d'un axe parallèle à x : « back », le dossier et ses deux montants, autour
 * des boulons de pivot. Repère : t = distance au pivot le long du dossier, p = distance au pivot
 * perpendiculairement au dossier (positif vers la face arrière du dossier).
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

  // Choix de conception d'Ethan. Cotes à valider à l'atelier.
  var MOD = {
    width: 196,                                           // LONGUEUR DU CANAPÉ : celle des deux blocs, entre les montants. Tout le reste suit.
    // PROFONDEUR DU BLOC D'ASSISE (85, comme l'original). Avec la profondeur du lit, elle fixe la hauteur du dossier :
    // un dossier plus haut dépasse davantage devant les accoudoirs en lit, et le lit bascule quand on s'assoit au bord.
    seatDepth: 85,
    // PROFONDEUR DU LIT, du bord du dossier rabattu à l'arrière du bloc d'assise.
    bedDepth: 120,
    // JOUR SOUS LE DOSSIER : en canapé, entre l'assise et l'arête arrière du bas du dossier. Plus il est grand, plus le
    // pivot remonte ; il doit rester en plein bois du flanc (contrôlé par tools/verif.js).
    backGap: 6,
    stop: { r: 1.5, wood: 2 },                            // butée : rayon du tourillon ; bois laissé au-dessus, sous le chant du flanc
    // Montant : stem, largeur de la tige ; below, la tige s'arrête, arrondie, à cette distance sous le haut du dossier.
    // branch : l'accoudoir, une branche qui part de la tige à « from » de sa hauteur et la quitte vers l'avant en faisant
    // « angle » degrés avec elle (90 : perpendiculaire ; au-delà, elle monte). Elle finit en pointe de rayon tipR, à « tip »
    // du pivot le long du dossier, où elle arrive en descendant de « slope » degrés en position canapé (négatif : elle
    // monte vers l'avant) ; leave et arrive règlent sa courbure au départ et à la pointe ; le creux entre la branche et
    // le tronc finit en demi-cercle de rayon notch.
    // En lit, la pointe pose au sol : « tip » fixe à la fois la hauteur de l'accoudoir en canapé et la distance entre ce
    // pied et le bord du lit, donc la stabilité du lit (bascule, dans tools/debit.js).
    upright: { stem: 6.5, below: 12, branch: { from: 0.45, angle: 115, tip: 55, tipR: 2, slope: -15, leave: 0.3, arrive: 0.3, notch: 1.5 } },
    seat: { foam: 16 },                                   // plaque de mousse de l'assise, posée sur le plateau
    // Dossier : un cadre de chevrons posés à plat, une peau de MDF clouée sur chaque face, entre deux plaques de mousse.
    back: { foam: [10, 5], skin: 1, rib: 5, ribW: 7 },     // foam : plaque côté assise, plaque côté couchage
    // Bâti de l'assise : un cadre fermé en tasseaux sous un plateau, et un flanc en contreplaqué de chaque côté.
    frame: {
      beam: 5,                                            // chevron 50 × 70 : épaisseur des longerons et des traverses, posés sur chant
      beamH: 7,                                           // … et leur hauteur
      flank: 2.7,                                         // flancs : planche rabotée 27 × 140
      nose: 5,                                            // chanfrein du coin avant-haut des flancs et des renforts : le bas du dossier passe devant en basculant
      deck: 1.8,                                          // plateau en MDF
      maxPitch: 40,                                       // entraxe maximal des traverses : le MDF demande des appuis rapprochés
      maxLegSpan: 95,                                     // portée maximale d'un longeron entre deux pieds
      legInset: 6,                                        // retrait des pieds d'angle par rapport au bout du cadre
      upright: 3                                          // épaisseur des montants
    },
    // Garnissage : ouate + tissu, une seule housse par bloc. Montants, accoudoirs et butées restent apparents.
    cover: {
      wad: 1,                                             // ouate, par face garnie
      radius: 3,                                          // arrondi que la ouate donne aux arêtes
      bottom: 5                                           // bas du bloc d'assise : hauteur des pieds du commerce
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

    // --- Pivot de la version modifiée ---
    // Le dossier reste un bloc rigide, coupé droit. Il est raccourci par le bas, juste assez pour que son
    // arête arrière passe à M.backGap au-dessus de la banquette en position canapé, et le pivot est déplacé pour que, dossier
    // rabattu, ce bas arrive contre la banquette, qui ne bouge jamais.
    // Deux conditions fixent la position du pivot : (1) en lit, le bas du dossier s'arrête sur l'avant des
    // coussins ; (2) en position canapé, le dossier reste exactement là où il est sur l'original.
    function cutAt(hp) {                            // bas du dossier : son arête arrière à M.backGap au-dessus de l'assise, en canapé
      return (S + M.backGap - hp + (S - hp) * Math.sin(lean)) / Math.cos(lean);
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
    // En position lit le dossier est à plat devant l'assise, à la même hauteur qu'elle, et la pointe des
    // accoudoirs pose au sol.
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
    // Jour entre l'assise et l'arête avant du bas du dossier, en canapé (sous l'arête arrière : M.backGap).
    var gapFront = place(tBottom, pFront, lean)[1] - S;
    var bedDepth = tTop - pv.d + P + K.wad;               // du bord du dossier rabattu à l'arrière du bloc d'assise
    var sofaTop = place(tTop, pFront, lean)[1];                        // hauteur hors tout en canapé

    // Contour du montant, en branches. La queue part du boulon, droite (elle repose sur la butée), et
    // rejoint la tige, vissée au dossier, qui s'arrête en arrondi sous le haut du dossier. De la tige se détache une
    // branche courbe, l'accoudoir : elle monte en biais vers l'avant, comme le bras en Y de l'original, jusqu'à une pointe arrondie.
    // Entre la branche et la queue, le montant est évidé. Points [t, p].
    var capR = 2.6, Y = M.upright, B = Y.branch;
    // La tige est vissée dans le cadre du dossier : son chant arrière affleure la face arrière du cadre.
    var frameRear = pCore + M.back.skin + M.back.rib;
    var yRear = frameRear, yFront = yRear - Y.stem, yTop = tTop - K.wad - Y.below, yMid = (yFront + yRear) / 2;
    // Le chant arrière de la queue (qui repose sur la butée) va du boulon au coude, en ligne droite.
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
    // point le plus bas du montant : elle pose au sol. Sa largeur passe de celle de la tige à celle de la pointe.
    var tipC = [B.tip, pFoot + B.tipR];
    // La branche arrive à la pointe vers l'avant, en descendant de B.slope degrés en position canapé.
    var tipDir = [-Math.sin(lean) * Math.cos(B.slope * DEG) - Math.cos(lean) * Math.sin(B.slope * DEG), -Math.cos(lean) * Math.cos(B.slope * DEG) + Math.sin(lean) * Math.sin(B.slope * DEG)];
    var start = [tBottom + B.from * (yTop - tBottom), yMid];
    var reach = Math.hypot(start[0] - tipC[0], start[1] - tipC[1]);
    var leaveDir = [-Math.cos(B.angle * DEG), -Math.sin(B.angle * DEG)];
    var axisPts = bezier(start, [start[0] + B.leave * reach * leaveDir[0], start[1] + B.leave * reach * leaveDir[1]],
                         [tipC[0] - B.arrive * reach * tipDir[0], tipC[1] - B.arrive * reach * tipDir[1]], tipC, 60);
    var upper = [], lower = [], widths = [];
    axisPts.forEach(function (c, i) {
      var a = axisPts[Math.max(0, i - 1)], b = axisPts[Math.min(axisPts.length - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty);
      var n = [-ty / l, tx / l], half = (Y.stem + (2 * B.tipR - Y.stem) * i / (axisPts.length - 1)) / 2;   // n : côté du dessus
      widths.push(2 * half);
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

    // Repère de l'ensemble « back » : (x, y, z) = (x, t, -p).
    var local = function (pt) { return [-pt[1], pt[0]]; };
    var uprightPts = uprightOutline.map(local);
    var backPts = [[tBottom, pFront], [tTop, pFront], [tTop, pRear], [tBottom, pRear]].map(local);

    var toBase = function (pt) { return [z(pt[0]), pt[1]]; };
    // Panneaux latéraux rectangulaires, arasés au niveau du plateau : le coussin passe par-dessus.
    var panelTop = 2 * (deckTop - F.deck) - K.bottom;   // deux tasseaux empilés : la traverse de bout et son renfort
    // Le coin avant-haut est abattu : en basculant vers le lit, le bas du dossier descend juste devant.
    function nosed(low) {
      var corner = F.nose > 0 ? [[0, panelTop - F.nose], [F.nose, panelTop]] : [[0, panelTop]];
      return corner.concat([[P, panelTop], [P, low], [0, low]]).map(toBase);
    }
    var panelPts = nosed(K.bottom);

    // --- Butée ---
    // Un tourillon en hêtre collé dans le flanc, qui dépasse dans le plan du montant. En canapé, le chant arrière de la
    // queue repose dessus : c'est lui qui retient le dossier quand on s'y adosse. Il est placé aussi haut que le flanc le
    // permet (O.wood de bois au-dessus), donc aussi loin du pivot que possible. Pour faire le lit, on bascule le dossier
    // vers l'avant : la queue quitte la butée, et la pointe des accoudoirs vient poser au sol.
    var O = M.stop, stopH = panelTop - O.wood - O.r;
    function stopAt(s) {                           // centre de la butée qui toucherait le chant arrière à « s » du bout arrondi
      return [capStart[0] + s * tailRearDir[0] - O.r * tailN[0], capStart[1] + s * tailRearDir[1] - O.r * tailN[1]];
    }
    var h0 = place(stopAt(0)[0], stopAt(0)[1], lean)[1], h1 = place(stopAt(1)[0], stopAt(1)[1], lean)[1];
    var stopLocal = stopAt((stopH - h0) / (h1 - h0));
    var stop = place(stopLocal[0], stopLocal[1], lean);                // centre de la butée (d, hauteur)
    var stopT = stopLocal[0] + O.r * tailN[0];                         // point de contact sur la queue, distance au pivot
    var stopArm = Math.hypot(stop[0] - pv.d, stop[1] - pv.h);         // du pivot au centre de la butée
    var tipFootD = pv.d - tipC[0];                                     // pointe des accoudoirs au sol, en lit


    var beamT = F.beam, beamH = deckTop - F.deck - K.bottom, beamY = K.bottom + beamH / 2;   // section et hauteur d'axe des poutres du cadre
    var legXs = Array.apply(null, { length: legBays + 1 }).map(function (unused, i) { return -legReach + i * legPitch; });
    var barPitch = (fullW - beamT) / (nCross + 1);   // entraxe des traverses du cadre
    // Profondeur d'assise : de l'avant des coussins à la face avant du dossier, au niveau de l'assise.
    var seatUsable = Math.round(place((S - pv.h + pFront * Math.sin(lean)) / Math.cos(lean), pFront, lean)[0] - frontD);
    var screwTs = [tBottom + 4, (tBottom + yTop) / 2 - 1, yTop - 6];
    // Les vis se placent au milieu de la partie du cadre que le montant recouvre.
    var screwP = (Math.max(pCore + M.back.skin, yFront) + Math.min(pCore + boxT - M.back.skin, yRear)) / 2;
    var xWide = xOut;                              // les montants sont ce qu'il y a de plus large
    var rearD = P + K.wad;            // face arrière finie du bloc d'assise
    var sofaRear = Math.max(rearD, place(tTop, pRear, lean)[0]);

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
          ['Accoudoir : dessus de la pointe, depuis le sol, en canapé', round1(armTip), 'm'],
          ['Accoudoir : largeur de la branche', fr(Y.stem) + ' → ' + fr(2 * B.tipR) + ' cm', 'm'],
          ['Pointe au sol en lit, depuis l\'avant du bloc d\'assise', round1(frontD - tipFootD), 'm'],
          ['Haut de la tige, sous le haut du dossier', round1(tTop - yTop), 'm'],
          ['Rayon du bout arrondi', capR, 'p'],
          ['Fond du creux sous l\'accoudoir : trou de', fr(2 * B.notch * 10) + ' mm', 'm']
        ],
        note: 'Pièce clé du mécanisme. La queue est boulonnée au panneau latéral, la tige est vissée au dossier (3 vis). ' +
              'La tige s\'arrête en demi-cercle, ' + fr(tTop - yTop) + ' cm sous le haut du dossier. De la tige se détache ' +
              'une branche courbe, l\'accoudoir (chant de 3 cm, poncé et arrondi) : elle monte en biais vers l\'avant, comme ' +
              'le bras en Y de l\'original, jusqu\'à une pointe arrondie. Entre la branche et le tronc, le montant est évidé : ' +
              'un trou de ' + fr(2 * B.notch * 10) + ' mm à la scie cloche au fond du creux, puis deux traits de scie sauteuse. Le chant ' +
              'arrière de la queue, bien droit, repose en canapé sur la butée. En lit la pointe de la branche pose au sol ' +
              '(patin feutre), ' + fr(tTop - tipC[0]) + ' cm en retrait du bord du lit : les accoudoirs deviennent les pieds du lit. ' +
              'En lit, la branche est presque verticale : elle porte le lit en compression, sans plier. ' +
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
          ['Inclinaison en canapé', fr(lean / DEG) + '°', 'p'],
          ['Jour sous le dossier, en canapé', fr(M.backGap) + ' à ' + fr(gapFront) + ' cm', 'm']
        ],
        note: 'La ouate adoucit les arêtes des plaques, le tissu enveloppe le tout sauf les deux bouts, plaqués contre ' +
              'les montants. La mécanique est réglée sur ces cotes finies : en canapé l\'arête arrière passe ' +
              'à ' + fr(M.backGap) + ' cm de l\'assise, en lit le bas vient contre le bloc d\'assise.',
        shapes: [{ type: 'box', size: [2 * xPanelOut, backH, backT], radius: K.radius, center: [0, tMid, -(pFront + pRear) / 2] }]
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
          ['Entaille à chaque bout', fr(F.flank + beamT) + ' × ' + fr(panelTop - deckTop) + ' cm', 'm']
        ],
        note: 'Une seule plaque. Elle est entaillée à chaque bout pour coiffer le haut des panneaux, et collée ' +
              'sur le plateau. La profondeur utile devant le ' +
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
              'les panneaux, pour laisser le montant travailler (une rondelle sous le boulon).',
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
          ['Perçage de la butée', 'ø ' + fr(2 * O.r * 10) + ' mm, à ' + fr(stop[0]) + ' cm de l\'avant et ' + fr(panelTop - stop[1]) + ' cm sous le chant', 'm']
        ],
        note: 'Simple planche, collée et vissée sur la traverse de bout et sur son renfort : c\'est le flanc ' +
              'du bloc d\'assise, et la face sur laquelle travaille le montant. Il reçoit le boulon ' +
              'de pivot et la butée. ' +
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
          ['Bois traversé par le pivot et la butée', F.flank + beamT, 'm']
        ],
        note: 'Second tasseau, empilé sur la traverse de bout et sur le bout des deux longerons, collé et vissé. ' +
              'Il est à la hauteur du pivot et de la butée : avec le panneau, ils traversent ' +
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
        id: 'leg', group: 'base', color: 'honey', qty: 2 * legXs.length,
        name: 'Pied',
        cuts: [{ stock: 'foot', qty: 2 * legXs.length }],
        size: [K.bottom, beamT, beamT],
        material: 'Pieds de meuble du commerce, hauteur ' + K.bottom + ' cm, vissés sous les longerons',
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
      },
      {
        id: 'stop', group: 'base', color: 'padwood', qty: 2,
        name: 'Butée',
        cuts: [{ stock: 'dowel', length: F.flank + beamT + F.upright, qty: 2, label: 'Butée' }],
        size: [round1(F.flank + beamT + F.upright), 2 * O.r, 2 * O.r],
        material: 'Tourillon hêtre ø ' + fr(2 * O.r * 10) + ' mm, collé dans le flanc et son renfort',
        dims: [
          ['Diamètre', 2 * O.r, 'm'],
          ['Saillie hors du flanc', F.upright, 'm'],
          ['Longueur (saillie + flanc + renfort)', round1(F.flank + beamT + F.upright), 'm'],
          ['Position depuis l\'avant du panneau', round1(stop[0]), 'm'],
          ['Position sous le chant supérieur', round1(panelTop - stop[1]), 'm'],
          ['Distance au boulon de pivot', round1(stopArm), 'm'],
          ['Contact sur la queue, depuis le pivot', round1(stopT), 'm']
        ],
        note: 'La butée de l\'original : un gros tourillon en hêtre, collé dans un trou qui traverse le flanc et son ' +
              'renfort, et qui dépasse de l\'épaisseur du montant. En canapé, le chant arrière de la queue du montant ' +
              'repose dessus : c\'est elle qui retient le dossier quand on s\'y adosse. Pour faire le lit, on soulève ' +
              'l\'avant du dossier et on le bascule vers l\'avant ; la queue quitte la butée. Percer à l\'atelier, ' +
              'dossier monté et posé en position canapé, pour qu\'elle touche bien la queue.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelIn - beamT, xOut);
          return { type: 'cylinder', r: O.r, x0: sp.x0, x1: sp.x1, y: stop[1], z: z(stop[0]) };
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
        stopArm: stopArm, stopR: O.r, stopOut: F.upright, uprightT: F.upright,
        // Lit : bord avant du dossier rabattu, pointe des accoudoirs au sol, pivots, pieds avant et arrière du bloc d'assise (distances « d »).
        bed: { edge: pv.d - tTop, leg: tipFootD, pivot: pv.d, frontLeg: beamT / 2, rearLeg: P - beamT / 2 },
        // Branche de l'accoudoir, libre (du fond du creux à la pointe) : distances t au pivot de son axe et largeurs. En lit,
        // t donne la position horizontale : l'écart à la pointe est le bras de levier de la réaction du sol.
        arm: { t: axisPts.slice(j).map(function (c) { return c[0]; }), width: widths.slice(j), tip: tipC[0] }
      },
      parts: parts,
      // Fixation des montants, en distance au pivot perpendiculairement au dossier : chants du haut du montant, faces du cadre, ligne des vis.
      stem: { front: yFront, rear: yRear, frame: [pCore + M.back.skin, pCore + boxT - M.back.skin], screw: screwP },
      // Axe de rotation de l'ensemble dossier.
      pivot: { back: { y: pv.h, z: z(pv.d) } },
      // Rotation de l'ensemble dossier autour de l'axe x.
      angle: { sofa: -lean, bed: Math.PI / 2 },
      // Pour installer un mannequin : dessus fini de l'assise, et face avant du dossier (distance p au pivot, dans son repère).
      sitter: { seat: S, face: pFront },
      // Zone à cadrer pour observer le mécanisme : le pivot, la butée et le bas du montant.
      focus: { min: [xPanelIn - 6, K.bottom, z(stop[0] + 25)], max: [xOut + 1, S + 20, z(pv.d - 30)] },
      flipDeg: Math.round(90 + lean / DEG),
      // Ce que la modification change, pour la vue d'ensemble.
      custom: [
        ['Inclinaison du dossier', fr(lean / DEG) + '°', 'p'],
        ['Largeur hors tout', round1(2 * xWide), 'm'],
        ['Profondeur en canapé', round1(sofaRear - frontD), 'm'],
        ['Hauteur en canapé', round1(sofaTop), 'm'],
        ['Profondeur en lit', round1(bedDepth), 'm'],
        ['Dossier fini (hauteur × épaisseur)', fr(backH) + ' × ' + fr(backT) + ' cm', 'm'],
        ['Jour sous le dossier, en canapé', fr(M.backGap) + ' à ' + fr(gapFront) + ' cm', 'm'],
        ['Accoudoir : départ et pointe, depuis le sol', fr(armHigh) + ' et ' + fr(armTip) + ' cm', 'm'],
        ['Pointe des accoudoirs au sol, en lit', fr(tTop - tipC[0]) + ' cm en retrait du bord', 'm']
      ],
      // Encombrement hors tout.
      overall: {
        sofa: { min: [-xWide, 0, z(sofaRear)], max: [xWide, sofaTop, z(frontD)] },
        bed: { min: [-xWide, 0, z(rearD)], max: [xWide, S, z(pv.d - tTop)] }
      }
    };
  }

  var api = { LISTING: LISTING, EST: EST, MOD: MOD, build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaModel = api;
})(typeof self !== 'undefined' ? self : this);
