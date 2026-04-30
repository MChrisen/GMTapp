import type { CalculatorDefinition } from './types';

const has = (values: Record<string, number>, ...keys: string[]) =>
  keys.every((key) => Number.isFinite(values[key]));

const safeDivide = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) return null;
  return numerator / denominator;
};

const sqrtIfNonNegative = (value: number): number | null => {
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.sqrt(value);
};

const quadraticPositiveRoot = (a: number, b: number, c: number): number | null => {
  const discriminant = b ** 2 - 4 * a * c;
  if (!Number.isFinite(discriminant) || discriminant < 0) return null;
  const roots = [(-b + Math.sqrt(discriminant)) / (2 * a), (-b - Math.sqrt(discriminant)) / (2 * a)];
  return roots.filter((root) => root >= 0).sort((x, y) => x - y)[0] ?? null;
};

const format = (value: number) => {
  if (!Number.isFinite(value)) return 'ikke defineret';
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute < 1e-3 || absolute >= 1e6)) {
    return value.toExponential(4);
  }
  return Number.parseFloat(value.toPrecision(6)).toString();
};

export const calculators: CalculatorDefinition[] = [
  {
    id: 'constant-acceleration',
    title: 'Konstant acceleration',
    category: 'Bevægelse',
    description: 'Løser SUVAT-ligningerne med konstant acceleration.',
    latex: 'v = v_0 + a t,\\quad x - x_0 = v_0 t + \\tfrac{1}{2} a t^2,\\quad v^2 = v_0^2 + 2 a (x - x_0)',
    formulaIds: ['constant-acceleration-velocity', 'constant-acceleration-position', 'constant-acceleration-no-time'],
    variables: [
      { key: 'v', label: 'v', unit: 'm/s', latex: 'v' },
      { key: 'v0', label: 'v0', unit: 'm/s', latex: 'v_0' },
      { key: 'a', label: 'a', unit: 'm/s²', latex: 'a' },
      { key: 't', label: 't', unit: 's', latex: 't' },
      { key: 'dx', label: 'Δx', unit: 'm', latex: '\\Delta x' },
    ],
    solve(values, unknown) {
      if (unknown === 'v' && has(values, 'v0', 'a', 't')) return values.v0 + values.a * values.t;
      if (unknown === 'v0' && has(values, 'v', 'a', 't')) return values.v - values.a * values.t;
      if (unknown === 'a' && has(values, 'v', 'v0', 't')) return safeDivide(values.v - values.v0, values.t);
      if (unknown === 't' && has(values, 'v', 'v0', 'a')) return safeDivide(values.v - values.v0, values.a);
      if (unknown === 'dx' && has(values, 'v0', 'a', 't')) return values.v0 * values.t + 0.5 * values.a * values.t ** 2;
      if (unknown === 'v' && has(values, 'v0', 'a', 'dx')) return sqrtIfNonNegative(values.v0 ** 2 + 2 * values.a * values.dx);
      if (unknown === 'a' && has(values, 'v', 'v0', 'dx')) return safeDivide(values.v ** 2 - values.v0 ** 2, 2 * values.dx);
      return null;
    },
    explanation: (_values, unknown, result) =>
      `${unknown} = ${format(result)}. Brug fortegn på a og Δx konsekvent. Ved v²-ligningen kan den modsatte retning give et negativt v.`,
  },
  {
    id: 'projectile',
    title: 'Skråt kast',
    category: 'Bevægelse',
    description: 'Bruger x = v0 cosθ t og y = y0 + v0 sinθ t - ½ g t².',
    latex: 'x = v_0 \\cos\\theta \\cdot t,\\qquad y = y_0 + v_0 \\sin\\theta \\cdot t - \\tfrac{1}{2} g t^2',
    formulaIds: ['projectile-components', 'projectile-position-x', 'projectile-position-y', 'projectile-range'],
    variables: [
      { key: 'v0', label: 'v0', unit: 'm/s', latex: 'v_0' },
      { key: 'theta', label: 'θ', unit: 'grader', latex: '\\theta' },
      { key: 't', label: 't', unit: 's', latex: 't' },
      { key: 'x', label: 'x − x0', unit: 'm', latex: 'x - x_0' },
      { key: 'y0', label: 'y0', unit: 'm', latex: 'y_0' },
      { key: 'y', label: 'y', unit: 'm', latex: 'y' },
      { key: 'R', label: 'rækkevidde', unit: 'm', latex: 'R' },
      { key: 'tImpact', label: 'nedslagstid', unit: 's', latex: 't_{\\text{impact}}' },
      { key: 'yMax', label: 'tophøjde', unit: 'm', latex: 'y_{\\max}' },
      { key: 'vf', label: 'slutfart', unit: 'm/s', latex: 'v_f' },
    ],
    solve(values, unknown) {
      const g = 9.82;
      const theta = (values.theta * Math.PI) / 180;
      if (unknown === 'x' && has(values, 'v0', 'theta', 't')) return values.v0 * Math.cos(theta) * values.t;
      if (unknown === 'y' && has(values, 'v0', 'theta', 't', 'y0')) return values.y0 + values.v0 * Math.sin(theta) * values.t - 0.5 * g * values.t ** 2;
      if (unknown === 'v0' && has(values, 'x', 'theta', 't')) return safeDivide(values.x, Math.cos(theta) * values.t);
      if (unknown === 't' && has(values, 'x', 'v0', 'theta')) return safeDivide(values.x, values.v0 * Math.cos(theta));
      if (unknown === 'tImpact' && has(values, 'v0', 'theta', 'y0', 'y')) {
        return quadraticPositiveRoot(-0.5 * g, values.v0 * Math.sin(theta), values.y0 - values.y);
      }
      if (unknown === 'R' && has(values, 'v0', 'theta', 'y0', 'y')) {
        const tImpact = quadraticPositiveRoot(-0.5 * g, values.v0 * Math.sin(theta), values.y0 - values.y);
        return tImpact === null ? null : values.v0 * Math.cos(theta) * tImpact;
      }
      if (unknown === 'yMax' && has(values, 'v0', 'theta', 'y0')) return values.y0 + (values.v0 * Math.sin(theta)) ** 2 / (2 * g);
      if (unknown === 'vf' && has(values, 'v0', 'y0', 'y')) return sqrtIfNonNegative(values.v0 ** 2 + 2 * g * (values.y0 - values.y));
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Husk at x- og y-retningen deler samme tid.`,
  },
  {
    id: 'force',
    title: 'Newtons 2. lov',
    category: 'Kræfter og statik',
    description: 'Løser ΣF = m a samt vægt F_g = m g.',
    latex: '\\sum \\vec{F} = m\\,\\vec{a}',
    formulaIds: ['newton-second-law', 'weight', 'normal-force-flat'],
    variables: [
      { key: 'F', label: 'ΣF', unit: 'N', latex: '\\sum F' },
      { key: 'm', label: 'm', unit: 'kg', latex: 'm' },
      { key: 'a', label: 'a', unit: 'm/s²', latex: 'a' },
    ],
    solve(values, unknown) {
      if (unknown === 'F' && has(values, 'm', 'a')) return values.m * values.a;
      if (unknown === 'm' && has(values, 'F', 'a')) return safeDivide(values.F, values.a);
      if (unknown === 'a' && has(values, 'F', 'm')) return safeDivide(values.F, values.m);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. ΣF er nettokraften i den valgte retning.`,
  },
  {
    id: 'friction',
    title: 'Friktion',
    category: 'Kræfter og statik',
    description: 'Løser f = μ N.',
    latex: 'f = \\mu\\,N',
    formulaIds: ['friction-kinetic', 'friction-static'],
    variables: [
      { key: 'f', label: 'f', unit: 'N', latex: 'f' },
      { key: 'mu', label: 'μ', latex: '\\mu' },
      { key: 'N', label: 'N', unit: 'N', latex: 'N' },
    ],
    solve(values, unknown) {
      if (unknown === 'f' && has(values, 'mu', 'N')) return values.mu * values.N;
      if (unknown === 'mu' && has(values, 'f', 'N')) return safeDivide(values.f, values.N);
      if (unknown === 'N' && has(values, 'f', 'mu')) return safeDivide(values.f, values.mu);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Friktionen peger mod relativ bevægelse.`,
  },
  {
    id: 'incline',
    title: 'Skråplan',
    category: 'Kræfter og statik',
    description: 'Finder tyngdekomposanter og normalkraft på et skråplan.',
    latex: 'F_{\\parallel} = m g \\sin\\theta,\\qquad N = m g \\cos\\theta',
    formulaIds: ['incline-components', 'newton-second-law'],
    variables: [
      { key: 'm', label: 'm', unit: 'kg', latex: 'm' },
      { key: 'theta', label: 'θ', unit: 'grader', latex: '\\theta' },
      { key: 'Fparallel', label: 'F_∥', unit: 'N', latex: 'F_{\\parallel}' },
      { key: 'N', label: 'N', unit: 'N', latex: 'N' },
    ],
    solve(values, unknown) {
      const g = 9.82;
      const theta = (values.theta * Math.PI) / 180;
      if (unknown === 'Fparallel' && has(values, 'm', 'theta')) return values.m * g * Math.sin(theta);
      if (unknown === 'N' && has(values, 'm', 'theta')) return values.m * g * Math.cos(theta);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Brug vinklen mellem planet og vandret.`,
  },
  {
    id: 'atwood',
    title: 'Atwood-maskine',
    category: 'Kræfter og statik',
    description: 'Løser a = (m2 − m1) g / (m1 + m2) og snorkraften T.',
    latex: 'a = \\dfrac{(m_2 - m_1) g}{m_1 + m_2},\\qquad T = \\dfrac{2 m_1 m_2 g}{m_1 + m_2}',
    formulaIds: ['atwood-acceleration', 'tension-atwood', 'newton-second-law'],
    variables: [
      { key: 'm1', label: 'm1', unit: 'kg', latex: 'm_1' },
      { key: 'm2', label: 'm2', unit: 'kg', latex: 'm_2' },
      { key: 'a', label: 'a', unit: 'm/s²', latex: 'a' },
      { key: 'T', label: 'T', unit: 'N', latex: 'T' },
    ],
    solve(values, unknown) {
      const g = 9.82;
      if (unknown === 'a' && has(values, 'm1', 'm2')) return ((values.m2 - values.m1) * g) / (values.m1 + values.m2);
      if (unknown === 'T' && has(values, 'm1', 'm2')) return (2 * values.m1 * values.m2 * g) / (values.m1 + values.m2);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. a > 0 betyder m2 falder, m1 stiger.`,
  },
  {
    id: 'circular',
    title: 'Cirkulær bevægelse',
    category: 'Bevægelse',
    description: 'Centripetalkraft og fart i en cirkel.',
    latex: 'F_c = \\dfrac{m v^2}{r} = m r \\omega^2',
    formulaIds: ['centripetal-force'],
    variables: [
      { key: 'F', label: 'F_c', unit: 'N', latex: 'F_c' },
      { key: 'm', label: 'm', unit: 'kg', latex: 'm' },
      { key: 'v', label: 'v', unit: 'm/s', latex: 'v' },
      { key: 'r', label: 'r', unit: 'm', latex: 'r' },
      { key: 'omega', label: 'ω', unit: 'rad/s', latex: '\\omega' },
    ],
    solve(values, unknown) {
      if (unknown === 'F' && has(values, 'm', 'v', 'r')) return (values.m * values.v ** 2) / values.r;
      if (unknown === 'F' && has(values, 'm', 'r', 'omega')) return values.m * values.r * values.omega ** 2;
      if (unknown === 'v' && has(values, 'F', 'm', 'r')) return Math.sqrt((values.F * values.r) / values.m);
      if (unknown === 'r' && has(values, 'F', 'm', 'v')) return (values.m * values.v ** 2) / values.F;
      if (unknown === 'm' && has(values, 'F', 'v', 'r')) return (values.F * values.r) / values.v ** 2;
      if (unknown === 'omega' && has(values, 'F', 'm', 'r')) return Math.sqrt(values.F / (values.m * values.r));
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Kraften peger mod centrum.`,
  },
  {
    id: 'work',
    title: 'Arbejde',
    category: 'Energi og impuls',
    description: 'Arbejde af konstant kraft langs forskydning.',
    latex: 'W = F\\,d\\,\\cos\\theta',
    formulaIds: ['work-constant-force', 'power'],
    variables: [
      { key: 'W', label: 'W', unit: 'J', latex: 'W' },
      { key: 'F', label: 'F', unit: 'N', latex: 'F' },
      { key: 'd', label: 'd', unit: 'm', latex: 'd' },
      { key: 'theta', label: 'θ', unit: 'grader', latex: '\\theta' },
    ],
    solve(values, unknown) {
      const theta = (values.theta * Math.PI) / 180;
      const projection = Math.cos(theta);
      if (unknown === 'W' && has(values, 'F', 'd', 'theta')) return values.F * values.d * projection;
      if (unknown === 'F' && has(values, 'W', 'd', 'theta')) return safeDivide(values.W, values.d * projection);
      if (unknown === 'd' && has(values, 'W', 'F', 'theta')) return safeDivide(values.W, values.F * projection);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. cos θ er negativ når kraften modvirker.`,
  },
  {
    id: 'energy',
    title: 'Energibevarelse',
    category: 'Energi og impuls',
    description: 'Mekanisk energibevarelse mellem to punkter med valgfri W_nc.',
    latex: '\\tfrac{1}{2} m v_i^2 + m g y_i + W_{\\text{nc}} = \\tfrac{1}{2} m v_f^2 + m g y_f',
    formulaIds: ['kinetic-energy', 'gravitational-potential-earth', 'mechanical-energy'],
    variables: [
      { key: 'm', label: 'm', unit: 'kg', latex: 'm' },
      { key: 'vi', label: 'v_i', unit: 'm/s', latex: 'v_i' },
      { key: 'vf', label: 'v_f', unit: 'm/s', latex: 'v_f' },
      { key: 'yi', label: 'y_i', unit: 'm', latex: 'y_i' },
      { key: 'yf', label: 'y_f', unit: 'm', latex: 'y_f' },
      { key: 'Wnc', label: 'W_nc', unit: 'J', latex: 'W_{\\text{nc}}' },
    ],
    solve(values, unknown) {
      const g = 9.82;
      const Wnc = Number.isFinite(values.Wnc) ? values.Wnc : 0;
      if (unknown === 'vf' && has(values, 'm', 'vi', 'yi', 'yf')) {
        const inside = values.vi ** 2 + 2 * g * (values.yi - values.yf) + (2 * Wnc) / values.m;
        return inside >= 0 ? Math.sqrt(inside) : null;
      }
      if (unknown === 'vi' && has(values, 'm', 'vf', 'yi', 'yf')) {
        const inside = values.vf ** 2 - 2 * g * (values.yi - values.yf) - (2 * Wnc) / values.m;
        return inside >= 0 ? Math.sqrt(inside) : null;
      }
      if (unknown === 'yf' && has(values, 'm', 'vi', 'vf', 'yi')) {
        return values.yi + (values.vi ** 2 - values.vf ** 2) / (2 * g) + Wnc / (values.m * g);
      }
      if (unknown === 'yi' && has(values, 'm', 'vi', 'vf', 'yf')) {
        return values.yf + (values.vf ** 2 - values.vi ** 2) / (2 * g) - Wnc / (values.m * g);
      }
      if (unknown === 'Wnc' && has(values, 'm', 'vi', 'vf', 'yi', 'yf')) {
        return 0.5 * values.m * (values.vf ** 2 - values.vi ** 2) + values.m * g * (values.yf - values.yi);
      }
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. W_nc < 0 svarer til varmetab fra friktion.`,
  },
  {
    id: 'momentum',
    title: 'Bevægelsesmængde og 1D stød',
    category: 'Energi og impuls',
    description: 'p = m v og bevarelse af impuls i 1D.',
    latex: 'm_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}',
    formulaIds: ['momentum', 'momentum-conservation'],
    variables: [
      { key: 'm1', label: 'm_1', unit: 'kg', latex: 'm_1' },
      { key: 'v1i', label: 'v_{1i}', unit: 'm/s', latex: 'v_{1i}' },
      { key: 'v1f', label: 'v_{1f}', unit: 'm/s', latex: 'v_{1f}' },
      { key: 'm2', label: 'm_2', unit: 'kg', latex: 'm_2' },
      { key: 'v2i', label: 'v_{2i}', unit: 'm/s', latex: 'v_{2i}' },
      { key: 'v2f', label: 'v_{2f}', unit: 'm/s', latex: 'v_{2f}' },
      { key: 'vf', label: 'v_f samlet', unit: 'm/s', latex: 'v_f' },
    ],
    solve(values, unknown) {
      const totalI = (values.m1 ?? 0) * (values.v1i ?? 0) + (values.m2 ?? 0) * (values.v2i ?? 0);
      if (unknown === 'v1f' && has(values, 'm1', 'v1i', 'm2', 'v2i', 'v2f')) {
        return (totalI - values.m2 * values.v2f) / values.m1;
      }
      if (unknown === 'v2f' && has(values, 'm1', 'v1i', 'v1f', 'm2', 'v2i')) {
        return (totalI - values.m1 * values.v1f) / values.m2;
      }
      if (unknown === 'vf' && has(values, 'm1', 'v1i', 'm2', 'v2i')) return safeDivide(totalI, values.m1 + values.m2);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Pas på fortegn i 1D-retningen.`,
  },
  {
    id: 'torque',
    title: 'Drejningsmoment',
    category: 'Rotation',
    description: 'τ = r F sin θ og Σ τ = I α.',
    latex: '\\tau = r\\,F\\,\\sin\\theta,\\qquad \\sum\\tau = I\\alpha',
    formulaIds: ['torque', 'rotational-newton', 'static-equilibrium-torque'],
    variables: [
      { key: 'tau', label: 'τ', unit: 'N m', latex: '\\tau' },
      { key: 'r', label: 'r', unit: 'm', latex: 'r' },
      { key: 'F', label: 'F', unit: 'N', latex: 'F' },
      { key: 'theta', label: 'θ', unit: 'grader', latex: '\\theta' },
      { key: 'I', label: 'I', unit: 'kg m²', latex: 'I' },
      { key: 'alpha', label: 'α', unit: 'rad/s²', latex: '\\alpha' },
    ],
    solve(values, unknown) {
      const theta = (values.theta * Math.PI) / 180;
      if (unknown === 'tau' && has(values, 'r', 'F', 'theta')) return values.r * values.F * Math.sin(theta);
      if (unknown === 'F' && has(values, 'tau', 'r', 'theta')) return values.tau / (values.r * Math.sin(theta));
      if (unknown === 'r' && has(values, 'tau', 'F', 'theta')) return values.tau / (values.F * Math.sin(theta));
      if (unknown === 'tau' && has(values, 'I', 'alpha')) return values.I * values.alpha;
      if (unknown === 'alpha' && has(values, 'tau', 'I')) return values.tau / values.I;
      if (unknown === 'I' && has(values, 'tau', 'alpha')) return values.tau / values.alpha;
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Vinklen er mellem r og F.`,
  },
  {
    id: 'rotation',
    title: 'Rotationskinematik',
    category: 'Rotation',
    description: 'v = r ω, a_t = r α, ω = ω0 + α t.',
    latex: 'v = r\\omega,\\quad a_t = r\\alpha,\\quad \\omega = \\omega_0 + \\alpha t',
    formulaIds: ['angular-kinematics-velocity', 'linear-angular-speed', 'angular-position'],
    variables: [
      { key: 'v', label: 'v', unit: 'm/s', latex: 'v' },
      { key: 'r', label: 'r', unit: 'm', latex: 'r' },
      { key: 'omega', label: 'ω', unit: 'rad/s', latex: '\\omega' },
      { key: 'omega0', label: 'ω_0', unit: 'rad/s', latex: '\\omega_0' },
      { key: 'alpha', label: 'α', unit: 'rad/s²', latex: '\\alpha' },
      { key: 't', label: 't', unit: 's', latex: 't' },
      { key: 'at', label: 'a_t', unit: 'm/s²', latex: 'a_t' },
    ],
    solve(values, unknown) {
      if (unknown === 'v' && has(values, 'r', 'omega')) return values.r * values.omega;
      if (unknown === 'omega' && has(values, 'v', 'r')) return safeDivide(values.v, values.r);
      if (unknown === 'at' && has(values, 'r', 'alpha')) return values.r * values.alpha;
      if (unknown === 'alpha' && has(values, 'at', 'r')) return safeDivide(values.at, values.r);
      if (unknown === 'omega' && has(values, 'omega0', 'alpha', 't')) return values.omega0 + values.alpha * values.t;
      if (unknown === 't' && has(values, 'omega', 'omega0', 'alpha')) return safeDivide(values.omega - values.omega0, values.alpha);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Vinkler skal være i radianer.`,
  },
  {
    id: 'orbit',
    title: 'Satellitbane',
    category: 'Gravitation',
    description: 'v = √(GM/r), T = 2π r / v og F = G m1 m2 / r².',
    latex: 'v = \\sqrt{\\dfrac{GM}{r}},\\qquad T = \\dfrac{2\\pi r}{v}',
    formulaIds: ['orbital-speed', 'orbital-period', 'universal-gravitation'],
    variables: [
      { key: 'M', label: 'M', unit: 'kg', latex: 'M' },
      { key: 'r', label: 'r', unit: 'm', latex: 'r' },
      { key: 'v', label: 'v', unit: 'm/s', latex: 'v' },
      { key: 'T', label: 'T', unit: 's', latex: 'T' },
    ],
    solve(values, unknown) {
      const G = 6.674e-11;
      if (unknown === 'v' && has(values, 'M', 'r')) return sqrtIfNonNegative((G * values.M) / values.r);
      if (unknown === 'T' && has(values, 'r', 'v')) return safeDivide(2 * Math.PI * values.r, values.v);
      if (unknown === 'T' && has(values, 'M', 'r')) return 2 * Math.PI * Math.sqrt(values.r ** 3 / (G * values.M));
      if (unknown === 'M' && has(values, 'v', 'r')) return safeDivide(values.v ** 2 * values.r, G);
      if (unknown === 'r' && has(values, 'v', 'M')) return safeDivide(G * values.M, values.v ** 2);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. r er afstand fra centrum, ikke højde.`,
  },
  {
    id: 'ideal-gas',
    title: 'Idealgasloven',
    category: 'Gas og termodynamik',
    description: 'p V = n R T.',
    latex: 'p V = n R T',
    formulaIds: ['ideal-gas-nrt', 'celsius-kelvin'],
    variables: [
      { key: 'p', label: 'p', unit: 'Pa', latex: 'p' },
      { key: 'V', label: 'V', unit: 'm³', latex: 'V' },
      { key: 'n', label: 'n', unit: 'mol', latex: 'n' },
      { key: 'T', label: 'T', unit: 'K', latex: 'T' },
    ],
    solve(values, unknown) {
      const R = 8.314462618;
      if (unknown === 'p' && has(values, 'n', 'T', 'V')) return (values.n * R * values.T) / values.V;
      if (unknown === 'V' && has(values, 'n', 'T', 'p')) return (values.n * R * values.T) / values.p;
      if (unknown === 'n' && has(values, 'p', 'V', 'T')) return (values.p * values.V) / (R * values.T);
      if (unknown === 'T' && has(values, 'p', 'V', 'n')) return (values.p * values.V) / (values.n * R);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Temperaturen skal være i kelvin.`,
  },
  {
    id: 'first-law',
    title: '1. hovedsætning og pV-arbejde',
    category: 'Gas og termodynamik',
    description: 'ΔU = Q − W og W = p ΔV ved isobar.',
    latex: '\\Delta U = Q - W,\\qquad W_{\\text{isobar}} = p\\,\\Delta V',
    formulaIds: ['first-law', 'gas-work', 'isobaric-work'],
    variables: [
      { key: 'dU', label: 'ΔU', unit: 'J', latex: '\\Delta U' },
      { key: 'Q', label: 'Q', unit: 'J', latex: 'Q' },
      { key: 'W', label: 'W', unit: 'J', latex: 'W' },
      { key: 'p', label: 'p', unit: 'Pa', latex: 'p' },
      { key: 'dV', label: 'ΔV', unit: 'm³', latex: '\\Delta V' },
    ],
    solve(values, unknown) {
      const fromFirstLaw = has(values, 'Q', 'dU') ? values.Q - values.dU : null;
      const fromWork = has(values, 'p', 'dV') ? values.p * values.dV : null;
      if (unknown === 'dU' && has(values, 'Q', 'W')) return values.Q - values.W;
      if (unknown === 'Q' && has(values, 'dU', 'W')) return values.dU + values.W;
      if (unknown === 'W' && fromFirstLaw !== null && fromWork !== null) {
        return Math.abs(fromFirstLaw - fromWork) < 1e-6 * Math.max(1, Math.abs(fromFirstLaw)) ? fromFirstLaw : null;
      }
      if (unknown === 'W' && fromFirstLaw !== null) return fromFirstLaw;
      if (unknown === 'W' && fromWork !== null) return fromWork;
      if (unknown === 'dV' && has(values, 'p', 'W')) return safeDivide(values.W, values.p);
      if (unknown === 'p' && has(values, 'W', 'dV')) return safeDivide(values.W, values.dV);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. W > 0 når gassen udfører arbejde.`,
  },
  {
    id: 'isothermal',
    title: 'Isoterm idealgasproces',
    category: 'Gas og termodynamik',
    description: 'W = n R T ln(V_f / V_i).',
    latex: 'W = n R T \\ln\\!\\left(\\dfrac{V_f}{V_i}\\right)',
    formulaIds: ['isothermal-ideal-gas'],
    variables: [
      { key: 'W', label: 'W', unit: 'J', latex: 'W' },
      { key: 'n', label: 'n', unit: 'mol', latex: 'n' },
      { key: 'T', label: 'T', unit: 'K', latex: 'T' },
      { key: 'Vi', label: 'V_i', unit: 'm³', latex: 'V_i' },
      { key: 'Vf', label: 'V_f', unit: 'm³', latex: 'V_f' },
    ],
    solve(values, unknown) {
      const R = 8.314462618;
      if (unknown === 'W' && has(values, 'n', 'T', 'Vi', 'Vf')) return values.n * R * values.T * Math.log(values.Vf / values.Vi);
      if (unknown === 'Vf' && has(values, 'W', 'n', 'T', 'Vi')) return values.Vi * Math.exp(values.W / (values.n * R * values.T));
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. ΔU = 0 for isoterm idealgas.`,
  },
  {
    id: 'adiabatic',
    title: 'Adiabatisk idealgasproces',
    category: 'Gas og termodynamik',
    description: 'p V^γ = konstant.',
    latex: 'p_i V_i^{\\gamma} = p_f V_f^{\\gamma}',
    formulaIds: ['adiabatic-process'],
    variables: [
      { key: 'pi', label: 'p_i', unit: 'Pa', latex: 'p_i' },
      { key: 'Vi', label: 'V_i', unit: 'm³', latex: 'V_i' },
      { key: 'pf', label: 'p_f', unit: 'Pa', latex: 'p_f' },
      { key: 'Vf', label: 'V_f', unit: 'm³', latex: 'V_f' },
      { key: 'gamma', label: 'γ', latex: '\\gamma' },
    ],
    solve(values, unknown) {
      if (unknown === 'pf' && has(values, 'pi', 'Vi', 'Vf', 'gamma')) return values.pi * Math.pow(values.Vi / values.Vf, values.gamma);
      if (unknown === 'Vf' && has(values, 'pi', 'Vi', 'pf', 'gamma')) return values.Vi * Math.pow(values.pi / values.pf, 1 / values.gamma);
      if (unknown === 'pi' && has(values, 'pf', 'Vf', 'Vi', 'gamma')) return values.pf * Math.pow(values.Vf / values.Vi, values.gamma);
      if (unknown === 'Vi' && has(values, 'pi', 'pf', 'Vf', 'gamma')) return values.Vf * Math.pow(values.pf / values.pi, 1 / values.gamma);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Q = 0; γ ≈ 5/3 for monoatomisk, 7/5 for diatomisk.`,
  },
  {
    id: 'heat',
    title: 'Varme og faseovergang',
    category: 'Varme og materialer',
    description: 'Q = m c ΔT eller Q = m L.',
    latex: 'Q = m\\,c\\,\\Delta T,\\qquad Q = m\\,L',
    formulaIds: ['heat-capacity', 'latent-heat'],
    variables: [
      { key: 'Q', label: 'Q', unit: 'J', latex: 'Q' },
      { key: 'm', label: 'm', unit: 'kg', latex: 'm' },
      { key: 'c', label: 'c', unit: 'J/(kg K)', latex: 'c' },
      { key: 'dT', label: 'ΔT', unit: 'K', latex: '\\Delta T' },
      { key: 'L', label: 'L', unit: 'J/kg', latex: 'L' },
    ],
    solve(values, unknown) {
      if (unknown === 'Q' && has(values, 'm', 'c', 'dT')) return values.m * values.c * values.dT;
      if (unknown === 'm' && has(values, 'Q', 'c', 'dT')) return values.Q / (values.c * values.dT);
      if (unknown === 'c' && has(values, 'Q', 'm', 'dT')) return values.Q / (values.m * values.dT);
      if (unknown === 'dT' && has(values, 'Q', 'm', 'c')) return values.Q / (values.m * values.c);
      if (unknown === 'Q' && has(values, 'm', 'L')) return values.m * values.L;
      if (unknown === 'L' && has(values, 'Q', 'm')) return values.Q / values.m;
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Brug cΔT for opvarmning og L for faseovergang.`,
  },
  {
    id: 'temperature',
    title: 'Temperaturkonvertering',
    category: 'Enheder og diverse',
    description: 'T_K = T_C + 273.15.',
    latex: 'T_K = T_C + 273{,}15',
    formulaIds: ['celsius-kelvin'],
    variables: [
      { key: 'TC', label: 'T_C', unit: '°C', latex: 'T_C' },
      { key: 'TK', label: 'T_K', unit: 'K', latex: 'T_K' },
    ],
    solve(values, unknown) {
      if (unknown === 'TK' && Number.isFinite(values.TC)) return values.TC + 273.15;
      if (unknown === 'TC' && Number.isFinite(values.TK)) return values.TK - 273.15;
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}.`,
  },
  {
    id: 'conduction',
    title: 'Varmeledning / R-værdi',
    category: 'Varme og materialer',
    description: 'P = A ΔT / R og R i serie adderes.',
    latex: 'P = \\dfrac{A\\,\\Delta T}{R_{\\text{total}}}',
    formulaIds: ['heat-conduction-r'],
    variables: [
      { key: 'P', label: 'P', unit: 'W', latex: 'P' },
      { key: 'A', label: 'A', unit: 'm²', latex: 'A' },
      { key: 'dT', label: 'ΔT', unit: 'K', latex: '\\Delta T' },
      { key: 'R', label: 'R_total', unit: 'm² K/W', latex: 'R_{\\text{total}}' },
    ],
    solve(values, unknown) {
      if (unknown === 'P' && has(values, 'A', 'dT', 'R')) return (values.A * values.dT) / values.R;
      if (unknown === 'R' && has(values, 'A', 'dT', 'P')) return (values.A * values.dT) / values.P;
      if (unknown === 'A' && has(values, 'P', 'R', 'dT')) return (values.P * values.R) / values.dT;
      if (unknown === 'dT' && has(values, 'P', 'A', 'R')) return (values.P * values.R) / values.A;
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. R-værdier i serie adderes.`,
  },
  {
    id: 'cop',
    title: 'COP for kølemaskine',
    category: 'Varme og materialer',
    description: 'Forholdet mellem fjernet varme fra det kolde rum og tilført arbejde.',
    latex: '\\text{COP} = \\dfrac{Q_c}{W}',
    formulaIds: ['cop-refrigerator'],
    variables: [
      { key: 'COP', label: 'COP', latex: '\\text{COP}' },
      { key: 'Qc', label: 'Q_c', unit: 'J', latex: 'Q_c' },
      { key: 'W', label: 'W', unit: 'J', latex: 'W' },
    ],
    solve(values, unknown) {
      if (unknown === 'COP' && has(values, 'Qc', 'W')) return values.Qc / values.W;
      if (unknown === 'Qc' && has(values, 'COP', 'W')) return values.COP * values.W;
      if (unknown === 'W' && has(values, 'Qc', 'COP')) return values.Qc / values.COP;
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Q(kold) er fjernet varme, W er tilført arbejde.`,
  },
  {
    id: 'statics',
    title: 'Statisk ligevægt',
    category: 'Kræfter og statik',
    description: 'Hjælp til 2-snor ophæng: vinkler θ1 og θ2 fra vandret, vægt W giver T1 og T2.',
    latex: 'T_1 \\cos\\theta_1 = T_2 \\cos\\theta_2,\\qquad T_1 \\sin\\theta_1 + T_2 \\sin\\theta_2 = W',
    formulaIds: ['static-equilibrium-forces', 'static-equilibrium-torque', 'weight'],
    variables: [
      { key: 'W', label: 'W (vægt)', unit: 'N', latex: 'W' },
      { key: 'theta1', label: 'θ_1', unit: 'grader', latex: '\\theta_1' },
      { key: 'theta2', label: 'θ_2', unit: 'grader', latex: '\\theta_2' },
      { key: 'T1', label: 'T_1', unit: 'N', latex: 'T_1' },
      { key: 'T2', label: 'T_2', unit: 'N', latex: 'T_2' },
    ],
    solve(values, unknown) {
      const t1 = (values.theta1 * Math.PI) / 180;
      const t2 = (values.theta2 * Math.PI) / 180;
      if (unknown === 'T1' && has(values, 'W', 'theta1', 'theta2')) {
        return (values.W * Math.cos(t2)) / (Math.sin(t1) * Math.cos(t2) + Math.cos(t1) * Math.sin(t2));
      }
      if (unknown === 'T2' && has(values, 'W', 'theta1', 'theta2')) {
        return (values.W * Math.cos(t1)) / (Math.sin(t1) * Math.cos(t2) + Math.cos(t1) * Math.sin(t2));
      }
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Vinkler måles fra vandret.`,
  },
  {
    id: 'relative-velocity',
    title: 'Relativ hastighed',
    category: 'Vektorer og diverse',
    description: 'Adderer komponenter: v_resultat = v_egen + v_strøm/vind.',
    latex: '\\vec v_{A/C}=\\vec v_{A/B}+\\vec v_{B/C}',
    formulaIds: ['relative-velocity'],
    variables: [
      { key: 'vxOwn', label: 'v_x egen', unit: 'm/s', latex: 'v_{x,\\text{egen}}' },
      { key: 'vyOwn', label: 'v_y egen', unit: 'm/s', latex: 'v_{y,\\text{egen}}' },
      { key: 'vxMedium', label: 'v_x vind/strøm', unit: 'm/s', latex: 'v_{x,\\text{medium}}' },
      { key: 'vyMedium', label: 'v_y vind/strøm', unit: 'm/s', latex: 'v_{y,\\text{medium}}' },
      { key: 'vx', label: 'v_x resultat', unit: 'm/s', latex: 'v_x' },
      { key: 'vy', label: 'v_y resultat', unit: 'm/s', latex: 'v_y' },
      { key: 'speed', label: 'fart', unit: 'm/s', latex: '|\\vec v|' },
    ],
    solve(values, unknown) {
      if (unknown === 'vx' && has(values, 'vxOwn', 'vxMedium')) return values.vxOwn + values.vxMedium;
      if (unknown === 'vy' && has(values, 'vyOwn', 'vyMedium')) return values.vyOwn + values.vyMedium;
      if (unknown === 'speed' && has(values, 'vx', 'vy')) return Math.hypot(values.vx, values.vy);
      if (unknown === 'speed' && has(values, 'vxOwn', 'vyOwn', 'vxMedium', 'vyMedium')) {
        return Math.hypot(values.vxOwn + values.vxMedium, values.vyOwn + values.vyMedium);
      }
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Retningen findes med atan2(v_y, v_x).`,
  },
  {
    id: 'center-of-mass',
    title: 'Massemidtpunkt 1D',
    category: 'Vektorer og diverse',
    description: 'To delmasser: x_cm = (m1 x1 + m2 x2)/(m1 + m2).',
    latex: 'x_{cm}=\\dfrac{m_1x_1+m_2x_2}{m_1+m_2}',
    formulaIds: ['center-of-mass'],
    variables: [
      { key: 'm1', label: 'm_1', unit: 'kg', latex: 'm_1' },
      { key: 'x1', label: 'x_1', unit: 'm', latex: 'x_1' },
      { key: 'm2', label: 'm_2', unit: 'kg', latex: 'm_2' },
      { key: 'x2', label: 'x_2', unit: 'm', latex: 'x_2' },
      { key: 'xcm', label: 'x_cm', unit: 'm', latex: 'x_{cm}' },
    ],
    solve(values, unknown) {
      if (unknown === 'xcm' && has(values, 'm1', 'x1', 'm2', 'x2')) {
        return safeDivide(values.m1 * values.x1 + values.m2 * values.x2, values.m1 + values.m2);
      }
      if (unknown === 'x2' && has(values, 'xcm', 'm1', 'x1', 'm2')) return safeDivide(values.xcm * (values.m1 + values.m2) - values.m1 * values.x1, values.m2);
      if (unknown === 'x1' && has(values, 'xcm', 'm1', 'm2', 'x2')) return safeDivide(values.xcm * (values.m1 + values.m2) - values.m2 * values.x2, values.m1);
      return null;
    },
    explanation: (_values, unknown, result) => `${unknown} = ${format(result)}. Brug samme nulpunkt for alle positioner.`,
  },
];

export const calculatorById = (id: string) => calculators.find((calculator) => calculator.id === id);
