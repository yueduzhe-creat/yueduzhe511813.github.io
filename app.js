const $ = (selector) => document.querySelector(selector);

const state = { papers: [], query: '', topic: '', year: '', sort: 'newest' };
const collator = new Intl.Collator('zh-CN', { sensitivity: 'base', numeric: true });

function cleanPaper(item, index) {
  if (!item || typeof item !== 'object' || !String(item.title || '').trim()) return null;
  const link = String(item.url || '').trim();
  return {
    id: String(item.id || `paper-${index + 1}`),
    title: String(item.title).trim(),
    authors: String(item.authors || '').trim(),
    year: item.year != null && item.year !== '' && Number.isInteger(Number(item.year)) ? Number(item.year) : null,
    venue: String(item.venue || '').trim(),
    topic: String(item.topic || '').trim(),
    method: String(item.method || '').trim(),
    motivation: String(item.motivation || '').trim(),
    summary: String(item.summary || '').trim(),
    presenter: String(item.presenter || '').trim(),
    tags: Array.isArray(item.tags) ? item.tags.map(String).filter(Boolean) : [],
    url: /^https?:\/\//i.test(link) ? link : ''
  };
}

function node(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (value !== undefined && value !== null) el.textContent = String(value);
  return el;
}

function uniqueValues(key) {
  return [...new Set(state.papers.map((paper) => paper[key]).filter(Boolean))];
}

function renderOverview() {
  const years = uniqueValues('year').sort((a, b) => a - b);
  $('#hero-count').firstChild.textContent = String(state.papers.length);
  $('#topic-count').textContent = String(uniqueValues('topic').length);
  $('#year-range').textContent = years.length ? (years[0] === years.at(-1) ? String(years[0]) : `${years[0]}—${years.at(-1)}`) : '待补充';
}

function renderFilters() {
  const topicRoot = $('#topic-filters');
  const yearRoot = $('#year-filters');
  topicRoot.replaceChildren();
  yearRoot.replaceChildren();
  const topics = uniqueValues('topic').sort(collator.compare);
  const years = uniqueValues('year').sort((a, b) => b - a);
  for (const [root, key, values] of [[topicRoot, 'topic', topics], [yearRoot, 'year', years]]) {
    if (!values.length) { root.append(node('p', 'filter-hint', '暂无选项')); continue; }
    for (const value of values) {
      const label = node('label', 'filter-option');
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = key; radio.value = value;
      radio.checked = String(state[key]) === String(value);
      radio.addEventListener('change', () => { state[key] = String(value); render(); });
      label.append(radio, node('span', '', value));
      label.append(node('small', '', state.papers.filter((paper) => String(paper[key]) === String(value)).length));
      root.append(label);
    }
  }
}

function matches(paper) {
  if (state.topic && paper.topic !== state.topic) return false;
  if (state.year && String(paper.year) !== state.year) return false;
  if (!state.query) return true;
  const text = [paper.title, paper.authors, paper.venue, paper.topic, paper.method, paper.motivation, paper.summary, paper.presenter, ...paper.tags].join(' ').toLocaleLowerCase();
  return text.includes(state.query.toLocaleLowerCase());
}

function filteredPapers() {
  const papers = state.papers.filter(matches);
  papers.sort((a, b) => state.sort === 'title'
    ? collator.compare(a.title, b.title)
    : state.sort === 'oldest'
      ? (a.year || 0) - (b.year || 0) || collator.compare(a.title, b.title)
      : (b.year || 0) - (a.year || 0) || collator.compare(a.title, b.title));
  return papers;
}

