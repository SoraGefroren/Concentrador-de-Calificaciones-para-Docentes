import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import type { ColumnExcelData, ColumnGroupConfig } from '../common/hooks/useExcelData';
import { formatFieldName, formatColumnHeader, getSectionsColumnsConfig } from '../common/utils/clusterOfMethods.tsx';

// Tipo para valores de entrada
type FormFieldValue = string | number | null | undefined;

// Tipos de modo para el formulario
type FormMode = 'view' | 'edit' | 'register';

const AlumnadoFormulario = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { excelData, columnConfig } = useExcelContext();
    const { id, mode } = useParams<{ id?: string; mode?: string }>();
    
    // Determinar el modo del formulario
    const formMode: FormMode = (() => {
        // Si la URL es /alumno/nuevo, es registro
        if (window.location.pathname === '/alumno/nuevo' || id === 'nuevo') {
            return 'register';
        }
        // Si tiene parámetro mode=vista, es vista
        if (mode === 'vista') {
            return 'view';
        }
        // Si tiene ID pero no mode, es edición
        if (id && id !== 'nuevo') {
            return 'edit';
        }
        // Por defecto, edición
        return 'edit';
    })();

    // Tomar la configuración de secciones izquierda, centro y derecha
    const groupSectionConfig = getSectionsColumnsConfig(columnConfig);
    
    // Campos de las secciones según la lógica del modal
    const firstSectionFields = [
        ...groupSectionConfig.left.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig.label)
        )
    ];
    const secondSectionFields = [
        ...groupSectionConfig.center.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig.label)
        )
    ];
    const thirdSectionFields = [
        ...groupSectionConfig.right.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig.label)
        )
    ];

    // La primera columna es siempre el ID
    const idColumnName = firstSectionFields.shift();
    
    // Encontrar los datos del alumno seleccionado (solo si no es modo registro)
    const alumnoData = formMode === 'register' 
        ? null 
        : excelData.find((row: ColumnExcelData) => row[idColumnName]?.toString() === id);
    
    // Estado para los datos editables
    const [formDatas, setFormDatas] = useState<ColumnExcelData>(() => {
        // Si es registro, inicializar con datos vacíos pero con un ID temporal
        if (formMode === 'register') {
            // Inicalizar un nuevo objeto para los datos del formulario
            const newExcelData: ColumnExcelData = {};
            // Asignar un ID temporal para el nuevo alumno
            newExcelData[idColumnName] = Math.max(...excelData.map((row: ColumnExcelData) => parseInt(row[idColumnName]?.toString() || '0', 10))) + 1;
            // Compone el resto de campos con valores vacíos
            for (const field of firstSectionFields) {
                newExcelData[field] = '';
            }
            for (const field of secondSectionFields) {
                newExcelData[field] = '';
            }
            for (const field of thirdSectionFields) {
                newExcelData[field] = '';
            }
            // Asignar el resto de campos con valores vacíos
            return newExcelData;
        }
        // Devolver los datos del alumno encontrado o un objeto vacío si no existe
        return alumnoData || {};
    });

    useEffect(() => {
        if (alumnoData && formMode !== 'register') {
            setFormDatas(alumnoData);
        }
    }, [alumnoData, formMode]);
    
    const formDates = [...excelData].slice(0, 1)[0] || {};
    const formPoints = [...excelData].slice(1, 2)[0] || {};
    
    // Menu de error si no se encuentra el alumno
    if (!alumnoData && formMode !== 'register') {
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

    const handleInputChange = (field: string, value: FormFieldValue) => {
        setFormDatas((prev: ColumnExcelData) => ({
            ...prev,
            [field]: value ?? ''
        }));
    };

    const handleSave = () => {
        if (formMode === 'register') {
            // Lógica para registrar un nuevo alumno
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Nuevo alumno registrado correctamente',
                life: 3000
            });
            // Después de registrar, navegar al catálogo
            setTimeout(() => navigate('/'), 1500);
        } else {
            // Lógica para actualizar alumno existente
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Datos del alumno actualizados correctamente',
                life: 3000
            });
        }
    };
    
    const renderEditableInput = (field: string, value: FormFieldValue, date: FormFieldValue, point: FormFieldValue): JSX.Element => {
        // En modo vista, mostrar solo lectura (excepto para PARTICIPACIÓN)
        if (formMode === 'view' && field !== 'PARTICIPACIÓN') {
            return renderReadOnlyField(field, value, date, point);
        }

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
                            disabled={formMode === 'view'}
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
                        disabled={formMode === 'view'}
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
                            disabled={formMode === 'view'}
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
                        disabled={formMode === 'view'}
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

    const renderColorGroup = (groupConfig: ColumnGroupConfig) => {
        // Lista de columnas que queremos mostrar
        const groupCenterColumns = [
            ...groupConfig.columns.map((excelConfig) => excelConfig.label).flatMap((label) => label)
        ];
        // Función para obtener las columnas por grupo de color
        const getColumnsByGroup = (myGroupColumns: string[], myFormExcelData: ColumnExcelData) => {
            // Filtrar todas las columnas excluyendo las de las secciones primera y tercera
            const allMiddleColumns =
                Object.entries(myFormExcelData)
                .filter(([key]) => myGroupColumns.includes(key));
            // Obtener las columnas del rango específico para este grupo
            return allMiddleColumns;
        };
        // Obtener columnas específicas del grupo
        const { label: title, color: bgColor } = groupConfig;
        const columnsExcel = getColumnsByGroup(groupCenterColumns, formDatas);
        const columnsDates = getColumnsByGroup(groupCenterColumns, formDates);
        const columnsPoints = getColumnsByGroup(groupCenterColumns, formPoints);
        // Validar si hay columnas para mostrar
        if (columnsExcel.length === 0) {
            return null;
        }
        // Renderizar el grupo de color
        return (
            <Card className="mb-6">
                <div 
                    className="p-3 rounded-t text-white font-bold text-center mb-4"
                    style={{ backgroundColor: bgColor }}
                >
                    {title}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {columnsExcel.map(([key, value], idx) => (
                        <div key={key} className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                {formatColumnHeader(key)}
                            </label>
                            {renderEditableInput(key, value as FormFieldValue,
                                    (((columnsDates.length > idx) && (columnsDates[idx].length > 1))
                                        ? (columnsDates[idx][1] as FormFieldValue || '')
                                        : ''
                                    ),
                                    (((columnsPoints.length > idx) && (columnsPoints[idx].length > 1))
                                        ? (columnsPoints[idx][1] as FormFieldValue || '')
                                        : ''
                                    )
                                )}
                        </div>
                    ))}
                </div>
            </Card>
        );
    };

    // Función para obtener el título dinámico
    const getPageTitle = () => {
        switch (formMode) {
            case 'view':
                return `Detalle del Alumno - ${formDatas[idColumnName]}`;
            case 'edit':
                return `Editar Alumno - ${formDatas[idColumnName]}`;
            case 'register':
                return 'Registrar Nuevo Alumno';
            default:
                return 'Formulario del Alumno';
        }
    };

    // Función para renderizar los botones de acción
    const renderActionButtons = () => {
        switch (formMode) {
            case 'view':
                return (
                    <div className="flex gap-3">
                        <Button 
                            label="Editar Alumno"
                            icon="pi pi-file-edit"
                            onClick={() => navigate(`/alumno/${formDatas[idColumnName]}`)}
                            className="p-button-primary text-white bg-blue-500 hover:bg-blue-800 p-2"
                        />
                        <Button 
                            label="Volver al catálogo" 
                            icon="pi pi-arrow-left"
                            onClick={() => navigate('/')}
                            className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2"
                        />
                    </div>
                );
            case 'edit':
                return (
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
                );
            case 'register':
                return (
                    <div className="flex gap-3">
                        <Button 
                            label="Registrar Alumno"
                            icon="pi pi-save"
                            onClick={handleSave}
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
                        />
                        <Button 
                            label="Cancelar" 
                            icon="pi pi-times"
                            onClick={() => navigate('/')}
                            className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Menu
            navBarTitle={getPageTitle()}>
            <Toast ref={toast} />
            <div className="p-4 max-w-7xl w-full">
                {/* Botones principales */}
                <div className="flex justify-end items-center mb-6">
                    {renderActionButtons()}
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
                                {renderEditableInput(field, formDatas[field], null, null)}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Segunda sección - Grupos por colores (Negro, Verde, Morado) */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Calificaciones por Período</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {groupSectionConfig.center.map((groupConfig) => {
                            return renderColorGroup(groupConfig)
                        })}
                    </div>
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
                                    (formDatas[field] || formDatas[formatFieldName(field)]),
                                    (formDates[field] || formDates[formatFieldName(field)]),
                                    (formPoints[field] || formPoints[formatFieldName(field)])
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
                
                <div className="flex justify-end items-center mb-6">
                    <div className="pt-3">
                        {renderActionButtons()}
                    </div>
                </div>
            </div>
        </Menu>
    );
};
  
export default AlumnadoFormulario;