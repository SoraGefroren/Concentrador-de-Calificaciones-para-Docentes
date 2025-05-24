import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';

const ResumenDeDatos = () => {
    const { excelData } = useExcelContext();
    return (
        <Menu>
            <h1>ResumenDeDatos</h1>
        </Menu>
    );
};
  
export default ResumenDeDatos;