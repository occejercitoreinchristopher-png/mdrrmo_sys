/**
 * Official MDRRMO Opol Incident Categories and Chief Complaints / Incident Types
 */

export const MAIN_CATEGORIES = [
    'Medical Emergency',
    'Fire Emergency',
    'Severe Weather / Flood',
    'Crime & Security',
    'Search & Rescue',
] as const;

export type MainCategory = typeof MAIN_CATEGORIES[number];

export const INCIDENT_TYPES_BY_CATEGORY: Record<MainCategory, string[]> = {
    'Medical Emergency': [
        'Medical Emergency',
        'Cardiac Emergency',
        'Respiratory Emergency',
        'Diabetic Emergency',
        'Psychiatric Emergency',
        'Motor Vehicular Accidents',
        'Motor Vehicular Accidents (Pedestrian)',
        'Mass Casualty Incident (Trauma)',
        'Mass Casualty Incident (Medical, Infectious)',
        'Industrial Accident',
        'Transport Home to Hospital',
        'Transport for Check Up',
        'Transport for Referral',
        'Transport for Hospital Admission',
        'Transport (Cadaver)',
        'Covid-19 Transport',
        'Bleeding',
        'Hemorrhage/Laceration/Abrasion',
        'Trauma',
        'Fall Victim',
        'Fracture/Dislocation',
        'Abdominal Pain',
        'Back Pain',
        'Headache',
        'Eye Problem',
        'Breathing Problems/Difficulty of Breathing',
        'Burns',
        'Electrical Shock',
        'Allergic Reaction',
        'Overdose',
        'Flu-like Symptoms',
        'Unconscious',
        'Seizures',
        'Pregnancy/Childbirth',
        'Wound Dressing/First Aid',
        'Dead',
        'Nausea and Vomiting',
        'Fainting',
        'Suicide',
        'CVA (Stroke)',
        'Animal Bite',
        'Stab Wound',
        'Hypertensive Emergency',
        'Psychosomatic Disorder',
        'Post Operative Case',
        'Loss of Bowel Movement/Mild Dehydration',
        'Chest Pain',
        'Body Weakness',
        'Attempted Suicide',
    ],
    'Fire Emergency': [
        'Fire Incidents',
        'Burns',
        'Smoke Inhalation',
        'Hazardous Materials',
        'Hazardous Condition',
    ],
    'Severe Weather / Flood': [
        'Severe Weather',
        'Flash Flood Emergency',
        'Storm Surge',
        'Typhoon Disaster',
        'Landslide Incident',
        'Evacuation Center Management',
    ],
    'Crime & Security': [
        'Bomb Threat',
        'Hostage Situation',
        'Terrorism',
        'Assault',
        'Civil Disturbance',
        'Armed Robbery',
        'Theft',
    ],
    'Search & Rescue': [
        'Search and Rescue/Retrieval',
        'Water Rescue/Drowning Incident',
        'Mountain Search and Rescue',
        'Collapsed Structure Rescue',
        'Trapped Victims Extraction',
        'River Current Sweep Retrieval',
        'Missing Persons',
    ],
};

export const ALL_INCIDENT_TYPES: string[] = Object.values(INCIDENT_TYPES_BY_CATEGORY).flat();

/**
 * Returns the proper Main Category for a given incident complaint or incident type.
 */
