import { Button } from 'primereact/button';
import type { ColumnExcelData, ColumnGroupConfig } from '../../hooks/useExcelData';

interface StudentActionButtonsProps {
    rowData: ColumnExcelData;
    centerGroups: ColumnGroupConfig[];
    onSelectData: (data: ColumnExcelData, groupId: string, groupInfo: ColumnGroupConfig) => void;
}

const StudentActionButtons = ({ rowData, centerGroups, onSelectData }: StudentActionButtonsProps) => {
    return (
        <div className="w-full flex justify-center gap-2">
            {centerGroups.map((group) => (
                <Button 
                    key={group.id}
                    icon="pi pi-graduation-cap"
                    className="p-button-rounded p-button-secondary"
                    style={{ 
                        backgroundColor: group.color || '#6b7280', 
                        fontWeight: 'bolder', 
                        color: 'lightgray' 
                    }}
                    onClick={() => onSelectData(rowData, group.id, group)}
                    tooltip={`Ver detalles - ${group.label}`}
                />
            ))}
        </div>
    );
};

export default StudentActionButtons;
