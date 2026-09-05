"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CornerDownLeft } from "lucide-react";
import { searchAdminRoutes, type AdminRouteItem, GROUP_TITLES } from "@/lib/admin-route-registry";
import { AdminIcon } from "./AdminIcon";
import { useDialogFocusTrap } from "@/lib/admin-accessibility";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminCommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus trap, Escape key handling, and return focus upon close
  useDialogFocusTrap(isOpen, onClose, containerRef);

  const results = searchAdminRoutes(query);

  const navigateTo = useCallback(
    (item: AdminRouteItem) => {
      onClose();
      router.push(item.path);
    },
    [onClose, router]
  );

  // Focus input when opened
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSelectedIndex(0);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateTo(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs font-outfit animate-in fade-in duration-150 motion-reduce:animate-none"
      onClick={onClose}
    >
      {/* Screen Reader Announcement for Results Count */}
      <div aria-live="polite" role="status" className="sr-only">
        {results.length === 0
          ? "No matching routes found"
          : `${results.length} matching administrative route${results.length === 1 ? "" : "s"} found`}
      </div>

      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150 motion-reduce:animate-none focus:outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-black/5 gap-3 bg-white">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="command-palette-results"
            aria-autocomplete="list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to route or operation (e.g. crons, moderation, logs)..."
            className="flex-1 text-sm bg-transparent border-none outline-none theme-ink placeholder-gray-400 font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md hover:bg-black/5 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          id="command-palette-results"
          role="listbox"
          aria-label="Route Search Results"
          className="flex-1 overflow-y-auto p-2 divide-y divide-transparent"
        >
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-1">
              <p className="font-bold text-gray-600">No matching routes found</p>
              <p className="text-[11px]">Command palette searches administrative screens and operational domains.</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  id={`command-option-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => navigateTo(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-amber-500/10 text-amber-950 font-medium"
                      : "hover:bg-black/[0.02] text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? "bg-amber-500/20 text-amber-800" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <AdminIcon name={item.iconName} size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate theme-ink">{item.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-black/5 text-gray-500">
                          {GROUP_TITLES[item.group]}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-purple-100 text-purple-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate leading-relaxed mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-400 shrink-0 pl-2">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded">
                        <span>Select</span>
                        <CornerDownLeft size={10} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="px-4 py-2.5 bg-black/[0.02] border-t border-black/5 flex items-center justify-between text-[10px] text-gray-400">
          <span>Searching 15 admin routes & workspaces</span>
          <span className="hidden sm:inline">Use ↑ ↓ arrows to navigate, ↵ to select</span>
        </div>
      </div>
    </div>
  );
}
