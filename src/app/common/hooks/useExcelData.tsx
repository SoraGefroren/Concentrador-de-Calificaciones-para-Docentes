import { useState } from 'react';
import * as XLSX from 'xlsx';
import { clearLocalStorage } from '../utils/clusterOfMethods';

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
    isEditable?: boolean | null;   // Indica si la columna es editable
    isNew?: boolean;        // Indica si la columna es nueva (no guardada aún)
}

export interface ColumnGroupConfig {
    id: string;         // Rango de las Columnas, Ejemplo: A1:D1, F1:L1
    color: string;      // Color de fondo del grupo de columnas
    label: string;      // Nombre del grupo de columnas
    isNew?: boolean;    // Indica si el grupo es nuevo (no guardado aún)
    columns: Array<ColumnExcelConfig>;          // Arreglo de columnas dentro del grupo
    type: 'info' | 'period' | 'columns' | '';   // Tipo de grupo de columnas
}

export const useExcelData = () => {

    // Carga inicial desde localStorage
    const initialExcelData = (): ColumnExcelData[] => {
        const savedData = localStorage.getItem('excelData');
        return savedData ? JSON.parse(savedData) : [];
    };

    // Configuración inicial de columnas
    const initialColumnConfig = (): ColumnGroupConfig[] => {
        const savedConfig = localStorage.getItem('columnConfig');
        return savedConfig ? JSON.parse(savedConfig) : [];
    };

    // Variables de estado
    const [error, setError] = useState<string | null>(null);
    const [excelData, setExcelData] = useState<ColumnExcelData[]>(initialExcelData());
    const [columnConfig, setColumnConfig] = useState<ColumnGroupConfig[]>(initialColumnConfig());

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

    // Función para procesar la configuración desde la hoja de Excel
    const processColumnConfig = (configData: (string | number)[][]): ColumnGroupConfig[] => {
        // Validar si tenemos datos de configuración
        if (!configData || configData.length === 0) {
            return [];
        }

        const aryConfig: ColumnGroupConfig[] = [];
        let currentGroup: ColumnGroupConfig | null = null;
        let currentColumn: ColumnExcelConfig | null = null;
        
        // Iniciar la lectura de los grupos y columnas
        let i = 0;
        while (i < configData.length) {
            // Leer el inicio de un nuevo grupo: ['Grupo', 'Nombre del Grupo']
            const rowGroupHeader = configData[i];
            if (rowGroupHeader[0] === 'Grupo') {
                // Crear nuevo grupo de columnas
                currentGroup = {
                    id: '',
                    color: '',
                    label: ((rowGroupHeader.length > 1 ? rowGroupHeader[1] : '') || '').toString(),
                    type: typeColumnsGroup,
                    columns: []
                };
                // Leer encabezados de configuración de grupo: ['', 'Columnas', 'Color', 'Tipo']
                i++;
                if ((i < configData.length)) {
                    const rowGroupConfig = configData[i];
                    if (rowGroupConfig[1] === 'Columnas' && rowGroupConfig[2] === 'Color' && rowGroupConfig[3] === 'Tipo') {
                        // Leer información de encabezados de configuración de grupo: ['', 'A:Z', '#00000', '']
                        i++;
                        if ((i < configData.length)) {
                            const rowColumnGroup = configData[i];
                            currentGroup.id = rowColumnGroup[1] ? rowColumnGroup[1].toString() : '';
                            currentGroup.color = rowColumnGroup[2] ? rowColumnGroup[2].toString() : '';
                            const myTypeGroup = rowColumnGroup[3] ? rowColumnGroup[3].toString() : '';
                            if (myTypeGroup === typeInfoGroup
                                || myTypeGroup === typePeriodGroup
                                || myTypeGroup === typeColumnsGroup) {
                                currentGroup.type = myTypeGroup;
                            }
                            // Iniciar la lectura de las columnas dentro del grupo
                            i++;
                            let bDotsFound = false;
                            while (!bDotsFound && (i < configData.length)) {
                                // Leer el inicio de una nueva columna: ['Encabezado', 'Nombre de la Columna']
                                const rowExcelHeader = configData[i];
                                if (rowExcelHeader[2] === 'Encabezado') {
                                    // Crear nueva columna de configuración
                                    currentColumn = {
                                        id: '',
                                        date: '',
                                        points: null,
                                        label: ((rowExcelHeader.length > 1 ? rowExcelHeader[3] : '') || '').toString(),
                                    };
                                    // Leer encabezados de datos de columna: ['', '', '', 'Columna', 'Fecha', 'Puntos', 'Editable'] o ['', '', '', 'Columna', 'Fecha', 'Puntos']
                                    i++;
                                    if ((i < configData.length)) {
                                        const rowExcelConfig = configData[i];
                                        // Detectar encabezados de datos de columna (con o sin campo Editable)
                                        if (rowExcelConfig[3] === 'Columna' && rowExcelConfig[4] === 'Fecha' && rowExcelConfig[5] === 'Puntos' && rowExcelConfig[6] === 'Editable') {
                                            // Leer información de encabezados de datos de columna: ['', '', '', 'G10', '19-ENE-22', '0', 'SI'] o ['', '', '', 'G10', '19-ENE-22', '0']
                                            i++;
                                            if ((i < configData.length)) {
                                                const rowColumnExcel = configData[i];
                                                currentColumn.id = rowColumnExcel[3] ? rowColumnExcel[3].toString() : '';
                                                currentColumn.date = rowColumnExcel[4] ? rowColumnExcel[4].toString() : '';
                                                currentColumn.points = rowColumnExcel[5] || rowColumnExcel[5] == '0'
                                                    ? parseInt(rowColumnExcel[5] ? rowColumnExcel[5].toString() : '0')
                                                    : null;

                                                // Manejar el campo isEditable si existe
                                                if (rowExcelConfig[6] === 'Editable' && rowColumnExcel[6]) {
                                                    const editableValue = rowColumnExcel[6].toString().toUpperCase();
                                                    currentColumn.isEditable = editableValue === 'SI' || editableValue === 'TRUE' || editableValue === '1';
                                                } else {
                                                    // Valor por defecto si no se especifica
                                                    currentColumn.isEditable = true;
                                                }
                                                
                                                // Agregar la columna actual al grupo
                                                currentGroup.columns.push(currentColumn);
                                            }
                                        }
                                    }
                                }
                                // Buscar puntos de suspensión: ['...']
                                i++;
                                const rowExcelDots = configData[i];
                                if (rowExcelDots[0] === '...') {
                                    bDotsFound = true;
                                }
                            }
                            // Agregar el grupo actual al arreglo de configuración
                            aryConfig.push(currentGroup);
                        }
                    }
                }
            }
            i++;
        }
        
        // Devolver la configuración procesada
        return aryConfig;
    };

    /*
     * Función para actualizar los datos y la configuración en el estado y en localStorage
     */
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

    /*
     * Función para leer un archivo Excel y actualizar los datos y la configuración
     */
    const loadExcelFromFile = async (file: File): Promise<{
        columnConfig: ColumnGroupConfig[];
        excelData: ColumnExcelData[];
    }> => {
        try {
            // Leer el archivo como un array buffer
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(new Uint8Array(data), { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: true
            });
            const sheetLength = workbook.SheetNames.length;
            
            // Leer la primera hoja (datos principales)
            const sheetNameExcelData = workbook.SheetNames[0];
            const sheetExcelData = workbook.Sheets[sheetNameExcelData];
            const jsonExcelData = XLSX.utils.sheet_to_json(sheetExcelData, { 
                header: 1,
                raw: false,
                defval: '',
                blankrows: false
            }) as (string | number)[][];
            
            // Decodificar cada string en el array
            const decodedExcelData = jsonExcelData.map(row =>
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
            const processedExcelData = processExcelData(decodedExcelData);
            const updatedExcelData = updateExcelData(processedExcelData);
            let updatedColumnConfig: ColumnGroupConfig[] = [];

            // Leer configuración de la cuarta hoja (si existe)
            if (sheetLength > 1) {
                const lastSheet = sheetLength - 1;
                const sheetConfigName = workbook.SheetNames[lastSheet];
                const sheetConfigData = workbook.Sheets[sheetConfigName];
                const jsonConfigData = XLSX.utils.sheet_to_json(sheetConfigData, { 
                    header: 1,
                    raw: false,
                    defval: '',
                    blankrows: false
                }) as (string | number)[][];

                // Decodificar cada string en el array
                const decodedConfigData = jsonConfigData.map(row =>
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
                const processedColumnConfig = processColumnConfig(decodedConfigData);
                updatedColumnConfig = updateColumnConfig(processedColumnConfig);
            }

            // Limpiar cualquier error previo
            setError(null);
            return {
                columnConfig: updatedColumnConfig,
                excelData: updatedExcelData
            };
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar el archivo Excel');
            const emptyColumnConfigData: ColumnGroupConfig[] = [];
            const emptyExcelData: ColumnExcelData[] = [];
            updateColumnConfig(emptyColumnConfigData);
            updateExcelData(emptyExcelData);
            return {
                columnConfig: emptyColumnConfigData,
                excelData: emptyExcelData
            };
        }
    };

    // Función para reiniciar/limpiar todos los datos
    const clearAllData = () => {
        // También limpiar localStorage
        clearLocalStorage();
        // Reiniciar estados
        setColumnConfig([]);
        setExcelData([]);
        setError(null);
    };

    return {
        error,
        excelData,
        columnConfig,
        loadExcelFromFile,
        clearAllData
    };
};
