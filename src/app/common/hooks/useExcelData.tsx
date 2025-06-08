import { useState } from 'react';
import * as XLSX from 'xlsx';

export interface ExcelData {
    [key: string]: string | number;
}

export interface ColumnConfig {
    black: number;
    green: number;
    purple: number;
}

export const useExcelData = () => {
    // Carga inicial desde localStorage
    const initialData = () => {
        const savedData = localStorage.getItem('excelData');
        return savedData ? JSON.parse(savedData) : [];
    };

    // Configuración inicial de columnas
    const initialColumnConfig = (): ColumnConfig => {
        const savedConfig = localStorage.getItem('columnConfig');
        return savedConfig ? JSON.parse(savedConfig) : { black: 7, green: 8, purple: 7 };
    };

    // Variables de estado
    const [excelData, setExcelData] = useState<ExcelData[]>(initialData());
    const [columnConfig, setColumnConfig] = useState<ColumnConfig>(initialColumnConfig());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);    // Función para procesar los datos del Excel
    const processExcelData = (jsonData: any[][]): ExcelData[] => {
        const headers = jsonData[0] || [];
        return jsonData.slice(1).map((row) =>
            row.reduce((obj: ExcelData, value, index) => {
                obj[headers[index] || `Column ${index + 1}`] = value;
                return obj;
            }, {})
        );
    };

    // Función para procesar la configuración de la cuarta hoja
    const processColumnConfig = (configData: any[][]): ColumnConfig => {
        const defaultConfig: ColumnConfig = { black: 7, green: 8, purple: 7 };
        
        if (!configData || configData.length === 0) {
            return defaultConfig;
        }

        const config: ColumnConfig = { ...defaultConfig };

        configData.forEach(row => {
            if (row && row.length >= 3) {
                const [periodo, numColumns, color] = row;
                const columns = parseInt(numColumns?.toString() || '0', 10);
                
                if (isNaN(columns)) return;

                const colorLower = color?.toString().toLowerCase();
                
                if (periodo?.toString().includes('PRIMER') && colorLower === 'negro') {
                    config.black = columns;
                } else if (periodo?.toString().includes('SEGUNDO') && colorLower === 'verde') {
                    config.green = columns;
                } else if (periodo?.toString().includes('TERCER') && colorLower === 'morado') {
                    config.purple = columns;
                }
            }
        });

        return config;
    };    // Función para actualizar los datos
    const updateExcelData = (newData: ExcelData[]) => {
        setExcelData(newData);
        localStorage.setItem('excelData', JSON.stringify(newData));
        return newData;
    };

    // Función para actualizar la configuración de columnas
    const updateColumnConfig = (newConfig: ColumnConfig) => {
        setColumnConfig(newConfig);
        localStorage.setItem('columnConfig', JSON.stringify(newConfig));
        return newConfig;
    };
      const loadExcelFromPath = async (filePath: string): Promise<ExcelData[]> => {
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
                    updateColumnConfig({ black: 7, green: 8, purple: 7 });
                }
            } else {
                updateColumnConfig({ black: 7, green: 8, purple: 7 });
            }
            
            setError(null);
            return updatedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar el archivo Excel';
            setError(errorMessage);
            const emptyData: ExcelData[] = [];
            updateExcelData(emptyData);
            return emptyData;
        } finally {
            setLoading(false);
        }
    };
    const loadExcelFromFile = async (file: File): Promise<ExcelData[]> => {
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
                    updateColumnConfig({ black: 7, green: 8, purple: 7 });
                }
            } else {
                updateColumnConfig({ black: 7, green: 8, purple: 7 });
            }
            
            setError(null);
            return updatedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar el archivo Excel';
            setError(errorMessage);
            const emptyData: ExcelData[] = [];
            updateExcelData(emptyData);
            return emptyData;
        } finally {
            setLoading(false);
        }
    };    return {
        excelData,
        columnConfig,
        loading,
        error,
        loadExcelFromPath,
        loadExcelFromFile
    };
};