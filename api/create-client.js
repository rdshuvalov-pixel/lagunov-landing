// Vercel Serverless Function: proxy to Salebot create_client with CORS
export default async function handler(req, res) {
  const ORIGIN = 'https://career-lagunov.ru';
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, phone } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const apiKey = process.env.SALEBOT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SALEBOT_API_KEY not configured' });
    }

    const urlCreate = `https://chatter.salebot.pro/api/${apiKey}/create_order`;
    let r = await fetch(urlCreate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        phone, 
        description: `Заявка на консультацию от ${name}. Телефон: ${phone}. Источник: landing.`,
        budget: 0,
        id_state: 66428062
      })
    });
    let text = await r.text();
    // Если у ключа нет прав (WRONG_ACTION) или другой 4xx, делаем фолбэк на callback
    if (!r.ok && /WRONG_ACTION/i.test(text)) {
      const urlCb = `https://chatter.salebot.pro/api/${apiKey}/create_order`;
      r = await fetch(urlCb, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone, 
          description: `Заявка на консультацию от ${name}. Телефон: ${phone}. Источник: landing.`,
          budget: 0,
          id_state: 66428062
        })
      });
      text = await r.text();
    }
    if (!r.ok) return res.status(r.status).send(text);
    try { return res.status(200).json(JSON.parse(text)); }
    catch { return res.status(200).send(text); }
  } catch (e) {
    return res.status(500).json({ error: 'proxy_error', details: String(e) });
  }
}


