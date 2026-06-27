'use client';

/**
 * Decorative sliding image rows for the landing background.
 * Two rows scroll in opposite X directions for depth.
 * Images are duplicated inline so the loop is seamless (translateX -50%).
 */

const ROW_A = [
  'photo-1492691527719-9d1e07e534b4', // creator filming
  'photo-1611162617213-7d7a39e9b1d7', // abstract gradient
  'photo-1626785774573-4b799315345d', // pink/purple
  'photo-1620121692029-d088224ddc74', // gradient mesh
  'photo-1535223289827-42f1e9919769', // portrait studio
  'photo-1551434678-e076c223a692', // team / creative
];

const ROW_B = [
  'photo-1493612276216-ee3925520721', // neon abstract
  'photo-1579546929518-9e396f3cc809', // gradient
  'photo-1614851099511-773084f6911d', // 3d render
  'photo-1618005182384-a83a8bd57fbe', // abstract shapes
  'photo-1620641788421-7a1c342ea42e', // fluid art
  'photo-1604079628040-94301bb21b91', // colorful
];

function imgUrl(id: string, w = 600, h = 400) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

function Row({
  ids,
  direction,
  duration,
}: {
  ids: string[];
  direction: 'left' | 'right';
  duration: number;
}) {
  const items = [...ids, ...ids]; // duplicate for seamless loop
  return (
    <div className="flex w-max pause-on-hover" style={{ ['--marquee-duration' as any]: `${duration}s` }}>
      <div
        className={`flex gap-5 pr-5 ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
      >
        {items.map((id, i) => (
          <div
            key={`${id}-${i}`}
            className="relative h-56 w-80 shrink-0 overflow-hidden rounded-2xl border border-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl(id)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImageMarquee() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.18]"
    >
      <div className="flex flex-col gap-5 -rotate-6 scale-125 pt-10">
        <Row ids={ROW_A} direction="left" duration={70} />
        <Row ids={ROW_B} direction="right" duration={90} />
        <Row ids={ROW_A} direction="left" duration={80} />
      </div>
    </div>
  );
}
