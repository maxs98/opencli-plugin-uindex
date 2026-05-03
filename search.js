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
  ],
  columns: ['#', 'category', 'name', 'size', 'uploaded', 'seeders', 'leechers'],
  func: async (page, kwargs) => {
    const url = `https://uindex.org/search.php?c=${kwargs.category}&search=${encodeURIComponent(kwargs.query)}&page=${kwargs.page}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const html = await resp.text();
    // Parse table rows from HTML
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const items = [];
    for (const rowHtml of rows) {
      const cells = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
      if (cells.length < 5) continue;

      const getText = (cell) => {
        const cleaned = cell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        return cleaned;
      };

      const category = getText(cells[0]);
      const cell2 = cells[1] || '';
      const magnetMatch = cell2.match(/href="(magnet:\?[^"]+)"/i);
      const name = getText(cell2).replace(/^Download Magnet\s*/i, '');

      const size = getText(cells[2]);
      const uploaded = cells[3] ? getText(cells[3]) : '';
      const seeders = cells[4] ? getText(cells[4]) : '';
      const leechers = cells[5] ? getText(cells[5]) : '';

      if (!name || name === '' || name.match(/^\s*$/)) continue;

      items.push({
        '#': String(items.length + 1),
        category,
        name,
        size,
        uploaded,
        seeders,
        leechers,
      });
    }
    return items.slice(0, kwargs.limit || 20);
  },
});
