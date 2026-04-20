/* ========================================================================
   Fork — scripted demo loop
   8 phases: empty → typing → loading → results → clustered → pain → climax → remix
   ~30s loop. Reads window.FORK_DATA from data/fake-repos.js.
   ======================================================================== */

(() => {
  'use strict';

  const D = window.FORK_DATA;
  if (!D) {
    console.error('FORK_DATA not loaded — check script order in index.html');
    return;
  }

  // ----- Mode flag ------------------------------------------------------
  let mode = 'demo'; // 'demo' = scripted auto-loop · 'real' = user-driven GitHub search

  // ----- DOM refs -------------------------------------------------------
  const body          = document.body;
  const searchInput   = document.getElementById('searchInput');
  const modeBadge     = document.getElementById('modeBadge');
  const searchStatus  = document.getElementById('searchStatus');
  const cardsContainer = document.getElementById('cards');
  const stage         = document.getElementById('stage');
  const painList      = document.getElementById('painList');
  const gapTitle      = document.getElementById('gapTitle');
  const gapBody       = document.getElementById('gapBody');
  const remixTitle    = document.getElementById('remixTitle');
  const remixOneliner = document.getElementById('remixOneliner');
  const remixBody     = document.getElementById('remixBody');
  const gapCard       = document.getElementById('gapCard');
  const remixCard     = document.getElementById('remixCard');
  const discoverTitle    = document.getElementById('discoverTitle');
  const discoverSubtitle = document.getElementById('discoverSubtitle');
  const discoverCards    = document.getElementById('discoverCards');

  // ----- Card creation --------------------------------------------------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  // Defense-in-depth: only allow http(s) URLs. Blocks javascript:, data:, file:, etc.
  function safeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
      return parsed.href;
    } catch { return ''; }
  }

  function createCard(repo) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.cluster  = repo.cluster;
    el.dataset.language = repo.language;
    el.dataset.stars    = String(repo.stars);
    if (repo.url) el.dataset.repoId = `${repo.owner}/${repo.name}`;
    el.style.setProperty('--lang-color', repo.languageColor);

    const forksHtml = (repo.forks != null)
      ? `<span class="card-forks" title="Forks">⑂ ${formatStars(repo.forks)}</span>`
      : '';
    const updatedHtml = repo.pushedAt
      ? `<span class="card-updated" title="Last pushed ${escapeHtml(repo.pushedAt)}">Updated ${relativeDate(repo.pushedAt)}</span>`
      : '';
    const archivedHtml = repo.archived
      ? `<span class="card-badge card-archived">Archived</span>`
      : '';
    const licenseHtml = repo.license
      ? `<span class="card-badge card-license">${escapeHtml(repo.license)}</span>`
      : '';
    const badgesRow = (archivedHtml || licenseHtml || updatedHtml)
      ? `<div class="card-badges">${updatedHtml}${archivedHtml}${licenseHtml}</div>`
      : '';
    const topicsHtml = (repo.topics && repo.topics.length)
      ? `<div class="card-topics">${repo.topics.slice(0, 4).map((t) => `<span class="card-topic">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';
    const openLink = repo.url
      ? `<a class="card-link" href="${escapeHtml(safeUrl(repo.url))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(repo.owner)}/${escapeHtml(repo.name)} on GitHub"></a>`
      : '';
    const bookmarkBtn = repo.url
      ? `<button class="card-bookmark" type="button" data-action="bookmark" aria-label="Save ${escapeHtml(repo.owner)}/${escapeHtml(repo.name)} to Shed">
           <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 1.5h9v13l-4.5-3-4.5 3z"/></svg>
         </button>`
      : '';

    el.innerHTML = `
      ${openLink}
      ${bookmarkBtn}
      <div class="card-head">
        <span class="card-owner">${escapeHtml(repo.owner)}</span>
        <span class="card-slash">/</span>
        <span class="card-name">${escapeHtml(repo.name)}</span>
      </div>
      <div class="card-meta">
        <span class="card-stars" title="Stars">${formatStars(repo.stars)}</span>
        ${forksHtml}
        <span class="card-lang"><span class="card-lang-dot"></span>${escapeHtml(repo.language)}</span>
      </div>
      <div class="card-summary">${escapeHtml(repo.summary)}</div>
      ${badgesRow}
      ${topicsHtml}
    `;
    if (repo.url && isInShed(el.dataset.repoId)) {
      el.dataset.bookmarked = 'true';
    }
    return el;
  }

  function formatStars(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function relativeDate(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = Date.now() - t;
    const day = diff / 86400000;
    if (day < 1)   return 'today';
    if (day < 30)  return `${Math.max(1, Math.round(day))}d ago`;
    const mo = day / 30.44;
    if (mo < 12)   return `${Math.round(mo)}mo ago`;
    return `${Math.round(day / 365.25)}y ago`;
  }

  // ----- Layout calculations --------------------------------------------
  function applyLayout(phase) {
    const allCards = Array.from(cardsContainer.children);
    const cards = allCards.filter((c) => !c.classList.contains('filtered-out'));
    if (!cards.length) {
      cardsContainer.style.height = '';
      return;
    }
    const stageW = stage.clientWidth;

    if (phase === 'results') {
      const cols = 4;
      const cardW = Math.min(230, (stageW - 18 * (cols - 1)) / cols);
      const cardH = 170;
      const hGap = 18;
      const vGap = 14;
      const totalW = cols * cardW + (cols - 1) * hGap;
      const startX = (stageW - totalW) / 2;
      let maxRow = 0;
      cards.forEach((card, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        if (row > maxRow) maxRow = row;
        card.style.setProperty('--tx', `${startX + col * (cardW + hGap)}px`);
        card.style.setProperty('--ty', `${row * (cardH + vGap)}px`);
        card.style.setProperty('--card-w', `${cardW}px`);
      });
      cardsContainer.style.height = `${(maxRow + 1) * (cardH + vGap) + 16}px`;
    } else if (phase === 'clustered' || phase === 'pain' || phase === 'climax' || phase === 'remix') {
      // Dense grid masonry. Cluster headers act as filter pills (click to narrow).
      const allColKeys = ['mac-apps', 'cli', 'browser-ext'];
      const totalByCluster = { 'mac-apps': 0, 'cli': 0, 'browser-ext': 0 };
      allCards.forEach((c) => {
        const k = c.dataset.cluster;
        if (k in totalByCluster) totalByCluster[k]++;
      });
      const headersEl = document.getElementById('clusterHeaders');
      document.querySelectorAll('.cluster-header[data-cluster]').forEach((h) => {
        const k = h.dataset.cluster;
        const total = totalByCluster[k] || 0;
        h.hidden = total === 0;
        const cntEl = h.querySelector('.cluster-count');
        if (cntEl) cntEl.textContent = String(total);
        h.classList.toggle('is-active', activeFilters.cluster === k);
      });
      if (headersEl) headersEl.style.gridTemplateColumns = '';

      const usableW = stageW;
      const maxCols = Math.max(1, Math.min(4, Math.floor(usableW / 260)));
      const hGap = 18;
      const vGap = 16;
      const cardW = Math.min(240, (usableW - hGap * (maxCols - 1)) / maxCols);
      const totalW = maxCols * cardW + (maxCols - 1) * hGap;
      const startX = (usableW - totalW) / 2;

      // First pass: set widths so measurements reflect final layout
      cards.forEach((card) => card.style.setProperty('--card-w', `${cardW}px`));
      void cardsContainer.offsetHeight; // force layout

      // Second pass: measure and pack per-column (shortest column wins next card)
      const colYs = new Array(maxCols).fill(0);
      cards.forEach((card) => {
        // Place in the column with the smallest current height
        let col = 0;
        for (let c = 1; c < maxCols; c++) {
          if (colYs[c] < colYs[col]) col = c;
        }
        const y = colYs[col];
        card.style.setProperty('--tx', `${startX + col * (cardW + hGap)}px`);
        card.style.setProperty('--ty', `${y}px`);
        colYs[col] = y + card.offsetHeight + vGap;
      });
      cardsContainer.style.height = `${Math.max(0, ...colYs) + 16}px`;
    }
  }

  // ----- Phase: empty (reset) -------------------------------------------
  function enterEmpty() {
    body.dataset.phase = 'empty';
    if (mode === 'demo') searchInput.value = '';
    searchStatus.textContent = '';
    cardsContainer.innerHTML = '';
    painList.innerHTML = '';
    gapCard.classList.remove('in');
    remixCard.classList.remove('in');
    gapTitle.textContent = '';
    gapBody.textContent = '';
    remixTitle.textContent = '';
    remixOneliner.textContent = '';
    remixBody.textContent = '';
    discoverCards.innerHTML = '';
    discoverTitle.textContent = '';
    discoverSubtitle.textContent = '';
  }

  // ----- Phase: typing --------------------------------------------------
  function enterTyping() {
    body.dataset.phase = 'typing';
    if (mode === 'real') return Promise.resolve();
    return typeOut(searchInput, D.FAKE_QUERY, 80);
  }

  function typeOut(el, text, charDelay) {
    const useValue = ('value' in el) && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    const setVal   = (v) => { if (useValue) el.value = v; else el.textContent = v; };
    const getVal   = ()  => (useValue ? el.value : el.textContent) || '';
    return new Promise((resolve) => {
      setVal('');
      let i = 0;
      const tick = () => {
        if (i >= text.length) { resolve(); return; }
        setVal(getVal() + text.charAt(i++));
        setTimeout(tick, charDelay + Math.random() * 40);
      };
      tick();
    });
  }

  // ----- Phase: loading -------------------------------------------------
  let loadingTimer = null;
  function enterLoading() {
    body.dataset.phase = 'loading';
    const messages = [
      'Scanning 1,247 repos…',
      'Reading READMEs…',
      'Mining issues…',
      'Embedding summaries…',
      'Clustering by approach…',
    ];
    let i = 0;
    searchStatus.textContent = messages[0];
    loadingTimer = setInterval(() => {
      i = (i + 1) % messages.length;
      searchStatus.textContent = messages[i];
    }, 600);
  }

  function exitLoading() {
    if (loadingTimer) clearInterval(loadingTimer);
    loadingTimer = null;
    searchStatus.textContent = '';
  }

  // ----- Phase: results -------------------------------------------------
  function enterResults() {
    exitLoading();
    body.dataset.phase = 'results';
    cardsContainer.innerHTML = '';
    D.FAKE_REPOS.forEach((repo) => cardsContainer.appendChild(createCard(repo)));
    requestAnimationFrame(() => {
      applyLayout('results');
      const cards = Array.from(cardsContainer.children);
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('in'), 80 + i * 60);
      });
    });
  }

  // ----- Phase: clustered ----------------------------------------------
  function enterClustered() {
    body.dataset.phase = 'clustered';
    applyLayout('clustered');
  }

  // ----- Phase: pain ----------------------------------------------------
  function enterPain() {
    body.dataset.phase = 'pain';
    applyLayout('pain');
    painList.innerHTML = '';
    D.PAIN_POINTS.forEach((quote, i) => {
      const li = document.createElement('li');
      li.className = 'pain-item';
      li.textContent = quote;
      painList.appendChild(li);
      setTimeout(() => li.classList.add('in'), 200 + i * 280);
    });
    // Scroll the stage so the pain panel is visible below the card grid.
    setTimeout(() => {
      const panel = document.getElementById('painPanel');
      if (panel && typeof stage.scrollTo === 'function') {
        stage.scrollTo({ top: stage.scrollHeight, behavior: 'smooth' });
      }
    }, 450);
  }

  // ----- Phase: climax (gap card) --------------------------------------
  function enterClimax() {
    body.dataset.phase = 'climax';
    gapTitle.textContent = D.GAP.title;
    gapBody.textContent = D.GAP.body;
    requestAnimationFrame(() => gapCard.classList.add('in'));
  }

  // ----- Phase: remix ---------------------------------------------------
  function enterRemix() {
    body.dataset.phase = 'remix';
    remixTitle.textContent = D.REMIX.title;
    remixOneliner.textContent = D.REMIX.oneliner;
    remixBody.textContent = D.REMIX.body;
    requestAnimationFrame(() => remixCard.classList.add('in'));
  }

  // ----- Phase: discover (trending opportunity cards) -------------------
  function createIdeaCard(idea) {
    const el = document.createElement('div');
    el.className = 'idea-card';
    el.innerHTML = `
      <span class="idea-trend">${escapeHtml(idea.trend)}</span>
      <h3 class="idea-topic">${escapeHtml(idea.topic)}</h3>
      <span class="idea-signal">${escapeHtml(idea.signal)}</span>
      <p class="idea-oneliner">${escapeHtml(idea.oneliner)}</p>
    `;
    return el;
  }

  function enterDiscover() {
    body.dataset.phase = 'discover';
    discoverTitle.textContent = D.DISCOVER_PROMPT.title;
    discoverSubtitle.textContent = D.DISCOVER_PROMPT.subtitle;
    discoverCards.innerHTML = '';
    D.IDEA_CARDS.forEach((idea, i) => {
      const card = createIdeaCard(idea);
      discoverCards.appendChild(card);
      setTimeout(() => card.classList.add('in'), 200 + i * 180);
    });
  }

  // ----- Phase machine --------------------------------------------------
  const PHASES = [
    { name: 'empty',     durationMs: 2200, enter: enterEmpty },
    { name: 'typing',    durationMs: 3000, enter: enterTyping },
    { name: 'loading',   durationMs: 2800, enter: enterLoading },
    { name: 'results',   durationMs: 4500, enter: enterResults },
    { name: 'clustered', durationMs: 3800, enter: enterClustered },
    { name: 'pain',      durationMs: 4000, enter: enterPain },
    { name: 'climax',    durationMs: 3500, enter: enterClimax },
    { name: 'remix',     durationMs: 4500, enter: enterRemix },
    { name: 'discover',  durationMs: 5500, enter: enterDiscover },
  ];

  let running = false;

  async function runLoop() {
    if (running) return;
    if (mode === 'real') return;
    running = true;
    while (running) {
      for (const phase of PHASES) {
        if (mode === 'real') { running = false; break; }
        try {
          await Promise.resolve(phase.enter());
        } catch (err) {
          console.error('Phase error', phase.name, err);
        }
        await new Promise((r) => setTimeout(r, phase.durationMs));
        if (!running) break;
      }
    }
  }

  // =====================================================================
   // Real GitHub search mode
  // =====================================================================

  // Common-language color lookup (GitHub uses these colors on repo pages)
  const LANG_COLORS = {
    'Swift':      '#fa7343', 'Objective-C': '#438eff',
    'JavaScript': '#f1e05a', 'TypeScript':  '#3178c6',
    'Python':     '#3572a5', 'Go':          '#00add8',
    'Rust':       '#dea584', 'C++':         '#f34b7d',
    'C':          '#555555', 'C#':          '#178600',
    'Java':       '#b07219', 'Kotlin':      '#a97bff',
    'Ruby':       '#701516', 'PHP':         '#4f5d95',
    'Shell':      '#89e051', 'HTML':        '#e34c26',
    'CSS':        '#563d7c', 'Vue':         '#41b883',
    'Dart':       '#00b4ab', 'Scala':       '#c22d40',
    'Haskell':    '#5e5086', 'Elixir':      '#6e4a7e',
    'Lua':        '#000080', 'Zig':         '#ec915c',
  };

  function colorForLanguage(lang) {
    return LANG_COLORS[lang] || '#9c9c9c';
  }

  // Heuristic — group results into the same 3 buckets the demo uses
  function inferCluster(item) {
    const text = `${item.name} ${item.description || ''} ${item.full_name}`.toLowerCase();
    const lang = item.language || '';
    if (lang === 'Swift' || lang === 'Objective-C' || /\b(macos|mac\s|menubar|menu-bar|appkit|swiftui)\b/.test(text)) return 'mac-apps';
    if (/\b(extension|chrome|firefox|safari|browser|webextension|userscript)\b/.test(text)) return 'browser-ext';
    return 'cli';
  }

  function mapApiRepo(item) {
    return {
      name:          item.name,
      owner:         item.owner.login,
      stars:         item.stargazers_count,
      forks:         item.forks_count,
      language:      item.language || 'Unknown',
      languageColor: colorForLanguage(item.language),
      summary:       (item.description || 'No description provided.').trim(),
      cluster:       inferCluster(item),
      pushedAt:      item.pushed_at || null,
      archived:      !!item.archived,
      license:       item.license?.spdx_id || null,
      topics:        item.topics || [],
      url:           safeUrl(item.html_url),
    };
  }

  // Generic words that don't help GitHub's literal search — strip them
  const FILLER_WORDS = new Set([
    'a','an','the','for','to','with','of','in','on','and','or','my','your',
    'tool','tools','app','apps','application','applications',
    'library','libraries','framework','frameworks',
    'plugin','plugins','utility','utilities','thing','things',
  ]);

  // Light stemming: "screenshotting" → "screenshot", "tools" → "tool"
  function stem(word) {
    if (word.length > 5 && word.endsWith('ing')) {
      let base = word.slice(0, -3);
      if (base.length >= 3 && base[base.length - 1] === base[base.length - 2]) {
        base = base.slice(0, -1);
      }
      return base;
    }
    if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.length > 4 && /[xs]es$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
  }

  function normalizeQuery(raw) {
    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const kept = [];
    for (const w of words) {
      if (FILLER_WORDS.has(w)) continue;
      const s = stem(w);
      if (!FILLER_WORDS.has(s) && s.length > 1) kept.push(s);
    }
    return kept.length ? kept.join(' ') : raw.toLowerCase();
  }

  function broadenQuery(normalized) {
    const words = normalized.split(/\s+/).filter(Boolean);
    if (!words.length) return normalized;
    const orTerms = words.join(' OR ');
    // Also include GitHub topic tags — catches repos tagged, not just described, with the term
    const topicTerms = words.map((w) => `topic:${w}`).join(' OR ');
    return words.length === 1 ? `${normalized} OR ${topicTerms}` : `${orTerms} OR ${topicTerms}`;
  }

  const PER_PAGE = 30;
  const MAX_PAGE = 5; // cap at 150 repos to respect anonymous rate limits

  async function fetchGitHub(query, page = 1) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!resp.ok) {
      if (resp.status === 403) throw new Error('GitHub rate limit hit (60 req/hr). Wait a few minutes and try again.');
      if (resp.status === 422) throw new Error('That query confused GitHub. Try simpler keywords.');
      throw new Error(`GitHub API error (${resp.status}). Try again in a moment.`);
    }
    const data = await resp.json();
    return (data.items || []).map(mapApiRepo);
  }

  const loadMoreBtn = document.getElementById('loadMore');
  const pageState = { query: null, page: 1, totalLoaded: 0, broadened: false, label: '' };

  function updateLoadMoreVisibility(lastBatchSize) {
    if (!loadMoreBtn) return;
    const canLoadMore = pageState.query && pageState.page < MAX_PAGE && lastBatchSize === PER_PAGE;
    loadMoreBtn.hidden = !canLoadMore;
  }

  function renderRealResults(repos, { append = false } = {}) {
    const prevCount = append ? cardsContainer.children.length : 0;
    if (!append) cardsContainer.innerHTML = '';
    repos.forEach((repo) => cardsContainer.appendChild(createCard(repo)));
    body.dataset.phase = 'clustered';
    requestAnimationFrame(() => {
      applyLayout('clustered');
      Array.from(cardsContainer.children).slice(prevCount).forEach((card, i) => {
        setTimeout(() => card.classList.add('in'), 60 + i * 45);
      });
    });
  }

  let inflightSearch = 0;
  let searchInflight = false;
  async function runRealSearch() {
    if (searchInflight) return; // dedupe duplicate Enter presses
    const raw = searchInput.value.trim();
    if (!raw) return;
    searchInflight = true;
    stage.setAttribute('aria-busy', 'true');
    const myToken = ++inflightSearch;
    const normalized = normalizeQuery(raw);
    clearFilters();
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    pageState.query = null;
    pageState.page = 1;
    pageState.totalLoaded = 0;
    pageState.broadened = false;
    body.dataset.phase = 'loading';
    const showQuery = normalized === raw.toLowerCase() ? raw : `${raw} → ${normalized}`;
    searchStatus.textContent = `Searching GitHub for "${showQuery}"…`;
    cardsContainer.innerHTML = '';
    try {
      let repos = await fetchGitHub(normalized, 1);
      if (myToken !== inflightSearch) return;

      // Thin results? Auto-broaden by OR-ing the terms.
      let effectiveQuery = normalized;
      let broadened = false;
      if (repos.length < 3 && normalized.split(/\s+/).length > 1) {
        const broad = broadenQuery(normalized);
        if (broad !== normalized) {
          searchStatus.textContent = `Only ${repos.length} exact match${repos.length === 1 ? '' : 'es'} — broadening…`;
          const wider = await fetchGitHub(broad, 1);
          if (myToken !== inflightSearch) return;
          if (wider.length > repos.length) {
            repos = wider;
            effectiveQuery = broad;
            broadened = true;
          }
        }
      }

      if (!repos.length) {
        searchStatus.textContent = `No repos found for "${raw}". Try different keywords.`;
        body.dataset.phase = 'empty';
        return;
      }
      const label = (normalized === raw.toLowerCase()) ? raw : normalized;
      pageState.query = effectiveQuery;
      pageState.page = 1;
      pageState.totalLoaded = repos.length;
      pageState.broadened = broadened;
      pageState.label = label;
      const suffix = broadened ? ' · broader match' : '';
      searchStatus.textContent = `${repos.length} repos for "${label}" · sorted by stars${suffix}`;
      renderRealResults(repos);
      updateLoadMoreVisibility(repos.length);
      saveHistoryEntry(raw);
    } catch (err) {
      if (myToken !== inflightSearch) return;
      searchStatus.textContent = err.message;
      body.dataset.phase = 'empty';
    } finally {
      searchInflight = false;
      stage.removeAttribute('aria-busy');
    }
  }

  async function runLoadMore() {
    if (!pageState.query || pageState.page >= MAX_PAGE) return;
    const nextPage = pageState.page + 1;
    const originalText = loadMoreBtn.textContent;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
    try {
      const repos = await fetchGitHub(pageState.query, nextPage);
      if (!repos.length) {
        loadMoreBtn.hidden = true;
        return;
      }
      pageState.page = nextPage;
      pageState.totalLoaded += repos.length;
      renderRealResults(repos, { append: true });
      const suffix = pageState.broadened ? ' · broader match' : '';
      searchStatus.textContent = `${pageState.totalLoaded} repos for "${pageState.label}" · sorted by stars${suffix}`;
      updateLoadMoreVisibility(repos.length);
    } catch (err) {
      searchStatus.textContent = err.message;
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = originalText;
    }
  }

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', runLoadMore);

  function switchToRealMode() {
    if (mode === 'real') return;
    mode = 'real';
    body.dataset.mode = 'real';
    running = false; // stop demo loop
    cardsContainer.innerHTML = '';
    painList.innerHTML = '';
    gapCard.classList.remove('in');
    remixCard.classList.remove('in');
    discoverCards.innerHTML = '';
    searchStatus.textContent = '';
    searchInput.value = '';
    body.dataset.phase = 'empty';
    setTimeout(() => searchInput.focus(), 30);
  }

  searchInput.addEventListener('focus', switchToRealMode);
  searchInput.addEventListener('mousedown', switchToRealMode);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      hideHistory();
      runRealSearch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      searchInput.value = '';
      clearFilters();
      hideHistory();
      body.dataset.phase = 'empty';
      searchStatus.textContent = '';
      cardsContainer.innerHTML = '';
      if (loadMoreBtn) loadMoreBtn.hidden = true;
    }
  });

  // ---------- Search history (sessionStorage, last 5) ----------
  const HISTORY_KEY = 'fork.history';
  const HISTORY_CAP = 5;
  const historyList = document.getElementById('searchHistory');

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveHistoryEntry(q) {
    const list = loadHistory().filter((x) => x !== q);
    list.unshift(q);
    const capped = list.slice(0, HISTORY_CAP);
    try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(capped)); } catch {}
  }
  function renderHistory() {
    if (!historyList) return;
    const items = loadHistory();
    historyList.innerHTML = '';
    if (!items.length) { historyList.hidden = true; return; }
    items.forEach((q) => {
      const li = document.createElement('li');
      li.className = 'search-history-item';
      li.setAttribute('role', 'option');
      li.textContent = q;
      li.addEventListener('mousedown', (ev) => {
        ev.preventDefault(); // keep input focused
        searchInput.value = q;
        hideHistory();
        runRealSearch();
      });
      historyList.appendChild(li);
    });
    historyList.hidden = false;
  }
  function hideHistory() {
    if (historyList) historyList.hidden = true;
  }

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim() === '') renderHistory();
  });
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() !== '') hideHistory();
    else renderHistory();
  });
  searchInput.addEventListener('blur', () => {
    setTimeout(hideHistory, 120); // small delay lets click register
  });

  // ---------- Global keyboard: `/` focuses search ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  // =====================================================================
  // Filters — stars threshold + language; auto-rebuilt when cards change
  // =====================================================================
  const filtersBar      = document.getElementById('filters');
  const languageFilters = document.getElementById('languageFilters');
  const filterClear     = document.getElementById('filterClear');

  const activeFilters = { stars: 0, language: 'all', cluster: 'all' };
  const filterEmptyPanel = document.getElementById('filterEmpty');
  const filterEmptyClearBtn = document.getElementById('filterEmptyClear');
  if (filterEmptyClearBtn) filterEmptyClearBtn.addEventListener('click', () => clearFilters());

  function applyFilters() {
    const allCards = Array.from(cardsContainer.children);
    let hiddenCount = 0;
    allCards.forEach((card) => {
      const stars = parseInt(card.dataset.stars, 10) || 0;
      const lang  = card.dataset.language || '';
      const clus  = card.dataset.cluster || '';
      const passStars   = stars >= activeFilters.stars;
      const passLang    = activeFilters.language === 'all' || lang === activeFilters.language;
      const passCluster = activeFilters.cluster === 'all' || clus === activeFilters.cluster;
      const hidden = !(passStars && passLang && passCluster);
      card.classList.toggle('filtered-out', hidden);
      if (hidden) hiddenCount++;
    });
    applyLayout(body.dataset.phase);
    const anyActive = activeFilters.stars > 0 || activeFilters.language !== 'all' || activeFilters.cluster !== 'all';
    filterClear.hidden = !anyActive;

    const allHidden = anyActive && allCards.length > 0 && hiddenCount === allCards.length;
    if (filterEmptyPanel) filterEmptyPanel.hidden = !allHidden;
  }

  function setStarsFilter(stars) {
    activeFilters.stars = stars;
    document.querySelectorAll('[data-group="stars"] .filter-pill').forEach((pill) => {
      pill.classList.toggle('is-active', parseInt(pill.dataset.stars, 10) === stars);
    });
    applyFilters();
  }

  function setLanguageFilter(lang) {
    activeFilters.language = lang;
    document.querySelectorAll('[data-group="language"] .filter-pill').forEach((pill) => {
      pill.classList.toggle('is-active', pill.dataset.language === lang);
    });
    applyFilters();
  }

  function setClusterFilter(cluster) {
    activeFilters.cluster = cluster;
    document.querySelectorAll('.cluster-header[data-cluster]').forEach((h) => {
      h.classList.toggle('is-active', h.dataset.cluster === cluster);
    });
    applyFilters();
  }

  function clearFilters() {
    setStarsFilter(0);
    setLanguageFilter('all');
    setClusterFilter('all');
  }

  // Cluster headers act as filter pills — click to narrow, click again to clear
  document.querySelectorAll('.cluster-header[data-cluster]').forEach((h) => {
    h.addEventListener('click', () => {
      const k = h.dataset.cluster;
      setClusterFilter(activeFilters.cluster === k ? 'all' : k);
    });
  });

  // Rebuild language pills based on current cards (top 6 most common)
  function updateLanguageFilters() {
    const cards = Array.from(cardsContainer.children);
    const counts = {};
    cards.forEach((c) => {
      const lang = c.dataset.language;
      if (lang && lang !== 'Unknown') counts[lang] = (counts[lang] || 0) + 1;
    });
    const topLangs = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l]) => l);

    // Remove existing language pills (keep the "All" one)
    Array.from(languageFilters.querySelectorAll('.filter-pill[data-language]')).forEach((p) => {
      if (p.dataset.language !== 'all') p.remove();
    });

    // Add fresh ones
    topLangs.forEach((lang) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'filter-pill';
      pill.dataset.language = lang;
      pill.style.setProperty('--pill-dot', (typeof colorForLanguage === 'function') ? colorForLanguage(lang) : '#9c9c9c');
      pill.innerHTML = `<span class="pill-dot"></span>${escapeHtml(lang)}`;
      if (activeFilters.language === lang) pill.classList.add('is-active');
      pill.addEventListener('click', () => setLanguageFilter(lang));
      languageFilters.appendChild(pill);
    });

    // If the active language is no longer present, snap back to "All"
    if (activeFilters.language !== 'all' && !topLangs.includes(activeFilters.language)) {
      setLanguageFilter('all');
    }
  }

  // Wire static stars pills + the always-present "All" language pill
  document.querySelectorAll('[data-group="stars"] .filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => setStarsFilter(parseInt(pill.dataset.stars, 10) || 0));
  });
  const allLangPill = languageFilters.querySelector('[data-language="all"]');
  if (allLangPill) allLangPill.addEventListener('click', () => setLanguageFilter('all'));
  filterClear.addEventListener('click', clearFilters);

  // Auto-refresh filters whenever cards are added/removed
  let filterRefreshTimer = null;
  new MutationObserver(() => {
    clearTimeout(filterRefreshTimer);
    filterRefreshTimer = setTimeout(() => {
      updateLanguageFilters();
      applyFilters();
    }, 60);
  }).observe(cardsContainer, { childList: true });

  // ----- Resize handler -------------------------------------------------
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyLayout(body.dataset.phase);
    }, 100);
  });

  // ----- Visibility pause -----------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else if (!running && mode === 'demo') {
      runLoop();
    }
  });

  // =====================================================================
  // Overlay (modal) + Toast — used by Shed / Searches / Settings / About
  // =====================================================================
  const overlay         = document.getElementById('overlay');
  const overlayTitle    = document.getElementById('overlayTitle');
  const overlayBody     = document.getElementById('overlayBody');
  const overlayClose    = document.getElementById('overlayClose');
  const overlayBackdrop = document.getElementById('overlayBackdrop');
  const toastHost       = document.getElementById('toastHost');

  function openOverlay(title, bodyNode) {
    if (!overlay) return;
    overlayTitle.textContent = title;
    overlayBody.innerHTML = '';
    if (typeof bodyNode === 'string') {
      overlayBody.innerHTML = bodyNode;
    } else if (bodyNode instanceof Node) {
      overlayBody.appendChild(bodyNode);
    }
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => overlayClose && overlayClose.focus(), 20);
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (overlayClose)    overlayClose.addEventListener('click', closeOverlay);
  if (overlayBackdrop) overlayBackdrop.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && !overlay.hidden) {
      e.preventDefault();
      closeOverlay();
    }
  });

  function showToast(msg, { variant = 'info' } = {}) {
    if (!toastHost) return;
    const el = document.createElement('div');
    el.className = `toast toast-${variant}`;
    el.textContent = msg;
    toastHost.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 260);
    }, 2200);
  }

  // Expose for console testing — dev only (localhost / file://). Not on public deploys.
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') {
    window.__fork = Object.assign(window.__fork || {}, { openOverlay, closeOverlay, showToast });
  }

  // =====================================================================
  // Shed — saved repos + ideas (localStorage)
  // =====================================================================
  const SHED_KEY = 'fork.shed';
  const SHED_CAP = 200;

  function loadShed() {
    try {
      const raw = localStorage.getItem(SHED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function persistShed(list) {
    try { localStorage.setItem(SHED_KEY, JSON.stringify(list.slice(0, SHED_CAP))); } catch {}
  }
  function saveShedEntry(entry) {
    const list = loadShed().filter((e) => e.id !== entry.id);
    list.unshift({ ...entry, savedAt: Date.now() });
    persistShed(list);
    refreshCardBookmarks();
  }
  function removeShedEntry(id) {
    persistShed(loadShed().filter((e) => e.id !== id));
    refreshCardBookmarks();
  }
  function isInShed(id) {
    return loadShed().some((e) => e.id === id);
  }
  function refreshCardBookmarks() {
    document.querySelectorAll('.card[data-repo-id]').forEach((c) => {
      c.dataset.bookmarked = isInShed(c.dataset.repoId) ? 'true' : 'false';
    });
  }

  // Event delegation for bookmark clicks on cards
  cardsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="bookmark"]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const card = btn.closest('.card[data-repo-id]');
    if (!card) return;
    const id = card.dataset.repoId;
    const ownerSlash = id.split('/');
    const owner = ownerSlash[0];
    const name  = ownerSlash.slice(1).join('/');
    const stars = parseInt(card.dataset.stars, 10) || 0;
    const language = card.dataset.language || '';
    const link = card.querySelector('.card-link');
    const url = safeUrl(link ? link.getAttribute('href') : '');

    if (isInShed(id)) {
      removeShedEntry(id);
      showToast('Removed from Shed');
    } else {
      saveShedEntry({ kind: 'repo', id, owner, name, url, stars, language });
      showToast('Saved to Shed');
    }
  });

  // Climax card's Save to shed (demo-mode remix idea)
  const saveToShedBtn = document.getElementById('saveToShedBtn');
  if (saveToShedBtn) {
    let lastSaveTs = 0;
    saveToShedBtn.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastSaveTs < 1000) return; // debounce dupes
      lastSaveTs = now;
      if (!D || !D.REMIX) return;
      const id = `idea:${D.REMIX.title}`;
      saveShedEntry({
        kind: 'idea',
        id,
        title: D.REMIX.title,
        oneliner: D.REMIX.oneliner,
        body: D.REMIX.body,
      });
      showToast('Saved to Shed');
    });
  }

  // Render the Shed panel into the overlay
  function renderShedPanel() {
    const list = loadShed();
    if (!list.length) {
      openOverlay('Shed', `<div class="overlay-empty">Nothing saved yet. Click the bookmark on a repo or the <b>Save to shed</b> button on an idea.</div>`);
      return;
    }
    const repos = list.filter((e) => e.kind === 'repo');
    const ideas = list.filter((e) => e.kind === 'idea');
    const fragment = document.createElement('div');

    if (ideas.length) {
      const section = document.createElement('section');
      section.className = 'overlay-section';
      section.innerHTML = `<div class="overlay-section-title">Ideas</div>`;
      const ul = document.createElement('ul');
      ul.className = 'overlay-list';
      ideas.forEach((e) => {
        const li = document.createElement('li');
        li.className = 'overlay-list-item';
        li.innerHTML = `
          <div class="overlay-list-main">
            <div>${escapeHtml(e.title || 'Untitled idea')}</div>
            <div class="overlay-list-sub">${escapeHtml(e.oneliner || '')}</div>
          </div>
          <button class="overlay-list-action overlay-list-action-danger" data-remove="${escapeHtml(e.id)}" type="button">Remove</button>
        `;
        ul.appendChild(li);
      });
      section.appendChild(ul);
      fragment.appendChild(section);
    }

    if (repos.length) {
      const section = document.createElement('section');
      section.className = 'overlay-section';
      section.innerHTML = `<div class="overlay-section-title">Repos</div>`;
      const ul = document.createElement('ul');
      ul.className = 'overlay-list';
      repos.forEach((e) => {
        const li = document.createElement('li');
        li.className = 'overlay-list-item';
        li.innerHTML = `
          <div class="overlay-list-main">
            <div>${escapeHtml(e.owner)} / <b>${escapeHtml(e.name)}</b></div>
            <div class="overlay-list-sub">★ ${formatStars(e.stars || 0)} · ${escapeHtml(e.language || '')}</div>
          </div>
          <a class="overlay-list-action" href="${escapeHtml(safeUrl(e.url))}" target="_blank" rel="noopener noreferrer">Open</a>
          <button class="overlay-list-action overlay-list-action-danger" data-remove="${escapeHtml(e.id)}" type="button">Remove</button>
        `;
        ul.appendChild(li);
      });
      section.appendChild(ul);
      fragment.appendChild(section);
    }

    openOverlay(`Shed · ${list.length}`, fragment);

    // Wire Remove buttons
    overlayBody.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-remove]');
      if (!btn) return;
      removeShedEntry(btn.getAttribute('data-remove'));
      renderShedPanel(); // re-render
    }, { once: false });
  }

  // Topbar ghostnav items — wire Shed for now (others wired in Wave G)
  document.querySelectorAll('.ghostnav-item, .ghostnav-avatar').forEach((el) => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.style.cursor = 'pointer';
  });
  const navShed = Array.from(document.querySelectorAll('.ghostnav-item')).find((el) => el.textContent.trim().toLowerCase() === 'shed');
  if (navShed) {
    const handler = () => renderShedPanel();
    navShed.addEventListener('click', handler);
    navShed.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  }

  // ----- Boot -----------------------------------------------------------
  setTimeout(runLoop, 800);
})();
