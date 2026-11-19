import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

/** Main image with clickable thumbnails (only when there are 2+ images); placeholder when empty. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted shadow-soft sm:aspect-[4/3] lg:aspect-square">
        {current ? (
          <img
            key={current}
            src={current}
            alt={images.length > 1 ? `${name} — image ${index + 1} of ${images.length}` : name}
            className="size-full object-cover animate-in fade-in duration-300"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-10" aria-hidden />
            <span className="text-sm">No image available</span>
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2.5 overflow-x-auto scrollbar-none" aria-label="Product images">
          {images.map((src, i) => (
            <li key={`${src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "block size-16 overflow-hidden rounded-xl border-2 bg-muted transition sm:size-20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img src={src} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
