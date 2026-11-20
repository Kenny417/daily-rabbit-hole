// Builds the static site from posts/**/*.md into dist/.
// Usage: npm run build   (Cloudflare Pages: build command "npm run build", output dir "dist")
import { readFile, writeFile, mkdir, rm, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import YAML from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const SITE_DIR = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'dist');

const SITE = {
  title: 'The Daily Rabbit Hole',
  tagline: 'Surprising stories behind overlooked science, history, technology, nature and everyday objects.',
  // Absolute base URL, used for the RSS feed and canonical links.
  // Set SITE_URL in the Cloudflare Pages environment; CF_PAGES_URL is provided automatically.
  url: (process.env.SITE_URL || process.env.CF_PAGES_URL || '').replace(/\/+$/, ''),
};

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const tagLabel = (t) => t.replace(/-/g, ' ');
const tagSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : e.name.endsWith('.md') ? [p] : [];
    }),
  );
  return files.flat();
}

async function writeOut(rel, content) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
}

// ---------- parsing ----------

function parsePost(file, text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing YAML front matter`);
  const meta = YAML.parse(m[1]) ?? {};
  for (const key of ['title', 'date', 'slug']) {
    if (!meta[key]) throw new Error(`${file}: front matter is missing "${key}"`);
  }
  const date = String(meta.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${file}: date must be YYYY-MM-DD, got "${date}"`);

  const tokens = marked.lexer(m[2]);
  // The page template renders the title, so drop the article's own H1.
  const h1 = tokens.findIndex((t) => t.type === 'heading' && t.depth === 1);
  if (h1 !== -1) tokens.splice(h1, 1);
  const html = linkCitations(marked.parser(tokens));
  const words = m[2].split(/\s+/).filter(Boolean).length;

  return {
    file: path.relative(ROOT, file),
    title: String(meta.title),
    date,
    slug: String(meta.slug),
    description: meta.description ? String(meta.description) : '',
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    category: meta.category ? String(meta.category) : '',
    contentType: meta.content_type ? String(meta.content_type) : '',
    minutes: Math.max(1, Math.round(words / 230)),
    html,
  };
}

// Turns "[1]" citation markers into links to the numbered Sources list.
function linkCitations(html) {
  const m = html.match(/<h2>Sources<\/h2>\s*<ol([^>]*)>([\s\S]*?)<\/ol>/);
  if (!m) return html;
  let n = 0;
  const items = m[2].replace(/<li>/g, () => `<li id="source-${++n}">`);
  const sources = `<h2 id="sources">Sources</h2>\n<ol class="sources"${m[1]}>${items}</ol>`;
  // Only replace markers in text, never inside a tag's attributes.
  const link = (s) =>
    s.replace(/\[(\d+)\](?![^<]*>)/g, (all, d) =>
      Number(d) >= 1 && Number(d) <= n ? `<sup class="cite"><a href="#source-${d}">[${d}]</a></sup>` : all,
    );
  return link(html.slice(0, m.index)) + sources + link(html.slice(m.index + m[0].length));
}

// ---------- templates ----------

function layout({ title, description = SITE.tagline, path: pagePath = '/', body }) {
  const pageTitle = title ? `${title} · ${SITE.title}` : SITE.title;
  const canonical = SITE.url ? `<link rel="canonical" href="${esc(SITE.url + pagePath)}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title || SITE.title)}">
<meta property="og:description" content="${esc(description)}">
${canonical}
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.title)}" href="/feed.xml">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header class="masthead">
  <a class="brand" href="/">The Daily <span>Rabbit Hole</span></a>
  <nav><a href="/">Articles</a><a href="/tags/">Topics</a><a href="/feed.xml">RSS</a></nav>
</header>
<main>
${body}
</main>
<footer class="colophon">
  <p>Articles on this site are researched and written by an autonomous AI editorial agent, with numbered sources for every central claim.</p>
</footer>
</body>
</html>
`;
}

const tagList = (tags) =>
  tags.length
    ? `<ul class="tags">${tags.map((t) => `<li><a href="/tags/${tagSlug(t)}/">${esc(tagLabel(t))}</a></li>`).join('')}</ul>`
    : '';

const card = (p) => `<li class="card">
  <p class="kicker">${p.category ? `<span>${esc(p.category)}</span> · ` : ''}<time datetime="${p.date}">${formatDate(p.date)}</time></p>
  <h2><a href="/posts/${esc(p.slug)}/">${esc(p.title)}</a></h2>
  ${p.description ? `<p class="dek">${esc(p.description)}</p>` : ''}
  ${tagList(p.tags)}
</li>`;

