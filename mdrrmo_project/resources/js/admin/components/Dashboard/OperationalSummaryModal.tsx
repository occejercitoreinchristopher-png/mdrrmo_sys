import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';

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

    // Automatically check for fresh AI summary whenever the modal is opened
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchLatest = async () => {
            try {
                const response = await fetch('/admin/dashboard/ai-summary', {
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
                    }
                }
            } catch {
                // Silently retain current summary on network glitch
            }
        };

        fetchLatest();

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    const formatTimestamp = (dateStr?: string) => {
        if (!dateStr) return 'Just now';
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return 'Just now';
        }
    };

    const handleRefresh = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/admin/dashboard/ai-summary?refresh=1', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();
            if (data.summary) {
                setSummary(data.summary);
                setUpdatedAt(data.updated_at || new Date().toISOString());
            } else {
                throw new Error('Invalid summary response');
            }
        } catch (err: any) {
            console.error('Failed to refresh AI summary:', err);
            setError('Could not update summary at this time. Retaining latest operational record.');
        } finally {
            setLoading(false);
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
                        Operational Insights
                    </p>
                </div>
            </button>

            {/* Standard System Modal matching MDRRMO Design */}
            <Modal
                open={isOpen}
                onClose={() => setIsOpen(false)}
                size="lg"
                title="AI-Powered Operational Summary"
                description="Intelligent insights based on current MDRRMO operational data."
                footer={
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Last Updated: {formatTimestamp(updatedAt)}</span>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                            >
                                Close
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={loading}
                                loading={loading}
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                                <span>{loading ? 'Analyzing...' : 'Refresh Summary'}</span>
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Executive Operational Badge */}
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[11px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Executive Operational Briefing</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                            MDRRMO Opol Command Center
                        </span>
                    </div>

                    {/* Operational Summary Body */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 dark:text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin text-red-600 dark:text-red-500" />
                            <p className="text-xs sm:text-sm font-medium animate-pulse text-slate-600 dark:text-slate-300">
                                Analyzing live incident records, ambulance fleet, and responder deployment...
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
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
                </div>
            </Modal>
        </>
    );
}
