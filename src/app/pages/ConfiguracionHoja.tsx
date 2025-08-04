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

const ConfiguracionHoja = () => {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const { columnConfig } = useExcelContext();
  const [config, setConfig] = useState<ColumnConfig>(columnConfig);

  const handleChange = (group: keyof ColumnConfig, field: keyof ColumnConfig['black'], value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    localStorage.setItem('columnConfig', JSON.stringify(config));
    window.location.reload();
  };

  return (
    <Menu navBarTitle="Configuración de Hoja de datos">
      <Toast ref={toast} />
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-3">
            <Button
                label="Guardar configuración"
                icon="pi pi-save"
                className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
                onClick={handleSave} />
            <Button 
                label="Volver al catálogo" 
                icon="pi pi-arrow-left"
                onClick={() => navigate('/')}
                className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2"
            />
          </div>
        </div>
        {/* Primera sección - Datos básicos editables */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['black', 'green', 'purple'] as (keyof ColumnConfig)[]).map((group) => (
              <div key={group} className="p-4 border rounded shadow">
                <h3 className="font-bold mb-2 capitalize">{group === 'black' ? 'Negro' : group === 'green' ? 'Verde' : 'Morado'}</h3>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Rango de columnas</label>
                  <InputText value={config[group].rangeColumns} onChange={e => handleChange(group, 'rangeColumns', e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Número de columnas</label>
                  <InputNumber value={config[group].numColumns} onValueChange={e => handleChange(group, 'numColumns', e.value || 0)} />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Color</label>
                  <InputText value={config[group].color} onChange={e => handleChange(group, 'color', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="mt-6 flex justify-end">
          <div className="flex gap-3 pt-3">
            <Button
                label="Guardar configuración"
                icon="pi pi-save"
                className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
                onClick={handleSave} />
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
