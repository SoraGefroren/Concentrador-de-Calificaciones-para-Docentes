import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import type { ColumnExcelConfig, ColumnExcelData, ColumnGroupConfig } from '../common/hooks/useExcelData';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useState, useRef, useMemo } from 'react';
import StudentDetailsModal from '../common/modals/students/StudentDetailsModal.tsx';
import StudentActionButtons from '../common/modals/students/StudentActionButtons.tsx';
import DeleteStudentModal from '../common/modals/students/DeleteStudentModal.tsx';
import { InputText } from 'primereact/inputtext';
import { formatColumnHeader, formatFieldName, getSectionsColumnsConfig } from '../common/utils/clusterOfMethods.tsx';

/**
 * ARQUITECTURA DE DATOS REFACTORIZADA:
 * 
 * Estructura clara de excelData:
 * - excelData[0] = datesExcelData    (fechas de las actividades)
 * - excelData[1] = pointsExcelData   (puntos de cada actividad)
 * - excelData[2...n] = studentsExcelData (datos de estudiantes)
 * 
 * tableDataExcelData (usado en DataTable):
 * - tableDataExcelData[0] = pointsExcelData   (fila especial - rowIndex === 0)
 * - tableDataExcelData[1...n] = studentsExcelData (estudiantes - rowIndex > 0)
 * 
 * Beneficios de esta estructura:
 * ✅ Separación clara de responsabilidades
 * ✅ Reactualización automática con useMemo cuando cambian los estudiantes
 * ✅ Lógica más legible en columnContentShowBodyTemplate
 * ✅ Mantiene la fila especial de puntos de manera explícita
 */

