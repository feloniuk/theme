'use strict';
var initSuccess = !1;
const lggTooltip = {
  cachedTooltips: {},
  darkMode: 1,
  recolorLinks: !0,
  renameLinks: !1,
  showIcon: !0,
  showDescription: !0,
  showLoreExerpt: !0,
  showPerks: !0,
  showObtainedFrom: !0,
  showTriumphObjectives: !0,
  lang: "en",
  defaultValues: !0,
  hardFail: !1
};
if ("undefined" == typeof window.lggTT) console.log("[light.gg tooltips] Script loaded successfully, but you appear to be missing the settings object. Visit https://www.light.gg/tools/tooltips/ for information on how to properly configure this tool. Using default values for now...");
else {
  var userSettings = window.lggTT;
  lggTooltip.darkMode = void 0 === userSettings.darkMode ? lggTooltip.darkMode : userSettings.darkMode, lggTooltip.recolorLinks = void 0 === userSettings.recolorLinks ? lggTooltip.recolorLinks : userSettings.recolorLinks, lggTooltip.renameLinks = void 0 === userSettings.renameLinks ? lggTooltip.renameLinks : userSettings.renameLinks, lggTooltip.showIcon = void 0 === userSettings.showIcon ? lggTooltip.showIcon : userSettings.showIcon, lggTooltip.showDescription = void 0 === userSettings.showDescription ? lggTooltip.showDescription : userSettings.showDescription, lggTooltip.showLoreExerpt = void 0 === userSettings.showLoreExerpt ? lggTooltip.showLoreExerpt : userSettings.showLoreExerpt, lggTooltip.showPerks = void 0 === userSettings.showPerks ? lggTooltip.showPerks : userSettings.showPerks, lggTooltip.showObtainedFrom = void 0 === userSettings.showObtainedFrom ? lggTooltip.showObtainedFrom : userSettings.showObtainedFrom, lggTooltip.showTriumphObjectives = void 0 === userSettings.showTriumphObjectives ? lggTooltip.showTriumphObjectives : userSettings.showTriumphObjectives, lggTooltip.lang = void 0 === userSettings.lang ? lggTooltip.lang : userSettings.lang
}
var hoverTimeout = null;
const matches = function(c, a) {
  return (c.matches || c.matchesSelector || c.msMatchesSelector || c.mozMatchesSelector || c.webkitMatchesSelector || c.oMatchesSelector).call(c, a)
};
String.prototype.endsWith || (String.prototype.endsWith = function(c, a) {
  return (void 0 === a || a > this.length) && (a = this.length), this.substring(a - c.length, a) === c
}), String.prototype.startsWith || Object.defineProperty(String.prototype, "startsWith", {
  value: function(d, a) {
    var b = 0 < a ? 0 | a : 0;
    return this.substring(b, b + d.length) === d
  }
}), document.addEventListener("DOMContentLoaded", function() {
  lgg.init()
}), document.addEventListener("mouseover", function(c) {
  if (matches(document.body, ".disable-tooltips") || lggTooltip.hardFail) return;
  let a;
  for (a = c.target; a && a != this; a = a.parentNode)
    if (lgg.isHover(a)) {
      clearTimeout(hoverTimeout), hoverTimeout = setTimeout(function() {
        lgg.loadTooltip(a, c)
      }, 100);
      break
    }
}, !1), document.addEventListener("mouseout", function(d) {
  var a = document.querySelector("body");
  if (!matches(a, ".disable-tooltips"))
    for (var b = d.target; b && b != this; b = b.parentNode)
      if (lgg.isHover(b)) {
        lgg.cancel();
        break
      }
}, !1), document.addEventListener("click", function(d) {
  for (var a = d.target; a && a != this; a = a.parentNode)
    if (lgg.isHover(a)) {
      var e = lgg.windowWidth();
      800 >= e && !matches(a, ".mobile-click") && (document.querySelectorAll("a.lgg").forEach(function(b) {
        b.classList.remove("mobile-click")
      }), a.classList.add("mobile-click"), d.preventDefault(), d.stopPropagation());
      break
    }
}, !1), window.onscroll = function() {
  lgg.cancel()
};
var lggTTL = null;
const lgg = {
  settings: {},
  hostnameRegex: /^https?:\/\/([a-zA-Z0-9]+\.)?light\.gg/i,
  urlRegex: /^(https?:)?\/\/(www\.)?light\.gg\/db\/.+?$/i,
  localURLRegex: /^\/db\/.+?$/i,
  tierMap: ["", "lgg-text-currency", "lgg-text-basic", "lgg-text-common", "lgg-text-rare", "lgg-text-legendary", "lgg-text-exotic"],
  initComplete: !1,
  init: function() {
    if (!this.initComplete) {
      var b = document.createElement("link");
      b.setAttribute("href", "https://www.light.gg/content/tooltips.css?v=" + new Date().getTime()), b.setAttribute("rel", "stylesheet"), document.body.appendChild(b), b = document.createElement("link"), b.setAttribute("href", "https://fonts.googleapis.com/css?family=Roboto+Condensed:400,400i,700,700i"), b.setAttribute("rel", "stylesheet"), document.body.appendChild(b), lggTooltip.recolorLinks && this.recolorLinks(), lggTooltip.renameLinks && this.renameLinks()
    }
  },
  isHover: function(d) {
    var a = d.getAttribute("href");
    if (a || (a = d.getAttribute("data-lgg")), d.classList.contains("lgg-nohover")) return !1;
    var e = !1;
    return window.location.hostname.endsWith(".light.gg") && (e = !0), a && d.matches("a") && (this.urlRegex.test(a) || e && this.localURLRegex.test(a))
  },
  XHR: function(g, a, b, c, d) {
    var e = new XMLHttpRequest;
    return e.open(g, a, !0), e.onload = function() {
      200 <= this.status && 400 > this.status ? c && c(this.response) : d && d(this)
    }, e.onerror = function() {
      d && d(this)
    }, b ? ("POST" == g && e.setRequestHeader("Content-Type", "application/json; charset=UTF-8"), e.send(JSON.stringify(b))) : e.send(), e
  },
  loadTooltip: function(g) {
    g.target && "string" != typeof g.target && (g = g.target);
    var h = g.getAttribute("href");
    g.removeAttribute("title"), g.removeAttribute("data-balloon");
    var b = this.getTooltip();
    if (b.getAttribute("data-href") == h || lggTooltip.cachedTooltips[h]) return this.populateTooltip(lggTooltip.cachedTooltips[h], h), void this.showTooltip(g);
    var c = h,
      i = 0 > c.indexOf("?") ? "?" : "&";
    c = c + i + "tooltip=1", 0 > c.indexOf("lang=") && "en" != lggTooltip.lang && (c += "&lang=" + lggTooltip.lang), c = c.replace(this.hostnameRegex, "https://www.light.gg");
    var e = this;
    lggTTL = this.XHR("GET", c, null, function(a) {
      lggTooltip.cachedTooltips[h] = a, e.populateTooltip(a, h), e.showTooltip(g, b)
    }, function(b) {
      console.log(`[light.gg tooltips] Error loading for link w/ href '${h}': (${b.status}) ${b.responseText}`)
    })
  },
  getTooltip: function() {
    var b = document.querySelector("#lgg-tooltip");
    return b || (b = document.createElement("div"), b.setAttribute("id", "lgg-tooltip"), document.body.prepend(b), lggTooltip.darkMode && b.classList.add("dark")), b
  },
  populateTooltip: function(j, a) {
    if (j) {
      var b = this.getTooltip();
      const f = b.getAttribute("data-href");
      if (f !== a) {
        b.innerHTML = j, b.setAttribute("data-href", a);
        var c = b.querySelectorAll("div.kill-count-display");
        if (0 < c.length && c[0].parentNode.removeChild(c[0]), !lggTooltip.showIcon) {
          var d = b.querySelectorAll("img.item-icon");
          0 < d.length && d[0].parentNode.removeChild(d[0])
        }
        if (!lggTooltip.showDescription) {
          var e = b.querySelectorAll("div.hover-item-description.actual-description");
          0 < e.length && e[0].parentNode.removeChild(e[0])
        }
        if (!lggTooltip.showLoreExerpt) {
          var e = b.querySelectorAll("div.hover-item-description.lore-exerpt");
          0 < e.length && e[0].parentNode.removeChild(e[0])
        }
        if (!lggTooltip.showPerks) {
          var k = b.querySelectorAll("div.hover-item-perk");
          0 < k.length && k.forEach(function(b) {
            b.parentNode.removeChild(b)
          })
        }
        if (!lggTooltip.showObtainedFrom) {
          var g = b.querySelectorAll("div.hover-item-description.collectible-hint");
          0 < g.length && g[0].parentNode.removeChild(g[0])
        }
        if (!lggTooltip.showTriumphObjectives) {
          var h = b.querySelectorAll("div.hover-item-description.objectives");
          0 < h.length && h[0].parentNode.removeChild(h[0])
        }
        lggTooltip.cachedTooltips[a] || (lggTooltip.cachedTooltips[a] = b.innerHTML)
      }
    }
  },
  windowWidth: function() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
  },
  showTooltip: function(o, a) {
    if (o) {
      a || (a = this.getTooltip());
      var p = o.getBoundingClientRect(),
        c = {
          top: p.top + document.documentElement.scrollTop,
          left: p.left + document.documentElement.scrollLeft
        },
        d = p.width,
        e = p.width;
      a.style.display = "block";
      var f = a.getBoundingClientRect(),
        g = f.height / 2,
        h = f.width,
        i = c.left + d + 5,
        q = c.top + e / 2 - g,
        r = this.windowWidth(),
        l = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      if (400 >= r) i = 10, a.style.left = "15px", a.style.bottom = "10px", a.style.position = "fixed";
      else {
        i + h > r ? (i = c.left - 10 - h, q = c.top - e / 2, lggTooltip.showIcon && (a.querySelectorAll("img.item-icon")[0].style.right = "0px")) : lggTooltip.showIcon && (a.querySelectorAll("img.item-icon")[0].style.right = null), 0 > i && (i = c.left - r / 2, 0 > i && (i = (r - d) / 2));
        var m = q - document.documentElement.scrollTop;
        lggTooltip.showIcon && 90 > m ? q = document.documentElement.scrollTop + 90 : 0 > m && (q = document.documentElement.scrollTop + 10), a.style.left = i + "px", p.bottom + f.height > l ? (a.style.top = null, a.style.bottom = "10px") : (a.style.bottom = null, a.style.top = q + "px")
      }
    }
  },
  renameLinks: function() {
    var d = this,
      b = Array.prototype.slice.call(document.links).filter(function(b) {
        var c = b.getAttribute("href");
        return !(c.startsWith("javascript") || c.startsWith("#")) && d.isHover(b)
      });
    b.forEach(function(b) {
      b.classList.add("lgg")
    }), b = b.map(function(a) {
      return a.getAttribute("href")
    }), console.log(`[light.gg tooltips] Trying to rename ${b.length} links...`), 50 < b.length && (console.warn(`[light.gg tooltips] There are more than 50 light.gg links detected on this page. Renaming is limited to 50 distinct links per request.`), b = b.slice(0, 50)), b = Array.from(new Set(b)), this.XHR("POST", "https://www.light.gg/tools/tooltips/rename", {
      hrefs: b,
      lang: lggTooltip.lang
    }, function(d) {
      if (d) try {
        var a = JSON.parse(d),
          e = 0;
        a.forEach(function(c) {
          var a = document.querySelectorAll(`a[href='${c.href}']`);
          a && a.forEach(function(a) {
            e++, a.textContent = c.text
          })
        }), console.log(`[light.gg tooltips] Successfuly renamed ${e} links.`)
      } catch (b) {
        console.log(`[light.gg tooltips] Failed to rename links: ${b}`)
      } else console.log(`[light.gg tooltips] Failed to rename links: (${xhr.status}) ${xhr.responseText}`)
    }, function(b) {
      console.log(`[light.gg tooltips] Failed to rename links: (${b.status}) ${b.responseText}`)
    })
  },
  recolorLinks: function() {
    var e = this,
      b = Array.prototype.slice.call(document.links).filter(function(b) {
        var c = b.getAttribute("href");
        return !(c.startsWith("javascript") || c.startsWith("#")) && e.isHover(b)
      });
    b.forEach(function(b) {
      b.classList.add("lgg")
    }), b = b.map(function(a) {
      return a.getAttribute("href")
    }), console.log(`[light.gg tooltips] Trying to recolor ${b.length} links...`), 50 < b.length && (console.warn(`[light.gg tooltips] There are more than 50 light.gg links detected on this page. Recoloring is limited to 50 distinct links per request.`), b = b.slice(0, 50)), b = Array.from(new Set(b)), this.XHR("POST", "https://www.light.gg/tools/tooltips/recolor", {
      hrefs: b
    }, function(b) {
      if (b) try {
        var a = JSON.parse(b),
          f = 0;
        a.forEach(function(b) {
          var a = document.querySelectorAll(`a[href='${b.href}']`);
          a && a.forEach(function(a) {
            f++, a.classList.add(e.tierMap[b.tier])
          })
        }), console.log(`[light.gg tooltips] Successfuly recolored ${f} links.`)
      } catch (b) {
        console.log(`[light.gg tooltips] Failed to recolor links: ${b}`)
      } else console.log(`[light.gg tooltips] Failed to recolor links: (${xhr.status}) ${xhr.responseText}`)
    }, function(b) {
      console.log(`[light.gg tooltips] Failed to recolor links: (${b.status}) ${b.responseText}`)
    })
  },
  cancel: function() {
    clearTimeout(hoverTimeout), lggTTL && lggTTL.abort();
    var b = this.getTooltip();
    b.style.display = "none", document.querySelectorAll("a.lgg").forEach(function(b) {
      b.classList.remove("mobile-click")
    })
  }
};
Object.freeze(lgg), "loading" !== document.readyState && (lgg.init(), window.preloadTooltipByUrl = function(c, a) {
  if (!lggTooltip.cachedTooltips[c]) {
    const d = 0 > a.indexOf("?") ? "?" : "&";
    fetch(a + d + "tooltip=1").then(b => b.text()).then(a => {
      a = a.replace(/(src="(\/.+?)")/gmi, "src=\"https://www.light.gg$2\""), lggTooltip.cachedTooltips[c] = a
    })
  }
});
