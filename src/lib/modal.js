export function trapFocus(node) {
  const previouslyFocused = document.activeElement;
  const focusable =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      node.dispatchEvent(new CustomEvent("cancel", { bubbles: true }));
      return;
    }
    if (e.key !== "Tab") return;

    const els = [...node.querySelectorAll(focusable)].filter(
      (el) => el.offsetParent !== null,
    );
    if (els.length === 0) return;

    const first = els[0];
    const last = els[els.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  queueMicrotask(() => {
    const els = [...node.querySelectorAll(focusable)].filter(
      (el) => el.offsetParent !== null,
    );
    els[0]?.focus();
  });

  node.addEventListener("keydown", onKeydown);

  return {
    destroy() {
      node.removeEventListener("keydown", onKeydown);
      previouslyFocused?.focus?.();
    },
  };
}