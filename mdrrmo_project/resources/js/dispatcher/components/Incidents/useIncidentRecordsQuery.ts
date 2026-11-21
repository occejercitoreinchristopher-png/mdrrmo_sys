import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface IncidentRecordsResponse {
    data: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    overall_total: number;
    from: number;
    to: number;
}

interface UseIncidentRecordsQueryOptions {
    enabled: boolean;
    categories: string[];
    incidents: string[];
    years?: string[];
    months: string[];
    times: string[];
    barangays: string[];
    customIncidents?: Record<string, string[]>;
    initialIncidents?: any[];
    initialTotal?: number;
    debounceMs?: number;
    initialPerPage?: number;
}

export function useIncidentRecordsQuery({
    enabled,
    categories,
    incidents,
    years = [],
    months,
    times,
    barangays,
    customIncidents = {},
    initialIncidents = [],
    initialTotal,
    debounceMs = 350,
    initialPerPage = 10,
}: UseIncidentRecordsQueryOptions) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(initialPerPage);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce keyword search and reset pagination to page 1
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const trimmed = searchQuery.trim();
            setDebouncedSearch((prev) => {
                if (prev !== trimmed) {
                    setPage(1);
                }
                return trimmed;
            });
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery, debounceMs]);

    const categoriesKey = categories.join('\x1f');
    const incidentsKey = incidents.join('\x1f');
    const yearsKey = years.join('\x1f');
    const monthsKey = months.join('\x1f');
    const timesKey = times.join('\x1f');
    const barangaysKey = barangays.join('\x1f');

    // Reset to page 1 whenever any dropdown filter or perPage changes
    useEffect(() => {
        setPage(1);
    }, [categoriesKey, incidentsKey, yearsKey, monthsKey, timesKey, barangaysKey, perPage]);

    const isDefaultUnfilteredPage1 =
        page === 1 &&
        !debouncedSearch &&
        categories.length === 0 &&
        incidents.length === 0 &&
        years.length === 0 &&
        months.length === 0 &&
        times.length === 0 &&
        barangays.length === 0;

    const fallbackTotal = initialTotal ?? initialIncidents.length;

    const queryKey = [
        'dispatcher',
        'incident-records',
        {
            search: debouncedSearch,
            categories: categoriesKey,
            incidents: incidentsKey,
            years: yearsKey,
            months: monthsKey,
            times: timesKey,
            barangays: barangaysKey,
            page,
            perPage,
        },
    ];

    const {
        data,
        isLoading,
        isFetching,
        isPlaceholderData,
        error,
        refetch,
    } = useQuery<IncidentRecordsResponse>({
        queryKey,
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({
                page: String(page),
                per_page: String(perPage),
            });

            if (debouncedSearch) params.set('search', debouncedSearch);
            categories.forEach((c) => params.append('category[]', c));
            incidents.forEach((i) => params.append('incident[]', i));
            years.forEach((y) => params.append('year[]', y));
            months.forEach((m) => params.append('month[]', m));
            times.forEach((t) => params.append('time[]', t));
            barangays.forEach((b) => params.append('barangay[]', b));

            if (customIncidents && Object.keys(customIncidents).length > 0) {
                params.set('custom_incidents', JSON.stringify(customIncidents));
            }

            const res = await fetch(`/dispatcher/incidents/records?${params.toString()}`, {
                signal,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch incident records (${res.status})`);
            }

            return (await res.json()) as IncidentRecordsResponse;
        },
        enabled,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2, // 2 minutes cache
    });

    const isDebouncing = searchQuery.trim() !== debouncedSearch;

    // Local client-side filtered fallback for initialIncidents (for instant zero-flash/local filtering)
    const localFilteredFallback = useMemo(() => {
        if (!initialIncidents || initialIncidents.length === 0) return [];
        if (isDefaultUnfilteredPage1) return initialIncidents;

        return initialIncidents.filter((row: any) => {
            if (years.length > 0) {
                const rawDate = row.reported_at || row.created_at || row.incident_date;
                if (!rawDate) return false;
                const d = new Date(rawDate);
                if (isNaN(d.getTime())) return false;
                const y = d.getFullYear().toString();
                if (!years.includes(y)) return false;
            }
            return true;
        });
    }, [isDefaultUnfilteredPage1, initialIncidents, yearsKey]);

    // Immediate zero-flash fallback while initial query loads on unfiltered page 1
    const effectiveRecords =
        data?.data ??
        (isDefaultUnfilteredPage1
            ? initialIncidents.slice(0, perPage)
            : localFilteredFallback.slice((page - 1) * perPage, page * perPage));

    const effectiveTotal =
        data?.total ?? (isDefaultUnfilteredPage1 ? fallbackTotal : localFilteredFallback.length);

    const effectiveOverallTotal = data?.overall_total ?? fallbackTotal;
    const effectiveCurrentPage = data?.current_page ?? page;
    const effectiveLastPage =
        data?.last_page ?? Math.max(1, Math.ceil(effectiveTotal / perPage));
    const effectiveFrom =
        data?.from ?? (effectiveTotal > 0 ? (effectiveCurrentPage - 1) * perPage + 1 : 0);
    const effectiveTo =
        data?.to ?? (effectiveTotal > 0 ? Math.min(effectiveCurrentPage * perPage, effectiveTotal) : 0);

    const clearSearch = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setSearchQuery('');
        setDebouncedSearch('');
        setPage(1);
    };

    const handlePerPageChange = (nextPerPage: number) => {
        setPerPage(nextPerPage);
        setPage(1);
    };

    return {
        records: effectiveRecords,
        searchQuery,
        setSearchQuery,
        debouncedSearch,
        isDebouncing,
        clearSearch,
        page: effectiveCurrentPage,
        setPage,
        perPage,
        setPerPage: handlePerPageChange,
        lastPage: effectiveLastPage,
        total: effectiveTotal,
        overallTotal: effectiveOverallTotal,
        from: effectiveFrom,
        to: effectiveTo,
        isLoading: isLoading && !data && !isDefaultUnfilteredPage1,
        isFetching,
        isPlaceholderData,
        error,
        refetch,
    };
}
