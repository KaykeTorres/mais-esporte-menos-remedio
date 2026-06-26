/* ============================================================
   ANIMATIONS.JS — Intersection Observer e microinterações
   ============================================================ */

function initRevealOnScroll() {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/** Pequeno efeito de "pulso dourado" usado para chamar atenção a um elemento */
function pulseElement(el) {
  if (!el) return;
  el.style.animation = "pulseGold 0.9s ease 2";
  el.addEventListener(
    "animationend",
    () => { el.style.animation = ""; },
    { once: true }
  );
}

window.AppAnimations = { pulseElement };

document.addEventListener("DOMContentLoaded", initRevealOnScroll);