const postPage = (p, prev, next) =>
  layout({
    title: p.title,
    description: p.description,
    path: `/posts/${p.slug}/`,
    body: `<article class="post">
  <header class="post-head">
    <p class="kicker">${p.category ? `<span>${esc(p.category)}</span> · ` : ''}<time datetime="${p.date}">${formatDate(p.date)}</time> · ${p.minutes} min read</p>
    <h1>${esc(p.title)}</h1>
    ${p.description ? `<p class="dek">${esc(p.description)}</p>` : ''}
    ${tagList(p.tags)}
  </header>
  <div class="prose">
${p.html}
  </div>
</article>
<nav class="pager">
  ${prev ? `<a class="prev" href="/posts/${esc(prev.slug)}/"><small>Previous</small>${esc(prev.title)}</a>` : '<span></span>'}
  ${next ? `<a class="next" href="/posts/${esc(next.slug)}/"><small>Next</small>${esc(next.title)}</a>` : '<span></span>'}
</nav>`,
  });

function rss(posts) {
  const item = (p) => `<item>
  <title>${esc(p.title)}</title>
  <link>${esc(`${SITE.url}/posts/${p.slug}/`)}</link>
  <guid>${esc(`${SITE.url}/posts/${p.slug}/`)}</guid>
  <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
  <description>${esc(p.description)}</description>
</item>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${esc(SITE.title)}</title>
<link>${esc(SITE.url + '/')}</link>
<description>${esc(SITE.tagline)}</description>
${posts.slice(0, 30).map(item).join('\n')}
</channel>
</rss>
`;
}

// ---------- build ----------

const files = await walk(POSTS_DIR);
const posts = await Promise.all(files.map(async (f) => parsePost(f, await readFile(f, 'utf8'))));

const seen = new Map();
for (const p of posts) {
  if (seen.has(p.slug)) throw new Error(`Duplicate slug "${p.slug}" in ${seen.get(p.slug)} and ${p.file}`);
  seen.set(p.slug, p.file);
}

posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)); // newest first

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await copyFile(path.join(SITE_DIR, 'styles.css'), path.join(OUT, 'styles.css'));

// Home page
await writeOut(
  'index.html',
  layout({
    body: `<section class="intro"><p>${esc(SITE.tagline)}</p></section>
<ol class="cards">
${posts.map(card).join('\n')}
</ol>`,
  }),
);

// Article pages (prev = older, next = newer)
for (const [i, p] of posts.entries()) {
  await writeOut(`posts/${p.slug}/index.html`, postPage(p, posts[i + 1], posts[i - 1]));
}

// Topic pages
const byTag = new Map();
for (const p of posts) for (const t of p.tags) byTag.set(t, [...(byTag.get(t) ?? []), p]);
const tags = [...byTag.keys()].sort();

await writeOut(
  'tags/index.html',
  layout({
    title: 'Topics',
    path: '/tags/',
    body: `<section class="listing-head"><h1>Topics</h1></section>
<ul class="topic-index">
${tags.map((t) => `<li><a href="/tags/${tagSlug(t)}/">${esc(tagLabel(t))}</a> <span>${byTag.get(t).length}</span></li>`).join('\n')}
</ul>`,
  }),
);

for (const t of tags) {
  await writeOut(
    `tags/${tagSlug(t)}/index.html`,
    layout({
      title: tagLabel(t),
      path: `/tags/${tagSlug(t)}/`,
      body: `<section class="listing-head"><p class="kicker"><a href="/tags/">Topics</a></p><h1>${esc(tagLabel(t))}</h1></section>
<ol class="cards">
${byTag.get(t).map(card).join('\n')}
</ol>`,
    }),
  );
}

// 404 (Cloudflare Pages serves dist/404.html for unknown paths)
await writeOut(
  '404.html',
  layout({
    title: 'Not found',
    body: `<section class="listing-head"><h1>This burrow is empty</h1><p class="dek">That page doesn't exist. <a href="/">Back to the articles</a>.</p></section>`,
  }),
);

if (SITE.url) {
  await writeOut('feed.xml', rss(posts));
} else {
  console.warn('SITE_URL not set: skipping feed.xml (RSS needs absolute links).');
}

console.log(`Built ${posts.length} article(s) and ${tags.length} topic page(s) into dist/`);
