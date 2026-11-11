const BOTTLES = [
  "/bottle-01-tall-rectangular-pink.svg",
  "/bottle-02-round-flacon-blue.svg",
  "/bottle-03-atomizer-yellow.svg",
  "/bottle-04-hourglass-lime.svg",
  "/bottle-05-squat-round-pink.svg",
  "/bottle-06-tall-rectangular-blue.svg",
  "/bottle-07-round-flacon-yellow.svg",
  "/bottle-08-atomizer-lime.svg",
  "/bottle-09-hourglass-pink.svg",
  "/bottle-10-squat-round-blue.svg",
  "/bottle-11-tall-rectangular-yellow.svg",
  "/bottle-12-round-flacon-lime.svg",
  "/bottle-13-atomizer-pink.svg",
  "/bottle-14-hourglass-blue.svg",
  "/bottle-15-squat-round-yellow.svg",
  "/bottle-16-tall-rectangular-lime.svg",
  "/bottle-17-round-flacon-pink.svg",
  "/bottle-18-atomizer-blue.svg",
  "/bottle-19-hourglass-yellow.svg",
  "/bottle-20-squat-round-lime.svg",
] as const;

function BottleRow({ stripId }: { stripId: string }) {
  return (
    <div className="fragrance-strip-row" aria-hidden={stripId !== "a"}>
      {BOTTLES.map((src, index) => (
        <div
          key={`${stripId}-${index}`}
          className="flex shrink-0 items-end justify-center px-[1rem] sm:px-[1.75rem]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-11 w-auto sm:h-12 lg:h-[3.25rem]"
          />
        </div>
      ))}
    </div>
  );
}

export default function FragranceStrip() {
  return (
    <section
      className="w-full overflow-hidden border-y-2 border-black bg-brand-cream py-4 sm:py-5"
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
