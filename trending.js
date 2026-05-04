import { cli, Strategy } from '@jackwener/opencli/registry';

cli({
  site: 'uindex',
  name: 'trending',
  description: 'View trending torrents (homepage — Movies & TV)',
  domain: 'uindex.org',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'section', default: 'movies', help: 'Section: movies, tv' },
    { name: 'limit', type: 'int', default: 15, help: 'Max results' },
    { name: 'quality', help: 'Filter by resolution: 2160p, 1080p, 720p, 4k (alias), or custom regex' },
    { name: 'min-seeders', type: 'int', help: 'Minimum seeders count' },
    { name: 'sort', default: '', help: 'Sort by: seeders, size, name (use -prefix for asc)' },
  ],
  columns: ['#', 'name', 'size', 'seeders', 'leechers'],
  func: async (kwargs, page) => {
    const resp = await fetch('https://uindex.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const html = await resp.text();

    const sectionKeyword = kwargs.section === 'tv' ? 'Trending TV' : 'Trending Movie';
    const headingIndex = html.indexOf(sectionKeyword);
    if (headingIndex === -1) return [];

    const afterHeading = html.slice(headingIndex);
    const tableMatch = afterHeading.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return [];

    const tableHtml = tableMatch[1];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const items = [];
    for (const rowHtml of rows) {
      const cells = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
      if (cells.length < 4) continue;

      const getText = (cell) => cell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      const rank = getText(cells[0]);
      const name = getText(cells[1]).replace(/^Download Magnet\s*/i, '');
      const size = getText(cells[2]);
      const seedersRaw = getText(cells[3]);
      const leechers = cells.length > 4 ? getText(cells[4]) : '';

      if (!name || !name.trim() || !rank || isNaN(parseInt(rank))) continue;
      items.push({ rank, name, size, seedersRaw, leechers });
    }

    // --- Quality filter ---
    if (kwargs.quality) {
      let pattern = kwargs.quality;
      const qualityAliases = { '4k': '(2160p|4k)' };
      if (qualityAliases[pattern.toLowerCase()]) pattern = qualityAliases[pattern.toLowerCase()];
      const re = new RegExp(pattern, 'i');
      items.length > 0 && items.splice(0, items.length, ...items.filter(i => re.test(i.name)));
    }

    // --- Min seeders filter ---
    if (kwargs['min-seeders'] && kwargs['min-seeders'] > 0) {
      const minS = kwargs['min-seeders'];
      items.length > 0 && items.splice(0, items.length, ...items.filter(i => {
        const s = parseInt(i.seedersRaw.replace(/,/g, ''));
        return !isNaN(s) && s >= minS;
      }));
    }

    // --- Sort ---
    if (kwargs.sort) {
      let field = kwargs.sort;
      let ascending = false;
      if (field.startsWith('-')) { ascending = true; field = field.slice(1); }
      const fieldMap = { 'seeders': 'seedersRaw', 'size': 'size', 'name': 'name' };
      const key = fieldMap[field.toLowerCase()] || 'seedersRaw';
      items.sort((a, b) => {
        let va = a[key], vb = b[key];
        if (key === 'seedersRaw') {
          va = parseInt(String(va).replace(/,/g, '')) || 0;
          vb = parseInt(String(vb).replace(/,/g, '')) || 0;
        }
        if (key === 'size') {
          const parseSize = (s) => { const m = String(s).match(/^([\d.]+)\s*(kB|MB|GB|TB)?$/i); if (!m) return 0; const n = parseFloat(m[1]), u = (m[2]||'MB').toUpperCase(); return n * ({'KB':1,'MB':1024,'GB':1048576,'TB':1073741824}[u]||1024); };
          va = parseSize(va); vb = parseSize(vb);
        }
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return ascending ? -1 : 1;
        if (va > vb) return ascending ? 1 : -1;
        return 0;
      });
    }

    return items.slice(0, kwargs.limit || 15).map(i => ({
      '#': i.rank, name: i.name, size: i.size, seeders: i.seedersRaw, leechers: i.leechers,
    }));
  },
});
