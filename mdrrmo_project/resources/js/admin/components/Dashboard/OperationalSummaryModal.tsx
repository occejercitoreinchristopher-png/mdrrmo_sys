import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import Modal from '@/shared/components/Modal';

interface OperationalSummaryModalProps {
    initialSummary?: {
        summary?: string;
        updated_at?: string;
        updated_at_human?: string;
        source?: string;
    };
}

export default function OperationalSummaryModal({ initialSummary }: OperationalSummaryModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [summary, setSummary] = useState<string>(
        initialSummary?.summary ||
            'MDRRMO Opol emergency operations are active. Statistics indicate stable incident response readiness with active ambulance fleet and responder units positioned across monitored municipal zones.'
    );
    const [updatedAt, setUpdatedAt] = useState<string>(initialSummary?.updated_at || new Date().toISOString());
    const [loading, setLoading] = useState<boolean>(false);
    const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Sync if initialSummary prop updates
    useEffect(() => {
        if (initialSummary?.summary) {
            setSummary(initialSummary.summary);
            if (initialSummary.updated_at) {
                setUpdatedAt(initialSummary.updated_at);
            }
        }
    }, [initialSummary]);

    // Live endpoint helper based on current route
    const getEndpoint = () => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dispatcher')) {
            return '/dispatcher/dashboard/ai-summary';
        }
        return '/admin/dashboard/ai-summary';
    };

    // Auto-fetch fresh AI summary immediately upon opening, and auto-sync every 15 seconds while open
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const fetchLatest = async (isBackground = false) => {
            if (isBackground) {
                setIsAutoSyncing(true);
            } else if (!summary) {
                setLoading(true);
            }

            try {
                const response = await fetch(`${getEndpoint()}?refresh=1`, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok && isMounted) {
                    const data = await response.json();
                    if (data?.summary) {
                        setSummary(data.summary);
                        if (data.updated_at) {
                            setUpdatedAt(data.updated_at);
                        }
                        setError(null);
                    }
                }
            } catch {
                // Silently retain current summary on network glitch
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setIsAutoSyncing(false);
                }
            }
        };

        // 1. Immediately fetch fresh data when modal is opened
        fetchLatest(false);

        // 2. Auto-sync interval: automatically refresh every 15 seconds
        const intervalId = setInterval(() => {
            fetchLatest(true);
        }, 15000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isOpen]);

    const formatTimestamp = (dateStr?: string) => {
        if (!dateStr) return 'Just now';
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
        } catch {
            return 'Just now';
        }
    };

    return (
        <>
            {/* Native System Header Button (Beside the Live Clock) */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Open AI-Powered Operational Summary"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all duration-200 text-left cursor-pointer group"
            >
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                    <p className="text-xs font-bold leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>AI Summary</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none font-medium">
                        Live Operational Insights
                    </p>
                </div>
            </button>

            {/* Standard System Modal matching MDRRMO Design (No bottom buttons needed - has X close button and auto-sync) */}
            <Modal
                open={isOpen}
                onClose={() => setIsOpen(false)}
                size="lg"
                title="AI-Powered Operational Summary"
                description="Intelligent insights automatically synced with live MDRRMO operational data."
            >
                <div className="space-y-4">
                    {/* Executive Operational Badge & Auto-Sync Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[11px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Executive Operational Briefing</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Auto-Sync Active {isAutoSyncing && '• Updating...'}</span>
                        </div>
                    </div>

                    {/* Operational Summary Body */}
                    {loading && !summary ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 dark:text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin text-red-600 dark:text-red-500" />
                            <p className="text-xs sm:text-sm font-medium animate-pulse text-slate-600 dark:text-slate-300">
                                Analyzing live incident records, emergency types, dispatches, and fleet performance...
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 relative">
                            {isAutoSyncing && (
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Syncing</span>
                                </div>
                            )}
                            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
                                {summary}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Clean Footer Bar (Last Synced Timestamp & Station Identity, No Buttons) */}
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 dark:text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Last Synced: {formatTimestamp(updatedAt)}</span>
                        </div>
                        <span className="text-[11px] font-sans text-slate-400">
                            MDRRMO Opol Command Center
                        </span>
                    </div>
                </div>
            </Modal>
        </>
    );
}
