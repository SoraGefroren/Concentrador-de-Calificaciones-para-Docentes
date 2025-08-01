import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcelContext } from '../common/contexts/ExcelContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { FileUpload } from 'primereact/fileupload';
import { Card } from 'primereact/card';
import FileUploadEvent from '../features/adds/FileUploadEvent';

const CargarHojaDeDatos = () => {
    // Variables de estado
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { loadExcelFromFile } = useExcelContext();

    const onUpload = async (event: FileUploadEvent) => {
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
            <p className="text-gray-600">Por favor, carga tu archivo Excel de calificaciones para comenzar</p>
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
                        <FileUpload
                            mode="basic"
                            name="excel"
                            accept=".xlsx,.xls"
                            maxFileSize={1000000}
                            customUpload
                            uploadHandler={onUpload}
                            auto
                            chooseLabel="Seleccionar archivo Excel"
                            className="w-full"
                        />
                    )}
                </div>
            </Card>
        </div>
    );
};

export default CargarHojaDeDatos;