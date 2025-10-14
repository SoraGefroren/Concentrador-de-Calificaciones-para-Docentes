/**
 * Traductor de Fórmulas: Sistema Dual
 * 
 * Este módulo traduce entre dos formatos:
 * 1. Fórmula Personalizada: [Columna], [Columna:Valor], [Columna:Puntos]
 * 2. Fórmula Excel Nativa: =A4, =$A$2, etc.
 * 
 * Propósito:
 * - Permite que el archivo Excel funcione independientemente
 * - Mantiene compatibilidad con el sistema de gestión
 */

import type { ColumnGroupConfig } from '../hooks/useExcelData';

/**
 * Construye un mapa de nombres de columna → letra Excel
 * Ejemplo: "NOMBRE" → "B", "EXAMEN1" → "E"
 */
const buildColumnLetterMap = (columnConfig: ColumnGroupConfig[]): Map<string, string> => {
  const columnMap = new Map<string, string>();
  
  columnConfig.forEach(group => {
    group.columns.forEach(col => {
      if (col.label && col.id) {
        // El ID ya es la letra de la columna (ej: "A", "B", "C")
        columnMap.set(col.label, col.id);
      }
    });
  });
  
  return columnMap;
};

/**
 * Traduce fórmula personalizada → Fórmula Excel
 * 
 * @param customFormula - Fórmula personalizada (ej: "[Examen1] / [Examen1:Puntos] * 100")
 * @param rowNumber - Número de fila del estudiante en Excel (ej: 4, 5, 6...)
 * @param columnConfig - Configuración completa de columnas
 * @returns Fórmula Excel (ej: "=E4/$E$2*100")
 * 
 * Ejemplos:
 * - "[PRESENTACION-ENCUADRE]" → "F4" (fila del estudiante)
 * - "[PRESENTACION-ENCUADRE:Puntos]" → "$F$2" (fila fija de puntos)
 * - "[Examen1] / [Examen1:Puntos] * 100" → "=E4/$E$2*100"
 */
export const translateToExcelFormula = (
  customFormula: string,
  rowNumber: number,
  columnConfig: ColumnGroupConfig[]
): string => {
  if (!customFormula || customFormula.trim() === '') {
    return '';
  }

  // Construir mapa de columnas
  const columnMap = buildColumnLetterMap(columnConfig);
  
  let excelFormula = customFormula;
  
  // PASO 1: Reemplazar [Columna:Puntos] → $LETRA$2 (referencia absoluta a fila de puntos)
  excelFormula = excelFormula.replace(
    /\[([^\]]+):Puntos\]/g,
    (_, columnName) => {
      const columnLetter = columnMap.get(columnName.trim());
      
      if (!columnLetter) {
        console.warn(`Columna "${columnName}" no encontrada en la configuración al traducir fórmula`);
        return '0'; // Valor por defecto si no se encuentra
      }
      
      // Referencia absoluta: fila 2 siempre contiene los puntos
      return `$${columnLetter}$2`;
    }
  );
  
  // PASO 2: Reemplazar [Columna:Valor] → LETRA + rowNumber (referencia relativa)
  excelFormula = excelFormula.replace(
    /\[([^\]]+):Valor\]/g,
    (_, columnName) => {
      const columnLetter = columnMap.get(columnName.trim());
      
      if (!columnLetter) {
        console.warn(`Columna "${columnName}" no encontrada en la configuración al traducir fórmula`);
        return '0';
      }
      
      // Referencia relativa a la fila del estudiante
      return `${columnLetter}${rowNumber}`;
    }
  );
  
  // PASO 3: Reemplazar [Columna] (sin especificar tipo) → LETRA + rowNumber
  // Por defecto, [Columna] equivale a [Columna:Valor]
  excelFormula = excelFormula.replace(
    /\[([^\]]+)\]/g,
    (_, columnName) => {
      const columnLetter = columnMap.get(columnName.trim());
      
      if (!columnLetter) {
        console.warn(`Columna "${columnName}" no encontrada en la configuración al traducir fórmula`);
        return '0';
      }
      
      // Referencia relativa a la fila del estudiante
      return `${columnLetter}${rowNumber}`;
    }
  );
  
  // PASO 4: Agregar el símbolo "=" al inicio si no lo tiene
  if (!excelFormula.startsWith('=')) {
    excelFormula = `=${excelFormula}`;
  }
  
  return excelFormula;
};

/**
 * Traduce fórmula Excel → Fórmula personalizada
 * 
 * @param excelFormula - Fórmula Excel (ej: "=E4/$E$2*100")
 * @param columnConfig - Configuración completa de columnas
 * @returns Fórmula personalizada (ej: "[Examen1] / [Examen1:Puntos] * 100")
 * 
 * NOTA: Esta función es para importación futura. Por ahora, las fórmulas
 * se leen de la hoja de configuración, no de las celdas.
 */
export const translateFromExcelFormula = (
  excelFormula: string,
  columnConfig: ColumnGroupConfig[]
): string => {
  if (!excelFormula || excelFormula.trim() === '') {
    return '';
  }

  // Remover el "=" inicial si existe
  let customFormula = excelFormula.startsWith('=') 
    ? excelFormula.substring(1) 
    : excelFormula;

  // Construir mapa inverso: letra Excel → nombre de columna
  const letterToColumnMap = new Map<string, string>();
  columnConfig.forEach(group => {
    group.columns.forEach(col => {
      if (col.label && col.id) {
        letterToColumnMap.set(col.id, col.label);
      }
    });
  });

  // PASO 1: Reemplazar referencias absolutas $LETRA$2 → [Columna:Puntos]
  customFormula = customFormula.replace(
    /\$([A-Z]+)\$2/g,
    (_, letter) => {
      const columnName = letterToColumnMap.get(letter);
      
      if (!columnName) {
        console.warn(`Letra de columna "${letter}" no encontrada al traducir desde Excel`);
        return '0';
      }
      
      return `[${columnName}:Puntos]`;
    }
  );

  // PASO 2: Reemplazar referencias relativas LETRA+número → [Columna]
  customFormula = customFormula.replace(
    /([A-Z]+)(\d+)/g,
    (_, letter) => {
      const columnName = letterToColumnMap.get(letter);
      
      if (!columnName) {
        console.warn(`Letra de columna "${letter}" no encontrada al traducir desde Excel`);
        return '0';
      }
      
      return `[${columnName}]`;
    }
  );

  return customFormula;
};

/**
 * Valida si una cadena contiene una fórmula Excel válida
 */
export const isExcelFormula = (value: string): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  
  return value.trim().startsWith('=');
};

/**
 * Valida si una cadena contiene una fórmula personalizada válida
 */
export const isCustomFormula = (value: string): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Buscar patrón [Columna] o [Columna:Tipo]
  return /\[([^\]]+)\]/.test(value);
};
