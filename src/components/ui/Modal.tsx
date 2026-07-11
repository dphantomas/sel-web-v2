"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, children, title, showCloseButton = true }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Cerrar al hacer clic afuera
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg rounded-xl bg-background p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title ? <h2 className="text-xl font-semibold">{title}</h2> : <div />}
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
