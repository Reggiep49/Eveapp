const json = (value, status = 200) => Response.json(value, {
  status, headers: {'Cache-Control': 'private, no-store'}
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/family') return env.ASSETS.fetch(request);
    const owner = request.headers.get('oai-authenticated-user-id');
    if (!owner) return json({error: 'Sign in to your private family space.'}, 401);

    const read = () => env.DB.prepare(
      'SELECT revision, document FROM eve_families WHERE owner = ?'
    ).bind(owner).first();
    const current = async () => {
      const row = await read();
      return {revision: row?.revision ?? 0, data: row ? JSON.parse(row.document) : null};
    };

    if (request.method === 'GET') return json(await current());
    if (request.method !== 'PUT') return json({error: 'Method not allowed'}, 405);
    if (request.headers.get('origin') !== url.origin) return json({error: 'Invalid origin'}, 403);
    const body = await request.text();
    if (body.length > 160000) return json({error: 'Family archive is full'}, 413);
    let input;
    try { input = JSON.parse(body); } catch { return json({error: 'Invalid JSON'}, 400); }
    if (!Number.isSafeInteger(input?.revision) || input.revision < 0 ||
        !input.data || !Array.isArray(input.data.profiles) || input.data.profiles.length > 8 ||
        !Array.isArray(input.data.letters) || input.data.letters.length > 80) {
      return json({error: 'Invalid family data'}, 400);
    }
    const args = JSON.stringify(input.data);
    const result = input.revision === 0
      ? await env.DB.prepare('INSERT OR IGNORE INTO eve_families VALUES (?, 1, ?)').bind(owner, args).run()
      : await env.DB.prepare('UPDATE eve_families SET revision = revision + 1, document = ? WHERE owner = ? AND revision = ?')
        .bind(args, owner, input.revision).run();
    if (!result.meta.changes) return json(await current(), 409);
    return json({revision: input.revision + 1});
  }
};
