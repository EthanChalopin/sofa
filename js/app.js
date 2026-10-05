/*
 * Visionneuse : dessine les pièces décrites par sofa-model.js et affiche leurs cotes au clic.
 * Le panneau latéral fonctionne même sans WebGL ; la vue 3D s'y ajoute quand elle est disponible.
 */
(function () {
  'use strict';

  // La longueur du canapé peut être donnée dans l'adresse (?largeur=180) : elle remplace celle du modèle.
  var askedWidth = Number((location.search.match(/[?&]largeur=([\d.]+)/) || [])[1]);
  if (askedWidth >= 120 && askedWidth <= 300) SofaModel.MOD.width = askedWidth;

  var model = SofaModel.build();
  var parts = model.parts;
  var byId = {};
  parts.forEach(function (p) { byId[p.id] = p; });

  var COLORS = { honey: '#d48a32', mahogany: '#7a3217', padwood: '#b4541f', fabric: '#4e9463', deck: '#c9a66b', metal: '#a9abae', foam: '#ead9a0' };
  var SOURCES = {
    v: 'Cote donnée par le vendeur',
    p: 'Estimée d’après les photos (± 1 à 2 cm)',
    h: 'Hypothèse — non visible sur les photos',
    m: 'Modification personnelle — cote de conception'
  };
  var POS_NAMES = { sofa: 'canape', lounge: 'detente', bed: 'lit' };
  var LOOK_NAMES = { covered: 'habille', foam: 'mousse', mdf: 'mdf', structure: 'structure' };
  var LAYERS = ['structure', 'mdf', 'foam', 'cover'];      // ordre de pose ; le rendu « covered » montre la dernière
  var VIEW_NAMES = { iso: '3-4', front: 'face', side: 'profil', top: 'dessus', mech: 'mecanisme' };
  var PHOTO_COUNT = 16;

  var state = { part: null, pos: 'sofa', dims: true, look: 'covered' };
  var view3d = null;

  function $(id) { return document.getElementById(id); }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') node.className = props[k];
      else if (k === 'text') node.textContent = props[k];
      else node.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function fmt(v) { return String(Math.round(v * 10) / 10).replace('.', ','); }
  function cm(v) { return typeof v === 'number' ? fmt(v) + ' cm' : v; }
  function keyOf(map, value) { return Object.keys(map).filter(function (k) { return map[k] === value; })[0]; }

  // ---------------------------------------------------------------- panneau latéral

  function dimsTable(rows) {
    return el('table', { class: 'dims' }, [el('tbody', {}, rows.map(function (row) {
      return el('tr', {}, [
        el('td', { text: row[0] }),
        el('td', {}, [document.createTextNode(cm(row[1])), el('span', { class: 'dot ' + row[2], title: SOURCES[row[2]] })])
      ]);
    }))]);
  }

  function renderDetail() {
    var root = $('detail');
    root.textContent = '';
    var part = byId[state.part];

    if (!part) {
      var L = model.listing;
      root.appendChild(el('h2', { text: 'Vue d’ensemble' }));
      root.appendChild(el('p', { class: 'meta', text: 'Cotes du canapé d’origine, annoncées par le vendeur' }));
      root.appendChild(dimsTable([
        ['Largeur', L.width, 'v'],
        ['Profondeur en canapé', L.depthSofa, 'v'],
        ['Profondeur en lit', L.depthBed, 'v'],
        ['Hauteur', L.height, 'v'],
        ['Hauteur d’assise', L.seatHeight, 'v']
      ]));
      root.appendChild(el('p', {
        class: 'note',
        text: 'Lit : le dossier bascule d’environ ' + model.flipDeg + '° vers l’avant autour de deux boulons, passe au-dessus ' +
              'de l’assise et se pose à plat devant elle. Les accoudoirs se retrouvent à la verticale et deviennent les pieds du lit.'
      }));
      root.appendChild(el('p', { class: 'meta', text: 'Version modifiée : deux blocs de mousse garnis, position détente, banquette fixe' }));
      root.appendChild(dimsTable(model.custom));
      root.appendChild(el('p', {
        class: 'note',
        text: 'S’incliner : se pencher en avant pour soulager le dossier, lever l’un des deux leviers, sur le côté de ' +
              'l’assise, se laisser aller en arrière, lâcher. Se redresser : ramener le dossier vers l’avant, un peu ' +
              'au-delà de la position droite ; les taquets se relèvent seuls, on repose le dossier dessus.'
      }));
      root.appendChild(el('p', {
        class: 'note subtle',
        text: 'Quatre rendus, dans l’ordre de fabrication : « Structure » (tasseaux, panneaux, mécanisme), « MDF », ' +
              '« Mousse », puis « Habillé » (ouate et tissu). Vue « Mécanisme » : alterner Canapé et Détente pour ' +
              'suivre les taquets.'
      }));
      root.appendChild(el('p', { class: 'note subtle', text: 'Cliquez sur une pièce du modèle ou de la liste pour afficher ses cotes.' }));
      return;
    }

    var back = el('button', { type: 'button', class: 'back-link', text: '← Vue d’ensemble' });
    back.addEventListener('click', function () { select(null); });
    root.appendChild(back);
    root.appendChild(el('h2', {}, [document.createTextNode(part.name), el('span', { class: 'qty', text: '× ' + part.qty })]));
    root.appendChild(el('p', { class: 'meta', text: part.material }));
    root.appendChild(dimsTable(part.dims));
    root.appendChild(el('p', { class: 'note', text: part.note }));
  }

  function renderParts() {
    var list = $('parts');
    parts.forEach(function (part) {
      var summary = part.size ? part.size.map(fmt).join(' × ') + ' cm' : '';
      var button = el('button', { type: 'button', 'data-part': part.id }, [
        el('span', { class: 'swatch', style: 'background:' + COLORS[part.color] }),
        el('span', { text: part.name + (part.qty > 1 ? ' × ' + part.qty : '') }),
        el('small', { text: summary })
      ]);
      button.addEventListener('click', function () { select(state.part === part.id ? null : part.id); });
      list.appendChild(el('li', {}, [button]));
    });

    var legend = $('legend');
    Object.keys(SOURCES).forEach(function (k) {
      legend.appendChild(el('li', {}, [el('span', { class: 'dot ' + k }), document.createTextNode(SOURCES[k])]));
    });
  }

  function renderPhotos() {
    var grid = $('photos'), box = $('lightbox');
    for (var i = 1; i <= PHOTO_COUNT; i++) {
      var name = 'photo-' + (i < 10 ? '0' : '') + i + '.jpg';
      var link = el('a', { href: 'reference/' + name, target: '_blank', rel: 'noopener' }, [
        el('img', { src: 'reference/thumbs/' + name, alt: 'Photo ' + i + ' de l’annonce', loading: 'lazy' })
      ]);
      grid.appendChild(link);
    }
    if (typeof box.showModal !== 'function') return;      // sinon le lien ouvre simplement la photo dans un onglet
    grid.addEventListener('click', function (ev) {
      var link = ev.target.closest('a');
      if (!link) return;
      ev.preventDefault();
      box.querySelector('img').src = link.href;
      box.showModal();
    });
    box.addEventListener('click', function () { box.close(); });
  }

  // Achats, plan de coupe et solidité, recalculés à partir du modèle (sofa-bom.js).
  function renderBom() {
    var root = $('bom');
    if (!root || !window.SofaBom) return;
    var plan = SofaBom.plan(model);
    function euro(v) { return v.toFixed(2).replace('.', ',') + ' €'; }
    function table(rows) { return el('table', { class: 'dims' }, [el('tbody', {}, rows)]); }

    var input = el('input', { type: 'number', id: 'width-input', min: '120', max: '300', step: '1', value: String(model.width) });
    var form = el('form', { class: 'width-form' }, [
      el('label', { for: 'width-input', text: 'Longueur du canapé (les deux blocs), en cm' }),
      input, el('button', { type: 'submit', text: 'Recalculer' })
    ]);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = Number(input.value);
      if (v >= 120 && v <= 300) location.search = '?largeur=' + v;      // recharge la page avec la nouvelle longueur
    });
    root.appendChild(form);

    root.appendChild(el('h4', { text: 'À acheter' }));
    root.appendChild(table(plan.lines.map(function (l) {
      return el('tr', {}, [el('td', { text: l.qty + ' × ' + l.name + (l.estimate ? ' (estimation)' : '') }), el('td', { text: euro(l.total) })]);
    }).concat([el('tr', { class: 'total' }, [el('td', { text: 'Total' }), el('td', { text: euro(plan.total) })])])));

    root.appendChild(el('h4', { text: 'Plan de coupe' }));
    plan.cutting.forEach(function (c) {
      var rows = (c.bars || []).map(function (bar) {
        return bar.pieces.map(function (p) { return fmt(p.length); }).join(' + ') + ' → chute ' + fmt(bar.left) + ' cm';
      });
      (c.panels || []).forEach(function (panel) {
        panel.strips.forEach(function (strip) {
          rows.push(strip.pieces.map(function (p) { return fmt(p.length) + ' × ' + fmt(p.width); }).join(' + '));
        });
      });
      root.appendChild(el('p', { class: 'meta', text: c.name }));
      root.appendChild(el('ol', { class: 'cuts' }, rows.map(function (r) { return el('li', { text: r }); })));
    });

    root.appendChild(el('h4', { text: 'Pièces à couper' }));
    root.appendChild(table(SofaBom.pieces(model).filter(function (p) { return p.length; }).map(function (p) {
      return el('tr', {}, [el('td', { text: p.qty + ' × ' + p.part }), el('td', { text: fmt(p.length) + (p.width ? ' × ' + fmt(p.width) : '') + ' cm' })]);
    })));

    root.appendChild(el('h4', { text: 'Solidité (100 % = limite admise)' }));
    root.appendChild(table(SofaBom.audit(model).map(function (r) {
      return el('tr', { class: r.pct > 100 ? 'over' : '', title: r.note }, [el('td', { text: r.name }), el('td', { text: r.pct + ' %' })]);
    })));
    plan.warnings.forEach(function (w) { root.appendChild(el('p', { class: 'note warn', text: w })); });
  }

  // ---------------------------------------------------------------- état

  function select(id, mesh) {
    state.part = byId[id] ? id : null;
    renderDetail();
    Array.prototype.forEach.call($('parts').querySelectorAll('button'), function (b) {
      b.setAttribute('aria-current', String(b.getAttribute('data-part') === state.part));
    });
    if (view3d) view3d.select(mesh);
    writeHash();
  }

  function setPos(pos, animate) {
    state.pos = pos;
    Array.prototype.forEach.call(document.querySelectorAll('[data-pos]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pos') === pos));
    });
    if (view3d) view3d.setPos(animate);
    writeHash();
  }

  function setLook(look) {
    state.look = look;
    Array.prototype.forEach.call(document.querySelectorAll('[data-look]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-look') === look));
    });
    if (view3d) view3d.repaint();
    writeHash();
  }

  function setDims(on) {
    state.dims = on;
    $('dims-toggle').setAttribute('aria-pressed', String(on));
    if (view3d) view3d.refreshDims();
  }

  function readHash() {
    var out = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if (kv[0]) out[kv[0]] = decodeURIComponent(kv[1] || '');
    });
    return out;
  }

  function writeHash() {
    var bits = [];
    if (state.pos !== 'sofa') bits.push('position=' + POS_NAMES[state.pos]);
    if (state.look !== 'covered') bits.push('rendu=' + LOOK_NAMES[state.look]);
    if (state.part) bits.push('piece=' + state.part);
    try {
      history.replaceState(null, '', bits.length ? '#' + bits.join('&') : location.pathname + location.search);
    } catch (err) { /* certains navigateurs refusent replaceState en file:// : sans conséquence */ }
  }

  // ---------------------------------------------------------------- vue 3D

  function create3d() {
    var stage = $('stage');

    THREE.ColorManagement.legacyMode = false;             // les couleurs CSS/hex sont lues comme du sRGB
    // Fond transparent : c'est le fond CSS de la scène qui apparaît, il suit donc le thème clair/sombre.
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var canvas = renderer.domElement;
    stage.insertBefore(canvas, stage.firstChild);

    var selectColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--select').trim());
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(30, 1, 10, 5000);
    var controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 40;
    controls.maxDistance = 1500;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8676, 0.85));
    var sun = new THREE.DirectionalLight(0xffffff, 0.7);
    sun.position.set(140, 320, 260);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -230;
    sun.shadow.camera.right = sun.shadow.camera.top = 230;
    sun.shadow.camera.near = 50;
    sun.shadow.camera.far = 900;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.4;
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0xffffff, 0.22);
    fill.position.set(-220, 120, -160);
    scene.add(fill);

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.2 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- matières ---

    function fabricTexture() {
      var c = document.createElement('canvas');
      c.width = c.height = 64;
      var g = c.getContext('2d');
      g.fillStyle = '#58a26e';
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#3b7551';
      for (var y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 7);
      g.fillStyle = '#58a26e';
      for (y = 0; y < 64; y += 16) for (var x = 0; x < 64; x += 8) g.fillRect(x, y + 2, 3, 3);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1 / 4, 1 / 4);                         // un motif tous les 4 cm, soit une rayure par cm
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    }

    var fabricMap = fabricTexture();
    var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x2e1c0e, transparent: true, opacity: 0.32 });
    var ghostEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x2e1c0e, transparent: true, opacity: 0.1 });

    function materialFor(key) {
      var m = new THREE.MeshStandardMaterial({ roughness: 0.78, emissive: 0xffffff, emissiveIntensity: 0 });
      if (key === 'fabric') { m.map = fabricMap; m.roughness = 1; }
      else m.color.set(COLORS[key]);
      if (key === 'metal') { m.roughness = 0.35; m.metalness = 0.7; }
      return m;
    }

    // --- géométries ---

    // Pavé aux arêtes arrondies (coussins) : contour arrondi extrudé selon la plus petite dimension.
    function roundedBox(size, r) {
      var axis = size.indexOf(Math.min.apply(null, size));
      if (axis === 0) return new THREE.BoxGeometry(size[0], size[1], size[2]);
      var w = size[0] / 2 - r, h = (axis === 2 ? size[1] : size[2]) / 2 - r, c = r * 0.6;
      var shape = new THREE.Shape();
      shape.absarc(w - c, h - c, c, 0, Math.PI / 2);
      shape.absarc(-w + c, h - c, c, Math.PI / 2, Math.PI);
      shape.absarc(-w + c, -h + c, c, Math.PI, 1.5 * Math.PI);
      shape.absarc(w - c, -h + c, c, 1.5 * Math.PI, 2 * Math.PI);
      var g = new THREE.ExtrudeGeometry(shape, {
        depth: size[axis] - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 4, curveSegments: 6
      });
      g.center();
      if (axis === 1) g.rotateX(-Math.PI / 2);
      return g;
    }

    // Tronc de pyramide à base carrée, faces planes.
    function frustum(top, bottom, height) {
      var g = new THREE.CylinderGeometry(top / Math.SQRT2, bottom / Math.SQRT2, height, 4, 1).toNonIndexed();
      g.rotateY(Math.PI / 4);
      g.computeVertexNormals();
      return g;
    }

    function swapUV(g) {
      var uv = g.attributes.uv;
      for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
    }

    function buildShape(s, fabric) {
      var out = { position: new THREE.Vector3(), rotX: s.rotX || 0 };
      if (s.type === 'box') {
        out.geometry = s.radius ? roundedBox(s.size, s.radius) : new THREE.BoxGeometry(s.size[0], s.size[1], s.size[2]);
        out.position.fromArray(s.center);
      } else if (s.type === 'profile') {
        // Contour [z, y] extrudé le long de x, entre x0 et x1 ; « radius » arrondit toutes les arêtes (coussin).
        var shape = new THREE.Shape(s.pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
        var r = s.radius || 0;
        out.geometry = new THREE.ExtrudeGeometry(shape, {
          depth: s.x1 - s.x0 - 2 * r, bevelEnabled: r > 0, bevelThickness: r, bevelSize: r, bevelOffset: -r, bevelSegments: 4
        });
        if (fabric) swapUV(out.geometry);                 // rayures du tissu dans le sens de la longueur
        out.geometry.rotateY(-Math.PI / 2);
        out.geometry.translate(s.x1 - r, 0, 0);
      } else if (s.type === 'frustum') {
        out.geometry = frustum(s.top, s.bottom, s.y1 - s.y0);
        out.position.set(s.x, (s.y0 + s.y1) / 2, s.z);
      } else if (s.type === 'cylinder') {
        out.geometry = new THREE.CylinderGeometry(s.r, s.r, s.x1 - s.x0, 28);
        out.geometry.rotateZ(Math.PI / 2);
        out.position.set((s.x0 + s.x1) / 2, s.y, s.z);
      } else {
        throw new Error('Forme inconnue : ' + s.type);
      }
      out.geometry.computeBoundingBox();
      return out;
    }

    function noRaycast() {}

    // --- pièces ---

    // Trois ensembles : le bâti fixe, le dossier qui tourne autour des boulons, les taquets autour de leur barre.
    var groups = { base: new THREE.Group(), back: new THREE.Group(), cam: new THREE.Group() };
    groups.back.position.set(0, model.pivot.back.y, model.pivot.back.z);
    groups.cam.position.set(0, model.pivot.cam.y, model.pivot.cam.z);
    scene.add(groups.base, groups.back, groups.cam);

    var meshes = [];
    parts.forEach(function (part) {
      part.shapes.forEach(function (shape) {
        var built = buildShape(shape, part.color === 'fabric');
        var mesh = new THREE.Mesh(built.geometry, materialFor(part.color));
        mesh.position.copy(built.position);
        mesh.rotation.x = built.rotX;
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.userData.part = part;
        if (part.color !== 'fabric' && part.color !== 'metal' && part.color !== 'foam') {
          var lines = new THREE.LineSegments(new THREE.EdgesGeometry(built.geometry, 25), edgeMaterial);
          lines.raycast = noRaycast;
          mesh.add(lines);
          mesh.userData.edges = lines;
        }
        groups[part.group].add(mesh);
        meshes.push(mesh);
      });
    });

    // --- positions ---
    // Tout se déroule le long d'un seul axe « stage », gradué en secondes : lit (0) → canapé → détente.
    // Passer d'une position à l'autre revient à parcourir cet axe, dans un sens ou dans l'autre.
    // Entre canapé et détente, l'aller et le retour ne se ressemblent pas :
    //   s'incliner  : on soulage le dossier, on couche le taquet, le dossier descend sur son flanc ;
    //   se redresser : le taquet suit le montant qui remonte, se relève d'un coup, le dossier se repose dessus.

    var STAGE = { bed: 0, sofa: 0.9, lounge: 3.5 };
    var RECLINE = { lifted: 0.35, turned: 1.25 }, RAISE = { settled: 0.45, snapped: 0.95 };   // jalons, comptés depuis « canapé »
    var A = model.angle, CAM = model.cam;
    var stageNow = STAGE.sofa, stageTarget = STAGE.sofa, stageFrom = STAGE.sofa, stageStart = 0, stageDuration = 0;

    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    function mix(a, b, k) { return a + (b - a) * k; }
    // Progression lissée de v entre deux jalons.
    function phase(v, from, to) {
      var k = clamp01((v - from) / (to - from));
      return k * k * (3 - 2 * k);
    }

    // Angle du taquet rappelé par son manche, un coin en appui sous le montant.
    function camFollowing(back) {
      var table = CAM.follow, last = table.length - 1;
      if (back <= table[0][0]) return table[0][1];
      for (var i = 1; i <= last; i++) {
        if (back <= table[i][0]) {
          return mix(table[i - 1][1], table[i][1], (back - table[i - 1][0]) / (table[i][0] - table[i - 1][0]));
        }
      }
      return table[last][1];
    }

    function applyStage(v) {
      stageNow = v;
      var back, cam = CAM.engaged, s = v - STAGE.sofa, end = STAGE.lounge - STAGE.sofa;
      if (s <= 0) {
        back = mix(A.bed, A.sofa, phase(v, 0, STAGE.sofa));
      } else if (stageTarget > stageFrom) {
        back = mix(mix(A.sofa, A.lift, phase(s, 0, RECLINE.lifted)), A.lounge, phase(s, RECLINE.turned, end));
        cam = mix(CAM.engaged, CAM.retracted, phase(s, RECLINE.lifted, RECLINE.turned));
      } else {
        back = mix(mix(A.sofa, A.lift, phase(s, 0, RAISE.settled)), A.lounge, phase(s, RAISE.snapped, end));
        cam = mix(CAM.engaged, camFollowing(back), phase(s, RAISE.settled, RAISE.snapped));
      }
      groups.back.rotation.x = back;
      groups.cam.rotation.x = cam;
      dirty = true;
    }

    function overallBox() {
      var o = model.overall[state.pos];
      return new THREE.Box3(new THREE.Vector3().fromArray(o.min), new THREE.Vector3().fromArray(o.max));
    }

    // --- cotes dans la vue : boîte englobante + trois étiquettes ---

    var dimBox = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
      new THREE.LineBasicMaterial({ color: selectColor, depthTest: false, transparent: true })
    );
    dimBox.renderOrder = 10;
    dimBox.raycast = noRaycast;
    var dim = { parent: null, box: null };
    var labels = [0, 1, 2].map(function () { return $('labels').appendChild(el('div', { class: 'dim-label', hidden: '' })); });
    var focus = null;                                     // exemplaire de la pièce sélectionnée qui porte les cotes

    function showDimBox(parent, box) {
      if (dimBox.parent) dimBox.parent.remove(dimBox);
      dim.parent = parent;
      dim.box = box;
      if (box) {
        box.getSize(dimBox.scale);
        box.getCenter(dimBox.position);
        parent.add(dimBox);
      }
      dirty = true;
    }

    // Cotes de la pièce examinée. Une pièce unique dessinée en plusieurs volumes est cotée d'un bloc.
    function showFocusBox() {
      var part = focus.userData.part;
      var volumes = meshes.filter(function (m) { return m.userData.part === part; });
      if (part.qty !== 1 || volumes.length === 1) return showDimBox(focus, focus.geometry.boundingBox);
      var whole = new THREE.Box3();
      volumes.forEach(function (m) { whole.union(m.geometry.boundingBox.clone().translate(m.position)); });
      showDimBox(focus.parent, whole);
    }

    function refreshDims() {
      if (!state.dims) showDimBox(null, null);
      else if (focus) showFocusBox();
      else if (stageNow === stageTarget && currentView !== 'mech') showDimBox(scene, overallBox());
      else showDimBox(null, null);
    }

    var v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3();
    var v5 = new THREE.Vector3();
    var AXES = ['x', 'y', 'z'];

    function updateLabels() {
      labels.forEach(function (label) { label.hidden = true; });
      if (!dim.box || (focus && focus.userData.part.symbolic)) return;
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var size = dim.box.getSize(v1), center = dim.box.getCenter(v2);
      var cam = dim.parent.worldToLocal(v3.copy(camera.position));
      // Coin de la boîte le plus proche de la caméra : les trois arêtes cotées en partent.
      var near = AXES.map(function (a) { return cam[a] > center[a] ? dim.box.max[a] : dim.box.min[a]; });

      function toScreen(pt) {
        dim.parent.localToWorld(v4.fromArray(pt));
        if (v5.copy(v4).applyMatrix4(camera.matrixWorldInverse).z > -camera.near) return null;
        v4.project(camera);
        return [(v4.x + 1) / 2 * w, (1 - v4.y) / 2 * h];
      }
      function overlaps(s) {
        return placed.some(function (p) { return Math.abs(p[0] - s[0]) < 62 && Math.abs(p[1] - s[1]) < 22; });
      }

      var corner = toScreen(near), placed = [];
      if (!corner) return;
      [0, 1, 2].sort(function (a, b) { return size[AXES[b]] - size[AXES[a]]; }).forEach(function (axis, rank) {
        var pt = near.slice();
        pt[axis] = center[AXES[axis]];
        var s = toScreen(pt);
        if (!s) return;
        // Une petite cote qui en chevauche une autre est écartée du coin, dans le prolongement de son arête.
        var dx = s[0] - corner[0], dy = s[1] - corner[1], len = Math.hypot(dx, dy);
        if (len < 1) { dx = 0; dy = -1; len = 1; }
        for (var step = 0; step < 8 && overlaps(s); step++) {
          s[0] += dx / len * 12;
          s[1] += dy / len * 12;
        }
        if (overlaps(s)) return;
        placed.push(s);
        labels[rank].textContent = cm(size[AXES[axis]]);
        labels[rank].style.transform = 'translate(-50%, -50%) translate(' + s[0].toFixed(1) + 'px,' + s[1].toFixed(1) + 'px)';
        labels[rank].hidden = false;
      });
    }

    // --- surbrillance ---

    var hovered = null;

    // La pièce sélectionnée reste pleine, les autres s'estompent : on la voit même cachée sous les coussins.
    // Quatre rendus, par couches : chacun montre les pièces posées jusque-là. Sous le garnissage, tout ce
    // qu'il enferme est masqué. La pièce qu'on examine reste toujours visible.
    function shown(part) {
      var rank = LAYERS.indexOf(part.layer || 'structure');
      if (state.look === 'covered') return !part.core && (rank === 0 || rank === LAYERS.length - 1);
      return rank <= LAYERS.indexOf(state.look);
    }

    function paint() {
      meshes.forEach(function (m) {
        var part = m.userData.part, id = part.id, mat = m.material;
        m.visible = id === state.part || shown(part);
        var ghost = !!state.part && id !== state.part;
        if (mat.transparent !== ghost) {
          mat.transparent = ghost;
          mat.depthWrite = !ghost;
          mat.needsUpdate = true;
        }
        mat.opacity = ghost ? 0.2 : 1;
        mat.emissiveIntensity = id === hovered && id !== state.part ? 0.14 : 0;
        if (m.userData.edges) m.userData.edges.material = ghost ? ghostEdgeMaterial : edgeMaterial;
      });
      dirty = true;
    }

    // --- caméra ---

    // Direction d'où l'on regarde. « mech » cadre le taquet du côté droit plutôt que le canapé entier.
    var VIEWS = { iso: [0.62, 0.4, 0.78], front: [0, 0.16, 1], side: [1, 0.12, 0.001], top: [0, 1, 0.02], mech: [1, 0.1, 0.22] };
    var focusBox = new THREE.Box3(new THREE.Vector3().fromArray(model.focus.min), new THREE.Vector3().fromArray(model.focus.max));
    var UP = new THREE.Vector3(0, 1, 0);
    var camTween = null, currentView = 'iso', userMoved = false;

    // Position de caméra qui cadre toute la boîte depuis la direction donnée.
    function frameFrom(dirArray, box) {
      var dir = new THREE.Vector3().fromArray(dirArray).normalize();
      var right = new THREE.Vector3().crossVectors(UP, dir).normalize();
      var up = new THREE.Vector3().crossVectors(dir, right);
      var center = box.getCenter(new THREE.Vector3());
      var tanV = Math.tan(camera.fov * Math.PI / 360), tanH = tanV * camera.aspect;
      var dist = 0, c = new THREE.Vector3();
      for (var i = 0; i < 8; i++) {
        c.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(center);
        dist = Math.max(dist, c.dot(dir) + Math.abs(c.dot(up)) / tanV, c.dot(dir) + Math.abs(c.dot(right)) / tanH);
      }
      return { target: center, position: center.clone().addScaledVector(dir, dist * 1.2) };
    }

    function moveCamera(position, target, animate) {
      if (!animate) {
        camTween = null;
        camera.position.copy(position);
        controls.target.copy(target);
        controls.update();
        dirty = true;
        return;
      }
      camTween = {
        start: performance.now(), duration: 450,
        fromPos: camera.position.clone(), toPos: position,
        fromTarget: controls.target.clone(), toTarget: target
      };
    }

    function setView(name, animate) {
      currentView = VIEWS[name] ? name : 'iso';
      userMoved = false;
      var frame = frameFrom(VIEWS[currentView], currentView === 'mech' ? focusBox : overallBox());
      moveCamera(frame.position, frame.target, animate);
      refreshDims();                                      // la vue rapprochée n'affiche pas les cotes hors tout
    }

    controls.addEventListener('start', function () { camTween = null; userMoved = true; });
    controls.addEventListener('change', function () { dirty = true; });

    // --- boucle de rendu : on ne redessine que si quelque chose a changé ---

    var dirty = true;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function tick(now) {
      requestAnimationFrame(tick);
      if (stageNow !== stageTarget) {
        var k = stageDuration ? Math.min((now - stageStart) / stageDuration, 1) : 1;
        applyStage(k === 1 ? stageTarget : stageFrom + (stageTarget - stageFrom) * k);
        if (k === 1) refreshDims();
      }
      if (camTween) {
        var t = Math.min((now - camTween.start) / camTween.duration, 1), e = 1 - Math.pow(1 - t, 3);
        camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
        controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
        if (t === 1) camTween = null;
        dirty = true;
      }
      controls.update();
      if (!dirty) return;
      dirty = false;
      renderer.render(scene, camera);
      updateLabels();
    }

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!userMoved) setView(currentView, false);        // tant que la vue n'a pas été tournée à la main, on recadre
      dirty = true;
    }

    // --- pointeur : survol et clic ---

    var raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
    var tooltip = $('tooltip');
    var down = null;

    function pick(ev) {
      var r = canvas.getBoundingClientRect();
      ndc.set((ev.clientX - r.left) / r.width * 2 - 1, 1 - (ev.clientY - r.top) / r.height * 2);
      raycaster.setFromCamera(ndc, camera);
      var hit = raycaster.intersectObjects(meshes.filter(function (m) { return m.visible; }), false)[0];
      return hit ? hit.object : null;
    }

    function setHover(mesh, ev) {
      var id = mesh ? mesh.userData.part.id : null;
      canvas.style.cursor = id ? 'pointer' : '';
      tooltip.hidden = !id;
      if (id) {
        var r = stage.getBoundingClientRect();
        tooltip.textContent = mesh.userData.part.name;
        tooltip.style.transform = 'translate(' + (ev.clientX - r.left + 14) + 'px,' + (ev.clientY - r.top + 14) + 'px)';
      }
      if (id !== hovered) {
        hovered = id;
        paint();
      }
    }

    canvas.addEventListener('pointerdown', function (ev) { down = { x: ev.clientX, y: ev.clientY }; });
    canvas.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'mouse' && !ev.buttons) setHover(pick(ev), ev);
    });
    canvas.addEventListener('pointerleave', function () { setHover(null); });
    canvas.addEventListener('pointerup', function (ev) {
      var moved = !down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 5;
      down = null;
      if (moved || ev.button !== 0) return;               // c'était une rotation de la vue, pas un clic
      var mesh = pick(ev);
      select(mesh ? mesh.userData.part.id : null, mesh);
    });

    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    var darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkScheme.addEventListener) {
      darkScheme.addEventListener('change', function () {
        selectColor.set(getComputedStyle(document.documentElement).getPropertyValue('--select').trim());
        dimBox.material.color.copy(selectColor);
        paint();
      });
    }

    resize();
    requestAnimationFrame(tick);

    return {
      select: function (mesh) {
        focus = mesh || meshes.filter(function (m) { return m.userData.part.id === state.part; })[0] || null;
        paint();
        refreshDims();
      },
      setPos: function (animate) {
        animate = animate && !reduceMotion.matches;
        stageTarget = STAGE[state.pos];
        stageFrom = stageNow;
        stageStart = performance.now();
        stageDuration = animate ? 1000 * Math.abs(stageTarget - stageFrom) : 0;
        if (!animate) applyStage(stageTarget);
        if (!userMoved) {
          setView(currentView, animate);                  // vue non modifiée : on recadre la nouvelle position
        } else {
          // Sinon la caméra accompagne simplement le déplacement du centre du meuble.
          var target = overallBox().getCenter(new THREE.Vector3());
          moveCamera(camera.position.clone().add(target).sub(controls.target), target, animate);
        }
        refreshDims();
      },
      setView: function (name, animate) { setView(name, animate && !reduceMotion.matches); },
      refreshDims: refreshDims,
      repaint: paint
    };
  }

  // ---------------------------------------------------------------- démarrage

  renderParts();
  renderPhotos();
  renderBom();

  try {
    if (!window.THREE) throw new Error('three.js introuvable (dossier vendor/)');
    view3d = create3d();
  } catch (err) {
    console.error(err);
    $('stage').appendChild(el('p', {
      class: 'fatal',
      text: 'La vue 3D n’a pas pu démarrer (' + err.message + '). Les cotes restent consultables dans la liste des pièces.'
    }));
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-pos]'), function (b) {
    b.addEventListener('click', function () { setPos(b.getAttribute('data-pos'), true); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-view]'), function (b) {
    b.addEventListener('click', function () {
      if (view3d) view3d.setView(b.getAttribute('data-view'), true);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-look]'), function (b) {
    b.addEventListener('click', function () { setLook(b.getAttribute('data-look')); });
  });
  $('dims-toggle').addEventListener('click', function () { setDims(!state.dims); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && state.part && !$('lightbox').open) select(null);
  });

  // État donné par l'adresse : #position=lit&piece=upright&vue=profil
  function applyHash(animate) {
    var hash = readHash();
    setLook(keyOf(LOOK_NAMES, hash.rendu) || 'covered');
    setPos(keyOf(POS_NAMES, hash.position) || 'sofa', animate);
    if (view3d && (hash.vue || !animate)) view3d.setView(keyOf(VIEW_NAMES, hash.vue) || 'iso', animate);
    select(hash.piece || null);
  }

  window.addEventListener('hashchange', function () { applyHash(true); });
  applyHash(false);
})();
