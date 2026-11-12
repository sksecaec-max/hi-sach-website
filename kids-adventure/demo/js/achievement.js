/* =========================================================================
   achievement.js — Change #23: the reusable Shareable Achievement card
   Kido.Achievement.present(card, { host })   show the card to the child; resolves on "Continue"
   Kido.Achievement.image(card)               → Promise<Blob> (a 1080×1350 PNG drawn on a canvas)
   Kido.Achievement.share(card)               grown-up gate → share sheet (or save the picture)

   card = { kicker, title, items: [{ icon: "star"|"trophy"|"medal"|"heart", text }], quote, art }
     art: a Kido drawing key such as "chest:open" (Kido.PuzzleEngine.art), drawn into the picture.
   Made for stories now; puzzles, discoveries and certificates can pass their own card.

   Safety: the card never contains the child's name or anything personal. Sharing is only
   offered behind the grown-up gate, never automatic, never to contacts, no links or codes;
   Kido only hands the picture to the device's own share sheet.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var W = 1080, H = 1350;
  var FONT = '"Baloo 2", "Fredoka", "Trebuchet MS", sans-serif';

  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  /** An SVG string as a drawable image (xmlns added; no external resources). */
  function svgImage(svg) {
    var s = svg.replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/class="[^"]*"/, "");
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    });
  }
  function artSvg(key) {
    var html = key && Kido.PuzzleEngine && Kido.PuzzleEngine.art ? Kido.PuzzleEngine.art(key) : "";
    return /^<svg/.test(html) ? html.replace(/<svg ([^>]*)>/, function (m, a) { return "<svg " + a.replace(/class="[^"]*"/, "") + ' width="400" height="400">'; }) : "";
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(["700 80px \"Baloo 2\"", "600 40px \"Baloo 2\""].map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(function () { return null; });
  }
  function round(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function star(c, x, y, r, fill) {
    c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = fill; c.fill();
  }
  function icon(c, kind, x, y) {
    c.save();
    c.fillStyle = "#FFF4D6"; c.beginPath(); c.arc(x, y, 34, 0, Math.PI * 2); c.fill();
    if (kind === "trophy") {
      c.fillStyle = "#F2B82C";
      c.beginPath(); c.moveTo(x - 18, y - 20); c.lineTo(x + 18, y - 20); c.quadraticCurveTo(x + 18, y + 6, x, y + 8); c.quadraticCurveTo(x - 18, y + 6, x - 18, y - 20); c.fill();
      c.fillRect(x - 4, y + 6, 8, 10); c.fillRect(x - 13, y + 15, 26, 6);
      c.strokeStyle = "#F2B82C"; c.lineWidth = 4;
      c.beginPath(); c.arc(x - 18, y - 10, 8, Math.PI * .5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(x + 18, y - 10, 8, -Math.PI * .5, Math.PI * .5); c.stroke();
    } else if (kind === "medal") {
      c.fillStyle = "#6C4BD6"; c.fillRect(x - 12, y - 26, 10, 20); c.fillStyle = "#FF6B8A"; c.fillRect(x + 2, y - 26, 10, 20);
      c.fillStyle = "#F2B82C"; c.beginPath(); c.arc(x, y + 6, 15, 0, Math.PI * 2); c.fill();
    } else if (kind === "heart") {
      c.fillStyle = "#FF6B8A"; c.beginPath(); c.moveTo(x, y + 18);
      c.bezierCurveTo(x - 30, y - 2, x - 16, y - 28, x, y - 12); c.bezierCurveTo(x + 16, y - 28, x + 30, y - 2, x, y + 18); c.fill();
    } else star(c, x, y + 1, 24, "#F2B82C");
    c.restore();
  }
  function fitText(c, text, max, size, weight) {
    var s = size;
    do { c.font = weight + " " + s + "px " + FONT; s -= 2; } while (c.measureText(text).width > max && s > 20);
  }

  /** Draw the card and return it as a PNG Blob. */
  function image(card) {
    return Promise.all([fontsReady(), svgImage(artSvg(card.art) || '<svg viewBox="0 0 10 10"></svg>'),
      svgImage(Kido.icons && Kido.icons.momo ? Kido.icons.momo() : '<svg viewBox="0 0 10 10"></svg>')]).then(function (r) {
      var art = r[1], momo = r[2];
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var c = cv.getContext("2d");
      // background: night sky to treasure gold, rays and glow behind the picture
      var bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#2B1F6B"); bg.addColorStop(.45, "#5B3CC4"); bg.addColorStop(1, "#F2A93B");
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, 380); c.globalAlpha = .16; c.fillStyle = "#FFF3B0";
      for (var i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, -900); c.lineTo(26, 0); c.fill(); }
      c.restore();
      var glow = c.createRadialGradient(W / 2, 380, 20, W / 2, 380, 330);
      glow.addColorStop(0, "rgba(255,246,200,.95)"); glow.addColorStop(.5, "rgba(255,216,107,.45)"); glow.addColorStop(1, "rgba(255,216,107,0)");
      c.fillStyle = glow; c.fillRect(0, 0, W, 760);
      var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      var cols = ["#FF6B8A", "#FFD24D", "#63C7FF", "#38C172", "#FFFFFF", "#B79CFF"];
      for (i = 0; i < 46; i++) {
        var x = rnd() * W, y = rnd() * 640, s = 6 + rnd() * 10;
        if (i % 3) { c.save(); c.translate(x, y); c.rotate(rnd() * 3); c.fillStyle = cols[i % cols.length]; c.fillRect(-s / 2, -s / 4, s, s / 2); c.restore(); }
        else star(c, x, y, s * .7, "rgba(255,255,255,.85)");
      }
      // kicker and picture
      c.textAlign = "center"; c.textBaseline = "alphabetic";
      fitText(c, String(card.kicker || "Well done!").toUpperCase(), 900, 86, 700);
      c.lineJoin = "round"; c.lineWidth = 14; c.strokeStyle = "#2B1F6B"; c.strokeText(String(card.kicker || "Well done!").toUpperCase(), W / 2, 150);
      c.fillStyle = "#FFE27A"; c.fillText(String(card.kicker || "Well done!").toUpperCase(), W / 2, 150);
      if (art) c.drawImage(art, W / 2 - 200, 170, 400, 400);
      // the card
      c.save(); c.shadowColor = "rgba(30,16,80,.35)"; c.shadowBlur = 40; c.shadowOffsetY = 14;
      round(c, 90, 600, W - 180, 640, 48); c.fillStyle = "#FFFDF8"; c.fill(); c.restore();
      round(c, 90, 600, W - 180, 640, 48); c.lineWidth = 6; c.strokeStyle = "#FFD86B"; c.stroke();
      c.fillStyle = "#2B2151"; fitText(c, card.title || "", 800, 60, 700); c.fillText(card.title || "", W / 2, 700);
      c.strokeStyle = "#EDE6FF"; c.lineWidth = 3; c.beginPath(); c.moveTo(200, 738); c.lineTo(W - 200, 738); c.stroke();
      (card.items || []).slice(0, 3).forEach(function (it, k) {
        var y0 = 810 + k * 100;
        c.textAlign = "left"; icon(c, it.icon, 250, y0 - 14);
        c.fillStyle = "#4E32A8"; fitText(c, it.text, 560, 48, 700); c.fillText(it.text, 306, y0);
      });
      c.textAlign = "center";
      if (card.quote) { c.fillStyle = "#B4308E"; fitText(c, "“" + card.quote + "”", 820, 50, 600); c.fillText("“" + card.quote + "”", W / 2, 1110); }
      // footer: Momo + "Made with Little Explorers", centred as one group
      var made = "Made with Little Explorers";
      c.fillStyle = "#FFFFFF"; c.font = "700 40px " + FONT; c.textAlign = "left";
      var mx = W / 2 - (66 + c.measureText(made).width) / 2;
      if (momo) c.drawImage(momo, mx, 1262, 56, 56);
      c.fillText(made, mx + 66, 1304);
      return new Promise(function (resolve) { cv.toBlob(function (b) { resolve(b); }, "image/png"); });
    });
  }

  function altText(card) {
    var parts = [card.kicker, card.title].concat((card.items || []).map(function (i) { return i.text; }), card.quote ? ['"' + card.quote + '"'] : [], ["Made with Little Explorers"]);
    return parts.filter(Boolean).map(function (p) { return /[.!?"]$/.test(p) ? p : p + "."; }).join(" ");
  }

  /* ---- grown-ups only: the gate, then the share sheet or "save the picture" ---- */
  function fileFrom(blob) {
    try { return new File([blob], "kido-achievement.png", { type: "image/png" }); } catch (e) { return null; }
  }
  function canShareFile(file) {
    return !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
  }
  function save(blob) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "kido-achievement.png"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function sharePanel(card, blob) {
    var file = fileFrom(blob), native = canShareFile(file), url = URL.createObjectURL(blob);
    var msg = U.el("p", { class: "ach-share__msg", role: "status", "aria-live": "polite" });
    var preview = U.el("img", { class: "ach-share__img", src: url, alt: altText(card) });
    var shareBtn = U.el("button", { class: "btn btn--block", type: "button", text: "Share picture" });
    var saveBtn = U.el("button", { class: "btn btn--ghost btn--block", type: "button", text: "Save picture" });
    var close = U.el("button", { class: "btn btn--ghost btn--block", type: "button", text: "Close" });
    var panel = U.el("div", { class: "modal ach-share", role: "dialog", "aria-modal": "true", "aria-labelledby": "ach-share-title" }, [
      U.el("h2", { class: "ach-share__title", id: "ach-share-title", text: "Share this achievement" }),
      preview,
      U.el("p", { class: "ach-share__note", text: "The picture shows no name and nothing personal. You choose where it goes." }),
      native ? shareBtn : U.el("p", { class: "ach-share__note", text: "Sharing isn't available here. Save the picture, then share it from your photos." }),
      saveBtn, msg, close
    ]);
    shareBtn.addEventListener("click", function () {
      navigator.share({ files: [file], title: card.title || "Little Explorers" }).then(function () { msg.textContent = "Shared."; })
        .catch(function (e) { msg.textContent = e && e.name === "AbortError" ? "" : "Couldn't share. You can save the picture instead."; });
    });
    saveBtn.addEventListener("click", function () { save(blob); msg.textContent = "Picture saved."; });
    close.addEventListener("click", function () { URL.revokeObjectURL(url); Kido.parent.close(); });
    Kido.parent.open(panel);
    setTimeout(function () { (native ? shareBtn : saveBtn).focus(); }, 60);
  }
  function share(card, blob) {
    var made = blob ? Promise.resolve(blob) : image(card);
    if (!Kido.parent || !Kido.parent.openGate) return made.then(save);
    Kido.parent.openGate({ help: "A grown-up can share this picture. Answer the question to continue.",
      onPass: function () { made.then(function (b) { if (b) sharePanel(card, b); }); } });
  }

  /** Show the card to the child. Continue resolves the promise; Share is for grown-ups. */
  function present(card, opts) {
    opts = opts || {};
    var host = opts.host || document.getElementById("screen");
    var wrap = U.el("div", { class: "ach" + (calm() ? " is-calm" : ""), role: "dialog", "aria-label": card.kicker || "Achievement" });
    var frame = U.el("div", { class: "ach__frame" });
    var img = U.el("img", { class: "ach__img", alt: altText(card) });
    frame.appendChild(img);
    var go = U.el("button", { class: "btn btn--lg ach__go", type: "button", html: "<span>Continue</span>" + (Kido.icons ? Kido.icons.play() : "") });
    var shareBtn = U.el("button", { class: "btn btn--ghost ach__share", type: "button", "aria-label": "Share (for grown-ups)",
      html: (Kido.icons && Kido.icons.lock ? Kido.icons.lock() : "") + "<span>Share</span>" });
    wrap.appendChild(frame);
    wrap.appendChild(U.el("div", { class: "ach__actions" }, [go, shareBtn]));
    host.appendChild(wrap);
    var blob = null;
    var ready = image(card).then(function (b) { blob = b; if (b) { img.src = URL.createObjectURL(b); } wrap.classList.add("is-ready"); return b; });
    shareBtn.addEventListener("click", function () { if (Kido.audio) Kido.audio.playTapSound(); ready.then(function () { share(card, blob); }); });
    if (Kido.audio && Kido.audio.speak) Kido.audio.speak([card.kicker, card.quote].filter(Boolean).join(" "));
    return new Promise(function (resolve) {
      go.addEventListener("click", function () {
        if (Kido.audio) Kido.audio.playTapSound();
        if (img.src) URL.revokeObjectURL(img.src);
        wrap.remove();
        resolve();
      });
      setTimeout(function () { go.focus({ preventScroll: true }); }, 80);
    });
  }

  Kido.Achievement = { present: present, image: image, share: share, altText: altText };
})(window);
