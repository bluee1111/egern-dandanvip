// 蛋蛋不语 · 域名探针 (Egern 原生 JS API)
// 作用：把 App 访问过的每个域名上报一次（按域名永久去重），不改任何响应体。
// 用完即删。

const WATCH = [
  "captive.apple.com",
  "icanhazip.com",
  "one.one.one.one",
  "38.76.202.248",
];

const SYSTEM_SKIP = /(^|\.)(icloud\.com|mzstatic\.com|aaplimg\.com|cdn-apple\.com|ls\.apple\.com|apple-cloudkit\.com|akamaized\.net|akamaihd\.net)$/i;

export default async function (ctx) {
  const url = (ctx.request && ctx.request.url) || "";
  let host = "";
  try {
    host = new URL(url).host;
  } catch (e) {
    host = ((url.match(/^[a-z]+:\/\/([^\/]+)/i) || [])[1] || "").split(":")[0];
  }
  if (!host) return;

  const watched = WATCH.indexOf(host) !== -1;
  if (!watched && SYSTEM_SKIP.test(host)) return;

  let list = [];
  try {
    list = ctx.storage.getJSON("danboHosts") || [];
  } catch (e) {
    list = [];
  }
  if (list.indexOf(host) !== -1) return;
  list.push(host);
  try {
    ctx.storage.setJSON("danboHosts", list);
  } catch (e) {}

  ctx.notify({
    title: (watched ? "⭐ 关注域名 #" : "新域名 #") + list.length,
    subtitle: host,
    body: url.slice(0, 200),
    sound: false,
    duration: 6,
  });
}
