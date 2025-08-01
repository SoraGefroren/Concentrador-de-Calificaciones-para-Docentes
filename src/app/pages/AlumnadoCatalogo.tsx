import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import type { ExcelData } from '../common/hooks/useExcelData';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useState, useRef } from 'react';
import StudentDetailsModal from '../features/students/modals/StudentDetailsModal.tsx';
import StudentActionButtons from '../features/students/components/StudentActionButtons.tsx';

// Función para formatear los campos de las columnas
const formatFieldName = (fieldName: string): string => {
    return fieldName.replace(/[ÁÉÍÓÚÜáéíóúüÑñ]/g, '�');
}

const AlumnadoCatalogo = () => {
    const { excelData } = useExcelContext();
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const [selectedData, setSelectedData] = useState<ExcelData | null>(null);
    const [activeModal, setActiveModal] = useState<'black' | 'green' | 'purple' | null>(null);

    // Función para formatear los headers de las columnas
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

    // Lista de columnas que queremos mostrar
    const columnsToShow = [
        'ID',
        'NOMBRE',
        'APELLIDO',
        'CORREO.ELECTONICO ',
        'SUMA.PORCENTAJE.ACTIVIDADES',
        'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES',
        'PARTICIPACIÓN',
        'TOTAL.ALCANZADO',
        'CALIFICACION'
    ];

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

    const chooseBodyTemplate = (excelColumn: string) => {
        // Retornamos una función que recibe el rowData y rowIndex
        return (rowData: ExcelData, props: { rowIndex: number }) => {
            // Obtenemos el índice de la fila actual
            const { rowIndex } = props;
            // // Para la primera fila
            if (rowIndex === 0) {
                // Si el campo es un número, le damos formato
                return rowOneContentDateTemplate(rowData, { field: excelColumn, rowIndex });
            // Todas las demás filas
            } else {
                // Pintar columnas
                 if (['ID'].includes(excelColumn)) {
                    return columnContentValueIDTemplate(rowData, { field: excelColumn, rowIndex });
                } else if (['CORREO.ELECTONICO', 'CORREO.ELECTONICO ', '"CORREO.ELECTONICO "'].includes(excelColumn)) {
                    return columnContentValueMailTemplate(rowData, { field: excelColumn, rowIndex });
                } else if (['NOMBRE', 'APELLIDO'].includes(excelColumn)) {
                    return  <div className="w-full text-left font-semibold">
                                { rowData[excelColumn] || '' }
                            </div>;
                } else {
                    return  !['BUSQUEDA'].includes(excelColumn)
                                ?   <div className="w-full text-right">
                                        { 
                                            new Intl.NumberFormat('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }).format(
                                                parseFloat((rowData[excelColumn] || '0') + '')
                                            )
                                        }
                                    </div>
                                :   null;
                }
            }
        };
    };

    const rowOneContentDateTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        // Si el campo es una fecha, lo convertimos a formato DD/MM/YYYY
        if (rowData[props.field] && (rowData[props.field] !== 'Puntos')) {
            return  <div className="w-full text-right font-bold">
                        { rowData[props.field] || 0 }
                    </div>;
        } else {
            // Etiqueta de fecha vacía o no válida
            return  <div className="w-full text-right font-bold">
                        { rowData[props.field] || rowData[formatFieldName(props.field)] || '' }
                    </div>;
        }
    };
    
    const columnContentValueIDTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        return (
            <div className="w-full flex justify-center justify-end gap-2 text-right font-bold">
                <span
                    className="p-button-rounded p-2">
                    { rowData[props.field] || '0' }
                </span>
                <Button
                    icon="pi pi-file-edit"
                    iconPos="right"
                    className="p-button-rounded text-white bg-blue-500 hover:bg-blue-800 p-2"
                    style={{ fontWeight: 'bolder' }}
                    onClick={() => navigate(`/alumno/${rowData[props.field]}`)}
                    tooltip="Editar Alumno"
                />
                <Button 
                    icon="pi pi-eye"
                    className="p-button-rounded text-white bg-green-500 hover:bg-green-800 p-2"
                    style={{ fontWeight: 'bolder', color: 'lightgray' }}
                    onClick={() => navigate(`/alumno/${rowData[props.field]}`)}
                    tooltip="Ver Alumno"
                />
                <Button 
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-secondary"
                    style={{ backgroundColor: 'red', fontWeight: 'bolder', color: 'lightgray' }}
                    tooltip="Eliminar Alumno"
                />
            </div>
        );
    };
    
    const columnContentValueMailTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        if (rowData[props.field]) {
            const email = String(rowData[props.field]);
            return (
                <div className="p-inputgroup w-100" style={{ maxWidth: '280px' }}>
                    <Button
                        label={email}
                        className="p-button-text"
                        style={{ 
                            color: '#2563eb',
                            textDecoration: 'underline',
                            justifyContent: 'flex-start',
                            borderRadius: '6px 0 0 6px',
                            border: '1px solid #dee2e6',
                            borderRight: 'none',
                            backgroundColor: '#ffffff',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.875rem',
                            textAlign: 'left',
                            minWidth: '0',
                            flex: '1'
                        }}
                        onClick={() => window.open(`mailto:${email}`, '_blank')}
                        tooltip="Enviar correo electrónico"
                    />
                    <Button
                        icon="pi pi-copy"
                        className="p-button-outlined"
                        style={{
                            borderRadius: '0 6px 6px 0',
                            border: '1px solid #dee2e6',
                            backgroundColor: '#f8f9fa',
                            color: '#6c757d',
                            padding: '0.5rem',
                            minWidth: '2.5rem'
                        }}
                        onClick={() => copyToClipboard(email)}
                        tooltip="Copiar correo electrónico"
                    />
                </div>
            );
        } else {
            return null;
        }
    };
    
    const getRowClassName = (data: ExcelData) => {
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
    
    // Template para la columna de acciones
    const columnContentValueAccsTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        if (props.rowIndex === 0) return null;
        return (
            <StudentActionButtons
                rowData={rowData}
                onSelectData={(data, variant) => {
                    setSelectedData(data);
                    setActiveModal(variant);
                }}
            />
        );
    };
    
    return (
        <Menu
            navBarTitle="Catálogo de Alumnos">
            
            <Toast ref={toast} />

            <div className="py-4 mx-auto">
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Catálogo de Alumnos
                    </h2>
                    <div className="flex gap-3">
                        <Button 
                            label="Registrar Alumno"
                            icon="pi pi-file"
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
                        />
                    </div>
                </div>
                
                <div className="w-full overflow-x-auto">
                    <style>
                        {`
                            .custom-table .p-datatable-thead > tr > th {
                                background-color: #374151 !important; /* bg-gray-800 - mismo color que el menú */
                                color: white !important;
                                font-weight: 600 !important;
                                border: 1px solid #4b5563 !important;
                                padding: 0.75rem !important;
                                text-align: center !important;
                            }
                            .custom-table {
                                border-radius: 0.5rem !important;
                                overflow: hidden !important;
                                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                            }
                            .custom-table .p-datatable-tbody > tr > td {
                                border: 1px solid #e5e7eb !important;
                                padding: 0.75rem !important;
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
                        `}
                    </style>
                    <DataTable 
                        scrollable
                        rowClassName={getRowClassName}
                        value={[...excelData].slice(1, excelData.length)}
                        tableStyle={{ minWidth: '100%', maxWidth: '100%' }}
                        className="custom-table"
                    >
                        {excelData.length > 0 &&
                            columnsToShow.map((col, index) => (
                                <Column key={`${col}-${index}`}
                                        field={col} 
                                        header={formatColumnHeader(col)}
                                        body={chooseBodyTemplate(col)} />
                            ))
                        }
                        <Column 
                            header="Acciones"
                            body={columnContentValueAccsTemplate}
                            style={{ width: '10rem', textAlign: 'center' }}
                        />
                    </DataTable>
                </div>

                <div className="flex justify-end items-center mb-6">
                    <div className="flex gap-3 pt-3">
                        <Button 
                            label="Registrar Alumno"
                            icon="pi pi-file"
                            className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
                        />
                    </div>
                </div>

            </div>

            <StudentDetailsModal
                visible={activeModal === 'black'}
                onHide={() => setActiveModal(null)}
                dates={[...excelData].slice(0, 1)[0]}
                points={[...excelData].slice(1, 2)[0]}
                data={selectedData}
                variant="black"
            />

            <StudentDetailsModal
                visible={activeModal === 'green'}
                onHide={() => setActiveModal(null)}
                dates={[...excelData].slice(0, 1)[0]}
                points={[...excelData].slice(1, 2)[0]}
                data={selectedData}
                variant="green"
            />

            <StudentDetailsModal
                visible={activeModal === 'purple'}
                onHide={() => setActiveModal(null)}
                dates={[...excelData].slice(0, 1)[0]}
                points={[...excelData].slice(1, 2)[0]}
                data={selectedData}
                variant="purple"
            />
            
        </Menu>
    );
};
  
export default AlumnadoCatalogo;