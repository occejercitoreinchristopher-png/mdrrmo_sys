import { useState, useEffect, useRef } from 'react';
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
    category: string;
    incident: string;
    month: string;
    time: string;
    barangay: string;
    customIncidents?: Record<string, string[]>;
    initialIncidents?: any[];
    initialTotal?: number;
    debounceMs?: number;
    initialPerPage?: number;
}

export function useIncidentRecordsQuery({
    enabled,
    category,
    incident,
    month,
    time,
    barangay,
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

    // Reset to page 1 whenever any dropdown filter or perPage changes
    useEffect(() => {
        setPage(1);
    }, [category, incident, month, time, barangay, perPage]);

    const isDefaultUnfilteredPage1 =
        page === 1 &&
        !debouncedSearch &&
        category === 'all' &&
        incident === 'all' &&
        month === 'all' &&
        time === 'all' &&
        barangay === 'all';

    const fallbackTotal = initialTotal ?? initialIncidents.length;

    const queryKey = [
        'dispatcher',
        'incident-records',
        {
            search: debouncedSearch,
            category,
            incident,
            month,
            time,
            barangay,
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
            if (category && category !== 'all') params.set('category', category);
            if (incident && incident !== 'all') params.set('incident', incident);
            if (month && month !== 'all') params.set('month', month);
            if (time && time !== 'all') params.set('time', time);
            if (barangay && barangay !== 'all') params.set('barangay', barangay);

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

    // Immediate zero-flash fallback while initial query loads on unfiltered page 1
    const effectiveRecords =
        data?.data ??
        (isDefaultUnfilteredPage1 ? initialIncidents.slice(0, perPage) : []);

    const effectiveTotal =
        data?.total ?? (isDefaultUnfilteredPage1 ? fallbackTotal : 0);

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
