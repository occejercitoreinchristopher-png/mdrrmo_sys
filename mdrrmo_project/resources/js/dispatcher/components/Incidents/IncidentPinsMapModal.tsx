import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import Map, { Layer, Marker, Popup, Source, type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Activity,
    Calendar,
    Compass,
    HeartPulse,
    Layers,
    Loader2,
    MapPin,
    Maximize2,
    Printer,
    X,
} from 'lucide-react';
import { useAppearance } from '@/shared/contexts/ThemeContext';
import StatusBadge from '@/shared/components/StatusBadge';

export interface IncidentPinsMapFilters {
    categories: string[];
    incidents: string[];
    months: string[];
    monthLabels: string[];
    times: string[];
    timeLabels: string[];
    barangays: string[];
    search: string;
    customIncidents?: Record<string, string[]>;
}

interface IncidentPinsMapModalProps {
    open: boolean;
    onClose: () => void;
    filters: IncidentPinsMapFilters;
    barangayGeojson?: any;
    preparedByName?: string;
    resolveCategory: (row: any) => string;
    resolveChiefComplaint: (row: any) => string;
}

type MapStyleMode = 'streets' | 'light' | 'dark' | 'satellite';

interface PlottedIncident {
    incident: any;
    lat: number;
    lng: number;
    barangay: string;
    address: string;
    category: string;
    chiefComplaint: string;
    color: string;
}

const CUSTOM_CATEGORY_PALETTE = [
    '#059669', // Emerald
    '#0d9488', // Teal
    '#db2777', // Pink
    '#4f46e5', // Indigo
    '#65a30d', // Lime
    '#0891b2', // Cyan
    '#b45309', // Dark Amber
    '#7c3aed', // Violet
];

function getEmergencyTypeColor(category: string): string {
    const norm = (category || '').trim().toLowerCase();
    if (!norm || norm.includes('medical') || norm.includes('health') || norm.includes('cardiac') || norm.includes('obstetric')) {
        return '#e11d48'; // Crimson Red
    }
    if (norm.includes('fire') || norm.includes('burn') || norm.includes('explosion')) {
        return '#f97316'; // Vivid Orange
    }
    if (norm.includes('rescue') || norm.includes('water') || norm.includes('drown') || norm.includes('search')) {
        return '#0284c7'; // Sky Blue
    }
    if (norm.includes('disaster') || norm.includes('calamity') || norm.includes('flood') || norm.includes('typhoon') || norm.includes('earthquake') || norm.includes('landslide') || norm.includes('natural')) {
        return '#d97706'; // Amber Gold
    }
    if (norm.includes('vehicular') || norm.includes('traffic') || norm.includes('accident') || norm.includes('trauma') || norm.includes('collision')) {
        return '#9333ea'; // Purple
    }
    if (norm.includes('police') || norm.includes('crime') || norm.includes('security') || norm.includes('assault')) {
        return '#1e3a8a'; // Navy Blue
    }

    // Deterministic color for any custom / other emergency category
    let hash = 0;
    for (let i = 0; i < norm.length; i++) {
        hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
    }
    return CUSTOM_CATEGORY_PALETTE[hash % CUSTOM_CATEGORY_PALETTE.length];
}

