// Проверка видеокарты до загрузки сцены «Рай-Из».
// 1) Нет WebGL или программная отрисовка (SwiftShader, llvmpipe, Microsoft Basic Render) — аппаратное ускорение выключено:
//    показываем, как его включить в этом браузере.
// 2) На ноутбуке браузер рисует на встроенной Intel — мягкая подсказка переключить браузер на дискретную видеокарту
//    (один раз, можно скрыть навсегда).
(function () {
  "use strict";
  var ua = navigator.userAgent || "";
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
                set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  function gpu() {
    var c = document.createElement("canvas"), gl = null;
    try { gl = c.getContext("webgl2") || c.getContext("webgl"); } catch (e) {}
    if (!gl) return { ok: false, name: "" };
    var name = "";
    try {
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    } catch (e) {}
    return { ok: true, name: String(name || "") };
  }

  function browser() {
    if (/YaBrowser/i.test(ua)) return { n: "Яндекс Браузер", url: "browser://settings/system", path: "Настройки → Системные → «Использовать аппаратное ускорение, если возможно»", exe: "C:\\Program Files (x86)\\Yandex\\YandexBrowser\\Application\\browser.exe" };
    if (/Edg\//i.test(ua)) return { n: "Microsoft Edge", url: "edge://settings/system", path: "Параметры → Система и производительность → «Использовать графическое ускорение, если доступно»", exe: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" };
    if (/OPR\//i.test(ua)) return { n: "Opera", url: "opera://settings/system", path: "Настройки → Система → «Использовать аппаратное ускорение, если доступно»", exe: "Opera (launcher.exe)" };
    if (/Firefox/i.test(ua)) return { n: "Firefox", url: "about:preferences", path: "Настройки → Основные → Производительность → снимите «Использовать рекомендуемые настройки» и включите «По возможности использовать аппаратное ускорение»", exe: "C:\\Program Files\\Mozilla Firefox\\firefox.exe" };
    return { n: "Google Chrome", url: "chrome://settings/system", path: "Настройки → Система → «Использовать графическое ускорение, если оно доступно»", exe: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" };
  }

  function css() {
    var s = document.createElement("style");
    s.textContent =
      "#gpuw{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(2,8,20,.72);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e8eef7;padding:16px}" +
      "#gpuw .b{max-width:560px;width:100%;background:#0b1d33;border:1px solid #5aa9ff;border-radius:14px;padding:22px 24px;box-shadow:0 10px 40px rgba(0,0,0,.5)}" +
      "#gpuw h2{margin:0 0 10px;font-size:19px;font-weight:600;color:#fff}#gpuw p{margin:8px 0}#gpuw ol{margin:8px 0 8px 20px;padding:0}#gpuw li{margin:4px 0}" +
      "#gpuw code{background:rgba(255,255,255,.1);padding:2px 6px;border-radius:5px;font-size:13px;word-break:break-all}" +
      "#gpuw .r{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}#gpuw button{cursor:pointer;border:1px solid #5aa9ff;background:#123a66;color:#fff;border-radius:8px;padding:8px 14px;font:inherit}" +
      "#gpuw button.s{background:transparent;border-color:rgba(255,255,255,.35)}#gpuw .g{font-size:12.5px;color:#9fb3cc;margin-top:12px}";
    document.head.appendChild(s);
  }

  function show(html, onlyOnceKey) {
    css();
    var w = document.createElement("div"); w.id = "gpuw";
    w.innerHTML = '<div class="b">' + html + "</div>";
    document.body.appendChild(w);
    w.addEventListener("click", function (e) {
      var t = e.target;
      if (t.dataset.copy) {
        try { navigator.clipboard.writeText(t.dataset.copy); t.textContent = "Скопировано"; } catch (er) {}
      }
      if (t.dataset.close) { w.remove(); }
      if (t.dataset.never && onlyOnceKey) { store.set(onlyOnceKey, "1"); w.remove(); }
    });
  }

  function run() {
    var g = gpu(), b = browser(), soft = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(g.name);
    if (!g.ok || soft) {
      show(
        "<h2>Включите аппаратное ускорение</h2>" +
        "<p>Браузер рисует 3D без видеокарты" + (g.name ? " (<code>" + g.name.replace(/</g, "&lt;") + "</code>)" : "") + ", поэтому сцена курорта будет сильно тормозить или не запустится.</p>" +
        (mobile ? "<p>Откройте страницу в Chrome и проверьте, что в настройках браузера не отключена графика / WebGL.</p>" :
        "<ol><li>Откройте в новой вкладке адрес <code>" + b.url + "</code> (" + b.n + ").</li>" +
        "<li>" + b.path + " — включите.</li><li>Перезапустите браузер и откройте эту страницу снова.</li></ol>") +
        '<div class="r">' + (mobile ? "" : '<button data-copy="' + b.url + '">Скопировать адрес настроек</button>') +
        '<button class="s" data-close="1">Всё равно продолжить</button></div>' +
        '<div class="g">Видеокарта: ' + (g.name ? g.name.replace(/</g, "&lt;") : "WebGL недоступен") + "</div>");
      return;
    }
    // ускорение включено, но ноутбук рисует на встроенной Intel — подсказка про дискретную видеокарту
    if (!mobile && /intel/i.test(g.name) && !/arc/i.test(g.name) && !store.get("rajiz_gpu_hint")) {
      show(
        "<h2>Сцена может работать плавнее</h2>" +
        "<p>Браузер сейчас использует встроенную видеокарту Intel. Если в компьютере есть видеокарта NVIDIA или AMD, переключите браузер на неё:</p>" +
        "<ol><li>Пуск → Параметры → Система → Дисплей → <b>Графика</b>.</li>" +
        "<li>«Классическое приложение» → «Обзор» → <code>" + b.exe.replace(/</g, "&lt;") + "</code>.</li>" +
        "<li>Выберите браузер → «Параметры» → <b>«Высокая производительность»</b> → Сохранить.</li>" +
        "<li>Полностью закройте браузер и откройте страницу заново. Ноутбук лучше подключить к зарядке.</li></ol>" +
        '<div class="r"><button data-close="1">Понятно</button><button class="s" data-never="1">Больше не показывать</button></div>' +
        '<div class="g">Видеокарта: ' + g.name.replace(/</g, "&lt;") + "</div>", "rajiz_gpu_hint");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
