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
    tube: { name: 'Tube rond acier ø 16 mm, 2 m', length: 200, price: 9.50 },
    sleeve: { name: 'Tube IRL ø 25 mm, 2 m', length: 200, price: 2.29 },
    foot: { name: 'Pied conique hêtre, 10 cm', price: 6.88 },
    bolt: { name: 'Boulon M10 × 120 avec écrou et rondelles', price: 2.50, estimate: true }
  };
  // Petites fournitures, chiffrées en bloc.
  var EXTRAS = [{ name: 'Pointes crantées, vis, colliers, chute de hêtre, tourillon ø 12', price: 35, estimate: true }];
  var KERF = 0.4;                                         // trait de scie perdu à chaque coupe

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
    var LIMIT = { softwood: 1100, mdf: 900, plywoodBearing: 1500, steel: 23500 };   // N/cm²
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
    var onCam = moment / A.lever, onBolt = onCam + 3 * 250 * 0.6, D = 2 * A.barR, d = D - 0.2;
    row('Tube de commande', onCam * (A.camT / 2) / (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4)) / (32 * D)), LIMIT.steel,
        'paroi de 1 mm, effort ' + Math.round(onCam) + ' N sur le taquet');
    row('Boulon de pivot, dans le montant', onBolt / A.uprightT, LIMIT.plywoodBearing, 'M10, effort ' + Math.round(onBolt) + ' N');

    var seat = A.bed.edge + 3, lift = 100 * (A.bed.leg - seat) / (A.bed.pivot - A.bed.leg);
    var needed = lift * (A.bed.pivot - A.bed.frontLeg) / (A.bed.middle - A.bed.frontLeg);
    row('Bascule du lit', needed, A.bed.seatMass, '100 kg assis au bord avant ; bloc d\'assise estimé à ' + A.bed.seatMass + ' kg');
    return rows;
  }

  var api = { CATALOG: CATALOG, EXTRAS: EXTRAS, KERF: KERF, pieces: pieces, plan: plan, audit: audit };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SofaBom = api;
})(typeof self !== 'undefined' ? self : this);