const AlumnadoCatalogo = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const context = useExcelContext();
    const excelData = useMemo(() => context?.excelData || [], [context?.excelData]);
    const columnConfig = useMemo(() => context?.columnConfig || [], [context?.columnConfig]);
    const [selectedData, setSelectedData] = useState<ColumnExcelData | null>(null);
    const [deleteModal, setDeleteModal] = useState<{visible: boolean; studentId: string | number; studentName?: string} | null>(null);
    const [activeModal, setActiveModal] = useState<{groupId: string; groupInfo: ColumnGroupConfig} | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Separación clara de tipos de datos con optimización de memoria
    const datesExcelData = useMemo(() => 
        excelData.length > 0 ? [...excelData].slice(0, 1)[0] || {} : {},
        [excelData]
    );
    const pointsExcelData = useMemo(() => 
        excelData.length > 1 ? [...excelData].slice(1, 2)[0] || {} : {},
        [excelData]
    );
    const studentsExcelData = useMemo(() => 
        excelData.length > 2 ? [...excelData].slice(2, excelData.length) || [] : [],
        [excelData]
    );

    // Tomar la configuración de secciones izquierda, centro y derecha
    const groupSectionConfig = getSectionsColumnsConfig(columnConfig);
    
    // Filtrar studentsExcelData basado en el término de búsqueda
    const filteredStudentsExcelData = useMemo(() => {
        if (!searchTerm.trim()) {
            return studentsExcelData;
        }
        // Filtrar estudiantes que coincidan con el término de búsqueda en cualquier campo
        return studentsExcelData.filter((student) => {
            // Buscar en todos los campos del estudiante
            return Object.values(student).some((value) => {
                if (value === null || value === undefined) return false;
                // Convertir a string y buscar (insensible a mayúsculas/minúsculas)
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [studentsExcelData, searchTerm]);

    // Crear dataset específico para el DataTable con fila de puntos + estudiantes filtrados
    // Se reactualiza automáticamente cuando cambian los datos de estudiantes o el término de búsqueda
    const tableDataExcelData = useMemo(() => {
        // Concatenar puntos (fila especial) + estudiantes filtrados
        // Esto mantiene la fila especial pero de manera más explícita
        // tableDataExcelData[0] = pointsExcelData (fila especial)
        // tableDataExcelData[1...n] = filteredStudentsExcelData (estudiantes filtrados)
        return [pointsExcelData, ...filteredStudentsExcelData].filter(Boolean);
    }, [pointsExcelData, filteredStudentsExcelData]);

    
    // Campos de las secciones según la nueva lógica dinámica
    const leftSectionColumnExcel: Array<ColumnExcelConfig> = [
        ...groupSectionConfig.left.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig)
        )
    ];

    // Lista de TODAS las columnas que queremos mostrar (left + center + right)
    const columnsToShow = [
        ...groupSectionConfig.left.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig.label)
        ),
        ...groupSectionConfig.right.flatMap((groupConfig) => 
            groupConfig.columns.map((excelConfig) => excelConfig.label)
        )
    ];

    // La primera columna es siempre el ID (primera columna de la sección izquierda)
    const idColumnName = leftSectionColumnExcel[0]?.label || '';

    // Función para asignar clases CSS a las filas (colorear filas alternadas)
    const getRowClassName = (data: ColumnExcelData) => {
        // Obtenemos el índice de la fila actual en los datos originales
        const originalRowIndex = excelData.indexOf(data);
        // La fila 0 es especial, mantener su estilo original
        if (originalRowIndex === 0) {
            return 'bg-blue-500 text-white font-bold special-row';
        }
        // Para las demás filas, aplicar colores intercalados basándose en el ID o posición
        // Usamos el originalRowIndex para determinar el color
        if ((originalRowIndex - 1) % 2 === 0) {
            return 'bg-[#99b1d5] hover:bg-[#7789a5] hover:text-white transition-colors duration-200'; // Azul suave para filas pares
        } else {
            return 'bg-white hover:bg-[#7789a5] hover:text-white transition-colors duration-200'; // Blanco para filas impares
        }
    };

    // Función para copiar texto al portapapeles
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.current?.show({
                severity: 'success',
                summary: 'Copiado',
                detail: 'Correo electrónico copiado al portapapeles',
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo copiar al portapapeles',
                life: 3000
            });
        }
    };

    // Función para mostrar la modal de confirmación de eliminación
    const showDeleteConfirmation = (studentId: string | number, studentName?: string) => {
        setDeleteModal({
            visible: true,
            studentId,
            studentName
        });
    };

    const columnContentShowBodyTemplate = (excelColumn: string) => {
        // Retornamos una función que recibe el rowData y rowIndex
        return (rowData: ColumnExcelData, props: { rowIndex: number }) => {
            const { rowIndex } = props;
            // CASO ESPECIAL: Primera fila (rowIndex === 0) = Fila de PUNTOS
            if (rowIndex === 0) {
                // Si el campo es un número, le damos formato
                if (rowData[excelColumn] && (rowData[excelColumn] !== 'Puntos')) {
                    return  <div className="w-full text-right font-bold">
                                { rowData[excelColumn] || rowData[formatFieldName(excelColumn)] || 0 }
                            </div>;
                } else {
                    // Etiqueta de fecha vacía o no válida
                    return  <div className="w-full text-right font-bold">
                                { rowData[excelColumn] || rowData[formatFieldName(excelColumn)] || '' }
                            </div>;
                }
            } 
            // CASO NORMAL: Todas las demás filas = ESTUDIANTES
            else {
                // Verificar si es la primera columna (ID) para mostrar botones de acción
                if (idColumnName === excelColumn) {
                    return columnContentValueIdentifierTemplate(rowData, { field: excelColumn, rowIndex });    
                // Verificar el contenido hace match con el formato de los correos electrónicos
                } else if (
                    rowData[excelColumn] && (rowData[excelColumn] as string).match(/^(.+)@(.+)$/) ||
                    rowData[formatFieldName(excelColumn)] && (rowData[formatFieldName(excelColumn)] as string).match(/^(.+)@(.+)$/)
                ) {
                    return columnContentValueMailTemplate(rowData, { field: excelColumn, rowIndex });
                // Verificar si es algún tipo de número para formatearlo
                } else if (
                    (rowData[excelColumn] || rowData[excelColumn] == '0') && !isNaN(Number(rowData[excelColumn])) ||
                    (rowData[formatFieldName(excelColumn)] || rowData[formatFieldName(excelColumn)] == '0') && !isNaN(Number(rowData[formatFieldName(excelColumn)]))
                ) {
                    return <div className="w-full text-right">
                                { 
                                    new Intl.NumberFormat('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }).format(
                                        parseFloat((rowData[excelColumn] || rowData[formatFieldName(excelColumn)] || '0') + '')
                                    )
                                }
                            </div>
                // Simplemente mostrar el valor como texto
                } else {
                    return  <div className="w-full text-left font-semibold">
                                { rowData[excelColumn] || rowData[formatFieldName(excelColumn)] || '' }
                            </div>;
                }
            }
        };
    };

    const columnContentValueIdentifierTemplate = (rowData: ColumnExcelData, props: { field: string, rowIndex: number }) => {
        return (
            <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 text-right font-bold">
                <span className="p-button-rounded px-2 py-1 bg-gray-100 rounded text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-0">
                    { rowData[props.field] || '0' }
                </span>
                <div className="flex gap-1">
                    <Button
                        icon="pi pi-file-edit"
                        className="p-button-rounded text-white bg-blue-500 hover:bg-blue-800"
                        style={{ 
                            fontWeight: 'bolder'
                        }}
                        onClick={() => navigate(`/alumno/${rowData[props.field]}`)}
                        tooltip="Editar"
                    />
                    <Button 
                        icon="pi pi-eye"
                        className="p-button-rounded text-white bg-green-500 hover:bg-green-800"
                        style={{ 
                            fontWeight: 'bolder'
                        }}
                        onClick={() => navigate(`/alumno/${rowData[props.field]}/vista`)}
                        tooltip="Ver"
                    />
                    <Button 
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-secondary"
                        style={{ 
                            backgroundColor: 'red', 
                            fontWeight: 'bolder', 
                            color: 'lightgray'
                        }}
                        onClick={() => {
                            // Obtener nombre del estudiante si existe (buscar en columnas comunes de nombre)
                            const possibleNameFields = ['NOMBRE', 'Nombre', 'nombre', 'NOMBRES', 'Nombres', 'nombres'];
                            const studentName = possibleNameFields.find(field => rowData[field])
                                ? String(rowData[possibleNameFields.find(field => rowData[field]) || ''])
                                : undefined;
                            showDeleteConfirmation(rowData[props.field], studentName);
                        }}
                        tooltip="Eliminar"
                    />
                </div>
            </div>
        );
    };
    
    const columnContentValueMailTemplate = (rowData: ColumnExcelData, props: { field: string, rowIndex: number }) => {
        if (rowData[props.field] || rowData[formatFieldName(props.field)]) {
            const email = String(rowData[props.field] || rowData[formatFieldName(props.field)]);
            
            // Truncar email en móvil si es muy largo
            const truncateEmail = (email: string, maxLength: number = 20) => {
                if (email.length <= maxLength) return email;
                const [username, domain] = email.split('@');
                if (username.length > maxLength - domain.length - 3) {
                    return `${username.substring(0, maxLength - domain.length - 6)}...@${domain}`;
                }
                return email;
            };
            
            return (
                <div className="p-inputgroup w-full max-w-[200px] sm:max-w-[280px]">
                    <Button
                        label={window.innerWidth < 640 ? truncateEmail(email) : email}
                        className="p-button-text overflow-hidden"
                        style={{ 
                            color: '#2563eb',
                            textDecoration: 'underline',
                            justifyContent: 'flex-start',
                            borderRadius: '6px 0 0 6px',
                            border: '1px solid #dee2e6',
                            borderRight: 'none',
                            backgroundColor: '#ffffff',
                            padding: '0.375rem 0.5rem',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            minWidth: '0',
                            flex: '1',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                        onClick={() => window.open(`mailto:${email}`, '_blank')}
                        tooltip={`Enviar correo a: ${email}`}
                    />
                    <Button
                        icon="pi pi-copy"
                        className="p-button-outlined"
                        style={{
                            borderRadius: '0 6px 6px 0',
                            border: '1px solid #dee2e6',
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            padding: '0.375rem',
                            minWidth: '2rem',
                            fontSize: '0.75rem'
                        }}
                        onClick={() => copyToClipboard(email)}
                        tooltip="Copiar correo"
                    />
                </div>
            );
        } else {
            return null;
        }
    };
    
    // Template para la columna de acciones
    const columnContentValueAccsTemplate = (rowData: ColumnExcelData, props: { field: string, rowIndex: number }) => {
        if (props.rowIndex === 0) return null;
        return (
            <StudentActionButtons
                rowData={rowData}
                centerGroups={groupSectionConfig.center}
                onSelectData={(data, groupId, groupInfo) => {
                    setSelectedData(data);
                    setActiveModal({ groupId, groupInfo });
                }}
            />
        );
    };
    
    return (
        <Menu
            navBarTitle="Catálogo de Alumnos">
            
            <Toast ref={toast} />

            <div className="py-2 sm:py-4 mx-auto px-2 sm:px-4 lg:px-6">
                
                {/* Header responsivo con búsqueda y botón */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                    {/* Barra de búsqueda */}
                    <div className="flex-1 max-w-md">
                        <div className="p-inputgroup">
                            <InputText
                                className="bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2 text-sm md:text-base"
                                placeholder="Buscar estudiante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="p-inputgroup-addon">
                                <span className='pi pi-search'></span>
                            </span>
                        </div>
                    </div>
                    {/* Botones de acción */}
                    <div className="flex gap-3 justify-end lg:justify-start">
                        <Button 
                            label="Registrar Alumno"
                            icon="pi pi-file"
                            onClick={() => navigate('/alumno/nuevo')}
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2 text-sm md:text-base px-3 md:px-4"
                        />
                    </div>
                </div>

                <style>
                    {`
                        .custom-table .p-datatable-thead > tr > th {
                            background-color: #374151 !important; /* bg-gray-800 - mismo color que el menú */
                            color: white !important;
                            font-weight: 600 !important;
                            border: 1px solid #4b5563 !important;
                            padding: 0.5rem !important;
                            text-align: center !important;
                            font-size: 0.875rem !important;
                        }
                        
                        /* Responsive header padding */
                        @media (min-width: 768px) {
                            .custom-table .p-datatable-thead > tr > th {
                                padding: 0.75rem !important;
                                font-size: 1rem !important;
                            }
                        }
                        
                        .custom-table {
                            border-radius: 0.5rem !important;
                            overflow: hidden !important;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                            min-width: 800px !important; /* Ancho mínimo para scroll horizontal */
                        }
                        
                        .custom-table .p-datatable-tbody > tr > td {
                            border: 1px solid #e5e7eb !important;
                            padding: 0.5rem !important;
                            font-size: 0.875rem !important;
                        }
                        
                        /* Responsive body padding */
                        @media (min-width: 768px) {
                            .custom-table .p-datatable-tbody > tr > td {
                                padding: 0.75rem !important;
                                font-size: 1rem !important;
                            }
                        }
                        
                        .custom-table .p-datatable-tbody > tr.special-row {
                            background-color: #3b82f6 !important; /* bg-blue-500 - azul más fuerte */
                            color: white !important; /* Texto blanco para contraste */
                        }
                        .custom-table .p-datatable-tbody > tr.special-row > td {
                            border: none !important; /* Sin bordes para la fila especial */
                            border-top: 1px solid #3b82f6 !important; /* Solo borde superior del mismo color */
                            border-bottom: 1px solid #3b82f6 !important; /* Solo borde inferior del mismo color */
                        }
                        .custom-table .p-datatable-tbody > tr.special-row:hover {
                            background-color: #2563eb !important; /* bg-blue-600 - azul aún más fuerte en hover */
                        }
                        
                        /* Estilos específicos para móvil */
                        @media (max-width: 767px) {
                            .custom-table {
                                font-size: 0.75rem !important;
                            }
                            
                            .mobile-scroll-hint {
                                display: block !important;
                            }
                        }
                        
                        .mobile-scroll-hint {
                            display: none;
                            background-color: #f3f4f6;
                            padding: 0.5rem;
                            text-align: center;
                            font-size: 0.75rem;
                            color: #6b7280;
                            border-bottom: 1px solid #d1d5db;
                        }
                    `}
                </style>
                
                {/* Indicador de scroll para móvil */}
                <div className="mobile-scroll-hint">
                    <i className="pi pi-arrow-right mr-2"></i>
                    Desliza horizontalmente para ver más columnas
                </div>
                
                {/* Contenedor de tabla con scroll responsivo */}
                <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg">
                    <DataTable 
                        scrollable
                        scrollHeight="70vh"
                        rowClassName={getRowClassName}
                        value={tableDataExcelData}
                        tableStyle={{ minWidth: '100%', maxWidth: '100%' }}
                        className="custom-table"
                    >
                        {excelData.length > 0 &&
                            columnsToShow.map((col, index) => (
                                <Column 
                                    field={col} 
                                    header={formatColumnHeader(col)}
                                    key={`${col}-${index}`}
                                    body={columnContentShowBodyTemplate(col)}
                                />
                            ))
                        }
                        <Column 
                            header="Acciones"
                            body={columnContentValueAccsTemplate}
                            style={{ 
                                minWidth: '140px',
                                maxWidth: '180px',
                                textAlign: 'center'
                            }}
                        />
                    </DataTable>
                </div>

                {/* Botón inferior responsivo */}
                <div className="flex justify-end items-center mt-6 mb-6">
                    <div className="flex gap-3 pt-3">
                        <Button 
                            label="Registrar Alumno"
                            icon="pi pi-file"
                            onClick={() => navigate('/alumno/nuevo')}
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 px-4 py-2 text-sm md:text-base"
                        />
                    </div>
                </div>

            </div>

            {activeModal && (
                <StudentDetailsModal
                    visible={true}
                    onHide={() => setActiveModal(null)}
                    points={pointsExcelData}
                    dates={datesExcelData}
                    data={selectedData}
                    groupInfo={activeModal.groupInfo}
                    columnConfig={columnConfig}
                />
            )}

            {deleteModal && (
                <DeleteStudentModal
                    visible={deleteModal.visible}
                    onHide={() => setDeleteModal(null)}
                    studentId={deleteModal.studentId}
                    studentName={deleteModal.studentName}
                />
            )}
            
        </Menu>
    );
};
  
export default AlumnadoCatalogo;