"use client";

import { useEffect } from "react";

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const suffix = el.dataset.suffix ?? "";
  const duration = Math.min(1900, 900 + target * 6);
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = `${Math.round(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = `0${suffix}`;
  requestAnimationFrame(tick);
}

export default function Motion() {
  useEffect(() => {
    (window as unknown as { __motionReady?: boolean }).__motionReady = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal], [data-stagger], [data-count]");

    const show = (el: HTMLElement) => {
      el.classList.add("is-in");
      if (el.dataset.count && !reduced) countUp(el);
    };

    let disconnect: (() => void) | undefined;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            show(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
      );
      targets.forEach((el) => observer.observe(el));
      disconnect = () => observer.disconnect();
    }

    const header = document.querySelector("header");
    const onScroll = () => header?.classList.toggle("header-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      disconnect?.();
    };
  }, []);

  return null;
}
