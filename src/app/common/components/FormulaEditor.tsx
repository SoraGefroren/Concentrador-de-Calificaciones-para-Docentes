import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';

interface ColumnInfo {
  label: string;
  groupType: string; // 'info', 'period', 'columns'
  groupLabel: string;
  groupColor?: string; // Color del grupo (opcional)
  tipoValor?: 'Texto' | 'Email' | 'Número' | null; // Tipo de dato de la columna
}

interface FormulaEditorProps {
  visible: boolean;
  onHide: () => void;
  onSave: (formula: string) => void;
  currentFormula: string;
  availableColumns: ColumnInfo[];
  currentColumnLabel?: string;
}

const FormulaEditor = ({
  visible,
  onHide,
  onSave,
  currentFormula,
  availableColumns,
  currentColumnLabel
}: FormulaEditorProps) => {
  
  // Estado interno para las partes de la fórmula
  const [formulaParts, setFormulaParts] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string>('');

  // Efecto para parsear la fórmula cuando cambie
  useEffect(() => {
    if (visible && currentFormula) {
      setFormulaParts(parseFormulaToArray(currentFormula));
    } else if (visible && !currentFormula) {
      setFormulaParts([]);
    }
  }, [visible, currentFormula]);

  /*
   * FUNCIONES DE PARSING Y CONVERSIÓN
   */

  // Convertir una fórmula string en array de partes
  const parseFormulaToArray = (formula: string): string[] => {
    if (!formula) return [];
    
    const parts: string[] = [];
    let currentToken = '';
    let inBrackets = false;
    
    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];
      
      if (char === '[') {
        if (currentToken.trim()) {
          parts.push(currentToken.trim());
          currentToken = '';
        }
        inBrackets = true;
        currentToken = char;
      } else if (char === ']') {
        currentToken += char;
        inBrackets = false;
        parts.push(currentToken);
        currentToken = '';
      } else if (!inBrackets && (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')')) {
        if (currentToken.trim()) {
          parts.push(currentToken.trim());
          currentToken = '';
        }
        parts.push(char);
      } else {
        currentToken += char;
      }
    }
    
    if (currentToken.trim()) {
      parts.push(currentToken.trim());
    }
    
    return parts;
  };

  // Convertir array de partes a fórmula string
  const arrayToFormulaString = (parts: string[]): string => {
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  /*
   * FUNCIONES PARA MANIPULAR LA FÓRMULA
   */

  // Validar fórmula matemáticamente con validación de tipos
  const validateFormula = useCallback((parts: string[]): string => {
    if (parts.length === 0) return '';
    
    const isOperator = (p: string) => ['+', '-', '*', '/'].includes(p);
    const isNumber = (p: string) => !isNaN(Number(p));
    const isColumn = (p: string) => p.startsWith('[') && p.endsWith(']');
    const isValue = (p: string) => isNumber(p) || isColumn(p);
    
    // 1. Validar paréntesis balanceados
    let parenthesisCount = 0;
    for (const part of parts) {
      if (part === '(') parenthesisCount++;
      if (part === ')') parenthesisCount--;
      if (parenthesisCount < 0) {
        return 'Error: Paréntesis de cierre sin apertura correspondiente';
      }
    }
    if (parenthesisCount !== 0) {
      return 'Error: Paréntesis no balanceados';
    }

    // 2. Validar que no haya operadores consecutivos
    for (let i = 0; i < parts.length - 1; i++) {
      const current = parts[i];
      const next = parts[i + 1];
      
      if (isOperator(current) && isOperator(next)) {
        return 'Error: Operadores consecutivos no permitidos';
      }
      
      // No puede terminar con operador
      if (i === parts.length - 2 && isOperator(next)) {
        return 'Error: La fórmula no puede terminar con un operador';
      }
    }

    // 3. Validar que no empiece con operador binario
    if (['+', '*', '/', ')'].includes(parts[0])) {
      return 'Error: La fórmula no puede comenzar con este operador';
    }

    // 4. Validar secuencia lógica: valor-operador-valor
    for (let i = 0; i < parts.length; i++) {
      const current = parts[i];
      const next = parts[i + 1];
      
      // Después de ( debe venir valor o - (negativo)
      if (current === '(' && next && ['+', '*', '/', ')'].includes(next)) {
        return 'Error: Después de "(" no puede venir este operador';
      }
      
      // Antes de ) debe haber valor
      if (next === ')' && ['+', '-', '*', '/', '('].includes(current)) {
        return 'Error: Antes de ")" debe haber un valor';
      }
      
      // VALIDACIÓN SEMÁNTICA: Después de un valor debe venir operador o paréntesis de cierre
      if (isValue(current) && next && !isOperator(next) && next !== ')') {
        // Si el siguiente tampoco es un operador ni paréntesis, es un error
        if (isValue(next)) {
          return 'Error: Falta operador entre valores (ej: debe ser "5 + [Col]" no "5 [Col]")';
        }
      }
      
      // VALIDACIÓN SEMÁNTICA: Después de operador debe venir valor o paréntesis de apertura
      if (isOperator(current) && next && !isValue(next) && next !== '(') {
        return 'Error: Después de un operador debe venir un número o columna';
      }
      
      // Después de ) debe venir operador o ) (para cerrar anidados)
      if (current === ')' && next && !isOperator(next) && next !== ')') {
        return 'Error: Después de ")" debe venir un operador';
      }
    }

    // 5. Validar que solo se usen columnas numéricas (no texto)
    for (const part of parts) {
      if (isColumn(part)) {
        const col = availableColumns.find(c => `[${c.label}]` === part);
        if (!col) {
          return `Error: La columna ${part} no existe`;
        }
        
        // Validar que la columna sea de tipo Número
        if (col.tipoValor && col.tipoValor !== 'Número') {
          return `Error: La columna "${col.label}" es de tipo ${col.tipoValor}. Solo se permiten columnas numéricas en fórmulas`;
        }
      }
    }

    return ''; // Fórmula válida
  }, [availableColumns]);

  // Actualizar validación cada vez que cambian las partes
  useEffect(() => {
    const error = validateFormula(formulaParts);
    setValidationError(error);
  }, [formulaParts, validateFormula]);

  // Agregar una columna a la fórmula
  const addColumnToFormula = (columnLabel: string) => {
    const newParts = [...formulaParts, `[${columnLabel}]`];
    setFormulaParts(newParts);
  };

  // Agregar un operador a la fórmula
  const addOperatorToFormula = (operator: string) => {
    const newParts = [...formulaParts, operator];
    setFormulaParts(newParts);
  };

  // Agregar un número a la fórmula
  const addNumberToFormula = (number: string) => {
    const newParts = [...formulaParts, number];
    setFormulaParts(newParts);
  };

  // Eliminar una parte específica de la fórmula
  const removeFormulaPart = (index: number) => {
    setFormulaParts(formulaParts.filter((_, i) => i !== index));
  };

  // Deshacer el último elemento agregado
  const undoLast = () => {
    setFormulaParts(formulaParts.slice(0, -1));
  };

  // Limpiar toda la fórmula
  const clearFormula = () => {
    setFormulaParts([]);
  };

  /*
   * MANEJADORES DE EVENTOS
   */

  // Guardar la fórmula
  const handleSave = () => {
    const formulaString = arrayToFormulaString(formulaParts);
    onSave(formulaString);
  };

  // Cancelar y cerrar
  const handleCancel = () => {
    onHide();
  };

  // Filtrar columnas disponibles (excluir la columna actual)
  const getFilteredColumns = (): ColumnInfo[] => {
    return availableColumns.filter(col => col.label !== currentColumnLabel);
  };

  // Agrupar columnas por tipo
  const getColumnsByType = () => {
    const filtered = getFilteredColumns();
    return {
      info: filtered.filter(col => col.groupType === 'info'),
      columns: filtered.filter(col => col.groupType === 'columns'),
      period: filtered.filter(col => col.groupType === 'period')
    };
  };

  // Obtener color de badge según el tipo de grupo
  const getGroupTypeBadgeColor = (type: string): string => {
    switch(type) {
      case 'info': return 'bg-gray-500';
      case 'columns': return 'bg-blue-500';
      case 'period': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Obtener etiqueta legible del tipo
  const getGroupTypeLabel = (type: string): string => {
    switch(type) {
      case 'info': return 'Info';
      case 'columns': return 'Fija';
      case 'period': return 'Período';
      default: return type;
    }
  };

  /*
   * RENDERIZADO
   */

  return (
    <Dialog
      header="Editor Visual de Fórmulas"
      visible={visible}
      onHide={handleCancel}
      style={{ width: '90vw', maxWidth: '800px' }}
      modal
      draggable={false}
    >
      <div className="space-y-4">
        {/* Vista previa de la fórmula construida */}
        <Card className="bg-gray-50">
          <h4 className="font-semibold text-sm mb-2">Fórmula construida:</h4>
          <div className="bg-white p-3 rounded border min-h-[60px] flex items-center">
            {formulaParts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formulaParts.map((part, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                      part.startsWith('[') && part.endsWith(']')
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : ['+', '-', '*', '/', '(', ')'].includes(part)
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-green-100 text-green-800 border border-green-300'
                    }`}
                  >
                    <span>{part}</span>
                    <button
                      onClick={() => removeFormulaPart(index)}
                      className="text-red-500 hover:text-red-700 font-bold text-xs"
                      aria-label="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">La fórmula aparecerá aquí...</span>
            )}
          </div>
        </Card>

        {/* Mensaje de validación */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-md text-red-700 text-sm flex items-start gap-2">
            <i className="pi pi-exclamation-triangle mt-0.5"></i>
            <span>{validationError}</span>
          </div>
        )}

        {/* Diseño en dos columnas: Selector de columnas + Operadores y números */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Columna izquierda: Selector de columnas */}
          <Card>
            <h4 className="font-semibold text-sm mb-3">📋 Seleccionar columnas:</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {(() => {
                const grouped = getColumnsByType();
                return (
                  <>
                    {/* Columnas de Info */}
                    {grouped.info.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b">
                          📊 Columnas de Información
                        </div>
                        <div className="space-y-1">
                          {grouped.info.map((col, index) => (
                            <Button
                              key={`info-${index}`}
                              onClick={() => addColumnToFormula(col.label)}
                              className="w-full p-button-sm p-button-outlined text-left justify-start text-xs"
                              style={{ padding: '0.4rem 0.6rem', borderLeftWidth: '3px', borderLeftColor: col.groupColor || '#6b7280' }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getGroupTypeBadgeColor(col.groupType)}`}>
                                  {getGroupTypeLabel(col.groupType)}
                                </span>
                                <span className="flex-1 truncate">{col.label}</span>
                                <i className="pi pi-plus text-[10px]"></i>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Columnas Fijas */}
                    {grouped.columns.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b">
                          📌 Columnas Fijas
                        </div>
                        <div className="space-y-1">
                          {grouped.columns.map((col, index) => (
                            <Button
                              key={`col-${index}`}
                              onClick={() => addColumnToFormula(col.label)}
                              className="w-full p-button-sm p-button-outlined text-left justify-start text-xs"
                              style={{ padding: '0.4rem 0.6rem', borderLeftWidth: '3px', borderLeftColor: col.groupColor || '#3b82f6' }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getGroupTypeBadgeColor(col.groupType)}`}>
                                  {getGroupTypeLabel(col.groupType)}
                                </span>
                                <span className="flex-1 truncate">{col.label}</span>
                                <i className="pi pi-plus text-[10px]"></i>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Columnas de Períodos */}
                    {grouped.period.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b">
                          📅 Columnas de Períodos
                        </div>
                        <div className="space-y-1">
                          {grouped.period.map((col, index) => (
                            <Button
                              key={`period-${index}`}
                              onClick={() => addColumnToFormula(col.label)}
                              className="w-full p-button-sm p-button-outlined text-left justify-start text-xs"
                              style={{ padding: '0.4rem 0.6rem', borderLeftWidth: '3px', borderLeftColor: col.groupColor || '#7c3aed' }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getGroupTypeBadgeColor(col.groupType)}`}>
                                  {getGroupTypeLabel(col.groupType)}
                                </span>
                                <span className="flex-1 truncate" title={`${col.groupLabel} - ${col.label}`}>
                                  {col.label}
                                </span>
                                <i className="pi pi-plus text-[10px]"></i>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {getFilteredColumns().length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No hay columnas disponibles
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Columna derecha: Operadores y números */}
          <div className="space-y-4">
            {/* Operadores matemáticos */}
            <Card>
              <h4 className="font-semibold text-sm mb-3">🔢 Operadores:</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '+', title: 'Suma', value: '+', icon: 'pi-plus' },
                  { label: '−', title: 'Resta', value: '-', icon: 'pi-minus' },
                  { label: '×', title: 'Multiplicación', value: '*', icon: 'pi-times' },
                  { label: '÷', title: 'División', value: '/', icon: 'pi-percentage' },
                  { label: '(', title: 'Abrir paréntesis', value: '(', icon: 'pi-angle-left' },
                  { label: ')', title: 'Cerrar paréntesis', value: ')', icon: 'pi-angle-right' }
                ].map((op, index) => (
                  <Button
                    key={index}
                    label={op.label}
                    title={op.title}
                    onClick={() => addOperatorToFormula(op.value)}
                    className="p-button-sm p-button-secondary text-lg font-bold"
                    style={{ height: '40px' }}
                  />
                ))}
              </div>
            </Card>

            {/* Agregar números */}
            <Card>
              <h4 className="font-semibold text-sm mb-3">🔢 Números:</h4>
              <div className="flex gap-2">
                <InputText
                  id="number-input"
                  type="number"
                  placeholder="Ej: 0.5, 2, 100"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value && !isNaN(Number(value))) {
                        addNumberToFormula(value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button
                  label="+"
                  title="Agregar número"
                  className="p-button-sm"
                  onClick={() => {
                    const input = document.getElementById('number-input') as HTMLInputElement;
                    const value = input?.value.trim();
                    if (value && !isNaN(Number(value))) {
                      addNumberToFormula(value);
                      input.value = '';
                    }
                  }}
                />
              </div>
              <small className="text-gray-500 text-xs block mt-2">
                💡 Presione Enter para agregar
              </small>
            </Card>
          </div>
        </div>

        {/* Acciones rápidas */}
        <Card className="bg-yellow-50">
          <h4 className="font-semibold text-sm mb-3">🚀 Acciones rápidas:</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              label="Limpiar todo"
              icon="pi pi-trash"
              onClick={clearFormula}
              className="p-button-sm p-button-danger p-button-outlined"
            />
            <Button
              label="Deshacer último"
              icon="pi pi-undo"
              onClick={undoLast}
              className="p-button-sm p-button-warning p-button-outlined"
              disabled={formulaParts.length === 0}
            />
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={handleCancel}
            className="p-button-text"
          />
          <Button
            label="Guardar Fórmula"
            icon="pi pi-check"
            onClick={handleSave}
            className="p-button-success"
            disabled={formulaParts.length === 0 || validationError !== ''}
            title={validationError || 'Guardar fórmula válida'}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default FormulaEditor;
