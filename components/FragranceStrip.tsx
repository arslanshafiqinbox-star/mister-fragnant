type BottleProps = {
  color: string;
  className?: string;
};

function Label({ x, y, w = 14, h = 11 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#fff"
        stroke="#111"
        strokeWidth="2.2"
      />
      <line
        x1={x + 3}
        y1={y + h / 2}
        x2={x + w - 3}
        y2={y + h / 2}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  );
}

function TallTab({ color, className }: BottleProps) {
  return (
    <svg viewBox="0 0 56 88" className={className} aria-hidden fill="none">
      <rect x="16" y="6" width="18" height="11" rx="1.5" fill={color} stroke="#111" strokeWidth="2.8" />
      <rect x="34" y="8" width="8" height="7" rx="1" fill={color} stroke="#111" strokeWidth="2.6" />
      <path
        d="M15 19H35L39 74.5C39 78.5 36 81.5 32 81.5H18C14 81.5 11 78.5 11 74.5L15 19Z"
        fill={color}
        stroke="#111"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M18 28V68" stroke="#111" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <Label x={21} y={38} w={14} h={12} />
    </svg>
  );
}

function Hourglass({ color, className }: BottleProps) {
  return (
    <svg viewBox="0 0 56 88" className={className} aria-hidden fill="none">
      <rect x="18" y="4" width="20" height="7" rx="1.2" fill={color} stroke="#111" strokeWidth="2.8" />
      <rect x="21" y="11" width="14" height="6" fill={color} stroke="#111" strokeWidth="2.6" />
      <path
        d="M13 19
           C13 19 14 28 18 34
           C22 40 22 44 18 50
           C14 56 12 64 12 70
           C12 76 16 82 22 82
           H34
           C40 82 44 76 44 70
           C44 64 42 56 38 50
           C34 44 34 40 38 34
           C42 28 43 19 43 19
           Z"
        fill={color}
        stroke="#111"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M18 30V66" stroke="#111" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <Label x={21} y={40} w={14} h={12} />
    </svg>
  );
}

function WideJug({ color, className }: BottleProps) {
  return (
    <svg viewBox="0 0 72 80" className={className} aria-hidden fill="none">
      <rect x="28" y="4" width="16" height="10" rx="1.5" fill={color} stroke="#111" strokeWidth="2.8" />
      <path
        d="M8 16H64V52C64 64 54 74 36 74C18 74 8 64 8 52V16Z"
        fill={color}
        stroke="#111"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M16 26V54" stroke="#111" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M22 28V52" stroke="#111" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      <Label x={28} y={34} w={16} h={12} />
    </svg>
  );
}

function RectBottle({ color, className }: BottleProps) {
  return (
    <svg viewBox="0 0 52 88" className={className} aria-hidden fill="none">
      <rect x="14" y="4" width="24" height="7" rx="1.2" fill={color} stroke="#111" strokeWidth="2.8" />
      <rect x="17" y="11" width="18" height="6" fill={color} stroke="#111" strokeWidth="2.6" />
      <rect x="10" y="19" width="32" height="62" fill={color} stroke="#111" strokeWidth="2.8" />
      <path d="M15 30V70" stroke="#111" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <Label x={19} y={40} w={14} h={12} />
    </svg>
  );
}

function RoundBottle({ color, className }: BottleProps) {
  return (
    <svg viewBox="0 0 80 88" className={className} aria-hidden fill="none">
      <rect x="30" y="2" width="20" height="7" rx="1.2" fill={color} stroke="#111" strokeWidth="2.8" />
      <rect x="33" y="9" width="14" height="6" fill={color} stroke="#111" strokeWidth="2.6" />
      <circle cx="40" cy="50" r="28" fill={color} stroke="#111" strokeWidth="2.8" />
      <path d="M22 40V58" stroke="#111" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <Label x={33} y={44} w={14} h={12} />
    </svg>
  );
}

const Y = "#FFD400";
const P = "#FF4FA3";
const B = "#3B8BEA";

/**
 * Shape order cycles so neighbors never share a shape,
 * and the loop seam (last → first) is also safe.
 */
const BOTTLES = [
  { Shape: TallTab, color: Y, shape: "tall" },
  { Shape: Hourglass, color: P, shape: "hour" },
  { Shape: WideJug, color: B, shape: "wide" },
  { Shape: RectBottle, color: Y, shape: "rect" },
  { Shape: RoundBottle, color: P, shape: "round" },
  { Shape: Hourglass, color: B, shape: "hour" },
  { Shape: TallTab, color: P, shape: "tall" },
  { Shape: WideJug, color: Y, shape: "wide" },
  { Shape: RoundBottle, color: B, shape: "round" },
  { Shape: RectBottle, color: P, shape: "rect" },
  { Shape: TallTab, color: B, shape: "tall" },
  { Shape: Hourglass, color: Y, shape: "hour" },
  { Shape: WideJug, color: P, shape: "wide" },
  { Shape: RoundBottle, color: Y, shape: "round" },
  { Shape: RectBottle, color: B, shape: "rect" },
] as const;

function BottleRow({ stripId }: { stripId: string }) {
  return (
    <div className="fragrance-strip-row" aria-hidden={stripId !== "a"}>
      {BOTTLES.map(({ Shape, color, shape }, index) => (
        <div
          key={`${stripId}-${shape}-${index}`}
          className="flex shrink-0 items-end justify-center px-[1rem] sm:px-[1.75rem]"
        >
          <Shape color={color} className="h-11 w-auto sm:h-12 lg:h-[3.25rem]" />
        </div>
      ))}
    </div>
  );
}

export default function FragranceStrip() {
  return (
    <section
      className="w-full overflow-hidden border-y border-[#3a3a3a] bg-white py-4 sm:py-5"
      aria-label="Fragrance bottles"
    >
      <div className="fragrance-strip-viewport">
        <div className="fragrance-strip-track fragrance-strip-track--dense">
          <BottleRow stripId="a" />
          <BottleRow stripId="b" />
          <BottleRow stripId="c" />
        </div>
      </div>
    </section>
  );
}
