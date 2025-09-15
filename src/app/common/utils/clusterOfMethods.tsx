import FileUploadEvent from "../../features/adds/FileUploadEvent";
import { DEFAULT_ACTIVITY_TEMPLATES, DEFAULT_FIXED_LEFT_HEADERS_INFO, DEFAULT_FIXED_RIGHT_HEADERS_COLS, DEFAULT_FIXED_RIGHT_HEADERS_INFO } from "../../features/configuration/types/HeaderConfiguration";
import { useExcelData } from "../hooks/useExcelData";
import { ColumnExcelConfig, ColumnGroupConfig, typeColumnsGroup, typeInfoGroup, typePeriodGroup } from "../hooks/useExcelData";

// Función para generar una configuración de columnas por defecto
export const getDefaultColumnConfig = (): ColumnGroupConfig[] => {
    // Preparar arreglo para la configuración por defecto
    const aryDefaultConfig: ColumnGroupConfig[] = [];

    // Colores para los períodos
    const periodColors = {
      black: '#151c25ff',
      green: '#059669', 
      purple: '#7c3aed'
    };

    // 1. Columnas Fijas Izquierdas
    const leftFixedColumns: ColumnExcelConfig[] = DEFAULT_FIXED_LEFT_HEADERS_INFO
      .map((header) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null
      }));
    aryDefaultConfig.push({
      id: '',
      color: '',
      label: 'Información del Estudiante',
      type: typeInfoGroup,
      columns: leftFixedColumns
    });

    // 2. Períodos de Actividades (black, green, purple)
    Object.entries(DEFAULT_ACTIVITY_TEMPLATES)
      .forEach(([colorKey, template]) => {
        const periodColumns: ColumnExcelConfig[] = template.activities
          .map((activity) => ({
            id: '',
            label: activity.name,
            date: activity.date || null,
            points: activity.points || null
          }));
        aryDefaultConfig.push({
          id: '',
          color: periodColors[colorKey as keyof typeof periodColors],
          label: template.periodName,
          type: typePeriodGroup,
          columns: periodColumns
        });
      });

    // 3. Columnas Fijas Derechas
    const rightFixedColumnsCols: ColumnExcelConfig[] = DEFAULT_FIXED_RIGHT_HEADERS_COLS
      .map((header) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null
      }));
    aryDefaultConfig.push({
      id: '',
      color: '',
      label: 'Cálculos y Totales',
      type: typeColumnsGroup,
      columns: rightFixedColumnsCols
    });

    // 3. Columnas Fijas Derechas
    const rightFixedColumnsInfo: ColumnExcelConfig[] = DEFAULT_FIXED_RIGHT_HEADERS_INFO
      .map((header) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null
      }));
    aryDefaultConfig.push({
      id: '',
      color: '',
      label: 'Cálculos y Totales',
      type: typeInfoGroup,
      columns: rightFixedColumnsInfo
    });
    
    // Devolver la configuración generada
    return aryDefaultConfig;
};

// Funciones de utilidad para calcular rangos de columnas Excel
export const getExcelColumnName = (columnNumber: number): string => {
  let columnName = '';
  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }
  return columnName;
};

// Funciones de utilidad para limpiar configuraciones previas
export const clearLocalStorage = (): void => {
    // Limpiar cualquier configuración previa
    localStorage.removeItem('fileRoute');
    localStorage.removeItem('excelData');
    localStorage.removeItem('columnConfig');
};

// Funciones de utilidad para limpiar configuraciones previas
export const updatedLocalStorage = async (context: ReturnType<typeof useExcelData> | undefined, event: FileUploadEvent): Promise<boolean> => {
    let processIsOk = true;
    try {
      clearLocalStorage();
      const loadExcelFromFile = context?.loadExcelFromFile;
      const file = (event.files.length > 0) ? event.files[0] : null;
      // Verificar que el contexto y el archivo estén disponibles
      if (!file || !context || !loadExcelFromFile) {
          processIsOk = false;
      } else {
        // Cargar los datos del archivo Excel usando el método del contexto
        await loadExcelFromFile(file);
        // Guardamos los datos en localStorage (esto ya se hace dentro de loadExcelFromFile)
        localStorage.setItem('fileRoute', 'true');
      }
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      processIsOk = false;
      clearLocalStorage();
    }
    return processIsOk;
};

// Función para formatear los campos de las columnas
export const formatFieldName = (fieldName: string): string => {
    return fieldName.replace(/[ÁÉÍÓÚÜáéíóúüÑñ]/g, '�');
}