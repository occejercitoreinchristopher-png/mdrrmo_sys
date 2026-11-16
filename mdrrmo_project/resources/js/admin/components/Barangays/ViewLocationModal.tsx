import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, X, Navigation } from 'lucide-react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import { useAppearance } from '@/shared/contexts/ThemeContext';

interface ViewLocationModalProps {
    open: boolean;
    onClose: () => void;
    locationCode: any | null;
}

export default function ViewLocationModal({
    open,
    onClose,
    locationCode,
}: ViewLocationModalProps) {
    const { theme } = useAppearance();

    if (!locationCode) return null;

    const lat = Number(locationCode.latitude);
    const lng = Number(locationCode.longitude);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Location Code: ${locationCode.location_code}`}
            size="lg"
        >
            <div className="space-y-4">
                {/* Details summary */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                        <span className="text-slate-500 dark:text-slate-400">Barangay:</span>
                        <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {locationCode.barangay_name}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-500 dark:text-slate-400">Location Type:</span>
                        <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {locationCode.location_type}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <span className="text-slate-500 dark:text-slate-400">Location Name:</span>
                        <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                            {locationCode.location_name}
                        </div>
                    </div>
                    {locationCode.description && (
                        <div className="col-span-2">
                            <span className="text-slate-500 dark:text-slate-400">Description:</span>
                            <div className="text-slate-700 dark:text-slate-300 mt-0.5 italic">
                                {locationCode.description}
                            </div>
                        </div>
                    )}
                    <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400">GPS Coordinates:</span>
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {lat.toFixed(7)}, {lng.toFixed(7)}
                        </span>
                    </div>
                </div>

                {/* Map preview */}
                <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-inner bg-slate-950">
                    <style>{`
                        .mapboxgl-ctrl-logo { display: none !important; }
                        .mapboxgl-ctrl-attrib { display: none !important; }
                    `}</style>
                    {import.meta.env.VITE_MAPBOX_TOKEN ? (
                        <Map
                            initialViewState={{
                                latitude: lat,
                                longitude: lng,
                                zoom: 16,
                            }}
                            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                            mapStyle={theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'}
                            attributionControl={false}
                        >
                            <Marker longitude={lng} latitude={lat} anchor="bottom">
                                <div className="flex flex-col items-center pointer-events-none">
                                    <div className="bg-slate-900/95 text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md shadow-lg border border-slate-700/80 mb-1 backdrop-blur-sm whitespace-nowrap tracking-wide">
                                        {locationCode.location_code}
                                    </div>
                                    <div className="relative flex flex-col items-center">
                                        <MapPin className="w-9 h-9 fill-[#F61509] text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
                                        <div className="w-3.5 h-1 bg-black/40 rounded-[50%] blur-[1px] -mt-1" />
                                    </div>
                                </div>
                            </Marker>
                        </Map>
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                            Map token not configured.
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
