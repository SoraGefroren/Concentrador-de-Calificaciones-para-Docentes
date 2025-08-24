import { createContext, useContext } from 'react';
import { useExcelData } from '../hooks/useExcelData';

const ExcelContext = createContext<ReturnType<typeof useExcelData> | undefined>(undefined);

export const ExcelProvider = ({ children }: { children: React.ReactNode }) => {
    const excelData = useExcelData();
    return (
        <ExcelContext.Provider value={excelData}>
            {children}
        </ExcelContext.Provider>
    );
};

export const useExcelContext = () => {
    const context = useContext(ExcelContext);
    // No lanzar error si no existe contexto, permitir uso opcional
    return context;
};

// Hook para uso obligatorio del contexto (para páginas que requieren datos)
export const useRequiredExcelContext = () => {
    const context = useContext(ExcelContext);
    if (context === undefined) {
        throw new Error('useRequiredExcelContext must be used within an ExcelProvider');
    }
    return context;
};
