import { useLayoutEffect, type ReactNode } from 'react';
import './cineva-vendor.css';

/** Vendor presentation layer. Shared HOTS primitives/engines keep their original defaults. */
export function CinevaVendorTheme({ children }: { children: ReactNode }) {
    useLayoutEffect(() => {
        const root = document.documentElement;
        const previous = root.dataset.hotsVendor;
        root.dataset.hotsVendor = 'cineva';
        return () => {
            if (root.dataset.hotsVendor !== 'cineva') return;
            if (previous === undefined) delete root.dataset.hotsVendor;
            else root.dataset.hotsVendor = previous;
        };
    }, []);
    return <>{children}</>;
}
