import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HeaderContextType {
    searchValue: string;
    setSearchValue: (value: string) => void;
    searchPlaceholder: string;
    setSearchPlaceholder: (placeholder: string) => void;
    isSearchVisible: boolean;
    setIsSearchVisible: (visible: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
    const [searchValue, setSearchValue] = useState("");
    const [searchPlaceholder, setSearchPlaceholder] = useState("Search...");
    const [isSearchVisible, setIsSearchVisible] = useState(true);

    return (
        <HeaderContext.Provider value={{
            searchValue,
            setSearchValue,
            searchPlaceholder,
            setSearchPlaceholder,
            isSearchVisible,
            setIsSearchVisible
        }}>
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
};
