import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePage } from '@inertiajs/react';
import {
    Printer,
    X,
    Calendar,
    FileText,
    Loader2,
    Filter,
    ZoomIn,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface MonthlyReportPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any;
    currentUser?: any;
}

export default function MonthlyReportPrintModal({
    isOpen,
    onClose,
    initialData,
    currentUser,
}: MonthlyReportPrintModalProps) {
    const { auth } = (usePage?.()?.props as any) || {};
    const effectiveUser = currentUser || auth?.user;

    const [reportData, setReportData] = useState<any>(initialData);

    // Period Filter: 'yearly' | 'monthly' | 'weekly' | 'daily'
    const [selectedPeriod, setSelectedPeriod] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>(
        initialData?.period || 'yearly'
    );
    const [selectedYear, setSelectedYear] = useState<number>(
        initialData?.year || new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState<number>(
        initialData?.month || (new Date().getMonth() + 1)
    );
    const [selectedDate, setSelectedDate] = useState<string>(
        initialData?.date || new Date().toISOString().slice(0, 10)
    );
    const [availableYears, setAvailableYears] = useState<number[]>(() => {
        const currentY = new Date().getFullYear();
        if (initialData?.available_years?.length) {
            return Array.from(new Set(initialData.available_years.map(Number)));
        }
        return [currentY, currentY - 1];
    });
    const [loading, setLoading] = useState(false);

    // Section Filter: 'all' (Both), 'report1' (Responses Only), 'report2' (Patient Complaints Only)
    const [selectedSection, setSelectedSection] = useState<'all' | 'report1' | 'report2'>('all');

    // Category Filter for Report 1
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

    // Zoom scale: '100', '90', '80', 'fit'
    const [previewScale, setPreviewScale] = useState<string>('100');

    // Official Signature state (Interactive in preview, clean print representation)
    const [preparedByName, setPreparedByName] = useState(
        effectiveUser ? `${effectiveUser.first_name || ''} ${effectiveUser.last_name || ''}`.trim() : 'MDRRMO Operations Staff'
    );
    const [preparedByRole, setPreparedByRole] = useState(
        effectiveUser?.role === 'dispatcher' ? 'Operations Dispatcher' : 'Data Management / Encoder'
    );
    const [notedByName, setNotedByName] = useState('ENGR. ROMMEL C. LANOY');
    const [notedByRole, setNotedByRole] = useState('Municipal Government Department Head');

    // Update state when initialData changes
    useEffect(() => {
        if (initialData) {
            setReportData(initialData);
            if (initialData.period) setSelectedPeriod(initialData.period);
            if (initialData.year) setSelectedYear(initialData.year);
            if (initialData.month) setSelectedMonth(initialData.month);
            if (initialData.date) setSelectedDate(initialData.date);
            if (initialData.available_years?.length) {
                setAvailableYears(Array.from(new Set(initialData.available_years.map(Number))));
            }
        }
    }, [initialData]);

    // Fetch report data based on active period, year, month, or date
    const fetchReportData = async (
        period = selectedPeriod,
        year = selectedYear,
        month = selectedMonth,
        date = selectedDate
    ) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                period,
                year: String(year),
                month: String(month),
                date: String(date),
            });

            // Pass stored custom categories and incidents from localStorage
            try {
                const storedCats = localStorage.getItem('mdrrmo_custom_categories');
                if (storedCats) {
                    queryParams.set('custom_categories', storedCats);
                }
                const storedIncs = localStorage.getItem('mdrrmo_custom_incidents');
                if (storedIncs) {
                    queryParams.set('custom_incidents', storedIncs);
                }
            } catch {}

            const res = await fetch(`/reports/monthly-summary?${queryParams.toString()}`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) {
                const resFallback = await fetch(`/admin/reports/monthly-summary?${queryParams.toString()}`, {
                    headers: { Accept: 'application/json' },
                });
                if (resFallback.ok) {
                    const data = await resFallback.json();
                    setReportData(data);
                    if (data.available_years?.length) {
                        setAvailableYears(Array.from(new Set(data.available_years.map(Number))));
                    }
                    return;
                }
                throw new Error('Failed to load report data');
            }
            const data = await res.json();
            setReportData(data);
            if (data.available_years?.length) {
                setAvailableYears(Array.from(new Set(data.available_years.map(Number))));
            }
        } catch (err) {
            console.error('Error fetching report:', err);
            toast.error(`Could not load report data. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch data on open if reportData is missing
    useEffect(() => {
        if (isOpen) {
            if (!reportData) {
                fetchReportData(selectedPeriod, selectedYear, selectedMonth, selectedDate);
            }
        }
    }, [isOpen]);

    // Add modal-open class to document.body for clean print isolation
    useEffect(() => {
        if (isOpen && typeof document !== 'undefined') {
            document.body.classList.add('monthly-report-modal-open');
        } else if (typeof document !== 'undefined') {
            document.body.classList.remove('monthly-report-modal-open');
        }
        return () => {
            if (typeof document !== 'undefined') {
                document.body.classList.remove('monthly-report-modal-open');
            }
        };
    }, [isOpen]);

    const handlePeriodChange = (period: 'yearly' | 'monthly' | 'weekly' | 'daily') => {
        setSelectedPeriod(period);
        fetchReportData(period, selectedYear, selectedMonth, selectedDate);
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        fetchReportData(selectedPeriod, year, selectedMonth, selectedDate);
    };

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
        fetchReportData(selectedPeriod, selectedYear, month, selectedDate);
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        fetchReportData(selectedPeriod, selectedYear, selectedMonth, date);
    };

    const handleTriggerPrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const report1 = reportData?.report1;
    const report2 = reportData?.report2;

    const defaultColumns = [
        { key: '1', label: 'Jan' },
        { key: '2', label: 'Feb' },
        { key: '3', label: 'Mar' },
        { key: '4', label: 'Apr' },
        { key: '5', label: 'May' },
        { key: '6', label: 'Jun' },
        { key: '7', label: 'Jul' },
        { key: '8', label: 'Aug' },
        { key: '9', label: 'Sep' },
        { key: '10', label: 'Oct' },
        { key: '11', label: 'Nov' },
        { key: '12', label: 'Dec' },
    ];

    const activeColumns: Array<{ key: string; label: string }> = reportData?.columns || defaultColumns;
    const totalLabel = reportData?.total_label || 'Annual Total';
    const titlePeriod = reportData?.title_period || `FOR THE YEAR ${selectedYear}`;
    const formCodeSuffix = reportData?.form_code_suffix || String(selectedYear);

    // Filter categories for Report 1
    const rawCategories = report1?.categories || {};
    const totalCategoriesCount = Object.keys(rawCategories).length || 5;
    const subtitlePeriod = selectedCategoryFilter === 'all'
        ? (reportData?.subtitle_period?.replace(/All \d+ Incident Categories/, `All ${totalCategoriesCount} Incident Categories`) || `Counts by All ${totalCategoriesCount} Incident Categories & Chief of Complaint (${reportData?.period_label || selectedYear})`)
        : `Filtered: ${selectedCategoryFilter} (${reportData?.period_label || selectedYear})`;

    const formatCell = (val: number | undefined) => {
        if (!val || val === 0) return <span className="text-slate-400 print:text-neutral-500 font-mono text-[9px]">0</span>;
        return <span className="font-bold font-mono text-slate-900 print:text-black">{val}</span>;
    };

    const filteredCategories = Object.entries(rawCategories).filter(([catName]) => {
        if (selectedCategoryFilter === 'all') return true;
        return catName === selectedCategoryFilter;
    });

    // Calculate dynamic subtotal for filtered categories if filtered
    const dynamicFilteredTotals: Record<string, number> = {};
    activeColumns.forEach((c) => { dynamicFilteredTotals[c.key] = 0; });
    let dynamicFilteredTotal = 0;

    filteredCategories.forEach(([_, catData]: [string, any]) => {
        activeColumns.forEach((c) => {
            const count = catData.subtotals?.[c.key] ?? catData.subtotals?.[Number(c.key)] ?? 0;
            dynamicFilteredTotals[c.key] += count;
        });
        dynamicFilteredTotal += catData.annual_subtotal ?? catData.total ?? 0;
    });

    // Determine zoom style using native CSS zoom for seamless bounding box flow
    const getScaleStyle = (): React.CSSProperties => {
        if (previewScale === '80') return { zoom: 0.8 };
        if (previewScale === '90') return { zoom: 0.9 };
        if (previewScale === 'fit') return { zoom: 0.85 };
        return { zoom: 1 };
    };

    // Official Document Header Component
    const renderOfficialHeader = (subtitle: string) => (
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3 print:pb-1 print:mb-1 bg-white text-black">
            {/* Left: Municipal Seal */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 print:w-10 print:h-10 flex items-center justify-center shrink-0">
                <img
                    src="/images/opol_logo.png"
                    alt="Municipality of Opol Seal"
                    className="w-16 h-16 sm:w-20 sm:h-20 print:w-9 print:h-9 object-contain"
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/opol-seal.png';
                    }}
                />
            </div>

            {/* Center: Official Titles */}
            <div className="text-center flex-1 px-3">
                <p className="text-[10px] sm:text-xs print:text-[6.5pt] font-semibold tracking-wider text-slate-700 uppercase leading-none print:leading-tight">
                    Republic of the Philippines &bull; Province of Misamis Oriental
                </p>
                <h2 className="text-xs sm:text-sm print:text-[7.2pt] font-black tracking-wide text-slate-900 uppercase leading-none print:leading-tight">
                    LOCAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
                </h2>
                <h1 className="text-sm sm:text-lg print:text-[9.5pt] font-black tracking-wider text-slate-900 uppercase mt-0.5 print:mt-0 leading-tight">
                    OPOL RESCUE TEAM {selectedPeriod === 'yearly' ? 'MONTHLY' : selectedPeriod.toUpperCase()} RESPONSE REPORT
                </h1>
                <p className="text-xs sm:text-sm print:text-[7.2pt] font-bold text-slate-900 uppercase tracking-widest mt-0.5 print:mt-0 leading-tight">
                    {titlePeriod}
                </p>
                <p className="text-[10px] print:text-[6.5pt] font-semibold text-slate-600 uppercase tracking-wider mt-0.5 print:mt-0 leading-tight">
                    {subtitle}
                </p>
            </div>

            {/* Right: MDRRMO Rescue Seal */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 print:w-10 print:h-10 flex items-center justify-center shrink-0">
                <img
                    src="/images/drrm_logo.png"
                    alt="Opol Rescue Team Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 print:w-9 print:h-9 object-contain"
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/opol-logo.png';
                    }}
                />
            </div>
        </div>
    );

    // Official Certification Footer Component
    const renderCertificationFooter = () => (
        <div className="mt-8 pt-6 print:mt-1 print:pt-1 border-t border-slate-900/40 flex flex-row items-start justify-between text-xs print:text-[7.2pt] text-slate-900 bg-white break-inside-avoid print:break-inside-avoid">
            {/* Prepared By Block (Left side) */}
            <div className="flex flex-col items-start text-left w-72 sm:w-80 print:w-64">
                <p className="w-full text-left font-bold uppercase tracking-wider text-[11px] print:text-[7.2pt] text-slate-700 print:text-neutral-800 mb-8 print:mb-2">
                    Prepared By:
                </p>
                <div className="w-full border-b-2 border-slate-900 pb-1 print:pb-0">
                    <input
                        type="text"
                        value={preparedByName}
                        onChange={(e) => setPreparedByName(e.target.value)}
                        className="w-full font-black uppercase tracking-wide text-left bg-transparent outline-none text-slate-950 print:text-black text-[11px] sm:text-xs print:text-[8pt]"
                        placeholder="Officer Name"
                    />
                </div>
                <div className="w-full pt-1 print:pt-0.5">
                    <input
                        type="text"
                        value={preparedByRole}
                        onChange={(e) => setPreparedByRole(e.target.value)}
                        className="w-full text-left text-slate-700 print:text-neutral-700 bg-transparent outline-none text-[10px] sm:text-[10.5px] print:text-[6.8pt] font-medium"
                        placeholder="Designation"
                    />
                </div>
            </div>

            {/* Noted By Block (Right side, aligned to right edge) */}
            <div className="flex flex-col items-start text-left w-72 sm:w-80 print:w-64">
                <p className="w-full text-left font-bold uppercase tracking-wider text-[11px] print:text-[7.2pt] text-slate-700 print:text-neutral-800 mb-8 print:mb-2">
                    Noted By:
                </p>
                <div className="w-full border-b-2 border-slate-900 pb-1 print:pb-0">
                    <input
                        type="text"
                        value={notedByName}
                        onChange={(e) => setNotedByName(e.target.value)}
                        className="w-full font-black uppercase tracking-wide text-left bg-transparent outline-none text-slate-950 print:text-black text-[11px] sm:text-xs print:text-[8pt]"
                        placeholder="Head of Office / Approver"
                    />
                </div>
                <div className="w-full pt-1 print:pt-0.5">
                    <input
                        type="text"
                        value={notedByRole}
                        onChange={(e) => setNotedByRole(e.target.value)}
                        className="w-full text-left text-slate-700 print:text-neutral-700 bg-transparent outline-none text-[10px] sm:text-[10.5px] print:text-[6.8pt] font-medium"
                        placeholder="Designation"
                    />
                </div>
            </div>
        </div>
    );

    // Official Document Footer (Signatures + Form Meta)
    const renderDocumentFooter = (formCode: string) => (
        <div className="report-doc-footer mt-6 print:mt-1 break-inside-avoid print:break-inside-avoid">
            {renderCertificationFooter()}
            <div className="mt-4 print:mt-1 flex items-center justify-between text-[9px] print:text-[6.5pt] text-slate-500 print:text-neutral-500 bg-white">
                <span>Official MDRRMO Opol Data System &bull; Generated: {reportData?.generated_at || new Date().toLocaleString()}</span>
                <span className="font-semibold">Document Form: {formCode}</span>
            </div>
        </div>
    );

    const modalJSX = (
        <div
            id="monthly-report-modal-root"
            className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible print:block print:w-full"
        >

            {/* Top Interactive Toolbar (HIDDEN IN PRINT) */}
            <div className="w-full max-w-[1360px] mb-3 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-3 no-print sticky top-2 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Official Monthly Responses & Patient Complaints Report</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                A4 Landscape
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select which report section or category to view and print
                        </p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

                    {/* 1. REPORT SECTION SELECTOR (Filter I vs II vs Both) */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setSelectedSection('all')}
                            className={clsx(
                                "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer",
                                selectedSection === 'all'
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            Both Reports (I & II)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedSection('report1')}
                            className={clsx(
                                "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer",
                                selectedSection === 'report1'
                                    ? "bg-red-600 text-white shadow-sm font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            I. Responses Only
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedSection('report2')}
                            className={clsx(
                                "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer",
                                selectedSection === 'report2'
                                    ? "bg-blue-600 text-white shadow-sm font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            II. Patient Complaints Only
                        </button>
                    </div>

                    {/* 2. CATEGORY FILTER (for Report 1) */}
                    {(selectedSection === 'all' || selectedSection === 'report1') && (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                            <Filter className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category:</span>
                            <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer pl-1 max-w-[210px]"
                            >
                                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    All Categories ({Object.keys(rawCategories).length})
                                </option>
                                {Object.entries(rawCategories).map(([catName, catData]: [string, any]) => (
                                    <option key={catName} value={catName} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                        {catName} ({Object.keys(catData.complaints || {}).length})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 3. TIMEFRAME / PERIOD SELECTOR (Yearly, Monthly, Weekly, Daily) */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
                        <span className="px-2 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Period:
                        </span>
                        {(['yearly', 'monthly', 'weekly', 'daily'] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handlePeriodChange(p)}
                                className={clsx(
                                    "px-2.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer",
                                    selectedPeriod === p
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm font-bold"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {p === 'daily' ? 'Daily' : p === 'yearly' ? 'Yearly' : p === 'monthly' ? 'Monthly' : 'Weekly'}
                            </button>
                        ))}
                    </div>

                    {/* 4. CONTEXT-AWARE TIME PICKERS */}
                    {/* Year Selector (For Yearly, Monthly, Weekly) */}
                    {(selectedPeriod === 'yearly' || selectedPeriod === 'monthly' || selectedPeriod === 'weekly') && (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Year:</span>
                            <select
                                value={selectedYear}
                                onChange={(e) => handleYearChange(Number(e.target.value))}
                                disabled={loading}
                                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer pl-1"
                            >
                                {Array.from(new Set(availableYears)).map((y) => (
                                    <option key={`report-year-${y}`} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Month Selector (For Monthly) */}
                    {selectedPeriod === 'monthly' && (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Month:</span>
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleMonthChange(Number(e.target.value))}
                                disabled={loading}
                                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer pl-1"
                            >
                                {[
                                    { m: 1, name: 'Jan - January' }, { m: 2, name: 'Feb - February' }, { m: 3, name: 'Mar - March' },
                                    { m: 4, name: 'Apr - April' }, { m: 5, name: 'May - May' }, { m: 6, name: 'Jun - June' },
                                    { m: 7, name: 'Jul - July' }, { m: 8, name: 'Aug - August' }, { m: 9, name: 'Sep - September' },
                                    { m: 10, name: 'Oct - October' }, { m: 11, name: 'Nov - November' }, { m: 12, name: 'Dec - December' },
                                ].map(({ m, name }) => (
                                    <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Week Selector (For Weekly) */}
                    {selectedPeriod === 'weekly' && (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Week of:</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                disabled={loading}
                                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                            />
                        </div>
                    )}

                    {/* Date Selector (For Daily) */}
                    {selectedPeriod === 'daily' && (
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date:</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                disabled={loading}
                                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                            />
                        </div>
                    )}

                    {/* 4. ZOOM VIEW SCALE TOGGLE */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                        <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">View:</span>
                        <select
                            value={previewScale}
                            onChange={(e) => setPreviewScale(e.target.value)}
                            className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer pl-1"
                        >
                            <option value="100" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">100% View</option>
                            <option value="fit" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Fit Screen (85%)</option>
                            <option value="90" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">90% View</option>
                            <option value="80" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">80% View</option>
                        </select>
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={handleTriggerPrint}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Print selected report"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        <span>Print Document</span>
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Close preview"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Document Printable Wrapper */}
            <div className="w-full flex justify-center pb-12 print:pb-0 print:block print:w-full">
                <div
                    id="official-monthly-report-printable"
                    className="w-full max-w-[1360px] bg-white text-black shadow-2xl rounded-xl border border-slate-300 p-4 sm:p-8 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none h-auto"
                    style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        colorScheme: 'light',
                        ...getScaleStyle()
                    }}
                >
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 no-print">
                            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
                            <p className="text-sm font-semibold">Generating database-driven report for {selectedYear}...</p>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* ========================================================================= */}
                            {/* REPORT 1: MONTHLY EMERGENCY RESPONSE SUMMARY                               */}
                            {/* ========================================================================= */}
                            {(selectedSection === 'all' || selectedSection === 'report1') && (
                                <section className="report-page-1 mb-8 print:mb-0 bg-white text-black">
                                    {/* OFFICIAL HEADER (PCR STYLE) */}
                                    {renderOfficialHeader(
                                        selectedPeriod === 'yearly'
                                            ? 'I. MONTHLY EMERGENCY RESPONSE SUMMARY'
                                            : `I. ${selectedPeriod.toUpperCase()} EMERGENCY RESPONSE SUMMARY`
                                    )}

                                    {/* Section Sub-Header with Active Filter Note */}
                                    <div className="flex items-center justify-between mb-2 print:mb-0.5 bg-white text-black">
                                        <h3 className="text-xs sm:text-sm print:text-[7.5pt] font-black uppercase tracking-wider text-slate-900">
                                            I. EMERGENCY RESPONSE & OPERATIONAL ACTIVITIES
                                        </h3>
                                        <span className="text-[10px] sm:text-xs print:text-[6.5pt] text-slate-600 italic">
                                            {subtitlePeriod}
                                        </span>
                                    </div>

                                    {/* Table: Report 1 */}
                                    <div className="overflow-x-auto print:overflow-visible bg-white">
                                        <table className="w-full border-collapse border border-slate-900 text-[9.5px] sm:text-[10.5px] leading-tight print:text-[8pt] table-fixed bg-white text-black">
                                            <thead>
                                                <tr className="bg-slate-100 print:bg-neutral-100 text-slate-900 text-center font-bold border-b border-slate-900">
                                                    <th className="border border-slate-900 px-2 py-1.5 text-left w-[18%]">Incident Category</th>
                                                    <th className="border border-slate-900 px-2 py-1.5 text-left w-[30%]">Chief of Complaint</th>
                                                    {activeColumns.map((c) => (
                                                        <th key={c.key} className="border border-slate-900 px-1 py-1.5 text-center" style={{ width: `${44 / activeColumns.length}%` }}>
                                                            {c.label}
                                                        </th>
                                                    ))}
                                                    <th className="border border-slate-900 px-1.5 py-1.5 w-[8.2%] text-center bg-slate-200 print:bg-neutral-200">
                                                        {totalLabel}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white text-black">
                                                {filteredCategories.map(([categoryName, catData]: [string, any]) => {
                                                    const complaintsList = Object.entries(catData.complaints || {});

                                                    return (
                                                        <React.Fragment key={categoryName}>
                                                            {complaintsList.map(([complaintName, compData]: [string, any], idx: number) => (
                                                                <tr
                                                                    key={complaintName}
                                                                    className="bg-white text-black hover:bg-slate-50 print:hover:bg-transparent font-medium"
                                                                >
                                                                    {/* Category column without unbreakable rowSpan for natural, seamless page breaks */}
                                                                    <td
                                                                        className="border border-slate-900 px-2 py-0.5 align-top font-bold text-slate-950 bg-slate-50/40 print:bg-transparent uppercase tracking-wider text-[9px] print:text-[7pt]"
                                                                    >
                                                                        {idx === 0 ? categoryName : ''}
                                                                    </td>
                                                                    <td className="border border-slate-900 px-2 py-0.5 text-left truncate text-slate-900 bg-white" title={complaintName}>
                                                                        {complaintName}
                                                                    </td>
                                                                    {activeColumns.map((c) => (
                                                                        <td key={c.key} className="border border-slate-900 px-0.5 py-0.5 text-center bg-white">
                                                                            {formatCell(compData.columns?.[c.key] ?? compData.months?.[c.key] ?? compData.months?.[Number(c.key)])}
                                                                        </td>
                                                                    ))}
                                                                    <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100/70 print:bg-neutral-100">
                                                                        {formatCell(compData.annual_total ?? compData.total)}
                                                                    </td>
                                                                </tr>
                                                            ))}

                                                            {/* Category Subtotal Row */}
                                                            <tr className="row-subtotal bg-slate-200/90 print:bg-neutral-200 font-bold border-t border-b-2 border-slate-900 text-slate-900">
                                                                <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right uppercase tracking-wider text-[9.5px] print:text-[8pt]">
                                                                    {categoryName} SUB-TOTAL:
                                                                </td>
                                                                {activeColumns.map((c) => (
                                                                    <td key={c.key} className="border border-slate-900 px-0.5 py-1 text-center font-bold">
                                                                        {formatCell(catData.subtotals?.[c.key] ?? catData.subtotals?.[Number(c.key)])}
                                                                    </td>
                                                                ))}
                                                                <td className="border border-slate-900 px-1 py-1 text-center font-black bg-slate-300 print:bg-neutral-300">
                                                                    {formatCell(catData.annual_subtotal ?? catData.total)}
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}

                                                {/* Optional: Unclassified Section if records exist and category filter is all */}
                                                {selectedCategoryFilter === 'all' && report1?.unclassified?.has_records && (
                                                    <>
                                                        {Object.entries(report1.unclassified.complaints || {}).map(([uName, uData]: [string, any], uIdx: number) => (
                                                            <tr key={uName} className="bg-white text-black hover:bg-slate-50 print:hover:bg-transparent">
                                                                <td
                                                                    className="border border-slate-900 px-2 py-0.5 align-top font-bold text-amber-900 bg-amber-50/40 print:bg-transparent uppercase text-[9px] print:text-[7pt]"
                                                                >
                                                                    {uIdx === 0 ? 'UNCLASSIFIED / OTHER' : ''}
                                                                </td>
                                                                <td className="border border-slate-900 px-2 py-0.5 text-left italic bg-white text-slate-900">
                                                                    {uName}
                                                                </td>
                                                                {activeColumns.map((c) => (
                                                                    <td key={c.key} className="border border-slate-900 px-0.5 py-0.5 text-center bg-white">
                                                                        {formatCell(uData.columns?.[c.key] ?? uData.months?.[c.key] ?? uData.months?.[Number(c.key)])}
                                                                    </td>
                                                                ))}
                                                                <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100">
                                                                    {formatCell(uData.annual_total ?? uData.total)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="row-subtotal bg-amber-100 print:bg-neutral-200 font-bold border-t border-b-2 border-slate-900 text-slate-900">
                                                            <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right uppercase">
                                                                UNCLASSIFIED SUB-TOTAL:
                                                            </td>
                                                            {activeColumns.map((c) => (
                                                                <td key={c.key} className="border border-slate-900 px-0.5 py-1 text-center font-bold">
                                                                    {formatCell(report1.unclassified.subtotals?.[c.key] ?? report1.unclassified.subtotals?.[Number(c.key)])}
                                                                </td>
                                                            ))}
                                                            <td className="border border-slate-900 px-1 py-1 text-center font-black bg-slate-300">
                                                                {formatCell(report1.unclassified.annual_subtotal ?? report1.unclassified.total)}
                                                            </td>
                                                        </tr>
                                                    </>
                                                )}

                                                {/* FINAL SUBTOTAL & GRAND TOTAL */}
                                                <tr className="row-grandtotal bg-slate-900 text-white print:bg-neutral-300 print:text-black font-black text-xs print:text-[8.5pt] border-t-2 border-slate-900">
                                                    <td colSpan={2} className="border border-slate-900 px-2 py-2 text-right uppercase tracking-wider">
                                                        {selectedCategoryFilter === 'all'
                                                            ? `OVERALL ${totalLabel.toUpperCase()} (RESPONSES):`
                                                            : `${selectedCategoryFilter} TOTAL:`}
                                                    </td>
                                                    {activeColumns.map((c) => (
                                                        <td key={c.key} className="border border-slate-900 px-0.5 py-2 text-center font-black">
                                                            {selectedCategoryFilter === 'all'
                                                                ? (report1?.monthly_subtotals?.[c.key] ?? report1?.monthly_subtotals?.[Number(c.key)] ?? 0)
                                                                : (dynamicFilteredTotals[c.key] ?? 0)}
                                                        </td>
                                                    ))}
                                                    <td className="border border-slate-900 px-1 py-2 text-center font-black bg-red-700 text-white print:bg-black print:text-white text-sm print:text-[9.5pt]">
                                                        {selectedCategoryFilter === 'all'
                                                            ? (report1?.annual_grand_total ?? report1?.grand_total ?? 0)
                                                            : dynamicFilteredTotal}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Document Footer for Report 1 */}
                                    {renderDocumentFooter(`MDRRMO-MRR-1-${formCodeSuffix}`)}
                                </section>
                            )}

                            {/* PAGE BREAK (Only when both sections are printed) */}
                            {selectedSection === 'all' && (
                                <>
                                    <div className="page-break-indicator my-8 border-b-2 border-dashed border-slate-300 print:hidden text-center text-xs text-slate-400">
                                        --- Page Break: Report II will print on the next page ---
                                    </div>
                                    <div className="print-page-break" style={{ pageBreakBefore: 'always' }} />
                                </>
                            )}

                            {/* ========================================================================= */}
                            {/* REPORT 2: MONTHLY PATIENT COMPLAINT SUMMARY                                */}
                            {/* ========================================================================= */}
                            {(selectedSection === 'all' || selectedSection === 'report2') && (
                                <section className="report-page-2 mt-6 print:mt-0 bg-white text-black">
                                    {/* OFFICIAL HEADER (REPEAT FOR REPORT 2) */}
                                    {renderOfficialHeader(
                                        selectedPeriod === 'yearly'
                                            ? 'II. MONTHLY PATIENT COMPLAINT SUMMARY'
                                            : `II. ${selectedPeriod.toUpperCase()} PATIENT COMPLAINT SUMMARY`
                                    )}

                                    {/* Section Sub-Header */}
                                    <div className="flex items-center justify-between mb-2 print:mb-0.5 bg-white text-black">
                                        <h3 className="text-xs sm:text-sm print:text-[7.5pt] font-black uppercase tracking-wider text-slate-900">
                                            II. PATIENT CLINICAL COMPLAINT SUMMARY (PCR DATA)
                                        </h3>
                                        <span className="text-[10px] sm:text-xs print:text-[6.5pt] text-slate-600 italic">
                                            Assessments & Chief Complaints from Patient Care Records ({reportData?.period_label || selectedYear})
                                        </span>
                                    </div>

                                    {/* Table: Report 2 */}
                                    <div className="overflow-x-auto print:overflow-visible bg-white">
                                        <table className="w-full border-collapse border border-slate-900 text-[9.5px] sm:text-[10.5px] leading-tight print:text-[8pt] table-fixed bg-white text-black">
                                            <thead>
                                                <tr className="bg-slate-100 print:bg-neutral-100 text-slate-900 text-center font-bold border-b border-slate-900">
                                                    <th className="border border-slate-900 px-3 py-1.5 text-left w-[48%]">
                                                        Patient Complaint / Assessment (PCR)
                                                    </th>
                                                    {activeColumns.map((c) => (
                                                        <th
                                                            key={c.key}
                                                            className="border border-slate-900 px-1 py-1.5 text-center"
                                                            style={{ width: `${44 / activeColumns.length}%` }}
                                                        >
                                                            {c.label}
                                                        </th>
                                                    ))}
                                                    <th className="border border-slate-900 px-1.5 py-1.5 w-[8.2%] text-center bg-slate-200 print:bg-neutral-200">
                                                        {totalLabel}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white text-black">
                                                {report2 && Object.entries(report2.complaints || {}).map(([complaintName, compData]: [string, any], idx: number) => (
                                                    <tr
                                                        key={complaintName}
                                                        className="bg-white text-black hover:bg-slate-50 print:hover:bg-transparent font-medium"
                                                    >
                                                        <td className="border border-slate-900 px-3 py-0.5 text-left font-medium truncate bg-white text-slate-900" title={complaintName}>
                                                            <span className="font-mono text-[9px] text-slate-400 print:text-neutral-500 mr-2">
                                                                {String(idx + 1).padStart(2, '0')}.
                                                            </span>
                                                            {complaintName}
                                                        </td>
                                                        {activeColumns.map((c) => (
                                                            <td key={c.key} className="border border-slate-900 px-0.5 py-0.5 text-center bg-white">
                                                                {formatCell(compData.columns?.[c.key] ?? compData.months?.[c.key] ?? compData.months?.[Number(c.key)])}
                                                            </td>
                                                        ))}
                                                        <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100/70 print:bg-neutral-100">
                                                            {formatCell(compData.annual_total ?? compData.total)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Other recorded complaints in PCR */}
                                                {report2?.other_complaints?.has_records && (
                                                    <>
                                                        <tr className="bg-slate-100 print:bg-neutral-100 font-bold border-t border-b border-slate-900 text-slate-900">
                                                            <td colSpan={activeColumns.length + 2} className="border border-slate-900 px-3 py-1 text-slate-700 uppercase text-[9px] print:text-[7.5pt]">
                                                                Additional Documented PCR Findings / Other Conditions:
                                                            </td>
                                                        </tr>
                                                        {Object.entries(report2.other_complaints.items || {}).map(([otherName, oData]: [string, any]) => (
                                                            <tr key={otherName} className="bg-white text-black hover:bg-slate-50 print:hover:bg-transparent">
                                                                <td className="border border-slate-900 px-3 py-0.5 text-left italic truncate bg-white text-slate-900">
                                                                    {otherName}
                                                                </td>
                                                                {activeColumns.map((c) => (
                                                                    <td key={c.key} className="border border-slate-900 px-0.5 py-0.5 text-center bg-white">
                                                                        {formatCell(oData.columns?.[c.key] ?? oData.months?.[c.key] ?? oData.months?.[Number(c.key)])}
                                                                    </td>
                                                                ))}
                                                                <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100">
                                                                    {formatCell(oData.annual_total ?? oData.total)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </>
                                                )}

                                                {/* FINAL SUBTOTAL & GRAND TOTAL FOR PCR */}
                                                <tr className="row-grandtotal bg-slate-900 text-white print:bg-neutral-300 print:text-black font-black text-xs print:text-[8.5pt] border-t-2 border-slate-900">
                                                    <td className="border border-slate-900 px-3 py-2 text-right uppercase tracking-wider">
                                                        OVERALL {totalLabel.toUpperCase()} (PATIENT COMPLAINTS):
                                                    </td>
                                                    {activeColumns.map((c) => (
                                                        <td key={c.key} className="border border-slate-900 px-0.5 py-2 text-center font-black">
                                                            {report2?.monthly_subtotals?.[c.key] ?? report2?.monthly_subtotals?.[Number(c.key)] ?? 0}
                                                        </td>
                                                    ))}
                                                    <td className="border border-slate-900 px-1 py-2 text-center font-black bg-blue-700 text-white print:bg-black print:text-white text-sm print:text-[9.5pt]">
                                                        {report2?.annual_grand_total ?? report2?.grand_total ?? 0}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Document Footer for Report 2 */}
                                    {renderDocumentFooter(`MDRRMO-MRR-2-${formCodeSuffix}`)}
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Print and Preview Stylesheet */}
            <style>{`
                /* Force light color scheme and opaque white background on entire printable tree */
                #official-monthly-report-printable,
                #official-monthly-report-printable * {
                    color-scheme: light !important;
                }

                #official-monthly-report-printable {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }

                #official-monthly-report-printable table {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }

                #official-monthly-report-printable thead tr {
                    background-color: #f1f5f9 !important;
                    color: #0f172a !important;
                }

                #official-monthly-report-printable tbody tr {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }

                #official-monthly-report-printable td {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                }

                #official-monthly-report-printable tr.row-subtotal td,
                #official-monthly-report-printable tr.row-subtotal {
                    background-color: #e2e8f0 !important;
                    color: #0f172a !important;
                }

                #official-monthly-report-printable tr.row-grandtotal td,
                #official-monthly-report-printable tr.row-grandtotal {
                    background-color: #0f172a !important;
                    color: #ffffff !important;
                }

                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 3.5mm 5mm;
                    }

                    body, html {
                        background: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        height: auto !important;
                        min-height: 0 !important;
                    }

                    /* Completely hide the background website application (#app, IncidentTable, navbar, layout) */
                    #app,
                    main,
                    body > *:not(#monthly-report-modal-root),
                    body.monthly-report-modal-open > *:not(#monthly-report-modal-root),
                    body.monthly-report-modal-open #app,
                    body.monthly-report-modal-open main {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        min-height: 0 !important;
                        max-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }

                    #monthly-report-modal-root {
                        display: block !important;
                        visibility: visible !important;
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }

                    /* Hide all UI shell elements */
                    header, nav, aside, .no-print, [role="navigation"] {
                        display: none !important;
                    }

                    /* Ensure modal backdrop and wrappers are block layout in print */
                    .fixed,
                    .overflow-y-auto,
                    .overflow-x-auto {
                        position: static !important;
                        background: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        display: block !important;
                        height: auto !important;
                        width: 100% !important;
                    }

                    #official-monthly-report-printable {
                        max-width: 100% !important;
                        width: 100% !important;
                        zoom: 1 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        display: block !important;
                    }

                    table {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        table-layout: fixed !important;
                        width: 100% !important;
                    }

                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: auto !important;
                    }

                    thead {
                        display: table-header-group !important;
                    }

                    tfoot {
                        display: table-footer-group !important;
                    }

                    td, th {
                        padding-top: 0.6px !important;
                        padding-bottom: 0.6px !important;
                        padding-left: 2px !important;
                        padding-right: 2px !important;
                        font-size: 6.8pt !important;
                        line-height: 1.12 !important;
                    }

                    tr.row-grandtotal td {
                        padding-top: 1.2px !important;
                        padding-bottom: 1.2px !important;
                        font-size: 7.5pt !important;
                    }

                    tr.row-subtotal td {
                        padding-top: 1px !important;
                        padding-bottom: 1px !important;
                        font-size: 7.2pt !important;
                    }

                    input {
                        border: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: transparent !important;
                        height: auto !important;
                        line-height: 1.15 !important;
                    }

                    .print-page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }

                    .report-doc-footer {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin-top: 4px !important;
                        padding-top: 2px !important;
                    }
                }
            `}</style>
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(modalJSX, document.body);
    }

    return modalJSX;
}
