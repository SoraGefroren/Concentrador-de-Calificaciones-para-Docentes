/**
 * Evaluador de fórmulas para columnas calculadas
 * 
 * Este módulo procesa fórmulas que referencian columnas por ID y puntos:
 * - [ID] o [ID:Valor] → Valor de la celda del estudiante (ej: [C])
 * - [ID:Puntos] → Puntos máximos configurados para esa columna (ej: [C:Puntos])
 * 
 * El ID corresponde a la letra de la columna en Excel (A, B, C, etc.)
 */

import type { ColumnExcelData, ColumnGroupConfig } from '../hooks/useExcelData';

export interface FormulaEvaluationContext {
  studentData: ColumnExcelData;      // Datos del estudiante actual
  columnConfig: ColumnGroupConfig[]; // Configuración completa de columnas
}

/**
 * Evalúa una fórmula y retorna el resultado numérico
 * 
 * @param formula - Fórmula a evaluar (ej: "[E] / [E:Puntos] * 100")
 * @param context - Contexto con datos del estudiante y configuración
 * @returns Resultado numérico o null si hay error
 */
export const evaluateFormula = (
  formula: string, 
  context: FormulaEvaluationContext
): number | null => {
  if (!formula || formula.trim() === '') {
    return null;
  }

  try {
    // 1. Reemplazar referencias a columnas y puntos por valores reales
    const processedFormula = replaceFormulaReferences(formula, context);
    
    // 2. Validar que solo contenga números, operadores y paréntesis
    if (!isValidMathExpression(processedFormula)) {
      return null;
    }

    // 3. Evaluar la expresión matemática
    const result = evaluateMathExpression(processedFormula);
    
    return result;
  } catch (error) {
    return null;
  }
};

/**
 * Reemplaza referencias [ID] y [ID:Puntos] por valores numéricos
 * Ejemplo: [C] → valor de columna C, [C:Puntos] → puntos máximos de columna C
 */
const replaceFormulaReferences = (
  formula: string,
  context: FormulaEvaluationContext
): string => {
  const { studentData, columnConfig } = context;
  
  // Crear mapa de columnas para acceso rápido (por ID)
  const columnMap = new Map<string, { label: string, points: number | null }>();
  columnConfig.forEach(group => {
    group.columns.forEach(col => {
      if (col.id && col.label) {
        columnMap.set(col.id, { label: col.label, points: col.points });
      }
    });
  });

  // Buscar todas las referencias [...]
  const referencePattern = /\[([^\]]+)\]/g;
  
  return formula.replace(referencePattern, (_match, content) => {
    const trimmedContent = content.trim();
    
    // Parsear: "ID" o "ID:Valor" o "ID:Puntos"
    // Ejemplo: "C" o "C:Valor" o "C:Puntos"
    let columnId: string;
    let refType: 'Valor' | 'Puntos' = 'Valor';
    
    if (trimmedContent.includes(':')) {
      const parts = trimmedContent.split(':');
      columnId = parts[0].trim();
      const typeStr = parts[1]?.trim();
      refType = typeStr === 'Puntos' ? 'Puntos' : 'Valor';
    } else {
      columnId = trimmedContent;
    }

    // Buscar la columna por ID
    const colInfo = columnMap.get(columnId);
    
    if (!colInfo) {
      return '0';
    }

    // Obtener el valor correspondiente
    if (refType === 'Puntos') {
      // Buscar los puntos configurados
      if (colInfo.points !== null && colInfo.points !== undefined) {
        return colInfo.points.toString();
      } else {
        return '0';
      }
    } else {
      // Buscar el valor en los datos del estudiante usando el label
      const value = studentData[colInfo.label];
      
      if (value === null || value === undefined || value === '') {
        // Si no hay valor, usar 0 para evitar errores
        return '0';
      }
      
      // Convertir a número si es posible
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      
      if (isNaN(numValue)) {
        return '0';
      }

      return numValue.toString();
    }
  });
};

/**
 * Valida que una expresión solo contenga números, operadores y paréntesis
 */
const isValidMathExpression = (expr: string): boolean => {
  // Debe contener solo: números (incluyendo decimales), +, -, *, /, (, ), espacios
  const validPattern = /^[\d\s+\-*/.()]+$/;
  return validPattern.test(expr);
};

/**
 * Evalúa una expresión matemática simple
 * Soporta: +, -, *, /, () con precedencia correcta
 */
const evaluateMathExpression = (expr: string): number | null => {
  try {
    // Limpiar espacios
    const cleanExpr = expr.replace(/\s+/g, '');
    
    // Usar Function para evaluación segura (solo matemática)
    // NOTA: Esto es seguro porque ya validamos que solo contiene operadores matemáticos
    const result = new Function(`return ${cleanExpr}`)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Calcula todos los valores de columnas con fórmulas para un estudiante
 * 
 * @param studentData - Datos actuales del estudiante (se modificarán in-place)
 * @param columnConfig - Configuración completa de columnas
 * @returns Datos del estudiante con columnas calculadas actualizadas
 */
export const calculateFormulasForStudent = (
  studentData: ColumnExcelData,
  columnConfig: ColumnGroupConfig[]
): ColumnExcelData => {
  const updatedData = { ...studentData };
  const context: FormulaEvaluationContext = {
    studentData: updatedData,
    columnConfig
  };

  // Recorrer todas las columnas con fórmulas
  columnConfig.forEach(group => {
    group.columns.forEach(col => {
      // Solo calcular si:
      // 1. Tiene fórmula definida
      // 2. No es editable (columna calculada)
      if (col.formula && col.formula.trim() !== '' && col.isEditable === false) {
        const calculatedValue = evaluateFormula(col.formula, context);
        
        if (calculatedValue !== null) {
          updatedData[col.label] = calculatedValue;
          
          // Actualizar el contexto para fórmulas subsecuentes que puedan depender de esta
          context.studentData = updatedData;
        }
      }
    });
  });

  return updatedData;
};

/**
 * Calcula el valor de una sola columna con fórmula para un estudiante específico
 * Útil para cálculos individuales en tiempo real
 * 
 * @param studentData - Datos del estudiante
 * @param columnLabel - Nombre de la columna a calcular
 * @param columnConfig - Configuración completa de columnas
 * @returns Valor calculado o null si hay error o no tiene fórmula
 */
export const calculateSingleColumnFormula = (
  studentData: ColumnExcelData,
  columnLabel: string,
  columnConfig: ColumnGroupConfig[]
): number | null => {
  debugger;
  // Buscar la columna en la configuración
  let targetColumn = null;

  // Buscar en todas las secciones por la LABEL
  for (const group of columnConfig) {
    const found = group.columns.find(col => col.label === columnLabel);
    if (found) {
      targetColumn = found;
      break;
    }
  }
  
  // Si no se encuentra la columna, retornar null
  if (!targetColumn) {
    return null;
  }
  
  // Si no tiene fórmula, retornar null
  if (!targetColumn.formula || targetColumn.formula.trim() === '') {
    return null;
  }
  
  // Evaluar la fórmula
  const context: FormulaEvaluationContext = {
    studentData,
    columnConfig
  };
  
  const result = evaluateFormula(targetColumn.formula, context);
  
  return result;
};
