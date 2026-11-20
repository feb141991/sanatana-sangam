'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  Package,
  Flame,
  Droplet,
  Compass,
  Check,
  Heart,
  Info,
} from 'lucide-react';
import type { SacredProduct, SamagriCategory } from '@/types/samagri';
import toast from 'react-hot-toast';

interface Props {
  products: readonly SacredProduct[];
}

const CATEGORIES: { id: SamagriCategory | 'all'; label: string; icon: typeof Package }[] = [
  { id: 'all', label: 'All Provisions', icon: Sparkles },
  { id: 'pooja-kit', label: 'Pooja Packs & Kits', icon: Package },
  { id: 'ganga-jal', label: 'Sealed Ganga Jal', icon: Droplet },
  { id: 'dhoop-incense', label: 'Charcoal-Free Dhoop', icon: Flame },
  { id: 'camphor', label: 'Bhimseni Camphor', icon: Sparkles },
  { id: 'mala', label: 'Consecrated Malas', icon: Compass },
];

export default function SamagriPrototypeClient({ products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<SamagriCategory | 'all'>('all');
  const [reservedIds, setReservedIds] = useState<Record<string, boolean>>({});
  const [selectedProduct, setSelectedProduct] = useState<SacredProduct | null>(null);

  const filtered = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const handleReserve = (product: SacredProduct) => {
    setReservedIds((prev) => ({ ...prev, [product.id]: true }));
    toast.success(`Interest reserved for ${product.title}! (Prototype preview)`);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-cream)] pb-24">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--surface-base)]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/kosh"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Kosh
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <Sparkles className="size-3 text-amber-600 dark:text-amber-400" />
            Feature Preview (Branch Sandbox)
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10">
        {/* ── Hero Headline ─────────────────────────────────────────────── */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2">
            Shoonaya Kosh · Sacred Physical Provisions
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[var(--text-cream)]">
            Authentic altar provisions, curated with zero compromise.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--text-muted-warm)] leading-relaxed">
            From certified glacial Gangotri water to pure temple-flower charcoal-free dhoop and all-in-one pooja boxes. Every item is verified for traditional purity, ethical provenance, and zero chemical adulteration.
          </p>
        </div>

        {/* ── Category Filter Pills ─────────────────────────────────────── */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  active
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-[var(--surface-soft)] text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] border border-[var(--card-border)]'
                }`}
              >
                <Icon className="size-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Product Grid ─────────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const isReserved = !!reservedIds[item.id];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-6 flex flex-col justify-between hover:border-amber-500/30 transition-all shadow-sm group"
              >
                <div>
                  {/* Emblem & Category Tag */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="size-16 rounded-2xl bg-gradient-to-b from-amber-500/10 to-amber-900/10 border border-amber-500/20 p-2 flex items-center justify-center shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={52}
                        height={52}
                        className="object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      {item.provenance.purityGuarantee.split('·')[0].trim()}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-[var(--text-cream)] leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted-warm)] line-clamp-2">
                    {item.subtitle}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[var(--card-border)]/50 text-[11px] text-[var(--text-dim)] flex flex-col gap-1">
                    <p>
                      <span className="font-semibold text-[var(--text-cream)]">Origin:</span> {item.provenance.origin}
                    </p>
                    {item.itemsIncluded && (
                      <p className="text-amber-700 dark:text-amber-400 font-medium">
                        ✦ Complete kit with {item.itemsIncluded.length} authentic ritual items
                      </p>
                    )}
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="mt-6 pt-4 border-t border-[var(--card-border)]/50 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold font-display text-[var(--text-cream)]">
                      ₹{item.priceInr}
                    </span>
                    <span className="text-xs text-[var(--text-dim)] ml-1.5">
                      (${item.priceUsd})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.itemsIncluded && (
                      <button
                        onClick={() => setSelectedProduct(item)}
                        className="p-2 rounded-xl border border-[var(--card-border)] text-[var(--text-muted-warm)] hover:text-[var(--text-cream)] hover:bg-[var(--surface-base)] transition-colors cursor-pointer"
                        title="View Kit Contents"
                      >
                        <Info className="size-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleReserve(item)}
                      disabled={isReserved}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isReserved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm active:scale-95'
                      }`}
                    >
                      {isReserved ? (
                        <>
                          <Check className="size-3.5" />
                          Reserved
                        </>
                      ) : (
                        <>
                          <Package className="size-3.5" />
                          Reserve Box
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Kit Detail Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProduct && selectedProduct.itemsIncluded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-[var(--card-border)] bg-[var(--surface-base)] p-6 sm:p-7 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Pooja Pack Breakdown
                  </span>
                  <h3 className="text-xl font-display font-bold text-[var(--text-cream)] mt-0.5">
                    {selectedProduct.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full hover:bg-[var(--surface-soft)] text-[var(--text-muted-warm)] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted-warm)] leading-relaxed mb-4">
                {selectedProduct.description}
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">
                  Items in this box ({selectedProduct.itemsIncluded.length}):
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {selectedProduct.itemsIncluded.map((itm, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[var(--surface-soft)] border border-[var(--card-border)]/60 text-xs flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-[var(--text-cream)]">{itm.name}</p>
                        <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{itm.significance}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-500/10 text-stone-600 dark:text-stone-300 shrink-0 font-medium">
                        {itm.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <span className="text-2xl font-display font-bold text-[var(--text-cream)]">
                    ₹{selectedProduct.priceInr}
                  </span>
                  <span className="text-xs text-[var(--text-dim)] ml-1">
                    (${selectedProduct.priceUsd})
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleReserve(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs tracking-wide shadow-sm cursor-pointer"
                >
                  Reserve Pre-Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
