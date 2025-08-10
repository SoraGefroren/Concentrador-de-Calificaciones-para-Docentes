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

// Función para formatear los campos de las columnas
const formatFieldName = (fieldName: string): string => {
    return fieldName.replace(/[ÁÉÍÓÚÜáéíóúüÑñ]/g, '�');
}

// Función para formatear los headers de las columnas (igual que en AlumnadoCatalogo y StudentDetailsModal)
const formatColumnHeader = (columnName: string): string => {
    // Casos especiales para ciertos campos
    const specialCases: { [key: string]: string } = {
        'ID': 'ID',
        'CORREO.ELECTONICO ': 'Correo Electrónico',
        'CORREO.ELECTONICO': 'Correo Electrónico',
        'SUMA.PORCENTAJE.ACTIVIDADES': 'Suma % Actividades',
        'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES': 'Total Alcanzado % Actividades',
        'PARTICIPACIÓN': 'Participación',
        'TOTAL.ALCANZADO': 'Total Alcanzado',
        'CALIFICACION': 'Calificación'
    };

    // Si hay un caso especial definido, usarlo
    if (specialCases[columnName]) {
        return specialCases[columnName];
    }

    // Detectar y formatear fechas al final del texto
    // Patrón: texto-dd-mmm-yy (ejemplo: "Conceptos Basicos Probabilidad-05-nov-21")
    const datePattern = /^(.+)-(\d{1,2})-([a-z]{3})-(\d{2})$/i;
    const dateMatch = columnName.match(datePattern);
    
    if (dateMatch) {
        const [, textPart, day, month, year] = dateMatch;
        // Formatear la parte del texto (reemplazar puntos por espacios y capitalizar)
        const formattedText = textPart
            .split('.')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Formatear la fecha: dd/mmm/yy
        const formattedDate = `${day}/${month}/${year}`;
        
        return `${formattedText.replace('-', ' ').replace('-', ' ').replace('  ', ' ')} ${formattedDate}`;
    }

    // Formateo general para otros casos
    return columnName
        .split('.') // Dividir por puntos
        .map(word => word.toLowerCase()) // Convertir a minúsculas
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizar primera letra
        .join(' ')
        .replace('-', ' ')
        .replace('-', ' ')
        .replace('  ', ' '); // Unir con espacios
};

const AlumnadoFormulario = () => {
    const { excelData, columnConfig } = useExcelContext();
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    
    // Encontrar los datos del alumno seleccionado
    const alumnoData = excelData.find((row) => 
        row['ID']?.toString() === id
    ); // Estado para los datos editables
    const [formData, setFormData] = useState<ExcelData>(alumnoData || {});
    
    const datesData = [...excelData].slice(0, 1)[0];
    const [formDates, setFormDates] = useState<ExcelData>(datesData || {});
    const pointsData = [...excelData].slice(1, 2)[0];
    const [formPoints, setFormPoints] = useState<ExcelData>(pointsData || {});

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
                        onClick={() => navigate('/')}
                        className="p-button-primary" />
                </div>
            </Menu>
        );
    }

    // Función para obtener las columnas por grupo de color
    const getColumnsByGroup = (group: 'black' | 'green' | 'purple', myFormData: ExcelData) => {
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
        const allMiddleColumns = Object.entries(myFormData)
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
    
    const renderEditableInput = (field: string, value: FormFieldValue, date: FormFieldValue, point: FormFieldValue) => {
        if (typeof value === 'number') {
            if (date || point) {
                return (
                    <div className="p-inputgroup flex-1">
                        <InputNumber
                            value={value}
                            onValueChange={(e) => handleInputChange(field, e.value)}
                            tooltip={date ? `${date}` : ''}
                            mode="decimal"
                            minFractionDigits={2}
                            maxFractionDigits={2}
                            className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                            locale="es-MX"
                        />
                        <span className="p-inputgroup-addon">
                            {point ? `/${point}` : ''}
                        </span>
                    </div>
                );
            } else {
                return (
                    <InputNumber
                        value={value}
                        onValueChange={(e) => handleInputChange(field, e.value)}
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                        locale="es-MX"
                    />
                );
            }
        } else {
            if (date || point) {
                return (
                    <div className="p-inputgroup flex-1">
                        <InputText
                            value={value?.toString() ?? ''}
                            tooltip={date ? `${date}` : ''}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                        <span className="p-inputgroup-addon">
                            {point ? `/${point}` : ''}
                        </span>
                    </div>
                );
            } else {
                return (
                    <InputText
                        value={value?.toString() ?? ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                    />
                );
            }
        }
    };

    const renderReadOnlyField = (field: string, value: FormFieldValue, date: FormFieldValue, point: FormFieldValue) => {
        // Caso especial: hacer editable el campo "PARTICIPACIÓN"
        if (field === 'PARTICIPACIÓN') {
            return renderEditableInput(field, value, date, point);
        }
        
        // Para todos los demás campos, mantener como solo lectura
        return (
            <div className="p-2">
                {typeof value === 'number' 
                    ? new Intl.NumberFormat('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(value)
                    : value?.toString() ?? ''}
            </div>
        );
    };

    const renderColorGroup = (group: 'black' | 'green' | 'purple', title: string, bgColor: string) => {
        const columns = getColumnsByGroup(group, formData);
        const columnsDates = getColumnsByGroup(group, formDates);
        const columnsPoints = getColumnsByGroup(group, formPoints);
        
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
                    {columns.map(([key, value], idx) => (
                        <div key={key} className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                {formatColumnHeader(key)}
                            </label>
                            {renderEditableInput(key, value,
                                    (((columnsDates.length > idx) && (columnsDates[idx].length > 1))
                                        ? (columnsDates[idx][1] || '')
                                        : ''
                                    ),
                                    (((columnsPoints.length > idx) && (columnsPoints[idx].length > 1))
                                        ? (columnsPoints[idx][1] || '')
                                        : ''
                                    )
                                )}
                        </div>
                    ))}
                </div>
            </Card>
        );
    };

    return (
        <Menu
            navBarTitle={`Formulario del Alumno - ${formData['ID']}`}>
            <Toast ref={toast} />
            <div className="p-4 max-w-7xl w-full">
                <div className="flex justify-end items-center mb-6">
                    <div className="flex gap-3">
                        <Button 
                            label="Guardar Cambios"
                            icon="pi pi-save"
                            onClick={handleSave}
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
                        />
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
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {firstSectionFields.map(field => (
                            <div key={field} className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                    {formatColumnHeader(field)}
                                </label>
                                {renderEditableInput(field, formData[field], null, null)}
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
                                <label className="block text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                    {formatColumnHeader(field)}
                                    {formPoints && (formPoints[field] || formPoints[formatFieldName(field)]) ? ` / ${(formPoints[field] || formPoints[formatFieldName(field)])}` : ''}
                                </label>
                                {renderReadOnlyField(field,
                                    (formData[field] || formData[formatFieldName(field)]),
                                    (formDates[field] || formDates[formatFieldName(field)]),
                                    (formPoints[field] || formPoints[formatFieldName(field)])
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
                
                <div className="flex justify-end items-center mb-6">
                    <div className="flex gap-3 pt-3">
                        <Button 
                            label="Guardar Cambios"
                            icon="pi pi-save"
                            onClick={handleSave}
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2" 
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
  
export default AlumnadoFormulario;