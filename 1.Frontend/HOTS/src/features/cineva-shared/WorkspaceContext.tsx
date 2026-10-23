import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CinevaRepository, Product, Workspace } from './model';
interface WorkspaceState {
    data: Workspace | null;
    loading: boolean;
    busy: boolean;
    error: string;
    notice: string;
    mutate: (change: (current: Workspace) => Workspace) => Promise<boolean>;
    reset: () => Promise<void>;
    clearError: () => void;
}
const Context = createContext<WorkspaceState | null>(null);
export function WorkspaceProvider({ product, repository, children }: {
    product: Product;
    repository: CinevaRepository;
    children: ReactNode;
}) {
    const [data, setData] = useState<Workspace | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const current = useRef<Workspace | null>(null), locked = useRef(false);
    useEffect(() => { let alive = true; setLoading(true); setError(''); current.current = null; repository.load(product).then(next => { if (alive) {
        current.current = next;
        setData(next);
    } }).catch(() => { if (alive)
        setError('Data dummy tidak dapat dimuat.'); }).finally(() => { if (alive)
        setLoading(false); }); return () => { alive = false; }; }, [product, repository]);
    const mutate = useCallback(async (change: (value: Workspace) => Workspace) => {
        if (locked.current || !current.current)
            return false;
        locked.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const next = change(current.current);
            await repository.save(next);
            current.current = next;
            setData(next);
            setNotice('Perubahan disimpan pada data dummy browser ini.');
            return true;
        }
        catch (failure) {
            setError(failure instanceof Error ? failure.message : 'Perubahan gagal disimpan.');
            return false;
        }
        finally {
            locked.current = false;
            setBusy(false);
        }
    }, [repository]);
    const reset = async () => { if (locked.current)
        return; locked.current = true; setBusy(true); try {
        const next = await repository.reset(product);
        current.current = next;
        setData(next);
        setError('');
        setNotice('Data dummy dikembalikan ke contoh awal.');
    }
    catch {
        setError('Reset dummy gagal.');
    }
    finally {
        locked.current = false;
        setBusy(false);
    } };
    return <Context.Provider value={{ data, loading, busy, error, notice, mutate, reset, clearError: () => setError('') }}>{children}</Context.Provider>;
}
export function useWorkspace() { const value = useContext(Context); if (!value)
    throw new Error('WorkspaceProvider missing'); return value; }
