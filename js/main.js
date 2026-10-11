/* Solenne Climate Studio — site behaviour (vanilla, no dependencies) */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: scrolled state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Active nav state ---------- */
  var page = document.body.getAttribute("data-page");
  if (page) {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      if (page.split(" ").indexOf(link.getAttribute("data-nav")) !== -1) link.setAttribute("aria-current", "page");
    });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    var label = toggle.querySelector(".menu-toggle__text");
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      if ("inert" in menu) menu.inert = !open;
      document.body.classList.toggle("menu-open", open);
      if (label) label.textContent = open ? "Close" : "Menu";
      if (open && header) menu.style.top = Math.max(0, header.getBoundingClientRect().bottom) + "px";
      if (open) {
        var first = menu.querySelector("a");
        if (first) first.focus();
      }
    };
    setOpen(false);
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var items = menu.querySelectorAll("a, button");
      var firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); toggle.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1180 && menu.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll(".reveal, .reveal-img, .energy, [data-count]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.hasAttribute("data-count")) countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var duration = 1600, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Work filter ---------- */
  var filter = document.querySelector("[data-filter]");
  if (filter) {
    var grid = document.querySelector(".work-grid");
    var cards = grid.querySelectorAll(".project-card");
    var count = document.querySelector("[data-filter-count]");
    var buttons = filter.querySelectorAll("button");

    var apply = function (cat, focusBtn) {
      var shown = 0;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.cat === cat)); });
      cards.forEach(function (card) {
        var match = cat === "all" || card.dataset.cat === cat;
        card.hidden = !match;
        card.classList.remove("is-entering", "reveal");
        card.classList.add("is-visible");
        if (match) {
          shown++;
          if (!reduceMotion) { void card.offsetWidth; card.classList.add("is-entering"); }
        }
      });
      grid.classList.toggle("is-filtered", cat !== "all");
      if (count) count.textContent = shown + (shown === 1 ? " project" : " projects");
      if (focusBtn && history.replaceState) {
        history.replaceState(null, "", cat === "all" ? location.pathname : "#" + cat);
      }
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () { apply(btn.dataset.cat, true); });
    });
    var initial = location.hash.replace("#", "");
    var valid = Array.prototype.some.call(buttons, function (b) { return b.dataset.cat === initial; });
    if (valid) apply(initial, false);
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var galleryItems = document.querySelectorAll("[data-lightbox]");
  if (lightbox && galleryItems.length && typeof lightbox.showModal === "function") {
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector(".lightbox__caption");
    var lbCount = lightbox.querySelector("[data-lb-count]");
    var current = 0;

    var show = function (i) {
      current = (i + galleryItems.length) % galleryItems.length;
      var item = galleryItems[current];
      lbImg.src = item.getAttribute("data-full");
      lbImg.alt = item.querySelector("img").alt;
      lbCap.textContent = item.getAttribute("data-caption") || "";
      lbCount.textContent = String(current + 1).padStart(2, "0") + " / " + String(galleryItems.length).padStart(2, "0");
    };

    galleryItems.forEach(function (item, i) {
      item.addEventListener("click", function () { show(i); lightbox.showModal(); });
    });
    lightbox.querySelector("[data-lb-close]").addEventListener("click", function () { lightbox.close(); });
    lightbox.querySelector("[data-lb-prev]").addEventListener("click", function () { show(current - 1); });
    lightbox.querySelector("[data-lb-next]").addEventListener("click", function () { show(current + 1); });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.classList.contains("lightbox__stage")) lightbox.close();
    });
    lightbox.addEventListener("close", function () {
      var trigger = galleryItems[current];
      if (trigger) trigger.focus();
    });
  }

  /* ---------- Audience switch (approach page) ---------- */
  document.querySelectorAll("[data-audience-switch]").forEach(function (sw) {
    var tabs = sw.querySelectorAll("[role='tab']");
    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      var who = tab.getAttribute("data-audience");
      document.querySelectorAll("[data-audience-panel]").forEach(function (p) {
        p.hidden = p.getAttribute("data-audience-panel") !== who;
      });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          var next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
          next.focus(); select(next);
        }
      });
    });
  });

  /* ---------- Multi-step inquiry form ---------- */
  var form = document.getElementById("inquiry");
  if (form) {
    var steps = form.querySelectorAll(".step");
    var progress = document.querySelectorAll(".progress li");
    var back = form.querySelector("[data-back]");
    var next = form.querySelector("[data-next]");
    var submit = form.querySelector("[data-submit]");
    var status = form.querySelector(".form-status");
    var success = document.getElementById("inquiry-success");
    var stepIndex = 0;

    var render = function () {
      steps.forEach(function (s, i) {
        var active = i === stepIndex;
        s.hidden = !active;
        if (active && !reduceMotion) { s.classList.remove("is-entering"); void s.offsetWidth; s.classList.add("is-entering"); }
      });
      progress.forEach(function (p, i) {
        p.classList.toggle("is-active", i === stepIndex);
        p.classList.toggle("is-done", i < stepIndex);
        if (i === stepIndex) p.setAttribute("aria-current", "step"); else p.removeAttribute("aria-current");
      });
      back.hidden = stepIndex === 0;
      next.hidden = stepIndex === steps.length - 1;
      submit.hidden = stepIndex !== steps.length - 1;
      status.textContent = "Step " + (stepIndex + 1) + " of " + steps.length;
    };

    var setError = function (container, msg) {
      container.classList.add("has-error");
      var err = container.querySelector(".error-msg");
      if (err && msg) err.textContent = msg;
      var input = container.querySelector("input, select, textarea");
      if (input) input.setAttribute("aria-invalid", "true");
    };
    var clearError = function (container) {
      container.classList.remove("has-error");
      container.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    };

    var validateStep = function (step) {
      var firstInvalid = null;
      step.querySelectorAll("[data-required-group]").forEach(function (group) {
        var name = group.getAttribute("data-required-group");
        var checked = group.querySelector("input[name='" + name + "']:checked");
        if (!checked) { setError(group); firstInvalid = firstInvalid || group.querySelector("input"); }
        else clearError(group);
      });
      step.querySelectorAll(".field").forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input || input.type === "checkbox") return;
        var value = input.value.trim();
        var msg = "";
        if (input.required && !value) msg = field.getAttribute("data-msg") || "This field is required.";
        else if (value && input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) msg = "Please enter a valid email address.";
        else if (value && input.type === "tel" && value.replace(/\D/g, "").length < 10) msg = "Please include a 10-digit phone number.";
        if (msg) { setError(field, msg); firstInvalid = firstInvalid || input; }
        else clearError(field);
      });
      step.querySelectorAll("[data-required-check]").forEach(function (wrap) {
        var box = wrap.querySelector("input");
        if (!box.checked) { setError(wrap); firstInvalid = firstInvalid || box; }
        else clearError(wrap);
      });
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    // Live-clear errors as the visitor corrects them
    form.addEventListener("change", function (e) {
      var group = e.target.closest(".has-error");
      if (group) clearError(group);
    });
    form.addEventListener("input", function (e) {
      var field = e.target.closest(".field.has-error");
      if (field) clearError(field);
    });

    // Tailor step 2 copy to the visitor type
    var roleCopy = {
      homeowner: "Tell us about your home and where it is in the process.",
      architect: "Tell us about the project and where it sits in your design phases.",
      builder: "Tell us about the project, schedule and where the trades are.",
      hospitality: "Tell us about the property and the guest experience you are planning."
    };
    var hint2 = form.querySelector("[data-step2-hint]");
    form.querySelectorAll("input[name='role']").forEach(function (r) {
      r.addEventListener("change", function () { if (hint2 && roleCopy[r.value]) hint2.textContent = roleCopy[r.value]; });
    });

    next.addEventListener("click", function () {
      if (!validateStep(steps[stepIndex])) return;
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      render();
      steps[stepIndex].querySelector("legend").focus();
    });
    back.addEventListener("click", function () {
      stepIndex = Math.max(stepIndex - 1, 0);
      render();
      steps[stepIndex].querySelector("legend").focus();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault(); // Design concept: nothing is sent anywhere.
      if (stepIndex !== steps.length - 1) { next.click(); return; }
      if (!validateStep(steps[stepIndex])) return;

      var data = new FormData(form);
      var labelFor = function (name) {
        var el = form.querySelector("input[name='" + name + "']:checked");
        return el ? el.getAttribute("data-label") || el.value : "—";
      };
      var summary = success.querySelector(".success__summary");
      var rows = [
        ["Name", data.get("name")],
        ["Inquiring as", labelFor("role")],
        ["Project", labelFor("project")],
        ["Stage", labelFor("stage")],
        ["Location", data.get("location") || "—"]
      ];
      summary.innerHTML = "";
      rows.forEach(function (r) {
        var div = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = r[0];
        var dd = document.createElement("dd"); dd.textContent = r[1];
        div.appendChild(dt); div.appendChild(dd); summary.appendChild(div);
      });
      var firstName = String(data.get("name") || "").trim().split(" ")[0];
      success.querySelector("[data-first-name]").textContent = firstName ? ", " + firstName : "";

      form.hidden = true;
      document.querySelector(".progress").hidden = true;
      success.hidden = false;
      success.querySelector("h2").focus();
    });

    render();
  }

  /* ---------- Quick service / estimate form (≤5 fields) ---------- */
  document.querySelectorAll("[data-quick-form]").forEach(function (qf) {
    qf.addEventListener("submit", function (e) {
      e.preventDefault(); // Design concept: nothing is sent anywhere.
      var firstInvalid = null;
      qf.querySelectorAll(".field").forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input) return;
        var v = input.value.trim(), msg = "";
        if (input.required && !v) msg = field.getAttribute("data-msg") || "This field is required.";
        else if (v && input.type === "tel" && v.replace(/\D/g, "").length < 10) msg = "Please include a 10-digit phone number.";
        else if (v && input.name === "zip" && !/^\d{5}$/.test(v)) msg = "Please enter a 5-digit ZIP code.";
        var err = field.querySelector(".error-msg");
        if (msg) {
          field.classList.add("has-error"); input.setAttribute("aria-invalid", "true");
          if (err) err.textContent = msg;
          firstInvalid = firstInvalid || input;
        } else {
          field.classList.remove("has-error"); input.removeAttribute("aria-invalid");
        }
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      try {
        sessionStorage.setItem("solenne-inquiry", JSON.stringify({
          name: qf.elements.name.value.trim(),
          service: qf.elements.service.options[qf.elements.service.selectedIndex].text
        }));
      } catch (err) { /* storage unavailable — thank-you page still works */ }
      window.location.href = "thank-you.html";
    });
    qf.addEventListener("input", function (e) {
      var f = e.target.closest(".field.has-error");
      if (f) { f.classList.remove("has-error"); e.target.removeAttribute("aria-invalid"); }
    });
  });

  /* ---------- Thank-you personalisation ---------- */
  var thanks = document.querySelector("[data-thanks-name]");
  if (thanks) {
    try {
      var saved = JSON.parse(sessionStorage.getItem("solenne-inquiry") || "null");
      if (saved && saved.name) thanks.textContent = ", " + saved.name.split(" ")[0];
      var svc = document.querySelector("[data-thanks-service]");
      if (saved && saved.service && svc) svc.textContent = saved.service.toLowerCase();
    } catch (err) { /* ignore */ }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
