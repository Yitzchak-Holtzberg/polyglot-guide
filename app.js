const langBtns  = document.querySelectorAll('.lang-btn');
  const topicBtns = document.querySelectorAll('.topic-btn');
  const sections  = document.querySelectorAll('.section');

  let currentLang  = 'go';
  // ── SINGLE SOURCE OF TRUTH ── add a language/tech here; names, compare list, and
  //    default topics all derive from it (CSS --ink + section markup are the only other touchpoints).
  const LANGS = [
    { key: 'go', name: 'Go' }, { key: 'ada', name: 'Ada' }, { key: 'sql', name: 'SQL' },
    { key: 'c', name: 'C' }, { key: 'ocaml', name: 'OCaml' }, { key: 'fs', name: 'F#' },
    { key: 'rust', name: 'Rust' }, { key: 'zig', name: 'Zig' }, { key: 'hs', name: 'Haskell' }
  ];
  const TECHS = [
    { key: 'grpc', name: 'gRPC' }, { key: 'iac', name: 'IaC' },
    { key: 'k8s', name: 'K8s' }, { key: 'docker', name: 'Docker' }
  ];
  const LANG_NAMES = Object.fromEntries(LANGS.map(l => [l.key, l.name]));
  const CMP_LANGS = LANGS.map(l => l.key);
  let currentTopic = Object.fromEntries([...LANGS, ...TECHS].map(l => [l.key, 'basics']));

  function activate(lang, topic) {
    currentLang = lang;
    currentTopic[lang] = topic;
    document.documentElement.style.setProperty('--active-ink', `var(--${lang})`);
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    topicBtns.forEach(b => {
      b.classList.toggle('visible', b.dataset.lang === lang);
      b.classList.toggle('active',  b.dataset.lang === lang && b.dataset.topic === topic);
    });
    sections.forEach(s => {
      s.classList.toggle('active', s.id === `${lang}-${topic}`);
    });
    history.replaceState(null, '', `#${lang}-${topic}`);
    updateLearnToggle(lang, topic);
    window.scrollTo(0, 0);
    const activeLang = document.querySelector('.lang-btn.active');
    if (activeLang) activeLang.scrollIntoView({ block: 'nearest', inline: 'center' });
    const activeTopic = document.querySelector('.topic-btn.active');
    if (activeTopic) activeTopic.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activate(btn.dataset.lang, currentTopic[btn.dataset.lang]);
    });
  });

  topicBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activate(btn.dataset.lang, btn.dataset.topic);
    });
  });

  // Landing overview → chips jump straight into a language / technology
  document.querySelectorAll('.ov-chip').forEach(chip => {
    chip.addEventListener('click', () => activate(chip.dataset.lang, 'basics'));
  });

  // Show the overview and clear any selection
  function showOverview() {
    sections.forEach(s => s.classList.toggle('active', s.id === 'home-overview'));
    langBtns.forEach(b => b.classList.remove('active'));
    topicBtns.forEach(b => b.classList.remove('visible', 'active'));
    if (learnToggle) learnToggle.hidden = true;
  }

  // ── CONCEPT CROSS-CUT ── transposes the EXISTING per-language panes by concept
  const CONCEPTS = [
    { key: 'basics', label: 'Basics &amp; Syntax',
      blurb: 'Every language needs a way to bind values, run statements, and begin executing. What differs is ceremony — where execution starts, whether a class wrapper is required, and how mutable vs immutable bindings are spelled.',
      pseudo: 'const NAME = "world"      // immutable binding\nlet count = 0             // mutable binding\nprint("Hello, " + NAME)   // the entry point runs this',
      langs: { go:'basics', ada:'basics', sql:'basics', c:'basics', ocaml:'basics', fs:'basics', rust:'basics', zig:'basics', hs:'basics' } },
    { key: 'types', label: 'Type System',
      blurb: 'How values are classified and checked: static vs dynamic, how much the compiler infers, and what "no value" looks like. The interesting edges are inference, widening vs narrowing, and null.',
      pseudo: 'x: Int      = 42         // explicit type\ny           = 3.14       // inferred as Float\nmaybe: ?Int = null       // absence lives in the type\nnarrow: Int = checked(y) // lossy conversions are explicit',
      langs: { go:'types', ada:'types', c:'types', ocaml:'types', fs:'types', rust:'types', zig:'types', hs:'types' } },
    { key: 'functions', label: 'Functions',
      blurb: 'Functions as first-class values you pass, return, and compose. Languages differ on currying, partial application, and whether a function is an object or a standalone thing.',
      pseudo: 'fn add(a, b) = a + b\ninc    = add(1, _)          // partial application\ntwice  = f -&gt; x -&gt; f(f(x))   // higher-order\nresult = compose(inc, abs)(-5)',
      langs: { go:'functions', ada:'functions', c:'functions', ocaml:'functions', fs:'functions', hs:'functions' } },
    { key: 'generics', label: 'Generics &amp; Polymorphism',
      blurb: 'Write code once that works for many types, with the concrete type filled in later. The axes: how constraints are expressed, variance, and whether it resolves at compile time or runtime.',
      pseudo: 'fn max&lt;T: Ord&gt;(a: T, b: T) -&gt; T =\n    if a &gt; b then a else b\n\ntype Box&lt;T&gt; = { value: T }\nb = Box&lt;Int&gt;{ value = 42 }',
      langs: { go:'generics', ada:'generics', rust:'generics', zig:'comptime', hs:'typeclasses' } },
    { key: 'errors', label: 'Error Handling',
      blurb: 'What happens when something fails. Two camps: exceptions (thrown, stack unwound) vs errors-as-values (returned, checked). The trade-off is invisible-but-easy against explicit-but-visible.',
      pseudo: 'fn parse(s) -&gt; Result&lt;Int, Error&gt; =\n    if valid(s) then Ok(toInt(s))\n    else Err("bad input")\n\nn = try parse(s)          // propagate to caller\nm = parse(s) orElse 0     // or substitute a default',
      langs: { go:'errors', ada:'exceptions', rust:'errors', zig:'errors', hs:'maybe' } },
    { key: 'patterns', label: 'Pattern Matching &amp; ADTs',
      blurb: 'Model data as "one of these shapes" (a sum type), then destructure and branch on the shape in a single move — with the compiler checking that every case is covered.',
      pseudo: 'type Shape = Circle(r) | Rect(w, h)\n\nfn area(s) = match s:\n    Circle(r)  -&gt; PI * r * r\n    Rect(w, h) -&gt; w * h\n    // a missing case is a compile error',
      langs: { ocaml:'pattern', fs:'pattern', rust:'enums', hs:'adts' } },
    { key: 'concurrency', label: 'Concurrency',
      blurb: 'Doing more than one thing at once. The models diverge sharply: OS threads + locks, lightweight tasks + channels, actors + messages, or async/await over an event loop.',
      pseudo: 'ch = channel()\nspawn { ch.send(work()) }   // run concurrently\nresult = ch.receive()       // communicate by message\n\nawait all(taskA, taskB)     // the async/await model',
      langs: { go:'concurrency', ada:'concurrency', rust:'concurrency', fs:'async' } },
    { key: 'structs', label: 'Structs &amp; Records',
      blurb: 'Bundle related fields into one value. Differences: value vs reference semantics, mutability, structural vs nominal equality, and whether methods attach to the type.',
      pseudo: 'type Point = { x: Float, y: Float }\n\np  = Point{ x = 3, y = 4 }\nd  = p.distance()           // method on the value\np2 = p with { x = 5 }       // copy with one field changed',
      langs: { go:'structs', c:'structs', ada:'records', zig:'structs' } },
    { key: 'memory', label: 'Memory &amp; Pointers',
      blurb: 'Who owns a value and when it gets freed — from manual malloc/free, to ownership/borrowing checked at compile time, to a garbage collector doing it for you. Pointers are the common thread.',
      pseudo: 'p = &amp;value          // a pointer / reference\n*p = 10             // read and write through it\n\nbuf = alloc(1024)   // the explicit world...\ndefer free(buf)     // ...pair every alloc with a free\n// (or let a GC reclaim unreachable values)',
      langs: { c:'pointers', zig:'pointers', rust:'ownership' } },
    { key: 'collections', label: 'Collections',
      blurb: 'Lists, maps, and sets — and how you transform them. The split: imperative loops vs functional map/filter/reduce, eager vs lazy evaluation, mutable vs persistent structures.',
      pseudo: 'xs = [1, 2, 3, 4]\nys = xs.map(x -&gt; x * 2)\n       .filter(x -&gt; x &gt; 4)    // [6, 8]\n\nm = { "a": 1, "b": 2 }\nv = m.get("a") orElse 0',
      langs: { go:'collections', ocaml:'collections', fs:'collections' } }
  ];
  // LANG_NAMES is derived from LANGS at the top of the script
  const conceptView = document.getElementById('concept-view');

  function renderConcept(key) {
    const c = CONCEPTS.find(x => x.key === key);
    if (!c || !conceptView) return false;
    let csPane = null;
    const cards = [];
    for (const lang in c.langs) {
      const sec = document.getElementById(lang + '-' + c.langs[lang]);
      if (!sec) continue;
      if (!csPane) { const cs = sec.querySelector('.cs-pane'); if (cs) csPane = cs.outerHTML; }
      const pane = sec.querySelector('.code-pane:not(.cs-pane)');
      if (pane) cards.push('<div class="concept-card"><div class="concept-lang" style="--ink:var(--' + lang + ')">' + (LANG_NAMES[lang] || lang) + '</div>' + pane.outerHTML + '</div>');
    }
    if (!cards.length) return false;
    let html = '<div class="concept-head"><button class="back-btn" data-back>← Back to overview</button><div class="section-label">Concept · across languages</div>'
      + '<h2 class="overview-title">' + c.label + '</h2>'
      + '<p class="overview-lede">' + (c.blurb || 'The same idea, side by side — C# as the baseline, then how each language expresses it.') + '</p>'
      + (c.pseudo ? '<div class="concept-pseudo"><div class="concept-pseudo-label">The idea, in pseudocode</div><pre><code>' + c.pseudo + '</code></pre></div>' : '')
      + '</div>'
      + '<div class="concept-grid">';
    if (csPane) html += '<div class="concept-card"><div class="concept-lang" style="--ink:var(--cs)">C# · baseline</div>' + csPane + '</div>';
    html += cards.join('') + '</div>';
    conceptView.innerHTML = html;
    conceptView.querySelectorAll('.copy-btn').forEach(b => b.remove());  // drop inert clones
    addCopyButtons(conceptView);                                          // add live ones
    return true;
  }

  function showConcept(key) {
    if (!renderConcept(key)) { showOverview(); return false; }
    sections.forEach(s => s.classList.toggle('active', s === conceptView));
    langBtns.forEach(b => b.classList.remove('active'));
    topicBtns.forEach(b => b.classList.remove('visible', 'active'));
    if (learnToggle) learnToggle.hidden = true;
    window.scrollTo(0, 0);
    history.replaceState(null, '', '#concept-' + key);
    return true;
  }

  document.querySelectorAll('.concept-chip').forEach(chip => {
    chip.addEventListener('click', () => showConcept(chip.dataset.concept));
  });

  // ── ANY-vs-ANY COMPARE ── pick two languages + a shared topic, harvested live
  const compareView = document.getElementById('compare-view');
  // CMP_LANGS is derived from LANGS at the top of the script

  function topicsFor(lang) {
    return [...document.querySelectorAll('.topic-btn[data-lang="' + lang + '"]')]
      .map(b => ({ key: b.dataset.topic, label: b.textContent.trim() }));
  }
  function langOptions(selected) {
    return CMP_LANGS.map(l => '<option value="' + l + '"' + (l === selected ? ' selected' : '') + '>' + LANG_NAMES[l] + '</option>').join('');
  }
  function rebuildTopicOptions(topicSel, a, b, want) {
    // Union of both languages' topics — every topic either side covers is selectable
    const map = new Map();
    topicsFor(a).forEach(t => map.set(t.key, t.label));
    topicsFor(b).forEach(t => { if (!map.has(t.key)) map.set(t.key, t.label); });
    const list = [...map.entries()];
    topicSel.innerHTML = list.map(([k, l]) => '<option value="' + k + '">' + l + '</option>').join('');
    if (list.length) {
      const keys = list.map(e => e[0]);
      topicSel.value = keys.includes(want) ? want : (keys.includes('basics') ? 'basics' : keys[0]);
    }
    return list.length > 0;
  }
  function compareColumn(lang, topic) {
    const sec = document.getElementById(lang + '-' + topic);
    const panes = sec ? [...sec.querySelectorAll('.code-pane:not(.cs-pane)')].map(p => p.outerHTML).join('') : '';
    return '<div class="cmp-col"><div class="concept-lang" style="--ink:var(--' + lang + ')">' + LANG_NAMES[lang] + '</div>'
         + (panes || '<p class="overview-lede">No matching page for this topic.</p>') + '</div>';
  }
  function renderCompareResult() {
    const L = document.getElementById('cmp-left').value;
    const R = document.getElementById('cmp-right').value;
    const T = document.getElementById('cmp-topic').value;
    const res = document.getElementById('cmp-result');
    res.innerHTML = '<div class="compare-cols">' + compareColumn(L, T) + compareColumn(R, T) + '</div>';
    res.querySelectorAll('.copy-btn').forEach(b => b.remove());
    addCopyButtons(res);
    history.replaceState(null, '', '#compare-' + L + '-' + R + '-' + T);
  }
  let cmpBuilt = false;
  function buildCompareBar() {
    if (cmpBuilt || !compareView) return;
    compareView.innerHTML =
      '<div class="concept-head"><button class="back-btn" data-back>← Back to overview</button><div class="section-label">Compare · any two languages</div>'
      + '<h2 class="overview-title">Side by side</h2></div>'
      + '<div class="cmp-bar"><select id="cmp-left" class="cmp-select"></select>'
      + '<span class="cmp-vs">vs</span><select id="cmp-right" class="cmp-select"></select>'
      + '<span class="cmp-vs">on</span><select id="cmp-topic" class="cmp-select"></select></div>'
      + '<div id="cmp-result"></div>';
    document.getElementById('cmp-left').innerHTML = langOptions('go');
    document.getElementById('cmp-right').innerHTML = langOptions('rust');
    const onLangChange = () => {
      rebuildTopicOptions(document.getElementById('cmp-topic'),
        document.getElementById('cmp-left').value, document.getElementById('cmp-right').value,
        document.getElementById('cmp-topic').value);
      renderCompareResult();
    };
    document.getElementById('cmp-left').addEventListener('change', onLangChange);
    document.getElementById('cmp-right').addEventListener('change', onLangChange);
    document.getElementById('cmp-topic').addEventListener('change', renderCompareResult);
    cmpBuilt = true;
  }
  function showCompare(left, right, topic) {
    if (!compareView) return false;
    buildCompareBar();
    const ls = document.getElementById('cmp-left'), rs = document.getElementById('cmp-right'), ts = document.getElementById('cmp-topic');
    if (CMP_LANGS.includes(left)) ls.value = left;
    if (CMP_LANGS.includes(right)) rs.value = right;
    if (!rebuildTopicOptions(ts, ls.value, rs.value, topic)) return false;
    renderCompareResult();
    sections.forEach(s => s.classList.toggle('active', s === compareView));
    langBtns.forEach(b => b.classList.remove('active'));
    topicBtns.forEach(b => b.classList.remove('visible', 'active'));
    if (learnToggle) learnToggle.hidden = true;
    window.scrollTo(0, 0);
    return true;
  }
  document.querySelectorAll('[data-open="compare"]').forEach(b =>
    b.addEventListener('click', () => showCompare('go', 'rust', 'basics')));

  // ── PROGRESS TRACKING ── mark topics learned, per-language progress (localStorage)
  let learned = new Set();
  try { learned = new Set(JSON.parse(localStorage.getItem('devguide-learned') || '[]')); } catch (e) {}
  const learnToggle = document.getElementById('learn-toggle');

  function saveLearned() { try { localStorage.setItem('devguide-learned', JSON.stringify([...learned])); } catch (e) {} }

  function refreshLearnedMarks() {
    topicBtns.forEach(b => b.classList.toggle('learned', learned.has(b.dataset.lang + '-' + b.dataset.topic)));
    document.querySelectorAll('.ov-chip[data-lang]').forEach(chip => {
      const lang = chip.dataset.lang;
      const topics = topicsFor(lang);
      if (!topics.length) return;
      const done = topics.filter(t => learned.has(lang + '-' + t.key)).length;
      let badge = chip.querySelector('.chip-prog');
      if (!badge) { badge = document.createElement('span'); badge.className = 'chip-prog'; chip.appendChild(badge); }
      badge.textContent = done + '/' + topics.length;
      badge.classList.toggle('chip-done', done === topics.length);
    });
  }

  function updateLearnToggle(lang, topic) {
    if (!learnToggle) return;
    const id = lang + '-' + topic;
    learnToggle.hidden = false;
    learnToggle.dataset.id = id;
    learnToggle.classList.toggle('on', learned.has(id));
    learnToggle.textContent = learned.has(id) ? '✓ Learned' : '○ Mark learned';
  }

  if (learnToggle) learnToggle.addEventListener('click', () => {
    const id = learnToggle.dataset.id;
    if (!id) return;
    if (learned.has(id)) learned.delete(id); else learned.add(id);
    saveLearned();
    learnToggle.classList.toggle('on', learned.has(id));
    learnToggle.textContent = learned.has(id) ? '✓ Learned' : '○ Mark learned';
    refreshLearnedMarks();
  });

  // Back button (concept / compare views) → overview
  document.addEventListener('click', e => {
    if (e.target.closest('.back-btn')) { history.replaceState(null, '', '#'); showOverview(); }
  });

  const resetBtn = document.getElementById('reset-progress');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    if (learned.size && confirm('Clear all learned-topic progress?')) {
      learned.clear(); saveLearned(); refreshLearnedMarks();
    }
  });

  refreshLearnedMarks();

  // ── DEEP LINKS ── URL hash <-> active section (bookmark / share / reload)
  function activateFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id.indexOf('concept-') === 0 && showConcept(id.slice(8))) return;
    if (id.indexOf('compare-') === 0) { const p = id.slice(8).split('-'); if (p.length === 3 && showCompare(p[0], p[1], p[2])) return; }
    const sec = id ? document.getElementById(id) : null;
    if (sec && sec.classList.contains('section') && sec.dataset.lang && sec.dataset.lang !== 'home' && sec.id !== 'concept-view' && sec.id !== 'compare-view') {
      const lang = sec.dataset.lang;
      activate(lang, id.substring(lang.length + 1));
    } else {
      showOverview();
    }
  }
  window.addEventListener('hashchange', activateFromHash);
  activateFromHash();   // restore from the URL on load, else land on the overview

  // Clicking the wordmark returns to the overview ("home")
  const brand = document.querySelector('.brand');
  if (brand) brand.addEventListener('click', () => { history.replaceState(null, '', '#'); showOverview(); });

  // ── THEME SWITCHER (dropdown) ──
  const themeSelect = document.getElementById('theme-select');
  const root = document.documentElement;

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeSelect) themeSelect.value = theme;
    try { localStorage.setItem('devguide-theme', theme); } catch(e) {}
  }

  if (themeSelect) themeSelect.addEventListener('change', () => setTheme(themeSelect.value));

  // Restore saved theme
  try {
    const saved = localStorage.getItem('devguide-theme');
    if (saved) setTheme(saved);
  } catch(e) {}

  // ── SKIN SWITCHER (Brutalist ⇄ Polished) ──
  const skinBtns = document.querySelectorAll('.skin-btn');

  function setSkin(skin) {
    root.setAttribute('data-skin', skin);
    skinBtns.forEach(b => b.classList.toggle('active', b.dataset.skin === skin));
    try { localStorage.setItem('devguide-skin', skin); } catch(e) {}
  }

  skinBtns.forEach(btn => btn.addEventListener('click', () => setSkin(btn.dataset.skin)));

  // Restore saved skin (defaults to "brutal" from the markup)
  try {
    const savedSkin = localStorage.getItem('devguide-skin');
    if (savedSkin) setSkin(savedSkin);
  } catch(e) {}

  // ── COPY BUTTONS ── injected into every code-pane header (no per-pane markup)
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); resolve(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function addCopyButtons(scope) {
    scope.querySelectorAll('.code-pane').forEach(pane => {
      if (pane.querySelector('.copy-btn')) return;   // don't double-add
      const header = pane.querySelector('.code-pane-header');
      const pre = pane.querySelector('pre');
      if (!header || !pre) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        copyText(pre.innerText)
          .then(() => { btn.textContent = 'Copied'; btn.classList.add('copied'); })
          .catch(() => { btn.textContent = 'Failed'; });
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1400);
      });
      header.appendChild(btn);
    });
  }
  addCopyButtons(document);

  // ── DEV CONSISTENCY CHECK ── silent when clean; warns on lang/section/nav mismatches
  function validateGuide() {
    const warn = m => console.warn('[guide] ' + m);
    langBtns.forEach(b => {
      if (!document.querySelector('.section[id^="' + b.dataset.lang + '-"]')) warn('lang "' + b.dataset.lang + '" has no sections');
    });
    topicBtns.forEach(b => {
      const id = b.dataset.lang + '-' + b.dataset.topic;
      if (!document.getElementById(id)) warn('nav topic points at a missing section: #' + id);
    });
    document.querySelectorAll('.section[data-lang]').forEach(s => {
      const lang = s.dataset.lang;
      if (lang === 'home' || lang === 'concept' || lang === 'compare') return;
      const topic = s.id.substring(lang.length + 1);
      if (!document.querySelector('.topic-btn[data-lang="' + lang + '"][data-topic="' + topic + '"]')) warn('section has no nav entry: #' + s.id);
    });
  }
  validateGuide();
