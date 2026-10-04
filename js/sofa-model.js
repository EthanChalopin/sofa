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
    extraLean: 12,                                        // degrés d'inclinaison en plus
    cam: {
      t: 13,                                              // où le taquet touche la queue du montant (distance au pivot)
      flank: 3,                                           // de l'axe au flanc : appui en position détente
      heel: 3,                                            // de l'axe au talon
      handle: 15,                                         // longueur du manche
      handleV: [1, 4]                                     // le manche est déporté, pour laisser passer les doigts
    },
    bar: { proud: 0.3 },                                  // la barre affleure le taquet à 3 mm près
    pin: { r: 0.6, length: 2.5 },                         // pions de fin de course
    liftMargin: 0.3                                       // degrés de marge pour dégager le taquet
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

    var xOut = L.width / 2;
    var xPanelOut = xOut - E.plyT;          // les montants sont plaqués à l'extérieur des panneaux
    var xPanelIn = xPanelOut - E.plyT;
    var innerW = 2 * xPanelIn;
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
      return (L.seatHeight - hp) * (1 + Math.sin(leanLounge)) / Math.cos(leanLounge);
    }
    function pivotFor(hp) {
      return { d: E.seat.front + cutAt(hp), h: hp, pF: L.seatHeight - hp - E.back.t };
    }
    // Position de la face avant du dossier, en position droite.
    function facePlane(pivot, pF) { return pivot.d * Math.cos(lean) - pivot.h * Math.sin(lean) + pF; }
    function solvePivot() {
      var target = facePlane(E.pivot, pFront0), low = 0, high = L.seatHeight - E.back.t;
      for (var k = 0; k < 50; k++) {
        var trial = pivotFor((low + high) / 2);
        if (facePlane(trial, trial.pF) > target) low = trial.h; else high = trial.h;
      }
      return pivotFor((low + high) / 2);
    }
    var pv = solvePivot();
    // Les cotes relevées sur les photos partent de l'ancien pivot : (shiftT, shiftP) les ramène au nouveau.
    var shiftT = (E.pivot.d - pv.d) * Math.sin(lean) + (E.pivot.h - pv.h) * Math.cos(lean);
    var shiftP = E.pivot.h - pv.h;
    function moved(pts) { return pts.map(function (pt) { return [pt[0] + shiftT, pt[1] + shiftP]; }); }

    // --- Ensemble pivotant ---
    // En position lit le dossier est à plat devant l'assise, à la même hauteur qu'elle,
    // et les manchettes touchent le sol.
    var tTop = tTop0 + shiftT;
    var pRear = L.seatHeight - pv.h;               // face arrière du dossier (dessus du couchage en lit)
    var pFront = pRear - E.back.t;
    var pMid = (pFront + pRear) / 2;
    var pFoot = -pv.h;                             // bout de la manchette (au sol en lit)

    // Position (d, hauteur) d'un point de l'ensemble pivotant, dossier incliné de « a ».
    function place(t, p, a) {
      return [pv.d + t * Math.sin(a) + p * Math.cos(a), pv.h + t * Math.cos(a) - p * Math.sin(a)];
    }

    // --- Dossier : un bloc rigide, coupé droit ---
    var tBottom = cutAt(pv.h);
    var backH = tTop - tBottom;
    // Jour entre l'assise et le bas du dossier : [arête avant, arête arrière], dans chaque position assise.
    var gapUpright = [pFront, pRear].map(function (p) { return place(tBottom, p, lean)[1] - L.seatHeight; });
    var gapLounge = place(tBottom, pFront, leanLounge)[1] - L.seatHeight;
    var bedDepth = tTop - pv.d + E.seat.front + E.seat.depth;          // du bord du dossier rabattu à l'arrière des coussins

    // Manchette : inclinée de padSkew par rapport à la perpendiculaire au dossier ; son coin le plus bas
    // touche le sol en position lit.
    var padSkew = lean - E.pad.tilt * DEG;
    var padCenter = [45.8 + shiftT, pFoot + E.pad.length / 2 * Math.cos(padSkew) + E.pad.t / 2 * Math.sin(padSkew)];
    var padSeat = function (p) {                   // t du dessous de la manchette, là où elle repose sur le bras
      return padCenter[0] - E.pad.t / 2 / Math.cos(padSkew) + (p - padCenter[1]) * Math.tan(padSkew);
    };

    // Contour du montant (pièce en Y), relevé sur la photo de profil. Points [t, p] ; les valeurs
    // chiffrées sont celles du relevé, décalées vers le nouveau pivot. Seule la queue change de longueur.
    var capR = 2.6;
    var yRear = pRear - 0.5, yTop = tTop - 0.5, yFront = 12.6 + shiftP;
    var kink = [40.4 + shiftT, yRear], tailFront = [30.6 + shiftT, 7.7 + shiftP];
    var aRear = Math.atan2(kink[1], kink[0]) - Math.asin(capR / Math.hypot(kink[0], kink[1]));
    var aFront = Math.atan2(tailFront[1], tailFront[0]) + Math.asin(capR / Math.hypot(tailFront[0], tailFront[1]));
    var tailRearDir = [Math.cos(aRear), Math.sin(aRear)];
    var capStart = [capR * Math.cos(aRear + Math.PI / 2), capR * Math.sin(aRear + Math.PI / 2)];
    var uprightOutline = join([
      arc(0, 0, capR, aRear + Math.PI / 2, aFront + 1.5 * Math.PI, 16),                    // bout arrondi autour du boulon
      spline([tailFront].concat(moved([[31.9, 8.0], [33.8, 7.55], [35.5, 6.3], [36.6, 5.1], [37.8, 3.3],  // dessous du bras
              [38.8, 0.25], [39.5, -3.1], [41.0, -8.3], [41.8, -11.2],
              [42.3, -12.3], [43.1, -12.8], [43.8, -12.5]]), [[padSeat(-11.8 + shiftP), -11.8 + shiftP]]), 6),   // bout du bras
      spline([[padSeat(2.9 + shiftP), 2.9 + shiftP]].concat(moved([[44.6, 4.6], [44.3, 6.0], [45.4, 8.7],         // aisselle
              [48.4, 10.5], [52.4, 11.8], [56.6, 12.4]]), [[64.8 + shiftT, yFront]]), 6),
      quad([yTop - 0.8, 13.2 + shiftP], [yTop, 13.2 + shiftP], [yTop, 14.0 + shiftP], 4),
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

    var camLen = nose + C.heel + C.handle, camWidth = C.flank + C.handleV[1];
    var handleW = C.handleV[1] - C.handleV[0], handleMid = (C.handleV[0] + C.handleV[1]) / 2;
    var camOutline = join([
      [[nose, -C.flank], [nose, C.flank], [-C.heel, C.flank], [-C.heel, C.handleV[1]]],
      arc(-C.heel - C.handle + handleW / 2, handleMid, handleW / 2, Math.PI / 2, 1.5 * Math.PI, 8),   // bout du manche
      [[-C.heel, C.handleV[0]], [-C.heel, -C.flank]]
    ]);
    // Position (d, hauteur) d'un point du taquet, nez orienté selon « phi ».
    function camPoint(u, v, phi) {
      return [axis[0] + u * Math.cos(phi) - v * Math.sin(phi), axis[1] + u * Math.sin(phi) + v * Math.cos(phi)];
    }
    // Pions de fin de course : l'un arrête le manche taquet relevé, l'autre arrête le corps taquet couché.
    var pinUp = camPoint(-C.heel - 1, C.handleV[1] + M.pin.r, camEngaged);
    var pinDown = camPoint(nose - 1, C.flank + M.pin.r, camRetracted);
    var xBarEnd = xPanelOut + E.peg.length + M.bar.proud;

    // Repère de l'ensemble « back » : (x, y, z) = (x, t, -p) ; de l'ensemble « cam » : (x, y, z) = (x, v, -u).
    var local = function (pt) { return [-pt[1], pt[0]]; };
    var uprightPts = uprightOutline.map(local);
    var backPts = [[tBottom, pFront], [tTop, pFront], [tTop, pRear], [tBottom, pRear]].map(local);    var camPts = camOutline.map(function (pt) { return [-pt[0], pt[1]]; });

    var panelPts = [
      [0, E.panel.top], [E.panel.length, E.panel.top], [E.panel.length, E.panel.top - E.panel.endH],
      [E.panel.lowD, E.panel.lowH], [0, E.panel.top - E.panel.endH]
    ].map(function (pt) { return [z(pt[0]), pt[1]]; });

    var railY = E.rail.top - E.rail.h / 2;
    var legH = E.rail.top - E.rail.h;
    var legX = xOut - E.leg.fromEnd;
    var legD = E.leg.fromEdge + E.leg.top / 2;
    var seatW = innerW / E.seat.count;
    var seatY = L.seatHeight - E.seat.t / 2;
    var seatD = E.seat.front + E.seat.depth / 2;
    // Profondeur d'assise : de l'avant des coussins à la face avant du dossier, au niveau de l'assise.
    var seatUsable = Math.round(place((L.seatHeight - pv.h + pFront * Math.sin(lean)) / Math.cos(lean), pFront, lean)[0] - E.seat.front);
    var deckDepth = E.panel.length - 2 * (E.rail.inset + E.rail.t);
    var screwTs = [tBottom + 4, (tBottom + tTop) / 2, tTop - 4];
    var padX = xOut - E.pad.width / 2;
    var loungeTop = place(tTop, pFront, leanLounge)[1];
    var loungeDepth = Math.max(L.depthSofa, place(tTop, pRear, leanLounge)[0]);
    var swing = (camRetracted - camEngaged) / DEG;

    function mirror(make) { return [make(1), make(-1)]; }
    function span(sign, a, b) { return sign > 0 ? { x0: a, x1: b } : { x0: -b, x1: -a }; }

    var parts = [
      {
        id: 'upright', group: 'back', color: 'mahogany', qty: 2,
        name: 'Montant en Y',
        size: [round1(ub.max[0] - ub.min[0]), round1(ub.max[1] - ub.min[1]), E.plyT],
        material: 'Contreplaqué 18–20 mm, teinté acajou',
        dims: [
          ['Encombrement — longueur', round1(ub.max[0] - ub.min[0]), 'p'],
          ['Encombrement — largeur', round1(ub.max[1] - ub.min[1]), 'p'],
          ['Épaisseur', E.plyT, 'p'],
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
        id: 'back', group: 'back', color: 'fabric', qty: 1,
        name: 'Dossier',
        size: [2 * xPanelOut, round1(backH), E.back.t],
        material: 'Cadre bois garni, tissu vert — rembourré sur les deux faces',
        dims: [
          ['Longueur', 2 * xPanelOut, 'p'],
          ['Hauteur', round1(backH), 'm'],
          ['Épaisseur', E.back.t, 'p'],
          ['Inclinaison en position droite', fr(lean / DEG) + '°', 'p'],
          ['Inclinaison en position détente', fr(leanLounge / DEG) + '°', 'm'],
          ['Jour sous le dossier, position droite', fr(gapUpright[1]) + ' à ' + fr(gapUpright[0]) + ' cm', 'm'],
          ['Jour sous le dossier, détente', '0 à ' + fr(gapLounge) + ' cm', 'm']
        ],
        note: 'Un seul bloc rigide entre les deux montants, coupé droit. Modifié : il est plus court que sur l\'original ' +
              '(46 cm), raccourci par le bas pour que son arête arrière affleure la banquette en position détente. ' +
              'En lit, son bas vient contre la face avant des coussins, sans creux. Contrepartie : en position assise ' +
              'il reste un jour entre l\'assise et le bas du dossier, plus grand à l\'avant qu\'à l\'arrière. ' +
              'La face arrière devient le couchage en lit : elle doit être garnie comme la face avant.',
        shapes: [{ type: 'profile', pts: backPts, x0: -xPanelOut, x1: xPanelOut, radius: E.back.radius }]
      },
      {
        id: 'pad', group: 'back', color: 'padwood', qty: 2,
        name: 'Manchette d\'accoudoir',
        size: [E.pad.length, E.pad.width, E.pad.t],
        material: 'Bois massif (hêtre), teinté',
        dims: [
          ['Longueur', E.pad.length, 'p'],
          ['Largeur', E.pad.width, 'p'],
          ['Épaisseur', E.pad.t, 'p'],
          ['Pente en position droite', fr(E.pad.tilt) + '°', 'p'],
          ['Pente en position détente', fr(E.pad.tilt + M.extraLean) + '°', 'm']
        ],
        note: 'Fixée sur le chant du bras du montant, presque perpendiculaire au dossier ; en canapé elle remonte ' +
              'vers l\'avant. En position lit elle est quasi verticale et son extrémité pose au sol.',
        shapes: mirror(function (s) {
          return {
            type: 'box', size: [E.pad.width, E.pad.t, E.pad.length], rotX: padSkew,
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
            return { type: 'cylinder', r: E.screw.r, x0: sp.x0, x1: sp.x1, y: t, z: -pMid };
          }));
        }, [])
      },
      {
        id: 'seat', group: 'base', color: 'fabric', qty: E.seat.count,
        name: 'Coussin d\'assise',
        size: [seatW, E.seat.depth, E.seat.t],
        material: 'Mousse garnie, tissu vert',
        dims: [
          ['Largeur', seatW, 'p'],
          ['Profondeur', E.seat.depth, 'p'],
          ['Épaisseur', E.seat.t, 'p'],
          ['Dessus par rapport au sol', L.seatHeight, 'v']
        ],
        note: 'Trois coussins libres, posés entre les panneaux latéraux. En canapé ils dépassent de ' + E.seat.front +
              ' cm à l\'arrière (d\'où les 87 cm) et la profondeur utile devant le dossier est d\'environ ' + seatUsable +
              ' cm. Ils ne bougent jamais : en lit, le dossier rabattu vient s\'appuyer contre leur face avant.',
        shapes: [-1, 0, 1].map(function (i) {
          return {
            type: 'box', size: [seatW, E.seat.t, E.seat.depth], radius: E.seat.radius,
            center: [i * seatW, seatY, z(seatD)]
          };
        })
      },
      {
        id: 'panel', group: 'base', color: 'honey', qty: 2,
        name: 'Panneau latéral',
        size: [E.panel.length, E.panel.top - E.panel.lowH, E.plyT],
        material: 'Contreplaqué ou latté plaqué 18–20 mm, teinte miel',
        dims: [
          ['Longueur', E.panel.length, 'p'],
          ['Hauteur au point bas', E.panel.top - E.panel.lowH, 'p'],
          ['Hauteur aux extrémités', E.panel.endH, 'p'],
          ['Épaisseur', E.plyT, 'p'],
          ['Point bas depuis l\'avant', E.panel.lowD, 'p'],
          ['Chant supérieur par rapport au sol', E.panel.top, 'p'],
          ['Perçage de la barre', 'ø ' + fr(2 * E.peg.r + 0.2) + ' cm', 'm']
        ],
        note: 'Pentagone : chant supérieur droit, dessous en V. Reçoit le boulon de pivot, la barre à taquets ' +
              '(perçage large, la barre doit tourner librement) et les deux pions de fin de course ; ' +
              'dépasse de 2 cm au-dessus des traverses pour retenir les coussins.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelIn, xPanelOut);
          return { type: 'profile', pts: panelPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'rail', group: 'base', color: 'honey', qty: 2,
        name: 'Traverse avant / arrière',
        size: [innerW, E.rail.h, E.rail.t],
        material: 'Bois massif (hêtre), teinte miel',
        dims: [
          ['Longueur', innerW, 'p'],
          ['Hauteur', E.rail.h, 'p'],
          ['Épaisseur', E.rail.t, 'p'],
          ['Dessus par rapport au sol', E.rail.top, 'p']
        ],
        note: 'Assemblées entre les deux panneaux latéraux, en retrait de 0,5 cm par rapport à leur nez. ' +
              'La traverse arrière n\'est pas visible sur les photos : supposée identique.',
        shapes: [E.rail.inset + E.rail.t / 2, E.panel.length - E.rail.inset - E.rail.t / 2].map(function (d) {
          return { type: 'box', size: [innerW, E.rail.h, E.rail.t], center: [0, railY, z(d)] };
        })
      },
      {
        id: 'deck', group: 'base', color: 'deck', qty: 1,
        name: 'Plateau d\'assise',
        size: [innerW, deckDepth, E.deck.t],
        material: 'Hypothèse : contreplaqué ou lattes',
        dims: [
          ['Largeur', innerW, 'h'],
          ['Profondeur', deckDepth, 'h'],
          ['Épaisseur', E.deck.t, 'h']
        ],
        note: 'Support des coussins. Invisible sur les photos : sa nature (panneau, lattes, sangles ou ressorts) ' +
              'et ses cotes sont une supposition. La barre à taquets passe juste dessous.',
        shapes: [{
          type: 'box', size: [innerW, E.deck.t, deckDepth],
          center: [0, E.rail.top - E.deck.t / 2, z(E.panel.length / 2)]
        }]
      },
      {
        id: 'leg', group: 'base', color: 'honey', qty: 4,
        name: 'Pied fuselé',
        size: [legH, E.leg.top, E.leg.top],
        material: 'Bois massif (hêtre), teinte miel',
        dims: [
          ['Hauteur', legH, 'p'],
          ['Section en haut', fr(E.leg.top) + ' × ' + fr(E.leg.top) + ' cm', 'p'],
          ['Section en bas', fr(E.leg.bottom) + ' × ' + fr(E.leg.bottom) + ' cm', 'p'],
          ['Axe depuis l\'extrémité du canapé', E.leg.fromEnd, 'p']
        ],
        note: 'Section carrée, fixé sous les traverses. Le mode de fixation n\'est pas visible.',
        shapes: [[1, legD], [-1, legD], [1, E.panel.length - legD], [-1, E.panel.length - legD]].map(function (c) {
          return { type: 'frustum', top: E.leg.top, bottom: E.leg.bottom, y0: 0, y1: legH, x: c[0] * legX, z: z(c[1]) };
        })
      },
      {
        id: 'cam', group: 'cam', color: 'padwood', qty: 2,
        name: 'Taquet',
        size: [round1(camLen), camWidth, E.peg.length],
        material: 'Hêtre massif, fil dans la longueur',
        dims: [
          ['Débit — longueur', round1(camLen), 'm'],
          ['Débit — largeur', camWidth, 'm'],
          ['Épaisseur', E.peg.length, 'm'],
          ['Axe → bout du nez', round1(nose), 'm'],
          ['Axe → flanc', C.flank, 'm'],
          ['Axe → talon', C.heel, 'm'],
          ['Corps', fr(2 * C.flank) + ' × ' + fr(nose + C.heel) + ' cm', 'm'],
          ['Manche', fr(handleW) + ' × ' + fr(C.handle) + ' cm', 'm'],
          ['Perçage', 'ø ' + fr(2 * E.peg.r) + ' cm', 'm'],
          ['Rotation entre les deux positions', fr(swing) + '°', 'm']
        ],
        note: 'Fixé en bout de barre, contre le panneau. Relevé, il porte le montant sur son nez : position droite. ' +
              'Couché, il le porte sur son flanc : position détente. Tant que le dossier appuie sur le nez, le taquet ne ' +
              'peut pas tourner : il faut d\'abord soulager le dossier d\'un peu plus d\'un degré. Le manche, plus lourd ' +
              'que le nez, rappelle le taquet en position relevée ; il est déporté pour que les doigts ne touchent ' +
              'jamais le montant. Les deux taquets sont identiques : on manœuvre d\'un côté ou de l\'autre. ' +
              'Coller et visser un seul des deux, l\'autre seulement vissé, pour pouvoir démonter la barre.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelOut, xPanelOut + E.peg.length);
          return { type: 'profile', pts: camPts, x0: sp.x0, x1: sp.x1 };
        })
      },
      {
        id: 'bar', group: 'cam', color: 'honey', qty: 1,
        name: 'Barre traversante',
        size: [round1(2 * xBarEnd), 2 * E.peg.r, 2 * E.peg.r],
        material: 'Rond de hêtre, cirée au passage des panneaux',
        dims: [
          ['Diamètre', 2 * E.peg.r, 'm'],
          ['Longueur', round1(2 * xBarEnd), 'm'],
          ['Axe depuis l\'avant du panneau', round1(axis[0]), 'm'],
          ['Axe sous le chant supérieur', round1(E.panel.top - axis[1]), 'm'],
          ['Axe par rapport au sol', round1(axis[1]), 'm']
        ],
        note: 'Traverse le canapé sous le plateau d\'assise et dépasse de chaque panneau, comme les butées d\'origine. ' +
              'Elle relie les deux taquets : ils tournent forcément ensemble. Elle ne transmet que l\'effort de la main ; ' +
              'le poids du dossier passe du taquet au panneau, juste à côté.',
        shapes: [{ type: 'cylinder', r: E.peg.r, x0: -xBarEnd, x1: xBarEnd, y: 0, z: 0 }]
      },
      {
        id: 'pin', group: 'base', color: 'mahogany', qty: 4,
        name: 'Pion de fin de course',
        size: [M.pin.length, 2 * M.pin.r, 2 * M.pin.r],
        material: 'Tourillon hêtre collé dans le panneau',
        dims: [
          ['Diamètre', 2 * M.pin.r, 'm'],
          ['Saillie', M.pin.length, 'm'],
          ['Arrêt « relevé » — depuis l\'avant', round1(pinUp[0]), 'm'],
          ['Arrêt « relevé » — sous le chant', round1(E.panel.top - pinUp[1]), 'm'],
          ['Arrêt « couché » — depuis l\'avant', round1(pinDown[0]), 'm'],
          ['Arrêt « couché » — sous le chant', round1(E.panel.top - pinDown[1]), 'm']
        ],
        note: 'Deux par côté. Le premier arrête le manche quand le taquet est relevé : le nez se présente alors bien ' +
              'à plat sous le montant. Le second arrête le corps quand on lève le manche à fond : le flanc est alors ' +
              'parallèle au montant qui descend. Les positionner à l\'atelier, taquet en place.',
        shapes: [pinUp, pinDown].reduce(function (acc, pin) {
          return acc.concat(mirror(function (s) {
            var sp = span(s, xPanelOut, xPanelOut + M.pin.length);
            return { type: 'cylinder', r: M.pin.r, x0: sp.x0, x1: sp.x1, y: pin[1], z: z(pin[0]) };
          }));
        }, [])
      },
      {
        id: 'bolt', group: 'base', color: 'metal', qty: 2, symbolic: true,
        name: 'Boulon de pivot',
        material: 'Boulon traversant (≈ M8) + rondelles',
        dims: [
          ['Position depuis l\'avant du panneau', round1(pv.d), 'm'],
          ['Position sous le chant supérieur', round1(E.panel.top - pv.h), 'm'],
          ['Hauteur par rapport au sol', round1(pv.h), 'm']
        ],
        note: 'Axe de rotation de tout l\'ensemble dossier. Sa position règle à la fois l\'inclinaison du dossier ' +
              'et la jonction du lit. Par rapport à l\'original (' + fr(E.pivot.d) + ' cm de l\'avant, ' + fr(E.pivot.h) +
              ' cm du sol), il est reculé de ' + fr(pv.d - E.pivot.d) + ' cm et remonté de ' + fr(pv.h - E.pivot.h) +
              ' cm : c\'est ce qui permet à la banquette de rester fixe. Diamètre non mesurable sur les photos.',
        shapes: mirror(function (s) {
          var sp = span(s, xPanelIn, xOut + 0.4);
          return { type: 'cylinder', r: E.pivot.r, x0: sp.x0, x1: sp.x1, y: pv.h, z: z(pv.d) };
        })
      }
    ];

    return {
      listing: L,
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
        ['Profondeur en lit', round1(bedDepth), 'm'],
        ['Hauteur du dossier', round1(backH), 'm'],
        ['Profondeur en détente', round1(loungeDepth), 'm'],
        ['Hauteur en détente', round1(loungeTop), 'm'],
        ['Jour sous le dossier, position droite', fr(gapUpright[1]) + ' à ' + fr(gapUpright[0]) + ' cm', 'm'],
        ['Jour sous le dossier, détente', '0 à ' + fr(gapLounge) + ' cm', 'm'],
        ['Rotation du taquet', fr(swing) + '°', 'm'],
        ['Dossier à soulager pour tourner le taquet', fr((lean - leanLift) / DEG) + '°', 'm']
      ],
      // Encombrement hors tout (hors taquets et têtes de boulons).
      overall: {
        lounge: { min: [-xOut, 0, z(loungeDepth)], max: [xOut, loungeTop, z(0)] },
        sofa: { min: [-xOut, 0, z(L.depthSofa)], max: [xOut, L.height, z(0)] },
        bed: { min: [-xOut, 0, z(E.seat.front + E.seat.depth)], max: [xOut, L.seatHeight, z(pv.d - tTop)] }
      }
    };
  }

  var api = { LISTING: LISTING, EST: EST, MOD: MOD, build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaModel = api;
})(typeof self !== 'undefined' ? self : this);
