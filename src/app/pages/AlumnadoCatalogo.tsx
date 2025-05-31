import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import type { ExcelData } from '../common/hooks/useExcelData';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const AlumnadoCatalogo = () => {
    const { excelData } = useExcelContext();

    const chooseBodyTemplate = (excelColumn: string) => {
        // Retornamos una función que recibe el rowData y rowIndex
        return (rowData: ExcelData, props: { rowIndex: number }) => {
            // Obtenemos el índice de la fila actual
            const { rowIndex } = props;
            // Para la primera fila
            if (rowIndex === 0) {
                // Si el campo es una fecha, lo convertimos a formato DD/MM/YYYY
                return rowZeroContentDateTemplate(rowData, { field: excelColumn, rowIndex });
            // Para la segunda fila
            } else if (rowIndex === 1) {
                // Si el campo es un número, le damos formato
                return rowOneContentDateTemplate(rowData, { field: excelColumn, rowIndex });
            // Todas las demás filas
            } else {
                 if (['ID', 'ID2'].includes(excelColumn)) {
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
        return  <div className="w-full text-right font-bold">
                    { rowData[props.field] || 0 }
                </div>;
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
    
    return (
        <Menu>
            <div className="mb-2">
                <h3>Datos del archivo Excel</h3>
            </div>
            <div className="w-full overflow-x-auto">
                <DataTable value={excelData}
                           scrollable rowClassName={getRowClassName}
                           tableStyle={{ minWidth: '100%', maxWidth: '100%' }}>
                    {excelData.length > 0 &&
                        Object.keys(excelData[2])
                            .filter(key => key !== "BUSQUEDA")
                            .map((col, index) => (
                                <Column key={index}
                                        field={col} header={col}
                                        body={chooseBodyTemplate(col)} />
                            ))
                    }
                </DataTable>
            </div>
        </Menu>
    );
};
  
export default AlumnadoCatalogo;