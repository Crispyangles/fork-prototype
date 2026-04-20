/* ========================================================================
   Fork — fake GitHub data for the prototype demo loop
   No real API calls. All summaries / clusters / pain points / gaps
   are hand-crafted to read as if Fork's AI generated them.
   ======================================================================== */

const FAKE_QUERY = 'ai screenshot tools';

const FAKE_REPOS = [
  // ----- Mac apps cluster -----
  { name: 'shottr',           owner: 'inspiringapps', stars: 4234,  language: 'Swift',      languageColor: '#fa7343',
    summary: 'Lightweight macOS screenshot tool with annotation, OCR, and scrolling capture.',
    cluster: 'mac-apps' },
  { name: 'cleanshot-x',      owner: 'mothership',    stars: 8917,  language: 'Swift',      languageColor: '#fa7343',
    summary: 'Premium macOS screenshot suite with cloud sharing and recording. Closed source.',
    cluster: 'mac-apps' },
  { name: 'flameshot',        owner: 'flameshot-org', stars: 26491, language: 'C++',        languageColor: '#f34b7d',
    summary: 'Cross-platform screenshot tool with built-in annotations. Linux-first.',
    cluster: 'mac-apps' },
  { name: 'screenocr',        owner: 'tisfeng',       stars: 1284,  language: 'Swift',      languageColor: '#fa7343',
    summary: 'macOS app that runs on-device OCR for any captured region.',
    cluster: 'mac-apps' },
  { name: 'pieces-os-client', owner: 'pieces-app',    stars: 612,   language: 'TypeScript', languageColor: '#3178c6',
    summary: 'AI-powered snippet & screenshot memory — searchable across captures.',
    cluster: 'mac-apps' },

  // ----- CLI tools cluster -----
  { name: 'tesseract.js',     owner: 'naptha',        stars: 35820, language: 'JavaScript', languageColor: '#f1e05a',
    summary: 'Pure-JavaScript OCR. Drop in any image, extract text. Wraps Tesseract.',
    cluster: 'cli' },
  { name: 'screenshot-cli',   owner: 'sindresorhus',  stars: 1849,  language: 'JavaScript', languageColor: '#f1e05a',
    summary: 'Capture and save screenshots from the command line. Tiny, scriptable.',
    cluster: 'cli' },
  { name: 'gpt-vision-shot',  owner: 'kazuki-sf',     stars: 287,   language: 'Python',     languageColor: '#3572a5',
    summary: 'CLI that sends a screenshot to GPT-4 Vision and prints the response.',
    cluster: 'cli' },

  // ----- Browser extensions cluster -----
  { name: 'monosnap',         owner: 'monosnap',      stars: 412,   language: 'JavaScript', languageColor: '#f1e05a',
    summary: 'Browser extension for capturing, annotating, and sharing browser screenshots.',
    cluster: 'browser-ext' },
  { name: 'gofullpage',       owner: 'mrcoles',       stars: 5018,  language: 'JavaScript', languageColor: '#f1e05a',
    summary: 'Capture full-page screenshots in Chrome. Solves the "scroll & stitch" problem.',
    cluster: 'browser-ext' },
  { name: 'awesome-screenshot', owner: 'awesome-tools', stars: 943, language: 'JavaScript', languageColor: '#f1e05a',
    summary: 'Browser extension for screen capture + simple recording. Outdated UX.',
    cluster: 'browser-ext' },
  { name: 'page-summary',     owner: 'kkaifu',        stars: 174,   language: 'TypeScript', languageColor: '#3178c6',
    summary: 'Summarize any web page with AI from a screenshot. No native app version.',
    cluster: 'browser-ext' },
];

const CLUSTER_LABELS = {
  'mac-apps':    'Mac apps',
  'cli':         'CLI tools',
  'browser-ext': 'Browser extensions',
};

const PAIN_POINTS = [
  '"Looks dated next to CleanShot — but I can\'t justify $30 for what should be free." (issue #412)',
  '"Why can\'t I search across all my old screenshots?" (issue #88)',
  '"Need an AI feature that explains what\'s in a chart." (discussion #156)',
  '"Crashes on M3 during long scrolling captures." (issue #501)',
];

const GAP = {
  title: 'What\'s missing',
  body:  'Nobody has built a Mac-native screenshot tool with semantic search across all your captures + AI question-answering on any image. The Mac apps look great but lack AI; the CLI tools have AI but no UX; the browser extensions are stuck inside the browser.',
};

const REMIX = {
  title:    'Your remix',
  oneliner: 'A polished Mac menubar app: Shottr\'s UX × Pieces\' AI memory.',
  body:     'Index every screenshot with embeddings the moment you capture. "Find the one where I sketched the pricing page" → instant. Ask any image "what is this?" via Claude Vision. $25 one-time on Gumroad.',
};

// Discover mode — surfaces fresh trending opportunities (separate from a topic search)
const IDEA_CARDS = [
  {
    topic:    'Voice-first task manager',
    trend:    '+220%',
    signal:   'No Mac native version exists',
    oneliner: 'Every existing app is keyboard-only. Whisper makes voice capture finally fast enough.',
  },
  {
    topic:    'Local-first AI email triage',
    trend:    '+340%',
    signal:   'All current options send to cloud',
    oneliner: 'Run on-device LLM over Apple Mail; never ships your inbox to OpenAI.',
  },
  {
    topic:    'Screenshot-to-spec',
    trend:    '+185%',
    signal:   'Designers still doing this manually',
    oneliner: 'Drop a UI screenshot, get a complete component spec + Tailwind code in 5 seconds.',
  },
  {
    topic:    'Personal AI changelog',
    trend:    '+95%',
    signal:   'Builders crave end-of-week recap',
    oneliner: 'Your week\'s git commits + Linear tickets → a beautiful auto-generated update post.',
  },
];

const DISCOVER_PROMPT = {
  title:    'Or discover something new',
  subtitle: 'Trending on GitHub this week — opportunities nobody is shipping yet.',
};

window.FORK_DATA = { FAKE_QUERY, FAKE_REPOS, CLUSTER_LABELS, PAIN_POINTS, GAP, REMIX, IDEA_CARDS, DISCOVER_PROMPT };
