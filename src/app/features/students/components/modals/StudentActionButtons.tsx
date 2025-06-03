import { Button } from 'primereact/button';
import type { ExcelData } from '../../../../common/hooks/useExcelData';

interface StudentActionButtonsProps {
    rowData: ExcelData;
    onSelectData: (data: ExcelData, variant: 'black' | 'green' | 'purple') => void;
}

const StudentActionButtons = ({ rowData, onSelectData }: StudentActionButtonsProps) => {
    return (
        <div className="w-full flex justify-center gap-2">
            <Button 
                icon="pi pi-graduation-cap"
                className="p-button-rounded p-button-secondary"
                style={{ backgroundColor: 'black', fontWeight: 'bolder', color: 'lightgray' }}
                onClick={() => onSelectData(rowData, 'black')}
                tooltip="Ver detalles - Negro"
            />
            <Button 
                icon="pi pi-graduation-cap"
                className="p-button-rounded p-button-secondary"
                style={{ backgroundColor: 'green', fontWeight: 'bolder', color: 'lightgray' }}
                onClick={() => onSelectData(rowData, 'green')}
                tooltip="Ver detalles - Verde"
            />
            <Button 
                icon="pi pi-graduation-cap"
                className="p-button-rounded p-button-secondary"
                style={{ backgroundColor: 'purple', fontWeight: 'bolder', color: 'lightgray' }}
                onClick={() => onSelectData(rowData, 'purple')}
                tooltip="Ver detalles - Morado"
            />
        </div>
    );
};

export default StudentActionButtons;
