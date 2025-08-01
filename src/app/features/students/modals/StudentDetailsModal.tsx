import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { ExcelData } from '../../../common/hooks/useExcelData';
import { useExcelContext } from '../../../common/contexts/ExcelContext';

interface StudentDetailsModalProps {
    visible: boolean;
    onHide: () => void;
    dates?: ExcelData;
    data: ExcelData | null;
    variant: 'black' | 'green' | 'purple';
}

const firstSectionFields = ['ID', 'NOMBRE', 'APELLIDO', 'CORREO.ELECTONICO '];
const thirdSectionFields = ['SUMA.PORCENTAJE.ACTIVIDADES', 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', 'PARTICIPACIÓN', 'TOTAL.ALCANZADO', 'CALIFICACION'];

// Función para formatear los campos de las columnas
const formatFieldName = (fieldName: string): string => {
    return fieldName.replace(/[ÁÉÍÓÚÜáéíóúüÑñ]/g, '�');
}

// Función para formatear los headers de las columnas (igual que en AlumnadoCatalogo)
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

const formatDateValue = (value: string | number | null | undefined): string => {
    // Si el valor es nulo, undefined o una cadena vacía, se retorna una cadena vacía
    if (!value || value === 'Fecha') return '';
    // Tratar como número o string que representa un número
    try {
        // Si es un número o un string que representa un número, se asume formato Excel
        if (!isNaN(Number(value))) {
            const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
            const date = new Date(excelEpoch.getTime() + Number(value) * 24 * 60 * 60 * 1000);
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        }
        // Si es un string que parece una fecha como '27-Aug-21'
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
            return `${String(parsedDate.getDate()).padStart(2, '0')}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`;
        }
        // Si no se puede parsear, se devuelve tal cual
        return String(value);
    } catch {
        return String(value);
    }
};

