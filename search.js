import { cli, Strategy } from '@jackwener/opencli/registry';

cli({
  site: 'uindex',
  name: 'search',
  description: 'Search torrents on UIndex by keyword and category',
  domain: 'uindex.org',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'query', required: true, positional: true, help: 'Search keyword' },
    { name: 'category', default: '0', help: 'Category: 0=All, 1=Movies, 2=TV, 3=Games, 4=Music, 5=Apps, 6=XXX, 7=Anime, 8=Other' },
    { name: 'limit', type: 'int', default: 20, help: 'Max results' },
    { name: 'page', type: 'int', default: 1, help: 'Page number' },
    { name: 'quality', help: 'Filter by resolution: 2160p, 1080p, 720p, 4k (alias for 2160p/4k), or custom regex pattern' },
    { name: 'min-seeders', type: 'int', help: 'Minimum seeders count' },
    { name: 'sort', default: '', help: 'Sort by: seeders, size, name, uploaded (use -prefix for ascending, e.g. -name)' },
  ],
  columns: ['#', 'category', 'name', 'size', 'uploaded', 'seeders', 'leechers'],
  func: async (kwargs, page) => {
    const url = `https://uindex.org/search.php?c=${kwargs.category}&search=${encodeURIComponent(kwargs.query)}&page=${kwargs.page}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const html = await resp.text();
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const items = [];
    for (const rowHtml of rows) {
      const cells = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
      if (cells.length < 5) continue;

      const getText = (cell) => cell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      const category = getText(cells[0]);
      const name = getText(cells[1] || '').replace(/^Download Magnet\s*/i, '');
      const size = getText(cells[2]);
      const uploaded = cells[3] ? getText(cells[3]) : '';
      const seedersRaw = cells[4] ? getText(cells[4]) : '0';
      const leechers = cells[5] ? getText(cells[5]) : '0';

      if (!name || !name.trim()) continue;
      items.push({ rank: String(items.length + 1), category, name, size, uploaded, seedersRaw, leechers });
    }

    // --- Quality filter ---
    if (kwargs.quality) {
      let pattern = kwargs.quality;
      const qualityAliases = { '4k': '(2160p|4k)' };
      if (qualityAliases[pattern.toLowerCase()]) pattern = qualityAliases[pattern.toLowerCase()];
      const re = new RegExp(pattern, 'i');
      const filtered = items.filter(i => re.test(i.name));
      if (filtered.length === 0) return [{ rank: '-', category: '-', name: `No results matching "${kwargs.quality}"`, size: '-', uploaded: '-', seeders: '-', leechers: '-' }];
      items.length = 0; items.push(...filtered);
    }

    // --- Min seeders filter ---
    if (kwargs['min-seeders'] && kwargs['min-seeders'] > 0) {
      const minS = kwargs['min-seeders'];
      const filtered = items.filter(i => {
        const s = parseInt(i.seedersRaw.replace(/,/g, ''));
        return !isNaN(s) && s >= minS;
      });
      if (filtered.length === 0) return [{ rank: '-', category: '-', name: `No results with >= ${minS} seeders`, size: '-', uploaded: '-', seeders: '-', leechers: '-' }];
      items.length = 0; items.push(...filtered);
    }

    // --- Sort ---
    if (kwargs.sort) {
      let field = kwargs.sort;
      let ascending = false;
      if (field.startsWith('-')) { ascending = true; field = field.slice(1); }
      const fieldMap = { 'seeders': 'seedersRaw', 'size': 'size', 'name': 'name', 'uploaded': 'uploaded' };
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

    const limit = kwargs.limit || 20;
    return items.slice(0, limit).map(i => ({
      '#': i.rank, category: i.category, name: i.name, size: i.size,
      uploaded: i.uploaded, seeders: i.seedersRaw, leechers: i.leechers,
    }));
  },
});
