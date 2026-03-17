"use client";

// Split complementary colors to #C30232 background
const PRESETS = [
  "#23332A",
  "#332327",
  "#468B2F",
  "#256D48",
  "#6D2537",
  "#31C202",
  "#02C25E",
];

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
          style={{
            backgroundColor: color,
            boxShadow:
              value === color
                ? "0 0 0 2px #CAECFC, 0 0 0 4px " + color
                : "0 1px 3px rgba(0,0,0,0.4)",
          }}
          aria-label={`Select color ${color}`}
        />
      ))}
      {/* Custom color */}
      <label
        className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center border-2 border-dashed border-fg/40 hover:border-fg/70 transition-colors text-fg/60 hover:text-fg text-xs"
        title="Custom color"
      >
        +
        <input
          type="color"
          className="sr-only"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
