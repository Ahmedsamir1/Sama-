/** Hand-drawn style bunny illustration (pure SVG, no external assets). */
export type BunnyProp = 'heart' | 'chocolate' | 'moon' | 'none';

interface Props {
  size?: number;
  holding?: BunnyProp;
  mood?: 'happy' | 'sleepy' | 'wink';
  className?: string;
  blush?: boolean;
}

export function Bunny({ size = 120, holding = 'heart', mood = 'happy', className = '', blush = true }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-hidden="true">
      {/* ears */}
      <g className="ear">
        <ellipse cx="72" cy="52" rx="17" ry="46" fill="#fff" stroke="#f3c6d8" strokeWidth="3" transform="rotate(-12 72 52)" />
        <ellipse cx="72" cy="56" rx="8" ry="32" fill="#ffc9de" transform="rotate(-12 72 56)" />
      </g>
      <g>
        <ellipse cx="128" cy="52" rx="17" ry="46" fill="#fff" stroke="#f3c6d8" strokeWidth="3" transform="rotate(12 128 52)" />
        <ellipse cx="128" cy="56" rx="8" ry="32" fill="#ffc9de" transform="rotate(12 128 56)" />
      </g>
      {/* body */}
      <ellipse cx="100" cy="160" rx="52" ry="36" fill="#fff" stroke="#f3c6d8" strokeWidth="3" />
      {/* head */}
      <ellipse cx="100" cy="112" rx="56" ry="48" fill="#fff" stroke="#f3c6d8" strokeWidth="3" />
      {/* bow */}
      <g transform="translate(130 74) rotate(18)">
        <path d="M0 0 L-16 -10 L-16 10 Z" fill="#ff8fb8" />
        <path d="M0 0 L16 -10 L16 10 Z" fill="#ff8fb8" />
        <circle r="5" fill="#f0528c" />
      </g>
      {/* eyes */}
      {mood === 'sleepy' ? (
        <>
          <path d="M72 110 q8 6 16 0" stroke="#5a3a50" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M112 110 q8 6 16 0" stroke="#5a3a50" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'wink' ? (
        <>
          <circle cx="80" cy="108" r="7" fill="#5a3a50" />
          <circle cx="82.5" cy="105.5" r="2.4" fill="#fff" />
          <path d="M112 110 q8 -6 16 0" stroke="#5a3a50" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="80" cy="108" r="7" fill="#5a3a50" />
          <circle cx="120" cy="108" r="7" fill="#5a3a50" />
          <circle cx="82.5" cy="105.5" r="2.4" fill="#fff" />
          <circle cx="122.5" cy="105.5" r="2.4" fill="#fff" />
        </>
      )}
      {blush && (
        <>
          <ellipse cx="68" cy="126" rx="10" ry="6" fill="#ffb3cf" opacity="0.8" />
          <ellipse cx="132" cy="126" rx="10" ry="6" fill="#ffb3cf" opacity="0.8" />
        </>
      )}
      {/* nose + mouth */}
      <path d="M95 120 h10 l-5 6 z" fill="#f0528c" />
      <path d="M100 126 q-6 8 -12 3 M100 126 q6 8 12 3" stroke="#5a3a50" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* paws + held item */}
      {holding === 'heart' && (
        <path d="M100 186 c-2 0-4-1-5-2 -14-11-30-22-30-38 0-9 7-16 15-16 7 0 13 4 20 11 7-7 13-11 20-11 8 0 15 7 15 16 0 16-16 27-30 38-1 1-3 2-5 2z" fill="#ff6fa5" stroke="#fff" strokeWidth="3" />
      )}
      {holding === 'chocolate' && (
        <g>
          <rect x="74" y="146" width="52" height="36" rx="5" fill="#7b4a33" stroke="#fff" strokeWidth="3" />
          <path d="M91 146 v36 M108 146 v36 M74 164 h52" stroke="#5c3424" strokeWidth="2.5" />
          <path d="M74 168 h52 v14 h-52z" fill="#ff8fb8" opacity="0.95" />
        </g>
      )}
      {holding === 'moon' && (
        <path d="M118 150 a24 24 0 1 1 -18 -22 a18 18 0 1 0 18 22z" fill="#fff1cf" stroke="#f3c6a0" strokeWidth="3" />
      )}
      <ellipse cx="74" cy="160" rx="12" ry="9" fill="#fff" stroke="#f3c6d8" strokeWidth="3" />
      <ellipse cx="126" cy="160" rx="12" ry="9" fill="#fff" stroke="#f3c6d8" strokeWidth="3" />
    </svg>
  );
}
