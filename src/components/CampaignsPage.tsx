import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MessageSquareText, Plus, Trash2, UsersRound } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { PatientLink } from './PatientLink';
import { useOpsStore } from '../store/useOpsStore';

const donationCategories = [
  { value: 'whole_blood', label: 'Whole Blood', recipient: 'Emergency Department trauma reserve', operations: 'Whole-blood collection stations ready.' },
  { value: 'apheresis', label: 'Apheresis (Target Component)', recipient: 'Platelet support for oncology and surgical patients', operations: 'Plateletpheresis Kit Ready · 2 machines available.' },
  { value: 'autologous', label: 'Autologous Donation', recipient: 'Reserved for the scheduled patient’s procedure', operations: 'Patient-matched collection; verify consent before collection.' },
  { value: 'mobile', label: 'Voluntary Mobile Drives', recipient: 'Community drive collections for hospital reserves', operations: 'Mobile unit: Central Civic Centre · 30-minute donor slots.' },
  { value: 'directed', label: 'Directed / Replacement', recipient: 'Designated recipient linked to an inpatient request', operations: 'Recipient link: Dhruv Kapoor · O-Negative requested.' },
] as const;

export function CampaignsPage() {
  const inventory = useOpsStore((state) => state.bloodInventory);
  const appointments = useOpsStore((state) => state.donorAppointments);
  const campaigns = useOpsStore((state) => state.campaigns);
  const checkInDonor = useOpsStore((state) => state.checkInDonor);
  const incrementBloodDrive = useOpsStore((state) => state.incrementBloodDrive);
  const broadcastEmergencySms = useOpsStore((state) => state.broadcastEmergencySms);
  const addCampaign = useOpsStore((state) => state.addCampaign);
  const moveToTrash = useOpsStore((state) => state.moveToTrash);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const smsDispatches = useOpsStore((state) => state.emergencySmsDispatches);
  const [toast, setToast] = useState('');
  const [donationType, setDonationType] = useState<(typeof donationCategories)[number]['value']>('whole_blood');
  const [selectedLocation, setSelectedLocation] = useState('Sanjeevani Main Campus');
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignTarget, setCampaignTarget] = useState('50');
  const campaign = campaigns.find((item) => item.status === 'active' && item.driveLocation === selectedLocation && item.donationType === donationType);
  const campaignLocations = [...new Set(campaigns.map((item) => item.driveLocation))];
  const locationCampaigns = campaigns.filter((item) => item.driveLocation === selectedLocation);
  const goalPercent = campaign ? Math.min(100, Math.round((campaign.collectedUnits / campaign.targetUnits) * 100)) : 0;
  const lowInventory = inventory.some((item) => item.currentUnits / item.targetUnits < 0.4);
  const selectedDonation = donationCategories.find((item) => item.value === donationType)!;

  const dispatchSms = () => {
    broadcastEmergencySms();
    setToast('Emergency donor SMS broadcast queued successfully.');
    window.setTimeout(() => setToast(''), 3500);
  };

  const appointmentsBySlot = appointments.reduce<Record<string, typeof appointments>>((slots, appointment) => {
    const [hour, minute] = appointment.time.split(':').map(Number);
    const slotMinute = minute < 30 ? '00' : '30';
    const slot = `${String(hour).padStart(2, '0')}:${slotMinute}`;
    (slots[slot] ??= []).push(appointment);
    return slots;
  }, {});

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 4 · Community response</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Campaigns &amp; Blood Drives</h1>
        <p className="mt-2 text-sm text-slate-600">Coordinate donor arrivals and monitor emergency blood supply in real time.</p>
      </header>

      <section className="glass-panel p-5" aria-label="Blood drive locations">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Campaign locations</p><h2 className="mt-1 text-lg font-bold text-slate-900">Drive Location Overview</h2></div>
          <button type="button" onClick={() => setCampaignModalOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"><Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Add Drive Campaign</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {campaignLocations.map((location) => {
            const items = campaigns.filter((item) => item.driveLocation === location);
            const pressure = lowInventory ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
            return (
              <button key={location} type="button" onClick={() => setSelectedLocation(location)} className={`rounded-xl border p-4 text-left transition ${selectedLocation === location ? 'border-teal-300 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200'}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-900">{location}</span><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${pressure}`}>{lowInventory ? 'Emergency Reserve' : 'Normal Capacity'}</span></div>
                <p className="mt-2 text-xs text-slate-500">{items.length} campaign{items.length === 1 ? '' : 's'} · {items.reduce((sum, item) => sum + item.collectedUnits, 0)} units collected</p>
              </button>
            );
          })}
        </div>
        {locationCampaigns.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {locationCampaigns.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                {item.title} · {item.donationType.replace('_', ' ')}
                <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to archive campaigns.' : undefined} aria-label={`Move ${item.title} to trash`} onClick={() => moveToTrash('Blood Drive', item.id, 'Moved from campaign location overview')} className="text-rose-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:text-slate-300"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        )}
      </section>

      <CategorySelector label="Donation categories" options={donationCategories} value={donationType} onChange={setDonationType} />
      <AnimatePresence mode="wait">
        <motion.section
          key={donationType}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="glass-panel grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Selected drive type</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedDonation.label}</h2>
            <p className="mt-1 text-sm text-slate-600">{selectedDonation.operations}</p>
            <p className="mt-2 text-xs font-medium text-slate-500">Recipient / impact: {donationType === 'directed' ? <>Recipient link: <PatientLink patientName="Dhruv Kapoor" className="font-semibold" /> · O-Negative requested</> : selectedDonation.recipient}</p>
            <p className="mt-1 text-xs text-slate-500">Live roster: {appointments.filter((appointment) => !appointment.checkedIn).length} expected arrivals · {appointments.filter((appointment) => appointment.checkedIn).length} checked in</p>
          </div>
          {donationType === 'mobile' ? (
            <button type="button" onClick={dispatchSms} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
              <MessageSquareText aria-hidden="true" className="mr-2 inline h-4 w-4" /> Broadcast SMS to Donors
            </button>
          ) : campaign ? (
            <button data-help-action="donation-unit" type="button" disabled={campaign.collectedUnits >= campaign.targetUnits} onClick={() => incrementBloodDrive(campaign.id)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300">
              Log Donation Unit
            </button>
          ) : null}
        </motion.section>
      </AnimatePresence>

      <section aria-labelledby="reserves-title" className="glass-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Smart donor alerts</p>
            <h2 id="reserves-title" className="mt-1 text-lg font-bold text-slate-900">Blood Bank Reserves</h2>
          </div>
          {lowInventory && (
            <button
              data-help-action="sms"
              type="button"
              onClick={dispatchSms}
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
            >
              <MessageSquareText aria-hidden="true" className="mr-2 inline h-4 w-4" />
              Broadcast Emergency SMS to Donors
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {inventory.map((item) => {
            const percent = Math.min(100, Math.round((item.currentUnits / item.targetUnits) * 100));
            const isLow = percent < 40;
            return (
              <article key={item.bloodType} className={`rounded-xl border bg-white p-4 ${isLow ? 'border-rose-200' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{item.bloodType}</h3>
                  <span className={`text-xs font-semibold ${isLow ? 'text-rose-700' : 'text-teal-700'}`}>{isLow ? 'Low reserve' : 'Stocked'}</span>
                </div>
                <p className="mt-3 font-mono text-2xl font-bold text-slate-900">{item.currentUnits}<span className="ml-1 text-sm font-medium text-slate-500">/ {item.targetUnits} units</span></p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }} />
                </div>
              </article>
            );
          })}
        </div>
        {smsDispatches > 0 && <p className="mt-3 text-xs text-slate-500">Emergency broadcasts dispatched: {smsDispatches}</p>}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section aria-labelledby="appointments-title" className="glass-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><UsersRound aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">30-minute arrival slots</p>
              <h2 id="appointments-title" className="text-lg font-bold text-slate-900">Donor Check-In Queue</h2>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(appointmentsBySlot).sort(([a], [b]) => a.localeCompare(b)).map(([slot, donors]) => (
              <div key={slot}>
                <h3 className="mb-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-600">{slot}–{slot.endsWith('00') ? `${slot.slice(0, 2)}:30` : `${String((Number(slot.slice(0, 2)) + 1) % 24).padStart(2, '0')}:00`}</h3>
                <div className="space-y-2">
                  {donors.map((donor) => (
                    <article key={donor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{donor.donorName}</p>
                        <p className="text-xs text-slate-500">{donor.time} · {donor.bloodType}</p>
                      </div>
                      {donor.checkedIn ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          <Check aria-hidden="true" className="h-3.5 w-3.5" /> Checked in
                        </span>
                      ) : (
                        <button
                          data-help-action="checkin"
                          type="button"
                          onClick={() => checkInDonor(donor.id)}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                        >
                          Mark Checked-In
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="goal-title" className="glass-panel p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Live collection target</p>
          <h2 id="goal-title" className="mt-1 text-lg font-bold text-slate-900">Today’s Donation Goal</h2>
          {campaign ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-700">{campaign.title}</p>
              <p className="mt-4 font-mono text-3xl font-bold text-teal-700">{campaign.collectedUnits} / {campaign.targetUnits} <span className="text-base font-medium text-slate-500">Units Collected</span></p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">{goalPercent}% Goal Reached</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${goalPercent}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-500">{campaign.impactSummary}</p>
              <button
                type="button"
                disabled={campaign.collectedUnits >= campaign.targetUnits}
                onClick={() => incrementBloodDrive(campaign.id)}
                className="mt-4 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Quick Update · Record Unit Collected
              </button>
            </div>
          ) : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No active {selectedDonation.label.toLowerCase()} campaign at {selectedLocation}. Add a drive campaign to start tracking this subtype.</p>}
        </section>
      </div>

      <AnimatePresence>
        {campaignModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setCampaignModalOpen(false); }}>
            <motion.form className="glass-panel w-full max-w-md space-y-4 bg-white p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onSubmit={(event) => {
              event.preventDefault();
              const target = Number(campaignTarget);
              if (!campaignTitle.trim() || !Number.isInteger(target) || target < 1) return;
              addCampaign({
                title: campaignTitle.trim(),
                targetUnits: target,
                collectedUnits: 0,
                status: 'active',
                impactSummary: selectedDonation.recipient,
                bloodType: 'O-Negative',
                donationType,
                recipientDetails: selectedDonation.recipient,
                driveLocation: selectedLocation,
                machineStatus: selectedDonation.operations,
              });
              setCampaignTitle('');
              setCampaignModalOpen(false);
            }}>
              <h2 className="text-xl font-bold text-slate-900">Add Drive Campaign</h2>
              <label className="block text-sm font-medium text-slate-700">Campaign Name<input required value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">Drive Location<input required value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">Daily Target Units<input required type="number" min="1" value={campaignTarget} onChange={(event) => setCampaignTarget(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">Donation type: {selectedDonation.label}</p>
              <button type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700">Create Campaign</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div role="status" className="fixed bottom-5 left-5 z-40 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
