import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { FileUpload } from 'primereact/fileupload';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import FileUploadEvent from '../features/adds/FileUploadEvent';

const CargarHojaDeDatos = () => {
    // Variables de estado
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const context = useExcelContext();
    const loadExcelFromFile = context?.loadExcelFromFile;

    const handleCreateNew = () => {
        // Limpiar cualquier configuración previa
        localStorage.removeItem('excelData');
        localStorage.removeItem('fileRoute');
        localStorage.removeItem('columnConfig');
        localStorage.removeItem('extendedColumnConfig');
        
        // Navegar a la página de crear hoja
        navigate('/crear-hoja');
    }

    const onUpload = async (event: FileUploadEvent) => {
        if (!loadExcelFromFile) {
            console.error('Excel context not available');
            return;
        }
        
        try {
            setLoading(true);
            const file = event.files[0];
            const excelData = await loadExcelFromFile(file);
            // Guardamos los datos en localStorage
            localStorage.setItem('excelData', JSON.stringify(excelData));
            localStorage.setItem('fileRoute', 'true');
            navigate('/');
        } catch (error) {
            console.error('Error al cargar el archivo:', error);
        } finally {
            setLoading(false);
        }
    };

    const header = (
        <div className="text-center p-5">
            <h1 className="text-3xl font-bold mb-4">Sistema de Calificaciones</h1>
            <p className="text-gray-600">Selecciona una opción para comenzar</p>
        </div>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-xl" header={header}>
                <div className="p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-6">
                            <ProgressSpinner />
                            <p className="mt-4 text-gray-600">
                                Procesando archivo...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 mb-4">
                                <Button 
                                    label="Crear nueva hoja de calificaciones" 
                                    icon="pi pi-plus" 
                                    severity="success"
                                    outlined
                                    onClick={handleCreateNew}
                                    disabled={loading}
                                    tooltip="Crear una nueva configuración desde cero"
                                    className='text-white bg-green-500 hover:bg-green-800 p-2 w-full'
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Configura una nueva hoja de calificaciones con períodos personalizados
                                </p>
                            </div>
                            
                            <div className="text-center py-2">
                                <span className="text-gray-400 text-sm">- O -</span>
                            </div>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                                <FileUpload
                                    mode="basic"
                                    name="excel"
                                    accept=".xlsx,.xls"
                                    maxFileSize={1000000}
                                    customUpload
                                    uploadHandler={onUpload}
                                    auto
                                    chooseLabel="Cargar archivo Excel existente"
                                    className="w-full"
                                    disabled={!loadExcelFromFile}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                     Cargar un archivo de calificaciones, formatos soportados: .xlsx, .xls (máximo 1MB)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default CargarHojaDeDatos;