import { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { 
    Plus, 
    Pencil, 
    Trash2, 
    MapPin, 
    ArrowLeft, 
    Eye, 
    Search, 
    Filter,
    Compass,
    Building2,
    CheckCircle2
} from 'lucide-react';
import DataTable, { Column } from '@/shared/components/DataTable';
import Button from '@/shared/components/Button';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import SearchInput from '@/shared/components/SearchInput';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Pagination from '@/shared/components/Pagination';
import LocationCodeFormModal, { LOCATION_TYPES } from './LocationCodeFormModal';
import ViewLocationModal from './ViewLocationModal';
import { useBarangayLocationCodesQuery, LocationCode } from './useBarangayLocationCodesQuery';

interface LocationCode {
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

interface Barangay {
    id: number;
    name: string;
    municipality: string;
    province: string;
    location_codes_count: number;
    location_codes?: LocationCode[];
}

interface BarangayTableProps {
    barangays: Barangay[];
}

export default function BarangayTable({ barangays = [] }: BarangayTableProps) {
    const { errors = {} } = usePage().props as any;

    // View state: selected barangay for drill-down
    const [selectedBarangayId, setSelectedBarangayId] = useState<number | null>(null);

    // Filter states for Barangay list
    const [barangaySearch, setBarangaySearch] = useState('');

    // TanStack Query for Location Codes under selected barangay
    const {
        search: codeSearch,
        setSearch: setCodeSearch,
        debouncedSearch,
        typeFilter: selectedTypeFilter,
        setTypeFilter: setSelectedTypeFilter,
        page,
        setPage,
        perPage,
        locationCodes,
        total: activeLocationCodesTotal,
        currentPage,
        lastPage,
        from,
        to,
        isLoading: codesLoading,
        isFetching: codesFetching,
        refetch: refetchLocationCodes,
    } = useBarangayLocationCodesQuery({
        barangayId: selectedBarangayId,
        debounceMs: 300,
        initialPerPage: 15,
    });

    // Modal states
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<LocationCode | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<LocationCode | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [viewTarget, setViewTarget] = useState<LocationCode | null>(null);

    // Current selected barangay object
    const selectedBarangay = useMemo(() => {
        if (!selectedBarangayId) return null;
        return barangays.find((b) => b.id === selectedBarangayId) ?? null;
    }, [barangays, selectedBarangayId]);

    // Total location codes across all 14 barangays
    const totalLocationCodesCount = useMemo(() => {
        return barangays.reduce((acc, b) => acc + (b.location_codes_count || 0), 0);
    }, [barangays]);

    // Filtered Barangays (14 Official Barangays)
    const filteredBarangays = useMemo(() => {
        const q = barangaySearch.toLowerCase().trim();
        if (!q) return barangays;
        return barangays.filter((b) => b.name.toLowerCase().includes(q));
    }, [barangays, barangaySearch]);

    // Open create code modal
    const handleOpenCreateCode = () => {
        setEditingCode(null);
        setFormModalOpen(true);
    };

    // Open edit code modal
    const handleOpenEditCode = (code: LocationCode) => {
        setEditingCode(code);
        setFormModalOpen(true);
    };

    // Form submit for Add / Edit
    const handleFormSubmit = (formData: any) => {
        setSubmitting(true);
        if (editingCode) {
            router.patch(`/admin/location-codes/${editingCode.id}`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setFormModalOpen(false);
                    setSubmitting(false);
                    setEditingCode(null);
                    refetchLocationCodes();
                },
                onError: () => {
                    setSubmitting(false);
                },
            });
        } else if (selectedBarangay) {
            router.post(`/admin/barangays/${selectedBarangay.id}/location-codes`, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    setFormModalOpen(false);
                    setSubmitting(false);
                    refetchLocationCodes();
                },
                onError: () => {
                    setSubmitting(false);
                },
            });
        }
    };

    // Delete Location Code handler
    const handleDeleteLocationCode = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/location-codes/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setDeleting(false);
                refetchLocationCodes();
            },
            onError: () => {
                setDeleting(false);
            },
        });
    };

    // Columns for the 14 Barangays Table
    const barangayColumns: Column<Barangay>[] = [
        {
            key: 'index',
            header: '#',
            render: (_: any, __: Barangay, index: number) => (
                <span className="font-mono text-xs text-slate-400">#{index + 1}</span>
            ),
        },
        {
            key: 'name',
            header: 'Barangay Name',
            sortable: true,
            render: (v: string, row: Barangay) => (
                <div 
                    onClick={() => setSelectedBarangayId(row.id)}
                    className="cursor-pointer group flex items-center gap-2"
                >
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {v}
                    </span>
                </div>
            ),
        },
        {
            key: 'municipality',
            header: 'Municipality',
            render: (v: string) => <span className="text-slate-600 dark:text-slate-300">{v}</span>,
        },
        {
            key: 'province',
            header: 'Province',
            render: (v: string) => <span className="text-slate-600 dark:text-slate-300">{v}</span>,
        },
        {
            key: 'location_codes_count',
            header: 'Location Codes',
            sortable: true,
            render: (count: number, row: Barangay) => {
                const total = count || row.location_codes?.length || 0;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        total > 0
                            ? 'bg-primary/10 text-primary border border-primary/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                        <MapPin className="w-3 h-3" />
                        {total} {total === 1 ? 'code' : 'codes'}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Action',
            render: (_: any, row: Barangay) => (
                <Button
                    size="sm"
                    variant="admin"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBarangayId(row.id);
                    }}
                    className="text-xs"
                >
                    <Compass className="w-3.5 h-3.5" />
                    Manage Codes
                </Button>
            ),
        },
    ];

    // Helper to get type badge styling
    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'Post / Streetlight':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
            case 'Bridge':
                return 'bg-sky-500/10 text-sky-500 border-sky-500/30';
            case 'Barangay Hall':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
            case 'School':
                return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30';
            case 'Health Facility':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
            case 'Evacuation Center':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
            case 'Road':
                return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
            default:
                return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
        }
    };

    // Columns for Location Codes Table under the selected Barangay
    const locationCodeColumns: Column<LocationCode>[] = [
        {
            key: 'location_code',
            header: 'Code',
            sortable: true,
            render: (code: string) => (
                <span className="font-mono text-xs font-bold bg-slate-900 dark:bg-slate-950 text-primary border border-primary/30 px-2.5 py-1 rounded-md tracking-wider">
                    {code}
                </span>
            ),
        },
        {
            key: 'location_type',
            header: 'Type',
            sortable: true,
            render: (type: string) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getTypeBadgeClass(type)}`}>
                    {type}
                </span>
            ),
        },
        {
            key: 'location_name',
            header: 'Location / Landmark',
            sortable: true,
            render: (name: string, row: LocationCode) => (
                <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {name}
                    </div>
                    {row.description && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                            {row.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'coordinates',
            header: 'Coordinates',
            render: (_: any, row: LocationCode) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setViewTarget(row);
                    }}
                    title="View on Map"
                    className="font-mono text-xs text-slate-700 dark:text-slate-300 hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                        {Number(row.latitude).toFixed(6)}, {Number(row.longitude).toFixed(6)}
                    </span>
                </button>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (_: any, row: LocationCode) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            setViewTarget(row);
                        }}
                        title="View on Map"
                    >
                        <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                        size="xs"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCode(row);
                        }}
                        title="Edit Location Code"
                    >
                        <Pencil className="w-3 h-3" />
                        Edit
                    </Button>
                    <Button
                        size="xs"
                        variant="danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(row);
                        }}
                        title="Delete Location Code"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            ),
        },
    ];

    // ==========================================
    // VIEW 1: OVERVIEW OF 14 OFFICIAL BARANGAYS
    // ==========================================
    if (!selectedBarangay) {
        return (
            <div className="space-y-5">
                <PageHeader
                    title="Barangay Management"
                    subtitle="Manage emergency location codes for Opol's 14 official barangays."
                />

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-4 flex items-center gap-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{barangays.length || 14}</div>
                            <div className="text-xs text-slate-400 font-medium">Official Opol Barangays (Fixed)</div>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black">{totalLocationCodesCount}</div>
                            <div className="text-xs text-slate-400 font-medium">Registered Location Codes</div>
                        </div>
                    </Card>

                    <Card className="p-4 flex items-center gap-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-white/10 sm:col-span-2 lg:col-span-1">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                            <Compass className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-sky-400">Dispatcher Ready</div>
                            <div className="text-xs text-slate-400 mt-0.5">Admin codes instantly sync to Search & Pinpoint</div>
                        </div>
                    </Card>
                </div>

                <Card padding={false}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-white/10">
                        <SearchInput
                            placeholder="Search 14 barangays..."
                            onChange={setBarangaySearch}
                            className="w-full sm:max-w-sm"
                        />
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Showing {filteredBarangays.length} of 14 Barangays
                        </div>
                    </div>

                    <div className="p-4">
                        <DataTable
                            columns={barangayColumns}
                            data={filteredBarangays}
                            keyField="id"
                            emptyTitle="No barangay matching search"
                            emptyIcon={MapPin}
                        />
                    </div>
                </Card>
            </div>
        );
    }

    // ==================================================
    // VIEW 2: LOCATION CODE MANAGEMENT (SELECTED BARANGAY)
    // ==================================================
    return (
        <div className="space-y-5">
            {/* Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedBarangayId(null);
                            setCodeSearch('');
                            setSelectedTypeFilter('');
                            setPage(1);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer mb-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to 14 Barangays
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            Barangay {selectedBarangay.name}
                        </h1>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/15 text-primary border border-primary/25">
                            {activeLocationCodesTotal} {activeLocationCodesTotal === 1 ? 'Location Code' : 'Location Codes'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Manage exact emergency reference markers and coordinates for Barangay {selectedBarangay.name}.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        onClick={handleOpenCreateCode}
                        variant="admin"
                        className="gap-2 shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Add Location Code
                    </Button>
                </div>
            </div>

            {/* Location Codes Table & Filters Card */}
            <Card padding={false}>
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border-b border-slate-200 dark:border-white/10">
                    <SearchInput
                        placeholder="Search code, name, description..."
                        value={codeSearch}
                        onChange={setCodeSearch}
                        debounce={0}
                        className="w-full sm:flex-1 sm:max-w-xs"
                    />

                    <div className="w-full sm:w-auto flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            value={selectedTypeFilter}
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="w-full sm:w-56 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        >
                            <option value="">All Location Types</option>
                            {LOCATION_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {codesFetching && !codesLoading && (
                            <span className="inline-flex items-center gap-1 text-primary font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                Searching...
                            </span>
                        )}
                        <span>
                            Showing {from}–{to} of {activeLocationCodesTotal} codes
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    <DataTable
                        columns={locationCodeColumns}
                        data={locationCodes}
                        loading={codesLoading}
                        keyField="id"
                        emptyTitle="No location codes found"
                        emptyDescription={
                            debouncedSearch || selectedTypeFilter
                                ? 'No location codes match your filter criteria.'
                                : `No location codes have been registered yet for Barangay ${selectedBarangay.name}. Click "+ Add Location Code" to register emergency markers.`
                        }
                        emptyIcon={MapPin}
                    />

                    {/* Pagination */}
                    {activeLocationCodesTotal > perPage && (
                        <div className="pt-3 border-t border-slate-200 dark:border-white/10 mt-3">
                            <Pagination
                                currentPage={currentPage}
                                lastPage={lastPage}
                                total={activeLocationCodesTotal}
                                perPage={perPage}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            </Card>

            {/* Add / Edit Location Code Modal with Mapbox */}
            {selectedBarangay && (
                <LocationCodeFormModal
                    open={formModalOpen}
                    onClose={() => {
                        setFormModalOpen(false);
                        setEditingCode(null);
                    }}
                    barangay={{ 
                        id: selectedBarangay.id, 
                        name: selectedBarangay.name,
                        location_codes: selectedBarangay.location_codes ?? []
                    }}
                    locationCode={editingCode}
                    onSubmit={handleFormSubmit}
                    loading={submitting}
                    errors={errors}
                />
            )}

            {/* View Location on Map Modal */}
            <ViewLocationModal
                open={Boolean(viewTarget)}
                onClose={() => setViewTarget(null)}
                locationCode={viewTarget}
            />

            {/* Confirm Delete Location Code Dialog */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteLocationCode}
                loading={deleting}
                title="Delete Location Code"
                description={
                    deleteTarget
                        ? `Are you sure you want to delete location code "${deleteTarget.location_code}" (${deleteTarget.location_name})? This action cannot be undone. The barangay itself will NOT be affected.`
                        : ''
                }
                confirmLabel="Delete Location Code"
            />
        </div>
    );
}
