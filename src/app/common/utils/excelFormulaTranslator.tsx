/**
 * Traductor de Fórmulas: Sistema Dual
 * 
 * Este módulo traduce entre dos formatos:
 * 1. Fórmula Personalizada: [ID], [ID:Valor], [ID:Puntos] (ej: [C], [C:Puntos])
 * 2. Fórmula Excel Nativa: =A4, =$A$2, etc.
 * 
 * Propósito:
 * - Permite que el archivo Excel funcione independientemente
 * - Mantiene compatibilidad con el sistema de gestión
 * - Usa IDs (letras de Excel) para referencias estables
 */

import type { ColumnGroupConfig } from '../hooks/useExcelData';

/**
 * Construye un mapa de ID de columna → letra Excel
 * Ejemplo: "B" → "B", "E" → "E"
 * NOTA: Como ya usamos IDs (letras Excel), este mapa es directo
 */
const buildColumnLetterMap = (columnConfig: ColumnGroupConfig[]): Map<string, string> => {
  const columnMap = new Map<string, string>();
  
  columnConfig.forEach(group => {
    group.columns.forEach(col => {
      if (col.id) {
        // El ID ya es la letra de la columna (ej: "A", "B", "C")
        columnMap.set(col.id, col.id);
      }
    });
  });
  
  return columnMap;
};

/**
 * Traduce fórmula personalizada → Fórmula Excel
 * 
 * @param customFormula - Fórmula personalizada (ej: "[E] / [E:Puntos] * 100")
 * @param rowNumber - Número de fila del estudiante en Excel (ej: 4, 5, 6...)
 * @param columnConfig - Configuración completa de columnas
 * @returns Fórmula Excel (ej: "=E4/$E$2*100")
 * 
 * Ejemplos:
 * - "[F]" → "F4" (fila del estudiante)
 * - "[F:Puntos]" → "$F$2" (fila fija de puntos)
 * - "[E] / [E:Puntos] * 100" → "=E4/$E$2*100"
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
  
  // PASO 1: Reemplazar [ID:Puntos] → $LETRA$2 (referencia absoluta a fila de puntos)
  excelFormula = excelFormula.replace(
    /\[([^\]]+):Puntos\]/g,
    (_, columnId) => {
      const columnLetter = columnMap.get(columnId.trim());
      
      if (!columnLetter) {
        return '0'; // Valor por defecto si no se encuentra
      }
      
      // Referencia absoluta: fila 2 siempre contiene los puntos
      return `$${columnLetter}$2`;
    }
  );
  
  // PASO 2: Reemplazar [ID:Valor] → LETRA + rowNumber (referencia relativa)
  excelFormula = excelFormula.replace(
    /\[([^\]]+):Valor\]/g,
    (_, columnId) => {
      const columnLetter = columnMap.get(columnId.trim());
      
      if (!columnLetter) {
        return '0';
      }
      
      // Referencia relativa a la fila del estudiante
      return `${columnLetter}${rowNumber}`;
    }
  );
  
  // PASO 3: Reemplazar [ID] (sin especificar tipo) → LETRA + rowNumber
  // Por defecto, [ID] equivale a [ID:Valor]
  excelFormula = excelFormula.replace(
    /\[([^\]]+)\]/g,
    (_, columnId) => {
      const columnLetter = columnMap.get(columnId.trim());
      
      if (!columnLetter) {
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
 * @returns Fórmula personalizada (ej: "[E] / [E:Puntos] * 100")
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

  // Construir mapa inverso: letra Excel → ID (que ya es la letra)
  const letterToColumnIdMap = new Map<string, string>();
  columnConfig.forEach(group => {
    group.columns.forEach(col => {
      if (col.id) {
        letterToColumnIdMap.set(col.id, col.id);
      }
    });
  });

  // PASO 1: Reemplazar referencias absolutas $LETRA$2 → [ID:Puntos]
  customFormula = customFormula.replace(
    /\$([A-Z]+)\$2/g,
    (_, letter) => {
      const columnId = letterToColumnIdMap.get(letter);
      
      if (!columnId) {
        return '0';
      }
      
      return `[${columnId}:Puntos]`;
    }
  );

  // PASO 2: Reemplazar referencias relativas LETRA+número → [ID]
  customFormula = customFormula.replace(
    /([A-Z]+)(\d+)/g,
    (_, letter) => {
      const columnId = letterToColumnIdMap.get(letter);
      
      if (!columnId) {
        return '0';
      }
      
      return `[${columnId}]`;
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
