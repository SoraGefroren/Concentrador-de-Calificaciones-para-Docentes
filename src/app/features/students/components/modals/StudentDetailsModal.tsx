import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { ExcelData } from '../../../../common/hooks/useExcelData';
import { useExcelContext } from '../../../../common/contexts/ExcelContext';

interface StudentDetailsModalProps {
    visible: boolean;
    onHide: () => void;
    dates?: ExcelData;
    data: ExcelData | null;
    variant: 'black' | 'green' | 'purple';
}

const firstSectionFields = ['ID', 'NOMBRE', 'APELLIDO', 'CORREO.ELECTONICO '];
const thirdSectionFields = ['SUMA.PORCENTAJE.ACTIVIDADES', 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', 'PARTICIPACIÓN', 'TOTAL.ALCANZADO', 'CALIFICACION'];

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

const StudentDetailsModal = ({ visible, onHide, dates, data, variant }: StudentDetailsModalProps) => {
    const { columnConfig } = useExcelContext();
    
    if (!data) return null;    // Usar configuración dinámica en lugar de valores estáticos
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
                    <div className="font-bold text-gray-700">{key}</div>
                    <div className="mt-1 p-2 bg-gray-50 rounded">                        {typeof data[key] === 'number' 
                            ? new Intl.NumberFormat('es-MX', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(data[key])
                            : data[key]?.toString() ?? ''}
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
        { name: 'Resultados', ...middleSectionData }
    ];

    return (
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
            className="p-fluid"
        >
            <div className="space-y-8">
                {/* Segunda sección - Tabla con fechas */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-4">Detalle de Actividades</h3>
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
                                header={key}
                                body={(rowData) => (
                                    <div className="text-right font-bold">
                                        {rowData.name === 'Fecha' 
                                            ? formatDateValue(rowData[key])
                                            : typeof rowData[key] === 'number'
                                                ? new Intl.NumberFormat('es-MX', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                  }).format(rowData[key])                                                : rowData[key]?.toString() ?? ''}
                                    </div>
                                )}
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
    );
};

export default StudentDetailsModal;
