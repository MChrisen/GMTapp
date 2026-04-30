import { Children, cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { FigureId } from '../data/types';

const COMMON = {
  width: 360,
  height: 220,
};

type FigureProps = {
  id: FigureId | undefined;
  title?: string;
};

const PALETTE_MAP: Record<string, string> = {
  '#67e8f9': '#0a84ff',
  '#a7f3d0': '#2c9b56',
  '#fda4af': '#c0394b',
  '#fcd34d': '#a07300',
  '#9fb0c8': '#6e6e73',
  '#1f2a44': '#eef1f6',
  '#0f172a': '#9098a6',
  'rgba(103,232,249,0.18)': 'rgba(10, 132, 255, 0.1)',
  'rgba(103,232,249,0.15)': 'rgba(10, 132, 255, 0.08)',
  'rgba(167,243,208,0.18)': 'rgba(44, 155, 86, 0.1)',
  'rgba(253,164,175,0.18)': 'rgba(192, 57, 75, 0.1)',
  'rgba(252,211,77,0.18)': 'rgba(160, 115, 0, 0.1)',
};

type PaletteProps = {
  fill?: string;
  stroke?: string;
  color?: string;
  children?: ReactNode;
};

const retoneFigureNode = (node: ReactNode): ReactNode => {
  if (!isValidElement<PaletteProps>(node)) return node;

  const nextProps: PaletteProps = {};
  if (node.props.fill && PALETTE_MAP[node.props.fill]) nextProps.fill = PALETTE_MAP[node.props.fill];
  if (node.props.stroke && PALETTE_MAP[node.props.stroke]) nextProps.stroke = PALETTE_MAP[node.props.stroke];
  if (node.props.color && PALETTE_MAP[node.props.color]) nextProps.color = PALETTE_MAP[node.props.color];

  const nextChildren =
    node.props.children === undefined ? node.props.children : Children.map(node.props.children, (child) => retoneFigureNode(child));

  return cloneElement(node, nextProps, nextChildren);
};

export function Figure({ id, title }: FigureProps) {
  if (!id) return null;
  const figure = FIGURES[id];
  if (!figure) return null;
  const tonedFigure = retoneFigureNode(figure);
  return (
    <figure className="figure">
      <svg viewBox={`0 0 ${COMMON.width} ${COMMON.height}`} role="img" aria-label={title ?? id}>
        {tonedFigure}
      </svg>
      {title && <figcaption>{title}</figcaption>}
    </figure>
  );
}

const FIGURES: Record<FigureId, ReactNode> = {
  projectile: (
    <g>
      <line x1="20" y1="190" x2="340" y2="190" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="200" x2="30" y2="42" stroke="#9fb0c8" strokeWidth="1" strokeDasharray="3 4" />
      <text x="326" y="184" fontSize="11" fill="#9fb0c8">x</text>
      <text x="36" y="48" fontSize="11" fill="#9fb0c8">y</text>
      <path d="M 30 190 Q 180 30 330 190" fill="none" stroke="#67e8f9" strokeWidth="2.4" strokeDasharray="4 6" />
      <circle cx="30" cy="190" r="4" fill="#67e8f9" />
      <circle cx="180" cy="78" r="4" fill="#a7f3d0" />
      <circle cx="330" cy="190" r="4" fill="#fda4af" />
      <line x1="30" y1="190" x2="80" y2="150" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#arrow)" />
      <line x1="30" y1="190" x2="80" y2="190" stroke="#67e8f9" strokeWidth="1.8" markerEnd="url(#arrow)" />
      <line x1="80" y1="190" x2="80" y2="150" stroke="#67e8f9" strokeWidth="1.8" markerEnd="url(#arrow)" />
      <line x1="196" y1="74" x2="196" y2="114" stroke="#fda4af" strokeWidth="1.8" markerEnd="url(#arrow-red)" />
      <text x="86" y="148" fontSize="13" fill="#a7f3d0">v₀</text>
      <text x="54" y="205" fontSize="11" fill="#67e8f9">v₀x</text>
      <text x="84" y="174" fontSize="11" fill="#67e8f9">v₀y</text>
      <text x="202" y="112" fontSize="11" fill="#fda4af">g</text>
      <text x="60" y="186" fontSize="11" fill="#9fb0c8">θ</text>
      <text x="170" y="68" fontSize="12" fill="#a7f3d0">toppunkt</text>
      <text x="305" y="208" fontSize="12" fill="#fda4af">nedslag</text>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
  'projectile-cliff': (
    <g>
      <rect x="20" y="120" width="80" height="80" fill="#1f2a44" stroke="currentColor" />
      <line x1="20" y1="200" x2="340" y2="200" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 100 120 Q 220 30 320 200" fill="none" stroke="#67e8f9" strokeWidth="2.4" strokeDasharray="4 6" />
      <circle cx="100" cy="120" r="4" fill="#67e8f9" />
      <circle cx="320" cy="200" r="4" fill="#fda4af" />
      <line x1="100" y1="120" x2="160" y2="78" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#cliff-arrow)" />
      <line x1="210" y1="70" x2="210" y2="112" stroke="#fda4af" strokeWidth="1.8" markerEnd="url(#cliff-g)" />
      <line x1="270" y1="200" x2="306" y2="200" stroke="#fcd34d" strokeWidth="1.8" markerEnd="url(#cliff-u)" />
      <text x="166" y="76" fontSize="13" fill="#a7f3d0">v₀</text>
      <text x="120" y="118" fontSize="11" fill="#9fb0c8">θ</text>
      <text x="40" y="160" fontSize="11" fill="#9fb0c8">y₀</text>
      <text x="220" y="220" fontSize="12" fill="#9fb0c8">x</text>
      <text x="216" y="108" fontSize="11" fill="#fda4af">g</text>
      <text x="272" y="192" fontSize="11" fill="#fcd34d">u mål</text>
      <path d="M 270 200 q 10 -10 20 0 q 10 10 20 0" stroke="#67e8f9" strokeWidth="1.5" fill="none" />
      <defs>
        <marker id="cliff-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
        <marker id="cliff-g" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 10 L 10 0 z" fill="#fda4af" />
        </marker>
        <marker id="cliff-u" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fcd34d" />
        </marker>
      </defs>
    </g>
  ),
  incline: (
    <g>
      <polygon points="40,180 320,180 320,90" fill="#1f2a44" stroke="currentColor" strokeWidth="1.5" />
      <rect x="180" y="125" width="46" height="30" fill="#67e8f9" stroke="#0f172a" transform="rotate(-18 203 140)" />
      <line x1="200" y1="140" x2="200" y2="196" stroke="#fda4af" strokeWidth="2" markerEnd="url(#incline-down)" />
      <line x1="200" y1="140" x2="240" y2="170" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#incline-green)" />
      <line x1="200" y1="140" x2="168" y2="116" stroke="#fcd34d" strokeWidth="2" markerEnd="url(#incline-gold)" />
      <text x="244" y="170" fontSize="13" fill="#a7f3d0">m g sinθ</text>
      <line x1="200" y1="140" x2="170" y2="105" stroke="#fda4af" strokeWidth="2" markerEnd="url(#incline-red)" />
      <text x="207" y="196" fontSize="12" fill="#fda4af">mg</text>
      <text x="120" y="103" fontSize="13" fill="#fda4af">N</text>
      <text x="118" y="128" fontSize="12" fill="#fcd34d">f</text>
      <line x1="200" y1="140" x2="200" y2="180" stroke="#9fb0c8" strokeWidth="1.4" strokeDasharray="3 4" />
      <line x1="165" y1="166" x2="235" y2="144" stroke="#9fb0c8" strokeWidth="1" strokeDasharray="3 4" />
      <text x="60" y="174" fontSize="12" fill="#9fb0c8">θ</text>
      <defs>
        <marker id="incline-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 10 L 10 0 z" fill="#fda4af" />
        </marker>
        <marker id="incline-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
        <marker id="incline-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fcd34d" />
        </marker>
        <marker id="incline-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
  'incline-cylinder': (
    <g>
      <polygon points="20,180 250,180 250,90" fill="#1f2a44" stroke="currentColor" strokeWidth="1.5" />
      <rect x="160" y="135" width="40" height="26" fill="#67e8f9" stroke="#0f172a" transform="rotate(-22 180 148)" />
      <circle cx="300" cy="100" r="34" fill="none" stroke="#a7f3d0" strokeWidth="2.2" />
      <circle cx="300" cy="100" r="4" fill="#a7f3d0" />
      <line x1="190" y1="140" x2="270" y2="100" stroke="#fcd34d" strokeWidth="1.6" strokeDasharray="3 4" />
      <line x1="181" y1="148" x2="218" y2="122" stroke="#fcd34d" strokeWidth="2" markerEnd="url(#ic-t)" />
      <line x1="181" y1="148" x2="215" y2="178" stroke="#fda4af" strokeWidth="2" markerEnd="url(#ic-mg)" />
      <path d="M 320 78 A 32 32 0 0 1 330 118" fill="none" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#ic-alpha)" />
      <text x="220" y="116" fontSize="11" fill="#fcd34d">snor T</text>
      <text x="224" y="132" fontSize="11" fill="#fcd34d">T</text>
      <text x="218" y="180" fontSize="11" fill="#fda4af">mg</text>
      <text x="324" y="102" fontSize="11" fill="#a7f3d0">α</text>
      <text x="280" y="158" fontSize="11" fill="#a7f3d0">cylinder M, R</text>
      <text x="60" y="174" fontSize="12" fill="#9fb0c8">θ, μₖ</text>
      <defs>
        <marker id="ic-t" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fcd34d" />
        </marker>
        <marker id="ic-mg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fda4af" />
        </marker>
        <marker id="ic-alpha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
      </defs>
    </g>
  ),
  atwood: (
    <g>
      <line x1="180" y1="20" x2="180" y2="50" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="180" cy="60" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="166" y1="60" x2="120" y2="170" stroke="#a7f3d0" strokeWidth="2" />
      <line x1="194" y1="60" x2="240" y2="135" stroke="#a7f3d0" strokeWidth="2" />
      <rect x="100" y="170" width="40" height="30" fill="#67e8f9" stroke="#0f172a" />
      <rect x="220" y="135" width="40" height="38" fill="#fda4af" stroke="#0f172a" />
      <text x="92" y="162" fontSize="12" fill="#67e8f9">m₁</text>
      <text x="232" y="128" fontSize="12" fill="#fda4af">m₂</text>
      <line x1="120" y1="170" x2="120" y2="146" stroke="#a7f3d0" strokeWidth="1.8" markerEnd="url(#aup)" />
      <line x1="120" y1="200" x2="120" y2="218" stroke="#fda4af" strokeWidth="1.8" markerEnd="url(#adown)" />
      <line x1="240" y1="135" x2="240" y2="112" stroke="#a7f3d0" strokeWidth="1.8" markerEnd="url(#aup)" />
      <line x1="240" y1="173" x2="240" y2="196" stroke="#fda4af" strokeWidth="1.8" markerEnd="url(#adown)" />
      <text x="126" y="150" fontSize="10" fill="#a7f3d0">T</text>
      <text x="126" y="216" fontSize="10" fill="#fda4af">m₁g</text>
      <text x="246" y="118" fontSize="10" fill="#a7f3d0">T</text>
      <text x="246" y="194" fontSize="10" fill="#fda4af">m₂g</text>
      <line x1="120" y1="206" x2="120" y2="186" stroke="#67e8f9" strokeWidth="2" markerEnd="url(#aup)" />
      <line x1="240" y1="178" x2="240" y2="200" stroke="#fda4af" strokeWidth="2" markerEnd="url(#adown)" />
      <defs>
        <marker id="aup" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 10 L 5 0 L 10 10 z" fill="#67e8f9" />
        </marker>
        <marker id="adown" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 10 L 10 0 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
  'pulley-block': (
    <g>
      <line x1="180" y1="20" x2="180" y2="60" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="180" cy="70" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="166" y1="70" x2="80" y2="180" stroke="#a7f3d0" strokeWidth="2" />
      <line x1="194" y1="70" x2="280" y2="180" stroke="#a7f3d0" strokeWidth="2" />
      <rect x="60" y="180" width="40" height="30" fill="#67e8f9" stroke="#0f172a" />
      <rect x="260" y="180" width="40" height="30" fill="#fda4af" stroke="#0f172a" />
    </g>
  ),
  'cable-statics': (
    <g>
      <line x1="20" y1="40" x2="340" y2="40" stroke="currentColor" strokeWidth="1.5" />
      <line x1="120" y1="40" x2="180" y2="150" stroke="#a7f3d0" strokeWidth="2.2" />
      <line x1="240" y1="40" x2="180" y2="150" stroke="#a7f3d0" strokeWidth="2.2" />
      <line x1="180" y1="150" x2="180" y2="195" stroke="#fda4af" strokeWidth="2" markerEnd="url(#statics-w)" />
      <line x1="180" y1="150" x2="138" y2="73" stroke="#a7f3d0" strokeWidth="1.8" markerEnd="url(#statics-t)" />
      <line x1="180" y1="150" x2="222" y2="73" stroke="#a7f3d0" strokeWidth="1.8" markerEnd="url(#statics-t)" />
      <rect x="160" y="195" width="40" height="20" fill="#fda4af" stroke="#0f172a" />
      <text x="148" y="106" fontSize="13" fill="#a7f3d0">T₁</text>
      <text x="220" y="106" fontSize="13" fill="#a7f3d0">T₂</text>
      <text x="190" y="180" fontSize="13" fill="#fda4af">W = mg</text>
      <text x="138" y="58" fontSize="11" fill="#9fb0c8">θ₁</text>
      <text x="222" y="58" fontSize="11" fill="#9fb0c8">θ₂</text>
      <defs>
        <marker id="statics-w" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 10 L 10 0 z" fill="#fda4af" />
        </marker>
        <marker id="statics-t" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
      </defs>
    </g>
  ),
  rotation: (
    <g>
      <circle cx="180" cy="110" r="80" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="180" y1="110" x2="245" y2="65" stroke="#67e8f9" strokeWidth="2" />
      <text x="220" y="55" fontSize="13" fill="#67e8f9">r</text>
      <path d="M 180 30 A 80 80 0 0 1 260 110" fill="none" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#arrow2)" />
      <text x="252" y="44" fontSize="13" fill="#a7f3d0">ω</text>
      <circle cx="245" cy="65" r="4" fill="#fda4af" />
      <text x="180" y="118" fontSize="13" fill="#fcd34d">τ = r F sinθ</text>
      <defs>
        <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
      </defs>
    </g>
  ),
  orbit: (
    <g>
      <circle cx="180" cy="110" r="32" fill="#1f2a44" stroke="#fda4af" strokeWidth="1.5" />
      <text x="166" y="114" fontSize="11" fill="#fda4af">M</text>
      <ellipse cx="180" cy="110" rx="120" ry="80" fill="none" stroke="#a7f3d0" strokeWidth="2" strokeDasharray="4 5" />
      <circle cx="300" cy="110" r="6" fill="#67e8f9" />
      <line x1="180" y1="110" x2="300" y2="110" stroke="#9fb0c8" strokeWidth="1.4" strokeDasharray="3 3" />
      <text x="225" y="106" fontSize="13" fill="#9fb0c8">r</text>
      <line x1="300" y1="110" x2="300" y2="60" stroke="#67e8f9" strokeWidth="2" />
      <text x="306" y="80" fontSize="13" fill="#67e8f9">v</text>
    </g>
  ),
  'pv-cycle': (
    <g>
      <line x1="40" y1="200" x2="320" y2="200" stroke="currentColor" />
      <line x1="40" y1="200" x2="40" y2="20" stroke="currentColor" />
      <text x="320" y="216" fontSize="12" fill="#9fb0c8">V</text>
      <text x="22" y="20" fontSize="12" fill="#9fb0c8">p</text>
      <polygon points="80,160 240,80 240,160" fill="rgba(103,232,249,0.18)" stroke="#67e8f9" strokeWidth="2" />
      <line x1="80" y1="160" x2="240" y2="160" stroke="#67e8f9" strokeWidth="2" markerEnd="url(#pv-a)" />
      <line x1="240" y1="160" x2="240" y2="80" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#pv-b)" />
      <line x1="240" y1="80" x2="80" y2="160" stroke="#fda4af" strokeWidth="2" markerEnd="url(#pv-c)" />
      <text x="120" y="174" fontSize="11" fill="#67e8f9">isobar</text>
      <text x="246" y="124" fontSize="11" fill="#a7f3d0">isochor</text>
      <text x="118" y="106" fontSize="11" fill="#fda4af">adiabat / isoterm</text>
      <defs>
        <marker id="pv-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#67e8f9" />
        </marker>
        <marker id="pv-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
        <marker id="pv-c" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
  'pv-isotherm': (
    <g>
      <line x1="40" y1="200" x2="320" y2="200" stroke="currentColor" />
      <line x1="40" y1="200" x2="40" y2="20" stroke="currentColor" />
      <path d="M 60 60 Q 110 200 320 200" fill="none" stroke="#67e8f9" strokeWidth="2.2" />
      <text x="200" y="116" fontSize="12" fill="#67e8f9">pV = konstant</text>
    </g>
  ),
  'pv-adiabat': (
    <g>
      <line x1="40" y1="200" x2="320" y2="200" stroke="currentColor" />
      <line x1="40" y1="200" x2="40" y2="20" stroke="currentColor" />
      <path d="M 60 50 Q 90 220 320 200" fill="none" stroke="#fda4af" strokeWidth="2.2" />
      <path d="M 60 80 Q 100 210 320 200" fill="none" stroke="#67e8f9" strokeWidth="2.2" strokeDasharray="3 4" />
      <text x="200" y="106" fontSize="12" fill="#fda4af">
        <tspan>pV</tspan>
        <tspan dy="-5" fontSize="9">γ</tspan>
        <tspan dy="5"> = konst (adiabat)</tspan>
      </text>
      <text x="200" y="148" fontSize="12" fill="#67e8f9">pV = konst (isoterm)</text>
    </g>
  ),
  'gas-bottle': (
    <g>
      <rect x="140" y="50" width="80" height="160" rx="14" fill="#1f2a44" stroke="currentColor" strokeWidth="1.5" />
      <rect x="170" y="30" width="20" height="20" fill="currentColor" />
      <circle cx="160" cy="100" r="3" fill="#67e8f9" />
      <circle cx="200" cy="120" r="3" fill="#67e8f9" />
      <circle cx="180" cy="160" r="3" fill="#67e8f9" />
      <circle cx="190" cy="180" r="3" fill="#67e8f9" />
      <text x="240" y="120" fontSize="12" fill="#a7f3d0">p, V, T, n</text>
      <text x="240" y="138" fontSize="11" fill="#9fb0c8">pV = nRT</text>
    </g>
  ),
  calorimetry: (
    <g>
      <rect x="60" y="80" width="240" height="110" rx="10" fill="#1f2a44" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 80 150 Q 120 110 160 150 T 280 150" fill="none" stroke="#67e8f9" strokeWidth="2" />
      <rect x="180" y="120" width="30" height="30" fill="#a7f3d0" stroke="#0f172a" />
      <text x="216" y="140" fontSize="11" fill="#a7f3d0">is: m, L</text>
      <text x="80" y="178" fontSize="11" fill="#67e8f9">vand: m, c</text>
      <text x="80" y="74" fontSize="11" fill="#9fb0c8">isoleret system: ΣQ = 0</text>
    </g>
  ),
  'wall-rvalue': (
    <g>
      <rect x="60" y="60" width="40" height="120" fill="rgba(103,232,249,0.15)" stroke="#67e8f9" />
      <rect x="100" y="60" width="60" height="120" fill="rgba(167,243,208,0.18)" stroke="#a7f3d0" />
      <rect x="160" y="60" width="50" height="120" fill="rgba(253,164,175,0.18)" stroke="#fda4af" />
      <rect x="210" y="60" width="40" height="120" fill="rgba(252,211,77,0.18)" stroke="#fcd34d" />
      <text x="60" y="50" fontSize="11" fill="#67e8f9">R₁</text>
      <text x="116" y="50" fontSize="11" fill="#a7f3d0">R₂</text>
      <text x="172" y="50" fontSize="11" fill="#fda4af">R₃</text>
      <text x="218" y="50" fontSize="11" fill="#fcd34d">R₄</text>
      <line x1="40" y1="120" x2="60" y2="120" stroke="#fda4af" strokeWidth="2" />
      <line x1="250" y1="120" x2="280" y2="120" stroke="#67e8f9" strokeWidth="2" />
      <text x="18" y="124" fontSize="11" fill="#fda4af">T varm</text>
      <text x="284" y="124" fontSize="11" fill="#67e8f9">T kold</text>
      <text x="120" y="200" fontSize="12" fill="#9fb0c8">P = A ΔT / ΣR</text>
    </g>
  ),
  'cop-freezer': (
    <g>
      <rect x="40" y="50" width="120" height="150" rx="12" fill="#1f2a44" stroke="#67e8f9" strokeWidth="2" />
      <text x="60" y="80" fontSize="12" fill="#67e8f9">koldt rum</text>
      <text x="60" y="100" fontSize="11" fill="#9fb0c8">varme udtages</text>
      <rect x="200" y="80" width="120" height="100" rx="10" fill="rgba(253,164,175,0.18)" stroke="#fda4af" />
      <text x="220" y="110" fontSize="13" fill="#fda4af">varm side</text>
      <text x="220" y="148" fontSize="11" fill="#9fb0c8">afgivet = fjernet + W</text>
      <line x1="160" y1="100" x2="200" y2="100" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#arrow3)" />
      <text x="166" y="92" fontSize="11" fill="#a7f3d0">W</text>
      <text x="40" y="218" fontSize="12" fill="#67e8f9">COP = fjernet varme / W</text>
      <defs>
        <marker id="arrow3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
      </defs>
    </g>
  ),
  'free-body': (
    <g>
      <rect x="150" y="100" width="60" height="40" fill="#67e8f9" stroke="#0f172a" />
      <line x1="180" y1="120" x2="180" y2="200" stroke="#fda4af" strokeWidth="2" markerEnd="url(#down)" />
      <line x1="180" y1="120" x2="180" y2="40" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#up)" />
      <line x1="180" y1="120" x2="280" y2="120" stroke="#fcd34d" strokeWidth="2" markerEnd="url(#right)" />
      <text x="186" y="200" fontSize="12" fill="#fda4af">F_g</text>
      <text x="186" y="50" fontSize="12" fill="#a7f3d0">N</text>
      <text x="280" y="116" fontSize="12" fill="#fcd34d">F</text>
      <defs>
        <marker id="up" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 10 L 5 0 L 10 10 z" fill="#a7f3d0" />
        </marker>
        <marker id="down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 10 L 10 0 z" fill="#fda4af" />
        </marker>
        <marker id="right" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fcd34d" />
        </marker>
      </defs>
    </g>
  ),
  spring: (
    <g>
      <line x1="20" y1="100" x2="50" y2="100" stroke="currentColor" />
      <path d="M 50 100 L 60 80 L 80 120 L 100 80 L 120 120 L 140 80 L 160 120 L 180 100" fill="none" stroke="#67e8f9" strokeWidth="2" />
      <rect x="180" y="80" width="40" height="40" fill="#67e8f9" stroke="#0f172a" />
      <line x1="220" y1="100" x2="280" y2="100" stroke="#fda4af" strokeWidth="2" markerEnd="url(#right2)" />
      <text x="240" y="92" fontSize="12" fill="#fda4af">x</text>
      <defs>
        <marker id="right2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
  collision: (
    <g>
      <rect x="60" y="100" width="60" height="40" fill="#67e8f9" stroke="#0f172a" />
      <rect x="220" y="100" width="60" height="40" fill="#fda4af" stroke="#0f172a" />
      <line x1="120" y1="120" x2="170" y2="120" stroke="#67e8f9" strokeWidth="2" markerEnd="url(#right3)" />
      <line x1="220" y1="120" x2="170" y2="120" stroke="#fda4af" strokeWidth="2" markerEnd="url(#left3)" />
      <text x="76" y="92" fontSize="12" fill="#67e8f9">m₁ v₁</text>
      <text x="232" y="92" fontSize="12" fill="#fda4af">m₂ v₂</text>
      <text x="120" y="180" fontSize="12" fill="#9fb0c8">Σp_før = Σp_efter</text>
      <defs>
        <marker id="right3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#67e8f9" />
        </marker>
        <marker id="left3" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 10 0 L 0 5 L 10 10 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
  'center-of-mass': (
    <g>
      <polygon points="60,180 280,180 170,40" fill="rgba(103,232,249,0.18)" stroke="#67e8f9" strokeWidth="2" />
      <circle cx="60" cy="180" r="6" fill="#a7f3d0" />
      <circle cx="280" cy="180" r="6" fill="#a7f3d0" />
      <circle cx="170" cy="40" r="6" fill="#a7f3d0" />
      <circle cx="170" cy="133" r="5" fill="#fda4af" />
      <text x="174" y="128" fontSize="11" fill="#fda4af">CM</text>
      <text x="40" y="200" fontSize="11" fill="#a7f3d0">m₁</text>
      <text x="284" y="200" fontSize="11" fill="#a7f3d0">m₂</text>
      <text x="174" y="32" fontSize="11" fill="#a7f3d0">m₃</text>
    </g>
  ),
  'vector-relative': (
    <g>
      <line x1="50" y1="170" x2="200" y2="170" stroke="#67e8f9" strokeWidth="2" markerEnd="url(#right4)" />
      <line x1="200" y1="170" x2="290" y2="100" stroke="#a7f3d0" strokeWidth="2" markerEnd="url(#right5)" />
      <line x1="50" y1="170" x2="290" y2="100" stroke="#fda4af" strokeWidth="2" strokeDasharray="3 4" markerEnd="url(#right6)" />
      <text x="120" y="160" fontSize="12" fill="#67e8f9">v_A/B</text>
      <text x="240" y="120" fontSize="12" fill="#a7f3d0">v_B/C</text>
      <text x="170" y="100" fontSize="12" fill="#fda4af">v_A/C</text>
      <defs>
        <marker id="right4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#67e8f9" />
        </marker>
        <marker id="right5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a7f3d0" />
        </marker>
        <marker id="right6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#fda4af" />
        </marker>
      </defs>
    </g>
  ),
};
