import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Phone,
    PhoneCall,
    Plus,
    Pencil,
    Trash2,
    Search,
    ShieldCheck,
    Flame,
    HeartPulse,
    Siren,
    Shield,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    Radio,
    Sparkles,
    PhoneForwarded,
    LayoutGrid,
    List,
} from 'lucide-react';
import AdminLayout from '@/admin/layouts/AdminLayout';
import PageHeader from '@/shared/components/PageHeader';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import SearchInput from '@/shared/components/SearchInput';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
import Pagination from '@/shared/components/Pagination';

export interface EmergencyHotline {
    id: number;
    name: string;
    short_label?: string | null;
    phone_number: string;
    description?: string | null;
    icon_type: string;
    accent_color: string;
    is_active: boolean;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

interface HotlinesIndexProps {
    hotlines: EmergencyHotline[];
    filters: {
        search?: string;
    };
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
    };
}

const ICON_OPTIONS = [
    { value: 'siren', label: 'Siren (MDRRMO / Rescue)', Icon: Siren },
    { value: 'police', label: 'Police Shield (PNP)', Icon: ShieldCheck },
    { value: 'fire', label: 'Flame (BFP / Fire)', Icon: Flame },
    { value: 'medical', label: 'Medical Pulse (RHU / DOH)', Icon: HeartPulse },
    { value: 'shield', label: 'Security Shield', Icon: Shield },
    { value: 'phone', label: 'Standard Phone', Icon: Phone },
];

