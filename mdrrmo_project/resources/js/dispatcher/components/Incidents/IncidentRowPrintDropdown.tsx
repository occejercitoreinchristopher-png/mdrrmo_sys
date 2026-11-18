import { useEffect, useState } from 'react';
import { ChevronDown, Eye, FileText, MapPin, Printer } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { printIncidentDetailReport } from '@/shared/utils/printDispatchReports';
import {
    printMultiplePatientCareRecords,
    printPatientCareRecord,
} from '@/dispatcher/utils/printPatientCareRecord';

export interface IncidentPcrEntry {
    id: number | string;
    label: string;
    record: any;
}

interface IncidentRowActionsDropdownProps {
    row: any;
    pcrEntries: IncidentPcrEntry[];
    preparedByName?: string;
    onViewDetails: (row: any) => void;
    onLocate?: (row: any) => void;
}

export default function IncidentRowActionsDropdown({
    row,
    pcrEntries,
    preparedByName,
    onViewDetails,
    onLocate,
}: IncidentRowActionsDropdownProps) {
    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>(() =>
        pcrEntries.map((entry) => entry.id),
    );

    const hasPcr = pcrEntries.length > 0;
    const hasMultiplePcrs = pcrEntries.length > 1;

    useEffect(() => {
        setSelectedIds(pcrEntries.map((entry) => entry.id));
    }, [pcrEntries.map((e) => e.id).join(',')]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen && hasMultiplePcrs) {
            setSelectedIds(pcrEntries.map((entry) => entry.id));
        }
        setOpen(nextOpen);
    };

    const allSelected =
        hasMultiplePcrs &&
        pcrEntries.length > 0 &&
        pcrEntries.every((entry) => selectedIds.includes(entry.id));

    const selectedCount = pcrEntries.filter((entry) =>
        selectedIds.includes(entry.id),
    ).length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pcrEntries.map((entry) => entry.id));
        }
    };

    const toggleEntry = (id: number | string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const handlePrintSelectedPcrs = () => {
        const selectedRecords = pcrEntries
            .filter((entry) => selectedIds.includes(entry.id))
            .map((entry) => entry.record);

        if (selectedRecords.length === 0) return;

        setOpen(false);
        printMultiplePatientCareRecords(selectedRecords);
    };

    return (
        <div
            className="flex items-center"
            onClick={(e) => e.stopPropagation()}
        >
            <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500/40"
                    >
                        <span>Actions</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                    className={`${
                        hasMultiplePcrs ? 'min-w-[260px] max-w-[300px]' : 'min-w-[195px]'
                    } bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-1.5`}
                >
                    <DropdownMenuItem
                        onSelect={() => {
                            setOpen(false);
                            onViewDetails(row);
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span>Details</span>
                    </DropdownMenuItem>

                    {onLocate && (
                        <DropdownMenuItem
                            onSelect={() => {
                                setOpen(false);
                                onLocate(row);
                            }}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer"
                        >
                            <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                            <span>Locate</span>
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        onSelect={() => {
                            setOpen(false);
                            printIncidentDetailReport(row, {
                                preparedBy: preparedByName,
                            });
                        }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer"
                    >
                        <Printer className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                        <span>Print</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 bg-slate-200/80 dark:bg-white/10" />

                    {!hasPcr && (
                        <DropdownMenuItem
                            disabled
                            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 opacity-75 cursor-not-allowed"
                        >
                            <span className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Print PCR</span>
                            </span>
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                                Without
                            </span>
                        </DropdownMenuItem>
                    )}

                    {pcrEntries.length === 1 && (
                        <DropdownMenuItem
                            onSelect={() => {
                                setOpen(false);
                                printPatientCareRecord(pcrEntries[0].record);
                            }}
                            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 focus:bg-slate-100 dark:focus:bg-white/10 cursor-pointer"
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">
                                    Print PCR
                                    {pcrEntries[0].label
                                        ? ` (${pcrEntries[0].label})`
                                        : ''}
                                </span>
                            </span>
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                With
                            </span>
                        </DropdownMenuItem>
                    )}

                    {hasMultiplePcrs && (
                        <div className="px-1.5 py-1 space-y-1.5">
                            {/* Section Header + With badge */}
                            <div className="flex items-center justify-between px-1">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                    <FileText className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    <span>Print PCR</span>
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                    With ({pcrEntries.length})
                                </span>
                            </div>

                            {/* Select All Checkbox */}
                            <label
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 cursor-pointer select-none"
                            >
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                                />
                                <span className="flex-1 truncate">
                                    Select All ({pcrEntries.length})
                                </span>
                            </label>

                            {/* Individual Patient PCR Checkboxes */}
                            <div className="max-h-44 overflow-y-auto space-y-0.5 pr-0.5">
                                {pcrEntries.map((entry, idx) => {
                                    const checked = selectedIds.includes(entry.id);
                                    return (
                                        <label
                                            key={entry.id}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                                                checked
                                                    ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-slate-800 dark:text-slate-100'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleEntry(entry.id)}
                                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 accent-emerald-600 cursor-pointer shrink-0"
                                                />
                                                <span
                                                    className="truncate font-medium"
                                                    title={
                                                        entry.label
                                                            ? `PCR #${idx + 1} (${entry.label})`
                                                            : `PCR #${idx + 1}`
                                                    }
                                                >
                                                    PCR #{idx + 1}
                                                    {entry.label ? ` (${entry.label})` : ''}
                                                </span>
                                            </span>
                                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                With
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* Print Selected Button */}
                            <button
                                type="button"
                                disabled={selectedCount === 0}
                                onClick={handlePrintSelectedPcrs}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                            >
                                <Printer className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                    {selectedCount === 0
                                        ? 'Select PCR to Print'
                                        : allSelected
                                          ? `Print All PCRs (${selectedCount})`
                                          : `Print Selected PCR (${selectedCount})`}
                                </span>
                            </button>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
