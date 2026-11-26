/**
 * OFFICIAL MDRRMO OPOL EMERGENCY TYPE COLOR CODING
 * 
 * IMPORTANT: The system uses exactly FIVE official emergency types.
 * Used for Dynamic Zoom-Based Incident Visualization, markers, and legend.
 * 
 * | Official Emergency Type | Color  | Hex Code |
 * | Medical Emergency       | Rose   | #EC4899  |
 * | Fire Emergency          | Red    | #EF4444  |
 * | Severe Weather / Flood  | Cyan   | #06B6D4  |
 * | Crime & Security        | Amber  | #F59E0B  |
 * | Search & Rescue         | Purple | #A855F7  |
 */

import { getCategoryForIncident } from '@/dispatcher/data/incidentCategories';

export interface OfficialEmergencyType {
    name: 'Medical Emergency' | 'Fire Emergency' | 'Severe Weather / Flood' | 'Crime & Security' | 'Search & Rescue';
    color: 'Rose' | 'Red' | 'Cyan' | 'Amber' | 'Purple' | 'Blue';
    hex: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
}

export const OFFICIAL_EMERGENCY_TYPES: readonly OfficialEmergencyType[] = [
    {
        name: 'Medical Emergency',
        color: 'Rose',
        hex: '#EC4899',
        bgClass: 'bg-pink-500/15',
        textClass: 'text-pink-500 dark:text-pink-400',
        borderClass: 'border-pink-500/30',
        badgeClass: 'bg-pink-500/15 border-pink-500/30 text-pink-500 dark:text-pink-300',
    },
    {
        name: 'Fire Emergency',
        color: 'Red',
        hex: '#EF4444',
        bgClass: 'bg-red-500/15',
        textClass: 'text-red-500 dark:text-red-400',
        borderClass: 'border-red-500/30',
        badgeClass: 'bg-red-500/15 border-red-500/30 text-red-500 dark:text-red-300',
    },
    {
        name: 'Severe Weather / Flood',
        color: 'Cyan',
        hex: '#06B6D4',
        bgClass: 'bg-cyan-500/15',
        textClass: 'text-cyan-500 dark:text-cyan-400',
        borderClass: 'border-cyan-500/30',
        badgeClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-500 dark:text-cyan-300',
    },
    {
        name: 'Crime & Security',
        color: 'Amber',
        hex: '#F59E0B',
        bgClass: 'bg-amber-500/15',
        textClass: 'text-amber-500 dark:text-amber-400',
        borderClass: 'border-amber-500/30',
        badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-300',
    },
    {
        name: 'Search & Rescue',
        color: 'Purple',
        hex: '#A855F7',
        bgClass: 'bg-purple-500/15',
        textClass: 'text-purple-500 dark:text-purple-400',
        borderClass: 'border-purple-500/30',
        badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-500 dark:text-purple-300',
    },
] as const;

export type OfficialEmergencyTypeName = typeof OFFICIAL_EMERGENCY_TYPES[number]['name'];

/**
 * Neutral gray marker color for unclassified / unmatched incidents.
 */
export const NEUTRAL_GRAY_COLOR = '#94A3B8';
export const NEUTRAL_GRAY_NAME = 'Other / Unclassified';

const TYPE_MAP_BY_NAME = new Map<string, OfficialEmergencyType>(
    OFFICIAL_EMERGENCY_TYPES.map((t) => [t.name.toLowerCase(), t])
);

// Map by official ID from IncidentTypeSeeder (1: Medical, 2: Fire, 3: Severe Weather, 4: Crime, 5: Search & Rescue)
const TYPE_MAP_BY_ID: Record<number, OfficialEmergencyType> = {
    1: OFFICIAL_EMERGENCY_TYPES[0], // Medical Emergency
    2: OFFICIAL_EMERGENCY_TYPES[1], // Fire Emergency
    3: OFFICIAL_EMERGENCY_TYPES[2], // Severe Weather / Flood
    4: OFFICIAL_EMERGENCY_TYPES[3], // Crime & Security
    5: OFFICIAL_EMERGENCY_TYPES[4], // Search & Rescue
};

/**
 * Maps any incident record or incident type string/id to one of the 5 official types.
 * Returns null if the incident cannot be mapped.
 */
