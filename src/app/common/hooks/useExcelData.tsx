import { useState } from 'react';
import * as XLSX from 'xlsx';

export interface ExcelData {
    [key: string]: string | number;
}

export const useExcelData = () => {
    // Carga inicial desde localStorage
    const initialData = () => {
        const savedData = localStorage.getItem('excelData');
        return savedData ? JSON.parse(savedData) : [];
    };

    // Variables de estado
    const [excelData, setExcelData] = useState<ExcelData[]>(initialData());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Función para procesar los datos del Excel
    const processExcelData = (jsonData: any[][]): ExcelData[] => {
        const headers = jsonData[0] || [];
        return jsonData.slice(1).map((row) =>
            row.reduce((obj: ExcelData, value, index) => {
                obj[headers[index] || `Column ${index + 1}`] = value;
                return obj;
            }, {})
        );
    };

    // Función para actualizar los datos
    const updateExcelData = (newData: ExcelData[]) => {
        setExcelData(newData);
        localStorage.setItem('excelData', JSON.stringify(newData));
        return newData;
    };
    
    const loadExcelFromPath = async (filePath: string): Promise<ExcelData[]> => {
        try {
            setLoading(true);
            const response = await fetch(filePath);
            const data = await response.arrayBuffer();
            // Convertir ArrayBuffer a Uint8Array y decodificar como UTF-8
            const decoder = new TextDecoder('utf-8');
            const workbook = XLSX.read(new Uint8Array(data), { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: true
            });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            // Asegurarnos de que los datos se lean como texto
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
                            return decoder.decode(new TextEncoder().encode(cell));
                        } catch (e) {
                            return cell;
                        }
                    }
                    return cell;
                })
            );
            
            const processedData = processExcelData(decodedData);
            const updatedData = updateExcelData(processedData);
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
            // Convertir ArrayBuffer a Uint8Array y decodificar como UTF-8
            const decoder = new TextDecoder('utf-8');
            const workbook = XLSX.read(new Uint8Array(data), { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: true
            });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            // Asegurarnos de que los datos se lean como texto
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
                            return decoder.decode(new TextEncoder().encode(cell));
                        } catch (e) {
                            return cell;
                        }
                    }
                    return cell;
                })
            );
            
            const processedData = processExcelData(decodedData);
            const updatedData = updateExcelData(processedData);
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

    return {
        excelData,
        loading,
        error,
        loadExcelFromPath,
        loadExcelFromFile
    };
};