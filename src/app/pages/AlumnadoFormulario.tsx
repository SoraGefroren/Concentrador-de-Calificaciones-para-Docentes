import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useState, useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';
import type { ColumnExcelConfig, ColumnExcelData, ColumnGroupConfig } from '../common/hooks/useExcelData';
import { formatFieldName, formatColumnHeader, getSectionsColumnsConfig } from '../common/utils/clusterOfMethods.tsx';
import * as XLSX from 'xlsx';

// Tipo para valores de entrada
type FormFieldValue = string | number | null | undefined;

// Tipos de modo para el formulario
type FormMode = 'view' | 'edit' | 'register';

const AlumnadoFormulario = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const context = useExcelContext();
    const excelData = context?.excelData || [];
    const columnConfig = context?.columnConfig || [];
    const { id, mode } = useParams<{ id?: string; mode?: string }>();

    // Abstraer los datos de los estudiantes
    const formDates = excelData.length > 0 ? [...excelData].slice(0, 1)[0] || {}: {};
    const formPoints = excelData.length > 1 ? [...excelData].slice(1, 2)[0] || {}: {};
    const studentsExcelData = excelData.length > 2 ? [...excelData].slice(2, excelData.length) : [];
    
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
    const firstSectionColumnExcel: Array<ColumnExcelConfig> = [
        ...groupSectionConfig.left.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig)
        )
    ];
    const secondSectionColumnExcel: Array<ColumnExcelConfig> = [
        ...groupSectionConfig.center.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig)
        )
    ];
    const thirdSectionColumnExcel: Array<ColumnExcelConfig> = [
        ...groupSectionConfig.right.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig)
        )
    ];

    // La primera columna es siempre el ID
    const idColumnName = (firstSectionColumnExcel.shift() || {label: ''})['label'] || '';
    
    // Encontrar los datos del alumno seleccionado (solo si no es modo registro)
    const alumnoData = formMode === 'register' 
        ? null 
        : studentsExcelData.find((row: ColumnExcelData) => row[idColumnName]?.toString() === id);
    
    // Estado para los datos editables
    const [formDatas, setFormDatas] = useState<ColumnExcelData>(() => {
        // Si es registro, inicializar con datos vacíos pero con un ID temporal
        if (formMode === 'register') {
            // Inicalizar un nuevo objeto para los datos del formulario
            const newExcelData: ColumnExcelData = {};
            // Asignar un ID temporal para el nuevo alumno
            newExcelData[idColumnName] = Math.max(...studentsExcelData.map((row: ColumnExcelData) => parseInt(row[idColumnName]?.toString() || '0', 10))) + 1;
            // Compone el resto de campos con valores vacíos
            for (const cExcelConfig of firstSectionColumnExcel) {
                newExcelData[cExcelConfig.label] = '';
            }
            for (const cExcelConfig of secondSectionColumnExcel) {
                newExcelData[cExcelConfig.label] = '';
            }
            for (const cExcelConfig of thirdSectionColumnExcel) {
                newExcelData[cExcelConfig.label] = '';
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

    const handleSaveForm = async () => {
        try {
            // Validar que los datos requeridos estén completos
            if (!formDatas[idColumnName]) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error de validación',
                    detail: 'El ID del alumno es requerido',
                    life: 3000
                });
                return;
            }

            // Validar campos obligatorios (puedes agregar más validaciones según tus necesidades)
            const requiredFields = firstSectionColumnExcel.filter(config => !config.isEditable);
            for (const field of requiredFields) {
                if (!formDatas[field.label] && formDatas[field.label] !== 0) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error de validación',
                        detail: `El campo "${formatColumnHeader(field.label)}" es requerido`,
                        life: 3000
                    });
                    return;
                }
            }
            
            if (formMode === 'register') {
                // Modo registro: Agregar nuevo alumno al array de datos
                formDatas[idColumnName] = studentsExcelData.length + 1;
                const newExcelData = [...studentsExcelData, formDatas];
                
                // Los datos se actualizarán cuando se recargue el archivo generado
                
                // Generar archivo Excel actualizado
                await generateUpdatedExcelFile(newExcelData);
                
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Nuevo alumno registrado y archivo actualizado',
                    life: 3000
                });
                
                // Navegar al catálogo después de un breve delay
                setTimeout(() => navigate('/'), 1500);
                
            } else {
                // Modo edición: Actualizar alumno existente
                const updatedExcelData = studentsExcelData.map((row: ColumnExcelData) => 
                    row[idColumnName]?.toString() === id ? formDatas : row
                );
                
                // Los datos se actualizarán cuando se recargue el archivo generado
                
                // Generar archivo Excel actualizado
                await generateUpdatedExcelFile(updatedExcelData);
                
                toast.current?.show({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Datos del alumno actualizados y archivo guardado',
                    life: 3000
                });
            }
            
        } catch (error) {
            console.error('Error al guardar los datos:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron guardar los cambios',
                life: 5000
            });
        }
    };

    // Función auxiliar para generar archivo Excel actualizado
    const generateUpdatedExcelFile = async (updatedExcelData: ColumnExcelData[]): Promise<void> => {
        try {
            // Mostrar mensaje de generación
            toast.current?.show({
                severity: 'info',
                summary: 'Generando archivo actualizado',
                detail: 'Creando archivo Excel con los cambios...',
                life: 2000
            });

            // Crear un workbook
            const wb = XLSX.utils.book_new();
            
            // ==================== HOJA 1: DATOS DE CALIFICACIONES ====================
            
            // Preparar lista de encabezados de la hoja de datos
            const arrayHeaderFields: string[] = [];

            // Construir encabezado de la primera hoja
            const matrixExcelData: (string | number)[][] = [[], [], []];

            columnConfig.forEach(groupConfig => {
                // Se recorren las columnas que conforman al grupo
                groupConfig.columns.forEach(excelConfig => {
                    // Se insertan los encabezados de las columnas (Titulo, Fecha, Puntos)
                    matrixExcelData[0].push(excelConfig.label || '');
                    matrixExcelData[1].push(excelConfig.date || '');
                    matrixExcelData[2].push(
                        (excelConfig.points == 0 || (excelConfig.points && (excelConfig.points > 0)))
                            ? excelConfig.points
                            : ''
                    );
                    // Se crear un arreglo con los nombres de las columnas
                    arrayHeaderFields.push(excelConfig.label || '');
                });
            });

            // Agregar los datos de los alumnos (incluyendo los cambios)
            if (updatedExcelData && updatedExcelData.length > 0 && arrayHeaderFields.length > 0) {
                updatedExcelData.forEach((rowData) => {
                    // Se inserta una nueva fila
                    matrixExcelData.push([]);
                    const lastIndex = matrixExcelData.length - 1;
                    // Se recorre cada columna para agregar los datos
                    arrayHeaderFields.forEach((headerField) => {
                        const value = rowData[headerField];
                        matrixExcelData[lastIndex].push(value || '');
                    });
                });
            }

            const wsData = XLSX.utils.aoa_to_sheet(matrixExcelData);

            // Crear worksheet de datos
            XLSX.utils.book_append_sheet(wb, wsData, 'Calificaciones');
            
            // ==================== HOJA 2: CONFIGURACIÓN ====================
            
            // Construir la configuración detallada (igual que en ConfiguracionHoja.tsx)
            const matrixConfigData: (string | number)[][] = [];
            columnConfig.forEach(groupConfig => {
                // Se inserta el encabezado de la configuración
                matrixConfigData.push([
                    'Grupo', groupConfig.label
                ]);
                matrixConfigData.push([
                    '', 'Columnas', 'Color', 'Tipo'
                ]);
                matrixConfigData.push([
                    '', groupConfig.id, groupConfig.color, groupConfig.type
                ]);
                // Se recorren las columnas que conforman al grupo
                groupConfig.columns.forEach(excelConfig => {
                    // Se insertan los encabezados de las columnas
                    matrixConfigData.push([
                        '', '', 'Encabezado', excelConfig.label
                    ]);
                    matrixConfigData.push([
                        '', '', '', 'Columna', 'Fecha', 'Puntos', 'Editable'
                    ]);
                    matrixConfigData.push([
                        '', '', '', excelConfig.id,
                        (excelConfig.date || ''),
                        ((excelConfig.points == 0 || excelConfig.points)
                            ? excelConfig.points
                            : ''),
                        (excelConfig.isEditable !== undefined ? (excelConfig.isEditable ? 'SI' : 'NO') : 'SI')
                    ]);
                });
                // Se inserta marca para el fin del grupo de la configuración
                matrixConfigData.push([
                    '...'
                ]);
            });
            
            // Crear worksheet de configuración
            const wsConfig = XLSX.utils.aoa_to_sheet(matrixConfigData);
            XLSX.utils.book_append_sheet(wb, wsConfig, 'Configuracion');
            
            // ==================== GENERAR ARCHIVO ====================
            
            // Generar el archivo
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // Crear nombre de archivo con timestamp para evitar conflictos
            const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
            const fileName = `CONC._CALIF._ACTUALIZADO_${timestamp}.xlsx`;
            
            // Crear un File object
            const file = new File([blob], fileName, { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // Descargar el archivo
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Limpiar URL
            URL.revokeObjectURL(url);

            // Mostrar mensaje de éxito
            toast.current?.show({
                severity: 'success',
                summary: 'Archivo generado',
                detail: `Archivo Excel descargado: ${fileName}`,
                life: 4000
            });

            // Opcionalmente, recargar el archivo en el contexto
            if (context?.loadExcelFromFile) {
                setTimeout(async () => {
                    try {
                        await context.loadExcelFromFile(file);
                        toast.current?.show({
                            severity: 'success',
                            summary: 'Datos actualizados',
                            detail: 'El archivo ha sido recargado con los nuevos datos',
                            life: 3000
                        });
                    } catch (error) {
                        console.error('Error al recargar el archivo:', error);
                        toast.current?.show({
                            severity: 'warn',
                            summary: 'Archivo descargado',
                            detail: 'El archivo fue descargado pero debes cargarlo manualmente si deseas continuar trabajando con él',
                            life: 4000
                        });
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('Error al generar el archivo Excel:', error);
            throw new Error('No se pudo generar el archivo Excel actualizado');
        }
    };
    
    const renderEditableField = (field: string, value: FormFieldValue, date: FormFieldValue, point: FormFieldValue): JSX.Element => {
        // En modo vista, mostrar solo lectura
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

    const renderReadOnlyField = (_field: string, value: FormFieldValue, date: FormFieldValue, point: FormFieldValue) => {
        // Campo de solo lectura - mostrar valor formateado
        return (
            <div className="p-2 bg-gray-50 rounded border border-gray-200 min-h-[38px] flex items-center">
                {typeof value === 'number' 
                    ? new Intl.NumberFormat('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(value)
                    : value?.toString() ?? ''}
                {point && (
                    <span className="ml-2 text-gray-500 text-sm">/ {point}</span>
                )}
                {date && (
                    <span className="ml-2 text-gray-400 text-xs">({date})</span>
                )}
            </div>
        );
    };

    const renderFormGroup = (groupConfig: ColumnGroupConfig, editable: boolean) => {
        // Lista de columnas que queremos mostrar
        const groupSectionColumnExcel: Array<ColumnExcelConfig> = [
            ...groupConfig.columns
                .map((excelConfig) => excelConfig.label != idColumnName ? excelConfig: null)
                .filter((excelConfig) => excelConfig !== null)
                .flatMap((excelConfig) => excelConfig)
        ];
        // Renderizar el grupo de color
        return (
            <>
                {groupSectionColumnExcel.map((excelConfig, idx) => {
                    const key = excelConfig.label;
                    return (
                        <div key={idx} className="mb-4">
                            <label className="flex items-center justify-between text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                <span className="block text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                    {formatColumnHeader(key)}
                                    {
                                        formPoints && (formPoints[key] || formPoints[formatFieldName(key)])
                                            ? ` / ${(formPoints[key] || formPoints[formatFieldName(key)])}`
                                            : ''
                                    }
                                </span>
                                {!excelConfig.isEditable && (
                                    <span className="text-xs text-gray-400 font-normal">
                                        🔒 Solo lectura
                                    </span>
                                )}
                            </label>
                            {
                                editable && excelConfig.isEditable
                                    ? renderEditableField(key,
                                        ((formDatas && (formDatas[key] || formDatas[formatFieldName(key)]))
                                            ? (formDatas[key] || formDatas[formatFieldName(key)] || '')
                                            : ''
                                        ),
                                        ((formDates && (formDates[key] || formDates[formatFieldName(key)]))
                                            ? (formDates[key] || formDates[formatFieldName(key)] || '')
                                            : ''
                                        ),
                                        ((formPoints && (formPoints[key] || formPoints[formatFieldName(key)]))
                                            ? (formPoints[key] || formPoints[formatFieldName(key)] || '')
                                            : ''
                                        )
                                    )
                                    : renderReadOnlyField(key,
                                        ((formDatas && (formDatas[key] || formDatas[formatFieldName(key)]))
                                            ? (formDatas[key] || formDatas[formatFieldName(key)] || '')
                                            : ''
                                        ),
                                        ((formDates && (formDates[key] || formDates[formatFieldName(key)]))
                                            ? (formDates[key] || formDates[formatFieldName(key)] || '')
                                            : ''
                                        ),
                                        ((formPoints && (formPoints[key] || formPoints[formatFieldName(key)]))
                                            ? (formPoints[key] || formPoints[formatFieldName(key)] || '')
                                            : ''
                                        )
                                    )
                            }
                        </div>
                    );
                })}
            </>
        );
    };

    const renderColorGroup = (groupConfig: ColumnGroupConfig, editable: boolean) => {
        // Lista de columnas que queremos mostrar
        const groupSectionColumnExcel: Array<ColumnExcelConfig> = [
            ...groupConfig.columns
                .map((excelConfig) => excelConfig)
                .flatMap((excelConfig) => excelConfig)
        ];
        // Obtener columnas específicas del grupo
        const { label: title, color: bgColor } = groupConfig;
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
                    {groupSectionColumnExcel.map((excelConfig, idx) => {
                        const key = excelConfig.label;
                        return (
                            <div key={idx} className="mb-4">
                                <label className="flex items-center justify-between text-gray-700 text-sm font-bold mb-2 min-h-[40px]">
                                    <span>
                                        {formatColumnHeader(key)}
                                    </span>
                                    {!excelConfig.isEditable && (
                                        <span className="text-xs text-gray-400 font-normal">
                                            🔒 Solo lectura
                                        </span>
                                    )}
                                </label>
                                {
                                    editable && excelConfig.isEditable
                                        ? renderEditableField(key,
                                            ((formDatas && (formDatas[key] || formDatas[formatFieldName(key)]))
                                                ? (formDatas[key] || formDatas[formatFieldName(key)] || '')
                                                : ''
                                            ),
                                            ((formDates && (formDates[key] || formDates[formatFieldName(key)]))
                                                ? (formDates[key] || formDates[formatFieldName(key)] || '')
                                                : ''
                                            ),
                                            ((formPoints && (formPoints[key] || formPoints[formatFieldName(key)]))
                                                ? (formPoints[key] || formPoints[formatFieldName(key)] || '')
                                                : ''
                                            )
                                        )
                                        : renderReadOnlyField(key,
                                            ((formDatas && (formDatas[key] || formDatas[formatFieldName(key)]))
                                                ? (formDatas[key] || formDatas[formatFieldName(key)] || '')
                                                : ''
                                            ),
                                            ((formDates && (formDates[key] || formDates[formatFieldName(key)]))
                                                ? (formDates[key] || formDates[formatFieldName(key)] || '')
                                                : ''
                                            ),
                                            ((formPoints && (formPoints[key] || formPoints[formatFieldName(key)]))
                                                ? (formPoints[key] || formPoints[formatFieldName(key)] || '')
                                                : ''
                                            )
                                        )
                                }
                            </div>
                        )
                    })}
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
                            onClick={handleSaveForm}
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
                            onClick={handleSaveForm}
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
                        {groupSectionConfig.left.map((groupConfig) => {
                            return renderFormGroup(groupConfig, formMode !== 'view');
                        })}
                    </div>
                </Card>

                {/* Segunda sección - Grupos por colores (Negro, Verde, Morado) */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Calificaciones por Período</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {groupSectionConfig.center.map((groupConfig) => {
                            return renderColorGroup(groupConfig, formMode !== 'view');
                        })}
                    </div>
                </div>

                {/* Tercera sección - Resultados (solo lectura) */}
                <Card>
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Resultados Finales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupSectionConfig.right.map((groupConfig) => {
                            return renderFormGroup(groupConfig, formMode !== 'view');
                        })}
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