import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { useState } from 'react';

const CerrarHojaDeDatos = () => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const showConfirmation = true;

  const handleCloseFile = () => {
    setIsClosing(true);
    
    // Limpiar todos los datos relacionados con el archivo Excel del localStorage
    localStorage.removeItem('excelData');
    localStorage.removeItem('fileRoute');
    localStorage.removeItem('extendedColumnConfig');
    
    // Simular un pequeño delay para mostrar el proceso
    setTimeout(() => {
      navigate('/cargar-hoja');
    }, 1500);
  };

  const handleCancel = () => {
    navigate('/'); // Volver al inicio sin cerrar
  };

  if (isClosing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <div className="flex flex-col items-center justify-center p-8">
            <ProgressSpinner />
            <h2 className="text-xl font-semibold mt-4 mb-2">Cerrando archivo</h2>
            <p className="text-gray-600 text-center">
              Limpiando datos y redirigiendo...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-lg">
          <div className="p-6">
            <div className="text-center mb-6">
              <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
              <h2 className="text-2xl font-bold mb-2">Cerrar Archivo Excel</h2>
              <p className="text-gray-600">
                ¿Está seguro que desea cerrar el archivo actual?
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <i className="pi pi-info-circle text-orange-600 mt-1 mr-3"></i>
                <div>
                  <h4 className="font-semibold text-orange-800 mb-1">
                    Información importante:
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Se eliminarán todos los datos cargados</li>
                    <li>• Se perderán las configuraciones no guardadas</li>
                    <li>• Será redirigido a la página de carga de archivos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                outlined
                onClick={handleCancel}
                className="px-4 py-2"
              />
              <Button
                label="Sí, cerrar archivo"
                icon="pi pi-sign-out"
                severity="danger"
                onClick={handleCloseFile}
                className="px-4 py-2"
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default CerrarHojaDeDatos;
