import type { FormValues } from '@hots/dynamic-form';
import type { ProjectType } from '../cineva-shared/model';

/** Vendor workflow view model. It does not replace HOTS ticket or payment states. */
export interface ServiceWorkflowState {
  stage: string;
  history: string[];
}
export interface ServiceStage { id: string; label: string; description: string }
export const serviceStages: Record<ProjectType, readonly ServiceStage[]> = {
  Campaign: [
    { id: 'scope', label: 'SOW & periode', description: 'Sepakati lingkup, periode dan rencana deliverable.' },
    { id: 'execution', label: 'Pelaksanaan campaign', description: 'Jalankan deliverable sesuai rencana periode.' },
    { id: 'reporting', label: 'Review & laporan', description: 'Periksa hasil dan laporan campaign dengan client.' },
    { id: 'completed', label: 'Campaign selesai', description: 'Lingkup campaign selesai; pembayaran dicatat terpisah.' },
  ],
  Production: [
    { id: 'preproduction', label: 'Pra-produksi', description: 'Siapkan konsep, script, storyboard dan lokasi.' },
    { id: 'production', label: 'Produksi', description: 'Laksanakan shooting sesuai brief dan resource yang disepakati.' },
    { id: 'postproduction', label: 'Pascaproduksi', description: 'Editing, revisi dan pemeriksaan format output.' },
    { id: 'delivery', label: 'Penyerahan hasil', description: 'Konfirmasi hasil final telah diserahkan kepada client.' },
    { id: 'completed', label: 'Produksi selesai', description: 'Tahapan produksi selesai; pembayaran dicatat terpisah.' },
  ],
  'Content Shoot': [
    { id: 'preparation', label: 'Persiapan sesi', description: 'Konfirmasi shot list, lokasi dan kebutuhan setiap sesi.' },
    { id: 'session', label: 'Pelaksanaan sesi', description: 'Jalankan sesi foto/video sesuai jadwal dan durasi.' },
    { id: 'selection', label: 'Seleksi & editing', description: 'Seleksi hasil dan siapkan output konten.' },
    { id: 'completed', label: 'Sesi selesai', description: 'Hasil sesi selesai; pembayaran dicatat terpisah.' },
  ],
};

function stagesFor(type: ProjectType) {
  const stages = serviceStages[type];
  if (!stages) throw new Error('Jenis layanan workflow tidak valid.');
  return stages;
}

/** Legacy jobs without workflow start at the first configured stage, without a write. */
export function getServiceWorkflow(type: ProjectType, state?: ServiceWorkflowState): ServiceWorkflowState {
  const stages = stagesFor(type);
  if (!state) return { stage: stages[0].id, history: [stages[0].id] };
  const index = stages.findIndex(stage => stage.id === state.stage);
  if (index < 0 || !Array.isArray(state.history) || state.history.length !== index + 1 ||
      !state.history.every((id, i) => stages[i]?.id === id))
    throw new Error('Riwayat workflow layanan tidak valid; periksa data project.');
  return { stage: state.stage, history: [...state.history] };
}

/** Only the immediately following stage is legal; stale or skip-stage updates fail. */
export function transitionServiceWorkflow(type: ProjectType, state: ServiceWorkflowState | undefined, next: string): ServiceWorkflowState {
  const stages = stagesFor(type), current = getServiceWorkflow(type, state);
  const index = stages.findIndex(stage => stage.id === current.stage);
  if (stages[index + 1]?.id !== next) throw new Error('Tahapan layanan harus berurutan dan belum selesai.');
  return { stage: next, history: [...current.history, next] };
}

export function advanceServiceWorkflow(type: ProjectType, state?: ServiceWorkflowState): ServiceWorkflowState {
  const stages = stagesFor(type), current = getServiceWorkflow(type, state);
  const next = stages[stages.findIndex(stage => stage.id === current.stage) + 1];
  if (!next) throw new Error('Seluruh tahapan layanan sudah selesai.');
  return transitionServiceWorkflow(type, current, next.id);
}

/** Optional detail fields remain compatible with previously saved/requested briefs. */
export function validateServiceDetails(type: ProjectType, brief: FormValues) {
  stagesFor(type);
  const count = brief.sessionCount;
  if (type === 'Content Shoot' && count !== undefined && count !== null && String(count).trim() !== '' &&
      (!['number', 'string'].includes(typeof count) || !Number.isSafeInteger(Number(count)) || Number(count) < 1 || Number(count) > 365))
    throw new Error('Jumlah sesi harus bilangan bulat antara 1 dan 365.');
}
