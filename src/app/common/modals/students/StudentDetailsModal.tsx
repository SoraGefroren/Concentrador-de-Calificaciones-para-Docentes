import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { ColumnExcelData, ColumnGroupConfig } from '../../../common/hooks/useExcelData';
import { formatColumnHeader, formatDateValue, formatFieldName, getSectionsColumnsConfig } from '../../utils/clusterOfMethods';
import { calculateSingleColumnFormula } from '../../utils/formulaEvaluator';

interface StudentDetailsModalProps {
    visible: boolean;
    onHide: () => void;
    dates?: ColumnExcelData;
    points?: ColumnExcelData;
    data: ColumnExcelData | null;
    groupInfo: ColumnGroupConfig;
    columnConfig: ColumnGroupConfig[]; // Agregamos la configuración completa
}

const StudentDetailsModal = ({ visible, onHide, dates, points, data, groupInfo, columnConfig }: StudentDetailsModalProps) => {
    if (!data || !groupInfo) return null;

    // Usar configuración dinámica del grupo seleccionado
    const modalTitle = groupInfo.label || 'Detalles';
    const modalColor = groupInfo.color || '#374151';
    
    // Obtener las columnas específicas del grupo
    const groupColumns = groupInfo.columns.map(col => col.label);

    // Obtener las columnas de la sección izquierda y derecha
    const groupSectionConfig = getSectionsColumnsConfig(columnConfig);

    // Obtener las columnas de la sección izquierda (apuntando al id estudiante)
    const leftSectionFields = groupSectionConfig.left.flatMap(group =>
        group.columns.map(col => col.label)
    );

    // La primera columna es siempre el ID (primera columna de la sección izquierda)
    const idColumnName = leftSectionFields.length > 0 ? leftSectionFields.shift() : '';
    
    // Obtener las columnas de la sección derecha (totales y calificaciones) dinámicamente
    const rightSectionFields = groupSectionConfig.right.flatMap(group => 
        group.columns.map(col => col.label)
    );

    // Generar subtítulo dinámico basado en los campos restantes de la sección izquierda
    const generateSubtitle = () => {
        if (leftSectionFields.length === 0) return '';
        
        const subtitleParts = leftSectionFields
            .map(fieldName => {
                const value = data[fieldName] || data[formatFieldName(fieldName)];
                return value ? String(value).trim() : null;
            })
            .filter(Boolean); // Eliminar valores vacíos o null
        
        return subtitleParts.length > 0 ? `${subtitleParts.join(' ')} / ` : '';
    };

    // Filtrar las columnas específicas del grupo seleccionado
    const groupSectionData = groupColumns.reduce((acc, columnLabel) => {
        const value = data[columnLabel] || data[formatFieldName(columnLabel)];
        if (value !== undefined) {
            acc[columnLabel] = value;
        }
        return acc;
    }, {} as ColumnExcelData);

    const renderSection = (fields: string[]) => (
        <div className="grid grid-cols-2 gap-4 mb-6">
            {fields.map(key => {
                // CALCULAR VALOR EN TIEMPO REAL SI LA COLUMNA TIENE FÓRMULA
                let displayValue = data[key] || data[formatFieldName(key)] || '';
                
                // Intentar calcular si la columna tiene fórmula definida
                const calculatedValue = calculateSingleColumnFormula(data, key, columnConfig);
                if (calculatedValue !== null) {
                    displayValue = calculatedValue;
                }
                
                return (
                    <div key={key} className="col-span-1">
                        <div className="font-bold text-gray-700">
                            {formatColumnHeader(key)}
                            {points && (points[key] || points[formatFieldName(key)]) ? ` / ${(points[key] || points[formatFieldName(key)])}` : ''}
                        </div>
                        <div className="mt-1 p-2">
                            {typeof displayValue === 'number' 
                                ? new Intl.NumberFormat('es-MX', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(Number(displayValue))
                                : displayValue?.toString() ?? ''}
                        </div>
                    </div>
                );
            })}
        </div>
    );
    
    const tableData = [
        { name: 'Fecha', ...dates },
        { name: 'Puntos', ...points },
        { name: 'Resultados', ...groupSectionData }
    ];

    return (
        <>
            <style>
                {`
                    .p-datatable-sm .p-datatable-thead > tr > th {
                        background-color: #374151 !important;
                        color: white !important;
                        font-weight: 600 !important;
                        border: 1px solid #4b5563 !important;
                        padding: 0.75rem !important;
                        text-align: center !important;
                    }
                    .custom-dialog-header .p-dialog-header {
                        background-color: ${modalColor} !important;
                        color: white !important;
                        border-radius: 6px 6px 0 0 !important;
                    }
                    .custom-dialog-header .p-dialog-header .p-dialog-title {
                        color: white !important;
                        font-weight: bold !important;
                    }
                    .custom-dialog-header .p-dialog-header .p-dialog-header-icons button {
                        color: white !important;
                        background-color: transparent !important;
                        border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    }
                    .custom-dialog-header .p-dialog-header .p-dialog-header-icons button:hover {
                        background-color: rgba(255, 255, 255, 0.1) !important;
                        border-color: rgba(255, 255, 255, 0.5) !important;
                    }
                `}
            </style>
            <Dialog 
                header={
                    (idColumnName ? (data[idColumnName] + ' / ') : '') +
                    generateSubtitle() +
                    modalTitle
                }
                visible={visible} 
                onHide={onHide}
                style={{ width: '90vw', maxWidth: '1200px' }}
                modal
                className="p-fluid custom-dialog-header"
            >
                <div className="space-y-8">
                    {/* Sección del grupo - Tabla con fechas, puntos y resultados */}
                    <div className="border-b pt-4">
                        <DataTable value={tableData} className="p-datatable-sm">
                            <Column 
                                field="name" 
                                header=""
                                className="font-bold"
                            />
                            {Object.keys(groupSectionData).map(key => (
                                <Column
                                    key={key}
                                    field={key}
                                    header={formatColumnHeader(key)}
                                    body={(rowData) => {
                                        // CALCULAR VALOR EN TIEMPO REAL SI LA COLUMNA TIENE FÓRMULA Y ES LA FILA DE RESULTADOS
                                        let displayValue = rowData[key];
                                        
                                        if (rowData.name === 'Resultados') {
                                            const calculatedValue = calculateSingleColumnFormula(data, key, columnConfig);
                                            if (calculatedValue !== null) {
                                                displayValue = calculatedValue;
                                            }
                                        }
                                        
                                        return (
                                            <div className="text-right font-bold">
                                                {rowData.name === 'Fecha' 
                                                    ? formatDateValue(displayValue)
                                                    : typeof displayValue === 'number'
                                                        ? new Intl.NumberFormat('es-MX', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        }).format(displayValue)
                                                        : displayValue?.toString() ?? ''
                                                }
                                            </div>
                                        );
                                    }}
                                    style={{ textAlign: 'center' }}
                                />
                            ))}
                        </DataTable>
                    </div>
                    {/* Sección de totales */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Totales y Calificaciones</h3>
                        {renderSection(rightSectionFields)}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default StudentDetailsModal;
