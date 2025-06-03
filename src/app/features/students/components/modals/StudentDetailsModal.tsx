import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { ExcelData } from '../../../../common/hooks/useExcelData';

interface StudentDetailsModalProps {
    visible: boolean;
    onHide: () => void;
    data: ExcelData | null;
    variant: 'black' | 'green' | 'purple';
}

const variantHeaders = {
    black: 'Detalles (Negro)',
    green: 'Detalles (Verde)',
    purple: 'Detalles (Morado)'
};

const firstSectionFields = ['ID', 'NOMBRE', 'APELLIDO', 'CORREO.ELECTONICO '];
const thirdSectionFields = ['SUMA.PORCENTAJE.ACTIVIDADES', 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', 'PARTICIPACIÓN', 'TOTAL.ALCANZADO', 'CALIFICACION'];

const formatDateValue = (value: string | number | null | undefined) => {
    if (value && value !== 'Fecha') {
        try {
            // Excel cuenta desde 1 de enero de 1900, pero tiene un bug que considera 1900 como bisiesto
            const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
            const date = new Date(excelEpoch.getTime() + parseFloat((String(value) || '0') + '') * 24 * 60 * 60 * 1000);
            // Formato DD/MM/YYYY
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        } catch {
            return value;
        }
    }
    return value || '';
};

const StudentDetailsModal = ({ visible, onHide, dates, data, variant }: StudentDetailsModalProps) => {
    if (!data) return null;

    const renderSection = (fields: string[]) => (
        <div className="grid grid-cols-2 gap-4 mb-6">
            {fields.map(key => (
                <div key={key} className="col-span-1">
                    <div className="font-bold text-gray-700">{key}</div>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                        {typeof data[key] === 'number' 
                            ? new Intl.NumberFormat('es-MX', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(data[key])
                            : data[key]?.toString() || ''}
                    </div>
                </div>
            ))}
        </div>
    );

    const middleSectionData = Object.entries(data)
        .filter(([key]) => !firstSectionFields.includes(key) && 
                          !thirdSectionFields.includes(key) && 
                          key !== 'BUSQUEDA' &&
                          key !== 'ID2' &&
                          key !== 'Column 33')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const tableData = [
        { name: 'Fecha', ...dates },
        { name: 'Resultados', ...middleSectionData }
    ];

    return (
        <Dialog 
            header={variantHeaders[variant]}
            visible={visible} 
            onHide={onHide}
            style={{ width: '90vw', maxWidth: '1200px' }}
            modal
            className="p-fluid"
        >
            <div className="space-y-8">
                {/* Primera sección */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-4">Información General</h3>
                    {renderSection(firstSectionFields)}
                </div>

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
                                                  }).format(rowData[key])
                                                : rowData[key]?.toString() || ''}
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
