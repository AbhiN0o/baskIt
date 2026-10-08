import { useQuery } from '@tanstack/react-query';
import { getRegions } from '../lib/api';

// All states -> cities, fetched once and cached for the whole session.
export default function useRegions() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['regions'],
    queryFn: getRegions,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const regions = data || {};
  const states = Object.keys(regions);
  return { regions, states, citiesOf: (state) => regions[state] || [], isLoading, isError };
}
