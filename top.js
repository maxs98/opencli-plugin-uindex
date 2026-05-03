import { cli, Strategy } from '@jackwener/opencli/registry';

const CATEGORY_NAMES = ['All', 'Movies', 'TV', 'Games', 'Music', 'Apps', 'XXX', 'Anime', 'Other'];

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

      const getText = (cell) => {
        return cell.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      };

      const rank = getText(cells[0]);
      const category = getText(cells[1]);
      const name = getText(cells[2]).replace(/^Download Magnet\s*/i, '');
      const size = getText(cells[3]);
      const uploaded = getText(cells[4]);
      const seeders = getText(cells[5]);
      const leechers = cells.length > 6 ? getText(cells[6]) : '';

      if (!name || name === '' || !rank || isNaN(parseInt(rank))) continue;

      items.push({
        '#': rank,
        category,
        name,
        size,
        uploaded,
        seeders,
        leechers,
      });
    }
    return items.slice(0, 100);
  },
});
