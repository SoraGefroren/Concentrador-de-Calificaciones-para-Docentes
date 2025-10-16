import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { PreviewColumnInfo } from '../hooks/useExcelData';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { validateFormulaComplete, parseFormulaToArray, arrayToFormulaString } from '../utils/clusterOfMethods';


interface FormulaEditorProps {
  visible: boolean;
  onHide: () => void;
  onSave: (formula: string) => void;
  currentFormula: string;
  availableColumns: PreviewColumnInfo[];
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
  // Ahora usa la función común del módulo clusterOfMethods
  useEffect(() => {
    if (visible && currentFormula) {
      setFormulaParts(parseFormulaToArray(currentFormula));
    } else if (visible && !currentFormula) {
      setFormulaParts([]);
    }
  }, [visible, currentFormula]);

  /*
   * FUNCIONES PARA MANIPULAR LA FÓRMULA
   */

  // Validar fórmula matemáticamente con validación de tipos
  // Ahora usa la función común del módulo clusterOfMethods
  const validateFormula = useCallback((parts: string[]): string => {
    const result = validateFormulaComplete(parts, availableColumns);
    return result.error; // Retorna solo el error (vacío si es válido)
  }, [availableColumns]);

  // Actualizar validación cada vez que cambian las partes
  useEffect(() => {
    const error = validateFormula(formulaParts);
    setValidationError(error);
  }, [formulaParts, validateFormula]);

  // Agregar una columna a la fórmula (con tipo de referencia: Valor o Puntos)
  const addColumnToFormula = (columnId: string, refType: 'Valor' | 'Puntos' = 'Valor') => {
    const reference = refType === 'Puntos' 
      ? `[${columnId}:Puntos]` 
      : `[${columnId}]`; // Por defecto usa [ID] que equivale a :Valor
    const newParts = [...formulaParts, reference];
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

  // Ya NO filtrar la columna actual - permitir autorreferencia
  const getFilteredColumns = (): PreviewColumnInfo[] => {
    return availableColumns; // Devolver todas las columnas, incluyendo la actual
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
                // Mantener el orden original de availableColumns
                const columns = getFilteredColumns();
                
                // Agrupar columnas consecutivas del mismo grupo para mostrar separadores visuales
                const groupedSections: Array<{groupId: string, groupLabel: string, groupType: string, columns: PreviewColumnInfo[]}> = [];
                let currentSection: {groupId: string, groupLabel: string, groupType: string, columns: PreviewColumnInfo[]} | null = null;
                
                columns.forEach((col) => {
                  if (!currentSection || currentSection.groupId !== col.groupId) {
                    // Nuevo grupo detectado
                    if (currentSection) {
                      groupedSections.push(currentSection);
                    }
                    currentSection = {
                      groupId: col.groupId,
                      groupLabel: col.groupLabel,
                      groupType: col.groupType,
                      columns: [col]
                    };
                  } else {
                    // Mismo grupo, agregar columna
                    currentSection.columns.push(col);
                  }
                });
                
                // Agregar la última sección
                if (currentSection) {
                  groupedSections.push(currentSection);
                }
                
                // Función helper para obtener el ícono según el tipo
                const getGroupIcon = (type: string): string => {
                  switch(type) {
                    case 'info': return '📊';
                    case 'columns': return '📌';
                    case 'period': return '📅';
                    default: return '📋';
                  }
                };
                
                return (
                  <>
                    {groupedSections.length > 0 ? (
                      groupedSections.map((section, sectionIndex) => (
                        <div key={`section-${sectionIndex}`}>
                          {/* Encabezado del grupo */}
                          <div className="text-xs font-semibold text-gray-600 mb-2 pb-1 border-b flex items-center gap-1">
                            <span>{getGroupIcon(section.groupType)}</span>
                            <span>{section.groupLabel}</span>
                          </div>
                          
                          {/* Columnas del grupo */}
                          <div className="space-y-1">
                            {section.columns.map((col, colIndex) => (
                              <div key={`${section.groupId}-${colIndex}`} className="flex gap-1">
                                <Button
                                  onClick={() => addColumnToFormula(col.id, 'Valor')}
                                  className="flex-1 p-button-sm p-button-outlined text-left justify-start text-xs"
                                  style={{ padding: '0.4rem 0.6rem', borderLeftWidth: '3px', borderLeftColor: col.groupColor || '#6b7280' }}
                                  title={`Agregar valor de ${col.label} (${col.id})`}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getGroupTypeBadgeColor(col.groupType)}`}>
                                      {getGroupTypeLabel(col.groupType)}
                                    </span>
                                    <span className="flex-1 truncate">{col.label}</span>
                                    {col.label === currentColumnLabel && (
                                      <span className="text-[10px] text-blue-600 font-bold">📍</span>
                                    )}
                                    <i className="pi pi-plus text-[10px]"></i>
                                  </div>
                                </Button>
                                {col.points !== null && col.points !== undefined && (
                                  <Button
                                    onClick={() => addColumnToFormula(col.id, 'Puntos')}
                                    className="p-button-sm p-button-outlined text-xs px-2"
                                    style={{ padding: '0.4rem', minWidth: '32px' }}
                                    title={`Agregar puntos máximos de ${col.label} (${col.points})`}
                                  >
                                    <i className="pi pi-star-fill text-[10px] text-yellow-500"></i>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
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
              <small className="text-blue-600 text-xs block mt-2">
                ℹ️ <strong>[ID]</strong> = valor de la celda | 
                <strong className="ml-1">[ID:Puntos]</strong> = puntos máximos ⭐
              </small>
              <small className="text-gray-500 text-xs block mt-1">
                Ejemplo: [C] usa el valor, [C:Puntos] usa los puntos de la columna C
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
