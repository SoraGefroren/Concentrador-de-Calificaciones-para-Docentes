import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import type { ExcelData } from '../common/hooks/useExcelData';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useState } from 'react';
import StudentDetailsModal from '../features/students/components/modals/StudentDetailsModal';
import StudentActionButtons from '../features/students/components/modals/StudentActionButtons';

const AlumnadoCatalogo = () => {
    const { excelData } = useExcelContext();
    const navigate = useNavigate();
    const [selectedData, setSelectedData] = useState<ExcelData | null>(null);
    const [activeModal, setActiveModal] = useState<'black' | 'green' | 'purple' | null>(null);

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
                        { rowData[props.field] || '' }
                    </div>;
        }
    };
    
    const columnContentValueIDTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        return (
            <div className="w-full text-right font-bold">                <Button
                    label={String(rowData[props.field] || '0')}
                    icon="pi pi-file-edit"
                    iconPos="right"
                    className="p-button-rounded"
                    style={{ fontWeight: 'bolder' }}
                    onClick={() => navigate(`/alumnado/formulario/${rowData[props.field]}`)}
                    tooltip="Editar Alumno"
                />
            </div>
        );
    };

    const columnContentValueMailTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        if (rowData[props.field]) {
            return  <div>
                        <a href={`mailto:${rowData[props.field]}`}
                            className="text-blue-600 underline hover:text-blue-800 transition-colors duration-200">
                            { rowData[props.field] }
                        </a>
                    </div>;
        } else {
            return null;
        }
    };

    const getRowClassName = (data: ExcelData) => {
        // Obtenemos el índice de la fila actual
        const rowIndex = excelData.indexOf(data);
        if (rowIndex === 0) return 'bg-blue-100 font-bold'; // Primera fila
        if (rowIndex === 1) return 'bg-blue-100 font-semibold'; // Segunda fila
        // Resto de las filas
        return '';
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
        <Menu>
            <div className="mb-2">
                <h3>Datos del archivo Excel</h3>
            </div>
            <div className="w-full overflow-x-auto">
                <DataTable scrollable
                           rowClassName={getRowClassName}
                           value={[...excelData].slice(1, excelData.length)}
                           tableStyle={{ minWidth: '100%', maxWidth: '100%' }}>
                    {excelData.length > 0 &&
                        columnsToShow.map((col, index) => (
                            <Column key={index}
                                    field={col} 
                                    header={col}
                                    body={chooseBodyTemplate(col)} />
                        ))
                    }
                    <Column 
                        header="ACCIONES"
                        body={columnContentValueAccsTemplate}
                        style={{ width: '12rem', textAlign: 'center' }}
                    />
                </DataTable>
            </div>

            <StudentDetailsModal
                visible={activeModal === 'black'}
                onHide={() => setActiveModal(null)}
                dates={[...excelData].slice(0, 1)[0]}
                data={selectedData}
                variant="black"
            />

            <StudentDetailsModal
                visible={activeModal === 'green'}
                onHide={() => setActiveModal(null)}
                dates={[...excelData].slice(0, 1)[0]}
                data={selectedData}
                variant="green"
            />

            <StudentDetailsModal
                visible={activeModal === 'purple'}
                onHide={() => setActiveModal(null)}
                dates={[...excelData].slice(0, 1)[0]}
                data={selectedData}
                variant="purple"
            />
        </Menu>
    );
};
  
export default AlumnadoCatalogo;