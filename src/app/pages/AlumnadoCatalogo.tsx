import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const AlumnadoCatalogo = () => {
    const { excelData } = useExcelContext();
    
    const chooseBodyTemplate = (excelColumn) => {
        if (excelColumn == 'NOMBRE') {
            return statusBodyTemplate;
        } else {
            return null;
        }
    };

    const statusBodyTemplate = (excelCell, columnCell) => {
        return  <div>
                    { JSON.stringify(excelCell[columnCell.field]) }
                </div>;
    };
    
    return (
        <Menu>
            <div className="mb-2">
                <h3>Datos del archivo Excel</h3>
            </div>
            <div className="w-full overflow-x-auto">
                <DataTable value={excelData} scrollable
                           tableStyle={{ minWidth: '100%', maxWidth: '100%' }}>
                    {excelData.length > 0 &&
                        Object.keys(excelData[3]).map((col, index) => (
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