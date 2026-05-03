import { cli, Strategy } from '@jackwener/opencli/registry';

cli({
  site: 'uindex',
  name: 'top',
  description: 'UIndex Top 100 torrents',
  domain: 'uindex.org',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'category', default: '0', help: 'Category: 0=All, 1=Movies, 2=TV, 3=Games, 4=Music, 5=Apps, 6=XXX, 7=Anime, 8=Other' },
    { name: 'duration', default: '7d', help: 'Duration: 24h, 7d, 30d, 3m, 6m, 1y, all' },
    { name: 'limit', type: 'int', default: 20, help: 'Max results (max 100)' },
    { name: 'quality', help: 'Filter by resolution: 2160p, 1080p, 720p, 4k (alias), or custom regex' },
    { name: 'min-seeders', type: 'int', help: 'Minimum seeders count' },
    { name: 'sort', default: '', help: 'Sort by: seeders, size, name, uploaded (use -prefix for asc)' },
  ],
  columns: ['#', 'category', 'name', 'size', 'uploaded', 'seeders', 'leechers'],
  func: async (page, kwargs) => {
    const durationMap = {
      '24h': '1', '7d': '7', '30d': '30', '3m': '90', '6m': '180', '1y': '365', 'all': '0',
    };
    const d = durationMap[kwargs.duration] || '7';
    const url = `https://uindex.org/top.php?c=${kwargs.category}&d=${d}`;
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
      if (cells.length < 6) continue;

      const getText = (cell) => cell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      const rank = getText(cells[0]);
      const category = getText(cells[1]);
      const name = getText(cells[2]).replace(/^Download Magnet\s*/i, '');
      const size = getText(cells[3]);
      const uploaded = getText(cells[4]);
      const seedersRaw = getText(cells[5]);
      const leechers = cells.length > 6 ? getText(cells[6]) : '';

      if (!name || !name.trim() || !rank || isNaN(parseInt(rank))) continue;
      items.push({ rank, category, name, size, uploaded, seedersRaw, leechers });
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

    const limit = Math.min(kwargs.limit || 20, 100);
    return items.slice(0, limit).map(i => ({
      '#': i.rank, category: i.category, name: i.name, size: i.size,
      uploaded: i.uploaded, seeders: i.seedersRaw, leechers: i.leechers,
    }));
  },
});
