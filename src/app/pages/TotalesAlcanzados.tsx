import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';

const TotalesAlcanzados = () => {
    const { excelData } = useExcelContext();
    return (
        <Menu>
            <h1>TotalesAlcanzados</h1>
        </Menu>
    );
};
  
export default TotalesAlcanzados;