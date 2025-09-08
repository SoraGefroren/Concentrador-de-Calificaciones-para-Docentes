import { useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useState, useRef } from 'react';

interface CloseFileModalProps {
  visible: boolean;
  onHide: () => void;
}

const CloseFileModal = ({ visible, onHide }: CloseFileModalProps) => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseFile = () => {
    setIsClosing(true);
    
    // Limpiar todos los datos relacionados con el archivo Excel del localStorage
    localStorage.removeItem('excelData');
    localStorage.removeItem('fileRoute');
    
    // Mostrar mensaje de éxito
    toast.current?.show({
      severity: 'success',
      summary: 'Archivo cerrado',
      detail: 'Los datos han sido eliminados exitosamente',
      life: 3000
    });
    
    // Simular un pequeño delay para mostrar el proceso
    setTimeout(() => {
      onHide(); // Cerrar modal primero
      navigate('/cargar-hoja');
    }, 1500);
  };

  const handleCancel = () => {
    onHide(); // Cerrar modal sin hacer nada
  };

  const modalFooter = isClosing ? null : (
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
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Cerrar Archivo Excel"
        modal
        style={{ width: '500px' }}
        footer={modalFooter}
        closable={!isClosing}
      >
        {isClosing ? (
          <div className="flex flex-col items-center justify-center p-8">
            <ProgressSpinner />
            <h3 className="text-lg font-semibold mt-4 mb-2">Cerrando archivo</h3>
            <p className="text-gray-600 text-center">
              Limpiando datos y redirigiendo...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">
                ¿Está seguro que desea cerrar el archivo actual?
              </h3>
              <p className="text-gray-600 text-sm">
                Esta acción eliminará todos los datos cargados.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
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
          </div>
        )}
      </Dialog>
    </>
  );
};

export default CloseFileModal;
