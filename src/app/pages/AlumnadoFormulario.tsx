import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';

const AlumnadoFormulario = () => {
    const { excelData } = useExcelContext();
    debugger;
    return (
        <Menu>
            <h1>AlumnadoFormulario</h1>
        </Menu>
    );
};
  
export default AlumnadoFormulario;