function paperCard(paper) {
  const card = node('article', 'paper-card');
  const top = node('div', 'card-top');
  top.append(node('span', 'paper-year', paper.year || '年份待补'));
  if (paper.topic) top.append(node('span', 'paper-topic', paper.topic));
  const title = node('h3', '', paper.title);
  const authors = node('p', 'paper-authors', paper.authors || '作者待补充');
  const summary = node('p', 'paper-summary', paper.summary || '摘要与阅读笔记待补充。');
  const tags = node('div', 'tag-list');
  paper.tags.slice(0, 3).forEach((tag) => tags.append(node('span', 'tag', tag)));
  const bottom = node('div', 'card-bottom');
  bottom.append(node('span', 'paper-venue', paper.venue || '发表信息待补充'));
  const button = node('button', 'detail-button', '查看详情');
  button.type = 'button';
  button.addEventListener('click', () => openPaper(paper));
  bottom.append(button);
  card.append(top, title, authors, summary, tags, bottom);
  return card;
}

function renderActiveFilters() {
  const root = $('#active-filters');
  root.replaceChildren();
  for (const [key, value] of [['topic', state.topic], ['year', state.year]]) {
    if (!value) continue;
    const button = node('button', 'filter-chip', `${value} ×`);
    button.type = 'button';
    button.setAttribute('aria-label', `移除筛选：${value}`);
    button.addEventListener('click', () => { state[key] = ''; render(); });
    root.append(button);
  }
}

function render() {
  const papers = filteredPapers();
  $('#visible-count').textContent = String(papers.length);
  const grid = $('#paper-grid');
  grid.replaceChildren(...papers.map(paperCard));
  const empty = $('#empty-state');
  empty.hidden = papers.length > 0;
  if (!papers.length) {
    const hasFilters = Boolean(state.query || state.topic || state.year);
    $('#empty-title').textContent = hasFilters ? '没有找到匹配的论文' : '论文正在整理中';
    $('#empty-copy').textContent = hasFilters ? '试试其他关键词，或清除筛选条件。' : '研究方向和论文清单确定后，这里会展示完整的文献地图。';
    $('#empty-reset').hidden = !hasFilters;
  }
  renderActiveFilters();
  renderFilters();
}

function addDetail(root, heading, content) {
  if (!content) return;
  const section = node('section', 'dialog-section');
  section.append(node('h3', '', heading), node('p', '', content));
  root.append(section);
}

function openPaper(paper) {
  const root = $('#dialog-content');
  root.replaceChildren();
  const meta = node('div', 'dialog-meta');
  [paper.year, paper.venue, paper.topic].filter(Boolean).forEach((value) => meta.append(node('span', '', value)));
  root.append(meta, node('h2', '', paper.title));
  addDetail(root, '作者', paper.authors);
  addDetail(root, '算法 / 方法', paper.method);
  addDetail(root, '研究动机', paper.motivation);
  addDetail(root, '核心创新点', paper.summary);
  addDetail(root, '汇报人', paper.presenter);
  if (paper.tags.length) addDetail(root, '关键词', paper.tags.join(' · '));
  if (paper.url) {
    const link = node('a', 'paper-link', '阅读原文');
    link.href = paper.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    root.append(link);
  }
  $('#paper-dialog').showModal();
}

function clearFilters() {
  state.query = ''; state.topic = ''; state.year = '';
  $('#search-input').value = '';
  render();
}

$('#search-input').addEventListener('input', (event) => { state.query = event.target.value.trim(); render(); });
$('#sort-select').addEventListener('change', (event) => { state.sort = event.target.value; render(); });
$('#reset-filters').addEventListener('click', clearFilters);
$('#empty-reset').addEventListener('click', clearFilters);
$('#dialog-close').addEventListener('click', () => $('#paper-dialog').close());
$('#paper-dialog').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !$('#paper-dialog').open) {
    event.preventDefault(); $('#search-input').focus();
  }
});

try {
  const collection = $('.site-shell').dataset.collection;
  const response = await fetch(`./data/${collection === 'featured' ? 'featured' : 'all'}.json`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('论文数据必须是数组');
  state.papers = data.map(cleanPaper).filter(Boolean);
  renderOverview();
  render();
} catch (error) {
  $('#empty-title').textContent = '论文数据暂时无法加载';
  $('#empty-copy').textContent = '请稍后重试。';
  $('#empty-state').hidden = false;
  console.error('Failed to load papers:', error);
}
