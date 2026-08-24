import Image from "next/image";



const avatarRows = [
  {
    y: "translate-y-0",
    items: [0, 1, 2, 3, 4, 5],
  },
  {
    y: "translate-y-25",
    items: [4, 5, 6, 7, 8, 9],
  },
];

export default function Testimonial() {
  return (
    <section className="bg-[#ffc928] py-16 border-t-4 border-black">
      <div className="mx-auto  px-4 lg:px-0">
        {/* Top main testimonial */}
        <div className="grid gap-10 max-w-6xl mx-auto lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-center">
          {/* Left: photo card */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute left-3 top-3 h-full w-full bg-black" />
              <div className="relative border-2 border-black bg-yellow-100">
                <div className="relative h-72 w-72 sm:h-80 sm:w-80">
                  <Image
                    src="/girl.png"
                    alt="Happy student"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: text + quotes */}
          <div className="space-y-5 ">
            {/* Heading row with opening quotes */}
            <div className="flex items-center gap-4">
              <div className="text-8xl text-[#00d0c6] drop-shadow-[4px_4px_0_#000]">
                &ldquo;
              </div>
              <h2 className="text-5xl  font-extrabold text-black">
                Testimonial
              </h2>
            </div>

            <p className="max-w-4xl text-sm leading-relaxed text-black/90 sm:text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
              vulputate libero et velit interdum, ac aliquet odio mattis. Class
              aptent taciti sociosqu ad litora torquent per conubia nostra, per
              inceptos himenaeos. Curabitur tempus urna at turpis condimentum
              lobortis.
            </p>

            <div className="pt-2">
              <p className="text-2xl font-semibold text-black">Alex Hoka</p>
              <p className="text-sm text-black/80">Senior Web Developer</p>
            </div>

            {/* <div className="flex justify-end text-5xl text-[#00d0c6] drop-shadow-[4px_4px_0_#000]">
              &rdquo;
            </div> */}
          </div>
        </div>

        {/* Bottom floating avatar reviews */}
        <div className=" relative h-90 overflow-hidden">
          {avatarRows.map((row, rowIndex) => (
            <div
              key={row.y}
              className={`absolute inset-y-0 flex w-full items-center gap-8 ${row.y} ${
                rowIndex === 0 ? "-translate-x-30" : "-translate-x-6"
              }`}
            >
              {row.items.map((idx) => (
                <div
                  key={idx}
                  className="relative flex items-center gap-3 border-2 border-black bg-white px-5 py-2 shadow-[4px_4px_0_#000]"
                >
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-black bg-yellow-200">
                    <Image
                      src="/girl.png"
                      alt="Student avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-black whitespace-nowrap">
                    sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

