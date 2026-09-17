import { useState, useEffect, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface LocationCode {
    id: number;
    barangay_id: number;
    barangay_name: string;
    location_code: string;
    location_type: string;
    location_name: string;
    description?: string | null;
    latitude: number;
    longitude: number;
    created_at?: string;
    updated_at?: string;
}

export interface LocationCodesResponse {
    barangay: {
        id: number;
        name: string;
    };
    data: LocationCode[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface UseBarangayLocationCodesQueryOptions {
    barangayId: number | null;
    debounceMs?: number;
    initialPerPage?: number;
}

export function useBarangayLocationCodesQuery({
    barangayId,
    debounceMs = 300,
    initialPerPage = 15,
}: UseBarangayLocationCodesQueryOptions) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(initialPerPage);

    const debounceTimerRef = useRef<any>(null);

    // Debounce search input and reset page to 1 when search changes
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [search, debounceMs]);

    // Reset to page 1 whenever typeFilter or barangayId changes
    const handleTypeFilterChange = (type: string) => {
        setTypeFilter(type);
        setPage(1);
    };

    // React Query queryKey
    const queryKey = [
        'admin',
        'barangay-location-codes',
        barangayId,
        {
            search: debouncedSearch,
            type: typeFilter,
            page,
            perPage,
        },
    ];

    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useQuery<LocationCodesResponse>({
        queryKey,
        queryFn: async () => {
            if (!barangayId) {
                return {
                    barangay: { id: 0, name: '' },
                    data: [],
                    current_page: 1,
                    last_page: 1,
                    per_page: perPage,
                    total: 0,
                    from: 0,
                    to: 0,
                };
            }

            const params = new URLSearchParams({
                page: String(page),
                per_page: String(perPage),
            });

            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            }
            if (typeFilter) {
                params.set('type', typeFilter);
            }

            const response = await fetch(
                `/admin/barangays/${barangayId}/location-codes?${params.toString()}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch location codes: ${response.statusText}`);
            }

            return response.json();
        },
        enabled: Boolean(barangayId),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });

    return {
        search,
        setSearch,
        debouncedSearch,
        typeFilter,
        setTypeFilter: handleTypeFilterChange,
        page,
        setPage,
        perPage,
        setPerPage,
        data,
        locationCodes: data?.data ?? [],
        total: data?.total ?? 0,
        currentPage: data?.current_page ?? page,
        lastPage: data?.last_page ?? 1,
        from: data?.from ?? 0,
        to: data?.to ?? 0,
        isLoading,
        isFetching,
        error,
        refetch,
        queryKey,
    };
}
