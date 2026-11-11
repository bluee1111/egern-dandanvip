// 蛋蛋不语 · 调试探针 (Egern 原生 JS API)
// 作用：抓到 38.76.202.248 的任意请求就弹通知，显示真实 URL + 响应结构。
// 不改响应体，纯观察。用完即删。

export default async function (ctx) {
  const url = (ctx.request && ctx.request.url) || "";

  let raw = null;
  try {
    raw = await ctx.response.text();
  } catch (e) {
    raw = null;
  }

  let shape = "⚠️ 响应体读取失败";
  if (raw !== null) {
    try {
      const j = JSON.parse(raw);
      if (Array.isArray(j)) {
        shape = "数组 [" + j.length + "] 首元素键: " + Object.keys(j[0] || {}).join(" / ");
      } else if (j && typeof j === "object") {
        shape = "对象 键: " + Object.keys(j).join(" / ");
        if (j.data && typeof j.data === "object") {
          shape += "\n.data 键: " + Object.keys(j.data).join(" / ");
        }
      } else {
        shape = "标量: " + JSON.stringify(j);
      }
    } catch (e) {
      shape = "非 JSON（前 80 字）: " + raw.slice(0, 80);
    }
  }

  // 同一个 URL 20 秒内只弹一次，避免刷屏
  const key = "probe|" + url;
  const now = Date.now();
  let last = 0;
  try {
    last = parseInt(ctx.storage.get(key) || "0", 10) || 0;
  } catch (e) {}
  if (now - last > 20000) {
    try {
      ctx.storage.set(key, String(now));
    } catch (e) {}
    ctx.notify({
      title: "蛋蛋不语 · 命中接口 ✅",
      subtitle: url.replace(/^https?:\/\//, "").slice(0, 90),
      body: shape + (raw ? "\n\n" + raw.slice(0, 240) : ""),
      sound: false,
      duration: 8,
    });
  }

  // 原样放行，不改任何东西
  if (typeof raw === "string") return { body: raw };
}
