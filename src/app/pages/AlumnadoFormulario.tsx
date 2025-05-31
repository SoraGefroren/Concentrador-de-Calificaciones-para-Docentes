import Menu from '../common/Menu.tsx';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';

const AlumnadoFormulario = () => {
    const { excelData } = useExcelContext();
    const { id } = useParams();
    const navigate = useNavigate();

    // Encontrar los datos del alumno seleccionado
    const alumnoData = excelData.find((row) => 
        // || row['ID2']?.toString() === id
        row['ID']?.toString() === id
    );

    if (!alumnoData) {
        return (
            <Menu>
                <div className="p-4">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Alumno no encontrado</h2>
                    <Button 
                        label="Volver al catálogo" 
                        onClick={() => navigate('/alumnado/catalogo')}
                        className="p-button-primary" />
                </div>
            </Menu>
        );
    }

    return (
        <Menu>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Detalles del Alumno</h2>
                    <Button 
                        label="Volver al catálogo" 
                        onClick={() => navigate('/alumnado/catalogo')}
                        className="p-button-secondary" />
                </div>
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(alumnoData)
                            .filter(([key]) => key !== 'BUSQUEDA')
                            .map(([key, value]) => (
                                <div key={key} className="p-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {key}
                                    </label>
                                    <div className="p-2 bg-gray-50 rounded">
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
                </Card>
            </div>
        </Menu>
    );
};
  
export default AlumnadoFormulario;