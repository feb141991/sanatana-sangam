"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { AdminSidebarRail } from "./AdminSidebarRail";
import { useDialogFocusTrap } from "@/lib/admin-accessibility";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMobileDrawer({ isOpen, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap, Escape key handling, and return focus upon close
  useDialogFocusTrap(isOpen, onClose, containerRef);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 lg:hidden flex font-outfit"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 motion-reduce:animate-none"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        ref={containerRef}
        tabIndex={-1}
        className="admin-dark relative bg-[#1f1d23]/95 w-72 max-w-[80vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 motion-reduce:animate-none focus:outline-none"
      >
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <AdminSidebarRail onItemClick={onClose} className="w-full border-r-0" />
      </div>
    </div>
  );
}
