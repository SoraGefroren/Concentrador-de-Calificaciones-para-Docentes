

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
import CloseFileModal from './CloseFileModal';

interface ChangeDataSheetModalProps {
  visible: boolean;
  onHide: () => void;
}

const ChangeDataSheetModal = ({ visible, onHide }: ChangeDataSheetModalProps) => {
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [closeFileModalVisible, setCloseFileModalVisible] = useState(false);
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
    onHide(); // Cerrar la modal principal primero
    setCloseFileModalVisible(true); // Abrir la modal de cerrar archivo
  };

  const handleCreateNew = () => {
    // Limpiar los datos actuales
    localStorage.removeItem('fileRoute');
    localStorage.removeItem('excelData');
    localStorage.removeItem('columnConfig');
    
    // Mostrar mensaje informativo
    toast.current?.show({
      severity: 'info',
      summary: 'Archivo cerrado',
      detail: 'Los datos han sido eliminados. Ahora puede cargar un nuevo archivo.',
      life: 3000
    });
    
    // Cerrar modal y navegar a cargar hoja
    onHide();
    // Navegar a la página de crear hoja
    navigate('/crear-hoja');
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
          className='text-white bg-red-500 hover:bg-red-800 p-2'
        />
      </div>
      <Button 
        label="Cancelar" 
        icon="pi pi-times" 
        outlined 
        onClick={onHide}
        disabled={loading}
        className='text-white bg-red-500 hover:bg-red-800 p-2'
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
                <Button 
                  label="Crear nuevo archivo de Excel" 
                  icon="pi pi-plus" 
                  severity="success"
                  outlined
                  onClick={handleCreateNew}
                  disabled={loading}
                  tooltip="Limpiar datos y cargar nuevo archivo"
                  className='text-white bg-green-500 hover:bg-green-800 p-2 w-full'
                />
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
                  chooseLabel="Reemplazar con nuevo archivo Excel"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Formatos soportados: .xlsx, .xls (máximo 1MB)
                </p>
              </div>
            </>
          )}
        </div>
      </Dialog>
      
      {/* Modal para cerrar archivo */}
      <CloseFileModal 
        visible={closeFileModalVisible}
        onHide={() => setCloseFileModalVisible(false)}
      />
    </>
  );
};

export default ChangeDataSheetModal;