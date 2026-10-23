import { createRoot } from 'react-dom/client';
import { OfflineDemo } from './OfflineDemo';
import { validateData } from './validation';
const element = document.getElementById('demo-seed')!;
try {
  const data: unknown = JSON.parse(element.textContent || '{}'); validateData(data);
  createRoot(document.getElementById('root')!).render(<OfflineDemo seed={data} storageId={element.dataset.storageId || data.datasetId}/>);
} catch {
  document.getElementById('root')!.textContent = 'Data demo tidak valid. Gunakan file JSON/HTML asli atau export yang valid.';
}
