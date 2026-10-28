// Свой скрипт сайта: анимации появления, мобильное меню, лайтбокс.
(function () {
  "use strict";
  window.siteReady = true;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Анимация при загрузке ----------
  // data-appear="сдвиг|длительность|задержка|кривая"; стартовый вид задан в style.
  function runAppear() {
    var items = document.querySelectorAll("[data-appear]");
    items.forEach(function (el) {
      var parts = (el.getAttribute("data-appear") || "").split("|");
      var duration = parseFloat(parts[1]) || 0.6;
      var delay = parseFloat(parts[2]) || 0;
      var ease = parts[3] || "ease-out";
      if (reduceMotion) {
        el.style.opacity = "1";
        el.style.transform = "none";
        return;
      }
      el.style.transition =
        "opacity " + duration + "s " + ease + " " + delay + "s, " +
        "transform " + duration + "s " + ease + " " + delay + "s";
    });
    // Ждём кадр, чтобы браузер запомнил стартовое состояние.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      });
    });
  }

  // ---------- Появление при прокрутке ----------
  function runReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
  }

  // ---------- Мобильное меню ----------
  var MENU_ICON = "#2728942239";
  var CLOSE_ICON = "#2727368927";

  function setupMenu() {
    var desktopLinks = document.querySelector(".site-y4q7z5");
    document.querySelectorAll('[data-site-name="Header_Mobile"]').forEach(function (header) {
      var button = header.querySelector(".site-hxk6a0");
      if (!button) return;
      var icon = button.querySelector("svg");
      var links = null;
      // На планшете шапка растянута на высоту контейнера, и открытое меню не помещается.
      var fixedHeight = header.style.height;
      button.setAttribute("role", "button");
      button.setAttribute("aria-label", "Меню");
      button.setAttribute("aria-expanded", "false");

      function setOpen(open) {
        header.classList.toggle("site-v-88a224", !open);
        header.classList.toggle("site-v-ng3oqs", open);
        header.setAttribute("data-site-name", open ? "Header_Mobile_opened" : "Header_Mobile");
        header.style.borderBottomLeftRadius = open ? "16px" : "0px";
        header.style.borderBottomRightRadius = open ? "16px" : "0px";
        header.style.boxShadow = open ? "rgba(0, 0, 0, 0.1) 0px 2px 9px 0px" : "none";
        header.style.height = open ? "" : fixedHeight;
        button.setAttribute("aria-expanded", String(open));
        if (icon) {
          icon.classList.toggle("site-xv9gG", !open);
          icon.classList.toggle("site-qW00S", open);
          icon.querySelector("use").setAttribute("href", open ? CLOSE_ICON : MENU_ICON);
        }
        if (open && !links && desktopLinks) {
          links = desktopLinks.cloneNode(true);
          links.querySelectorAll("a").forEach(function (a) {
            a.addEventListener("click", function () {
              setOpen(false);
            });
          });
          header.appendChild(links);
        } else if (!open && links) {
          links.remove();
          links = null;
        }
      }

      function toggle() {
        setOpen(button.getAttribute("aria-expanded") !== "true");
      }
      button.addEventListener("click", toggle);
      button.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && button.getAttribute("aria-expanded") === "true") setOpen(false);
      });
    });
  }

  // ---------- Лайтбокс ----------
  var ARROW_LEFT =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  var ARROW_RIGHT =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  var CROSS =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l16 16M20 4L4 20"/></svg>';

  function isShown(el) {
    return el.getClientRects().length > 0;
  }

  function setupLightbox() {
    var box, img, counter, prevBtn, nextBtn, closeBtn;
    var list = [];
    var index = 0;
    var lastFocus = null;
    var touchX = null;

    function build() {
      box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-label", "Просмотр изображения");
      box.innerHTML =
        '<img class="lightbox__img" alt="">' +
        '<div class="lightbox__counter"></div>' +
        '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Предыдущее">' + ARROW_LEFT + "</button>" +
        '<button type="button" class="lightbox__btn lightbox__next" aria-label="Следующее">' + ARROW_RIGHT + "</button>" +
        '<button type="button" class="lightbox__btn lightbox__close" aria-label="Закрыть">' + CROSS + "</button>";
      img = box.querySelector(".lightbox__img");
      counter = box.querySelector(".lightbox__counter");
      prevBtn = box.querySelector(".lightbox__prev");
      nextBtn = box.querySelector(".lightbox__next");
      closeBtn = box.querySelector(".lightbox__close");

      prevBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        show(index - 1);
      });
      nextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        show(index + 1);
      });
      closeBtn.addEventListener("click", close);
      box.addEventListener("click", function (e) {
        if (e.target === box) close();
      });
      img.addEventListener("click", function (e) {
        e.stopPropagation();
        if (list.length > 1) show(index + 1);
      });
      box.addEventListener("touchstart", function (e) {
        touchX = e.touches[0].clientX;
      }, { passive: true });
      box.addEventListener("touchend", function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      });
      document.body.appendChild(box);
    }

    function show(i) {
      var n = list.length;
      index = ((i % n) + n) % n;
      img.src = list[index].getAttribute("href");
      var alt = list[index].querySelector("img");
      img.alt = alt ? alt.alt : "";
      counter.textContent = index + 1 + " / " + n;
      var many = n > 1;
      prevBtn.hidden = !many;
      nextBtn.hidden = !many;
      counter.hidden = !many;
    }

    function open(link) {
      list = Array.prototype.filter.call(document.querySelectorAll("a[data-lightbox]"), isShown);
      if (!box) build();
      lastFocus = document.activeElement;
      show(Math.max(0, list.indexOf(link)));
      box.hidden = false;
      document.documentElement.style.overflow = "hidden";
      requestAnimationFrame(function () {
        box.classList.add("is-open");
      });
      closeBtn.focus();
      document.addEventListener("keydown", onKey);
    }

    function close() {
      box.classList.remove("is-open");
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      setTimeout(function () {
        box.hidden = true;
        img.removeAttribute("src");
      }, 300);
      if (lastFocus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
      else if (e.key === "Tab") {
        // Держим фокус внутри окна.
        var f = [prevBtn, nextBtn, closeBtn].filter(function (b) {
          return !b.hidden;
        });
        var pos = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(pos + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    }

    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("a[data-lightbox]");
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      open(link);
    });
  }


  // ---------- Сдвиг за мышью (картинки в заголовке главной) ----------
  // data-mouse="8" — на сколько пикселей сдвигать (минус — в обратную сторону).
  // Пружина как во Framer: жёсткость 120, затухание 20.
  function setupMouseParallax() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-mouse]"));
    if (!items.length || reduceMotion) return;
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, last = 0, running = false;
    function frame(t) {
      var dt = Math.min(0.064, (t - last) / 1000 || 0.016);
      last = t;
      vx += (120 * (tx - x) - 20 * vx) * dt;
      vy += (120 * (ty - y) - 20 * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      items.forEach(function (el) {
        var k = parseFloat(el.getAttribute("data-mouse")) || 0;
        el.style.transform = "translateX(" + (x * k).toFixed(2) + "px) translateY(" + (y * k).toFixed(2) + "px)";
      });
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.001) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }
    }, { passive: true });
  }

  function init() {
    runAppear();
    runReveal();
    setupMenu();
    setupLightbox();
    setupMouseParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
