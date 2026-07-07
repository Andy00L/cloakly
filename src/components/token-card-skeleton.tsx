import type { CSSProperties } from "react";
import { EASE_ENTER } from "@/lib/motion";

// Loading placeholder for a registry card: the card silhouette in well-colored blocks
// with a single paper-bright shimmer crossing it. Decorative, so hidden from assistive
// tech. Mirrors the real card's layout so the swap on load does not shift.
export function TokenCardSkeleton({ index = 0 }: { index?: number }) {
  const wrapperStyle: CSSProperties = {
    animation: `ck-rise 340ms ${EASE_ENTER} backwards`,
    animationDelay: `${index * 55}ms`,
  };

  return (
    <div aria-hidden="true" style={wrapperStyle}>
      <div className="ck-card relative overflow-hidden" style={{ padding: 24 }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[9px]">
            <Bar w={150} h={26} />
            <Bar w={92} h={14} />
          </div>
          <Bar w={92} h={26} round={9999} />
        </div>

        <div className="mt-[18px] grid grid-cols-2 gap-2.5">
          <Bar h={48} />
          <Bar h={48} />
        </div>

        <div className="mt-[18px] grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2.5">
            <Bar w={74} h={11} />
            <Bar w={110} h={22} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Bar w={74} h={11} />
            <Bar w={128} h={34} />
          </div>
        </div>

        <div className="mt-[22px] h-px bg-line" />

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Bar w={120} h={11} />
            <div className="flex gap-2.5">
              <Bar h={44} grow />
              <Bar w={120} h={44} round={9999} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Bar w={150} h={11} />
            <div className="flex gap-2.5">
              <Bar h={44} grow />
              <Bar w={120} h={44} round={9999} />
            </div>
          </div>
        </div>

        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "70%",
            background:
              "linear-gradient(100deg, rgba(247,245,239,0) 30%, rgba(247,245,239,0.72) 50%, rgba(247,245,239,0) 70%)",
            transform: "translateX(-120%)",
            animation: `ck-skeleton-shimmer 1600ms ${EASE_ENTER} infinite`,
            animationDelay: `${index * 140}ms`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

function Bar({ w, h = 12, round = 8, grow = false }: { w?: number; h?: number; round?: number; grow?: boolean }) {
  return (
    <div
      className="bg-well"
      style={{ width: grow ? undefined : w, height: h, borderRadius: round, flex: grow ? "1 1 auto" : undefined }}
    />
  );
}
