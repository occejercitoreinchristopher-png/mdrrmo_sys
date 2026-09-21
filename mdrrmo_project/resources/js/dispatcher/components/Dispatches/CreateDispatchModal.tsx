import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/shared/components/Modal';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { 
    Truck, 
    Users, 
    AlertCircle, 
    Send, 
    CheckCircle2, 
    User, 
    Shield, 
    AlertTriangle, 
    Check, 
    CheckSquare, 
    Square, 
    UserCheck,
    Stethoscope
} from 'lucide-react';
import { clsx } from 'clsx';

export default function CreateDispatchModal({ 
    open, 
    onClose, 
    incident, 
    ambulances = [], 
    responders = [] 
}: { 
    open: boolean; 
    onClose: () => void; 
    incident: any; 
    ambulances?: any[]; 
    responders?: any[]; 
}) {
    const [ambulanceId, setAmbulanceId] = useState('');
    const [team, setTeam] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [selectedEmtIds, setSelectedEmtIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Extract unique permanent teams from responders
    const availableTeams = useMemo(() => {
        const teamSet = new Set<string>();
        responders.forEach(r => {
            const profile = r.responder_profile || r.responderProfile;
            if (profile?.team && !profile?.is_reliever) {
                teamSet.add(profile.team);
            }
        });
        const teams = Array.from(teamSet);
        if (teams.length === 0) {
            return [{ value: 'Alpha', label: 'Team Alpha' }];
        }
        return teams.map(t => ({ value: t, label: `Team ${t}` }));
    }, [responders]);

    const filteredAmbulances = useMemo(() => {
        return ambulances.filter(a => a.plate_number !== 'WALK-IN' && a.vehicle_type !== 'Station');
    }, [ambulances]);

    const ambulanceOptions = useMemo(() => {
        return filteredAmbulances.map(a => {
            const isAvailable = a.status === 'available';
            const parts = [a.ambulance_code, a.vehicle_name].filter(Boolean).join(' - ');
            const title = parts ? `${parts} (${a.plate_number})` : (a.plate_number || `Unit #${a.id}`);
            return {
                value: a.id,
                label: `${title} ${isAvailable ? '' : `[${a.status.toUpperCase()}]`}`,
                disabled: !isAvailable
            };
        });
    }, [filteredAmbulances]);

    // Live refresh data on modal open
    useEffect(() => {
        if (open) {
            setErrorMessage(null);
            router.reload({ only: ['ambulances', 'responders'] });
        }
    }, [open]);

    // Auto-select first available ambulance and team
    useEffect(() => {
        if (open) {
            const firstAvail = filteredAmbulances.find(a => a.status === 'available');
            if (firstAvail && !ambulanceId) {
                setAmbulanceId(String(firstAvail.id));
            }
            if (availableTeams.length > 0 && !team) {
                setTeam(availableTeams[0].value);
            }
        }
    }, [open, filteredAmbulances, availableTeams]);

    // Auto-select all available members of the selected team whenever team changes
    useEffect(() => {
        if (!team) {
            setSelectedDriverId('');
            setSelectedEmtIds([]);
            return;
        }

        const teamMembers = responders.filter(r => {
            const profile = r.responder_profile || r.responderProfile;
            return !profile?.is_reliever && profile?.team === team;
        });

        // Auto-check available driver for this team
        const availableDriver = teamMembers.find(m => {
            const profile = m.responder_profile || m.responderProfile;
            const isDriver = profile?.position === 'driver';
            const rawAvail = m.current_status || profile?.availability || 'offline';
            return isDriver && rawAvail === 'available';
        });

        // Auto-check all available EMTs for this team
        const availableEmts = teamMembers.filter(m => {
            const profile = m.responder_profile || m.responderProfile;
            const isEmt = profile?.position !== 'driver';
            const rawAvail = m.current_status || profile?.availability || 'offline';
            return isEmt && rawAvail === 'available';
        });

        setSelectedDriverId(availableDriver ? String(availableDriver.id) : '');
        setSelectedEmtIds(availableEmts.map(m => String(m.id)));
    }, [team, responders]);

    if (!incident) return null;

    // Filter permanent members of the selected team (1 Driver, 3 EMTs)
    const permanentMembers = useMemo(() => {
        if (!team) return [];
        return responders.filter(r => {
            const profile = r.responder_profile || r.responderProfile;
            return !profile?.is_reliever && profile?.team === team;
        }).sort((a, b) => {
            const posA = a.responder_profile?.position || a.responderProfile?.position;
            const posB = b.responder_profile?.position || b.responderProfile?.position;
            if (posA === 'driver' && posB !== 'driver') return -1;
            if (posA !== 'driver' && posB === 'driver') return 1;
            return 0;
        });
    }, [team, responders]);

    // Filter relievers (unlimited, no permanent team)
    const relievers = useMemo(() => {
        return responders.filter(r => {
            const profile = r.responder_profile || r.responderProfile;
            return Boolean(profile?.is_reliever);
        });
    }, [responders]);

    const permanentDriver = permanentMembers.find(m => {
        const pos = m.responder_profile?.position || m.responderProfile?.position;
        return pos === 'driver';
    });

    const isPermanentDriverAvailable = (permanentDriver?.responder_profile?.availability || permanentDriver?.responderProfile?.availability) === 'available';

    // Toggle Driver selection
    const handleToggleDriver = (id: string, isAvailable: boolean) => {
        if (!isAvailable) return;
        setSelectedDriverId(prev => prev === id ? '' : id);
    };

    // Toggle EMT selection
    const handleToggleEmt = (id: string, isAvailable: boolean) => {
        if (!isAvailable) return;
        setSelectedEmtIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Selected objects
    const selectedDriverObj = responders.find(r => String(r.id) === String(selectedDriverId));
    const selectedEmtObjs = responders.filter(r => selectedEmtIds.includes(String(r.id)));

    // Validation rules: At least 1 crew member (Driver or EMT)
    const selectedPersonnelCount = (selectedDriverId ? 1 : 0) + selectedEmtIds.length;
    const hasAtLeastOneMember = selectedPersonnelCount >= 1;
    const isFormValid = Boolean(ambulanceId && team && hasAtLeastOneMember);

    const handleSubmit = () => {
        if (!isFormValid) return;

        setLoading(true);
        setErrorMessage(null);

        router.post('/dispatcher/dispatches', {
            incident_id: incident.id,
            ambulance_id: ambulanceId,
            team: team,
            driver_id: selectedDriverId || null,
            emt_ids: selectedEmtIds,
        }, {
            onSuccess: () => {
                setLoading(false);
                setAmbulanceId('');
                setTeam('');
                setSelectedDriverId('');
                setSelectedEmtIds([]);
                onClose();
            },
            onError: (errs) => {
                setLoading(false);
                const firstErr = Object.values(errs)[0];
                setErrorMessage(typeof firstErr === 'string' ? firstErr : 'Unable to deploy response unit. Please check crew availability.');
            }
        });
    };

    const renderPersonnelCard = (person: any, isReliever: boolean) => {
        const id = String(person.id);
        const profile = person.responder_profile || person.responderProfile;
        const position = profile?.position === 'driver' ? 'driver' : 'emt';
        const rawAvail = person.current_status || profile?.availability || 'offline';
        const isAvailable = rawAvail === 'available';

        const isDriver = position === 'driver';
        const isChecked = isDriver 
            ? selectedDriverId === id 
            : selectedEmtIds.includes(id);

        return (
            <div
                key={id}
                onClick={() => {
                    if (isDriver) {
                        handleToggleDriver(id, isAvailable);
                    } else {
                        handleToggleEmt(id, isAvailable);
                    }
                }}
                className={clsx(
                    "flex items-center justify-between p-3 rounded-xl border transition-all select-none",
                    !isAvailable && "opacity-50 bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 cursor-not-allowed",
                    isAvailable && isChecked && "bg-blue-50/80 dark:bg-blue-500/10 border-blue-400 dark:border-blue-500/40 shadow-sm cursor-pointer",
                    isAvailable && !isChecked && "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 cursor-pointer"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                        !isAvailable && "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400",
                        isAvailable && isChecked && "bg-blue-600 border-blue-600 text-white",
                        isAvailable && !isChecked && "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    )}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                                {person.first_name} {person.last_name}
                            </span>
                            
                            {/* Position Badge */}
                            <span className={clsx(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                isDriver 
                                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" 
                                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            )}>
                                {isDriver ? 'Driver' : 'EMT'}
                            </span>

                            {/* Type Badge */}
                            <span className={clsx(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                isReliever 
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" 
                                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                            )}>
                                {isReliever ? 'Reliever' : 'Permanent Member'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-1.5">
                    {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Available
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {rawAvail === 'off_duty' ? 'Off Duty' : (rawAvail === 'busy' ? 'Busy / Dispatched' : rawAvail)}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Modal 
            open={open} 
            onClose={onClose} 
            title={`Deploy Response Unit — Incident #${incident.id}`} 
            description="Manually select which available personnel will respond to this emergency incident."
            size="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {isFormValid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Ready to deploy ({selectedPersonnelCount} crew member{selectedPersonnelCount === 1 ? '' : 's'})
                            </span>
                        ) : (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> 
                                {!ambulanceId ? 'Select an ambulance' : (!team ? 'Select a response team' : 'Select at least 1 crew member')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button 
                            loading={loading} 
                            onClick={handleSubmit} 
                            disabled={!isFormValid}
                            variant="primary"
                            className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white min-w-[170px]"
                        >
                            <Send className="w-4 h-4 mr-1.5" />
                            Deploy Unit Now
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Incident Quick Summary */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                            {incident.incident_type?.name || 'Emergency Incident'}
                        </span>
                        <span className="text-[11px] font-mono text-primary">
                            {incident.location_code ? `Code: ${incident.location_code}` : incident.barangay}
                        </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">
                        {incident.place_of_incident || incident.description || 'No description provided.'}
                    </p>
                </div>

                {/* Ambulance Selection */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-primary" /> Ambulance Unit <span className="text-rose-500">*</span>
                    </label>
                    <Select
                        id="ambulance_id"
                        value={ambulanceId}
                        onChange={setAmbulanceId}
                        options={ambulanceOptions}
                        placeholder="Select an available ambulance..."
                    />
                </div>

                {/* Team Selection */}
                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-white/5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary" /> Response Team <span className="text-rose-500">*</span>
                    </label>
                    <Select
                        id="team"
                        value={team}
                        onChange={setTeam}
                        options={availableTeams}
                        placeholder="Select an available team..."
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Select a team, then choose the mission crew using the checkboxes below.
                    </p>
                </div>

                {/* Crew Selection Section */}
                {team && (
                    <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/5">
                        {/* Section 1: Team Permanent Members */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-blue-500" /> Team {team} Permanent Members (1 Driver, 3 EMTs)
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    {permanentMembers.length} permanent members
                                </span>
                            </div>

                            {/* Driver Unavailable Warning Notice */}
                            {permanentDriver && !isPermanentDriverAvailable && (
                                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>Team {team}'s permanent Driver ({permanentDriver.first_name} {permanentDriver.last_name}) is currently unavailable. Please select an available Reliever Driver below.</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                {permanentMembers.length > 0 ? (
                                    permanentMembers.map(member => renderPersonnelCard(member, false))
                                ) : (
                                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                                        No permanent members registered for Team {team}.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Reliever Pool */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-amber-500" /> Reliever Pool (Temporary Mission Fill-ins)
                                </span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    {relievers.length} registered
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Relievers temporarily fill required positions when permanent team members are unavailable. They return to the standby pool after mission completion.
                            </p>

                            <div className="space-y-1.5">
                                {relievers.length > 0 ? (
                                    relievers.map(reliever => renderPersonnelCard(reliever, true))
                                ) : (
                                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                                        No relievers registered in the pool. You can create relievers anytime in User Management.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Selected Mission Crew Verification Summary */}
                        <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Selected Mission Crew Verification
                                </span>
                                <span className={clsx(
                                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                                    selectedPersonnelCount >= 1
                                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                )}>
                                    {selectedPersonnelCount} Total Crew Selected
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Driver Slot */}
                                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <Truck className="w-3 h-3 text-blue-400" /> Mission Driver {selectedDriverObj ? '(Selected)' : '(Optional)'}
                                    </span>
                                    {selectedDriverObj ? (
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs font-semibold text-white">
                                                {selectedDriverObj.first_name} {selectedDriverObj.last_name}
                                            </span>
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                selectedDriverObj.responder_profile?.is_reliever
                                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                            )}>
                                                {selectedDriverObj.responder_profile?.is_reliever ? 'Reliever' : 'Permanent'}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic pt-1 flex items-center gap-1">
                                            No Driver selected {selectedEmtObjs.length > 0 ? '(Deploying with EMTs only)' : ''}
                                        </p>
                                    )}
                                </div>

                                {/* EMTs Slot */}
                                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                        <Stethoscope className="w-3 h-3 text-emerald-400" /> Mission EMTs ({selectedEmtObjs.length} Selected)
                                    </span>
                                    {selectedEmtObjs.length > 0 ? (
                                        <div className="space-y-1 pt-1">
                                            {selectedEmtObjs.map(emt => (
                                                <div key={emt.id} className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-white">
                                                        {emt.first_name} {emt.last_name}
                                                    </span>
                                                    <span className={clsx(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                                                        emt.responder_profile?.is_reliever
                                                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                                    )}>
                                                        {emt.responder_profile?.is_reliever ? 'Reliever' : 'Permanent'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic pt-1 flex items-center gap-1">
                                            No EMTs selected {selectedDriverObj ? '(Deploying with Driver only)' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
