import FileUploadEvent from "../../features/adds/FileUploadEvent";
import { DEFAULT_ACTIVITY_TEMPLATES, DEFAULT_FIXED_LEFT_HEADERS_COLS, DEFAULT_FIXED_LEFT_HEADERS_INFO, DEFAULT_FIXED_RIGHT_HEADERS_COLS, DEFAULT_FIXED_RIGHT_HEADERS_INFO } from "../../features/configuration/types/HeaderConfiguration";
import { ColumnExcelData, useExcelData } from "../hooks/useExcelData";
import { ColumnExcelConfig, ColumnGroupConfig, typeColumnsGroup, typeInfoGroup, typePeriodGroup, TipoValor } from "../hooks/useExcelData";

// Función para generar una configuración de columnas por defecto
export const getDefaultColumnConfig = (): ColumnGroupConfig[] => {
    // Preparar arreglo para la configuración por defecto
    const aryDefaultConfig: ColumnGroupConfig[] = [];

    // 1. Columnas Fijas Izquierdas
    const leftFixedColumnsInfo: ColumnExcelConfig[] = DEFAULT_FIXED_LEFT_HEADERS_INFO
      .map((header: any) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null,
        isEditable: header.editable || false,  // Las columnas de información generalmente no son editables
        tipoValor: (header.tipoValor as TipoValor) || null,
        formula: header.formula || null
      }));
    aryDefaultConfig.push({
      id: '',
      color: '',
      label: 'Información del Estudiante',
      type: typeInfoGroup,
      columns: leftFixedColumnsInfo
    });

    // 2. Columnas Fijas Izquierdas
    const leftFixedColumnsCols: ColumnExcelConfig[] = DEFAULT_FIXED_LEFT_HEADERS_COLS
      .map((header: any) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null,
        isEditable: header.editable || false,  // Las columnas de información generalmente no son editables
        tipoValor: (header.tipoValor as TipoValor) || null,
        formula: header.formula || null
      }));
    aryDefaultConfig.push({
      id: '',
      color: '',
      label: 'Información del Estudiante',
      type: typeColumnsGroup,
      columns: leftFixedColumnsCols
    });

    // 3. Períodos de Actividades (black, green, purple)
    Object.entries(DEFAULT_ACTIVITY_TEMPLATES)
      .forEach(([colorKey, template]) => {
        const periodColumns: ColumnExcelConfig[] = template.activities
          .map((activity: any) => ({
            id: '',
            label: activity.name,
            date: activity.date || null,
            points: activity.points || null,
            isEditable: activity.editable || false,  // Las columnas de actividades son editables por defecto
            tipoValor: (activity.tipoValor as TipoValor) || null,
            formula: activity.formula || null
          }));
        aryDefaultConfig.push({
          id: '',
          color: template.color || '',
          label: template.periodName,
          type: typePeriodGroup,
          columns: periodColumns
        });
      });

    // 4. Columnas Fijas Derechas
    const rightFixedColumnsCols: ColumnExcelConfig[] = DEFAULT_FIXED_RIGHT_HEADERS_COLS
      .map((header: any) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null,
        isEditable: header.editable || false,
        tipoValor: (header.tipoValor as TipoValor) || null,
        formula: header.formula || null
      }));
    aryDefaultConfig.push({
      id: '',
      color: '',
      label: 'Cálculos y Totales',
      type: typeColumnsGroup,
      columns: rightFixedColumnsCols
    });

    // 5. Columnas Fijas Derechas Info
    const rightFixedColumnsInfo: ColumnExcelConfig[] = DEFAULT_FIXED_RIGHT_HEADERS_INFO
      .map((header: any) => ({
        id: '',
        label: header.name,
        date: header.date || null,
        points: header.points || null,
        isEditable: header.editable || false,
        tipoValor: (header.tipoValor as TipoValor) || null,
        formula: header.formula || null
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

// Funciones de utilidad para manejar fechas en formato DD-MMM-AA
export const validateDateFormat = (dateString: string): boolean => {
    if (!dateString) return true; // Permitir vacío
    
    const datePattern = /^\d{2}-[A-Z]{3}-\d{2}$/;
    if (!datePattern.test(dateString.toUpperCase())) return false;
    
    // Validar que el mes sea válido
    const parts = dateString.toUpperCase().split('-');
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parts[1];
    const year = parseInt(parts[2]);
    
    // Validar día (1-31)
    if (day < 1 || day > 31) return false;
    
    // Validar año (00-99)
    if (year < 0 || year > 99) return false;
    
    // Validar mes
    const validMonths = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
                         'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    if (!validMonths.includes(month)) return false;
    
    return true;
};

export const formatDateFromExcel = (dateString: string): string => {
    if (!dateString) return '';
    
    // Si ya está en formato correcto, devolverlo
    if (validateDateFormat(dateString)) return dateString;
    
    // Intentar parsear diferentes formatos
    const monthsMap: { [key: string]: string } = {
        'ENE': 'ENE', 'ENERO': 'ENE', 'JANUARY': 'ENE', 'JAN': 'ENE', '01': 'ENE', '1': 'ENE',
        'FEB': 'FEB', 'FEBRERO': 'FEB', 'FEBRUARY': 'FEB', '02': 'FEB', '2': 'FEB',
        'MAR': 'MAR', 'MARZO': 'MAR', 'MARCH': 'MAR', '03': 'MAR', '3': 'MAR',
        'ABR': 'ABR', 'ABRIL': 'ABR', 'APRIL': 'ABR', 'APR': 'ABR', '04': 'ABR', '4': 'ABR',
        'MAY': 'MAY', 'MAYO': 'MAY', '05': 'MAY', '5': 'MAY',
        'JUN': 'JUN', 'JUNIO': 'JUN', 'JUNE': 'JUN', '06': 'JUN', '6': 'JUN',
        'JUL': 'JUL', 'JULIO': 'JUL', 'JULY': 'JUL', '07': 'JUL', '7': 'JUL',
        'AGO': 'AGO', 'AGOSTO': 'AGO', 'AUGUST': 'AGO', 'AUG': 'AGO', '08': 'AGO', '8': 'AGO',
        'SEP': 'SEP', 'SEPTIEMBRE': 'SEP', 'SEPTEMBER': 'SEP', '09': 'SEP', '9': 'SEP',
        'OCT': 'OCT', 'OCTUBRE': 'OCT', 'OCTOBER': 'OCT', '10': 'OCT',
        'NOV': 'NOV', 'NOVIEMBRE': 'NOV', 'NOVEMBER': 'NOV', '11': 'NOV',
        'DIC': 'DIC', 'DICIEMBRE': 'DIC', 'DECEMBER': 'DIC', 'DEC': 'DIC', '12': 'DIC'
    };
    
    let formatted = dateString.replace(/\s+/g, '').toUpperCase();
    
    // Si contiene "/" o "-", intentar parsear
    if (formatted.includes('/') || formatted.includes('-')) {
        const parts = formatted.split(/[/-]/);
        
        if (parts.length >= 2) {
            const day = parts[0].padStart(2, '0');
            let month = parts[1];
            const year = parts[2] ? parts[2].slice(-2) : '';
            
            // Convertir mes si es numérico o nombre completo
            if (monthsMap[month]) {
                month = monthsMap[month];
            }
            
            if (year && month.length === 3) {
                formatted = `${day}-${month}-${year}`;
            }
        }
    }
    
    return formatted;
};

// Funciones de utilidad para limpiar configuraciones previas
export const clearLocalStorage = (): void => {
    // Limpiar cualquier configuración previa
    localStorage.removeItem('fileRoute');
    localStorage.removeItem('excelData');
    localStorage.removeItem('columnConfig');
};

// Función para limpiar completamente los datos incluyendo el contexto React
export const clearAllDataCompletely = (context: ReturnType<typeof useExcelData> | undefined): void => {
    // Limpiar el estado del contexto React si está disponible
    if (context?.clearAllData) {
      context.clearAllData();
    } else {
      // Limpiar localStorage primero
      clearLocalStorage();
    }
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
      clearAllDataCompletely(context);
      processIsOk = false;
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

/*
 * FUNCIONES PARA TRATAR CON LA CONFIGURACIÓN DE GRUPOS DE COLUMNAS
 */
// Calcular automáticamente los rangos de los grupos de columnas
export const recalculateConfigRanges = (aryColumnConfig: ColumnGroupConfig[], setConfigFun?: null | ((config: ColumnGroupConfig[]) => void)): ColumnGroupConfig[] => {
  // Redefinir el ID de los grupos de columnas
  let currentColumnIndex = 1;
  // Recorrer cada grupo de columnas
  for (let x = 0; x < aryColumnConfig.length; x++) {
    // Obtener la configuración del grupo actual
    const colsConfig = aryColumnConfig[x];
    const firstColIndex = currentColumnIndex;
    const lastColIndex = currentColumnIndex + (colsConfig.columns.length - 1);
    // Recorrer cada una de las columnas del grupo
    for (let y = 0; y < colsConfig.columns.length; y++) {
      // Redefinir el ID de las columnas de los grupos de columnas
      aryColumnConfig[x].columns[y].id = getExcelColumnName(currentColumnIndex);
      currentColumnIndex += 1;
    }
    // Redefinir el ID del grupo de columnas
    aryColumnConfig[x].id = getExcelColumnName(firstColIndex) + ':' + getExcelColumnName(lastColIndex);
  }
  // Valida si debe actualizar la configuración
  if (setConfigFun) {
    // Actualizar la configuración de los grupos de columnas
    setConfigFun(aryColumnConfig ? [...aryColumnConfig] : []);
  }
  // Devuelve los indices de los primeros grupos sin ID
  return aryColumnConfig;
};

// Función para generar configuración por defecto
export const generateDefaultColumnConfig = (): ColumnGroupConfig[] => {

  // Generar configuración por defecto
  const newAryColumnConfig = getDefaultColumnConfig();

  // Calcular automáticamente los rangos de los grupos de columnas
  const aryDefaultConfig = recalculateConfigRanges(newAryColumnConfig, null);

  // Devolver la configuración generada
  return aryDefaultConfig;
};