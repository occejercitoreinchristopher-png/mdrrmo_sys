import { useState } from 'react';
import DashboardCards from '@/admin/components/Dashboard/DashboardCards';
import ReportsCharts, { ChartsData } from './ReportsCharts';
import ReportsTable, { Incident } from './ReportsTable';
import ReportFilters, { ReportFiltersState } from './ReportFilters';
import PageHeader from '@/shared/components/PageHeader';

export interface ReportsDashboardProps {
    stats?: Record<string, any>;
    charts?: ChartsData;
    incidents?: Incident[];
}

export default function ReportsDashboard({ stats = {}, charts = {}, incidents = [] }: ReportsDashboardProps) {
    const [filters, setFilters] = useState<ReportFiltersState>({ dateFrom: '', dateTo: '', status: '', type: '' });

    return (
        <div>
            <PageHeader title="Reports & Analytics" subtitle="Overview of MDRRMO incident and dispatch statistics." />
            <ReportFilters filters={filters} onChange={setFilters} />
            <DashboardCards stats={stats} />
            <ReportsCharts charts={charts} />
            <ReportsTable incidents={incidents} filters={filters} />
        </div>
    );
}
