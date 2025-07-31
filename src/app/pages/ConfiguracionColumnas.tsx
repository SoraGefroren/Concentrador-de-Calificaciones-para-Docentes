import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { useState } from 'react';
import type { ColumnConfig } from '../common/hooks/useExcelData';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

const ConfiguracionColumnas = () => {
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
    <Menu>
      <div className="max-w-2xl mx-auto py-8">
        <Card title="Configuración de Columnas">
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
          <div className="mt-6 flex justify-end">
            <Button label="Guardar configuración" icon="pi pi-save" className="p-button-success" onClick={handleSave} />
          </div>
        </Card>
      </div>
    </Menu>
  );
};

export default ConfiguracionColumnas;
