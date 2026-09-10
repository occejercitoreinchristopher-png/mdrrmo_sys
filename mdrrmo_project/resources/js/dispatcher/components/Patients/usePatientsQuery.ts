import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface PatientRecord {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    full_name: string;
    birthdate?: string | null;
    age?: number | null;
    gender?: string | null;
    contact_number?: string | null;
    barangay?: string | null;
    house_no?: string | null;
    street?: string | null;
    address?: string | null;
    care_records_count?: number;
    created_at?: string | null;
}

interface UsePatientsQueryOptions {
    initialData?: PatientRecord[];
    debounceMs?: number;
    enabled?: boolean;
}

export function usePatientsQuery({
    initialData = [],
    debounceMs = 300,
    enabled = true,
}: UsePatientsQueryOptions = {}) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debounceTimerRef = useRef<any>(null);

    // Handle debouncing
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [search, debounceMs]);

    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useQuery({
        queryKey: ['dispatcher-patients', debouncedSearch],
        queryFn: async () => {
            const url = `/dispatcher/patients/search?search=${encodeURIComponent(debouncedSearch)}`;
            const response = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch patients: ${response.statusText}`);
            }

            const json = await response.json();
            return json.patients as PatientRecord[];
        },
        enabled: enabled && debouncedSearch.length > 0,
        staleTime: 1000 * 60 * 3, // Cache results for 3 minutes
        placeholderData: (previousData) => previousData,
    });

    // When no search query is active, fallback to initialData from server Inertia prop
    const effectivePatients: PatientRecord[] = debouncedSearch.length > 0
        ? (data ?? [])
        : initialData;

    const clearSearch = () => {
        setSearch('');
        setDebouncedSearch('');
    };

    return {
        patients: effectivePatients,
        search,
        setSearch,
        debouncedSearch,
        clearSearch,
        isLoading: debouncedSearch.length > 0 && isLoading,
        isFetching,
        isSearching: search !== debouncedSearch || isFetching,
        error,
        refetch,
        total: effectivePatients.length,
    };
}
