import React, { useState, useEffect, useRef } from 'react';
import { 
    Printer, 
    X, 
    Calendar, 
    FileText, 
    Loader2, 
    Check, 
    ChevronDown, 
    AlertCircle, 
    RotateCcw,
    Shield,
    Download
} from 'lucide-react';
import { toast } from 'sonner';

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
    const [reportData, setReportData] = useState<any>(initialData);
    const [selectedYear, setSelectedYear] = useState<number>(
        initialData?.year || new Date().getFullYear()
    );
    const [availableYears, setAvailableYears] = useState<number[]>(
        initialData?.available_years || [new Date().getFullYear(), new Date().getFullYear() - 1]
    );
    const [loading, setLoading] = useState(false);

    // Official Signature state (Interactive in preview, clean print representation)
    const [preparedByName, setPreparedByName] = useState(
        currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'MDRRMO Operations Staff'
    );
    const [preparedByRole, setPreparedByRole] = useState('Data Management / Encoder');
    const [notedByName, setNotedByName] = useState('ENGR. ROMMEL C. DELOS SANTOS');
    const [notedByRole, setNotedByRole] = useState('MDRRMO Officer / Rescue Head');

    // Update state when initialData changes
    useEffect(() => {
        if (initialData) {
            setReportData(initialData);
            if (initialData.year) setSelectedYear(initialData.year);
            if (initialData.available_years?.length) setAvailableYears(initialData.available_years);
        }
    }, [initialData]);

    // Fetch report data when selected year changes
    const fetchYearData = async (year: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/reports/monthly-summary?year=${year}`, {
                headers: {
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                // Fallback to shared route if admin prefix isn't matched
                const resFallback = await fetch(`/admin/reports/monthly-summary?year=${year}`, {
                    headers: { Accept: 'application/json' },
                });
                if (resFallback.ok) {
                    const data = await resFallback.json();
                    setReportData(data);
                    if (data.available_years?.length) setAvailableYears(data.available_years);
                    return;
                }
                throw new Error('Failed to load report data');
            }
            const data = await res.json();
            setReportData(data);
            if (data.available_years?.length) setAvailableYears(data.available_years);
            toast.success(`Loaded official response report for ${year}`);
        } catch (err) {
            console.error('Error fetching monthly report:', err);
            toast.error(`Could not load report for ${year}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        fetchYearData(year);
    };

    const handleTriggerPrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    const report1 = reportData?.report1;
    const report2 = reportData?.report2;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatCell = (val: number | undefined) => {
        if (!val || val === 0) return <span className="text-slate-400 print:text-neutral-500 font-mono text-[10px]">0</span>;
        return <span className="font-bold font-mono text-slate-900 print:text-black">{val}</span>;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
            
            {/* Top Interactive Toolbar (HIDDEN IN PRINT) */}
            <div className="w-full max-w-[1400px] mb-3 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3 no-print sticky top-2 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Official Monthly Responses & Patient Complaints Report</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                A4 Landscape Ready
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Print preview formatted for official government document standards and local archiving
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Year Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Year:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(Number(e.target.value))}
                            disabled={loading}
                            className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer pl-1"
                        >
                            {availableYears.map((y) => (
                                <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={handleTriggerPrint}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Open native browser print dialog"
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

            {/* Document Printable Container */}
            <div 
                id="official-monthly-report-printable"
                className="w-full max-w-[1400px] bg-white text-slate-900 shadow-2xl rounded-xl border border-slate-200 p-6 sm:p-10 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none"
                style={{ minHeight: '800px', backgroundColor: '#ffffff', color: '#000000' }}
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
                        <section className="report-page-1 mb-12 print:mb-0">
                            {/* OFFICIAL HEADER (PCR STYLE) */}
                            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4 print:pb-2 print:mb-3">
                                {/* Left: Municipal Seal */}
                                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                                    <img 
                                        src="/images/opol-seal.png" 
                                        alt="Municipality of Opol Seal" 
                                        className="w-20 h-20 object-contain"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/images/opol_logo.png';
                                        }}
                                    />
                                </div>

                                {/* Center: Header Titles */}
                                <div className="text-center flex-1 px-4">
                                    <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        Republic of the Philippines &bull; Province of Misamis Oriental
                                    </p>
                                    <h2 className="text-xs sm:text-sm font-black tracking-wide text-slate-900 uppercase">
                                        LOCAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
                                    </h2>
                                    <h1 className="text-sm sm:text-lg font-black tracking-wider text-slate-900 uppercase mt-0.5">
                                        OPOL RESCUE TEAM MONTHLY RESPONSE REPORT
                                    </h1>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mt-0.5">
                                        FOR THE YEAR {selectedYear}
                                    </p>
                                </div>

                                {/* Right: MDRRMO Rescue Seal */}
                                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                                    <img 
                                        src="/images/drrm_logo.png" 
                                        alt="Opol Rescue Team Logo" 
                                        className="w-20 h-20 object-contain"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/images/opol-logo.png';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Section Sub-Header */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                                    I. MONTHLY EMERGENCY RESPONSE SUMMARY
                                </h3>
                                <span className="text-[10px] sm:text-xs text-slate-600 italic">
                                    Counts by Incident Category & Chief of Complaint ({selectedYear})
                                </span>
                            </div>

                            {/* Table: Report 1 */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-slate-900 text-[10px] sm:text-[11px] leading-tight print:text-[8pt]">
                                    <thead>
                                        <tr className="bg-slate-100 print:bg-neutral-100 text-slate-900 text-center font-bold border-b border-slate-900">
                                            <th className="border border-slate-900 px-2 py-1.5 text-left w-[20%]">Incident Category</th>
                                            <th className="border border-slate-900 px-2 py-1.5 text-left w-[32%]">Chief of Complaint</th>
                                            {monthNames.map((m) => (
                                                <th key={m} className="border border-slate-900 px-1 py-1.5 w-[3.5%] text-center">
                                                    {m}
                                                </th>
                                            ))}
                                            <th className="border border-slate-900 px-1.5 py-1.5 w-[6%] text-center bg-slate-200/80 print:bg-neutral-200">
                                                Annual Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report1 && Object.entries(report1.categories || {}).map(([categoryName, catData]: [string, any]) => {
                                            const complaintsList = Object.entries(catData.complaints || {});
                                            const rowCount = complaintsList.length;

                                            return (
                                                <React.Fragment key={categoryName}>
                                                    {complaintsList.map(([complaintName, compData]: [string, any], idx: number) => (
                                                        <tr 
                                                            key={complaintName} 
                                                            className={`hover:bg-slate-50 print:hover:bg-transparent ${
                                                                compData.annual_total > 0 ? 'font-medium' : 'text-slate-700'
                                                            }`}
                                                        >
                                                            {/* Rowspan for Category column */}
                                                            {idx === 0 && (
                                                                <td 
                                                                    rowSpan={rowCount} 
                                                                    className="border border-slate-900 px-2 py-1 align-top font-bold text-slate-950 bg-slate-50/50 print:bg-transparent uppercase tracking-wider text-[10px] print:text-[7.5pt]"
                                                                >
                                                                    {categoryName}
                                                                </td>
                                                            )}
                                                            <td className="border border-slate-900 px-2 py-0.5 text-left">
                                                                {complaintName}
                                                            </td>
                                                            {months.map((m) => (
                                                                <td key={m} className="border border-slate-900 px-1 py-0.5 text-center">
                                                                    {formatCell(compData.months?.[m])}
                                                                </td>
                                                            ))}
                                                            <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100/60 print:bg-neutral-100">
                                                                {formatCell(compData.annual_total)}
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {/* Category Subtotal Row */}
                                                    <tr className="bg-slate-100/90 print:bg-neutral-200/70 font-bold border-t border-b-2 border-slate-900">
                                                        <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right uppercase tracking-wider text-[10px] print:text-[8pt]">
                                                            {categoryName} SUB-TOTAL:
                                                        </td>
                                                        {months.map((m) => (
                                                            <td key={m} className="border border-slate-900 px-1 py-1 text-center font-bold">
                                                                {formatCell(catData.subtotals?.[m])}
                                                            </td>
                                                        ))}
                                                        <td className="border border-slate-900 px-1 py-1 text-center font-black bg-slate-200 print:bg-neutral-300">
                                                            {formatCell(catData.annual_subtotal)}
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Optional: Unclassified Section if records exist */}
                                        {report1?.unclassified?.has_records && (
                                            <>
                                                {Object.entries(report1.unclassified.complaints || {}).map(([uName, uData]: [string, any], uIdx: number, uArr) => (
                                                    <tr key={uName} className="hover:bg-slate-50 print:hover:bg-transparent">
                                                        {uIdx === 0 && (
                                                            <td 
                                                                rowSpan={uArr.length} 
                                                                className="border border-slate-900 px-2 py-1 align-top font-bold text-amber-900 bg-amber-50/50 uppercase"
                                                            >
                                                                UNCLASSIFIED / OTHER
                                                            </td>
                                                        )}
                                                        <td className="border border-slate-900 px-2 py-0.5 text-left italic">
                                                            {uName}
                                                        </td>
                                                        {months.map((m) => (
                                                            <td key={m} className="border border-slate-900 px-1 py-0.5 text-center">
                                                                {formatCell(uData.months?.[m])}
                                                            </td>
                                                        ))}
                                                        <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100/60">
                                                            {formatCell(uData.annual_total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-amber-100/70 print:bg-neutral-200 font-bold border-t border-b-2 border-slate-900">
                                                    <td colSpan={2} className="border border-slate-900 px-2 py-1 text-right uppercase">
                                                        UNCLASSIFIED SUB-TOTAL:
                                                    </td>
                                                    {months.map((m) => (
                                                        <td key={m} className="border border-slate-900 px-1 py-1 text-center font-bold">
                                                            {formatCell(report1.unclassified.subtotals?.[m])}
                                                        </td>
                                                    ))}
                                                    <td className="border border-slate-900 px-1 py-1 text-center font-black bg-slate-200">
                                                        {formatCell(report1.unclassified.annual_subtotal)}
                                                    </td>
                                                </tr>
                                            </>
                                        )}

                                        {/* FINAL MONTHLY SUBTOTAL & ANNUAL GRAND TOTAL */}
                                        <tr className="bg-slate-900 text-white print:bg-neutral-300 print:text-black font-black text-xs print:text-[8.5pt] border-t-2 border-slate-900">
                                            <td colSpan={2} className="border border-slate-900 px-2 py-2 text-right uppercase tracking-wider">
                                                OVERALL ANNUAL GRAND TOTAL (RESPONSES):
                                            </td>
                                            {months.map((m) => (
                                                <td key={m} className="border border-slate-900 px-1 py-2 text-center font-black">
                                                    {report1?.monthly_subtotals?.[m] ?? 0}
                                                </td>
                                            ))}
                                            <td className="border border-slate-900 px-1 py-2 text-center font-black bg-red-700 text-white print:bg-black print:text-white text-sm print:text-[9.5pt]">
                                                {report1?.annual_grand_total ?? 0}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* PAGE BREAK FOR PRINT */}
                        <div className="page-break-indicator my-8 border-b-2 border-dashed border-slate-300 print:hidden text-center text-xs text-slate-400">
                            --- Page Break: Report 2 will print on the next page ---
                        </div>
                        <div className="print-page-break" style={{ pageBreakBefore: 'always' }} />

                        {/* ========================================================================= */}
                        {/* REPORT 2: MONTHLY PATIENT COMPLAINT SUMMARY                                */}
                        {/* ========================================================================= */}
                        <section className="report-page-2 mt-6 print:mt-0">
                            {/* OFFICIAL HEADER (REPEAT FOR REPORT 2 AS MANDATED) */}
                            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4 print:pb-2 print:mb-3">
                                {/* Left: Municipal Seal */}
                                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                                    <img 
                                        src="/images/opol-seal.png" 
                                        alt="Municipality of Opol Seal" 
                                        className="w-20 h-20 object-contain"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/images/opol_logo.png';
                                        }}
                                    />
                                </div>

                                {/* Center: Header Titles */}
                                <div className="text-center flex-1 px-4">
                                    <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                        Republic of the Philippines &bull; Province of Misamis Oriental
                                    </p>
                                    <h2 className="text-xs sm:text-sm font-black tracking-wide text-slate-900 uppercase">
                                        LOCAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE
                                    </h2>
                                    <h1 className="text-sm sm:text-lg font-black tracking-wider text-slate-900 uppercase mt-0.5">
                                        OPOL RESCUE TEAM MONTHLY RESPONSE REPORT
                                    </h1>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mt-0.5">
                                        FOR THE YEAR {selectedYear}
                                    </p>
                                </div>

                                {/* Right: MDRRMO Rescue Seal */}
                                <div className="w-24 h-24 flex items-center justify-center shrink-0">
                                    <img 
                                        src="/images/drrm_logo.png" 
                                        alt="Opol Rescue Team Logo" 
                                        className="w-20 h-20 object-contain"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/images/opol-logo.png';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Section Sub-Header */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                                    II. MONTHLY PATIENT COMPLAINT SUMMARY
                                </h3>
                                <span className="text-[10px] sm:text-xs text-slate-600 italic">
                                    Clinical Assessment & Chief Complaints recorded in Patient Care Records (PCR) ({selectedYear})
                                </span>
                            </div>

                            {/* Table: Report 2 */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-slate-900 text-[10px] sm:text-[11px] leading-tight print:text-[8pt]">
                                    <thead>
                                        <tr className="bg-slate-100 print:bg-neutral-100 text-slate-900 text-center font-bold border-b border-slate-900">
                                            <th className="border border-slate-900 px-3 py-1.5 text-left w-[52%]">
                                                Patient Complaint / Assessment (PCR)
                                            </th>
                                            {monthNames.map((m) => (
                                                <th key={m} className="border border-slate-900 px-1 py-1.5 w-[3.5%] text-center">
                                                    {m}
                                                </th>
                                            ))}
                                            <th className="border border-slate-900 px-1.5 py-1.5 w-[6%] text-center bg-slate-200/80 print:bg-neutral-200">
                                                Annual Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report2 && Object.entries(report2.complaints || {}).map(([complaintName, compData]: [string, any], idx: number) => (
                                            <tr 
                                                key={complaintName} 
                                                className={`hover:bg-slate-50 print:hover:bg-transparent ${
                                                    compData.annual_total > 0 ? 'font-medium' : 'text-slate-700'
                                                }`}
                                            >
                                                <td className="border border-slate-900 px-3 py-0.5 text-left font-medium">
                                                    <span className="font-mono text-[9px] text-slate-400 print:text-neutral-500 mr-2">
                                                        {String(idx + 1).padStart(2, '0')}.
                                                    </span>
                                                    {complaintName}
                                                </td>
                                                {months.map((m) => (
                                                    <td key={m} className="border border-slate-900 px-1 py-0.5 text-center">
                                                        {formatCell(compData.months?.[m])}
                                                    </td>
                                                ))}
                                                <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100/60 print:bg-neutral-100">
                                                    {formatCell(compData.annual_total)}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Other recorded complaints in PCR */}
                                        {report2?.other_complaints?.has_records && (
                                            <>
                                                <tr className="bg-slate-100/70 print:bg-neutral-100 font-bold border-t border-b border-slate-900">
                                                    <td colSpan={14} className="border border-slate-900 px-3 py-1 text-slate-700 uppercase text-[9px] print:text-[7.5pt]">
                                                        Additional Documented PCR Findings / Other Conditions:
                                                    </td>
                                                </tr>
                                                {Object.entries(report2.other_complaints.items || {}).map(([otherName, oData]: [string, any]) => (
                                                    <tr key={otherName} className="hover:bg-slate-50 print:hover:bg-transparent">
                                                        <td className="border border-slate-900 px-3 py-0.5 text-left italic">
                                                            {otherName}
                                                        </td>
                                                        {months.map((m) => (
                                                            <td key={m} className="border border-slate-900 px-1 py-0.5 text-center">
                                                                {formatCell(oData.months?.[m])}
                                                            </td>
                                                        ))}
                                                        <td className="border border-slate-900 px-1 py-0.5 text-center font-bold bg-slate-100/60">
                                                            {formatCell(oData.annual_total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}

                                        {/* FINAL MONTHLY SUBTOTAL & ANNUAL GRAND TOTAL FOR PCR */}
                                        <tr className="bg-slate-900 text-white print:bg-neutral-300 print:text-black font-black text-xs print:text-[8.5pt] border-t-2 border-slate-900">
                                            <td className="border border-slate-900 px-3 py-2 text-right uppercase tracking-wider">
                                                OVERALL ANNUAL GRAND TOTAL (PATIENT COMPLAINTS):
                                            </td>
                                            {months.map((m) => (
                                                <td key={m} className="border border-slate-900 px-1 py-2 text-center font-black">
                                                    {report2?.monthly_subtotals?.[m] ?? 0}
                                                </td>
                                            ))}
                                            <td className="border border-slate-900 px-1 py-2 text-center font-black bg-blue-700 text-white print:bg-black print:text-white text-sm print:text-[9.5pt]">
                                                {report2?.annual_grand_total ?? 0}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* DOCUMENT FOOTER & CERTIFICATION */}
                            <div className="mt-8 pt-4 border-t border-slate-900/40 grid grid-cols-2 gap-8 text-xs print:text-[8pt] text-slate-900">
                                {/* Prepared By Block */}
                                <div className="space-y-1">
                                    <p className="font-bold uppercase tracking-wider text-[11px] text-slate-600 print:text-neutral-600 mb-6">
                                        Prepared By:
                                    </p>
                                    <div className="inline-block border-b border-slate-900 pb-0.5 w-64 max-w-full">
                                        <input
                                            type="text"
                                            value={preparedByName}
                                            onChange={(e) => setPreparedByName(e.target.value)}
                                            className="w-full font-bold uppercase tracking-wide bg-transparent outline-none text-slate-900 print:text-black"
                                            placeholder="Officer Name"
                                        />
                                    </div>
                                    <div className="w-64 max-w-full">
                                        <input
                                            type="text"
                                            value={preparedByRole}
                                            onChange={(e) => setPreparedByRole(e.target.value)}
                                            className="w-full text-slate-600 print:text-neutral-600 bg-transparent outline-none text-[10px] print:text-[8pt]"
                                            placeholder="Designation"
                                        />
                                    </div>
                                </div>

                                {/* Noted By Block */}
                                <div className="space-y-1">
                                    <p className="font-bold uppercase tracking-wider text-[11px] text-slate-600 print:text-neutral-600 mb-6">
                                        Noted By:
                                    </p>
                                    <div className="inline-block border-b border-slate-900 pb-0.5 w-64 max-w-full">
                                        <input
                                            type="text"
                                            value={notedByName}
                                            onChange={(e) => setNotedByName(e.target.value)}
                                            className="w-full font-bold uppercase tracking-wide bg-transparent outline-none text-slate-900 print:text-black"
                                            placeholder="Head of Office / Approver"
                                        />
                                    </div>
                                    <div className="w-64 max-w-full">
                                        <input
                                            type="text"
                                            value={notedByRole}
                                            onChange={(e) => setNotedByRole(e.target.value)}
                                            className="w-full text-slate-600 print:text-neutral-600 bg-transparent outline-none text-[10px] print:text-[8pt]"
                                            placeholder="Designation"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Note & Print Meta */}
                            <div className="mt-6 flex items-center justify-between text-[9px] text-slate-400 print:text-neutral-500">
                                <span>Official MDRRMO Opol Data System &bull; Generated: {reportData?.generated_at || new Date().toLocaleString()}</span>
                                <span>Document Form: MDRRMO-MRR-{selectedYear}</span>
                            </div>
                        </section>
                    </>
                )}
            </div>

            {/* Print Stylesheet */}
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 6mm 8mm;
                    }

                    body, html {
                        background: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Hide all UI shell elements */
                    header, nav, aside, .no-print, [role="navigation"] {
                        display: none !important;
                    }

                    /* Ensure modal backdrop doesn't dim or block */
                    .fixed {
                        position: static !important;
                        background: none !important;
                        padding: 0 !important;
                    }

                    #official-monthly-report-printable {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    table {
                        page-break-inside: auto;
                    }

                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }

                    thead {
                        display: table-header-group !important;
                    }

                    tfoot {
                        display: table-footer-group !important;
                    }

                    .print-page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                        height: 0 !important;
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
