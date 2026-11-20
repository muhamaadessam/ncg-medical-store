import { useEffect, useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { clampBundles, correctBundlesInput, MAX_BUNDLES, MIN_BUNDLES } from "../../lib/bundles";

const BLOCKED_KEYS = new Set(["e", "E", "+", "-", ".", ","]);

/** − / number / + for whole bundles in [1, 99]; invalid typing is corrected with an inline hint. */
export function BundleStepper({
  value,
  onChange,
  label = "Number of bundles",
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  const inputId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState(String(value));
  const [hint, setHint] = useState<string | null>(null);

  // Keep the box in sync when the value changes from the buttons.
  useEffect(() => {
    setDraft((d) => (d === "" ? d : String(value)));
  }, [value]);

  const step = (delta: number) => {
    const next = clampBundles(value + delta);
    setHint(null);
    setDraft(String(next));
    onChange(next);
  };

  const handleInput = (raw: string) => {
    const result = correctBundlesInput(raw, value);
    setDraft(result.draft);
    setHint(result.hint);
    if (result.bundles !== value) onChange(result.bundles);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-xl"
          onClick={() => step(-1)}
          disabled={value <= MIN_BUNDLES}
          aria-label="Remove one bundle"
        >
          <Minus />
        </Button>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={draft}
          aria-describedby={hint ? hintId : undefined}
          aria-invalid={hint ? true : undefined}
          onKeyDown={(e) => {
            if (BLOCKED_KEYS.has(e.key)) {
              e.preventDefault();
              setHint(e.key === "-" ? `Minimum is ${MIN_BUNDLES} bundle` : "Whole numbers only");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              step(1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              step(-1);
            }
          }}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={() => {
            if (draft === "") {
              setDraft(String(value));
              setHint(null);
            }
          }}
          className={cn(
            "h-11 w-16 rounded-xl border bg-background text-center font-mono text-base font-medium tabular-nums text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            hint && "border-destructive",
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 rounded-xl"
          onClick={() => step(1)}
          disabled={value >= MAX_BUNDLES}
          aria-label="Add one bundle"
        >
          <Plus />
        </Button>
      </div>
      <p
        id={hintId}
        aria-live="polite"
        className={cn("min-h-4 text-xs", hint ? "text-destructive" : "text-muted-foreground")}
      >
        {hint ?? `${MIN_BUNDLES}–${MAX_BUNDLES} bundles`}
      </p>
    </div>
  );
}
