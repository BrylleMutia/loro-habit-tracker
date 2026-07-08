import Svg, { G, Path, Rect } from "react-native-svg";

export function PixelHeaderBackground() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 350 210" preserveAspectRatio="none">
      <G shapeRendering="crispEdges">
        <Rect x="0" y="0" width="350" height="210" fill="#DFF5FF" />
        <Rect x="0" y="118" width="350" height="92" fill="#BFEBCD" />
        <Rect x="0" y="142" width="350" height="68" fill="#96D9AD" />
        <Rect x="0" y="166" width="350" height="44" fill="#74C890" />
        <Rect x="0" y="190" width="350" height="20" fill="#5EAF7C" />

        <Path d="M0 116H18V106H34V94H54V82H72V210H0Z" fill="#9DCEB4" />
        <Path d="M276 112H292V100H312V88H334V76H350V210H276Z" fill="#9ECFB6" />
        <Path d="M214 130H232V118H252V106H274V210H214Z" fill="#AFDDC5" />
        <Path d="M72 132H88V120H108V108H126V210H72Z" fill="#A7D8BE" />

        <Rect x="248" y="48" width="42" height="12" fill="#FFFFFF" />
        <Rect x="262" y="36" width="18" height="12" fill="#FFFFFF" />
        <Rect x="282" y="42" width="20" height="18" fill="#FFFFFF" />
        <Rect x="292" y="54" width="22" height="10" fill="#FFFFFF" />

        <Rect x="40" y="72" width="38" height="10" fill="#FFFFFF" opacity="0.96" />
        <Rect x="54" y="62" width="18" height="10" fill="#FFFFFF" opacity="0.96" />
        <Rect x="16" y="96" width="26" height="8" fill="#FFFFFF" opacity="0.82" />

        <Rect x="168" y="88" width="74" height="14" fill="#75C986" />
        <Rect x="156" y="102" width="102" height="14" fill="#64B879" />
        <Rect x="144" y="116" width="128" height="16" fill="#56A86E" />
        <Rect x="132" y="132" width="154" height="18" fill="#4C9865" />
        <Rect x="172" y="74" width="18" height="14" fill="#91DFA0" />
        <Rect x="232" y="78" width="16" height="10" fill="#91DFA0" />
        <Rect x="202" y="66" width="10" height="10" fill="#A9EDB4" />

        <Rect x="228" y="120" width="18" height="10" fill="#F46F64" />
        <Rect x="246" y="116" width="8" height="8" fill="#FF9C90" />
        <Rect x="236" y="110" width="6" height="6" fill="#56A6F7" />
        <Rect x="254" y="126" width="8" height="8" fill="#F8C747" />

        <Rect x="104" y="150" width="24" height="10" fill="#6DBB7F" />
        <Rect x="116" y="140" width="16" height="10" fill="#87D494" />
        <Rect x="122" y="160" width="22" height="10" fill="#5CAA73" />

        <Rect x="304" y="132" width="18" height="10" fill="#87D494" />
        <Rect x="316" y="122" width="14" height="10" fill="#A9EDB4" />
      </G>
    </Svg>
  );
}
