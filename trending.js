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
  ],
  columns: ['#', 'name', 'size', 'seeders', 'leechers'],
  func: async (page, kwargs) => {
    const resp = await fetch('https://uindex.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const html = await resp.text();

    // Find the trending section by heading
    const sectionKeyword = kwargs.section === 'tv' ? 'Trending TV' : 'Trending Movie';
    const headingIndex = html.indexOf(sectionKeyword);
    if (headingIndex === -1) return [];

    // Get the content after this heading and find the first table
    const afterHeading = html.slice(headingIndex);
    const tableMatch = afterHeading.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return [];

    const tableHtml = tableMatch[1];
    const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    const items = [];
    for (const rowHtml of rows) {
      const cells = rowHtml.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || [];
      if (cells.length < 4) continue;

      const getText = (cell) => {
        return cell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      };

      const rank = getText(cells[0]);
      const name = getText(cells[1]).replace(/^Download Magnet\s*/i, '');
      const size = getText(cells[2]);
      const seeders = getText(cells[3]);
      const leechers = cells.length > 4 ? getText(cells[4]) : '';

      if (!name || name === '' || !rank || isNaN(parseInt(rank))) continue;

      items.push({
        '#': rank,
        name,
        size,
        seeders,
        leechers,
      });
    }
    return items.slice(0, kwargs.limit || 15);
  },
});
