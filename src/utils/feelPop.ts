/** One-shot success pop on an element (buy, hire, accept). Replays cleanly on rapid clicks; CSS handles motion budgets. */
export function popElement(el: Element | null | undefined, cls = 'feel-pop'): void {
  if (!el || typeof window === 'undefined') return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}
