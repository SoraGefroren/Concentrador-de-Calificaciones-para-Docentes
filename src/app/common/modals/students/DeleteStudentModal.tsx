import * as XLSX from 'xlsx';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useState, useRef, useMemo } from 'react';
import { ColumnExcelData } from '../../hooks/useExcelData';
import { useExcelContext } from '../../contexts/ExcelContext';
import { getSectionsColumnsConfig } from '../../utils/clusterOfMethods';

interface DeleteStudentModalProps {
  visible: boolean;
  onHide: () => void;
  studentId: string | number;
  studentName?: string;
}

const DeleteStudentModal = ({ 
  visible, 
  onHide, 
  studentId, 
  studentName 
}: DeleteStudentModalProps) => {
    const toast = useRef<Toast>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const context = useExcelContext();
    const excelData = useMemo(() => context?.excelData || [], [context?.excelData]);
    const columnConfig = useMemo(() => context?.columnConfig || [], [context?.columnConfig]);
    const studentsExcelData = useMemo(() => 
        excelData.length > 2 ? [...excelData].slice(2, excelData.length) || [] : [],
        [excelData]
    );

    // Obtener las columnas de la sección izquierda y derecha
    const groupSectionConfig = getSectionsColumnsConfig(columnConfig);
    // Obtener las columnas de la sección izquierda (apuntando al id estudiante)
    const leftSectionFields = groupSectionConfig.left.flatMap(group =>
        group.columns.map(col => col.label)
    );
    // La primera columna es siempre el ID (primera columna de la sección izquierda)
    const idColumnName = leftSectionFields.length > 0 ? leftSectionFields.shift() : '';
    
    // Función para eliminar un estudiante del array y generar archivo Excel actualizado
    const onConfirmDelete = async (studentId: string | number): Promise<void> => {
        try {
            // Encontrar el estudiante a eliminar
            const studentToDelete = studentsExcelData.find((row: ColumnExcelData) => row[idColumnName]?.toString() === studentId.toString());
            
            if (!studentToDelete) {
                throw new Error('Estudiante no encontrado');
            }

            // Crear array de estudiantes sin el estudiante eliminado
            const updatedStudentsData = studentsExcelData.filter((row: ColumnExcelData) => 
                row[idColumnName]?.toString() !== studentId.toString()
            );

            // Generar archivo Excel actualizado sin el estudiante eliminado
            await generateUpdatedExcelFileAfterDelete(updatedStudentsData);

        } catch (error) {
            console.error('Error al eliminar el estudiante:', error);
            throw new Error('No se pudo eliminar el estudiante');
        }
    };

    // Función auxiliar para generar archivo Excel actualizado después de eliminación
    const generateUpdatedExcelFileAfterDelete = async (updatedStudentsData: ColumnExcelData[]): Promise<void> => {
        try {
            // Mostrar mensaje de generación
            toast.current?.show({
                severity: 'info',
                summary: 'Generando archivo actualizado',
                detail: 'Creando archivo Excel sin el alumno eliminado...',
                life: 2000
            });

            // Crear un workbook
            const wb = XLSX.utils.book_new();
            
            // ==================== HOJA 1: DATOS DE CALIFICACIONES ====================
            
            // Preparar lista de encabezados de la hoja de datos
            const arrayHeaderFields: string[] = [];

            // Construir encabezado de la primera hoja
            const matrixExcelData: (string | number)[][] = [[], [], []];

            columnConfig.forEach(groupConfig => {
                // Se recorren las columnas que conforman al grupo
                groupConfig.columns.forEach(excelConfig => {
                    // Se insertan los encabezados de las columnas (Titulo, Fecha, Puntos)
                    matrixExcelData[0].push(excelConfig.label || '');
                    matrixExcelData[1].push(excelConfig.date || '');
                    matrixExcelData[2].push(
                        (excelConfig.points == 0 || (excelConfig.points && (excelConfig.points > 0)))
                            ? excelConfig.points
                            : ''
                    );
                    // Se crear un arreglo con los nombres de las columnas
                    arrayHeaderFields.push(excelConfig.label || '');
                });
            });

            // Agregar los datos de los estudiantes actualizados (sin el eliminado)
            if (updatedStudentsData && updatedStudentsData.length > 0 && arrayHeaderFields.length > 0) {
                updatedStudentsData.forEach((rowData) => {
                    // Se inserta una nueva fila
                    matrixExcelData.push([]);
                    const lastIndex = matrixExcelData.length - 1;
                    // Se recorre cada columna para agregar los datos
                    arrayHeaderFields.forEach((headerField) => {
                        matrixExcelData[lastIndex].push(rowData[headerField] || '');
                    });
                });
            }

            const wsData = XLSX.utils.aoa_to_sheet(matrixExcelData);

            // Crear worksheet de datos
            XLSX.utils.book_append_sheet(wb, wsData, 'Calificaciones');
            
            // ==================== HOJA 2: CONFIGURACIÓN ====================
            
            // Construir la configuración detallada (igual que en ConfiguracionHoja.tsx)
            const matrixConfigData: (string | number)[][] = [];
            columnConfig.forEach(groupConfig => {
                // Se inserta el encabezado de la configuración
                matrixConfigData.push([
                    'Grupo', groupConfig.label
                ]);
                matrixConfigData.push([
                    '', 'Columnas', 'Color', 'Tipo'
                ]);
                matrixConfigData.push([
                    '', groupConfig.id, groupConfig.color, groupConfig.type
                ]);
                // Se recorren las columnas que conforman al grupo
                groupConfig.columns.forEach(excelConfig => {
                    // Se insertan los encabezados de las columnas
                    matrixConfigData.push([
                        '', '', 'Encabezado', excelConfig.label
                    ]);
                    matrixConfigData.push([
                        '', '', '', 'Columna', 'Fecha', 'Puntos', 'Editable'
                    ]);
                    matrixConfigData.push([
                        '', '', '', excelConfig.id,
                        (excelConfig.date || ''),
                        ((excelConfig.points == 0 || excelConfig.points)
                            ? excelConfig.points
                            : ''),
                        (excelConfig.isEditable !== undefined ? (excelConfig.isEditable ? 'SI' : 'NO') : 'SI')
                    ]);
                });
                // Se inserta marca para el fin del grupo de la configuración
                matrixConfigData.push([
                    '...'
                ]);
            });
            
            // Crear worksheet de configuración
            const wsConfig = XLSX.utils.aoa_to_sheet(matrixConfigData);
            XLSX.utils.book_append_sheet(wb, wsConfig, 'Configuracion');
            
            // ==================== GENERAR ARCHIVO ====================
            
            // Generar el archivo
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // Crear nombre de archivo con timestamp para evitar conflictos
            const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
            const fileName = `CONC._CALIF._ACTUALIZADO_${timestamp}.xlsx`;
            
            // Crear un File object
            const file = new File([blob], fileName, { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // Descargar el archivo
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Limpiar URL
            URL.revokeObjectURL(url);

            // Mostrar mensaje de éxito
            toast.current?.show({
                severity: 'success',
                summary: 'Archivo generado',
                detail: `Archivo Excel descargado: ${fileName}`,
                life: 4000
            });

            // Opcionalmente, recargar el archivo en el contexto
            if (context?.loadExcelFromFile) {
                setTimeout(async () => {
                    try {
                        // Aquí podrías recargar el archivo si tienes esa funcionalidad
                        // Por ahora, simplemente actualizar la página o navegar
                        window.location.reload();
                    } catch (error) {
                        console.error('Error al recargar datos:', error);
                    }
                }, 2000);
            }

        } catch (error) {
            console.error('Error al generar el archivo Excel:', error);
            throw new Error('No se pudo generar el archivo Excel actualizado');
        }
    };

    const handleDeleteStudent = async () => {
        setIsDeleting(true);
        
        try {
        await onConfirmDelete(studentId);
        
        // Mostrar mensaje de éxito
        toast.current?.show({
            severity: 'success',
            summary: 'Alumno eliminado',
            detail: `El alumno ${studentName || studentId} ha sido eliminado exitosamente`,
            life: 3000
        });
        
        // Simular un pequeño delay para mostrar el proceso
        setTimeout(() => {
            setIsDeleting(false);
            onHide(); // Cerrar modal
        }, 1500);
        
        } catch (error) {
        console.error('Error al eliminar el alumno:', error);
        
        toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el alumno. Intente nuevamente.',
            life: 5000
        });
        
        setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        if (!isDeleting) {
        onHide(); // Cerrar modal sin hacer nada
        }
    };

    const modalFooter = isDeleting ? null : (
        <div className="flex justify-end gap-3">
        <Button
            label="Cancelar"
            icon="pi pi-times"
            outlined
            onClick={handleCancel}
            className="px-4 py-2"
        />
        <Button
            label="Sí, eliminar"
            icon="pi pi-trash"
            severity="danger"
            onClick={handleDeleteStudent}
            className="px-4 py-2"
        />
        </div>
  );

  return (
    <>
        <Toast ref={toast} />
        <Dialog
            visible={visible}
            onHide={handleCancel}
            header="Eliminar Alumno"
            modal
            style={{ width: '500px' }}
            footer={modalFooter}
            closable={!isDeleting}
        >
            {isDeleting ? (
            <div className="flex flex-col items-center justify-center p-8">
                <ProgressSpinner />
                <h3 className="text-lg font-semibold mt-4 mb-2">Eliminando alumno</h3>
                <p className="text-gray-600 text-center">
                Actualizando datos y generando archivo Excel...
                </p>
            </div>
            ) : (
            <div className="flex flex-col gap-4">
                <div className="text-center">
                <i className="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">
                    ¿Está seguro que desea eliminar al alumno?
                </h3>
                <p className="text-gray-600 text-sm">
                    <strong>ID: {studentId}</strong>
                    {studentName && (
                    <><br /><strong>Nombre: {studentName}</strong></>
                    )}
                </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                    <i className="pi pi-info-circle text-red-600 mt-1 mr-3"></i>
                    <div>
                    <h4 className="font-semibold text-red-800 mb-1">
                        Información importante:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>• Se eliminará permanentemente el registro del alumno</li>
                        <li>• Se perderán todas sus calificaciones y datos asociados</li>
                        <li>• Se generará un archivo Excel actualizado sin este alumno</li>
                        <li>• Esta acción no se puede deshacer</li>
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

export default DeleteStudentModal;