import { useState } from 'react';
import * as XLSX from 'xlsx';

export const typeInfoGroup = 'info';
export const typePeriodGroup = 'period';
export const typeColumnsGroup = 'columns';

export interface ColumnExcelData {
    [key: string]: string | number;
}

export interface ColumnExcelConfig {
    id: string;             // Columna específica, Ejemplo: F, G, H, I, J, K, L
    label: string;          // Nombre de la columna
    date: string | null;    // Fecha del grupo de columnas
    points: number | null;  // Puntos del grupo de columnas;
    isNew?: boolean;        // Indica si la columna es nueva (no guardada aún)
}

export interface ColumnGroupConfig {
    id: string;         // Rango de las Columnas, Ejemplo: A1:D1, F1:L1
    color: string;      // Color de fondo del grupo de columnas
    label: string;      // Nombre del grupo de columnas
    columns: Array<ColumnExcelConfig>;
    type: 'info' | 'period' | 'columns';   // Tipo de grupo de columnas
    isNew?: boolean;    // Indica si el grupo es nuevo (no guardado aún)
}

export const useExcelData = () => {
    // Carga inicial desde localStorage
    const initialData = () => {
        const savedData = localStorage.getItem('excelData');
        return savedData ? JSON.parse(savedData) : [];
    };

    // Configuración inicial de columnas
    const initialColumnConfig = (): ColumnGroupConfig[] => {
        const savedConfig = localStorage.getItem('columnConfig');
        return savedConfig ? JSON.parse(savedConfig) : [];
    };

    // Variables de estado
    const [excelData, setExcelData] = useState<ColumnExcelData[]>(initialData());
    const [columnConfig, setColumnConfig] = useState<ColumnGroupConfig[]>(initialColumnConfig());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Función para procesar los datos del Excel
    const processExcelData = (jsonData: (string | number)[][]): ColumnExcelData[] => {
        const headers = jsonData[0] || [];
        return jsonData.slice(1).map((row) =>
            row.reduce((obj: ColumnExcelData, value, index) => {
                obj[headers[index] ?? `Column ${index + 1}`] = value;
                return obj;
            }, {})
        );
    };

    // Función para procesar la configuración de la cuarta hoja
    const processColumnConfig = (configData: (string | number)[][]): ColumnGroupConfig[] => {
        const defaultConfig: ColumnGroupConfig[] = [];
        
        if (!configData || configData.length === 0) {
            return defaultConfig;
        }

        const config: ColumnGroupConfig[] = [...defaultConfig];

        configData.forEach(row => {
            if (row && row.length >= 5) {
                // Formato: PRIMER.PERIODO|negro|#000000ff|F1:L1|7
                const [periodo, colorName, hexColor, rangeColumns, numColumns] = row;
                const columns = parseInt(numColumns?.toString() ?? '0', 10);
                
                if (isNaN(columns)) return;

                const colorNameLower = colorName?.toString().toLowerCase();
                
                if (periodo?.toString().includes('PRIMER') && colorNameLower === 'negro') {
                    // config.black = {
                    //     numColumns: columns,
                    //     rangeColumns: rangeColumns?.toString() ?? 'F1:L1',
                    //     color: hexColor?.toString() ?? '#000000ff'
                    // };
                } else if (periodo?.toString().includes('SEGUNDO') && colorNameLower === 'verde') {
                    // config.green = {
                    //     numColumns: columns,
                    //     rangeColumns: rangeColumns?.toString() ?? 'M1:T1',
                    //     color: hexColor?.toString() ?? '#92d050ff'
                    // };
                } else if (periodo?.toString().includes('TERCER') && colorNameLower === 'morado') {
                    // config.purple = {
                    //     numColumns: columns,
                    //     rangeColumns: rangeColumns?.toString() ?? 'U1:AA1',
                    //     color: hexColor?.toString() ?? '#7030a0ff'
                    // };
                }
            }
        });

        return config;
    };

    // Función para actualizar los datos
    const updateExcelData = (newData: ColumnExcelData[]) => {
        setExcelData(newData);
        localStorage.setItem('excelData', JSON.stringify(newData));
        return newData;
    };

    // Función para actualizar la configuración de columnas
    const updateColumnConfig = (newConfig: ColumnGroupConfig[]) => {
        setColumnConfig(newConfig);
        localStorage.setItem('columnConfig', JSON.stringify(newConfig));
        return newConfig;
    };

    const loadExcelFromPath = async (filePath: string): Promise<ColumnExcelData[]> => {
        try {
            setLoading(true);
            const response = await fetch(filePath);
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(data), { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: true
            });
            
            // Leer la primera hoja (datos principales)
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { 
                header: 1,
                raw: false,
                defval: '',
                blankrows: false
            }) as (string | number)[][];
            
            // Decodificar cada string en el array
            const decodedData = jsonData.map(row =>
                row.map(cell => {
                    if (typeof cell === 'string') {
                        try {
                            const bytes = new Uint8Array([...cell].map(c => c.charCodeAt(0)));
                            return new TextDecoder('utf-8').decode(bytes);
                        } catch (e) {
                            return cell;
                        }
                    }
                    return cell;
                })
            );
            
            // Procesar datos principales
            const processedData = processExcelData(decodedData);
            const updatedData = updateExcelData(processedData);
            
            // Leer configuración de la cuarta hoja (si existe)
            if (workbook.SheetNames.length >= 4) {
                try {
                    const configSheetName = workbook.SheetNames[3];
                    const configSheet = workbook.Sheets[configSheetName];
                    const configJsonData = XLSX.utils.sheet_to_json(configSheet, { 
                        header: 1,
                        raw: false,
                        defval: '',
                        blankrows: false
                    }) as (string | number)[][];
                    
                    const columnConfig = processColumnConfig(configJsonData);
                    updateColumnConfig(columnConfig);
                } catch (configError) {
                    console.warn('No se pudo leer la configuración de la cuarta hoja, usando valores por defecto');
                    // updateColumnConfig({ 
                    //     black: { numColumns: 7, rangeColumns: 'F1:L1', color: '#000000ff' },
                    //     green: { numColumns: 8, rangeColumns: 'M1:T1', color: '#92d050ff' },
                    //     purple: { numColumns: 7, rangeColumns: 'U1:AA1', color: '#7030a0ff' }
                    // });
                }
            } else {
                // updateColumnConfig({ 
                //     black: { numColumns: 7, rangeColumns: 'F1:L1', color: '#000000ff' },
                //     green: { numColumns: 8, rangeColumns: 'M1:T1', color: '#92d050ff' },
                //     purple: { numColumns: 7, rangeColumns: 'U1:AA1', color: '#7030a0ff' }
                // });
            }
            
            setError(null);
            return updatedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar el archivo Excel';
            setError(errorMessage);
            const emptyData: ColumnExcelData[] = [];
            updateExcelData(emptyData);
            return emptyData;
        } finally {
            setLoading(false);
        }
    };

    const loadExcelFromFile = async (file: File): Promise<ColumnExcelData[]> => {
        try {
            setLoading(true);
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(data), { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: true
            });
            
            // Leer la primera hoja (datos principales)
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { 
                header: 1,
                raw: false,
                defval: '',
                blankrows: false
            }) as (string | number)[][];
            
            // Decodificar cada string en el array
            const decodedData = jsonData.map(row =>
                row.map(cell => {
                    if (typeof cell === 'string') {
                        try {
                            const bytes = new Uint8Array([...cell].map(c => c.charCodeAt(0)));
                            return new TextDecoder('utf-8').decode(bytes);
                        } catch (e) {
                            return cell;
                        }
                    }
                    return cell;
                })
            );
            
            // Procesar datos principales
            const processedData = processExcelData(decodedData);
            const updatedData = updateExcelData(processedData);
            
            // Leer configuración de la cuarta hoja (si existe)
            if (workbook.SheetNames.length >= 4) {
                try {
                    const configSheetName = workbook.SheetNames[3];
                    const configSheet = workbook.Sheets[configSheetName];
                    const configJsonData = XLSX.utils.sheet_to_json(configSheet, { 
                        header: 1,
                        raw: false,
                        defval: '',
                        blankrows: false
                    }) as (string | number)[][];
                    
                    const columnConfig = processColumnConfig(configJsonData);
                    updateColumnConfig(columnConfig);
                } catch (configError) {
                    console.warn('No se pudo leer la configuración de la cuarta hoja, usando valores por defecto');
                    // updateColumnConfig({ 
                    //     black: { numColumns: 7, rangeColumns: 'F1:L1', color: '#000000ff' },
                    //     green: { numColumns: 8, rangeColumns: 'M1:T1', color: '#92d050ff' },
                    //     purple: { numColumns: 7, rangeColumns: 'U1:AA1', color: '#7030a0ff' }
                    // });
                }
            } else {
                // updateColumnConfig({ 
                //     black: { numColumns: 7, rangeColumns: 'F1:L1', color: '#000000ff' },
                //     green: { numColumns: 8, rangeColumns: 'M1:T1', color: '#92d050ff' },
                //     purple: { numColumns: 7, rangeColumns: 'U1:AA1', color: '#7030a0ff' }
                // });
            }
            
            setError(null);
            return updatedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar el archivo Excel';
            setError(errorMessage);
            const emptyData: ColumnExcelData[] = [];
            updateExcelData(emptyData);
            return emptyData;
        } finally {
            setLoading(false);
        }
    };

    return {
        excelData,
        columnConfig,
        loading,
        error,
        loadExcelFromPath,
        loadExcelFromFile
    };
};
