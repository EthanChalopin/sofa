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
 *   - « back » : le dossier, ses deux montants et les manchettes, autour des boulons de pivot.
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
    pad: { length: 22, width: 6, t: 2.5, tilt: 19 },      // tilt : pente de l'accoudoir en canapé (degrés)
    peg: { r: 1.5, length: 3 },                           // butée d'origine : rayon et saillie hors du panneau
    screw: { r: 0.6 }
  };

  // Modification personnelle : position « détente ». Cotes de conception, à valider à l'atelier.
  var MOD = {
    width: 196,                                           // LONGUEUR DU CANAPÉ : celle des deux blocs, entre les montants. Tout le reste suit.
    extraLean: 12,                                        // degrés d'inclinaison en plus
    cam: {
      t: 9,                                               // où le taquet touche la queue du montant (distance au pivot)
      flank: 2,                                           // de l'axe au flanc : appui en position détente
      heel: 4.5,                                          // de l'axe au talon
      thick: 3                                            // même épaisseur que le montant qu'il porte
    },
    lever: { length: 15, hub: 2.75, tip: 1.5, t: 1.5 },   // levier de commande, contre le taquet
    bar: { r: 0.8, sleeve: 1.25 },                        // tube d'acier ø 16 de 2 m, dans un fourreau ø 25 à la traversée de la mousse
    pin: { r: 0.6 },                                      // pion de fin de course
    liftMargin: 0.3,                                      // degrés de marge pour dégager le taquet
    seat: { foam: 20 },                                   // plaque de mousse de l'assise, posée sur le plateau
    // Dossier : un cadre de chevrons posés à plat, une peau de MDF clouée sur chaque face, entre deux plaques de mousse.
    back: { foam: [3, 5], skin: 1, rib: 5, ribW: 7 },
    // Bâti de l'assise : un cadre fermé en tasseaux sous un plateau, et un flanc en contreplaqué de chaque côté.
    frame: {
      beam: 5,                                            // chevron 50 × 70 : épaisseur des longerons et des traverses, posés sur chant
      beamH: 7,                                           // … et leur hauteur
      flank: 2.7,                                         // flancs : planche rabotée 27 × 140
      deck: 1.8,                                          // plateau en MDF
      maxPitch: 40,                                       // entraxe maximal des traverses : le MDF demande des appuis rapprochés
      maxLegSpan: 95,                                     // portée maximale d'un longeron entre deux pieds
      legInset: 6,                                        // retrait des pieds d'angle par rapport au bout du cadre
      upright: 3                                          // épaisseur des montants en Y
    },
    // Garnissage : ouate + tissu, une seule housse par bloc. Montants, accoudoirs et taquets restent apparents.
    cover: {
      wad: 1,                                             // ouate, par face garnie
      radius: 3,                                          // arrondi que la ouate donne aux arêtes
      bottom: 10,                                         // bas du bloc d'assise : hauteur des pieds du commerce
      legGap: 6                                           // en lit, les pieds se posent à cette distance devant le bloc d'assise
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
    var z = function (d) { return E.panel.length / 2 - d; };

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
    // et les manchettes touchent le sol.
    var tTop = tTop0 + shiftT;
    var pRear = S - pv.h;               // face arrière du dossier (dessus du couchage en lit)
    var pFront = pRear - backT;
    var pCore = pFront + K.wad + M.back.foam[0];   // face avant du caisson du dossier
    var pFoot = -pv.h;                             // bout de la manchette (au sol en lit)

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
    var bedDepth = tTop - pv.d + E.panel.length + K.wad;               // du bord du dossier rabattu à l'arrière du bloc d'assise

    // Manchette : inclinée de padSkew par rapport à la perpendiculaire au dossier ; son coin le plus bas
    // touche le sol en position lit.
    // Le bras du montant part de la face avant du dossier ; en lit il doit toucher le sol, juste devant le
    // bloc d'assise. Son avancée est donc celle de l'original, réduite dans le rapport kArm, et il est
    // remonté le long du dossier de armLift.
    var kArm = (pFront - pFoot) / (pFront0 + E.pivot.h);
    var padLen = Math.min(E.pad.length, Math.floor(pFront - pFoot - 0.5));
    var padSkew = lean - E.pad.tilt * DEG;
    var padHalf = E.pad.t / 2 * Math.cos(padSkew) + padLen / 2 * Math.abs(Math.sin(padSkew));
    var padCenter = [pv.d - frontD + K.legGap + padHalf, pFoot + padLen / 2 * Math.cos(padSkew) + E.pad.t / 2 * Math.sin(padSkew)];
    var armLift = padCenter[0] - (45.8 + shiftT);
    var armP = function (p) { return pFront + (p - pFront0) * kArm; };
    function arm(pts) { return pts.map(function (pt) { return [pt[0] + shiftT + armLift, armP(pt[1])]; }); }
    var padSeat = function (p) {                   // t du dessous de la manchette, là où elle repose sur le bras
      return padCenter[0] - E.pad.t / 2 / Math.cos(padSkew) + (p - padCenter[1]) * Math.tan(padSkew);
    };

    // Contour du montant (pièce en Y), relevé sur la photo de profil. Points [t, p] ; les valeurs
    // chiffrées sont celles du relevé, décalées vers le nouveau pivot. Seule la queue change de longueur.
    var capR = 2.6;
    var yFront = armP(12.6), yRear = yFront + 9.4, yTop = tTop - K.wad - 0.5;
    var kink = [40.4 + shiftT, yRear], tailFront = [30.6 + shiftT, armP(7.7)];
    var aRear = Math.atan2(kink[1], kink[0]) - Math.asin(capR / Math.hypot(kink[0], kink[1]));
    var aFront = Math.atan2(tailFront[1], tailFront[0]) + Math.asin(capR / Math.hypot(tailFront[0], tailFront[1]));
    var tailRearDir = [Math.cos(aRear), Math.sin(aRear)];
    var capStart = [capR * Math.cos(aRear + Math.PI / 2), capR * Math.sin(aRear + Math.PI / 2)];
    var uprightOutline = join([
      arc(0, 0, capR, aRear + Math.PI / 2, aFront + 1.5 * Math.PI, 16),                    // bout arrondi autour du boulon
      spline([tailFront].concat(arm([[31.9, 8.0], [33.8, 7.55], [35.5, 6.3], [36.6, 5.1], [37.8, 3.3],  // dessous du bras
              [38.8, 0.25], [39.5, -3.1], [41.0, -8.3], [41.8, -11.2],
              [42.3, -12.3], [43.1, -12.8], [43.8, -12.5]]), [[padSeat(armP(-11.8)), armP(-11.8)]]), 6),   // bout du bras
      spline([[padSeat(armP(2.9)), armP(2.9)]].concat(arm([[44.6, 4.6], [44.3, 6.0], [45.4, 8.7],         // aisselle
              [48.4, 10.5], [52.4, 11.8], [56.6, 12.4]]), [[Math.min(64.8 + shiftT + armLift, yTop - 3), yFront]]), 6),
      quad([yTop - 0.8, yFront + 0.6], [yTop, yFront + 0.6], [yTop, yFront + 1.4], 4),
      quad([yTop, yRear - 2], [yTop, yRear], [yTop - 2, yRear], 6),
      quad([kink[0] + 4.5, yRear], kink,                                                    // coude
           [kink[0] - 5 * tailRearDir[0], kink[1] - 5 * tailRearDir[1]], 8),
      [capStart]
    ]);
    uprightOutline.pop();                          // le contour se referme tout seul
    var ub = bounds(uprightOutline);

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
    var panelPts = [[0, panelTop], [E.panel.length, panelTop], [E.panel.length, K.bottom], [0, K.bottom]].map(toBase);

    var beamT = F.beam, beamH = deckTop - F.deck - K.bottom, beamY = K.bottom + beamH / 2;   // section et hauteur d'axe des poutres du cadre
    var legXs = Array.apply(null, { length: legBays + 1 }).map(function (unused, i) { return -legReach + i * legPitch; });
    var barPitch = (fullW - beamT) / (nCross + 1);   // entraxe des traverses du cadre
    var sleeveTop = axis[1] + M.bar.sleeve;        // dessus du fourreau de la tige
    // Profondeur d'assise : de l'avant des coussins à la face avant du dossier, au niveau de l'assise.
    var seatUsable = Math.round(place((S - pv.h + pFront * Math.sin(lean)) / Math.cos(lean), pFront, lean)[0] - frontD);
    var screwTs = [tBottom + 4, (tBottom + tTop) / 2, tTop - 4];
    var padX = xOut - E.pad.width / 2;
    var loungeTop = place(tTop, pFront, leanLounge)[1];
    var rearD = E.panel.length + K.wad;            // face arrière finie du bloc d'assise
    var loungeRear = Math.max(rearD, place(tTop, pRear, leanLounge)[0]);
    var swing = (camRetracted - camEngaged) / DEG;

    function mirror(make) { return [make(1), make(-1)]; }
    function span(sign, a, b) { return sign > 0 ? { x0: a, x1: b } : { x0: -b, x1: -a }; }

    var parts = [
      {
        id: 'upright', group: 'back', color: 'mahogany', qty: 2,
        name: 'Montant en Y',
        size: [round1(ub.max[0] - ub.min[0]), round1(ub.max[1] - ub.min[1]), F.upright],
        material: 'Contreplaqué bouleau 30 mm (deux épaisseurs de 15 collées), teinté',
        dims: [
          ['Encombrement — longueur', round1(ub.max[0] - ub.min[0]), 'p'],
          ['Encombrement — largeur', round1(ub.max[1] - ub.min[1]), 'p'],
          ['Épaisseur', F.upright, 'm'],
          ['Pivot → sommet', round1(yTop), 'm'],
          ['Largeur le long du dossier', round1(yRear - yFront), 'p'],
          ['Largeur de la queue', '5 → 9 cm', 'p'],
          ['Rayon du bout arrondi', capR, 'p']
        ],
        note: 'Pièce clé du mécanisme. La queue est boulonnée au panneau latéral, le haut est vissé au dossier (3 vis), ' +
              'le bras porte la manchette. Le chant arrière de la queue, bien droit, repose sur le taquet : sur son nez ' +
              'en position droite, sur son flanc en position détente. En lit le bras pointe vers le sol et devient le pied. ' +
              'Sur l\'original le bras est environ 2,5 cm plus long : le dossier rabattu reste alors un peu relevé ' +
              '(le vendeur signale que le lit n\'est pas tout à fait plat). Il est raccourci ici pour un couchage à plat. ' +
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
        note: 'La plus épaisse est du côté qui devient le couchage. Les épaisseurs se règlent dans MOD.back : ' +
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
        id: 'pad', group: 'back', color: 'padwood', qty: 2,
        name: 'Manchette d\'accoudoir',
        size: [padLen, E.pad.width, E.pad.t],
        material: 'Bois massif (hêtre), teinté',
        dims: [
          ['Longueur', padLen, 'p'],
          ['Largeur', E.pad.width, 'p'],
          ['Épaisseur', E.pad.t, 'p'],
          ['Pente en position droite', fr(E.pad.tilt) + '°', 'p'],
          ['Pente en position détente', fr(E.pad.tilt + M.extraLean) + '°', 'm']
        ],
        note: 'Fixée sur le chant du bras du montant, presque perpendiculaire au dossier ; en canapé elle remonte ' +
              'vers l\'avant. En position lit elle est quasi verticale et son extrémité pose au sol.',
        shapes: mirror(function (s) {
          return {
            type: 'box', size: [E.pad.width, E.pad.t, padLen], rotX: padSkew,
            center: [s * padX, padCenter[0], -padCenter[1]]
          };
        })
      },
      {
        id: 'screw', group: 'back', color: 'metal', qty: 6, symbolic: true,
        name: 'Vis montant → dossier',
        material: 'Vis à tête fendue',
        dims: [
          ['Par montant', '3 vis', 'p'],
          ['Entraxe', round1(screwTs[1] - screwTs[0]), 'm']
        ],
        note: 'Alignées sur l\'axe du dossier. Elles solidarisent le dossier et les deux montants.',
        shapes: [1, -1].reduce(function (acc, s) {
          return acc.concat(screwTs.map(function (t) {
            var sp = span(s, xOut, xOut + 0.3);
            return { type: 'cylinder', r: E.screw.r, x0: sp.x0, x1: sp.x1, y: t, z: -(pCore + boxT / 2) };
          }));
        }, [])
      },
      {
        id: 'seatFoam', group: 'base', color: 'foam', qty: 1, layer: 'foam',
        name: 'Mousse d\'assise',
        size: [2 * xPanelOut, E.panel.length, M.seat.foam],
        material: 'Plaque de mousse, posée sur le plateau',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Profondeur', E.panel.length, 'm'],
          ['Épaisseur', M.seat.foam, 'm'],
          ['Entaille à chaque bout', fr(F.flank + beamT) + ' × ' + fr(panelTop - deckTop) + ' cm', 'm'],
          ['Saignée dessous, pour le fourreau', 'ø ' + fr(2 * M.bar.sleeve) + ' cm, à ' + fr(axis[1] - deckTop) + ' cm du plateau', 'm']
        ],
        note: 'Une seule plaque. Elle est entaillée à chaque bout pour coiffer le haut des panneaux, et rainurée ' +
              'dessous d\'une saignée pour le fourreau de la tige ; elle est collée sur le plateau. La profondeur utile devant le ' +
              'dossier est d\'environ ' + seatUsable + ' cm.',
        shapes: [
          { type: 'box', size: [frameW, panelTop - deckTop, E.panel.length], center: [0, (panelTop + deckTop) / 2, z(E.panel.length / 2)] },
          { type: 'box', size: [2 * xPanelOut, foamTop - panelTop, E.panel.length], center: [0, (foamTop + panelTop) / 2, z(E.panel.length / 2)] }
        ]
      },
      {
        id: 'seatCover', group: 'base', color: 'fabric', qty: 1, layer: 'cover',
        name: 'Garnissage de l\'assise',
        size: [2 * xPanelOut, E.panel.length + 2 * K.wad, S - K.bottom],
        material: 'Ouate + tissu, une seule housse du socle au dessus',
        dims: [
          ['Longueur', 2 * xPanelOut, 'm'],
          ['Profondeur finie', E.panel.length + 2 * K.wad, 'm'],
          ['Hauteur', S - K.bottom, 'm'],
          ['Dessus par rapport au sol', S, 'v'],
          ['Ouate', K.wad, 'm']
        ],
        note: 'Le même tissu descend d\'un seul tenant du dessus de la mousse jusqu\'au bas du socle : l\'assise se lit ' +
              'comme un bloc. Ouate sur le dessus, l\'avant et l\'arrière ; sur les flancs le tissu est tendu à même ' +
              'les panneaux, pour laisser le montant et le taquet travailler (une rondelle sous chacun).',
        shapes: [{
          type: 'box', size: [2 * xPanelOut, S - K.bottom, E.panel.length + 2 * K.wad], radius: K.radius,
          center: [0, (S + K.bottom) / 2, z(E.panel.length / 2)]
        }]
      },
      {
        id: 'panel', group: 'base', color: 'honey', qty: 2, core: true,
        name: 'Panneau latéral',
        cuts: [{ stock: 'plank', length: E.panel.length, qty: 2, label: 'Flanc' }],
        size: [E.panel.length, panelTop - K.bottom, F.flank],
        material: 'Planche de sapin rabotée 27 × 140 mm',
        dims: [
          ['Longueur', E.panel.length, 'm'],
          ['Hauteur', panelTop - K.bottom, 'm'],
          ['Épaisseur', F.flank, 'p'],
          ['Chant supérieur par rapport au sol', panelTop, 'm'],
          ['Dépassement au-dessus du plateau', round1(panelTop - deckTop), 'm'],
          ['Perçage de la tige', 'ø ' + fr(2 * M.bar.r + 0.2) + ' cm', 'm']
        ],
        note: 'Simple planche, collée et vissée sur la traverse de bout et sur son renfort : c\'est le flanc ' +
              'du bloc d\'assise, et la face sur laquelle travaillent le montant et le taquet. Il reçoit le boulon ' +
              'de pivot, la tige (perçage large, elle doit tourner librement) et le pion de fin de course. ' +
              'La mousse le coiffe, le tissu de l\'assise le recouvre.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelIn, xPanelOut);
          return { type: 'profile', pts: panelPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'brace', group: 'base', color: 'honey', qty: 2, core: true,
        name: 'Renfort de pivot',
        cuts: [{ stock: 'chevron', length: E.panel.length, qty: 2, label: 'Renfort de pivot' }],
        size: [E.panel.length, beamH, beamT],
        material: 'Même chevron que le cadre, posé sur chant sur la traverse de bout',
        dims: [
          ['Longueur', E.panel.length, 'm'],
          ['Hauteur', beamH, 'm'],
          ['Épaisseur', beamT, 'm'],
          ['Dessus par rapport au sol', panelTop, 'm'],
          ['Bois traversé par le pivot et la tige', F.flank + beamT, 'm']
        ],
        note: 'Second tasseau, empilé sur la traverse de bout et sur le bout des deux longerons, collé et vissé. ' +
              'Il est à la hauteur du boulon de pivot, de la tige et du pion : avec le panneau, ils traversent ' +
              fr(F.flank + beamT) + ' cm de bois au lieu de ' + fr(F.flank) + '. Le plateau en MDF vient buter contre lui.',
        shapes: mirror(function (s) {
          return { type: 'box', size: [beamT, beamH, E.panel.length], center: [s * (xPanelIn - beamT / 2), panelTop - beamH / 2, z(E.panel.length / 2)] };
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
        shapes: [beamT / 2, E.panel.length - beamT / 2].map(function (d) {
          return { type: 'box', size: [fullW, beamH, beamT], center: [0, beamY, z(d)] };
        })
      },
      {
        id: 'crossbar', group: 'base', color: 'honey', qty: nCross + 2, core: true,
        name: 'Traverse',
        cuts: [{ stock: 'chevron', length: E.panel.length - 2 * beamT, qty: nCross + 2, label: 'Traverse d\'assise' }],
        size: [E.panel.length - 2 * beamT, beamH, beamT],
        material: 'Même chevron que les longerons, posé sur chant',
        dims: [
          ['Longueur', E.panel.length - 2 * beamT, 'm'],
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
            type: 'box', size: [beamT, beamH, E.panel.length - 2 * beamT],
            center: [-reach + i * 2 * reach / (nCross + 1), beamY, z(E.panel.length / 2)]
          };
        })
      },
      {
        id: 'deck', group: 'base', color: 'deck', qty: 1, core: true, layer: 'mdf',
        name: 'Plateau d\'assise',
        cuts: [{ stock: 'mdf18', length: frameW, width: E.panel.length, qty: 1, label: 'Plateau d\'assise' }],
        size: [frameW, E.panel.length, F.deck],
        material: 'MDF 18 mm, cloué sur le cadre',
        dims: [
          ['Longueur', frameW, 'm'],
          ['Profondeur', E.panel.length, 'm'],
          ['Épaisseur', F.deck, 'm'],
          ['Dessus par rapport au sol', deckTop, 'm']
        ],
        note: 'Ferme le cadre et le contrevente ; la mousse est collée dessus. Le MDF est trois fois moins raide ' +
              'que le contreplaqué et flue sous charge : il ne porte ici que sur ' + fr(barPitch - beamT) +
              ' cm entre deux tasseaux. Percer des trous d\'aération (ø 3 cm, tous les 20 cm) : une mousse collée sur ' +
              'un panneau plein ne respire pas par le dessous.',
        shapes: [{ type: 'box', size: [frameW, F.deck, E.panel.length], center: [0, deckTop - F.deck / 2, z(E.panel.length / 2)] }]
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
        shapes: [beamT / 2, E.panel.length - beamT / 2].reduce(function (acc, d) {
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
      // Enveloppes à garnir, pour le calcul du tissu (sofa-bom.js).
      cover: {
        seat: { length: 2 * xPanelOut, depth: E.panel.length + 2 * K.wad, drop: S - K.bottom },
        back: { length: 2 * xPanelOut, height: backH, thick: backT }
      },
      // Ce dont l'audit de solidité a besoin (sofa-bom.js).
      audit: {
        beamT: beamT, beamH: beamH, legSpan: legPitch, crossSpan: E.panel.length - beamT, pitch: barPitch, deckT: F.deck,
        backSpan: M.width, ribW: M.back.ribW, rib: M.back.rib,
        lever: Math.hypot(axis[0] - pv.d, axis[1] - pv.h), camT: C.thick, barR: M.bar.r, uprightT: F.upright,
        // Lit : bord avant du dossier rabattu, pieds du lit, pivots, pieds avant et milieu du bloc d'assise (distances « d »).
        bed: { edge: pv.d - tTop, leg: frontD - K.legGap - 2, pivot: pv.d, frontLeg: beamT / 2, middle: E.panel.length / 2, seatMass: 55 }
      },
      parts: parts,
      // Axes de rotation des deux ensembles mobiles.
      pivot: { back: { y: pv.h, z: z(pv.d) }, cam: { y: axis[1], z: z(axis[0]) } },
      // Rotation de l'ensemble dossier autour de l'axe x. « lift » : dossier soulagé, le temps de tourner le taquet.
      angle: { lounge: -leanLounge, sofa: -lean, lift: -leanLift, bed: Math.PI / 2 },
      // Rotation des taquets. « follow » : angle du taquet qui suit le montant, pour chaque angle du dossier.
      cam: { engaged: camEngaged, retracted: camRetracted, follow: follow },
      // Zone à cadrer pour observer le mécanisme.
      focus: { min: [xPanelIn - 6, axis[1] - 20, z(axis[0] + 30)], max: [xBarEnd + 1, axis[1] + 22, z(axis[0] - 30)] },
      flipDeg: Math.round(90 + lean / DEG),
      // Ce que la modification change, pour la vue d'ensemble.
      custom: [
        ['Inclinaison du dossier — droite', fr(lean / DEG) + '°', 'p'],
        ['Inclinaison du dossier — détente', fr(leanLounge / DEG) + '°', 'm'],
        ['Largeur hors tout', round1(2 * xOut), 'm'],
        ['Largeur avec les leviers', round1(2 * (xLever + V.t)), 'm'],
        ['Profondeur en canapé', round1(Math.max(rearD, place(tTop, pRear, lean)[0]) - frontD), 'm'],
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
        lounge: { min: [-xOut, 0, z(loungeRear)], max: [xOut, loungeTop, z(frontD)] },
        sofa: { min: [-xOut, 0, z(Math.max(rearD, place(tTop, pRear, lean)[0]))], max: [xOut, L.height, z(frontD)] },
        bed: { min: [-xOut, 0, z(rearD)], max: [xOut, S, z(pv.d - tTop)] }
      }
    };
  }

  var api = { LISTING: LISTING, EST: EST, MOD: MOD, build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaModel = api;
})(typeof self !== 'undefined' ? self : this);