export function getOfficialEmergencyType(
    incidentOrType?: any
): OfficialEmergencyType | null {
    if (!incidentOrType) return null;

    // 1. Direct ID lookup if available
    if (typeof incidentOrType === 'object') {
        const id = incidentOrType.incident_type_id ?? incidentOrType.type_id;
        if (typeof id === 'number' && TYPE_MAP_BY_ID[id]) {
            return TYPE_MAP_BY_ID[id];
        }
    }

    // 2. Extract string identifier
    let rawStr = '';
    if (typeof incidentOrType === 'string') {
        rawStr = incidentOrType;
    } else if (typeof incidentOrType === 'object') {
        rawStr =
            incidentOrType.incident_type ||
            incidentOrType.type ||
            incidentOrType.chief_complaint ||
            incidentOrType.type_filter_key ||
            '';
    }

    const trimmed = rawStr.trim();
    if (!trimmed) return null;

    // 3. Exact match against official names
    const exact = TYPE_MAP_BY_NAME.get(trimmed.toLowerCase());
    if (exact) return exact;

    // 4. Delegate to existing system classification hierarchy
    const categoryName = getCategoryForIncident(trimmed);
    if (categoryName) {
        const matched = TYPE_MAP_BY_NAME.get(categoryName.toLowerCase());
        if (matched) return matched;
    }

    // 5. Keyword heuristics without altering DB records
    const lower = trimmed.toLowerCase();

    if (
        lower.includes('fire') ||
        lower.includes('conflagration') ||
        lower.includes('smoke') ||
        lower.includes('burn') ||
        lower.includes('explosion')
    ) {
        return OFFICIAL_EMERGENCY_TYPES[1]; // Fire Emergency (#EF4444)
    }

    if (
        lower.includes('weather') ||
        lower.includes('flood') ||
        lower.includes('typhoon') ||
        lower.includes('surge') ||
        lower.includes('storm') ||
        lower.includes('landslide') ||
        lower.includes('overflow') ||
        lower.includes('calamity')
    ) {
        return OFFICIAL_EMERGENCY_TYPES[2]; // Severe Weather / Flood (#06B6D4)
    }

    if (
        lower.includes('crime') ||
        lower.includes('security') ||
        lower.includes('assault') ||
        lower.includes('robbery') ||
        lower.includes('theft') ||
        lower.includes('weapon') ||
        lower.includes('violence') ||
        lower.includes('hostage') ||
        lower.includes('bomb') ||
        lower.includes('disturbance') ||
        lower.includes('threat') ||
        lower.includes('police')
    ) {
        return OFFICIAL_EMERGENCY_TYPES[3]; // Crime & Security (#F59E0B)
    }

    if (
        lower.includes('search') ||
        lower.includes('rescue') ||
        lower.includes('drown') ||
        lower.includes('water rescue') ||
        lower.includes('sweep') ||
        lower.includes('retrieval') ||
        lower.includes('trapped') ||
        lower.includes('collapsed structure') ||
        lower.includes('missing')
    ) {
        return OFFICIAL_EMERGENCY_TYPES[4]; // Search & Rescue (#A855F7)
    }

    if (
        lower.includes('medical') ||
        lower.includes('cardiac') ||
        lower.includes('trauma') ||
        lower.includes('vehicular') ||
        lower.includes('accident') ||
        lower.includes('traffic') ||
        lower.includes('collision') ||
        lower.includes('stroke') ||
        lower.includes('cva') ||
        lower.includes('seizure') ||
        lower.includes('ambulance') ||
        lower.includes('patient') ||
        lower.includes('injury') ||
        lower.includes('bleeding') ||
        lower.includes('fracture') ||
        lower.includes('fall') ||
        lower.includes('unconscious')
    ) {
        return OFFICIAL_EMERGENCY_TYPES[0]; // Medical Emergency (#3B82F6)
    }

    return null;
}

/**
 * Returns the exact hex color for an incident or emergency type string.
 * Uses neutral gray (#94A3B8) if unmatched.
 */
export function getEmergencyTypeColor(incidentOrType?: any): string {
    const official = getOfficialEmergencyType(incidentOrType);
    return official ? official.hex : NEUTRAL_GRAY_COLOR;
}

/**
 * Returns complete badge styling (bg, dot, hex, text, border) for UI cards and badges.
 */
export function getEmergencyTypeBadge(incidentOrType?: any) {
    const official = getOfficialEmergencyType(incidentOrType);
    if (official) {
        return {
            name: official.name,
            color: official.color,
            hex: official.hex,
            bg: official.bgClass,
            dot: `bg-[${official.hex}]`,
            text: official.textClass,
            border: official.borderClass,
            badge: official.badgeClass,
        };
    }
    return {
        name: NEUTRAL_GRAY_NAME,
        color: 'Neutral Gray',
        hex: NEUTRAL_GRAY_COLOR,
        bg: 'bg-slate-500/15',
        dot: 'bg-[#94A3B8]',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        badge: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
    };
}
