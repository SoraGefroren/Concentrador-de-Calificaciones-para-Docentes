import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext.tsx';
import { useRef, useState } from 'react';
import type { ColumnConfig } from '../common/hooks/useExcelData.tsx';
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

const ConfiguracionHoja = () => {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const { columnConfig } = useExcelContext();
  const [config, setConfig] = useState<ColumnConfig>(columnConfig);
  const [periodNames, setPeriodNames] = useState({
    black: 'Primer Período',
    green: 'Segundo Período', 
    purple: 'Tercer Período'
  });
  const [fixedColumns, setFixedColumns] = useState({
    left: ['ID', 'NOMBRE', 'APELLIDO', 'CORREO.ELECTONICO '],
    right: ['SUMA.PORCENTAJE.ACTIVIDADES', 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', 'PARTICIPACIÓN', 'TOTAL.ALCANZADO', 'CALIFICACION']
  });
  const [activeTab, setActiveTab] = useState(0);

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

  // Calcular automáticamente los rangos basado en las columnas fijas
  const recalculateRanges = () => {
    const leftFixedCount = fixedColumns.left.length;
    
    // El primer grupo de colores empieza después de las columnas fijas izquierdas
    const blackStart = getExcelColumnName(leftFixedCount + 1);
    const blackRange = calculateRange(blackStart, config.black.numColumns);
    
    // El segundo grupo empieza después del primero
    const greenStart = getExcelColumnName(leftFixedCount + config.black.numColumns + 1);
    const greenRange = calculateRange(greenStart, config.green.numColumns);
    
    // El tercer grupo empieza después del segundo
    const purpleStart = getExcelColumnName(leftFixedCount + config.black.numColumns + config.green.numColumns + 1);
    const purpleRange = calculateRange(purpleStart, config.purple.numColumns);

    setConfig(prev => ({
      ...prev,
      black: { ...prev.black, rangeColumns: blackRange },
      green: { ...prev.green, rangeColumns: greenRange },
      purple: { ...prev.purple, rangeColumns: purpleRange }
    }));
  };

  const handleChange = (group: keyof ColumnConfig, field: keyof ColumnConfig['black'], value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value
      }
    }));
  };

  const handleColorChange = (group: keyof ColumnConfig, color: string) => {
    setConfig(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        color: `#${color}`
      }
    }));
  };

  const addFixedColumn = (side: 'left' | 'right') => {
    const newColumnName = `NUEVA_COLUMNA_${Date.now()}`;
    setFixedColumns(prev => ({
      ...prev,
      [side]: [...prev[side], newColumnName]
    }));
  };

  const removeFixedColumn = (side: 'left' | 'right', index: number) => {
    setFixedColumns(prev => ({
      ...prev,
      [side]: prev[side].filter((_, i) => i !== index)
    }));
  };

  const updateFixedColumn = (side: 'left' | 'right', index: number, value: string) => {
    setFixedColumns(prev => ({
      ...prev,
      [side]: prev[side].map((col, i) => i === index ? value : col)
    }));
  };

  const handleSave = () => {
    // Guardar configuración en localStorage
    localStorage.setItem('columnConfig', JSON.stringify(config));
    localStorage.setItem('periodNames', JSON.stringify(periodNames));
    localStorage.setItem('fixedColumns', JSON.stringify(fixedColumns));
    
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
    
    // Validar que no haya rangos superpuestos
    const totalColorColumns = config.black.numColumns + config.green.numColumns + config.purple.numColumns;
    const totalFixedColumns = fixedColumns.left.length + fixedColumns.right.length;
    
    if (totalColorColumns + totalFixedColumns > 26) {
      errors.push('El total de columnas excede las 26 columnas disponibles (A-Z)');
    }
    
    return errors;
  };

  const previewConfiguration = () => {
    const leftCols = fixedColumns.left.map((col, idx) => ({
      name: col,
      position: getExcelColumnName(idx + 1),
      type: 'fixed-left'
    }));

    const blackCols = Array.from({ length: config.black.numColumns }, (_, idx) => ({
      name: `${periodNames.black}_${idx + 1}`,
      position: getExcelColumnName(fixedColumns.left.length + idx + 1),
      type: 'black'
    }));

    const greenCols = Array.from({ length: config.green.numColumns }, (_, idx) => ({
      name: `${periodNames.green}_${idx + 1}`,
      position: getExcelColumnName(fixedColumns.left.length + config.black.numColumns + idx + 1),
      type: 'green'
    }));

    const purpleCols = Array.from({ length: config.purple.numColumns }, (_, idx) => ({
      name: `${periodNames.purple}_${idx + 1}`,
      position: getExcelColumnName(fixedColumns.left.length + config.black.numColumns + config.green.numColumns + idx + 1),
      type: 'purple'
    }));

    const rightCols = fixedColumns.right.map((col, idx) => ({
      name: col,
      position: getExcelColumnName(fixedColumns.left.length + config.black.numColumns + config.green.numColumns + config.purple.numColumns + idx + 1),
      type: 'fixed-right'
    }));

    return [...leftCols, ...blackCols, ...greenCols, ...purpleCols, ...rightCols];
  };

  const errors = validateConfiguration();
  const preview = previewConfiguration();

  return (
    <Menu navBarTitle="Configuración de Hoja de datos">
      <Toast ref={toast} />
      <div className="p-4 max-w-7xl mx-auto">
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

        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
          <TabPanel header="Configuración de Períodos" leftIcon="pi pi-calendar mr-2">
            <Card className="mb-6">
              <h4 className="font-bold mb-4">Configuración de Períodos de Colores</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['black', 'green', 'purple'] as (keyof ColumnConfig)[]).map((group) => (
                  <div key={group} className="p-4 border rounded shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: config[group].color }}
                      ></div>
                      <h3 className="font-bold capitalize">
                        {group === 'black' ? 'Negro' : group === 'green' ? 'Verde' : 'Morado'}
                      </h3>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Nombre del período</label>
                      <InputText 
                        value={periodNames[group]} 
                        onChange={e => setPeriodNames(prev => ({ ...prev, [group]: e.target.value }))} 
                        className="w-full"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Rango de columnas</label>
                      <InputText 
                        value={config[group].rangeColumns} 
                        onChange={e => handleChange(group, 'rangeColumns', e.target.value)} 
                        className="w-full"
                        placeholder="Ej: F1:L1"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Número de columnas</label>
                      <InputNumber 
                        value={config[group].numColumns} 
                        onValueChange={e => handleChange(group, 'numColumns', e.value || 0)} 
                        className="w-full"
                        min={1}
                        max={10}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Color</label>
                      <div className="flex gap-2 items-center">
                        <ColorPicker 
                          value={config[group].color.replace('#', '')} 
                          onChange={e => handleColorChange(group, e.value?.toString() || '')} 
                        />
                        <InputText 
                          value={config[group].color} 
                          onChange={e => handleChange(group, 'color', e.target.value)}
                          className="flex-1"
                          placeholder="#000000ff"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>

          <TabPanel header="Columnas Fijas" leftIcon="pi pi-table mr-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {fixedColumns.left.map((column, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-sm text-gray-500 w-8">{getExcelColumnName(index + 1)}</span>
                      <InputText
                        value={column}
                        onChange={e => updateFixedColumn('left', index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-sm p-button-danger p-button-text"
                        onClick={() => removeFixedColumn('left', index)}
                      />
                    </div>
                  ))}
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
                <div className="space-y-2">
                  {fixedColumns.right.map((column, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-sm text-gray-500 w-8">
                        {getExcelColumnName(fixedColumns.left.length + config.black.numColumns + config.green.numColumns + config.purple.numColumns + index + 1)}
                      </span>
                      <InputText
                        value={column}
                        onChange={e => updateFixedColumn('right', index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        icon="pi pi-trash"
                        className="p-button-sm p-button-danger p-button-text"
                        onClick={() => removeFixedColumn('right', index)}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabPanel>

          <TabPanel header="Vista Previa" leftIcon="pi pi-eye mr-2">
            <Card>
              <h4 className="font-bold mb-4">Vista Previa de la Estructura</h4>
              <div className="overflow-x-auto">
                <DataTable value={preview} className="text-sm">
                  <Column field="position" header="Posición Excel" style={{ width: '100px' }} />
                  <Column field="name" header="Nombre de Columna" />
                  <Column 
                    field="type" 
                    header="Tipo" 
                    body={(rowData) => (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rowData.type === 'fixed-left' ? 'bg-blue-100 text-blue-800' :
                        rowData.type === 'fixed-right' ? 'bg-gray-100 text-gray-800' :
                        rowData.type === 'black' ? 'bg-gray-800 text-white' :
                        rowData.type === 'green' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {rowData.type === 'fixed-left' ? 'Fija Izq.' :
                         rowData.type === 'fixed-right' ? 'Fija Der.' :
                         rowData.type === 'black' ? periodNames.black :
                         rowData.type === 'green' ? periodNames.green :
                         periodNames.purple}
                      </span>
                    )}
                  />
                </DataTable>
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
