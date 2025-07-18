import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import type { ExcelData } from '../common/hooks/useExcelData';

// Tipo para valores de entrada
type FormFieldValue = string | number | null | undefined;

// Campos de las secciones según la lógica del modal
const firstSectionFields = ['NOMBRE', 'APELLIDO', 'CORREO.ELECTONICO '];
const thirdSectionFields = ['SUMA.PORCENTAJE.ACTIVIDADES', 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', 'PARTICIPACIÓN', 'TOTAL.ALCANZADO', 'CALIFICACION'];

const AlumnadoFormulario = () => {
    const { excelData, columnConfig } = useExcelContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    
    // Encontrar los datos del alumno seleccionado
    const alumnoData = excelData.find((row) => 
        row['ID']?.toString() === id
    );    // Estado para los datos editables
    const [formData, setFormData] = useState<ExcelData>(alumnoData || {});

    useEffect(() => {
        if (alumnoData) {
            setFormData(alumnoData);
        }
    }, [alumnoData]);

    if (!alumnoData) {
        return (
            <Menu>
                <div className="p-4">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Alumno no encontrado</h2>
                    <Button 
                        label="Volver al catálogo" 
                        onClick={() => navigate('/alumnado/catalogo')}
                        className="p-button-primary" />
                </div>
            </Menu>
        );
    }

    // Función para obtener las columnas por grupo de color
    const getColumnsByGroup = (group: 'black' | 'green' | 'purple') => {
        const blackColumns = columnConfig.black.numColumns;
        const greenColumns = columnConfig.green.numColumns;
        
        let start = 0;
        let end = 0;
          switch (group) {
            case 'black':
                end = blackColumns - 1;
                break;
            case 'green':
                start = blackColumns;
                end = blackColumns + greenColumns - 1;
                break;
            case 'purple':
                start = blackColumns + greenColumns;
                end = blackColumns + greenColumns + columnConfig.purple.numColumns - 1;
                break;
        }

        // Filtrar todas las columnas excluyendo las de las secciones primera y tercera
        const allMiddleColumns = Object.entries(formData)
            .filter(([key]) => !firstSectionFields.includes(key) && 
                              !thirdSectionFields.includes(key) && 
                              key !== 'BUSQUEDA' &&
                              key !== 'ID2' &&
                              key !== 'ID' &&
                              key !== 'Column 33');

        // Obtener las columnas del rango específico para este grupo
        return allMiddleColumns.slice(start, end + 1);
    };

    const handleInputChange = (field: string, value: FormFieldValue) => {
        setFormData(prev => ({
            ...prev,
            [field]: value ?? ''
        }));
    };

    const handleSave = () => {
        // Aquí puedes implementar la lógica para guardar los cambios
        toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Datos del alumno actualizados correctamente',
            life: 3000
        });
    };
    
    const renderEditableInput = (field: string, value: FormFieldValue) => {
        if (typeof value === 'number') {
            return (
                <InputNumber
                    value={value}
                    onValueChange={(e) => handleInputChange(field, e.value)}
                    mode="decimal"
                    minFractionDigits={2}
                    maxFractionDigits={2}
                    className="w-full"
                    locale="es-MX"
                />
            );
        } else {
            return (
                <InputText
                    value={value?.toString() ?? ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-full"
                />
            );
        }
    };

    const renderReadOnlyField = (_field: string, value: FormFieldValue) => (
        <div className="p-2 bg-gray-100 rounded border">
            {typeof value === 'number' 
                ? new Intl.NumberFormat('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(value)
                : value?.toString() ?? ''}
        </div>
    );

    const renderColorGroup = (group: 'black' | 'green' | 'purple', title: string, bgColor: string) => {
        const columns = getColumnsByGroup(group);
        
        if (columns.length === 0) return null;

        return (
            <Card className="mb-6">
                <div 
                    className="p-3 rounded-t text-white font-bold text-center mb-4"
                    style={{ backgroundColor: bgColor }}
                >
                    {title}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {columns.map(([key, value]) => (
                        <div key={key} className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                {key}
                            </label>
                            {renderEditableInput(key, value)}
                        </div>
                    ))}
                </div>
            </Card>
        );
    };

    return (
        <Menu>
            <Toast ref={toast} />
            <div className="p-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Formulario del Alumno - {formData['ID']}
                    </h2>
                    <div className="flex gap-3">
                        <Button 
                            label="Guardar Cambios"
                            icon="pi pi-save"
                            onClick={handleSave}
                            className="p-button-success" 
                        />
                        <Button 
                            label="Volver al catálogo" 
                            icon="pi pi-arrow-left"
                            onClick={() => navigate('/alumnado/catalogo')}
                            className="p-button-secondary" 
                        />
                    </div>
                </div>

                {/* Primera sección - Datos básicos editables */}
                <Card className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {firstSectionFields.map(field => (
                            <div key={field} className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    {field}
                                </label>
                                {renderEditableInput(field, formData[field])}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Segunda sección - Grupos por colores (Negro, Verde, Morado) */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Calificaciones por Período</h3>
                    {renderColorGroup('black', 'Primer Período (Negro)', '#374151')}
                    {renderColorGroup('green', 'Segundo Período (Verde)', '#059669')}
                    {renderColorGroup('purple', 'Tercer Período (Morado)', '#7c3aed')}
                </div>

                {/* Tercera sección - Resultados (solo lectura) */}
                <Card>
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Resultados Finales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {thirdSectionFields.map(field => (
                            <div key={field} className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    {field}
                                </label>
                                {renderReadOnlyField(field, formData[field])}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </Menu>
    );
};
  
export default AlumnadoFormulario;