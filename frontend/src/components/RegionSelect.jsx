import React from 'react';
import { MapPin } from 'lucide-react';
import useRegions from '../hooks/useRegions';

const selectCls =
  'w-full bg-stone-900 border border-stone-700 text-stone-200 text-sm px-3 py-3 focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed appearance-none';

/**
 * State + City dropdowns. The city list depends on the chosen state, and
 * picking a new state clears the city so the pair can never be inconsistent.
 *
 * compact  -> single-row, no labels (for filter bars)
 * anyLabel -> adds an "All ..." option (for filtering rather than data entry)
 */
export default function RegionSelect({
  state,
  city,
  onChange,
  compact = false,
  anyLabel = false,
  required = false,
}) {
  const { states, citiesOf, isLoading, isError } = useRegions();
  const cities = citiesOf(state);

  if (isError) {
    return <p className="text-red-400 text-xs">Couldn't load regions. Please refresh the page.</p>;
  }

  const stateSelect = (
    <select
      value={state || ''}
      required={required}
      disabled={isLoading}
      onChange={(e) => onChange({ state: e.target.value, city: '' })}
      className={selectCls}
      aria-label="State"
    >
      <option value="">{isLoading ? 'Loading…' : anyLabel ? 'All states' : 'Select state'}</option>
      {states.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );

  const citySelect = (
    <select
      value={city || ''}
      required={required}
      disabled={!state}
      onChange={(e) => onChange({ state, city: e.target.value })}
      className={selectCls}
      aria-label="City"
    >
      <option value="">{!state ? 'Select state first' : anyLabel ? 'All cities' : 'Select city'}</option>
      {cities.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {stateSelect}
        {citySelect}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-stone-800 border border-stone-800">
      <div className="bg-stone-950 p-3">
        <label className="text-stone-600 text-xs uppercase tracking-widest flex items-center gap-1 mb-1">
          <MapPin size={10} /> State
        </label>
        {stateSelect}
      </div>
      <div className="bg-stone-950 p-3">
        <label className="text-stone-600 text-xs uppercase tracking-widest flex items-center gap-1 mb-1">
          <MapPin size={10} /> City
        </label>
        {citySelect}
      </div>
    </div>
  );
}
