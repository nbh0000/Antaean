(function () {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  const subnavToggles = document.querySelectorAll("[data-subnav-toggle]");
  const subnavGroups = document.querySelectorAll("[data-nav-group]");
  const mobileSubnav = window.matchMedia("(max-width: 1160px), (hover: none)");
  const page = document.body.dataset.page;
  const parentNav = {
    songdo: "about",
    baegot: "about",
    facilities: "about",
    trial: "contact",
  };
  const setSubnavState = (group, isOpen) => {
    group.classList.toggle("is-open", isOpen);
    const parent = group.querySelector("[data-subnav-toggle]");
    if (parent) {
      parent.setAttribute("aria-expanded", String(isOpen));
    }
  };
  const closeSubnavs = (except) => {
    document.querySelectorAll("[data-nav-group].is-open").forEach((group) => {
      if (group === except) {
        return;
      }
      setSubnavState(group, false);
    });
  };
  if (page) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) {
        link.setAttribute("aria-current", "page");
      }
    });

    const groupName = parentNav[page];
    if (groupName) {
      document.querySelectorAll("[data-nav-group]").forEach((group) => {
        if (group.dataset.navGroup === groupName) {
          group.classList.add("is-current");
        }
      });
    }
  }

  subnavToggles.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (!mobileSubnav.matches) {
        return;
      }
      event.preventDefault();
      const group = link.closest("[data-nav-group]");
      if (!group) {
        return;
      }
      const willOpen = !group.classList.contains("is-open");
      closeSubnavs(group);
      setSubnavState(group, willOpen);
    });
  });

  subnavGroups.forEach((group) => {
    group.addEventListener("mouseenter", () => {
      if (!mobileSubnav.matches) {
        closeSubnavs(group);
        setSubnavState(group, true);
      }
    });

    group.addEventListener("mouseleave", () => {
      if (!mobileSubnav.matches) {
        setSubnavState(group, false);
      }
    });

    group.addEventListener("focusin", () => {
      if (!mobileSubnav.matches) {
        closeSubnavs(group);
        setSubnavState(group, true);
      }
    });

    group.addEventListener("focusout", () => {
      if (mobileSubnav.matches) {
        return;
      }
      window.requestAnimationFrame(() => {
        if (!group.contains(document.activeElement)) {
          setSubnavState(group, false);
        }
      });
    });
  });

  mobileSubnav.addEventListener("change", () => {
    closeSubnavs();
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    if (!event.target.closest("[data-nav-group]")) {
      closeSubnavs();
    }
  });

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const link = event.target.closest("a");
    if (link && !link.matches("[data-subnav-toggle]")) {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      closeSubnavs();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      closeSubnavs();
    }
  });
})();
