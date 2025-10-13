import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';

interface FormulaEditorProps {
  visible: boolean;
  onHide: () => void;
  onSave: (formula: string) => void;
  currentFormula: string;
  availableColumns: string[];
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

  // Agregar una columna a la fórmula
  const addColumnToFormula = (columnLabel: string) => {
    setFormulaParts([...formulaParts, `[${columnLabel}]`]);
  };

  // Agregar un operador a la fórmula
  const addOperatorToFormula = (operator: string) => {
    setFormulaParts([...formulaParts, operator]);
  };

  // Agregar un número a la fórmula
  const addNumberToFormula = (number: string) => {
    setFormulaParts([...formulaParts, number]);
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
  const getFilteredColumns = (): string[] => {
    return availableColumns.filter(label => label !== currentColumnLabel);
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

        {/* Selector de columnas */}
        <Card>
          <h4 className="font-semibold text-sm mb-3">1. Seleccionar columnas:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {getFilteredColumns().length > 0 ? (
              getFilteredColumns().map((label, index) => (
                <Button
                  key={index}
                  label={label}
                  onClick={() => addColumnToFormula(label)}
                  className="p-button-sm p-button-outlined text-sm justify-start"
                  icon="pi pi-plus"
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-3 text-center py-4">
                No hay columnas disponibles
              </p>
            )}
          </div>
        </Card>

        {/* Operadores matemáticos */}
        <Card>
          <h4 className="font-semibold text-sm mb-3">2. Agregar operadores:</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '+ Suma', value: '+', icon: 'pi-plus' },
              { label: '- Resta', value: '-', icon: 'pi-minus' },
              { label: '× Multiplicación', value: '*', icon: 'pi-times' },
              { label: '÷ División', value: '/', icon: 'pi-percentage' },
              { label: '( Abrir paréntesis', value: '(', icon: 'pi-angle-left' },
              { label: ') Cerrar paréntesis', value: ')', icon: 'pi-angle-right' }
            ].map((op, index) => (
              <Button
                key={index}
                label={op.label}
                onClick={() => addOperatorToFormula(op.value)}
                className="p-button-sm p-button-secondary"
                icon={`pi ${op.icon}`}
              />
            ))}
          </div>
        </Card>

        {/* Agregar números */}
        <Card>
          <h4 className="font-semibold text-sm mb-3">3. Agregar números o constantes:</h4>
          <div className="flex gap-2">
            <InputText
              id="number-input"
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
              label="Agregar"
              icon="pi pi-plus"
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
            💡 Presione Enter o haga clic en Agregar
          </small>
        </Card>

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
            disabled={formulaParts.length === 0}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default FormulaEditor;
