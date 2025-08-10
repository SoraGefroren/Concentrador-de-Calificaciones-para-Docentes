

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExcelContext } from '../contexts/ExcelContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { FileUpload } from 'primereact/fileupload';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import FileUploadEvent from '../../features/adds/FileUploadEvent';

interface ChangeDataSheetModalProps {
  visible: boolean;
  onHide: () => void;
}

const ChangeDataSheetModal = ({ visible, onHide }: ChangeDataSheetModalProps) => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const { loadExcelFromFile } = useExcelContext();

  const onUpload = async (event: FileUploadEvent) => {
    try {
      setLoading(true);
      const file = event.files[0];
      const excelData = await loadExcelFromFile(file);
      
      // Guardamos los datos en localStorage (reemplazando los anteriores)
      localStorage.setItem('excelData', JSON.stringify(excelData));
      localStorage.setItem('fileRoute', 'true');
      
      // Mostrar mensaje de éxito
      toast.current?.show({
        severity: 'success',
        summary: 'Archivo cargado',
        detail: 'Los datos han sido reemplazados exitosamente',
        life: 3000
      });
      
      // Cerrar modal y navegar al inicio
      onHide();
      navigate('/');
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el archivo. Verifique que sea un archivo Excel válido.',
        life: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseFile = () => {
    onHide(); // Cerrar la modal primero
    navigate('/cerrar-hoja'); // Navegar a la página de cerrar archivo
  };

  const handleCreateNew = () => {
    // Limpiar los datos actuales
    localStorage.removeItem('excelData');
    localStorage.removeItem('fileRoute');
    localStorage.removeItem('extendedColumnConfig');
    
    // Mostrar mensaje informativo
    toast.current?.show({
      severity: 'info',
      summary: 'Archivo cerrado',
      detail: 'Los datos han sido eliminados. Ahora puede cargar un nuevo archivo.',
      life: 3000
    });
    
    // Cerrar modal y navegar a cargar hoja
    onHide();
    navigate('/cargar-hoja');
  };

  const modalFooter = (
    <div className="flex justify-between">
      <div className="flex gap-2">
        <Button 
          label="Cerrar Archivo" 
          icon="pi pi-sign-out" 
          severity="danger"
          outlined
          onClick={handleCloseFile}
          disabled={loading}
          tooltip="Cerrar el archivo actual"
        />
        <Button 
          label="Crear Nuevo" 
          icon="pi pi-plus" 
          severity="success"
          outlined
          onClick={handleCreateNew}
          disabled={loading}
          tooltip="Limpiar datos y cargar nuevo archivo"
        />
      </div>
      <Button 
        label="Cancelar" 
        icon="pi pi-times" 
        outlined 
        onClick={onHide}
        disabled={loading}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header="Gestión de Archivos Excel"
        modal
        style={{ width: '600px' }}
        footer={modalFooter}
        closable={!loading}
      >
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <i className="pi pi-file-excel text-4xl text-green-500 mb-3"></i>
            <h3 className="text-lg font-semibold mb-2">
              Gestionar Archivo Excel
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Puede cargar un nuevo archivo para reemplazar los datos actuales, 
              cerrar el archivo actual, o crear un proyecto completamente nuevo.
            </p>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <ProgressSpinner />
              <p className="mt-4 text-gray-600">
                Procesando archivo...
              </p>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <FileUpload
                  mode="basic"
                  name="excel"
                  accept=".xlsx,.xls"
                  maxFileSize={1000000}
                  customUpload
                  uploadHandler={onUpload}
                  auto
                  chooseLabel="Reemplazar con nuevo archivo Excel"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Formatos soportados: .xlsx, .xls (máximo 1MB)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <i className="pi pi-info-circle mr-2"></i>
                  Opciones disponibles:
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start">
                    <i className="pi pi-upload mr-2 mt-1"></i>
                    <span><strong>Reemplazar archivo:</strong> Seleccione un archivo arriba para reemplazar los datos actuales</span>
                  </div>
                  <div className="flex items-start">
                    <i className="pi pi-sign-out mr-2 mt-1"></i>
                    <span><strong>Cerrar archivo:</strong> Cierre el archivo actual con confirmación de seguridad</span>
                  </div>
                  <div className="flex items-start">
                    <i className="pi pi-plus mr-2 mt-1"></i>
                    <span><strong>Crear nuevo:</strong> Elimine todos los datos y comience un proyecto nuevo</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default ChangeDataSheetModal;