export function getCategoryForIncident(complaintOrType?: string | null): string | null {
    if (!complaintOrType || typeof complaintOrType !== 'string') {
        return null;
    }

    const norm = complaintOrType.trim().toLowerCase();
    if (!norm) {
        return null;
    }

    // Direct check if complaintOrType is ITSELF one of the MAIN_CATEGORIES
    for (const cat of MAIN_CATEGORIES) {
        if (cat.toLowerCase() === norm) {
            return cat;
        }
    }

    // Check custom incidents first
    try {
        const customMap = getStoredCustomIncidents();
        for (const [category, incidents] of Object.entries(customMap)) {
            for (const inc of incidents) {
                if (inc.trim().toLowerCase() === norm) {
                    return category;
                }
            }
        }
    } catch {}

    // Direct match within standard categories
    for (const [category, incidents] of Object.entries(INCIDENT_TYPES_BY_CATEGORY) as [MainCategory, string[]][]) {
        for (const inc of incidents) {
            if (inc.toLowerCase() === norm) {
                return category;
            }
        }
    }

    // Keyword & legacy alias heuristics
    if (norm.includes('search') || norm.includes('rescue') || norm.includes('drown') || norm.includes('water') || norm.includes('sweep') || norm.includes('trap')) {
        return 'Search & Rescue';
    }
    if (norm.includes('flood') || norm.includes('weather') || norm.includes('typhoon') || norm.includes('surge') || norm.includes('storm') || norm.includes('landslide')) {
        return 'Severe Weather / Flood';
    }
    if (norm.includes('fire') || norm.includes('conflagration') || norm.includes('smoke') || norm.includes('burn')) {
        return 'Fire Emergency';
    }
    if (norm.includes('crime') || norm.includes('violence') || norm.includes('assault') || norm.includes('threat') || norm.includes('hostage') || norm.includes('terror') || norm.includes('stab') || norm.includes('robbery') || norm.includes('theft')) {
        return 'Crime & Security';
    }
    if (norm.includes('vehicular') || norm.includes('accident') || norm.includes('medical') || norm.includes('trauma') || norm.includes('cpr') || norm.includes('patient') || norm.includes('injury')) {
        return 'Medical Emergency';
    }

    return null;
}

/**
 * Returns the list of incident types for a selected category, or all if 'all'.
 * If category is not found in standard categories, returns empty array (to be supplemented by custom incidents).
 */
export function getIncidentsForCategory(category?: string | null): string[] {
    if (!category || category === 'all') {
        return ALL_INCIDENT_TYPES;
    }
    return INCIDENT_TYPES_BY_CATEGORY[category as MainCategory] || [];
}

/**
 * Helper to format string into proper Title Case (capitalizing first letter of each major word)
 */
export function formatTitleCase(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word, idx) => {
            const minorWords = ['and', '&', 'or', 'for', 'of', 'the', 'in', 'on', 'to', 'with'];
            if (idx > 0 && minorWords.includes(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

const CUSTOM_CATEGORIES_KEY = 'mdrrmo_custom_categories';
const CUSTOM_INCIDENTS_KEY = 'mdrrmo_custom_incidents';

export function getStoredCustomCategories(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const val = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
        const list: string[] = val ? JSON.parse(val) : [];
        const formatted = Array.from(new Set(list.map((c) => formatTitleCase(c)).filter(Boolean)));
        // Auto-heal localStorage if any stored item was lowercase
        if (JSON.stringify(list) !== JSON.stringify(formatted)) {
            localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(formatted));
        }
        return formatted;
    } catch {
        return [];
    }
}

export function saveStoredCustomCategory(cat: string): string {
    const formatted = formatTitleCase(cat);
    if (typeof window === 'undefined') return formatted;
    try {
        const list = getStoredCustomCategories();
        if (!list.includes(formatted) && !MAIN_CATEGORIES.includes(formatted as any)) {
            list.push(formatted);
            localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(list));
        }
    } catch {}
    return formatted;
}

export function getStoredCustomIncidents(): Record<string, string[]> {
    if (typeof window === 'undefined') return {};
    try {
        const val = localStorage.getItem(CUSTOM_INCIDENTS_KEY);
        const rawMap: Record<string, string[]> = val ? JSON.parse(val) : {};
        const cleanMap: Record<string, string[]> = {};
        for (const [cat, incidents] of Object.entries(rawMap)) {
            const formattedCat = formatTitleCase(cat);
            const formattedList = Array.from(new Set(incidents.map((i) => formatTitleCase(i)).filter(Boolean)));
            cleanMap[formattedCat] = formattedList;
        }
        return cleanMap;
    } catch {
        return {};
    }
}

export function saveStoredCustomIncident(category: string, incidentName: string): { category: string; incident: string } {
    const formattedCat = formatTitleCase(category);
    const formattedInc = formatTitleCase(incidentName);
    if (typeof window === 'undefined') return { category: formattedCat, incident: formattedInc };
    try {
        const map = getStoredCustomIncidents();
        if (!map[formattedCat]) map[formattedCat] = [];
        if (!map[formattedCat].includes(formattedInc)) {
            map[formattedCat].push(formattedInc);
            localStorage.setItem(CUSTOM_INCIDENTS_KEY, JSON.stringify(map));
        }
    } catch {}
    return { category: formattedCat, incident: formattedInc };
}
