export type PhysicalConstant = {
  symbol: string;
  latex: string;
  value: string;
  note: string;
  category: 'Mekanik' | 'Gravitation' | 'Termodynamik' | 'SI og enheder' | 'Stoffer';
};

/** Eksamensrelevante konstanter (Appendix E + typiske opgaver). */
export const PHYSICAL_CONSTANTS: PhysicalConstant[] = [
  // Mekanik
  { symbol: 'g', latex: 'g', value: '9,82 m/s²', note: 'Tyngdeacceleration ved Jordens overflade', category: 'Mekanik' },
  { symbol: 'g_Mars', latex: 'g_{\\text{Mars}}', value: '3,7 m/s²', note: 'Tyngdeacceleration på Mars (typisk i opgaver)', category: 'Mekanik' },
  { symbol: '1 rpm', latex: '1\\,\\text{rpm}', value: '2π/60 rad/s', note: 'Vinkelhastighed fra omdrejninger pr. minut', category: 'Mekanik' },
  { symbol: 'π', latex: '\\pi', value: '3,14159…', note: 'Cirkel, banebevægelse, fase', category: 'Mekanik' },

  // Gravitation og himmellegemer
  { symbol: 'G', latex: 'G', value: '6,674 × 10⁻¹¹ N·m²/kg²', note: 'Gravitationskonstant', category: 'Gravitation' },
  { symbol: 'M_J', latex: 'M_{\\oplus}', value: '5,97 × 10²⁴ kg', note: 'Jordens masse', category: 'Gravitation' },
  { symbol: 'R_J', latex: 'R_{\\oplus}', value: '6,37 × 10⁶ m', note: 'Jordens radius (6370 km)', category: 'Gravitation' },
  { symbol: 'M_Sol', latex: 'M_{\\odot}', value: '1,99 × 10³⁰ kg', note: 'Solens masse', category: 'Gravitation' },
  { symbol: 'M_Måne', latex: 'M_{\\text{Måne}}', value: '7,35 × 10²² kg', note: 'Månens masse', category: 'Gravitation' },
  { symbol: 'v_LEO', latex: 'v_{\\text{LEO}}', value: '≈ 7,68 km/s', note: 'Typisk banehastighed i lav jordbane (ca. 400 km højde)', category: 'Gravitation' },

  // Termodynamik
  { symbol: 'R', latex: 'R', value: '8,314 J/(mol·K)', note: 'Universel gaskonstant', category: 'Termodynamik' },
  { symbol: 'R_air', latex: 'R_{\\text{luft}}', value: '287 J/(kg·K)', note: 'Specifik gaskonstant for luft', category: 'Termodynamik' },
  { symbol: 'k_B', latex: 'k_{B}', value: '1,381 × 10⁻²³ J/K', note: 'Boltzmanns konstant', category: 'Termodynamik' },
  { symbol: 'N_A', latex: 'N_{A}', value: '6,022 × 10²³ mol⁻¹', note: 'Avogadros tal', category: 'Termodynamik' },
  { symbol: 'σ', latex: '\\sigma', value: '5,670 × 10⁻⁸ W/(m²·K⁴)', note: 'Stefan–Boltzmann-konstant', category: 'Termodynamik' },
  { symbol: 'c_vand', latex: 'c_{\\text{vand}}', value: '4186 J/(kg·K)', note: 'Specifik varmekapacitet for vand (flydende)', category: 'Termodynamik' },
  { symbol: 'L_f is', latex: 'L_{\\text{smelte, is}}', value: '3,33 × 10⁵ J/kg', note: 'Smeltewarme for is', category: 'Termodynamik' },
  { symbol: 'L_v vand', latex: 'L_{\\text{fordamp, vand}}', value: '2,26 × 10⁶ J/kg', note: 'Fordampningsvarme for vand', category: 'Termodynamik' },
  { symbol: 'ρ_vand', latex: '\\rho_{\\text{vand}}', value: '1000 kg/m³', note: 'Massetæthed for vand ved 4 °C', category: 'Termodynamik' },
  { symbol: 'ρ_luft', latex: '\\rho_{\\text{luft}}', value: '1,20 kg/m³', note: 'Lufttæthed ved havniveau (ca. 20 °C)', category: 'Termodynamik' },
  { symbol: 'γ luft', latex: '\\gamma_{\\text{luft}}', value: '1,40', note: 'Adiabatisk eksponent for luft (C_p/C_v)', category: 'Termodynamik' },

  // SI og enheder
  { symbol: 'c', latex: 'c', value: '2,998 × 10⁸ m/s', note: 'Lysets hastighed i vakuum', category: 'SI og enheder' },
  { symbol: 'h', latex: 'h', value: '6,626 × 10⁻³⁴ J·s', note: 'Plancks konstant', category: 'SI og enheder' },
  { symbol: 'e', latex: 'e', value: '1,602 × 10⁻¹⁹ C', note: 'Elementarladning', category: 'SI og enheder' },
  { symbol: '0 °C', latex: '0\\,^{\\circ}\\text{C}', value: '273,15 K', note: 'T_K = T_°C + 273,15', category: 'SI og enheder' },
  { symbol: '1 kWh', latex: '1\\,\\text{kWh}', value: '3,6 × 10⁶ J', note: 'Energiomregning', category: 'SI og enheder' },
  { symbol: '1 atm', latex: '1\\,\\text{atm}', value: '1,013 × 10⁵ Pa', note: 'Standardatmosfære', category: 'SI og enheder' },
  { symbol: '1 bar', latex: '1\\,\\text{bar}', value: '10⁵ Pa', note: 'Tryk', category: 'SI og enheder' },
  { symbol: '1 cal', latex: '1\\,\\text{cal}', value: '4,184 J', note: 'Kalorie (termokemi)', category: 'SI og enheder' },
  { symbol: 'km/t', latex: '\\text{km/t}', value: '÷ 3,6 → m/s', note: 'Hastighed: m/s = (km/t) / 3,6', category: 'SI og enheder' },
  { symbol: 'kPa', latex: '\\text{kPa}', value: '10³ Pa', note: 'Tryk', category: 'SI og enheder' },
  { symbol: 'liter', latex: '\\text{L}', value: '10⁻³ m³', note: 'Volumen', category: 'SI og enheder' },
];

export const CONSTANT_CATEGORIES = ['Mekanik', 'Gravitation', 'Termodynamik', 'SI og enheder', 'Stoffer'] as const;

export const SUBSTANCE_PROPERTIES = [
  { name: 'Vand (flydende)', c: '4 186', melt: '—', vapor: '2,26 × 10⁶' },
  { name: 'Is', c: '2 100', melt: '3,33 × 10⁵', vapor: '—' },
  { name: 'Vanddamp', c: '2 010', melt: '—', vapor: '—' },
  { name: 'Aluminium', c: '900', melt: '3,97 × 10⁵', vapor: '—' },
  { name: 'Jern/stål', c: '449', melt: '2,47 × 10⁵', vapor: '—' },
  { name: 'Kobber', c: '385', melt: '2,05 × 10⁵', vapor: '—' },
  { name: 'Bly', c: '129', melt: '2,45 × 10⁴', vapor: '—' },
  { name: 'Etanol', c: '2 440', melt: '—', vapor: '—' },
  { name: 'Helium', c: '5 193', melt: '—', vapor: '—' },
  { name: 'Luft (ved RT)', c: '1 005', melt: '—', vapor: '—' },
] as const;
