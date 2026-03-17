const MAX_MINUTES = 25;

interface Props {
  size: number;
  taskColor?: string;
}

export function TimerDialSvg({ size, taskColor = "#E63946" }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerPlateR = outerR - 4;

  const ticks = Array.from({ length: MAX_MINUTES }, (_, i) => i + 1);

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Drop shadow filter */}
      <defs>
        <filter id="dialShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
        </filter>
        <radialGradient id="plateGradient" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fdfaf4" />
          <stop offset="100%" stopColor="#e8dfc8" />
        </radialGradient>
      </defs>

      {/* Bezel ring */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="#c8b89a"
        filter="url(#dialShadow)"
      />

      {/* Inner plate */}
      <circle cx={cx} cy={cy} r={innerPlateR} fill="url(#plateGradient)" />

      {/* Colored arc ring when task selected */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR - 2}
        fill="none"
        stroke={taskColor}
        strokeWidth={4}
        opacity={0.35}
      />

      {/* Tick marks */}
      {ticks.map((i) => {
        const angle = ((i / MAX_MINUTES) * 360 - 90) * (Math.PI / 180);
        const isMajor = i % 5 === 0;
        const tickStart = innerPlateR - (isMajor ? 20 : 12);
        const tickEnd = innerPlateR - 2;
        return (
          <line
            key={i}
            x1={cx + tickStart * Math.cos(angle)}
            y1={cy + tickStart * Math.sin(angle)}
            x2={cx + tickEnd * Math.cos(angle)}
            y2={cy + tickEnd * Math.sin(angle)}
            stroke={isMajor ? "#5c4a2a" : "#a89070"}
            strokeWidth={isMajor ? 2.5 : 1.2}
            strokeLinecap="round"
          />
        );
      })}

      {/* Minute labels at major ticks */}
      {ticks
        .filter((i) => i % 5 === 0)
        .map((i) => {
          const angle = ((i / MAX_MINUTES) * 360 - 90) * (Math.PI / 180);
          const labelR = innerPlateR - 34;
          return (
            <text
              key={i}
              x={cx + labelR * Math.cos(angle)}
              y={cy + labelR * Math.sin(angle) + 4}
              textAnchor="middle"
              fontSize={11}
              fill="#5c4a2a"
              fontFamily="Georgia, serif"
              fontWeight="500"
            >
              {i}
            </text>
          );
        })}
    </svg>
  );
}
