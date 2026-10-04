import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
export default function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const d = ref.current;
    d?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + className}
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]',
          ) || [],
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (!first || !last) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !ref.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="row between modal-title">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="关闭弹窗"
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