const StudentDetailsModal = ({ visible, onHide, dates, points, data, variant }: StudentDetailsModalProps) => {
    const { columnConfig } = useExcelContext();
    
    if (!data)
        // Usar configuración dinámica en lugar de valores estáticos
        return null;
    
    const variantHeaders = {
        black: {
            title: 'Detalles (Negro)',
            numColumns: columnConfig.black.numColumns,
            rangeColumns: columnConfig.black.rangeColumns,
            color: columnConfig.black.color
        },
        green: {
            title: 'Detalles (Verde)',
            numColumns: columnConfig.green.numColumns,
            rangeColumns: columnConfig.green.rangeColumns,
            color: columnConfig.green.color
        },
        purple: {
            title: 'Detalles (Morado)',
            numColumns: columnConfig.purple.numColumns,
            rangeColumns: columnConfig.purple.rangeColumns,
            color: columnConfig.purple.color
        },
    };

    const renderSection = (fields: string[]) => (
        <div className="grid grid-cols-2 gap-4 mb-6">
            {fields.map(key => (
                <div key={key} className="col-span-1">
                    <div className="font-bold text-gray-700">
                        {formatColumnHeader(key)}
                        {points && (points[key] || points[formatFieldName(key)]) ? ` / ${(points[key] || points[formatFieldName(key)])}` : ''}
                    </div>
                    <div className="mt-1 p-2">
                        {typeof (data[key] || data[formatFieldName(key)] || '') === 'number' 
                            ? new Intl.NumberFormat('es-MX', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(data[key] || data[formatFieldName(key)] || 0)
                            : (data[key] || data[formatFieldName(key)] || '')?.toString() ?? ''}
                    </div>
                </div>
            ))}
        </div>
    );

    // Calcular el rango de columnas según el variant
    const getColumnRange = (variant: 'black' | 'green' | 'purple') => {
        const blackColumns = variantHeaders.black.numColumns;
        const greenColumns = variantHeaders.green.numColumns;
        
        switch (variant) {
            case 'black':
                return { start: 0, end: blackColumns - 1 };
            case 'green':
                return { start: blackColumns, end: blackColumns + greenColumns - 1 };
            case 'purple':
                return { 
                    start: blackColumns + greenColumns, 
                    end: blackColumns + greenColumns + variantHeaders.purple.numColumns - 1 
                };
            default:
                return { start: 0, end: 0 };
        }
    };

    const columnRange = getColumnRange(variant);

    // Filtrar todas las columnas excluyendo las de las secciones primera y tercera
    const allMiddleColumns = Object.entries(data)
        .filter(([key]) => !firstSectionFields.includes(key) && 
                          !thirdSectionFields.includes(key) && 
                          key !== 'BUSQUEDA' &&
                          key !== 'ID2' &&
                          key !== 'Column 33');

    // Filtrar las columnas según el rango del variant
    const middleSectionData = allMiddleColumns
        .slice(columnRange.start, columnRange.end + 1)
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const tableData = [
        { name: 'Fecha', ...dates },
        { name: 'Puntos', ...points },
        { name: 'Resultados', ...middleSectionData }
    ];

    // Obtener el color de fondo según la variante
    const getHeaderColor = () => {
        switch (variant) {
            case 'black':
                return '#374151';
            case 'green':
                return '#059669';
            case 'purple':
                return '#7c3aed';
            default:
                return '#374151';
        }
    };

    const headerColor = getHeaderColor();

    return (
        <>
            <style>
                {`
                    .p-datatable-sm .p-datatable-thead > tr > th {
                        background-color: #374151 !important; /* bg-gray-800 - mismo color que el menú */
                        color: white !important;
                        font-weight: 600 !important;
                        border: 1px solid #4b5563 !important;
                        padding: 0.75rem !important;
                        text-align: center !important;
                    }
                    .custom-dialog-header-${variant} .p-dialog-header {
                        background-color: ${headerColor} !important;
                        color: white !important;
                        border-radius: 6px 6px 0 0 !important;
                    }
                    .custom-dialog-header-${variant} .p-dialog-header .p-dialog-title {
                        color: white !important;
                        font-weight: bold !important;
                    }
                    .custom-dialog-header-${variant} .p-dialog-header .p-dialog-header-icons button {
                        color: white !important;
                        background-color: transparent !important;
                        border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    }
                    .custom-dialog-header-${variant} .p-dialog-header .p-dialog-header-icons button:hover {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        border-color: rgba(255, 255, 255, 0.5) !important;
                    }
                `}
            </style>
            <Dialog 
                header={
                    data['ID'] + ' - ' +
                    variantHeaders[variant].title +
                    (data['NOMBRE']? ` ${data['NOMBRE']}` : '') +
                    (data['APELLIDO']? ` ${data['APELLIDO']}` : '')
                }
                visible={visible} 
                onHide={onHide}
                style={{ width: '90vw', maxWidth: '1200px' }}
                modal
                className={`p-fluid custom-dialog-header-${variant}`}
            >
                <div className="space-y-8">
                    {/* Segunda sección - Tabla con fechas */}
                    <div className="border-b pt-4">
                        <DataTable value={tableData} className="p-datatable-sm">
                            <Column 
                                field="name" 
                                header=""
                                className="font-bold"
                            />
                            {Object.keys(middleSectionData).map(key => (
                                <Column
                                    key={key}
                                    field={key}
                                    header={formatColumnHeader(key)}
                                    body={(rowData) => (
                                        <div className="text-right font-bold">
                                            {rowData.name === 'Fecha' 
                                                ? formatDateValue(rowData[key])
                                                : typeof rowData[key] === 'number'
                                                    ? new Intl.NumberFormat('es-MX', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    }).format(rowData[key])
                                                    : rowData[key]?.toString() ?? ''
                                            }
                                        </div>
                                    )}
                                    style={{ textAlign: 'center' }}
                                />
                            ))}
                        </DataTable>
                    </div>
                    {/* Tercera sección */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Resultados</h3>
                        {renderSection(thirdSectionFields)}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default StudentDetailsModal;
