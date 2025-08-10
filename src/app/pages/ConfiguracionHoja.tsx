import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext.tsx';
import { useRef, useState } from 'react';
import type { ColumnConfig, PeriodConfig, ExtendedColumnConfig, FixedColumnConfig } from '../common/hooks/useExcelData.tsx';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { ColorPicker } from 'primereact/colorpicker';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const ConfiguracionHoja = () => {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const { columnConfig } = useExcelContext();
  const [config, setConfig] = useState<ColumnConfig>(columnConfig);
  
  // Estado para configuración extendida con períodos dinámicos
  const [extendedConfig, setExtendedConfig] = useState<ExtendedColumnConfig>(() => {
    const saved = localStorage.getItem('extendedColumnConfig');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Error loading extended config, using defaults');
      }
    }
    
    // Configuración por defecto basada en la configuración actual
    return {
      periods: [
        {
          id: 'black',
          name: 'Primer Período',
          numColumns: config.black.numColumns,
          rangeColumns: config.black.rangeColumns,
          color: config.black.color,
          order: 1,
          columns: Array.from({ length: config.black.numColumns }, (_, i) => ({
            id: `black-${i}`,
            header: `ACTIVIDAD-${i + 1}`,
            date: '01-ENE-22',
            points: 10
          }))
        },
        {
          id: 'green',
          name: 'Segundo Período',
          numColumns: config.green.numColumns,
          rangeColumns: config.green.rangeColumns,
          color: config.green.color,
          order: 2,
          columns: Array.from({ length: config.green.numColumns }, (_, i) => ({
            id: `green-${i}`,
            header: `ACTIVIDAD-${i + 1}`,
            date: '01-FEB-22',
            points: 10
          }))
        },
        {
          id: 'purple',
          name: 'Tercer Período',
          numColumns: config.purple.numColumns,
          rangeColumns: config.purple.rangeColumns,
          color: config.purple.color,
          order: 3,
          columns: Array.from({ length: config.purple.numColumns }, (_, i) => ({
            id: `purple-${i}`,
            header: `ACTIVIDAD-${i + 1}`,
            date: '01-MAR-22',
            points: 10
          }))
        }
      ],
      fixedColumnsLeft: ['ID', 'NOMBRE', 'APELLIDO', 'CORREO.ELECTONICO '],
      fixedColumnsRight: [
        { name: 'SUMA.PORCENTAJE.ACTIVIDADES', date: undefined, points: undefined },
        { name: 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', date: undefined, points: undefined },
        { name: 'PARTICIPACIÓN', date: undefined, points: undefined },
        { name: 'TOTAL.ALCANZADO', date: undefined, points: undefined },
        { name: 'CALIFICACION', date: undefined, points: undefined }
      ]
    };
  });

  const [activeTab, setActiveTab] = useState(0);
  
  // Estado para trackear elementos recién agregados
  const [newlyAdded, setNewlyAdded] = useState<{
    periods: Set<string>;
    columns: Set<string>;
    fixedColumnsLeft: Set<number>;
    fixedColumnsRight: Set<number>;
  }>({
    periods: new Set(),
    columns: new Set(),
    fixedColumnsLeft: new Set(),
    fixedColumnsRight: new Set()
  });

  // Funciones de utilidad para calcular rangos de columnas Excel
  const getExcelColumnName = (columnNumber: number): string => {
    let columnName = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + remainder) + columnName;
      columnNumber = Math.floor((columnNumber - 1) / 26);
    }
    return columnName;
  };

  const getColumnNumber = (columnName: string): number => {
    let result = 0;
    for (let i = 0; i < columnName.length; i++) {
      result = result * 26 + (columnName.charCodeAt(i) - 64);
    }
    return result;
  };

  const calculateRange = (startColumn: string, numColumns: number): string => {
    const startNum = getColumnNumber(startColumn);
    const endNum = startNum + numColumns - 1;
    const endColumn = getExcelColumnName(endNum);
    return `${startColumn}1:${endColumn}1`;
  };

  // Función para marcar elementos como nuevos y limpiar la marca después de un tiempo
  const markAsNew = (type: 'period' | 'column' | 'fixedLeft' | 'fixedRight', id: string | number) => {
    if (type === 'period' || type === 'column') {
      setNewlyAdded(prev => ({
        ...prev,
        [type === 'period' ? 'periods' : 'columns']: new Set([...prev[type === 'period' ? 'periods' : 'columns'], id as string])
      }));
    } else {
      setNewlyAdded(prev => ({
        ...prev,
        [type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight']: new Set([...prev[type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight'], id as number])
      }));
    }

    // Remover la marca después de 5 segundos
    setTimeout(() => {
      setNewlyAdded(prev => {
        if (type === 'period' || type === 'column') {
          const newSet = new Set(prev[type === 'period' ? 'periods' : 'columns']);
          newSet.delete(id as string);
          return {
            ...prev,
            [type === 'period' ? 'periods' : 'columns']: newSet
          };
        } else {
          const newSet = new Set(prev[type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight']);
          newSet.delete(id as number);
          return {
            ...prev,
            [type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight']: newSet
          };
        }
      });
    }, 5000);
  };

  // Función para calcular la posición de una columna específica dentro de un período
  const getColumnPositionInPeriod = (periodId: string, columnIndex: number): string => {
    const leftFixedCount = extendedConfig.fixedColumnsLeft.length;
    const periods = extendedConfig.periods.sort((a, b) => a.order - b.order);
    
    let currentPosition = leftFixedCount + 1;
    
    // Buscar el período actual y calcular la posición
    for (const period of periods) {
      if (period.id === periodId) {
        return getExcelColumnName(currentPosition + columnIndex);
      }
      currentPosition += period.numColumns;
    }
    
    return getExcelColumnName(currentPosition + columnIndex);
  };

  // Calcular automáticamente los rangos basado en las columnas fijas
  const recalculateRanges = () => {
    const leftFixedCount = extendedConfig.fixedColumnsLeft.length;
    
    // Actualizar rangos para todos los períodos dinámicamente
    let currentPosition = leftFixedCount + 1;
    const updatedPeriods = extendedConfig.periods
      .sort((a, b) => a.order - b.order)
      .map((period) => {
        const startColumn = getExcelColumnName(currentPosition);
        const range = calculateRange(startColumn, period.numColumns);
        currentPosition += period.numColumns;
        
        return {
          ...period,
          rangeColumns: range
        };
      });

    setExtendedConfig(prev => ({
      ...prev,
      periods: updatedPeriods
    }));

    // También actualizar la configuración legacy para compatibilidad
    const blackPeriod = updatedPeriods.find(p => p.id === 'black');
    const greenPeriod = updatedPeriods.find(p => p.id === 'green');
    const purplePeriod = updatedPeriods.find(p => p.id === 'purple');

    if (blackPeriod && greenPeriod && purplePeriod) {
      setConfig(prev => ({
        ...prev,
        black: { ...prev.black, rangeColumns: blackPeriod.rangeColumns },
        green: { ...prev.green, rangeColumns: greenPeriod.rangeColumns },
        purple: { ...prev.purple, rangeColumns: purplePeriod.rangeColumns }
      }));
    }
  };

  // Función para agregar un nuevo período
  const addPeriod = () => {
    const newId = `period-${Date.now()}`;
    const newOrder = Math.max(...extendedConfig.periods.map(p => p.order)) + 1;
    const newPeriod: PeriodConfig = {
      id: newId,
      name: `Período ${newOrder}`,
      numColumns: 5,
      rangeColumns: '',
      color: '#3b82f6',
      order: newOrder,
      columns: Array.from({ length: 5 }, (_, i) => ({
        id: `${newId}-${i}`,
        header: `ACTIVIDAD-${i + 1}`,
        date: '01-ENE-24',
        points: 10
      }))
    };

    setExtendedConfig(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod]
    }));

    // Marcar el nuevo período como recién agregado
    markAsNew('period', newId);

    toast.current?.show({
      severity: 'success',
      summary: 'Período agregado',
      detail: 'Nuevo período creado exitosamente',
      life: 3000
    });
  };

  // Función para eliminar un período
  const removePeriod = (periodId: string) => {
    confirmDialog({
      message: '¿Estás seguro de que deseas eliminar este período? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setExtendedConfig(prev => ({
          ...prev,
          periods: prev.periods.filter(p => p.id !== periodId)
        }));

        toast.current?.show({
          severity: 'info',
          summary: 'Período eliminado',
          detail: 'El período ha sido eliminado exitosamente',
          life: 3000
        });
      }
    });
  };

  // Función para actualizar un período
  const updatePeriod = (periodId: string, updates: Partial<PeriodConfig>) => {
    setExtendedConfig(prev => ({
      ...prev,
      periods: prev.periods.map(p => 
        p.id === periodId ? { ...p, ...updates } : p
      )
    }));
  };

  // Función para agregar columna a un período
  const addColumnToPeriod = (periodId: string) => {
    const period = extendedConfig.periods.find(p => p.id === periodId);
    if (!period) return;

    const newColumnId = `${periodId}-${Date.now()}`;
    const newColumn = {
      id: newColumnId,
      header: `ACTIVIDAD-${period.columns.length + 1}`,
      date: '01-ENE-24',
      points: 10
    };

    updatePeriod(periodId, {
      columns: [...period.columns, newColumn],
      numColumns: period.columns.length + 1
    });

    // Marcar la nueva columna como recién agregada
    markAsNew('column', newColumnId);

    toast.current?.show({
      severity: 'success',
      summary: 'Columna agregada',
      detail: 'Nueva columna agregada al período',
      life: 3000
    });
  };

  // Función para eliminar columna de un período
  const removeColumnFromPeriod = (periodId: string, columnId: string) => {
    const period = extendedConfig.periods.find(p => p.id === periodId);
    if (!period || period.columns.length <= 1) {
      toast.current?.show({
        severity: 'warn',
        summary: 'No se puede eliminar',
        detail: 'Un período debe tener al menos una columna',
        life: 3000
      });
      return;
    }

    updatePeriod(periodId, {
      columns: period.columns.filter(c => c.id !== columnId),
      numColumns: period.columns.length - 1
    });

    toast.current?.show({
      severity: 'info',
      summary: 'Columna eliminada',
      detail: 'Columna eliminada del período',
      life: 3000
    });
  };

  // Función para actualizar una columna específica
  const updateColumn = (periodId: string, columnId: string, updates: { header?: string; date?: string; points?: number }) => {
    const period = extendedConfig.periods.find(p => p.id === periodId);
    if (!period) return;

    const updatedColumns = period.columns.map(c => 
      c.id === columnId ? { ...c, ...updates } : c
    );

    updatePeriod(periodId, { columns: updatedColumns });
  };

  const addFixedColumn = (side: 'left' | 'right') => {
    if (side === 'left') {
      const newColumnName = `NUEVA_COLUMNA_${Date.now()}`;
      setExtendedConfig(prev => ({
        ...prev,
        fixedColumnsLeft: [...prev.fixedColumnsLeft, newColumnName]
      }));
      
      // Marcar la nueva columna izquierda como recién agregada
      const newIndex = extendedConfig.fixedColumnsLeft.length;
      markAsNew('fixedLeft', newIndex);
    } else {
      const newColumn: FixedColumnConfig = {
        name: `NUEVA_COLUMNA_${Date.now()}`,
        date: undefined,
        points: undefined
      };
      setExtendedConfig(prev => ({
        ...prev,
        fixedColumnsRight: [...prev.fixedColumnsRight, newColumn]
      }));
      
      // Marcar la nueva columna derecha como recién agregada
      const newIndex = extendedConfig.fixedColumnsRight.length;
      markAsNew('fixedRight', newIndex);
    }
  };

  const removeFixedColumn = (side: 'left' | 'right', index: number) => {
    if (side === 'left') {
      setExtendedConfig(prev => ({
        ...prev,
        fixedColumnsLeft: prev.fixedColumnsLeft.filter((_, i) => i !== index)
      }));
    } else {
      setExtendedConfig(prev => ({
        ...prev,
        fixedColumnsRight: prev.fixedColumnsRight.filter((_, i) => i !== index)
      }));
    }
  };

  const updateFixedColumn = (side: 'left' | 'right', index: number, value: string) => {
    if (side === 'left') {
      setExtendedConfig(prev => ({
        ...prev,
        fixedColumnsLeft: prev.fixedColumnsLeft.map((col, i) => i === index ? value : col)
      }));
    } else {
      setExtendedConfig(prev => ({
        ...prev,
        fixedColumnsRight: prev.fixedColumnsRight.map((col, i) => 
          i === index ? { ...col, name: value } : col
        )
      }));
    }
  };

  const updateFixedColumnField = (index: number, field: 'date' | 'points', value: string | number | undefined) => {
    setExtendedConfig(prev => ({
      ...prev,
      fixedColumnsRight: prev.fixedColumnsRight.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      )
    }));
  };

  const handleSave = () => {
    // Guardar ambas configuraciones en localStorage
    localStorage.setItem('columnConfig', JSON.stringify(config));
    localStorage.setItem('extendedColumnConfig', JSON.stringify(extendedConfig));
    
    toast.current?.show({
      severity: 'success',
      summary: 'Configuración guardada',
      detail: 'Los cambios se aplicarán al recargar la página',
      life: 3000
    });
    
    // Recargar después de un breve delay para mostrar el toast
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const validateConfiguration = () => {
    const errors = [];
    
    // Validar que cada período tenga al menos una columna
    const periodsWithoutColumns = extendedConfig.periods.filter(p => p.numColumns < 1);
    if (periodsWithoutColumns.length > 0) {
      errors.push('Todos los períodos deben tener al menos una columna');
    }
    
    return errors;
  };

  const previewConfiguration = () => {
    const leftCols = extendedConfig.fixedColumnsLeft.map((col, idx) => ({
      name: col,
      position: getExcelColumnName(idx + 1),
      type: 'fixed-left',
      date: undefined,
      points: undefined,
      category: 'Fijas Izquierdas'
    }));

    let currentPosition = extendedConfig.fixedColumnsLeft.length + 1;
    const periodCols = extendedConfig.periods
      .sort((a, b) => a.order - b.order)
      .flatMap(period => 
        period.columns.map((column, idx) => ({
          name: column.header,
          position: getExcelColumnName(currentPosition + idx),
          type: period.id,
          periodName: period.name,
          date: column.date,
          points: column.points,
          category: 'Períodos'
        }))
      );

    // Actualizar currentPosition después de cada período
    currentPosition += extendedConfig.periods.reduce((sum, p) => sum + p.numColumns, 0);

    const rightCols = extendedConfig.fixedColumnsRight.map((col, idx) => ({
      name: col.name,
      position: getExcelColumnName(currentPosition + idx),
      type: 'fixed-right',
      date: col.date,
      points: col.points,
      category: 'Fijas Derechas'
    }));

    return [...leftCols, ...periodCols, ...rightCols];
  };

  const errors = validateConfiguration();
  const preview = previewConfiguration();

  return (
    <Menu navBarTitle="Configuración de Hoja de datos">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="p-4 max-w-7xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <Button
              label="Recalcular rangos automáticamente"
              icon="pi pi-refresh"
              className="p-button-info text-white bg-blue-500 hover:bg-blue-800 p-2"
              onClick={recalculateRanges}
            />
          </div>
          <div className="flex gap-3">
            <Button
              label="Guardar configuración"
              icon="pi pi-save"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
              onClick={handleSave}
              disabled={errors.length > 0}
            />
            <Button 
              label="Volver al catálogo" 
              icon="pi pi-arrow-left"
              onClick={() => navigate('/')}
              className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2"
            />
          </div>
        </div>

        {errors.length > 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="text-red-800">
              <h4 className="font-bold mb-2">Errores de Configuración:</h4>
              <ul className="list-disc list-inside">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}  className="p-0">
          <TabPanel header="Configuración de Períodos" leftIcon="pi pi-calendar mr-2" className="p-0">
            <Card className="mb-6 p-0">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Configuración de Períodos de Colores</h4>
                <Button
                  label="Agregar Período"
                  icon="pi pi-plus"
                  className="p-button-success"
                  onClick={addPeriod}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {extendedConfig.periods
                  .sort((a, b) => a.order - b.order)
                  .map((period) => {
                    const isNew = newlyAdded.periods.has(period.id);
                    return (
                      <Card 
                        key={period.id} 
                        className={`border-l-4 transition-all duration-500 ${
                          isNew 
                            ? 'border-2 border-green-400 shadow-lg shadow-green-200 bg-green-50' 
                            : ''
                        }`} 
                        style={{ borderLeftColor: period.color }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: period.color }}
                            ></div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{period.name}</h3>
                              {isNew && (
                                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full animate-pulse">
                                  ¡NUEVO!
                                </span>
                              )}
                            </div>
                          </div>
                      
                      <div className="flex gap-2">
                        <Button
                          icon="pi pi-plus"
                          className="p-button-sm p-button-success"
                          tooltip="Agregar columna"
                          onClick={() => addColumnToPeriod(period.id)}
                        />
                        {extendedConfig.periods.length > 1 && (
                          <Button
                            icon="pi pi-trash"
                            className="p-button-sm p-button-danger"
                            tooltip="Eliminar período"
                            onClick={() => removePeriod(period.id)}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre del período</label>
                        <InputText 
                          value={period.name} 
                          onChange={(e) => updatePeriod(period.id, { name: e.target.value })} 
                          className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Número de columnas</label>
                        <InputNumber 
                          value={period.numColumns} 
                          onValueChange={(e) => updatePeriod(period.id, { numColumns: e.value || 1 })} 
                          className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                          min={1}
                          max={10}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <div className="flex gap-2 items-center">
                          <ColorPicker 
                            value={period.color.replace('#', '')} 
                            onChange={(e) => updatePeriod(period.id, { color: `#${e.value}` })} 
                          />
                          <InputText 
                            value={period.color} 
                            onChange={(e) => updatePeriod(period.id, { color: e.target.value })}
                            className="flex-1 bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección de columnas del período */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium">Columnas del Período</h5>
                        <span className="text-sm text-gray-500">{period.columns.length} columnas</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {period.columns.map((column, colIndex) => {
                          const isNewColumn = newlyAdded.columns.has(column.id);
                          return (
                            <div 
                              key={column.id} 
                              className={`flex gap-3 items-center p-3 rounded transition-all duration-500 ${
                                isNewColumn 
                                  ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                  : 'bg-gray-50'
                              }`}
                            >
                              <span className="text-sm font-medium w-8 text-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {getColumnPositionInPeriod(period.id, colIndex)}
                              </span>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <label className="block text-xs text-gray-600">Nombre</label>
                                  {isNewColumn && (
                                    <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                                      ¡NUEVA!
                                    </span>
                                  )}
                                </div>
                                <InputText
                                  value={column.header}
                                  onChange={(e) => updateColumn(period.id, column.id, { header: e.target.value })}
                                  className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                  placeholder="Nombre de la actividad"
                                />
                              </div>
                            
                            <div className="w-32">
                              <label className="block text-xs text-gray-600 mb-1">Fecha</label>
                              <InputText
                                value={column.date}
                                onChange={(e) => updateColumn(period.id, column.id, { date: e.target.value })}
                                className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                placeholder="DD-MMM-AA"
                              />
                            </div>
                            
                            <div className="w-20">
                              <label className="block text-xs text-gray-600 mb-1">Puntos</label>
                              <InputNumber
                                value={column.points}
                                onValueChange={(e) => updateColumn(period.id, column.id, { points: e.value || 0 })}
                                className="w-20 text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                min={0}
                                max={100}
                              />
                            </div>
                            
                            {period.columns.length > 1 && (
                              <Button
                                icon="pi pi-trash"
                                className="p-button-sm p-button-danger p-button-text"
                                tooltip="Eliminar columna"
                                onClick={() => removeColumnFromPeriod(period.id, column.id)}
                              />
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                    );
                  })}
              </div>
            </Card>
          </TabPanel>

          <TabPanel header="Columnas Fijas" leftIcon="pi pi-table mr-2" className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-0">
              {/* Columnas Fijas Izquierdas */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Columnas Fijas Izquierdas</h4>
                  <Button
                    icon="pi pi-plus"
                    className="p-button-sm p-button-success"
                    onClick={() => addFixedColumn('left')}
                    tooltip="Agregar columna"
                  />
                </div>
                <div className="space-y-2">
                  {extendedConfig.fixedColumnsLeft.map((column, index) => {
                    const isNewLeft = newlyAdded.fixedColumnsLeft.has(index);
                    return (
                      <div 
                        key={index} 
                        className={`flex gap-2 items-center p-2 rounded transition-all duration-500 ${
                          isNewLeft 
                            ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                            : 'bg-transparent'
                        }`}
                      >
                        <span className="text-sm text-gray-500 w-8">{getExcelColumnName(index + 1)}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <InputText
                            value={column}
                            onChange={e => updateFixedColumn('left', index, e.target.value)}
                            className="flex-1 bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                          />
                          {isNewLeft && (
                            <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                              ¡NUEVA!
                            </span>
                          )}
                        </div>
                        <Button
                          icon="pi pi-trash"
                          className="p-button-sm p-button-danger p-button-text"
                          onClick={() => removeFixedColumn('left', index)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Columnas Fijas Derechas */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Columnas Fijas Derechas</h4>
                  <Button
                    icon="pi pi-plus"
                    className="p-button-sm p-button-success"
                    onClick={() => addFixedColumn('right')}
                    tooltip="Agregar columna"
                  />
                </div>
                <div className="space-y-4">
                  {extendedConfig.fixedColumnsRight.map((column, index) => {
                    const totalPeriodsColumns = extendedConfig.periods.reduce((sum, p) => sum + p.numColumns, 0);
                    const position = extendedConfig.fixedColumnsLeft.length + totalPeriodsColumns + index + 1;
                    const isNewRight = newlyAdded.fixedColumnsRight.has(index);
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded border transition-all duration-500 ${
                          isNewRight 
                            ? 'bg-green-100 border-2 border-green-300 shadow-lg' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-gray-500 w-8">
                            {getExcelColumnName(position)}
                          </span>
                          <h6 className="font-medium text-gray-700">Columna {index + 1}</h6>
                          {isNewRight && (
                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full animate-pulse">
                              ¡NUEVA!
                            </span>
                          )}
                          <div className="flex-1"></div>
                          <Button
                            icon="pi pi-trash"
                            className="p-button-sm p-button-danger p-button-text"
                            onClick={() => removeFixedColumn('right', index)}
                            tooltip="Eliminar columna"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
                            <InputText
                              value={column.name}
                              onChange={e => updateFixedColumn('right', index, e.target.value)}
                              className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                              placeholder="Nombre de la columna"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Fecha (opcional)</label>
                            <InputText
                              value={column.date || ''}
                              onChange={e => updateFixedColumnField(index, 'date', e.target.value === '' ? undefined : e.target.value)}
                              className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                              placeholder="DD-MMM-AA"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Puntos (opcional)</label>
                            <InputNumber
                              value={column.points ?? null}
                              onValueChange={(e) => {
                                const newValue = e.value !== null && e.value !== undefined ? e.value : undefined;
                                updateFixedColumnField(index, 'points', newValue);
                              }}
                              className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                              placeholder="0"
                              min={0}
                              max={100}
                              showButtons={false}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel header="Vista Previa" leftIcon="pi pi-eye mr-2">
            <Card className="p-0">
              <h4 className="font-bold mb-4">Vista Previa de la Estructura</h4>
              <div className="overflow-x-auto">
                <DataTable value={preview} className="text-sm">
                  <Column field="position" header="Posición Excel" style={{ width: '100px' }} />
                  <Column field="name" header="Nombre de Columna" style={{ width: '200px' }} />
                  <Column 
                    field="date" 
                    header="Fecha" 
                    style={{ width: '120px' }}
                    body={(rowData) => (
                      <span className="text-xs text-gray-600">
                        {rowData.date || '-'}
                      </span>
                    )}
                  />
                  <Column 
                    field="points" 
                    header="Puntos" 
                    style={{ width: '80px' }}
                    body={(rowData) => (
                      <span className="text-xs text-gray-600">
                        {rowData.points !== undefined ? rowData.points : '-'}
                      </span>
                    )}
                  />
                  <Column 
                    field="category" 
                    header="Categoría" 
                    style={{ width: '120px' }}
                    body={(rowData) => (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rowData.type === 'fixed-left' ? 'bg-blue-100 text-blue-800' :
                        rowData.type === 'fixed-right' ? 'bg-gray-100 text-gray-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {rowData.category}
                      </span>
                    )}
                  />
                  <Column 
                    field="type" 
                    header="Detalle" 
                    body={(rowData) => (
                      <span className="text-xs text-gray-500">
                        {rowData.type === 'fixed-left' ? 'Fija Izq.' :
                         rowData.type === 'fixed-right' ? 'Fija Der.' :
                         rowData.periodName || rowData.type}
                      </span>
                    )}
                  />
                </DataTable>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-600">
                    {extendedConfig.fixedColumnsLeft.length}
                  </div>
                  <div className="text-sm text-gray-600">Columnas Fijas Izq.</div>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded">
                  <div className="text-2xl font-bold text-indigo-600">
                    {extendedConfig.periods.reduce((sum, p) => sum + p.numColumns, 0)}
                  </div>
                  <div className="text-sm text-indigo-600">Columnas de Períodos</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-600">
                    {extendedConfig.fixedColumnsRight.length}
                  </div>
                  <div className="text-sm text-gray-600">Columnas Fijas Der.</div>
                </div>
              </div>

            </Card>
          </TabPanel>
        </TabView>

        <div className="mt-6 flex justify-end">
          <div className="flex gap-3 pt-3">
            <Button
              label="Guardar configuración"
              icon="pi pi-save"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
              onClick={handleSave}
              disabled={errors.length > 0}
            />
            <Button 
              label="Volver al catálogo" 
              icon="pi pi-arrow-left"
              onClick={() => navigate('/')}
              className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2"
            />
          </div>
        </div>
      </div>
    </Menu>
  );
};

export default ConfiguracionHoja;
