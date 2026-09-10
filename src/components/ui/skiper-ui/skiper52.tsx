"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

type HoverExpandImage = {
  src: string;
  alt: string;
  code?: string;
};

type HoverExpandProps = {
  images: HoverExpandImage[];
  className?: string;
  initialActiveIndex?: number | null;
};

function Skiper52({ images, className, initialActiveIndex }: HoverExpandProps) {
  return (
    <div className="flex w-full items-center justify-center overflow-hidden bg-background">
      <HoverExpand001
        className={className}
        images={images}
        initialActiveIndex={initialActiveIndex}
      />
    </div>
  );
}

function HoverExpand001({
  images,
  className,
  initialActiveIndex = images.length > 1 ? 1 : images.length === 1 ? 0 : null,
}: HoverExpandProps) {
  const prefersReducedMotion = useReducedMotion();
  const validInitialIndex =
    initialActiveIndex !== null &&
    initialActiveIndex >= 0 &&
    initialActiveIndex < images.length
      ? initialActiveIndex
      : null;
  const [activeImage, setActiveImage] = useState<number | null>(
    validInitialIndex,
  );

  if (images.length === 0) {
    return null;
  }

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeInOut" as const };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
      className={cn("relative w-full max-w-6xl px-5", className)}
    >
      <div className="flex w-full items-center gap-1 overflow-x-auto py-2">
        {images.map((image, index) => {
          const isActive = activeImage === index;

          return (
            <motion.button
              key={`${image.src}-${index}`}
              type="button"
              aria-label={`Show ${image.alt}`}
              aria-pressed={isActive}
              className="relative h-96 min-w-11 shrink-0 cursor-pointer overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              initial={false}
              animate={{ width: isActive ? "24rem" : "5rem" }}
              transition={transition}
              onClick={() => setActiveImage(index)}
              onFocus={() => setActiveImage(index)}
              onHoverStart={() => setActiveImage(index)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={isActive ? "(max-width: 640px) 80vw, 384px" : "80px"}
                className="object-cover"
              />

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                  />
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {isActive && image.code && (
                  <motion.span
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    className="pointer-events-none absolute inset-0 flex items-end justify-end p-4 text-xs text-white/70"
                  >
                    {image.code}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export { HoverExpand001, Skiper52 };
export type { HoverExpandImage, HoverExpandProps };

/**
 * Skiper 52 HoverExpand001 — React + Framer Motion
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Source: https://skiper-ui.com
 */
