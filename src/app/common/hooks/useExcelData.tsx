import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelData {
    [key: string]: any;
}

export const useExcelData = () => {
    // Variables de estado
    const [excelData /* Variable */, setExcelData /* Método de actualización */] = useState<ExcelData[]>([] /* Valor inicial */);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Funcion que se ejecuta cuando el componente se monta, ejecuta cosas fuera del componente
    const loadExcelFromPath = async (filePath: string) => {
        try {
            setLoading(true);
            // Obtén el archivo Excel desde la ruta
            const response = await fetch(filePath);
            const data = await response.arrayBuffer();
            // Lee el archivo Excel
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            // Convierte las primeras filas en encabezados (si tu Excel tiene encabezados)
            const headers = jsonData[0] || [];
            const rows = jsonData.slice(1).map((row) =>
                    row.reduce((obj: ExcelData, value, index) => {
                    obj[headers[index] || `Column ${index + 1}`] = value;
                    return obj;
                }, {})
            );
            // Actualiza el estado con los datos leídos
            setExcelData(rows);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar el archivo Excel');
            setExcelData([]);
        } finally {
            setLoading(false);
        }
    };

    const loadExcelFromFile = async (file: File) => {
        try {
            setLoading(true);
            const data = await file.arrayBuffer();
            
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const headers = jsonData[0] || [];
            const rows = jsonData.slice(1).map((row) =>
                row.reduce((obj: ExcelData, value, index) => {
                obj[headers[index] || `Column ${index + 1}`] = value;
                return obj;
                }, {})
            );

            setExcelData(rows);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar el archivo Excel');
            setExcelData([]);
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