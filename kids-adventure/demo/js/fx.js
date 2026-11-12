/* =========================================================================
   fx.js — Visual feedback: confetti, sparkles, toasts, shakes
   Pure DOM particles so it works with zero image assets. All effects no-op
   when the parent enables "Reduce motion".
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var COLORS = ["#6C4BD6", "#FFB020", "#FF6B8A", "#38C172", "#63C7FF", "#B4308E"];

  function reduced() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function layer() { return document.getElementById("fx"); }

  Kido.fx = {
    /** Burst of confetti falling from the top. */
    confetti: function (count) {
      if (reduced()) return;
      var l = layer(); if (!l) return;
      count = count || 70;
      for (var i = 0; i < count; i++) {
        var c = document.createElement("i");
        c.className = "confetti";
        c.style.left = Math.random() * 100 + "vw";
        c.style.background = COLORS[i % COLORS.length];
        c.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
        c.style.animationDelay = (Math.random() * 0.4) + "s";
        c.style.transform = "rotate(" + (Math.random() * 360) + "deg)";
        if (Math.random() > 0.6) c.style.borderRadius = "50%";
        l.appendChild(c);
        (function (el) { setTimeout(function () { el.remove(); }, 3200); })(c);
      }
    },

    /** A few sparkles bursting from a point (or an element's center). */
    sparkleAt: function (x, y) {
      if (reduced()) return;
      var l = layer(); if (!l) return;
      var marks = ["✨", "⭐", "🌟", "💫"];
      for (var i = 0; i < 6; i++) {
        var s = document.createElement("span");
        s.className = "sparkle";
        s.textContent = marks[i % marks.length];
        var ang = (Math.PI * 2 * i) / 6;
        var d = 30 + Math.random() * 30;
        s.style.left = x + "px"; s.style.top = y + "px";
        s.style.setProperty("transform-origin", "center");
        s.style.marginLeft = Math.cos(ang) * d + "px";
        s.style.marginTop = Math.sin(ang) * d + "px";
        l.appendChild(s);
        (function (el) { setTimeout(function () { el.remove(); }, 900); })(s);
      }
    },
    sparkleEl: function (el) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      this.sparkleAt(r.left + r.width / 2, r.top + r.height / 2);
    },

    /** Small transient message pill (also announced to screen readers). */
    toast: function (msg, kind) {
      var l = document.getElementById("toast"); if (!l) return;
      var t = document.createElement("div");
      t.className = "toast" + (kind ? " toast--" + kind : "");
      t.textContent = msg;
      l.appendChild(t);
      setTimeout(function () { t.remove(); }, 2000);
    },

    /** Brief shake on an element for a gentle "try again". */
    shake: function (el) {
      if (!el || reduced()) return;
      el.classList.remove("anim-shake");
      void el.offsetWidth;              // reflow to restart animation
      el.classList.add("anim-shake");
    }
  };
})(window);
