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
                if (excelColumn !== 'NOMBRE') {
                    return rowZeroContentDateTemplate(rowData, { field: excelColumn, rowIndex });
                } else {
                    return null;
                }
            // Para la segunda fila
            } else if (rowIndex === 1) {
                if (excelColumn !== 'NOMBRE') {
                    return rowOneContentDateTemplate(rowData, { field: excelColumn, rowIndex });
                } else {
                    return null;
                }
            // Todas las demás filas
            } else {
                switch (excelColumn) {
                    case '1ER.PARCIAL-30-SEP-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case '2DO.PARCIAL-19-NOV-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'APELLIDO':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'BUSQUEDA':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'CALIFICACION':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'CLASIFICACION.METODOS.ECUACIONES-CUADRATICAS-14-ENE-22':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'CONCEPTOS.BASICOS.PROBABILIDAD-05-NOV-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'CONTEXTO ALGEBRAICO-12-NOV-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'CORREO.ELECTONICO':
                    case 'CORREO.ELECTONICO ':
                    case '"CORREO.ELECTONICO "':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'DIVISION.POLINOMIOS-03-DIC-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'ECUACION.LINEAL.DOS-VARIABLES-17-DIC-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'ECUACION.LINEAL.TRES-VARIABLES-07-ENE-22':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'ECUACION.LINEAL.UNA-VARIABLE-10-DIC-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'EXAMEN.FINAL-19-ENE-22':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'ID':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'ID2':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'JERARQUIA-OPERACIONES-MCM-MCD-10-SEP-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'MEDIDAS.DISPERSION-29-OCT-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'MEDIDAS.TENDENCIA.CENTRAL-22-OCT-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'MULTIPLICACION.POLINOMIOA-26-NOV-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'NOMBRE':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'PARTICIPACIÓN':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'PRESEN-ENCUADRE-27-AGO-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'PROPIEDADES-NUMEROS-REALES-03-SEP-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'PROPORCIONALIDAD-17-SEP-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'SUCESION-SERIES-01-OCT-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'SUCESIONES-SERIES-ARITMETICAS-08-OCT-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'SUCESIONES-SERIES-GEOMETRICAS-15-OCT-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'SUMA-RESTA-POLINOMIOS-19-NOV-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'SUMA.PORCENTAJE.ACTIVIDADES':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'TOTAL.ALCANZADO':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    case 'VARIACION.DIRECTA-INVERSA-24-SEP-21':
                        return statusBodyTemplate(rowData, { field: excelColumn, rowIndex });
                        break;
                    default:
                        return null;
                        break;
                }
            }
        };
    };
    
    const rowZeroContentDateTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }, xx) => {
        if (rowData[props.field] && (rowData[props.field] !== 'Fecha')) {
            // Excel cuenta desde 1 de enero de 1900, pero tiene un bug que considera 1900 como bisiesto
            const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
            const date = new Date(excelEpoch.getTime() + (parseFloat((rowData[props.field] || '0') + '')) * 24 * 60 * 60 * 1000);
            // Formato DD/MM/YYYY
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return  <div>
                        { `${day}/${month}/${year}`}
                    </div>;
        } else {
            return  <div>
                    </div>;
        }
    };
    const rowOneContentDateTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }, xx) => {
        return  <div>
                    { JSON.stringify(rowData[props.field]) }
                </div>;
    };
    const statusBodyTemplate = (rowData: ExcelData, props: { field: string, rowIndex: number }, xx) => {
        return  <div>
                    { JSON.stringify(rowData[props.field]) }
                </div>;
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