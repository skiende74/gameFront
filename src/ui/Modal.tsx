import { useEffect, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-md bg-dungeon-stone border-4 border-bone-white/30 shadow-[0_0_40px_rgba(255,122,58,0.35)] p-6 font-pixel-ko"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-bone-white/20">
          <h2 className="text-xl text-torch-core m-0">{title}</h2>
          <button
            type="button"
            className="text-bone-white/60 hover:text-torch-flame transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="text-bone-white/90">{children}</div>
      </div>
    </div>
  );
}
