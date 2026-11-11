// 蛋蛋不语 · 上报探针
// 把命中的请求（URL + 状态码 + 响应结构键名）POST 到 webhook，不发送任何字段值。
// 只用于排查，用完即删。

const HOOK = "https://webhook.site/7d7e98d4-f6e6-43d6-a4ee-2254fbc6c93d";
const DEDUPE_MS = 15000;

function shapeOf(raw) {
  if (!raw) return "EMPTY";
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) {
      return "ARRAY[" + j.length + "] keys=" + Object.keys(j[0] || {}).join(",");
    }
    if (j && typeof j === "object") {
      let s = "OBJ keys=" + Object.keys(j).join(",");
      if (j.data && typeof j.data === "object") {
        s += " | data.keys=" + Object.keys(j.data).join(",");
      }
      return s;
    }
    return "SCALAR";
  } catch (e) {
    return "NON-JSON len=" + raw.length;
  }
}

export default async function (ctx) {
  const url = (ctx.request && ctx.request.url) || "";
  const status = (ctx.response && ctx.response.status) || 0;
  const name = (ctx.script && ctx.script.name) || "";

  let raw = "";
  try {
    raw = await ctx.response.text();
  } catch (e) {
    raw = "";
  }

  // 同一 URL 15 秒内只上报一次
  const key = "rep|" + url;
  let last = 0;
  try {
    last = parseInt(ctx.storage.get(key) || "0", 10) || 0;
  } catch (e) {}
  const now = Date.now();
  if (now - last >= DEDUPE_MS) {
    try {
      ctx.storage.set(key, String(now));
    } catch (e) {}
    try {
      await ctx.http.post(HOOK, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
        body: {
          probe: name,
          url: url,
          status: status,
          body_len: raw ? raw.length : 0,
          shape: shapeOf(raw),
        },
      });
    } catch (e) {}
  }

  if (typeof raw === "string" && raw.length) return { body: raw };
}
