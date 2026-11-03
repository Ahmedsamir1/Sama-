/**
 * "Mochi" — an original kawaii strawberry-milk bunny drawn in pure SVG for the cycle card.
 * The little item she holds changes with the cycle phase.
 */
export type MochiProp = 'bottle' | 'flower' | 'tea' | 'heart';

export function Mochi({ size = 150, holding = 'tea', className = '' }: { size?: number; holding?: MochiProp; className?: string }) {
  const line = '#7a4b3a';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-hidden="true">
      {/* short floppy ears */}
      <g className="ear">
        <path d="M58 70 C40 40 44 18 60 20 C76 22 82 48 84 66 Z" fill="#ffe3ec" stroke={line} strokeWidth="3" strokeLinejoin="round" />
        <path d="M62 60 C54 42 56 30 62 31 C69 33 72 48 74 60 Z" fill="#ffb8cd" />
      </g>
      <path d="M142 70 C160 40 156 18 140 20 C124 22 118 48 116 66 Z" fill="#ffe3ec" stroke={line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M138 60 C146 42 144 30 138 31 C131 33 128 48 126 60 Z" fill="#ffb8cd" />

      {/* body */}
      <path d="M52 150 C48 182 70 196 100 196 C130 196 152 182 148 150 Z" fill="#ffd3e1" stroke={line} strokeWidth="3" strokeLinejoin="round" />
      {/* head: soft mochi shape */}
      <path
        d="M100 52 C146 52 170 80 168 116 C166 148 138 160 100 160 C62 160 34 148 32 116 C30 80 54 52 100 52 Z"
        fill="#fff4f7"
        stroke={line}
        strokeWidth="3"
      />
      {/* strawberry-milk hair patch */}
      <path d="M70 60 C82 52 118 52 130 60 C122 72 112 66 100 74 C88 66 78 72 70 60 Z" fill="#ffc2d4" />

      {/* heart bow */}
      <g transform="translate(100 50)">
        <path d="M0 6 C-6 -6 -28 -8 -26 6 C-24 18 -8 14 0 6 Z" fill="#ff6f96" stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M0 6 C6 -6 28 -8 26 6 C24 18 8 14 0 6 Z" fill="#ff6f96" stroke={line} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cy="6" r="6" fill="#ff8fb0" stroke={line} strokeWidth="2.5" />
      </g>

      {/* big sparkly eyes */}
      {[72, 128].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="110" rx="15" ry="17" fill="#3d2418" />
          <circle cx={cx + 5} cy="102" r="6" fill="#fff" />
          <circle cx={cx - 5} cy="117" r="2.6" fill="#fff" />
        </g>
      ))}
      {/* cheeks */}
      <ellipse cx="52" cy="132" rx="11" ry="6.5" fill="#ff9fbd" opacity="0.75" />
      <ellipse cx="148" cy="132" rx="11" ry="6.5" fill="#ff9fbd" opacity="0.75" />
      {/* tiny "w" mouth */}
      <path d="M90 132 q5 6 10 0 q5 6 10 0" stroke={line} strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {holding === 'bottle' && (
        <g transform="translate(74 146)">
          <rect x="0" y="4" width="52" height="40" rx="14" fill="#ff8fb0" stroke={line} strokeWidth="3" />
          <rect x="18" y="-4" width="16" height="10" rx="3" fill="#ffd3e1" stroke={line} strokeWidth="2.5" />
          <path d="M26 34 c-1 0-2-.5-2.6-1 -7-5.6-15-11-15-19 0-4.6 3.5-8 7.6-8 3.5 0 6.5 2 10 5.5 3.5-3.5 6.5-5.5 10-5.5 4 0 7.6 3.4 7.6 8 0 8-8 13.4-15 19 -.6.5-1.6 1-2.6 1z" fill="#fff" opacity="0.9" />
        </g>
      )}
      {holding === 'flower' && (
        <g transform="translate(100 168)">
          <path d="M0 0 V26" stroke="#6fbf73" strokeWidth="4" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-12" rx="8" ry="12" fill="#ffd166" stroke={line} strokeWidth="2" transform={`rotate(${r})`} />
          ))}
          <circle r="7" fill="#ff9f43" stroke={line} strokeWidth="2" />
        </g>
      )}
      {holding === 'tea' && (
        <g transform="translate(76 150)">
          <path d="M8 6 h40 l-4 34 a6 6 0 0 1 -6 5 h-20 a6 6 0 0 1 -6 -5 z" fill="#e8f6ff" stroke={line} strokeWidth="3" strokeLinejoin="round" />
          <path d="M11 22 h34 l-2 18 a4 4 0 0 1 -4 3 h-22 a4 4 0 0 1 -4 -3 z" fill="#a8dcf7" opacity="0.8" />
          <path d="M18 -6 q-4 -6 0 -12 M30 -4 q-4 -6 0 -12" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
        </g>
      )}
      {holding === 'heart' && (
        <path
          d="M100 196 c-2 0-4-1-5-2 -14-11-28-20-28-34 0-8 6-14 14-14 7 0 12 4 19 10 7-6 12-10 19-10 8 0 14 6 14 14 0 14-14 23-28 34-1 1-3 2-5 2z"
          fill="#ff5d8f"
          stroke={line}
          strokeWidth="3"
        />
      )}
      {/* paws */}
      <ellipse cx="70" cy="168" rx="12" ry="10" fill="#fff4f7" stroke={line} strokeWidth="3" />
      <ellipse cx="130" cy="168" rx="12" ry="10" fill="#fff4f7" stroke={line} strokeWidth="3" />
    </svg>
  );
}
