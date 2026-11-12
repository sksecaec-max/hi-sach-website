/* =========================================================================
   particles.js — Canvas particle system (one rAF, auto-stops when idle)
   Heavy visual moments (confetti, sparkles, water splash, rising bubbles) run
   on a single <canvas> so we never spawn thousands of DOM nodes. The loop
   sleeps the instant the last particle dies and is fully torn down on demand.

     var fx = Kido.Particles.attach(canvasEl);   // canvas is 1000×640
     fx.confetti(500, 200);
     fx.stop();                                   // called by Scene.teardown
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var COLORS = ["#6C4BD6", "#FFB020", "#FF6B8A", "#38C172", "#63C7FF", "#B4308E", "#FFC93C"];
  function reduced() { return document.documentElement.classList.contains("reduce-motion"); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function attach(canvas) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    var parts = [];
    var raf = 0, running = false;

    function ensure() { if (!running) { running = true; raf = requestAnimationFrame(loop); } }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += p.g;
        p.x += p.vx; p.y += p.vy;
        p.vx *= p.fr; p.rot += p.vr;
        p.life -= 1;
        var a = Math.max(0, Math.min(1, p.life / p.max));
        ctx.globalAlpha = a;
        if (p.kind === "confetti") {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        } else if (p.kind === "spark") {
          ctx.fillStyle = p.color; star(ctx, p.x, p.y, p.s, p.rot);
        } else { // round: drops + bubbles
          ctx.beginPath(); ctx.fillStyle = p.color;
          ctx.arc(p.x, p.y, p.s, 0, 6.2832); ctx.fill();
          if (p.ring) { ctx.globalAlpha = a * .6; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke(); }
        }
        if (p.life <= 0 || p.y > H + 40 || p.y < -60) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (parts.length) raf = requestAnimationFrame(loop);
      else running = false;
    }

    function star(c, x, y, r, rot) {
      c.save(); c.translate(x, y); c.rotate(rot); c.beginPath();
      for (var i = 0; i < 5; i++) {
        c.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
        c.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * r * .45, -Math.sin((54 + i * 72) * Math.PI / 180) * r * .45);
      }
      c.closePath(); c.fill(); c.restore();
    }

    function push(n, make) {
      if (reduced()) n = Math.ceil(n / 4);
      for (var i = 0; i < n; i++) parts.push(make());
      ensure();
    }

    var api = {
      confetti: function (x, y, opts) {
        opts = opts || {}; var n = opts.count || 60;
        push(n, function () {
          var ang = rnd(0, 6.2832), sp = rnd(3, 11);
          return { kind: "confetti", x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rnd(2, 7),
            g: 0.22, fr: 0.99, s: rnd(8, 15), color: opts.color || COLORS[(Math.random() * COLORS.length) | 0],
            rot: rnd(0, 6.28), vr: rnd(-0.3, 0.3), life: rnd(60, 100), max: 100 };
        });
      },
      sparkle: function (x, y, opts) {
        opts = opts || {}; var n = opts.count || 14;
        push(n, function () {
          return { kind: "spark", x: x + rnd(-30, 30), y: y + rnd(-30, 30), vx: rnd(-1.4, 1.4), vy: rnd(-2.4, -0.4),
            g: 0.04, fr: 0.98, s: rnd(6, 13), color: opts.color || "#FFC93C", rot: rnd(0, 6.28), vr: rnd(-0.2, 0.2),
            life: rnd(36, 66), max: 66 };
        });
      },
      splash: function (x, y, opts) {
        opts = opts || {}; var n = opts.count || 22;
        push(n, function () {
          return { kind: "round", x: x, y: y, vx: rnd(-4, 4), vy: rnd(-9, -3), g: 0.5, fr: 0.99,
            s: rnd(3, 7), color: opts.color || "#8AD3FF", ring: true, life: rnd(40, 70), max: 70 };
        });
      },
      bubbles: function (x, y, opts) {
        opts = opts || {}; var n = opts.count || 16;
        push(n, function () {
          return { kind: "round", x: x + rnd(-40, 40), y: y, vx: rnd(-0.6, 0.6), vy: rnd(-2.6, -1), g: -0.01, fr: 1,
            s: rnd(4, 12), color: "rgba(255,255,255,.85)", ring: true, life: rnd(50, 90), max: 90 };
        });
      },
      stop: function () {
        parts.length = 0; running = false;
        if (raf) cancelAnimationFrame(raf);
        ctx.clearRect(0, 0, W, H);
      }
    };
    return api;
  }

  Kido.Particles = { attach: attach };
})(window);
