import FileUploadEvent from "../../features/adds/FileUploadEvent";
import { DEFAULT_ACTIVITY_TEMPLATES, DEFAULT_FIXED_LEFT_HEADERS_INFO, DEFAULT_FIXED_RIGHT_HEADERS_COLS, DEFAULT_FIXED_RIGHT_HEADERS_INFO } from "../../features/configuration/types/HeaderConfiguration";
import { ColumnExcelData, useExcelData } from "../hooks/useExcelData";
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
        points: header.points || null,
        isEditable: header.editable || false  // Las columnas de información generalmente no son editables
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
            points: activity.points || null,
            isEditable: activity.editable || false  // Las columnas de actividades son editables por defecto
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
        points: header.points || null,
        isEditable: header.editable || false
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
        points: header.points || null,
        isEditable: header.editable || false
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
// Función para formatear valores de fecha desde Excel
export const formatDateValue = (value: string | number | null | undefined): string => {
    // Si el valor es nulo, undefined o una cadena vacía, se retorna una cadena vacía
    // if (!value || value === 'Fecha') return '';
    if (!value) return '';
    // Tratar como número o string que representa un número
    try {
        // Si es un número o un string que representa un número, se asume formato Excel
        if (!isNaN(Number(value))) {
            const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
            const date = new Date(excelEpoch.getTime() + Number(value) * 24 * 60 * 60 * 1000);
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        }
        // Si es un string que parece una fecha como '27-Aug-21'
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
            return `${String(parsedDate.getDate()).padStart(2, '0')}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`;
        }
        // Si no se puede parsear, se devuelve tal cual
        return String(value);
    } catch {
        return String(value);
    }
};

// Función para formatear los headers de las columnas (igual que en AlumnadoCatalogo y StudentDetailsModal)
export const formatColumnHeader = (columnName: string): string => {
    // Casos especiales para ciertos campos
    const specialCases: { [key: string]: string } = {
        'ID': 'ID',
        'CORREO.ELECTONICO ': 'Correo Electrónico',
        'CORREO.ELECTONICO': 'Correo Electrónico',
        'SUMA.PORCENTAJE.ACTIVIDADES': 'Suma % Actividades',
        'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES': 'Total Alcanzado % Actividades',
        'PARTICIPACIÓN': 'Participación',
        'TOTAL.ALCANZADO': 'Total Alcanzado',
        'CALIFICACION': 'Calificación'
    };

    // Si hay un caso especial definido, usarlo
    if (specialCases[columnName]) {
        return specialCases[columnName];
    }

    // Patrón: texto-dd-mmm-yy (ejemplo: "Conceptos Basicos Probabilidad-05-nov-21")
    const dateMatch = columnName.match(/^(.+)-(\d{1,2})-([a-z]{3})-(\d{2})$/i);
    // Si se detecto y formateo una fecha al final del texto, entonces...
    if (dateMatch) {
        const [, textPart, day, month, year] = dateMatch;
        // Formatear la parte del texto (reemplazar puntos por espacios y capitalizar)
        const formattedText = textPart
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        // Formatear la fecha: dd/mmm/yy
        const formattedDate = `${day}/${month}/${year}`;
        return `${formattedText.replace('-', ' ').replace('-', ' ').replace('  ', ' ')} ${formattedDate}`;
    }

    // Formateo general para otros casos
    return columnName
        .split('.') // Dividir por puntos
        .map(word => word.toLowerCase()) // Convertir a minúsculas
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizar primera letra
        .join(' ')
        .replace('-', ' ')
        .replace('-', ' ')
        .replace('  ', ' '); // Unir con espacios
};

// Función para obtener las secciones (izquierda, centro, derecha)
export const getSectionsColumnsConfig = (columnConfig: ColumnGroupConfig[]): {
    left: ColumnGroupConfig[];
    center: ColumnGroupConfig[];
    right: ColumnGroupConfig[];
  } => {
  // Inicializar resultado con secciones vacías
  const result: {
    left: ColumnGroupConfig[];
    center: ColumnGroupConfig[];
    right: ColumnGroupConfig[];
  } = {
    left: [],
    center: [],
    right: []
  };
  // Variable para rastrear si ya se encontró un grupo de tipo período
  let foundNonPeriod = false;
  // Recorrer la configuración de columnas y distribuir en secciones
  columnConfig.forEach(groupConfig => {
    if (groupConfig.type !== typePeriodGroup) {
      if (!foundNonPeriod) {
        result.left.push(groupConfig);
      } else {
        result.right.push(groupConfig);
      }
    } else {
      foundNonPeriod = true;
      result.center.push(groupConfig);
    }
  });
  // Devolver el resultado con las tres secciones
  return result;
};

// Función para obtener las columnas por grupo de color
export const getExcelDataFromColumns = (vExcelData: ColumnExcelData, vGroupColumns: string[]): ColumnExcelData => {
    // Crear un array con un solo objeto que contiene las columnas filtradas
    const availableExcelData: ColumnExcelData = {};
    // Filtrar todas las columnas excluyendo las de las secciones primera y tercera
    vGroupColumns.forEach(columnKey => {
        if (columnKey in vExcelData) {
            // Asignar el valor si la columna existe
            availableExcelData[columnKey] = vExcelData[columnKey];
        } else {
            // Asignar un valor predeterminado si la columna no existe
            availableExcelData[columnKey] = '';
        }
    });
    // Obtener las columnas del rango específico para este grupo
    return availableExcelData;
};