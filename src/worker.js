// Temporary: serve byte ranges for /_dx/* so Descript can import the staged video files.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/_dx/")) return env.ASSETS.fetch(req);
    const res = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
    const h = new Headers(res.headers);
    h.set("Accept-Ranges", "bytes");
    if (res.status !== 200) return new Response(res.body, { status: res.status, headers: h });
    const buf = await res.arrayBuffer(), size = buf.byteLength;
    h.set("Content-Length", String(size));
    const range = req.headers.get("Range");
    if (!range) return new Response(req.method === "HEAD" ? null : buf, { status: 200, headers: h });
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (!m) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    let start, end;
    if (m[1] === "") { start = Math.max(0, size - Number(m[2])); end = size - 1; }
    else { start = Number(m[1]); end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1; }
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    h.set("Content-Range", `bytes ${start}-${end}/${size}`);
    h.set("Content-Length", String(end - start + 1));
    return new Response(req.method === "HEAD" ? null : buf.slice(start, end + 1), { status: 206, headers: h });
  },
};
