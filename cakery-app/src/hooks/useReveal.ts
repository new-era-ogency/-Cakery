import { useEffect } from "react";

/**
 * Adds the `is-visible` class to all `.reveal` nodes when they enter the
 * viewport. Falls back to immediately revealing everything if
 * IntersectionObserver is unavailable (very old browsers).
 */
export function useReveal(): void {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document
        .querySelectorAll<HTMLElement>(".reveal")
        .forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    document
      .querySelectorAll<HTMLElement>(".reveal:not(.is-visible)")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}
