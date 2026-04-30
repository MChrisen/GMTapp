import { useMemo, useState } from 'react';

type Conversion = {
  id: string;
  label: string;
  fromUnit: string;
  toUnit: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
};

const CONVERSIONS: Conversion[] = [
  {
    id: 'km/t-m/s',
    label: 'km/t ↔ m/s',
    fromUnit: 'km/t',
    toUnit: 'm/s',
    toBase: (value) => value / 3.6,
    fromBase: (value) => value * 3.6,
  },
  {
    id: 'celsius-kelvin',
    label: '°C ↔ K',
    fromUnit: '°C',
    toUnit: 'K',
    toBase: (value) => value + 273.15,
    fromBase: (value) => value - 273.15,
  },
  {
    id: 'deg-rad',
    label: 'grader ↔ radianer',
    fromUnit: '°',
    toUnit: 'rad',
    toBase: (value) => (value * Math.PI) / 180,
    fromBase: (value) => (value * 180) / Math.PI,
  },
  {
    id: 'rpm-rads',
    label: 'rpm ↔ rad/s',
    fromUnit: 'rpm',
    toUnit: 'rad/s',
    toBase: (value) => (value * 2 * Math.PI) / 60,
    fromBase: (value) => (value * 60) / (2 * Math.PI),
  },
  {
    id: 'kwh-j',
    label: 'kWh ↔ J',
    fromUnit: 'kWh',
    toUnit: 'J',
    toBase: (value) => value * 3.6e6,
    fromBase: (value) => value / 3.6e6,
  },
  {
    id: 'bar-pa',
    label: 'bar ↔ Pa',
    fromUnit: 'bar',
    toUnit: 'Pa',
    toBase: (value) => value * 1e5,
    fromBase: (value) => value / 1e5,
  },
  {
    id: 'liter-m3',
    label: 'liter ↔ m³',
    fromUnit: 'L',
    toUnit: 'm³',
    toBase: (value) => value / 1000,
    fromBase: (value) => value * 1000,
  },
  {
    id: 'g-kg',
    label: 'gram ↔ kg',
    fromUnit: 'g',
    toUnit: 'kg',
    toBase: (value) => value / 1000,
    fromBase: (value) => value * 1000,
  },
];

const format = (value: number) => {
  if (!Number.isFinite(value)) return '';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(4);
  return Number.parseFloat(value.toPrecision(6)).toString();
};

export function UnitConverter() {
  const [conversionId, setConversionId] = useState(CONVERSIONS[0].id);
  const [value, setValue] = useState('100');
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward');
  const conversion = useMemo(
    () => CONVERSIONS.find((entry) => entry.id === conversionId) ?? CONVERSIONS[0],
    [conversionId],
  );

  const numeric = Number(value);
  const result = Number.isFinite(numeric)
    ? direction === 'forward'
      ? conversion.toBase(numeric)
      : conversion.fromBase(numeric)
    : Number.NaN;

  const fromUnit = direction === 'forward' ? conversion.fromUnit : conversion.toUnit;
  const toUnit = direction === 'forward' ? conversion.toUnit : conversion.fromUnit;

  return (
    <div className="unit-converter">
      <label className="field">
        Konvertering
        <select value={conversionId} onChange={(event) => setConversionId(event.target.value)}>
          {CONVERSIONS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.label}
            </option>
          ))}
        </select>
      </label>
      <div className="unit-row">
        <label className="field">
          {fromUnit}
          <input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        <button
          type="button"
          className="swap-button"
          onClick={() => setDirection((current) => (current === 'forward' ? 'reverse' : 'forward'))}
          aria-label="Byt retning"
        >
          ⇄
        </button>
        <div className="field disabled">
          {toUnit}
          <input value={Number.isFinite(result) ? format(result) : ''} readOnly />
        </div>
      </div>
    </div>
  );
}
