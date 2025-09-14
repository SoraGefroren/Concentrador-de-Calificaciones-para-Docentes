import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { FileUpload } from 'primereact/fileupload';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { clearLocalStorage, updatedLocalStorage } from '../common/utils/clusterOfMethods';
import FileUploadEvent from '../features/adds/FileUploadEvent';
import { useExcelContext } from '../common/contexts/ExcelContext';

const CargarHojaDeDatos = () => {
    // Variables de estado
    const navigate = useNavigate();
    const context = useExcelContext();
    const [loading, setLoading] = useState(false);

    const handleCreateNew = () => {
        // Limpiar cualquier configuración previa
        clearLocalStorage();
        // Navegar a la página de crear hoja
        navigate('/crear-hoja');
    }

    const handleUploadFile = async (event: FileUploadEvent) => {
        setLoading(true);
        // Manejar la carga del archivo
        if (await updatedLocalStorage(context, event)) {
            // Navegar a la página principal si la carga fue exitosa
            navigate('/');
        }
        setLoading(false);
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
                                    icon="pi pi-file" 
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
                                    uploadHandler={handleUploadFile}
                                    auto
                                    chooseLabel="Cargar archivo Excel existente"
                                    className="w-full"
                                    disabled={loading}
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