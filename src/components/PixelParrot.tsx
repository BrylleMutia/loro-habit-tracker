import Svg, { G, Rect } from "react-native-svg";

type PixelParrotProps = {
  size: "sm" | "md" | "lg";
};

const parrotSizes = {
  sm: { width: 60, height: 70 },
  md: { width: 84, height: 98 },
  lg: { width: 126, height: 147 }
} as const;

export function PixelParrot({ size }: PixelParrotProps) {
  const dimensions = parrotSizes[size];

  return (
    <Svg width={dimensions.width} height={dimensions.height} viewBox="0 0 128 148">
      <G shapeRendering="crispEdges">
        <Rect x="32" y="4" width="44" height="8" fill="#0E4F8A" />
        <Rect x="24" y="12" width="64" height="8" fill="#1768AC" />
        <Rect x="18" y="20" width="76" height="12" fill="#238BD5" />
        <Rect x="14" y="32" width="78" height="12" fill="#2FA7EA" />
        <Rect x="12" y="44" width="70" height="14" fill="#2FA7EA" />
        <Rect x="16" y="58" width="60" height="12" fill="#238BD5" />
        <Rect x="24" y="70" width="48" height="12" fill="#1768AC" />
        <Rect x="34" y="82" width="34" height="10" fill="#135A99" />

        <Rect x="30" y="42" width="38" height="54" fill="#F46F64" />
        <Rect x="38" y="50" width="22" height="38" fill="#FF8177" />
        <Rect x="60" y="58" width="14" height="38" fill="#D94E55" />
        <Rect x="28" y="52" width="8" height="36" fill="#D94E55" />
        <Rect x="44" y="62" width="16" height="18" fill="#FF6E68" />

        <Rect x="72" y="62" width="28" height="10" fill="#66D184" />
        <Rect x="76" y="72" width="34" height="12" fill="#56C878" />
        <Rect x="82" y="84" width="34" height="12" fill="#46B56F" />
        <Rect x="88" y="96" width="28" height="12" fill="#36A96A" />
        <Rect x="96" y="108" width="18" height="10" fill="#2F8C5E" />
        <Rect x="106" y="118" width="10" height="8" fill="#24784F" />

        <Rect x="76" y="34" width="26" height="10" fill="#FFE06B" />
        <Rect x="94" y="44" width="24" height="10" fill="#F8C747" />
        <Rect x="104" y="54" width="18" height="8" fill="#F5A33B" />
        <Rect x="112" y="62" width="10" height="8" fill="#D9782C" />
        <Rect x="82" y="44" width="16" height="8" fill="#FFF1A4" />

        <Rect x="54" y="24" width="16" height="16" fill="#0B2551" />
        <Rect x="58" y="28" width="6" height="6" fill="#FFFDF7" />
        <Rect x="70" y="24" width="8" height="8" fill="#72D3FF" opacity="0.75" />
        <Rect x="42" y="18" width="10" height="6" fill="#72D3FF" opacity="0.42" />

        <Rect x="18" y="26" width="8" height="10" fill="#0B2551" opacity="0.28" />
        <Rect x="12" y="38" width="6" height="22" fill="#155E9E" />
        <Rect x="20" y="92" width="52" height="8" fill="#0B2551" opacity="0.18" />
        <Rect x="28" y="100" width="38" height="6" fill="#0B2551" opacity="0.16" />

        <Rect x="34" y="100" width="10" height="28" fill="#0B2551" />
        <Rect x="68" y="100" width="10" height="28" fill="#0B2551" />
        <Rect x="28" y="128" width="24" height="8" fill="#F5B739" />
        <Rect x="64" y="128" width="24" height="8" fill="#F5B739" />
        <Rect x="30" y="136" width="16" height="6" fill="#D58B2A" />
        <Rect x="66" y="136" width="16" height="6" fill="#D58B2A" />
        <Rect x="24" y="132" width="8" height="4" fill="#FFE06B" />
        <Rect x="60" y="132" width="8" height="4" fill="#FFE06B" />
      </G>
    </Svg>
  );
}
