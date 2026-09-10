import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/shared/components/Modal';
import Select from '@/shared/components/Select';
import Button from '@/shared/components/Button';
import { Truck, Users, AlertCircle, Send, CheckCircle2, ArrowRightLeft, User, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

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
    const [driverId, setDriverId] = useState('');
    const [emtId, setEmtId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Extract unique teams from responders
    const availableTeams = useMemo(() => {
        const teamSet = new Set<string>();
        responders.forEach(r => {
            const t = r.responder_profile?.team || r.responderProfile?.team;
            if (t) teamSet.add(t);
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

    // Live refresh ambulances and responders from server when modal opens
    useEffect(() => {
        if (open) {
            setErrorMessage(null);
            router.reload({ only: ['ambulances', 'responders'] });
        }
    }, [open]);

    // Auto-select first available ambulance and team for fast deployment
    useEffect(() => {
        if (open) {
            const firstAvail = filteredAmbulances.find(a => a.status === 'available');
            if (firstAvail) {
                setAmbulanceId(String(firstAvail.id));
            }
            if (availableTeams.length > 0 && !team) {
                setTeam(availableTeams[0].value);
            }
        }
    }, [open, filteredAmbulances, availableTeams]);

    // Check if the selected team has on-duty available members
    const teamDriver = useMemo(() => {
        if (!team) return null;
        return responders.find(r => {
            const t = r.responder_profile?.team || r.responderProfile?.team;
            const avail = r.responder_profile?.availability || r.responderProfile?.availability;
            const pos = r.responder_profile?.position || r.responderProfile?.position;
            return t === team && avail === 'available' && (pos === 'driver' || r.role === 'driver');
        });
    }, [team, responders]);

    const teamEmt = useMemo(() => {
        if (!team) return null;
        return responders.find(r => {
            const t = r.responder_profile?.team || r.responderProfile?.team;
            const avail = r.responder_profile?.availability || r.responderProfile?.availability;
            const pos = r.responder_profile?.position || r.responderProfile?.position;
            return t === team && avail === 'available' && (pos === 'emt' || r.role === 'emt') && r.id !== teamDriver?.id;
        });
    }, [team, responders, teamDriver]);

    // Incomplete team checks
    const isDriverAbsent = !teamDriver;
    const isEmtAbsent = !teamEmt;
    const isTeamComplete = !isDriverAbsent && !isEmtAbsent;

    // If the team's member is present, automatically use them and do NOT borrow.
    // If absent, allow selecting a borrowed member.
    useEffect(() => {
        if (teamDriver) {
            setDriverId(String(teamDriver.id));
        } else {
            setDriverId('');
        }
    }, [teamDriver]);

    useEffect(() => {
        if (teamEmt) {
            setEmtId(String(teamEmt.id));
        } else {
            setEmtId('');
        }
    }, [teamEmt]);

    if (!incident) return null;

    // Responders available from other teams for borrowing (only used when team is incomplete)
    const otherAvailableDrivers = responders.filter(r => {
        const t = r.responder_profile?.team || r.responderProfile?.team;
        const avail = r.responder_profile?.availability || r.responderProfile?.availability;
        const pos = r.responder_profile?.position || r.responderProfile?.position;
        return t !== team && avail === 'available' && (pos === 'driver' || r.role === 'driver');
    });

    const otherAvailableEmts = responders.filter(r => {
        const t = r.responder_profile?.team || r.responderProfile?.team;
        const avail = r.responder_profile?.availability || r.responderProfile?.availability;
        const pos = r.responder_profile?.position || r.responderProfile?.position;
        return t !== team && avail === 'available' && (pos === 'emt' || r.role === 'emt');
    });

    // Currently selected driver and EMT objects
    const selectedDriver = responders.find(r => String(r.id) === String(driverId));
    const selectedEmt = responders.find(r => String(r.id) === String(emtId));

    const isDriverBorrowed = isDriverAbsent && selectedDriver && (selectedDriver.responder_profile?.team || selectedDriver.responderProfile?.team) !== team;
    const isEmtBorrowed = isEmtAbsent && selectedEmt && (selectedEmt.responder_profile?.team || selectedEmt.responderProfile?.team) !== team;

    const handleSubmit = () => {
        if (!ambulanceId || !team) return;

        setLoading(true);
        setErrorMessage(null);

        router.post('/dispatcher/dispatches', {
            incident_id: incident.id,
            ambulance_id: ambulanceId,
            team: team,
            driver_id: driverId || undefined,
            emt_id: emtId || undefined,
        }, {
            onSuccess: () => {
                setLoading(false);
                setAmbulanceId('');
                setTeam('');
                setDriverId('');
                setEmtId('');
                onClose();
            },
            onError: (errs) => {
                setLoading(false);
                const firstErr = Object.values(errs)[0];
                setErrorMessage(typeof firstErr === 'string' ? firstErr : 'Unable to deploy response unit. Please check crew availability.');
            }
        });
    };

    const isFormValid = Boolean(ambulanceId && team);

    return (
        <Modal 
            open={open} 
            onClose={onClose} 
            title={`Deploy Response Unit — Incident #${incident.id}`} 
            description="Directly assign an ambulance and response crew to this emergency incident."
            size="lg"
            footer={
                <div className="flex items-center justify-end gap-3 w-full">
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
                        <Send className="w-4 h-4" />
                        Deploy Unit Now
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
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
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
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

                {/* Team / Crew Selection */}
                <div className="space-y-1 pt-2 border-t border-white/5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary" /> Response Team / Crew <span className="text-rose-500">*</span>
                    </label>
                    <Select
                        id="team"
                        value={team}
                        onChange={setTeam}
                        options={availableTeams}
                        placeholder="Select an available team..."
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                        Available on-duty crew in this team will be deployed immediately to the incident scene.
                    </p>
                </div>

                {/* Crew Roster & Strict Borrowing Section */}
                {team && (
                    <div className="p-3.5 bg-slate-900/70 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-primary" /> Team {team} Response Crew Roster
                            </span>

                            {isTeamComplete ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle className="w-3 h-3" /> Complete Crew (No borrowing needed)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    <AlertTriangle className="w-3 h-3" /> Incomplete Team (Borrowing Allowed)
                                </span>
                            )}
                        </div>

                        {/* Driver Slot */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" /> Driver:
                                </span>

                                {!isDriverAbsent ? (
                                    /* Team driver is available -> LOCK TO TEAM MEMBER, DO NOT ALLOW BORROWING */
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-white">
                                            {teamDriver.first_name} {teamDriver.last_name}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> Team {team} (Present)
                                        </span>
                                    </div>
                                ) : (
                                    /* Team driver is absent -> ALLOW BORROWING */
                                    <div className="flex items-center gap-2">
                                        {selectedDriver ? (
                                            <>
                                                <span className="text-xs font-medium text-white">
                                                    {selectedDriver.first_name} {selectedDriver.last_name}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                                    Borrowed from Team {selectedDriver.responder_profile?.team || selectedDriver.responderProfile?.team}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                                                <AlertTriangle className="w-3 h-3" /> Absent in Team {team}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Only show borrowing selector if the team's driver is absent */}
                            {isDriverAbsent && (
                                <div className="pt-1 flex items-center gap-2 border-t border-white/5 mt-1.5">
                                    <span className="text-[11px] text-amber-400 font-medium">
                                        Driver is absent — borrow from another team:
                                    </span>
                                    <select
                                        value={driverId}
                                        onChange={(e) => setDriverId(e.target.value)}
                                        className="text-xs bg-slate-900 border border-amber-500/30 rounded-lg px-2.5 py-1 text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none flex-1 max-w-[270px]"
                                    >
                                        <option value="">Select available driver to borrow...</option>
                                        {otherAvailableDrivers.map(d => {
                                            const pTeam = d.responder_profile?.team || d.responderProfile?.team;
                                            return (
                                                <option key={d.id} value={d.id}>
                                                    {d.first_name} {d.last_name} (Team {pTeam})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* EMT Slot */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" /> EMT / Responder:
                                </span>

                                {!isEmtAbsent ? (
                                    /* Team EMT is available -> LOCK TO TEAM MEMBER, DO NOT ALLOW BORROWING */
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-white">
                                            {teamEmt.first_name} {teamEmt.last_name}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> Team {team} (Present)
                                        </span>
                                    </div>
                                ) : (
                                    /* Team EMT is absent -> ALLOW BORROWING */
                                    <div className="flex items-center gap-2">
                                        {selectedEmt ? (
                                            <>
                                                <span className="text-xs font-medium text-white">
                                                    {selectedEmt.first_name} {selectedEmt.last_name}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                                    Borrowed from Team {selectedEmt.responder_profile?.team || selectedEmt.responderProfile?.team}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-xs text-amber-400 flex items-center gap-1 font-medium">
                                                <AlertTriangle className="w-3 h-3" /> Absent in Team {team}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Only show borrowing selector if the team's EMT is absent */}
                            {isEmtAbsent && otherAvailableEmts.length > 0 && (
                                <div className="pt-1 flex items-center gap-2 border-t border-white/5 mt-1.5">
                                    <span className="text-[11px] text-amber-400 font-medium">
                                        EMT is absent — borrow from another team:
                                    </span>
                                    <select
                                        value={emtId}
                                        onChange={(e) => setEmtId(e.target.value)}
                                        className="text-xs bg-slate-900 border border-amber-500/30 rounded-lg px-2.5 py-1 text-slate-200 focus:ring-1 focus:ring-amber-500 focus:outline-none flex-1 max-w-[270px]"
                                    >
                                        <option value="">Select available EMT to borrow...</option>
                                        {otherAvailableEmts.map(e => {
                                            const pTeam = e.responder_profile?.team || e.responderProfile?.team;
                                            return (
                                                <option key={e.id} value={e.id}>
                                                    {e.first_name} {e.last_name} (Team {pTeam})
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Informational Rule Alert */}
                        {isTeamComplete ? (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Team {team} is complete. Standard team deployment active; borrowing from other crews is not permitted.</span>
                            </div>
                        ) : (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-center gap-2">
                                <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                <span>Team {team} is incomplete due to absence. You can borrow available on-duty members from other teams to complete the crew.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