const COLOR_PRESETS = [
    { label: 'Blue', value: '#1D4ED8' },
    { label: 'Orange', value: '#C2410C' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Sky Blue', value: '#208AEF' },
    { label: 'Rose', value: '#E11D48' },
    { label: 'Purple', value: '#7C3AED' },
    { label: 'Amber', value: '#D97706' },
];

export function getHotlineIcon(iconType: string) {
    switch (iconType) {
        case 'police':
            return ShieldCheck;
        case 'fire':
            return Flame;
        case 'medical':
            return HeartPulse;
        case 'shield':
            return Shield;
        case 'phone':
            return Phone;
        case 'siren':
        default:
            return Siren;
    }
}

export default function HotlinesIndex({
    hotlines = [],
    filters = {},
    pagination,
    stats,
}: HotlinesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingHotline, setEditingHotline] = useState<EmergencyHotline | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<EmergencyHotline | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        short_label: '',
        phone_number: '',
        description: '',
        icon_type: 'siren',
        accent_color: '#208AEF',
        is_active: true,
        sort_order: 1,
    });

    const handleCopyNumber = (id: number, number: string) => {
        navigator.clipboard.writeText(number);
        setCopiedId(id);
        toast.success(`Copied ${number} to clipboard`);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSearch = (q: string) => {
        setSearch(q);
        router.get(
            '/admin/hotlines',
            { search: q || undefined },
            { preserveState: true, replace: true }
        );
    };

    const openCreateModal = () => {
        const nextOrder = (hotlines.length > 0 ? Math.max(...hotlines.map(h => h.sort_order || 0)) : 0) + 1;
        setEditingHotline(null);
        setFormData({
            name: '',
            short_label: '',
            phone_number: '',
            description: '',
            icon_type: 'siren',
            accent_color: '#208AEF',
            is_active: true,
            sort_order: nextOrder,
        });
        setModalOpen(true);
    };

    const openEditModal = (hotline: EmergencyHotline) => {
        setEditingHotline(hotline);
        setFormData({
            name: hotline.name,
            short_label: hotline.short_label || '',
            phone_number: hotline.phone_number,
            description: hotline.description || '',
            icon_type: hotline.icon_type || 'siren',
            accent_color: hotline.accent_color || '#208AEF',
            is_active: Boolean(hotline.is_active),
            sort_order: hotline.sort_order ?? 1,
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (editingHotline) {
            router.put(`/admin/hotlines/${editingHotline.id}`, formData, {
                onSuccess: () => {
                    setModalOpen(false);
                    setSubmitting(false);
                    toast.success('Emergency hotline updated successfully');
                },
                onError: (err) => {
                    setSubmitting(false);
                    toast.error(Object.values(err)[0] as string || 'Failed to update hotline');
                },
            });
        } else {
            router.post('/admin/hotlines', formData, {
                onSuccess: () => {
                    setModalOpen(false);
                    setSubmitting(false);
                    toast.success('New emergency hotline created successfully');
                },
                onError: (err) => {
                    setSubmitting(false);
                    toast.error(Object.values(err)[0] as string || 'Failed to create hotline');
                },
            });
        }
    };

    const handleToggleActive = (hotline: EmergencyHotline) => {
        router.patch(`/admin/hotlines/${hotline.id}/toggle-active`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Hotline ${hotline.is_active ? 'deactivated' : 'activated'}`);
            },
            onError: () => {
                toast.error('Failed to change hotline status');
            },
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/hotlines/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success('Hotline deleted successfully');
            },
            onError: () => {
                toast.error('Failed to delete hotline');
            },
        });
    };

    return (
        <AdminLayout title="Emergency Hotlines Directory">
            <Head title="Emergency Hotlines Directory | Admin" />

            <div className="space-y-6">
                {/* Header */}
                <PageHeader
                    title="Emergency Hotlines Directory"
                    subtitle="Centralized hotline configuration synchronized in real-time across Resident Mobile App and Web Command Center."
                    actions={
                        <Button
                            variant="primary"
                            onClick={openCreateModal}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 px-4 py-2.5 rounded-xl"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Emergency Hotline</span>
                        </Button>
                    }
                />

                {/* Top Telemetry Metric Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 bg-slate-900/60 dark:bg-slate-900/80 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Hotlines</p>
                                <p className="text-2xl font-black text-white mt-1">{stats?.total ?? hotlines.length}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Configured emergency agencies</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                <Phone className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 dark:bg-slate-900/80 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live on Mobile App</p>
                                <p className="text-2xl font-black text-emerald-400 mt-1">{stats?.active ?? hotlines.filter(h => h.is_active).length}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Available for residents to dial</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Radio className="w-5 h-5 animate-pulse" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-900/60 dark:bg-slate-900/80 border-slate-800 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Inactive / Standby</p>
                                <p className="text-2xl font-black text-amber-400 mt-1">{stats?.inactive ?? hotlines.filter(h => !h.is_active).length}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Hidden from mobile directory</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                <XCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter and View Switcher Bar */}
                <Card className="p-4 bg-slate-900/60 dark:bg-slate-900/80 border-slate-800">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex-1 max-w-md">
                            <SearchInput
                                value={search}
                                onChange={handleSearch}
                                placeholder="Search agency name, tag, phone number..."
                            />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="hidden sm:inline">Syncs live on resident mobile app</span>
                            </div>

                            {/* Tactical Layout Switcher */}
                            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('cards')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        viewMode === 'cards'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>Tactical Cards</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        viewMode === 'table'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <List className="w-3.5 h-3.5" />
                                    <span>Data Table</span>
                                </button>
                            </div>

                            {/* Prominent Quick Add Hotline Button */}
                            <Button
                                variant="primary"
                                onClick={openCreateModal}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 px-3.5 py-1.5 rounded-xl text-xs"
                            >
                                <Plus className="w-4 h-4" />
                                <span>+ Add Hotline</span>
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Hotlines Content: Tactical Cards vs Data Table */}
                {viewMode === 'cards' ? (
                    /* TACTICAL CARD GRID LAYOUT */
                    <div>
                        {hotlines.length === 0 ? (
                            <Card className="p-12 text-center text-slate-500 border-slate-800 bg-slate-900/40">
                                <Phone className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-50" />
                                <p className="font-bold text-white text-base">No emergency hotlines found</p>
                                <p className="text-xs text-slate-500 mt-1">Click "Add Emergency Hotline" above to configure an emergency agency.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                {hotlines.map((hotline, idx) => {
                                    const IconComp = getHotlineIcon(hotline.icon_type);
                                    const isCopied = copiedId === hotline.id;

                                    return (
                                        <div
                                            key={hotline.id}
                                            className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/90 hover:border-slate-700/80 transition-all duration-200 overflow-hidden shadow-lg hover:shadow-2xl flex flex-col justify-between"
                                        >
                                            {/* Top dynamic colored accent strip */}
                                            <div
                                                className="h-1.5 w-full transition-all"
                                                style={{ backgroundColor: hotline.accent_color }}
                                            />

                                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                {/* Card Header: Tactical Avatar, Name, Short Tag, and Action Buttons */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md transition-transform group-hover:scale-105"
                                                            style={{
                                                                backgroundColor: `${hotline.accent_color}1A`,
                                                                borderColor: `${hotline.accent_color}4D`,
                                                                color: hotline.accent_color,
                                                            }}
                                                        >
                                                            <IconComp className="w-6 h-6" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-extrabold text-base text-white tracking-tight leading-tight truncate">
                                                                    {hotline.name}
                                                                </h4>
                                                                {hotline.short_label && (
                                                                    <span
                                                                        className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider shrink-0"
                                                                        style={{
                                                                            backgroundColor: `${hotline.accent_color}20`,
                                                                            borderColor: `${hotline.accent_color}50`,
                                                                            color: hotline.accent_color,
                                                                        }}
                                                                    >
                                                                        {hotline.short_label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                                                                <span className="text-slate-400 font-bold">ORD #{String(hotline.sort_order || idx + 1).padStart(2, '0')}</span>
                                                                <span>•</span>
                                                                <span className="text-slate-500 font-semibold">SYS #{hotline.id}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Edit & Delete Action Buttons */}
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(hotline)}
                                                            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 shadow-sm"
                                                            title="Edit Hotline"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(hotline)}
                                                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition border border-rose-500/20 shadow-sm"
                                                            title="Delete Hotline"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Description / Scope of Emergency */}
                                                <p className="text-xs text-slate-300/80 leading-relaxed min-h-[34px] line-clamp-2">
                                                    {hotline.description || '24/7 designated emergency response line for residents and field dispatch.'}
                                                </p>

                                                {/* Tactical Dispatch Number & Console */}
                                                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                                                            style={{
                                                                backgroundColor: `${hotline.accent_color}1F`,
                                                                borderColor: `${hotline.accent_color}40`,
                                                                color: hotline.accent_color,
                                                            }}
                                                        >
                                                            <PhoneCall className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tactical Dispatch Number</p>
                                                            <p className="font-mono font-black text-sm text-white tracking-wide truncate">
                                                                {hotline.phone_number}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyNumber(hotline.id, hotline.phone_number)}
                                                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 shrink-0"
                                                        title="Copy phone number"
                                                    >
                                                        {isCopied ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                <span className="text-emerald-400 font-bold">Copied</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5" />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Footer: Color Accent indicator & Interactive Mobile Status Pill */}
                                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full border border-white/20"
                                                            style={{ backgroundColor: hotline.accent_color }}
                                                        />
                                                        <span className="text-[11px] font-mono text-slate-400 font-semibold">{hotline.accent_color}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleActive(hotline)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition shadow-sm ${
                                                            hotline.is_active
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700/50'
                                                        }`}
                                                        title="Click to toggle mobile app visibility"
                                                    >
                                                        {hotline.is_active ? (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                <span>Live on Mobile</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                                <span>Standby / Inactive</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Quick Add Hotline Tactical Slot Card */}
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="group relative rounded-2xl border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-blue-500/5 transition-all duration-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] shadow-sm hover:shadow-xl"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center mb-3 group-hover:scale-110 shadow-md">
                                        <Plus className="w-7 h-7" />
                                    </div>
                                    <p className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">
                                        + Add Emergency Hotline
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                                        Click to register a new emergency agency line for immediate resident mobile access
                                    </p>
                                </button>
                            </div>
                        )}

                        {pagination && pagination.lastPage > 1 && (
                            <div className="pt-4">
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    lastPage={pagination.lastPage}
                                    total={pagination.total}
                                    perPage={pagination.perPage}
                                    onPageChange={(page) => {
                                        router.get(
                                            '/admin/hotlines',
                                            { page, search: search || undefined },
                                            { preserveState: true }
                                        );
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* COMPACT DATA TABLE LAYOUT */
                    <Card className="border-slate-800 overflow-hidden bg-slate-900/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-800 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Agency / Service</th>
                                        <th className="px-6 py-4">Phone Number</th>
                                        <th className="px-6 py-4">Emergency Scope</th>
                                        <th className="px-6 py-4">Display Accent</th>
                                        <th className="px-6 py-4">Mobile Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/70">
                                    {hotlines.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                <Phone className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                                                <p className="font-semibold text-slate-400">No emergency hotlines found</p>
                                                <p className="text-xs text-slate-600 mt-1">Click "Add Emergency Hotline" to create a new directory entry.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        hotlines.map((hotline, idx) => {
                                            const IconComp = getHotlineIcon(hotline.icon_type);
                                            const isCopied = copiedId === hotline.id;

                                            return (
                                                <tr
                                                    key={hotline.id}
                                                    className="hover:bg-slate-800/30 transition-colors duration-150"
                                                >
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">
                                                        #{hotline.sort_order || idx + 1}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                                                                style={{
                                                                    backgroundColor: `${hotline.accent_color}1A`,
                                                                    borderColor: `${hotline.accent_color}4D`,
                                                                    color: hotline.accent_color,
                                                                }}
                                                            >
                                                                <IconComp className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white text-sm">
                                                                        {hotline.name}
                                                                    </span>
                                                                    {hotline.short_label && (
                                                                        <span
                                                                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border"
                                                                            style={{
                                                                                backgroundColor: `${hotline.accent_color}15`,
                                                                                borderColor: `${hotline.accent_color}33`,
                                                                                color: hotline.accent_color,
                                                                            }}
                                                                        >
                                                                            {hotline.short_label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    ID: {hotline.id} • Order: {hotline.sort_order}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 font-mono font-bold text-white">
                                                        <div className="flex items-center gap-2">
                                                            <span>{hotline.phone_number}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyNumber(hotline.id, hotline.phone_number)}
                                                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                                                                title="Copy number"
                                                            >
                                                                {isCopied ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                                                        {hotline.description || '—'}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                                                                style={{ backgroundColor: hotline.accent_color }}
                                                            />
                                                            <span className="font-mono text-xs text-slate-400">
                                                                {hotline.accent_color}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleActive(hotline)}
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
                                                                hotline.is_active
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/50'
                                                            }`}
                                                            title="Click to toggle mobile app visibility"
                                                        >
                                                            {hotline.is_active ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                    <span>Active (Live)</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                                    <span>Inactive</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(hotline)}
                                                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
                                                                title="Edit Hotline"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteTarget(hotline)}
                                                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition border border-rose-500/20"
                                                                title="Delete Hotline"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                    {/* Pagination */}
                    {pagination && pagination.lastPage > 1 && (
                        <div className="p-4 border-t border-slate-800">
                            <Pagination
                                currentPage={pagination.currentPage}
                                lastPage={pagination.lastPage}
                                total={pagination.total}
                                perPage={pagination.perPage}
                                onPageChange={(page) => {
                                    router.get(
                                        '/admin/hotlines',
                                        { page, search: search || undefined },
                                        { preserveState: true }
                                    );
                                }}
                            />
                        </div>
                    )}
                </Card>
            )}
            </div>

            {/* Modal: Add or Edit Hotline */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <PhoneForwarded className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        {editingHotline ? 'Edit Emergency Hotline' : 'Add Emergency Hotline'}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Configures agency contact details displayed on the resident app.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Agency Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Agency / Service Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Police, Fire Dept., Red Cross"
                                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Short Label & Phone Number Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Short Tag / Acronym
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.short_label}
                                        onChange={(e) => setFormData({ ...formData, short_label: e.target.value })}
                                        placeholder="e.g. PNP, BFP, RHU"
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Phone / Mobile Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="e.g. 09358056370"
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Emergency Scope / Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g. 24/7 disaster & emergency response"
                                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            {/* Icon Type Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                    Display Icon
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ICON_OPTIONS.map(({ value, label, Icon }) => {
                                        const isSelected = formData.icon_type === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon_type: value })}
                                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition ${
                                                    isSelected
                                                        ? 'bg-blue-600/20 border-blue-500 text-white'
                                                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                                                <span className="truncate">{label.split(' ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Accent Color Selection & Sort Order */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                        Card Color Theme
                                    </label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {COLOR_PRESETS.map((preset) => (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, accent_color: preset.value })}
                                                className={`w-7 h-7 rounded-full border-2 transition ${
                                                    formData.accent_color.toLowerCase() === preset.value.toLowerCase()
                                                        ? 'border-white scale-110 shadow-lg'
                                                        : 'border-transparent opacity-70 hover:opacity-100'
                                                }`}
                                                style={{ backgroundColor: preset.value }}
                                                title={preset.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                        Display Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Is Active Toggle */}
                            <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                                <div>
                                    <p className="text-xs font-bold text-white">Live on Resident Mobile App</p>
                                    <p className="text-[11px] text-slate-400">Instantly visible in the resident home directory</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setModalOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                >
                                    {submitting ? 'Saving...' : editingHotline ? 'Save Changes' : 'Create Hotline'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Delete Emergency Hotline?"
                description={`Are you sure you want to permanently delete "${deleteTarget?.name}" (${deleteTarget?.phone_number})? It will immediately be removed from the resident mobile app.`}
                confirmLabel="Yes, Delete Hotline"
                onConfirm={handleDelete}
                onClose={() => setDeleteTarget(null)}
            />
        </AdminLayout>
    );
}
