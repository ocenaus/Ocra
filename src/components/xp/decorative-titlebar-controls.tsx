/**
 * Purely decorative — for the outer app frame only, which isn't itself a
 * draggable/maximizable "window" (it already fills the layout). aria-hidden
 * so it never implies working controls. The real interactive controls live
 * on each XpWindow instance (xp-window.tsx).
 */
export function DecorativeTitlebarControls() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#5fa8f5] to-[#1a5fce] text-[10px] leading-none text-white shadow-sm">
        _
      </span>
      <span className="flex size-4 items-center justify-center rounded-[3px] border border-white/40 bg-gradient-to-b from-[#f47a6a] to-[#c22a1a] text-[10px] leading-none text-white shadow-sm">
        ✕
      </span>
    </div>
  );
}
