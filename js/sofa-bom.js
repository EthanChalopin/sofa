/*
 * Achats, débit et contrôle de solidité, calculés à partir du modèle (sofa-model.js).
 *
 * Tout part des pièces du modèle : chacune déclare ce qu'il faut couper (« cuts ») et dans quel article
 * du catalogue. Changer une cote du modèle (par exemple MOD.width, la longueur du canapé) suffit donc
 * pour refaire la liste d'achats, le plan de coupe et l'audit.
 *
 * Unités : centimètres et euros. Sans dépendance : sert à la fois dans la page et en ligne de commande.
 */
(function (root) {
  'use strict';

  // Ce qu'on achète. Prix relevés sur leroymerlin.fr : à vérifier en magasin.
  var CATALOG = {
    chevron: { name: 'Chevron sapin traité 50 × 70 mm, 3 m', length: 300, price: 7.89 },
    plank: { name: 'Planche sapin rabotée 27 × 140 mm, 2,4 m', length: 240, price: 18.90 },
    mdf18: { name: 'Panneau MDF 18 mm, 250 × 122 cm', panel: [250, 122], price: 49.90 },
    mdf10: { name: 'Panneau MDF 10 mm, 250 × 122 cm', panel: [250, 122], price: 44.90 },
    foot: { name: 'Pied de meuble hêtre, 5 cm', price: 6.88, estimate: true },   // prix relevé pour le modèle de 10 cm
    bolt: { name: 'Boulon M10 × 120 avec écrou et rondelles', price: 2.50, estimate: true },
    dowel: { name: 'Tourillon / rond de hêtre ø 30 mm, 1 m', length: 100, price: 6.50, estimate: true }
  };
  // Petites fournitures, chiffrées en bloc.
  var EXTRAS = [{ name: 'Pointes crantées, vis, patins feutre', price: 30, estimate: true }];
  var KERF = 0.4;                                         // trait de scie perdu à chaque coupe
  // Mousse : un seul prix relevé, sur le configurateur de matelaspourtous.com, pour une plaque d'épaisseur standard.
  // Les plaques du canapé sont estimées au prorata de leur volume. « minThick » et « maxSide » : limites de la découpe sur mesure.
  var FOAM_QUOTE = { size: [200, 100, 20], price: 274, read: '10 octobre 2026', minThick: 5, maxSide: 200 };
  var FOAM_RATE = FOAM_QUOTE.price / (FOAM_QUOTE.size[0] * FOAM_QUOTE.size[1] * FOAM_QUOTE.size[2] / 1000);   // euros par litre
  // Un champ laissé à null apparaît « à remplir » dans MATERIAUX.md. La ouate n'est pas encore choisie.
  // « quality » : densité et fermeté pour une mousse, grammage pour la ouate.
  // « perLitre » : prix d'une mousse au litre. « price » : prix total de la ouate, en euros.
  var SOFT = {
    seatFoam: { supplier: 'Matelas pour tous', reference: 'Découpe de mousse sur mesure', quality: 'HD 40 kg/m³, très ferme', perLitre: FOAM_RATE },
    backFoam: { supplier: 'Matelas pour tous', reference: 'Découpe de mousse sur mesure', quality: 'HD 40 kg/m³, très ferme', perLitre: FOAM_RATE },
    wadding: { supplier: null, reference: null, quality: null, price: null }
  };

  function round1(v) { return Math.round(v * 10) / 10; }
  function fr(v) { return String(round1(v)).replace('.', ','); }

  // Toutes les coupes demandées par le modèle, à plat.
  function pieces(model) {
    var out = [];
    model.parts.forEach(function (part) {
      (part.cuts || []).forEach(function (cut) {
        out.push({ stock: cut.stock, length: cut.length ? round1(cut.length) : 0, width: cut.width ? round1(cut.width) : 0, qty: cut.qty, part: cut.label || part.name });
      });
    });
    return out;
  }

  // Débit de barres : les plus longues d'abord, chacune dans la barre entamée où elle laisse le moins de chute.
  function packBars(list, stockLength) {
    var bars = [], tooLong = [];
    list.slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (piece) {
      if (piece.length > stockLength) { tooLong.push(piece); return; }
      var best = null;
      bars.forEach(function (bar) {
        var left = bar.left - piece.length - (bar.pieces.length ? KERF : 0);
        if (left >= 0 && (!best || left < best.left)) best = { bar: bar, left: left };
      });
      if (!best) { best = { bar: { pieces: [], left: stockLength }, left: stockLength - piece.length }; bars.push(best.bar); }
      best.bar.pieces.push(piece);
      best.bar.left = round1(best.left);
    });
    return { bars: bars, tooLong: tooLong };
  }

  // Débit de panneaux : des bandes dans la longueur du panneau, empilées dans sa largeur.
  function packPanels(list, size) {
    var panels = [], tooBig = [];
    list.slice().sort(function (a, b) { return b.width - a.width || b.length - a.length; }).forEach(function (piece) {
      if (piece.length > size[0] || piece.width > size[1]) { tooBig.push(piece); return; }
      var placed = panels.some(function (panel) {
        var strip = panel.strips.filter(function (s) { return s.width >= piece.width && s.left >= piece.length + KERF; })[0];
        if (strip) { strip.pieces.push(piece); strip.left -= piece.length + KERF; return true; }
        if (panel.left >= piece.width + (panel.strips.length ? KERF : 0)) {
          panel.left -= piece.width + (panel.strips.length ? KERF : 0);
          panel.strips.push({ width: piece.width, left: size[0] - piece.length, pieces: [piece] });
          return true;
        }
        return false;
      });
      if (!placed) panels.push({ left: size[1] - piece.width, strips: [{ width: piece.width, left: size[0] - piece.length, pieces: [piece] }] });
    });
    return { panels: panels, tooBig: tooBig };
  }

  // Liste d'achats et plans de coupe.
  function plan(model) {
    var byStock = {}, lines = [], cutting = [], warnings = [];
    pieces(model).forEach(function (p) {
      for (var i = 0; i < p.qty; i++) (byStock[p.stock] = byStock[p.stock] || []).push(p);
    });
    Object.keys(CATALOG).forEach(function (key) {
      var item = CATALOG[key], list = byStock[key];
      if (!list) return;
      var qty = list.length;
      if (item.length) {
        var packed = packBars(list, item.length);
        qty = packed.bars.length;
        cutting.push({ key: key, name: item.name, bars: packed.bars });
        packed.tooLong.forEach(function (p) {
          warnings.push(p.part + ' : ' + fr(p.length) + ' cm à couper, mais « ' + item.name + ' » ne fait que ' + item.length + ' cm.');
        });
      } else if (item.panel) {
        var sheets = packPanels(list, item.panel);
        qty = sheets.panels.length;
        cutting.push({ key: key, name: item.name, panels: sheets.panels });
        sheets.tooBig.forEach(function (p) {
          warnings.push(p.part + ' : ' + fr(p.length) + ' × ' + fr(p.width) + ' cm, plus grand que « ' + item.name + ' ».');
        });
      }
      lines.push({ key: key, name: item.name, qty: qty, price: item.price, total: qty * item.price, estimate: !!item.estimate });
    });
    EXTRAS.forEach(function (x) { lines.push({ name: x.name, qty: 1, price: x.price, total: x.price, estimate: true }); });
    var sum = function (keep) { return lines.filter(keep).reduce(function (t, l) { return t + l.total; }, 0); };
    return {
      lines: lines, cutting: cutting, warnings: warnings,
      checked: sum(function (l) { return !l.estimate; }), estimated: sum(function (l) { return l.estimate; }),
      total: sum(function () { return true; })
    };
  }

  // Contrôle de solidité : formules de poutre simples et valeurs courantes. Des estimations, pas des essais.
  // Chaque ligne donne la sollicitation en pourcentage de la limite admise (100 % = à ne pas dépasser).
  function audit(model) {
    var A = model.audit, g = 9.81, person = 100 * g;
    var LIMIT = { softwood: 1100, mdf: 900, plywood: 1500, plywoodBearing: 1500, hardwood: 1500 };   // N/cm² ; contreplaqué bouleau et hêtre en flexion : environ le tiers de leur résistance
    var E_SOFT = 0.9e6, E_MDF = 0.3e6;
    var W = A.beamT * A.beamH * A.beamH / 6, I = A.beamT * Math.pow(A.beamH, 3) / 12;
    var rows = [];
    function row(name, stress, limit, note) { rows.push({ name: name, pct: Math.round(100 * stress / limit), note: note || '' }); }

    var onSpan = 1.5 * person * 0.65;                     // 1,5 personne sur une travée, 65 % sur le longeron avant
    row('Longeron d\'assise', onSpan * A.legSpan / 4 / W, LIMIT.softwood,
        'portée ' + fr(A.legSpan) + ' cm, flèche ' + fr(onSpan * Math.pow(A.legSpan, 3) / (48 * E_SOFT * I) * 10) + ' mm');
    row('Traverse d\'assise', person * A.crossSpan / 4 / W, LIMIT.softwood,
        'une personne pile dessus, flèche ' + fr(person * Math.pow(A.crossSpan, 3) / (48 * E_SOFT * I) * 10) + ' mm');
    var free = A.pitch - A.beamT, load = person / 1600;   // la mousse répartit une personne sur 40 × 40 cm
    row('Plateau en MDF', load * free * free / 8 / (A.deckT * A.deckT / 6), LIMIT.mdf,
        'portée libre ' + fr(free) + ' cm, flèche ' + fr(3 * 5 * load * Math.pow(free, 4) / (384 * E_MDF * Math.pow(A.deckT, 3) / 12) * 10) + ' mm avec fluage');

    var onBack = 80 * g, Wb = 2 * A.ribW * A.rib * A.rib / 6, Ib = 2 * A.ribW * Math.pow(A.rib, 3) / 12;
    row('Cadre du dossier, en lit', onBack * A.backSpan / 4 / Wb, LIMIT.softwood,
        '80 kg au milieu des ' + fr(A.backSpan) + ' cm, flèche ' + Math.round(onBack * Math.pow(A.backSpan, 3) / (48 * E_SOFT * Ib) * 10) + ' mm');

    var moment = 3 * 250 * 50 * 0.6;                      // 3 personnes adossées, 60 % de l'effort sur un côté
    var onStop = moment / A.stopArm, onBolt = onStop + 3 * 250 * 0.6, D = 2 * A.stopR;
    // La butée sort du flanc en console ; le montant appuie au milieu de son épaisseur.
    row('Butée, en flexion', onStop * (A.stopOut / 2) / (Math.PI * Math.pow(D, 3) / 32), LIMIT.hardwood,
        'hêtre ø ' + fr(D * 10) + ' mm, effort ' + Math.round(onStop) + ' N, à ' + fr(A.stopArm) + ' cm du pivot');
    row('Boulon de pivot, dans le montant', onBolt / A.uprightT, LIMIT.plywoodBearing, 'M10, effort ' + Math.round(onBolt) + ' N');

    // Bascule du lit : 100 kg assis au bord avant du dossier rabattu. Le dossier pose au sol par la pointe des accoudoirs.
    // Ce qui dépasse devant elle tire le pivot vers le haut ; seul le poids du bloc d'assise le retient, autour de ses
    // pieds avant comme de ses pieds arrière.
    var B = A.bed, seatM = mass(model, 'base'), backM = mass(model, 'back');
    var lift = Math.max(0, (100 * (B.leg - (B.edge + 3)) + backM.kg * (B.leg - backM.d)) / (B.pivot - B.leg));
    var tip = Math.max(lift * (B.pivot - B.frontLeg) / (seatM.d - B.frontLeg), lift * (B.rearLeg - B.pivot) / (B.rearLeg - seatM.d));
    row('Bascule du lit', tip, seatM.kg, '100 kg au bord avant, accoudoirs au sol à ' + fr(B.leg - B.edge) + ' cm du bord ; ' +
        'bloc d\'assise ' + Math.round(seatM.kg) + ' kg, dossier ' + Math.round(backM.kg) + ' kg (estimés)');
    // Accoudoirs en lit : dans le même cas, le sol les repousse de tout ce que le dossier et la personne pèsent devant le
    // pivot. Chaque branche porte la moitié de cette réaction, qui la fait fléchir d'autant plus que la pointe est loin,
    // à l'horizontale, de la section considérée (le contreplaqué travaille sur son chant, 3 cm d'épaisseur).
    var onFeet = (100 * (B.pivot - (B.edge + 3)) + backM.kg * (B.pivot - backM.d)) / (B.pivot - B.leg) * g / 2, R = A.arm, worst = 0, at = 0;
    R.t.forEach(function (t, i) {
      var s = onFeet * Math.abs(t - R.tip) / (A.uprightT * R.width[i] * R.width[i] / 6);
      if (s > worst) { worst = s; at = i; }
    });
    row('Accoudoir en lit, en flexion', worst, LIMIT.plywood, Math.round(onFeet) + ' N par pointe ; branche de ' + fr(R.width[at]) +
        ' cm, à ' + fr(Math.abs(R.t[at] - R.tip)) + ' cm de la pointe');
    return rows;
  }

  // Masse et centre de gravité (distance d depuis l'avant de l'assise, en position lit) d'un ensemble, d'après le
  // volume de ses pièces. Tissu, ouate et quincaillerie sont négligés.
  var DENSITY = { honey: 450, mahogany: 680, padwood: 700, deck: 750, foam: 40 };   // kg/m³ : sapin, contreplaqué bouleau, hêtre, MDF, mousse HD
  function mass(model, group) {
    var half = model.seatDepth / 2, pv = model.pivot.back, a = model.angle.bed, kg = 0, moment = 0;
    function toD(z, y) { return group === 'back' ? half - (pv.z + y * Math.sin(a) + z * Math.cos(a)) : half - z; }
    model.parts.forEach(function (part) {
      var rho = DENSITY[part.color];
      if (part.group !== group || !rho || part.layer === 'cover' || part.symbolic) return;
      part.shapes.forEach(function (s) {
        var vol = 0, d = 0;
        if (s.type === 'box') { vol = s.size[0] * s.size[1] * s.size[2]; d = toD(s.center[2], s.center[1]); }
        else if (s.type === 'frustum') { vol = Math.pow((s.top + s.bottom) / 2, 2) * (s.y1 - s.y0); d = toD(s.z, (s.y0 + s.y1) / 2); }
        else if (s.type === 'profile') {
          var area = 0, cz = 0, cy = 0;
          s.pts.forEach(function (p, i) {
            var q = s.pts[(i + 1) % s.pts.length], c = p[0] * q[1] - q[0] * p[1];
            area += c / 2; cz += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c;
          });
          vol = Math.abs(area) * (s.x1 - s.x0); d = toD(cz / (6 * area), cy / (6 * area));
        }
        kg += vol * rho / 1e6; moment += vol * rho / 1e6 * d;
      });
    });
    return { kg: kg, d: moment / kg };
  }

  // Tissu à acheter. Les rayures et les motifs courent d'avant en arrière sur l'assise et montent sur le
  // dossier. En général la longueur du rouleau suit donc ce sens, et chaque bloc est habillé de plusieurs
  // largeurs de tissu (des « lés ») cousues côte à côte.
  var SEAM = 1.5, TUCK = 5, SPARE = 0.10;                 // couture ; retour agrafé sous le cadre ; marge de coupe
  function fabricNeed(model, fabric) {
    var seat = model.cover.seat, back = model.cover.back;
    var girth = 2 * (back.height + back.thick);           // tour du dossier, garni sur ses deux faces
    var area = (seat.length * seat.depth + 2 * seat.drop * (seat.length + seat.depth) +
                back.length * girth + 2 * back.height * back.thick) / 1e4;
    var across = seat.length + 2 * SEAM;                  // longueur du canapé, coutures comprises
    var seatBand = seat.depth + 2 * seat.drop + 2 * TUCK, backBand = girth + TUCK + 2 * SEAM;
    var flank = seat.drop + TUCK + SEAM, lays, metres, spare;
    // Rayures en travers du rouleau : si chaque bande tient dans la largeur, le tissu est tourné d'un quart de
    // tour. Les bandes se coupent alors dans la largeur, et la longueur du canapé dans celle du rouleau, sans
    // couture. Sinon le tissu se pose comme les autres, et ses rayures courent dans la longueur du canapé.
    var turned = !!fabric.weft && seatBand <= fabric.width && backBand <= fabric.width;
    if (turned) {
      lays = 1;
      var together = seatBand + backBand <= fabric.width;
      metres = (together ? 1 : 2) * across;
      spare = together ? fabric.width - seatBand - backBand : 0;
      // Les flancs de l'assise se prennent dans la chute si elle est assez large, sinon dans une longueur de plus.
      if (spare < flank) metres += (2 * (seat.depth + 2 * SEAM) <= fabric.width ? 1 : 2) * flank;
    } else {
      lays = Math.ceil(across / fabric.width);
      // Avec un motif, chaque lé repart du même point du dessin : sa longueur est arrondie au raccord.
      var strip = function (length) { return fabric.repeat ? Math.ceil(length / fabric.repeat) * fabric.repeat : length; };
      metres = lays * (strip(seatBand) + strip(backBand));
      // Les flancs de l'assise et les bouts du dossier se prennent dans la chute du dernier lé, si elle est assez large.
      spare = lays * fabric.width - across;
      if (spare < flank) metres += 2 * flank + back.thick + 2 * SEAM;
    }
    metres = Math.ceil(metres * (1 + SPARE) / 10) / 10;   // en mètres, arrondi aux 10 cm supérieurs
    return {
      area: area, lays: lays, turned: turned, along: !!fabric.weft && !turned, metres: metres, bought: metres * fabric.width / 100,
      price: fabric.price ? metres * fabric.price : null
    };
  }

  var api = { fabricNeed: fabricNeed, CATALOG: CATALOG, EXTRAS: EXTRAS, SOFT: SOFT, FOAM_QUOTE: FOAM_QUOTE, KERF: KERF, pieces: pieces, plan: plan, audit: audit };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaBom = api;
})(typeof self !== 'undefined' ? self : this);
