import { useState, useMemo, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
    PhoneCall, 
    MapPin, 
    Search, 
    CheckCircle2, 
    AlertCircle, 
    Check, 
    ChevronDown, 
    X, 
    Loader2,
    Compass,
    FileText,
    HelpCircle,
    UserCheck,
    History,
    Zap,
    LocateFixed,
    RotateCcw
} from 'lucide-react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import { OPOL_BARANGAYS, searchOpolLandmarks } from '@/dispatcher/data/opolLandmarks';

export interface CallerData {
    phone_number: string;
    caller_name: string | null;
    is_registered_resident: boolean;
    resident_address: string | null;
    resident_barangay?: string | null;
    total_calls: number;
    previous_incident_id?: number | null;
    previous_location?: {
        code: string;
        marker_name: string;
        barangay: string;
        description?: string | null;
        latitude: number;
        longitude: number;
        last_reported_at?: string;
    } | null;
}

export interface PhoneSuggestion {
    phone_number: string;
    normalized_phone: string;
    caller_name: string | null;
    is_registered_resident: boolean;
    barangay: string | null;
    total_calls: number;
    previous_location_code?: string | null;
}

// Default complaints if not passed via props
const DEFAULT_COMPLAINTS = [
    'Medical Emergency', 'Cardiac Emergency', 'Respiratory Emergency', 'Diabetic Emergency',
    'Psychiatric Emergency', 'Motor Vehicular Accidents', 'Motor Vehicular Accidents (Pedestrian)',
    'Mass Casualty Incident (Trauma)', 'Mass Casualty Incident (Medical, Infectious)', 'Industrial Accident',
    'Transport Home to Hospital', 'Transport for Check Up', 'Transport for Referral', 'Transport for Hospital Admission',
    'Transport (Cadaver)', 'Public Service', 'Training', 'Stand-By Unit', 'COVID-19 Transport',
    'Calls (Emergency, Assistance and Inquiry)', 'Hazardous Condition', 'Hazardous Materials', 'Severe Weather',
    'Search and Rescue/ Retrieval', 'Water Rescue/Drowning Incident', 'Evacuation Center Management', 'Bomb Threat',
    'Hostage Situation', 'Fire Incidents', 'Terrorism', 'Assault', 'Missing Persons', 'Bleeding',
    'Hemorrhage/Laceration/Abrasion', 'Trauma', 'Fall Victim', 'Fracture/Dislocation', 'Abdominal Pain',
    'Back Pain', 'Headache', 'Eye Problem', 'Breathing Problems/Difficulty of Breathing', 'Burns', 'Electrical Shock',
    'Allergic Reaction', 'Overdose', 'Flu-like Symptoms', 'Unconscious', 'Seizures', 'Pregnancy/Childbirth',
    'Wound Dressing/First Aid', 'Dead', 'Nausea and Vomiting', 'COVID Transport', 'Waiver', 'Fainting',
    'Suicide', 'CVA (Stroke)', 'Animal Bite', 'Stab Wound', 'Hypertensive Emergency', 'Psychosomatic Disorder',
    'Post Operative Case', 'Loss of Bowel Movement/Mild Dehydration', 'Chest Pain', 'Body Weakness', 'Attempted Suicide'
];

interface CreatePhoneIncidentModalProps {
    open: boolean;
    onClose: () => void;
    incidentTypes?: Array<{ id: number; name: string }>;
    chiefComplaints?: string[];
}

export type LocationMethod = 'code' | 'pinpoint';

const DEFAULT_MAP_CENTER = { latitude: 8.5222, longitude: 124.5715, zoom: 14 };
const DRAFT_STORAGE_KEY = 'mdrrmo_phone_incident_draft';

function loadDraft() {
    if (typeof window === 'undefined') return null;
    try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // ignore
    }
    return null;
}

