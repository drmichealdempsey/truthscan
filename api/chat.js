export const config = { runtime: 'edge' };

export default async function handler(req) {

  /* only allow POST */
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /* block requests not coming from your own domain */
  const origin = req.headers.get('origin') || '';
  const allowed = [
    'https://truthscan.vercel.app',   /* replace with your actual domain */
    'http://localhost:3000',           /* for local testing */
    'http://127.0.0.1:5500'           /* VS Code Live Server */
  ];
  if (!allowed.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /* parse the incoming messages from the browser */
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /* call OpenAI — key is read from Vercel environment, never sent to browser */
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      temperature: 0.7,
      messages
    })
  });

  const data = await openaiRes.json();

  if (!openaiRes.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI error' }), {
      status: openaiRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin
      }
    });
  }

  /* return the reply to the browser */
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin
    }
  });
}
