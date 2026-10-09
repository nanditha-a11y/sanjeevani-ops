import { useOpsStore } from '../store/useOpsStore';

interface PatientLinkProps {
  patientId?: string;
  patientName: string;
  className?: string;
}

export function PatientLink({ patientId, patientName, className = '' }: PatientLinkProps) {
  const patients = useOpsStore((state) => state.patients);
  const openPatientRecord = useOpsStore((state) => state.openPatientRecord);
  const patient = patients.find((item) => patientId ? item.id === patientId : item.name === patientName);
  if (!patient) return <span className={className}>{patientName}</span>;

  return (
    <button
      type="button"
      onClick={() => openPatientRecord(patient.id)}
      className={`text-left text-teal-800 underline decoration-teal-300 underline-offset-2 hover:text-teal-900 ${className}`}
    >
      {patientName}
    </button>
  );
}

export function PatientAwareText({ text }: { text: string }) {
  const patients = useOpsStore((state) => state.patients);
  const mentions = patients.flatMap((patient) => [
    { text: patient.name, id: patient.id },
    { text: patient.id, id: patient.id },
  ]).sort((first, second) => second.text.length - first.text.length);
  const escapedMentions = mentions.map((mention) => mention.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escapedMentions.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapedMentions.join('|')})`, 'g'));
  return <>{parts.map((part, index) => {
    const mention = mentions.find((item) => item.text === part);
    return mention
      ? <PatientLink key={`${mention.id}-${index}`} patientId={mention.id} patientName={part} className="font-medium" />
      : <span key={index}>{part}</span>;
  })}</>;
}