export default function CreatePhoneIncidentModal({
    open,
    onClose,
    incidentTypes = [],
    chiefComplaints = DEFAULT_COMPLAINTS,
}: CreatePhoneIncidentModalProps) {
    // Load initial draft if any
    const initialDraft = useMemo(() => loadDraft(), []);

    // Form state
    const [phoneNumber, setPhoneNumber] = useState(initialDraft?.phoneNumber ?? '');
    const [incidentTypeId, setIncidentTypeId] = useState<string | number>(
        initialDraft?.incidentTypeId ?? (incidentTypes[0]?.id ?? '')
    );
    const [chiefComplaint, setChiefComplaint] = useState(initialDraft?.chiefComplaint ?? '');
    const [description, setDescription] = useState(initialDraft?.description ?? '');
    
    // Dual Location Method state
    const [locationMethod, setLocationMethod] = useState<LocationMethod>(initialDraft?.locationMethod ?? 'code');

    // Location Code state
    const [locationCode, setLocationCode] = useState(initialDraft?.locationCode ?? '');
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [locationResult, setLocationResult] = useState<any | null>(initialDraft?.locationResult ?? null);

    // Search & Pinpoint Map state
    const [pinLocation, setPinLocation] = useState<{
        latitude: number;
        longitude: number;
        placeName?: string;
    } | null>(initialDraft?.pinLocation ?? null);
    const [customPlaceName, setCustomPlaceName] = useState(initialDraft?.customPlaceName ?? '');
    const [placeSearchQuery, setPlaceSearchQuery] = useState(initialDraft?.placeSearchQuery ?? '');
    const [selectedBarangayFilter, setSelectedBarangayFilter] = useState<string>(initialDraft?.selectedBarangayFilter ?? '');
    const [isSearchingPlace, setIsSearchingPlace] = useState(false);
    const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
    const [placeSuggestionsOpen, setPlaceSuggestionsOpen] = useState(false);
    const [mapViewState, setMapViewState] = useState({
        latitude: initialDraft?.pinLocation?.latitude ?? DEFAULT_MAP_CENTER.latitude,
        longitude: initialDraft?.pinLocation?.longitude ?? DEFAULT_MAP_CENTER.longitude,
        zoom: initialDraft?.pinLocation ? 16 : DEFAULT_MAP_CENTER.zoom,
    });
    const placeSearchContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);

    // Location Verification & Confirmation
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationConfirmed, setLocationConfirmed] = useState<boolean>(initialDraft?.locationConfirmed ?? false);

    // Caller Recognition state
    const [callerData, setCallerData] = useState<CallerData | null>(null);
    const [lookingUpCaller, setLookingUpCaller] = useState(false);

    // Phone autocomplete suggestions state
    const [suggestions, setSuggestions] = useState<PhoneSuggestion[]>([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const phoneInputContainerRef = useRef<HTMLDivElement>(null);

    // Complaint Search Dropdown state
    const [complaintDropdownOpen, setComplaintDropdownOpen] = useState(false);
    const [complaintQuery, setComplaintQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Validation & Submission state
    const [submitting, setSubmitting] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const isResetting = useRef(false);

    // Ensure default incidentTypeId is populated if not yet selected
    useEffect(() => {
        if (!incidentTypeId && incidentTypes.length > 0) {
            setIncidentTypeId(incidentTypes[0].id);
        }
    }, [incidentTypes, incidentTypeId]);

    // Check if user has entered any draft data
    const hasDraftData = Boolean(
        phoneNumber ||
        chiefComplaint ||
        description ||
        locationCode ||
        locationResult ||
        pinLocation ||
        customPlaceName
    );

    // Auto-save form inputs to sessionStorage whenever changed
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isResetting.current) {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
            isResetting.current = false;
            return;
        }

        if (hasDraftData) {
            sessionStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify({
                    phoneNumber,
                    incidentTypeId,
                    chiefComplaint,
                    description,
                    locationMethod,
                    locationCode,
                    locationResult,
                    pinLocation,
                    customPlaceName,
                    placeSearchQuery,
                    selectedBarangayFilter,
                    locationConfirmed,
                })
            );
        } else {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
    }, [
        hasDraftData,
        phoneNumber,
        incidentTypeId,
        chiefComplaint,
        description,
        locationMethod,
        locationCode,
        locationResult,
        pinLocation,
        customPlaceName,
        placeSearchQuery,
        selectedBarangayFilter,
        locationConfirmed,
    ]);

    // Explicit reset form helper
    const handleResetForm = () => {
        isResetting.current = true;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
        setPhoneNumber('');
        setIncidentTypeId(incidentTypes[0]?.id ?? '');
        setChiefComplaint('');
        setDescription('');
        setLocationMethod('code');
        setLocationCode('');
        setLocationResult(null);
        setLocationError(null);
        setLocationConfirmed(false);
        setPinLocation(null);
        setCustomPlaceName('');
        setPlaceSearchQuery('');
        setSelectedBarangayFilter('');
        setPlaceSuggestions([]);
        setPlaceSuggestionsOpen(false);
        setMapViewState({
            latitude: DEFAULT_MAP_CENTER.latitude,
            longitude: DEFAULT_MAP_CENTER.longitude,
            zoom: DEFAULT_MAP_CENTER.zoom,
        });
        setCallerData(null);
        setLookingUpCaller(false);
        setSuggestions([]);
        setSuggestionsOpen(false);
        setLoadingSuggestions(false);
        setServerErrors({});
        setComplaintQuery('');
        setComplaintDropdownOpen(false);
    };

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setComplaintDropdownOpen(false);
            }
            if (phoneInputContainerRef.current && !phoneInputContainerRef.current.contains(event.target as Node)) {
                setSuggestionsOpen(false);
            }
            if (placeSearchContainerRef.current && !placeSearchContainerRef.current.contains(event.target as Node)) {
                setPlaceSuggestionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Philippine phone number validation helper
    const isValidPhilippinePhone = useMemo(() => {
        const cleaned = phoneNumber.replace(/[\s\-\(\)]+/g, '');
        return /^(\+639|09)\d{9}$/.test(cleaned);
    }, [phoneNumber]);

    // Format phone number for preview
    const formattedPhone = useMemo(() => {
        const cleaned = phoneNumber.replace(/[\s\-\(\)]+/g, '');
        if (/^09\d{9}$/.test(cleaned)) {
            return `+63 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
        }
        if (/^\+639\d{9}$/.test(cleaned)) {
            return `+63 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
        }
        return phoneNumber;
    }, [phoneNumber]);

    // Debounced caller recognition lookup
    useEffect(() => {
        if (!isValidPhilippinePhone) {
            setCallerData(null);
            setLookingUpCaller(false);
            return;
        }

        let active = true;
        setLookingUpCaller(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/dispatcher/callers/lookup?phone=${encodeURIComponent(phoneNumber)}`);
                if (!active) return;
                if (res.ok) {
                    const json = await res.json();
                    if (json.recognized && json.data) {
                        setCallerData(json.data);
                    } else {
                        setCallerData(null);
                    }
                } else {
                    setCallerData(null);
                }
            } catch {
                if (active) setCallerData(null);
            } finally {
                if (active) setLookingUpCaller(false);
            }
        }, 350);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [phoneNumber, isValidPhilippinePhone]);

    // Debounced search for phone number autocomplete suggestions
    useEffect(() => {
        const query = phoneNumber.trim();
        if (query.length < 2) {
            setSuggestions([]);
            setSuggestionsOpen(false);
            return;
        }

        let active = true;
        setLoadingSuggestions(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/dispatcher/callers/search?q=${encodeURIComponent(query)}`);
                if (!active) return;
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json.data) && json.data.length > 0) {
                        setSuggestions(json.data);
                        setSuggestionsOpen(true);
                    } else {
                        setSuggestions([]);
                        setSuggestionsOpen(false);
                    }
                } else {
                    setSuggestions([]);
                    setSuggestionsOpen(false);
                }
            } catch {
                if (active) {
                    setSuggestions([]);
                    setSuggestionsOpen(false);
                }
            } finally {
                if (active) setLoadingSuggestions(false);
            }
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [phoneNumber]);

    const handleSelectSuggestion = (suggestion: PhoneSuggestion) => {
        setPhoneNumber(suggestion.phone_number);
        setSuggestionsOpen(false);
        setSuggestions([]);
    };

    // 1-Click apply previous location
    const handleApplyPreviousLocation = (prevLoc: NonNullable<CallerData['previous_location']>) => {
        setLocationMethod('code');
        setLocationCode(prevLoc.code);
        setLocationResult({
            code: prevLoc.code,
            marker_name: prevLoc.marker_name,
            barangay: prevLoc.barangay,
            description: prevLoc.description,
            latitude: prevLoc.latitude,
            longitude: prevLoc.longitude,
        });
        setLocationConfirmed(true);
        setLocationError(null);
    };

    // Filter complaints
    const filteredComplaints = useMemo(() => {
        const q = complaintQuery.toLowerCase().trim();
        if (!q) return chiefComplaints;
        return chiefComplaints.filter(c => c.toLowerCase().includes(q));
    }, [chiefComplaints, complaintQuery]);

    // Switch between Location Code and Search & Pinpoint
    const handleSwitchMethod = (method: LocationMethod) => {
        if (method === locationMethod) return;
        setLocationMethod(method);
        setLocationError(null);
        if (method === 'code') {
            setLocationConfirmed(Boolean(locationResult && locationConfirmed));
        } else {
            setLocationConfirmed(Boolean(pinLocation && locationConfirmed));
        }
    };

    // Search Location Code
    const handleSearchLocationCode = async () => {
        const code = locationCode.trim().toUpperCase();
        if (!code) {
            setLocationError('Please enter a location code to search.');
            return;
        }

        setSearchingLocation(true);
        setLocationError(null);
        setLocationResult(null);
        setLocationConfirmed(false);

        try {
            const res = await fetch(`/dispatcher/location-markers/lookup?code=${encodeURIComponent(code)}`);
            const data = await res.json();

            if (!res.ok) {
                setLocationError(data.message || 'Location code not found. Please verify the code with the caller.');
            } else {
                setLocationResult(data.data);
                setLocationError(null);
            }
        } catch {
            setLocationError('Unable to connect to location service. Please try again.');
        } finally {
            setSearchingLocation(false);
        }
    };

    // Reverse geocode lat/lng to get address or place name
    const reverseGeocode = async (lng: number, lat: number) => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!token) return '';
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=PH&types=address,poi,neighborhood,locality`
            );
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.features) && data.features.length > 0) {
                    return data.features[0].place_name || data.features[0].text || '';
                }
            }
        } catch {
            // ignore
        }
        return '';
    };

    // Location-aware Search (Opol Barangays & Landmarks + Mapbox Geocoding)
    useEffect(() => {
        const q = placeSearchQuery.trim();
        if (!q && !selectedBarangayFilter) {
            setPlaceSuggestions([]);
            setPlaceSuggestionsOpen(false);
            return;
        }

        let active = true;
        setIsSearchingPlace(true);

        const timer = setTimeout(async () => {
            try {
                // 1. First run the location-aware Opol barangay & landmark search engine
                const searchRes: any = searchOpolLandmarks(
                    q,
                    selectedBarangayFilter || null
                );
                const localMatches = Array.isArray(searchRes) 
                    ? searchRes 
                    : (searchRes?.landmarks || []);
                const detectedBarangay = Array.isArray(searchRes) 
                    ? null 
                    : (searchRes?.detectedBarangay || null);

                const formattedLocal = localMatches.map((lm: any) => ({
                    id: `opol-lm-${lm.id}`,
                    text: lm.name,
                    place_name: `${lm.name} — ${lm.barangay}, Opol`,
                    full_address: lm.address,
                    center: [lm.longitude, lm.latitude] as [number, number],
                    category: lm.category,
                    barangay: lm.barangay,
                    isLandmark: true,
                }));

                // 2. Also run Mapbox geocoding biased to Opol, Misamis Oriental
                let mapboxMatches: any[] = [];
                const token = import.meta.env.VITE_MAPBOX_TOKEN;
                if (token && q.length >= 2) {
                    try {
                        const targetContext = detectedBarangay
                            ? `${q}, ${detectedBarangay}, Opol, Misamis Oriental`
                            : `${q}, Opol, Misamis Oriental`;

                        const res = await fetch(
                            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(targetContext)}.json?access_token=${token}&country=PH&proximity=124.5710,8.5222&autocomplete=true&limit=4`
                        );
                        if (res.ok) {
                            const data = await res.json();
                            if (Array.isArray(data.features)) {
                                mapboxMatches = data.features.map((f: any) => ({
                                    id: f.id,
                                    text: f.text || f.place_name,
                                    place_name: f.place_name,
                                    full_address: f.place_name,
                                    center: f.center as [number, number],
                                    category: 'Street / Address',
                                    barangay: detectedBarangay || 'Opol',
                                    isLandmark: false,
                                }));
                            }
                        }
                    } catch {
                        // ignore network error
                    }
                }

                if (!active) return;

                // Priority: Local barangay landmarks first, then street/address matches
                const combined = [...formattedLocal, ...mapboxMatches];
                if (combined.length > 0) {
                    setPlaceSuggestions(combined);
                    setPlaceSuggestionsOpen(true);
                } else {
                    setPlaceSuggestions([]);
                    setPlaceSuggestionsOpen(false);
                }
            } catch (err) {
                console.error('Error during landmark search:', err);
                if (active) {
                    setPlaceSuggestions([]);
                    setPlaceSuggestionsOpen(false);
                }
            } finally {
                if (active) setIsSearchingPlace(false);
            }
        }, 150);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [placeSearchQuery, selectedBarangayFilter]);

    // Handle place selection from search dropdown
    const handleSelectPlace = (place: any) => {
        const [lng, lat] = place.center;
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));
        const displayName = place.full_address || place.place_name || place.text || '';

        setPinLocation({
            latitude: roundedLat,
            longitude: roundedLng,
            placeName: displayName,
        });
        setCustomPlaceName(displayName);
        setPlaceSearchQuery(displayName);
        setPlaceSuggestionsOpen(false);
        setLocationError(null);
        setLocationConfirmed(false); // keep pending confirmation as requested

        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [roundedLng, roundedLat],
                zoom: 16,
                duration: 1000,
            });
        }
    };

    // Click map to drop/move pin
    const handleMapClick = async (e: any) => {
        const lat = parseFloat(e.lngLat.lat.toFixed(6));
        const lng = parseFloat(e.lngLat.lng.toFixed(6));

        setPinLocation(prev => ({
            latitude: lat,
            longitude: lng,
            placeName: prev?.placeName || customPlaceName,
        }));
        setLocationError(null);
        setLocationConfirmed(false); // stays pending confirmation until confirmed

        const resolved = await reverseGeocode(lng, lat);
        if (resolved) {
            setCustomPlaceName(resolved);
            setPinLocation({
                latitude: lat,
                longitude: lng,
                placeName: resolved,
            });
        }
    };

    // Drag pin to fine-tune coordinates
    const handleMarkerDragEnd = async (e: any) => {
        const lat = parseFloat(e.lngLat.lat.toFixed(6));
        const lng = parseFloat(e.lngLat.lng.toFixed(6));

        setPinLocation(prev => ({
            latitude: lat,
            longitude: lng,
            placeName: prev?.placeName || customPlaceName,
        }));
        setLocationError(null);
        setLocationConfirmed(false); // stays pending confirmation until confirmed

        const resolved = await reverseGeocode(lng, lat);
        if (resolved) {
            setCustomPlaceName(resolved);
            setPinLocation({
                latitude: lat,
                longitude: lng,
                placeName: resolved,
            });
        }
    };

    // Recenter map
    const handleRecenter = () => {
        const targetLat = pinLocation?.latitude ?? DEFAULT_MAP_CENTER.latitude;
        const targetLng = pinLocation?.longitude ?? DEFAULT_MAP_CENTER.longitude;
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [targetLng, targetLat],
                zoom: 14,
                duration: 800,
            });
        }
    };

    // Form validity
    const isLocationValid = useMemo(() => {
        if (!locationConfirmed) return false;
        if (locationMethod === 'code') {
            return Boolean(locationResult);
        }
        if (locationMethod === 'pinpoint') {
            return Boolean(pinLocation && !isNaN(pinLocation.latitude) && !isNaN(pinLocation.longitude));
        }
        return false;
    }, [locationMethod, locationConfirmed, locationResult, pinLocation]);

    const isFormValid = useMemo(() => {
        return (
            isValidPhilippinePhone &&
            Boolean(incidentTypeId) &&
            isLocationValid &&
            !submitting
        );
    }, [isValidPhilippinePhone, incidentTypeId, isLocationValid, submitting]);

    // Handle Submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidPhilippinePhone) {
            setServerErrors({ caller_phone_number: 'Please enter a valid Philippine mobile number.' });
            return;
        }

        if (!locationConfirmed) {
            setLocationError('Please confirm the incident location before creating the incident.');
            return;
        }

        if (locationMethod === 'code' && !locationResult) {
            setLocationError('Please search and confirm a valid location code.');
            return;
        }

        if (locationMethod === 'pinpoint' && !pinLocation) {
            setLocationError('Please pinpoint an incident location on the map and confirm.');
            return;
        }

        setSubmitting(true);
        setServerErrors({});

        const payload: Record<string, any> = {
            caller_phone_number: phoneNumber,
            incident_type_id: incidentTypeId,
            chief_complaint: chiefComplaint || null,
            location_method: locationMethod,
            location_confirmed: locationConfirmed,
            description: description || null,
        };

        if (locationMethod === 'code') {
            payload.location_code = locationResult.code;
        } else {
            payload.latitude = pinLocation!.latitude;
            payload.longitude = pinLocation!.longitude;
            payload.place_of_incident = customPlaceName.trim() || `Pinpointed Location (${pinLocation!.latitude}, ${pinLocation!.longitude})`;
        }

        router.post(
            '/dispatcher/incidents/phone-call',
            payload,
            {
                onSuccess: () => {
                    setSubmitting(false);
                    isResetting.current = true;
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                    }
                    handleResetForm();
                    onClose();
                },
                onError: (errors) => {
                    setSubmitting(false);
                    setServerErrors(errors);
                },
            }
        );
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div>
                        {hasDraftData && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResetForm}
                                disabled={submitting}
                                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            >
                                Clear Form
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Close
                        </Button>
                        <Button
                            form="create-phone-incident-form"
                            type="submit"
                            variant="primary"
                            loading={submitting}
                            disabled={!isFormValid}
                            className="min-w-[150px]"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Create Incident
                        </Button>
                    </div>
                </div>
            }
        >
            <form id="create-phone-incident-form" onSubmit={handleSubmit} className="space-y-4 pr-1">
                {/* Header Banner */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 shrink-0">
                        <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Record Phone / SIM Emergency Call
                                <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                    Direct Dispatch
                                </span>
                            </h2>
                            {hasDraftData && (
                                <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Draft Saved
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Create an emergency incident for a resident calling via telephone or normal SIM card without the app.
                        </p>
                    </div>
                </div>

                {/* SECTION 1: Caller Information */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        Caller Phone Number <span className="text-rose-500">*</span>
                    </label>

                    <div className="relative" ref={phoneInputContainerRef}>
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">🇵🇭 +63</span>
                        </div>
                        <input
                            type="tel"
                            placeholder="9XX XXX XXXX (or 09XXXXXXXXX)"
                            value={phoneNumber}
                            onFocus={() => {
                                if (suggestions.length > 0) {
                                    setSuggestionsOpen(true);
                                }
                            }}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className={`w-full pl-16 pr-10 py-2 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                phoneNumber && !isValidPhilippinePhone 
                                    ? 'border-rose-500 focus:ring-rose-500/30' 
                                    : isValidPhilippinePhone 
                                        ? 'border-emerald-500/50 focus:ring-emerald-500/30' 
                                        : 'border-slate-300 dark:border-white/10 focus:ring-primary/50'
                            }`}
                        />
                        {loadingSuggestions && (
                            <div className="absolute inset-y-0 right-8 pr-1 flex items-center pointer-events-none text-slate-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            </div>
                        )}
                        {isValidPhilippinePhone && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500">
                                <Check className="w-4 h-4" />
                            </div>
                        )}

                        {/* Autocomplete Suggestions Dropdown */}
                        {suggestionsOpen && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                        <Search className="w-3 h-3 text-primary" /> Matching Phone Numbers
                                    </span>
                                    <span className="text-[10px]">{suggestions.length} match{suggestions.length === 1 ? '' : 'es'}</span>
                                </div>
                                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 scrollbar-thin">
                                    {suggestions.map((item, index) => (
                                        <button
                                            key={`${item.phone_number}-${index}`}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(item)}
                                            className="w-full text-left p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    item.is_registered_resident 
                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                                                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                                }`}>
                                                    {item.is_registered_resident ? (
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <PhoneCall className="w-3.5 h-3.5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                                            {item.phone_number}
                                                        </span>
                                                        {item.is_registered_resident ? (
                                                            <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                                                                Resident
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded">
                                                                Repeat Caller
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                                        {item.caller_name && (
                                                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                                                {item.caller_name}
                                                            </span>
                                                        )}
                                                        {item.barangay && (
                                                            <span className="text-slate-400 dark:text-slate-500">
                                                                • Brgy. {item.barangay}
                                                            </span>
                                                        )}
                                                        {item.previous_location_code && (
                                                            <span className="text-primary font-mono text-[10px]">
                                                                • Prev: {item.previous_location_code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                Select ↵
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 flex items-center justify-between">
                                    <span>Click to auto-fill phone number</span>
                                    <button
                                        type="button"
                                        onClick={() => setSuggestionsOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {phoneNumber && !isValidPhilippinePhone && (
                        <p className="text-xs text-rose-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            ⚠️ Please enter a valid Philippine mobile number (e.g. 09171234567 or +639171234567).
                        </p>
                    )}
                    {serverErrors.caller_phone_number && (
                        <p className="text-xs text-rose-500">{serverErrors.caller_phone_number}</p>
                    )}
                    {isValidPhilippinePhone && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            ✓ Formatted: <span className="font-mono font-medium">{formattedPhone}</span>
                        </p>
                    )}

                    {/* Caller Recognition / History Status */}
                    {lookingUpCaller && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Checking caller records & past incident history...</span>
                        </div>
                    )}

                    {callerData && !lookingUpCaller && (
                        <div className="rounded-xl border border-sky-200 dark:border-sky-500/25 bg-gradient-to-br from-sky-50/70 via-indigo-50/40 to-slate-50 dark:from-sky-950/20 dark:via-indigo-950/20 dark:to-slate-900/60 p-3 space-y-2.5 shadow-sm">
                            {/* Caller Identity Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        callerData.is_registered_resident 
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                            : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                    }`}>
                                        {callerData.is_registered_resident ? (
                                            <UserCheck className="w-4 h-4" />
                                        ) : (
                                            <History className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                {callerData.caller_name || 'Recognized Repeat Caller'}
                                            </span>
                                            {callerData.is_registered_resident && (
                                                <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Registered Resident
                                                </span>
                                            )}
                                            {callerData.total_calls > 0 && (
                                                <span className="text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                                                    {callerData.total_calls} prior {callerData.total_calls === 1 ? 'call' : 'calls'}
                                                </span>
                                            )}
                                        </div>
                                        {callerData.resident_address && (
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span>Registered Address: <strong className="font-medium">{callerData.resident_address}</strong></span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Previous Location Suggestion Box */}
                            {callerData.previous_location && (
                                <div className="pt-2 border-t border-sky-200/60 dark:border-white/10 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-sky-100 dark:border-white/5">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                                                    Previous Incident Location:
                                                </span>
                                                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                                    {callerData.previous_location.code}
                                                </span>
                                                {callerData.previous_location.last_reported_at && (
                                                    <span className="text-[10px] text-slate-400">
                                                        ({callerData.previous_location.last_reported_at})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                {callerData.previous_location.marker_name}, Barangay {callerData.previous_location.barangay}
                                                {callerData.previous_location.description && ` — ${callerData.previous_location.description}`}
                                            </p>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            {locationResult?.code === callerData.previous_location.code && locationConfirmed ? (
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Location Selected
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyPreviousLocation(callerData.previous_location!)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                                    Use Previous Location ({callerData.previous_location.code})
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Clarification note for other barangays */}
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 bg-slate-100/70 dark:bg-white/5 p-2 rounded-lg">
                                        <span className="shrink-0 text-amber-500 font-bold">💡</span>
                                        <span>
                                            <strong>Calling from another barangay?</strong> Ask the caller for the nearest streetlight / location code at their current location and enter it in Section 3 below.
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SECTION 2: Incident Classification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Incident Type */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 block">
                            Incident Type <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={incidentTypeId}
                                onChange={(e) => setIncidentTypeId(e.target.value)}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                            >
                                <option value="" disabled>Select Incident Type</option>
                                {incidentTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {serverErrors.incident_type_id && (
                            <p className="text-xs text-rose-500 mt-1">{serverErrors.incident_type_id}</p>
                        )}
                    </div>

                    {/* Chief Complaint Searchable Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 block">
                            Chief Complaint
                        </label>
                        <div 
                            onClick={() => setComplaintDropdownOpen(!complaintDropdownOpen)}
                            className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white flex items-center justify-between cursor-pointer hover:border-slate-400 dark:hover:border-white/20 transition-colors"
                        >
                            <span className={chiefComplaint ? 'text-slate-900 dark:text-white font-medium truncate' : 'text-slate-400'}>
                                {chiefComplaint || 'Search Chief Complaint...'}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                                {chiefComplaint && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setChiefComplaint('');
                                        }}
                                        className="hover:text-rose-500"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Searchable Dropdown Panel */}
                        {complaintDropdownOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <div className="p-2 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Type to filter complaints..."
                                            value={complaintQuery}
                                            onChange={(e) => setComplaintQuery(e.target.value)}
                                            autoFocus
                                            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-white/5 scrollbar-thin">
                                    {filteredComplaints.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-slate-400">
                                            No matching complaints found.
                                        </div>
                                    ) : (
                                        filteredComplaints.map((c, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    setChiefComplaint(c);
                                                    setComplaintDropdownOpen(false);
                                                    setComplaintQuery('');
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                                                    chiefComplaint === c
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                <span>{c}</span>
                                                {chiefComplaint === c && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 block">
                        Description / Caller Notes
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Enter caller statements, landmarks, patient condition..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* SECTION 3: Incident Location */}
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-primary" />
                                Incident Location <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Select input method: Location Code or Search & Pinpoint
                            </span>
                        </div>

                        {/* Location Method Selector Tabs */}
                        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 text-xs self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => handleSwitchMethod('code')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                                    locationMethod === 'code'
                                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Compass className="w-3.5 h-3.5" />
                                Location Code
                                {locationMethod === 'code' && locationResult && locationConfirmed && (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchMethod('pinpoint')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                                    locationMethod === 'pinpoint'
                                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <LocateFixed className="w-3.5 h-3.5" />
                                Search & Pinpoint
                                {locationMethod === 'pinpoint' && pinLocation && locationConfirmed && (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* METHOD 1: Location Code — STRICTLY PREDEFINED CODES ONLY, NO LANDMARKS */}
                    {locationMethod === 'code' && (
                        <div className="space-y-2.5 animate-in fade-in duration-150">
                            {/* Operator Script Helper */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                                <HelpCircle className="w-4 h-4 shrink-0 text-amber-500" />
                                <div className="flex-1">
                                    <span className="font-semibold mr-1">Ask caller:</span>
                                    <span className="italic text-amber-700 dark:text-amber-200/90">
                                        "Please look for the nearest MDRRMO location marker or streetlight and tell me the code written on it."
                                    </span>
                                </div>
                            </div>

                            {/* Location Code Input with Search Button */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Enter Location Code (e.g. SL-001, POST-101)..."
                                        value={locationCode}
                                        onChange={(e) => {
                                            setLocationCode(e.target.value);
                                            setLocationResult(null);
                                            setLocationConfirmed(false);
                                            setLocationError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearchLocationCode();
                                            }
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm font-mono uppercase text-slate-900 dark:text-white placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleSearchLocationCode}
                                    loading={searchingLocation}
                                    className="px-4 shrink-0"
                                >
                                    <Search className="w-4 h-4" />
                                    Find Location
                                </Button>
                            </div>

                            {/* Method 1 Help note */}
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                Note: Location Code is for official registered codes only. To search by landmark, school, chapel, or place name, switch to the <strong>Search & Pinpoint</strong> tab above.
                            </p>

                            {/* Location Found Card */}
                            {locationResult && (
                                <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
                                    locationConfirmed 
                                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                                        : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-white/15'
                                }`}>
                                    <div className="flex items-start justify-between mb-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-rose-500" />
                                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                                Location Found: <span className="font-mono text-primary">{locationResult.code}</span>
                                            </span>
                                        </div>
                                        {locationConfirmed ? (
                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                ✓ Confirmed
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                Pending Verbal Confirmation
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs py-1">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">📍 Barangay: </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{locationResult.barangay}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">📍 Marker: </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{locationResult.marker_name}</span>
                                        </div>
                                        <div className="font-mono text-[11px]">
                                            <span className="text-slate-500 dark:text-slate-400 font-sans text-xs">📍 Coordinates: </span>
                                            <span className="text-slate-700 dark:text-slate-300">{locationResult.latitude}, {locationResult.longitude}</span>
                                        </div>
                                        {locationResult.description && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">📍 Description: </span>
                                                <span className="text-slate-700 dark:text-slate-300">{locationResult.description}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirmation Action */}
                                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                            {locationConfirmed 
                                                ? "This location will be saved as the official Place of Incident." 
                                                : "Confirm verbally with caller before proceeding."}
                                        </span>
                                        {!locationConfirmed ? (
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setLocationConfirmed(true)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white border-none"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                                Confirm Location
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setLocationConfirmed(false)}
                                                className="text-slate-400 hover:text-slate-200 text-xs"
                                            >
                                                Change / Unconfirm
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* METHOD 2: Search & Pinpoint Location — ALL LANDMARKS, BARANGAYS & ADDRESSES */}
                    {locationMethod === 'pinpoint' && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                            {/* Search Bar matching Screenshot 1 */}
                            <div className="relative" ref={placeSearchContainerRef}>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {/* Barangay Context Filter */}
                                    <div className="sm:w-44 shrink-0">
                                        <select
                                            value={selectedBarangayFilter}
                                            onChange={(e) => {
                                                const b = e.target.value;
                                                setSelectedBarangayFilter(b);
                                                if (b) {
                                                    setPlaceSearchQuery(b);
                                                }
                                            }}
                                            className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 cursor-pointer"
                                        >
                                            <option value="">All 14 Barangays</option>
                                            {OPOL_BARANGAYS.map((b) => (
                                                <option key={b} value={b}>
                                                    Brgy. {b}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Place / Landmark Search Input matching Screenshot 1 */}
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search barangay, landmark, street, address (e.g. Luyongbonbon, Apple Tree, Church)..."
                                            value={placeSearchQuery}
                                            onChange={(e) => {
                                                setPlaceSearchQuery(e.target.value);
                                                setPlaceSuggestionsOpen(true);
                                            }}
                                            onFocus={() => {
                                                setPlaceSuggestionsOpen(true);
                                            }}
                                            onClick={() => {
                                                if (placeSuggestions.length > 0) setPlaceSuggestionsOpen(true);
                                            }}
                                            className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                        />
                                        {isSearchingPlace && (
                                            <Loader2 className="w-4 h-4 animate-spin text-rose-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                        )}
                                        {placeSearchQuery && !isSearchingPlace && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPlaceSearchQuery('');
                                                    setPlaceSuggestions([]);
                                                    setPlaceSuggestionsOpen(false);
                                                }}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Location-Aware Results Dropdown */}
                                {placeSuggestionsOpen && placeSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                        <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                                            <span>
                                                {selectedBarangayFilter 
                                                    ? `Landmarks & Locations in Brgy. ${selectedBarangayFilter}` 
                                                    : 'Matching Landmarks & Places in Opol'}
                                            </span>
                                            <span className="text-[10px] lowercase text-slate-500 font-normal">
                                                {placeSuggestions.length} found
                                            </span>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 scrollbar-thin">
                                            {placeSuggestions.map((place) => (
                                                <button
                                                    key={place.id}
                                                    type="button"
                                                    onClick={() => handleSelectPlace(place)}
                                                    className="w-full text-left p-3 hover:bg-slate-800/80 transition-colors flex items-start gap-3 cursor-pointer group"
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors truncate">
                                                                {place.text}
                                                            </span>
                                                            {place.barangay && (
                                                                <span className="text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded">
                                                                    Brgy. {place.barangay}
                                                                </span>
                                                            )}
                                                            {place.category && (
                                                                <span className="text-[9px] text-slate-400 font-medium">
                                                                    • {place.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                                            {place.place_name}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center">
                                                        Select ↵
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Map Container — Approximately 500px on desktop, responsive */}
                            <div className="w-full h-[380px] sm:h-[450px] lg:h-[500px] overflow-hidden bg-slate-950 rounded-2xl relative border border-slate-700/60 shadow-lg">
                                <style>{`
                                    .mapboxgl-ctrl-logo { display: none !important; }
                                    .mapboxgl-ctrl-attrib { display: none !important; }
                                `}</style>
                                {import.meta.env.VITE_MAPBOX_TOKEN ? (
                                    <Map
                                        ref={mapRef}
                                        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                        {...mapViewState}
                                        onMove={(evt) => setMapViewState(evt.viewState)}
                                        onClick={handleMapClick}
                                        mapStyle="mapbox://styles/mapbox/dark-v11"
                                        attributionControl={false}
                                        cursor="crosshair"
                                    >
                                        {pinLocation && (
                                            <Marker
                                                longitude={pinLocation.longitude}
                                                latitude={pinLocation.latitude}
                                                anchor="bottom"
                                                draggable
                                                onDragEnd={handleMarkerDragEnd}
                                            >
                                                <div className="flex flex-col items-center cursor-grab active:cursor-grabbing group">
                                                    <div className="bg-slate-900/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xl border border-rose-500/40 mb-1 flex items-center gap-1 backdrop-blur-sm whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                                        Drag to fine-tune pin
                                                    </div>
                                                    <div className="relative">
                                                        <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-600/50 ring-4 ring-rose-500/30">
                                                            <MapPin className="w-5 h-5 fill-white text-rose-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Marker>
                                        )}
                                    </Map>
                                ) : (
                                    <div className="h-full flex items-center justify-center p-4 text-center text-xs text-slate-400">
                                        Mapbox access token is not configured in .env (VITE_MAPBOX_TOKEN).
                                    </div>
                                )}

                                {/* Top Floating Hint */}
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <div className="inline-flex items-center gap-1.5 bg-slate-900/90 text-white border border-white/10 text-[11px] px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-md">
                                        <LocateFixed className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Click anywhere on map or drag pin to fine-tune</span>
                                    </div>
                                </div>

                                {/* Floating Recenter Button */}
                                <button
                                    type="button"
                                    onClick={handleRecenter}
                                    title="Recenter Map"
                                    className="absolute top-3 right-3 p-2 bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 rounded-xl shadow-md transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>

                            {/* SELECTED PIN COORDINATES Card matching Screenshot 2 */}
                            {pinLocation ? (
                                <div className="p-4 rounded-2xl bg-[#0f172a]/90 border border-slate-700/70 shadow-lg space-y-3">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full border-2 border-rose-500 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                                                SELECTED PIN COORDINATES
                                            </span>
                                        </div>
                                        {locationConfirmed ? (
                                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                ✓ Location Confirmed
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-medium text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 rounded-full">
                                                Pending Confirmation
                                            </span>
                                        )}
                                    </div>

                                    {/* Exact Coordinates */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-400 font-medium flex items-center gap-1">📍 Exact Coordinates:</span>
                                        <span className="font-mono font-bold text-xs bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-100 tracking-wide">
                                            {pinLocation.latitude.toFixed(6)}, {pinLocation.longitude.toFixed(6)}
                                        </span>
                                    </div>

                                    {/* Landmark / Place / Address Description input */}
                                    <div>
                                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                                            Landmark / Place / Address Description:
                                        </label>
                                        <input
                                            type="text"
                                            value={customPlaceName}
                                            onChange={(e) => {
                                                setCustomPlaceName(e.target.value);
                                                setLocationConfirmed(false);
                                            }}
                                            placeholder="Landmark, place, or street address description..."
                                            className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                        />
                                    </div>

                                    {/* Footer row with italic note and Confirm button */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                                        <span className="text-xs text-slate-400 italic">
                                            Adjust pin on map if needed, then click confirm.
                                        </span>

                                        {!locationConfirmed ? (
                                            <button
                                                type="button"
                                                onClick={() => setLocationConfirmed(true)}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 hover:from-rose-500 hover:to-orange-400 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                                            >
                                                <Check className="w-4 h-4 stroke-[3]" />
                                                Confirm Location
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setLocationConfirmed(false)}
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                                Change / Unconfirm
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-700 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                    <LocateFixed className="w-4 h-4 text-slate-500 animate-pulse" />
                                    <span>No location selected. Search a barangay or landmark above, or click directly on the map.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Common Location Error Banner */}
                    {locationError && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>⚠️ {locationError}</span>
                        </div>
                    )}
                    {serverErrors.location_pinpoint && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>⚠️ {serverErrors.location_pinpoint}</span>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
}
