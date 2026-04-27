export default async function handler(req, res) {
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  const upstream = `https://api.stlouisfed.org/fred/series/observations?${params.toString()}`;

  try {
    const response = await fetch(upstream);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch {
    res.status(502).json({ error: 'upstream fetch failed' });
  }
}