function escapeHtml(val: unknown): string {
    return String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export default function IncidentPinsMapModal({
    open,
    onClose,
    filters,
    barangayGeojson = null,
    preparedByName,
    resolveCategory,
    resolveChiefComplaint,
}: IncidentPinsMapModalProps) {
    const { theme } = useAppearance();
    const isDark = theme === 'dark';
    const mapRef = useRef<MapRef>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('streets');
    const [selectedPin, setSelectedPin] = useState<PlottedIncident | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    const [viewState, setViewState] = useState({
        longitude: 124.577,
        latitude: 8.52,
        zoom: 12.2,
    });

    const categoriesKey = filters.categories.join('\x1f');
    const incidentsKey = filters.incidents.join('\x1f');
    const monthsKey = filters.months.join('\x1f');
    const timesKey = filters.times.join('\x1f');
    const barangaysKey = filters.barangays.join('\x1f');

    // Fetch ALL matching filtered incidents from the same backend endpoint
    const { data, isLoading, isFetching } = useQuery<{
        data: any[];
        total: number;
        overall_total: number;
    }>({
        queryKey: [
            'incident-records-all-pins',
            {
                categories: categoriesKey,
                incidents: incidentsKey,
                months: monthsKey,
                times: timesKey,
                barangays: barangaysKey,
                search: filters.search.trim(),
                customIncidents: filters.customIncidents || {},
            },
        ],
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({ all: '1' });
            if (filters.search.trim()) params.set('search', filters.search.trim());
            filters.categories.forEach((c) => params.append('category[]', c));
            filters.incidents.forEach((i) => params.append('incident[]', i));
            filters.months.forEach((m) => params.append('month[]', m));
            filters.times.forEach((t) => params.append('time[]', t));
            filters.barangays.forEach((b) => params.append('barangay[]', b));
            if (filters.customIncidents && Object.keys(filters.customIncidents).length > 0) {
                params.set('custom_incidents', JSON.stringify(filters.customIncidents));
            }

            const res = await fetch(`/dispatcher/incidents/records?${params.toString()}`, {
                signal,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch map incidents (${res.status})`);
            }
            return await res.json();
        },
        enabled: open,
        staleTime: 1000 * 60,
    });

    const matchingIncidents = data?.data ?? [];
    const totalMatching = data?.total ?? matchingIncidents.length;

    // Extract plotted incidents with valid GPS coordinates
    const plottedIncidents = useMemo<PlottedIncident[]>(() => {
        const result: PlottedIncident[] = [];
        for (const inc of matchingIncidents) {
            const rawLat = inc.incident_latitude ?? inc.reporter_latitude;
            const rawLng = inc.incident_longitude ?? inc.reporter_longitude;
            const lat = parseFloat(String(rawLat ?? ''));
            const lng = parseFloat(String(rawLng ?? ''));
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) continue;

            const barangay =
                typeof inc.barangay === 'object'
                    ? inc.barangay?.barangay_name || inc.barangay?.name || ''
                    : inc.barangay ||
                      inc.resident?.resident_profile?.barangay?.barangay_name ||
                      inc.resident?.residentProfile?.barangay?.barangay_name ||
                      '';

            const address =
                inc.incident_address ||
                inc.place_of_incident ||
                inc.location ||
                (barangay ? `Brgy. ${barangay}, Opol, Misamis Oriental` : 'Opol, Misamis Oriental');

            const category = resolveCategory(inc);

            result.push({
                incident: inc,
                lat,
                lng,
                barangay,
                address,
                category,
                chiefComplaint: resolveChiefComplaint(inc),
                color: getEmergencyTypeColor(category),
            });
        }
        return result;
    }, [matchingIncidents, resolveCategory, resolveChiefComplaint]);

    // Emergency type color legend breakdown
    const emergencyTypeLegend = useMemo(() => {
        const grouped: Record<string, { category: string; color: string; count: number }> = {};
        for (const item of plottedIncidents) {
            const key = item.category || 'Medical Emergency';
            const existing = grouped[key];
            if (existing) {
                existing.count += 1;
            } else {
                grouped[key] = { category: key, color: item.color, count: 1 };
            }
        }
        return Object.values(grouped).sort((a, b) => b.count - a.count);
    }, [plottedIncidents]);

    // Barangay count breakdown for summary strip & print report
    const barangayBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const item of plottedIncidents) {
            const key = item.barangay ? `Brgy. ${item.barangay}` : 'Unspecified';
            counts[key] = (counts[key] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [plottedIncidents]);

    // Highlighted barangay boundaries when 1+ Barangays are selected
    const highlightedBarangayGeojson = useMemo(() => {
        if (!barangayGeojson?.features || filters.barangays.length === 0) {
            return null;
        }
        const normTargets = filters.barangays.map((b) =>
            b.toLowerCase().replace(/[\s-]/g, ''),
        );
        const matching = barangayGeojson.features.filter((f: any) => {
            const name = (f.properties?.name ?? '').toLowerCase().replace(/[\s-]/g, '');
            return normTargets.includes(name);
        });
        if (matching.length === 0) return null;
        return {
            type: 'FeatureCollection' as const,
            features: matching,
        };
    }, [barangayGeojson, barangaysKey]);

    const mapStyleUrl = useMemo(() => {
        switch (mapStyleMode) {
            case 'satellite':
                return 'mapbox://styles/mapbox/satellite-streets-v12';
            case 'light':
                return 'mapbox://styles/mapbox/light-v11';
            case 'dark':
                return 'mapbox://styles/mapbox/dark-v11';
            case 'streets':
            default:
                return 'mapbox://styles/mapbox/streets-v12';
        }
    }, [mapStyleMode]);

    // Helper to fit map bounds to all plotted pins
    const fitAllPins = () => {
        const map = mapRef.current;
        if (!map) return;

        if (plottedIncidents.length === 0) {
            map.flyTo({
                center: [124.577, 8.52],
                zoom: 12.2,
                duration: 700,
                essential: true,
            });
            return;
        }

        if (plottedIncidents.length === 1) {
            map.flyTo({
                center: [plottedIncidents[0].lng, plottedIncidents[0].lat],
                zoom: 15.5,
                duration: 700,
                essential: true,
            });
            return;
        }

        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;

        for (const p of plottedIncidents) {
            if (p.lng < minLng) minLng = p.lng;
            if (p.lng > maxLng) maxLng = p.lng;
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
        }

        if (minLng === maxLng && minLat === maxLat) {
            map.flyTo({
                center: [minLng, minLat],
                zoom: 15.5,
                duration: 700,
                essential: true,
            });
            return;
        }

        map.fitBounds(
            [
                [minLng, minLat],
                [maxLng, maxLat],
            ],
            {
                padding: { top: 65, bottom: 65, left: 65, right: 65 },
                maxZoom: 15.5,
                duration: 800,
            },
        );
    };

    // Reset popup & resize/fit bounds when modal opens or plotted pins update
    useEffect(() => {
        if (!open) {
            setSelectedPin(null);
            setMapLoaded(false);
            return;
        }
    }, [open]);

    useEffect(() => {
        if (!open || !mapLoaded) return;
        const timer = setTimeout(() => {
            mapRef.current?.resize();
            fitAllPins();
        }, 180);
        return () => clearTimeout(timer);
    }, [open, mapLoaded, plottedIncidents.length, barangaysKey, categoriesKey, incidentsKey, monthsKey, timesKey, filters.search]);

    // ResizeObserver for Mapbox canvas inside modal
    useEffect(() => {
        if (!open || !mapContainerRef.current) return;
        const observer = new ResizeObserver(() => {
            mapRef.current?.resize();
        });
        observer.observe(mapContainerRef.current);
        const t1 = setTimeout(() => mapRef.current?.resize(), 120);
        const t2 = setTimeout(() => mapRef.current?.resize(), 400);
        return () => {
            observer.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [open]);

    // Build active filter summary items
    const activeFilterChips = useMemo(() => {
        const chips: { label: string; value: string }[] = [];
        if (filters.categories.length > 0) {
            chips.push({ label: 'Category', value: filters.categories.join(', ') });
        }
        if (filters.incidents.length > 0) {
            chips.push({ label: 'Chief Complaint', value: filters.incidents.join(', ') });
        }
        if (filters.monthLabels.length > 0) {
            chips.push({ label: 'Month', value: filters.monthLabels.join(', ') });
        }
        if (filters.timeLabels.length > 0) {
            chips.push({ label: 'Time', value: filters.timeLabels.join(', ') });
        }
        if (filters.barangays.length > 0) {
            chips.push({
                label: 'Barangay',
                value: filters.barangays.map((b) => `Brgy. ${b}`).join(', '),
            });
        }
        if (filters.search.trim()) {
            chips.push({ label: 'Search', value: `"${filters.search.trim()}"` });
        }
        return chips;
    }, [filters]);

    // Synchronous High-Res Map + Pins Capture & Print Preview
    const handlePrintMap = () => {
        const mapInstance = mapRef.current;
        if (!mapInstance) return;

        let mapImageDataUrl = '';

        try {
            const rawMap = mapInstance.getMap();
            const mapCanvas = rawMap.getCanvas();
            const cw = mapCanvas.width;
            const ch = mapCanvas.height;
            const dpr = mapCanvas.clientWidth > 0 ? cw / mapCanvas.clientWidth : window.devicePixelRatio || 1;

            const offscreen = document.createElement('canvas');
            offscreen.width = cw;
            offscreen.height = ch;
            const ctx = offscreen.getContext('2d');

            if (ctx) {
                // 1. Draw the Mapbox WebGL canvas (basemap + Opol barangay boundaries)
                ctx.drawImage(mapCanvas, 0, 0, cw, ch);

                // 2. Project & draw crisp teardrop pins for every plotted incident
                for (const item of plottedIncidents) {
                    const pt = rawMap.project([item.lng, item.lat]);
                    const x = pt.x * dpr;
                    const y = pt.y * dpr;

                    // Skip if outside visible viewport
                    if (x < -30 * dpr || x > cw + 30 * dpr || y < -40 * dpr || y > ch + 20 * dpr) {
                        continue;
                    }

                    const s = dpr;
                    ctx.save();
                    ctx.translate(x, y);

                    // Subtle ground shadow
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 5 * s, 2.2 * s, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
                    ctx.fill();

                    // Teardrop pin shape (tip at 0,0)
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.bezierCurveTo(-9 * s, -10 * s, -10.5 * s, -16 * s, -10.5 * s, -20 * s);
                    ctx.arc(0, -20 * s, 10.5 * s, Math.PI, 0, false);
                    ctx.bezierCurveTo(10.5 * s, -16 * s, 9 * s, -10 * s, 0, 0);
                    ctx.closePath();

                    ctx.fillStyle = item.color || '#e11d48';
                    ctx.fill();
                    ctx.lineWidth = 1.8 * s;
                    ctx.strokeStyle = '#ffffff';
                    ctx.stroke();

                    // Inner white circle
                    ctx.beginPath();
                    ctx.arc(0, -20 * s, 3.6 * s, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();

                    ctx.restore();
                }

                mapImageDataUrl = offscreen.toDataURL('image/png');
            }
        } catch (err) {
            console.error('Failed to capture map canvas for printing:', err);
        }

        const printWindow = window.open('', '_blank', 'width=1150,height=780');
        if (!printWindow) {
            alert('Pop-up blocked! Please allow pop-ups for this site and try again.');
            return;
        }

        const filterSummaryHtml =
            activeFilterChips.length > 0
                ? activeFilterChips
                      .map(
                          (c) =>
                              `<span class="filter-chip"><strong>${c.label}:</strong> ${c.value}</span>`,
                      )
                      .join('')
                : '<span class="filter-chip"><strong>Filters:</strong> All Archived Incident Records (Unfiltered)</span>';

        const breakdownHtml =
            barangayBreakdown.length > 0
                ? barangayBreakdown
                      .map(
                          ([bName, count]) =>
                              `<span class="brgy-pill">${escapeHtml(bName)}: <strong>${count}</strong></span>`,
                      )
                      .join('')
                : '<span class="brgy-pill">No plotted coordinates</span>';

        const legendHtml =
            emergencyTypeLegend.length > 0
                ? emergencyTypeLegend
                      .map(
                          (entry) =>
                              `<span><span class="legend-dot" style="background:${entry.color}; box-shadow:0 0 0 1px ${entry.color};"></span>${escapeHtml(entry.category)} (${entry.count})</span>`,
                      )
                      .join('')
                : '<span><span class="legend-dot" style="background:#e11d48; box-shadow:0 0 0 1px #e11d48;"></span>Incident Location (0)</span>';

        const detailsRowsHtml =
            plottedIncidents.length > 0
                ? plottedIncidents
                      .map((item) => {
                          const inc = item.incident;
                          const dt = new Date(inc.reported_at || inc.created_at);
                          const dateStr = isNaN(dt.getTime())
                              ? 'N/A'
                              : dt.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                });
                          const timeStr = isNaN(dt.getTime())
                              ? ''
                              : dt.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                });
                          const firstDispatch = Array.isArray(inc.dispatches) ? inc.dispatches[0] : null;
                          const unitText = firstDispatch?.ambulance?.plate_number
                              ? `Amb. ${firstDispatch.ambulance.plate_number}`
                              : firstDispatch?.team || '—';
                          const statusText = String(inc.incident_status || 'resolved').toUpperCase();

                          return `
                    <tr>
                        <td style="white-space:nowrap; font-weight:700;">
                            <span class="row-pin-dot" style="background:${item.color};"></span>#${escapeHtml(inc.id)}
                        </td>
                        <td style="white-space:nowrap;">
                            <div style="font-weight:700;">${escapeHtml(dateStr)}</div>
                            <div style="font-size:7.2px; color:#475569;">${escapeHtml(timeStr)}</div>
                        </td>
                        <td>
                            <div style="font-weight:600;">${escapeHtml(item.address)}</div>
                            ${item.barangay ? `<div style="font-size:7.2px; color:#b91c1c; font-weight:600;">Brgy. ${escapeHtml(item.barangay)}</div>` : ''}
                        </td>
                        <td>
                            <span class="type-pill" style="border-color:${item.color}; color:${item.color}; background:${item.color}14;">
                                <span class="type-pill-dot" style="background:${item.color};"></span>
                                ${escapeHtml(item.category)}
                            </span>
                        </td>
                        <td>${escapeHtml(item.chiefComplaint || '—')}</td>
                        <td style="white-space:nowrap;">
                            <div style="font-weight:600;">${escapeHtml(unitText)}</div>
                            <div style="font-size:7px; color:#15803d; font-weight:700;">${escapeHtml(statusText)}</div>
                        </td>
                    </tr>`;
                      })
                      .join('')
                : `<tr><td colspan="6" style="text-align:center; padding:10px; color:#64748b; font-style:italic;">No incident records match the active filter criteria.</td></tr>`;

        const generatedAt = new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MDRRMO Opol - Incident Location Map Report</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm 10mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #fff;
        }
        .page {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 5px;
        }
        .header img {
            width: 54px;
            height: 54px;
            object-fit: contain;
        }
        .header-text {
            flex: 1;
            text-align: center;
        }
        .header-text h3 {
            margin: 0;
            font-size: 9px;
            font-weight: 500;
            color: #475569;
        }
        .header-text h2 {
            margin: 1px 0;
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
        }
        .header-text h1 {
            margin: 2px 0 0 0;
            font-size: 13.5px;
            font-weight: 900;
            color: #000000;
            letter-spacing: 0.4px;
        }
        .header-text p {
            margin: 1px 0 0 0;
            font-size: 8.5px;
            color: #475569;
            font-weight: 600;
        }
        .title-bar {
            background: #0f172a;
            color: #ffffff;
            padding: 5px 10px;
            border-radius: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.4px;
        }
        .filters-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            font-size: 8.5px;
        }
        .filter-chip {
            display: inline-block;
            padding: 2px 6px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            color: #1e293b;
        }
        .map-frame {
            width: 100%;
            border: 1.5px solid #0f172a;
            border-radius: 4px;
            overflow: hidden;
            background: #f1f5f9;
            position: relative;
        }
        .map-frame img {
            width: 100%;
            height: ${plottedIncidents.length > 0 ? '94mm' : '112mm'};
            object-fit: cover;
            display: block;
        }
        .map-legend {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 8px;
            background: #f8fafc;
            border-top: 1px solid #cbd5e1;
            font-size: 8px;
            color: #334155;
        }
        .legend-items {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
        }
        .legend-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #e11d48;
            border: 1.5px solid #fff;
            box-shadow: 0 0 0 1px #e11d48;
            margin-right: 4px;
            vertical-align: middle;
        }
        .legend-line {
            display: inline-block;
            width: 14px;
            height: 0;
            border-top: 2px dashed #0ea5e9;
            margin-right: 4px;
            vertical-align: middle;
        }
        .breakdown-bar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            font-size: 8px;
        }
        .breakdown-label {
            font-weight: 700;
            color: #0f172a;
            margin-right: 4px;
            text-transform: uppercase;
        }
        .brgy-pill {
            padding: 1.5px 6px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            color: #1e293b;
        }
        .details-section-title {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #0f172a;
            background: #f1f5f9;
            border-left: 3px solid #0f172a;
            padding: 3px 8px;
            margin-top: 2px;
        }
        table.details-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            border: 1px solid #cbd5e1;
        }
        table.details-table thead {
            display: table-header-group;
        }
        table.details-table th {
            background: #0f172a;
            color: #ffffff;
            text-align: left;
            padding: 4px 6px;
            font-size: 7.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border: 1px solid #0f172a;
        }
        table.details-table td {
            padding: 4px 6px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
            color: #0f172a;
            line-height: 1.25;
        }
        table.details-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }
        table.details-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .row-pin-dot {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-right: 4px;
            vertical-align: middle;
        }
        .type-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 1.5px 5px;
            border-radius: 3px;
            border: 1px solid;
            font-weight: 700;
            font-size: 7.5px;
            white-space: nowrap;
        }
        .type-pill-dot {
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #cbd5e1;
            font-size: 8.5px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .sig-block {
            width: 240px;
        }
        .sig-label {
            font-size: 7.5px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            margin-bottom: 16px;
        }
        .sig-name {
            font-weight: 800;
            font-size: 9.5px;
            text-transform: uppercase;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 2px;
            margin-bottom: 2px;
        }
        .sig-role {
            font-size: 7.5px;
            color: #475569;
        }
        .footer-meta {
            display: flex;
            justify-content: space-between;
            font-size: 7.5px;
            color: #64748b;
            margin-top: 2px;
        }
        .map-preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }
        .map-preview-toolbar-title {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .map-preview-toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .map-preview-btn {
            border: none;
            border-radius: 8px;
            padding: 7px 14px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: opacity 0.15s ease;
        }
        .map-preview-btn:hover {
            opacity: 0.9;
        }
        .map-preview-btn-print {
            background: #dc2626;
            color: #ffffff;
        }
        .map-preview-btn-close {
            background: #334155;
            color: #e2e8f0;
        }
        @media screen {
            body {
                background: #e2e8f0 !important;
                padding-bottom: 24px !important;
            }
            .page {
                width: 280mm;
                max-width: calc(100vw - 24px);
                margin: 16px auto 0 auto;
                padding: 8mm 10mm;
                background: #ffffff;
                box-shadow: 0 8px 28px rgba(15, 23, 42, 0.18);
                border-radius: 4px;
            }
        }
        @media print {
            .map-preview-toolbar {
                display: none !important;
            }
            body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .page {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
            }
        }
    </style>
</head>
<body>
    <div class="map-preview-toolbar">
        <div class="map-preview-toolbar-title">Incident Location Map Report (${plottedIncidents.length} Pins) &mdash; Print Preview</div>
        <div class="map-preview-toolbar-actions">
            <button type="button" class="map-preview-btn map-preview-btn-print" onclick="window.print()">&#128424; Print / Save as PDF</button>
            <button type="button" class="map-preview-btn map-preview-btn-close" onclick="window.close()">Close</button>
        </div>
    </div>
    <div class="page">
        <div class="header">
            <img src="/images/opol-logo.png" alt="Municipality of Opol" />
            <div class="header-text">
                <h3>Republic of the Philippines &bull; Province of Misamis Oriental</h3>
                <h2>MUNICIPALITY OF OPOL</h2>
                <h1>MUNICIPAL DISASTER RISK REDUCTION AND MANAGEMENT OFFICE</h1>
                <p>Emergency Operations &amp; Dispatch Monitoring Center</p>
            </div>
            <img src="/images/opol-rescue-logo.png" alt="Opol Rescue" onerror="this.src='/images/opol_logo.png'" />
        </div>

        <div class="title-bar">
            <span>OFFICIAL INCIDENT LOCATION PIN MAP REPORT</span>
            <span>PLOTTED PINS: ${plottedIncidents.length} OF ${totalMatching} MATCHING RECORDS</span>
        </div>

        <div class="filters-bar">
            ${filterSummaryHtml}
        </div>

        <div class="map-frame">
            ${
                mapImageDataUrl
                    ? `<img src="${mapImageDataUrl}" alt="Incident Locations Map" />`
                    : `<div style="height:112mm; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:11px;">Map image unavailable</div>`
            }
            <div class="map-legend">
                <div class="legend-items">
                    ${legendHtml}
                    <span><span class="legend-line"></span>Opol Barangay Boundaries</span>
                </div>
                <span>Map View: ${mapStyleMode.toUpperCase()}</span>
            </div>
        </div>

        <div class="breakdown-bar">
            <span class="breakdown-label">Pins by Barangay:</span>
            ${breakdownHtml}
        </div>

        <div class="details-section-title">Plotted Incident Details (${plottedIncidents.length})</div>
        <table class="details-table">
            <thead>
                <tr>
                    <th style="width: 7%;">ID</th>
                    <th style="width: 13%;">Date &amp; Time</th>
                    <th style="width: 30%;">Place &amp; Barangay</th>
                    <th style="width: 18%;">Emergency Type</th>
                    <th style="width: 20%;">Chief Complaint</th>
                    <th style="width: 12%;">Unit / Status</th>
                </tr>
            </thead>
            <tbody>
                ${detailsRowsHtml}
            </tbody>
        </table>

        <div class="signatures">
            <div class="sig-block">
                <div class="sig-label">Prepared By:</div>
                <div class="sig-name">${preparedByName || 'MDRRMO Dispatcher On-Duty'}</div>
                <div class="sig-role">Operations Dispatcher</div>
            </div>
            <div class="sig-block">
                <div class="sig-label">Noted By:</div>
                <div class="sig-name">ENGR. ROMMEL C. LANOY</div>
                <div class="sig-role">Municipal Government Department Head</div>
            </div>
        </div>

        <div class="footer-meta">
            <span>Official MDRRMO Opol Data System &bull; Generated: ${generatedAt}</span>
            <span>Incident Location Map Summary</span>
        </div>
    </div>
</body>
</html>`;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
    };

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[96vw] max-w-6xl h-[90vh] max-h-[820px] flex flex-col bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl text-slate-900 dark:text-white overflow-hidden">
                    {/* Modal Header */}
                    <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-50/70 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                                <MapPin className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                    <Dialog.Title className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                        Incident Locations Map
                                    </Dialog.Title>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25">
                                        {isLoading || isFetching ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : null}
                                        <span>
                                            {plottedIncidents.length} pin{plottedIncidents.length === 1 ? '' : 's'} plotted
                                            {totalMatching > plottedIncidents.length
                                                ? ` (${totalMatching} total matched)`
                                                : ''}
                                        </span>
                                    </span>
                                </div>
                                <Dialog.Description className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Synchronized with your active Incident Records filters. Click any pin for details or print the map.
                                </Dialog.Description>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handlePrintMap}
                                disabled={isLoading || !mapLoaded}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-600/25 border border-red-500/30 transition-all cursor-pointer"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print Map</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Active Filters Bar */}
                    {activeFilterChips.length > 0 && (
                        <div className="px-5 py-2 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                                Applied Filters:
                            </span>
                            {activeFilterChips.map((chip) => (
                                <span
                                    key={chip.label}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10"
                                >
                                    <span className="text-slate-400">{chip.label}:</span>
                                    <span>{chip.value}</span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Map Body */}
                    <div className="flex-1 relative min-h-0 bg-slate-100 dark:bg-slate-950">
                        <div ref={mapContainerRef} className="w-full h-full relative">
                            <style>{`
                                .mapboxgl-ctrl-logo { display: none !important; }
                                .mapboxgl-ctrl-attrib { display: none !important; }
                                .mapboxgl-popup-content {
                                    background: transparent !important;
                                    padding: 0 !important;
                                    border-radius: 14px !important;
                                    border: none !important;
                                    box-shadow: 0 18px 40px -10px rgba(0, 0, 0, 0.5) !important;
                                }
                                .mapboxgl-popup-close-button { display: none !important; }
                                .mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
                                    border-bottom-color: ${isDark ? '#0f172a' : '#ffffff'} !important;
                                }
                                .mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
                                    border-top-color: ${isDark ? '#0f172a' : '#ffffff'} !important;
                                }
                            `}</style>

                            {import.meta.env.VITE_MAPBOX_TOKEN ? (
                                <Map
                                    ref={mapRef}
                                    style={{ width: '100%', height: '100%' }}
                                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                    {...viewState}
                                    onMove={(evt) => setViewState(evt.viewState)}
                                    onLoad={() => {
                                        setMapLoaded(true);
                                        mapRef.current?.resize();
                                    }}
                                    onClick={() => setSelectedPin(null)}
                                    mapStyle={mapStyleUrl}
                                    attributionControl={false}
                                    preserveDrawingBuffer={true}
                                >
                                    {/* Opol 14-Barangay Boundaries */}
                                    {barangayGeojson && (
                                        <Source id="all-pins-opol-barangays" type="geojson" data={barangayGeojson}>
                                            <Layer
                                                id="all-pins-barangays-line"
                                                type="line"
                                                paint={{
                                                    'line-color': mapStyleMode === 'dark' ? '#94a3b8' : '#0284c7',
                                                    'line-width': 1.2,
                                                    'line-opacity': 0.55,
                                                    'line-dasharray': [2, 2],
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* Highlighted Barangay Boundary when Barangay filter is active */}
                                    {highlightedBarangayGeojson && (
                                        <Source id="all-pins-highlight-brgy" type="geojson" data={highlightedBarangayGeojson}>
                                            <Layer
                                                id="all-pins-highlight-fill"
                                                type="fill"
                                                paint={{
                                                    'fill-color': '#f43f5e',
                                                    'fill-opacity': 0.12,
                                                }}
                                            />
                                            <Layer
                                                id="all-pins-highlight-line"
                                                type="line"
                                                paint={{
                                                    'line-color': '#f43f5e',
                                                    'line-width': 2.5,
                                                    'line-opacity': 0.85,
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {/* Plotted Incident Pins */}
                                    {plottedIncidents.map((item) => {
                                        const isSelected = selectedPin?.incident.id === item.incident.id;
                                        return (
                                            <Marker
                                                key={item.incident.id}
                                                longitude={item.lng}
                                                latitude={item.lat}
                                                anchor="bottom"
                                                onClick={(e) => {
                                                    e.originalEvent.stopPropagation();
                                                    setSelectedPin(item);
                                                }}
                                            >
                                                <div
                                                    className={`relative flex flex-col items-center group cursor-pointer transition-transform duration-150 ${
                                                        isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-20'
                                                    }`}
                                                    title={`Incident #${item.incident.id}${item.barangay ? ` • Brgy. ${item.barangay}` : ''}`}
                                                >
                                                    <div
                                                        className={`mb-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md border whitespace-nowrap transition-opacity pointer-events-none ${
                                                            isSelected
                                                                ? 'opacity-100 bg-slate-950/95 text-white border-white/25'
                                                                : 'opacity-0 group-hover:opacity-100 bg-slate-900/90 text-slate-100 border-white/15'
                                                        }`}
                                                    >
                                                        #{item.incident.id}
                                                        {item.barangay ? ` • Brgy. ${item.barangay}` : ''}
                                                    </div>
                                                    <MapPin
                                                        style={{ fill: item.color }}
                                                        className="w-8 h-8 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                            </Marker>
                                        );
                                    })}

                                    {/* Selected Pin Popup */}
                                    {selectedPin && (
                                        <Popup
                                            longitude={selectedPin.lng}
                                            latitude={selectedPin.lat}
                                            anchor="top"
                                            offset={8}
                                            closeOnClick={false}
                                            onClose={() => setSelectedPin(null)}
                                        >
                                            <div className="w-64 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                                                            #{selectedPin.incident.id}
                                                        </span>
                                                        <StatusBadge status={selectedPin.incident.incident_status} size="xs" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPin(null)}
                                                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                <div className="text-xs font-semibold leading-snug text-slate-800 dark:text-slate-100">
                                                    {selectedPin.address}
                                                </div>

                                                {selectedPin.barangay && (
                                                    <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        <span>Brgy. {selectedPin.barangay}</span>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                                                        <Activity className="w-2.5 h-2.5" />
                                                        {selectedPin.category}
                                                    </span>
                                                    {selectedPin.chiefComplaint && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300">
                                                            <HeartPulse className="w-2.5 h-2.5" />
                                                            {selectedPin.chiefComplaint}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-200/70 dark:border-white/10">
                                                    <Calendar className="w-3 h-3 shrink-0" />
                                                    <span>
                                                        {new Date(
                                                            selectedPin.incident.reported_at ||
                                                                selectedPin.incident.created_at,
                                                        ).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </Popup>
                                    )}
                                </Map>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                                    <Compass className="w-10 h-10 text-slate-400 mb-2" />
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        Mapbox Token Not Configured
                                    </p>
                                </div>
                            )}

                            {/* Top-left: Map Style Switcher */}
                            <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 p-1 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-white/15 shadow-lg">
                                <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
                                {(
                                    [
                                        { id: 'streets', label: 'Streets' },
                                        { id: 'light', label: 'Light' },
                                        { id: 'dark', label: 'Dark' },
                                        { id: 'satellite', label: 'Satellite' },
                                    ] as const
                                ).map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setMapStyleMode(mode.id)}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                            mapStyleMode === mode.id
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {/* Top-right: Fit All Pins button */}
                            <div className="absolute top-3 right-3 z-10">
                                <button
                                    type="button"
                                    onClick={fitAllPins}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-white/15 shadow-lg transition-colors cursor-pointer"
                                    title="Zoom to fit all incident pins"
                                >
                                    <Maximize2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Fit All Pins</span>
                                </button>
                            </div>

                            {/* Bottom-left: Live Emergency Type Color Legend */}
                            {emergencyTypeLegend.length > 0 && (
                                <div className="absolute bottom-3 left-3 z-10 max-w-[75%] px-3 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-white/15 shadow-lg flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                                        Legend:
                                    </span>
                                    {emergencyTypeLegend.map((entry) => (
                                        <span
                                            key={entry.category}
                                            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200"
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white dark:ring-slate-900"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <span>
                                                {entry.category} ({entry.count})
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Loading Overlay */}
                            {isLoading && (
                                <div className="absolute inset-0 z-20 bg-slate-950/35 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-2.5 text-xs font-semibold">
                                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                        <span>Loading filtered incident pins...</span>
                                    </div>
                                </div>
                            )}

                            {/* Empty Pins Overlay */}
                            {!isLoading && plottedIncidents.length === 0 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/15 shadow-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                                    No incident pins with GPS coordinates match the active filters.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer: Barangay Breakdown Strip + Close */}
                    <div className="px-5 py-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] max-w-4xl">
                            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                                By Barangay:
                            </span>
                            {barangayBreakdown.length > 0 ? (
                                barangayBreakdown.slice(0, 8).map(([bName, count]) => (
                                    <span
                                        key={bName}
                                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium"
                                    >
                                        {bName}: <strong className="text-rose-600 dark:text-rose-400">{count}</strong>
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-400 italic">None</span>
                            )}
                            {barangayBreakdown.length > 8 && (
                                <span className="text-slate-400 font-medium">
                                    +{barangayBreakdown.length - 8} more
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shrink-0"
                        >
                            Close
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
