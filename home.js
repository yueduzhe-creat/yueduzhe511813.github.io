try {
  const [featuredResponse, allResponse] = await Promise.all([
    fetch('./data/featured.json'),
    fetch('./data/all.json'),
  ]);
  if (!featuredResponse.ok || !allResponse.ok) throw new Error('论文数据加载失败');
  const [featured, all] = await Promise.all([featuredResponse.json(), allResponse.json()]);
  const topics = new Set(all.map((paper) => paper.topic).filter(Boolean));
  document.querySelector('#featured-count').textContent = `${featured.length} 篇`;
  document.querySelector('#all-count').firstChild.textContent = String(all.length);
  document.querySelector('#topic-count').textContent = `${topics.size} 类`;
  document.querySelector('#featured-card-count').textContent = String(featured.length);
  document.querySelector('#all-card-count').textContent = String(all.length);
} catch (error) {
  console.error('Failed to load collection counts:', error);
}
