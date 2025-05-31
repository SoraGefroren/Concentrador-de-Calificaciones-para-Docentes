import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import type { ExcelData } from '../common/hooks/useExcelData';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';

const AlumnadoCatalogo = () => {
    const { excelData } = useExcelContext();
    const navigate = useNavigate();
    const [selectedData, setSelectedData] = useState<ExcelData | null>(null);
    const [showModalBlack, setShowModalBlack] = useState(false);
    const [showModalGreen, setShowModalGreen] = useState(false);
    const [showModalPurple, setShowModalPurple] = useState(false);

    // Lista de columnas que queremos mostrar
    const columnsToShow = [
        'ID',
        'NOMBRE',
        'APELLIDO',
        'CORREO.ELECTONICO',
        'CORREO.ELECTONICO ',
        // 'ID2',
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
            // if (rowIndex === 0) {
            //     // Si el campo es una fecha, lo convertimos a formato DD/MM/YYYY
            //     return rowZeroContentDateTemplate(rowData, { field: excelColumn, rowIndex });
            // // Para la segunda fila
            // } else
            if (rowIndex === 0) {
                // Si el campo es un número, le damos formato
                return rowOneContentDateTemplate(rowData, { field: excelColumn, rowIndex });
            // Todas las demás filas
            } else {
                 if (['ID'].includes(excelColumn)) {
                    return columnContentValueIDTemplate(rowData, { field: excelColumn, rowIndex });
                 } else if (['ID2'].includes(excelColumn)) {
                    return  <div className="w-full text-right">
                                { rowData[excelColumn] || '' }
                            </div>;
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
    
    const rowZeroContentDateTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        // Si el campo es una fecha, lo convertimos a formato DD/MM/YYYY
        if (rowData[props.field] && (rowData[props.field] !== 'Fecha')) {
            // Excel cuenta desde 1 de enero de 1900, pero tiene un bug que considera 1900 como bisiesto
            const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
            const date = new Date(excelEpoch.getTime() + (parseFloat((rowData[props.field] || '0') + '')) * 24 * 60 * 60 * 1000);
            // Formato DD/MM/YYYY
            return  <div className="w-full text-right font-bold">
                        { `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`}
                    </div>;
        } else {
            // Etiqueta de fecha vacía o no válida
            return  <div className="w-full text-right font-bold">
                        { rowData[props.field] || '' }
                    </div>;
        }
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
            <div className="w-full text-right font-bold">
                <button 
                    onClick={() => navigate(`/alumnado/formulario/${rowData[props.field]}`)}
                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                    {rowData[props.field] || 0}
                </button>
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
    
    const renderModalContent = () => {
        if (!selectedData) return null;
        return (
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedData)
                    .filter(([key]) => key !== 'BUSQUEDA')
                    .map(([key, value]) => (
                        <div key={key} className="mb-4">
                            <div className="font-bold text-gray-700">{key}</div>
                            <div className="mt-1 p-2 bg-gray-50 rounded">
                                {typeof value === 'number' 
                                    ? new Intl.NumberFormat('es-MX', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      }).format(value)
                                    : value?.toString() || ''}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    // Template para la columna de acciones
    const columnContentValueAccsTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }) => {
        if (props.rowIndex === 0 || props.rowIndex === 1) {
            // No mostramos botones de acción para la primera y segunda fila
            return null;
        } else {
            return (
                <div className="w-full flex justify-center gap-2">
                    <Button 
                        icon="pi pi-circle-fill"
                        className="p-button-rounded p-button-secondary"
                        style={{ backgroundColor: 'black' }}
                        onClick={() => {
                            setSelectedData(rowData);
                            setShowModalBlack(true);
                        }}
                        tooltip="Ver detalles - Negro"
                    />
                    <Button 
                        icon="pi pi-circle-fill"
                        className="p-button-rounded p-button-success"
                        onClick={() => {
                            setSelectedData(rowData);
                            setShowModalGreen(true);
                        }}
                        tooltip="Ver detalles - Verde"
                    />
                    <Button 
                        icon="pi pi-circle-fill"
                        className="p-button-rounded"
                        style={{ backgroundColor: 'purple' }}
                        onClick={() => {
                            setSelectedData(rowData);
                            setShowModalPurple(true);
                        }}
                        tooltip="Ver detalles - Morado"
                    />
                </div>
            );
        }
    };

    return (
        <Menu>
            <div className="mb-2">
                <h3>Datos del archivo Excel</h3>
            </div>
            <div className="w-full overflow-x-auto">
                <DataTable value={[...excelData].slice(1, excelData.length)}
                           scrollable rowClassName={getRowClassName}
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

            <Dialog 
                header="Detalles (Negro)" 
                visible={showModalBlack} 
                onHide={() => setShowModalBlack(false)}
                style={{ width: '90vw', maxWidth: '800px' }}
                modal
                className="p-fluid"
            >
                {renderModalContent()}
            </Dialog>

            <Dialog 
                header="Detalles (Verde)" 
                visible={showModalGreen} 
                onHide={() => setShowModalGreen(false)}
                style={{ width: '90vw', maxWidth: '800px' }}
                modal
                className="p-fluid"
            >
                {renderModalContent()}
            </Dialog>

            <Dialog 
                header="Detalles (Morado)" 
                visible={showModalPurple} 
                onHide={() => setShowModalPurple(false)}
                style={{ width: '90vw', maxWidth: '800px' }}
                modal
                className="p-fluid"
            >
                {renderModalContent()}
            </Dialog>
        </Menu>
    );
};
  
export default AlumnadoCatalogo;