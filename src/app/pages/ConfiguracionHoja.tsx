import Menu from '../common/Menu.tsx';
import { useRef, useState } from 'react';
import { useExcelContext } from '../common/contexts/ExcelContext.tsx';
import { ColumnExcelConfig, ColumnExcelData, ColumnGroupConfig, typeColumnsGroup, typePeriodGroup} from '../common/hooks/useExcelData.tsx';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { ColorPicker } from 'primereact/colorpicker';
import { DataTable } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { getExcelColumnName } from '../common/utils/clusterOfMethods.tsx';
import * as XLSX from 'xlsx';

const ConfiguracionHoja = () => {
  // References y hooks
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  
  // Intentar obtener datos del contexto si existen, pero no depender de ellos
  const context = useExcelContext();
  const excelData: ColumnExcelData[] = context?.excelData || [];
  
  // Determinar si hay datos de Excel para mostrar o no el Menu
  const hasExcelData: boolean = (excelData).length > 0;

  // Usar configuración existente o valores por defecto
  const [columnConfig, setConfig] = useState<ColumnGroupConfig[]>(context?.columnConfig || []);

  // Apuntador para manejar el tab Activo
  const [activeTab, setActiveTab] = useState(0);
  
  /*
   * FUNCIONES DE APOYO A LA VISUALIZACIÓN
   */
  const groupSectionConfiguration = () => {
    let countChangeTypes = 0;
    const arrayTypeGroupConfig: {
        left: ColumnGroupConfig[]; center: ColumnGroupConfig[]; right: ColumnGroupConfig[]
      } = {
        left: [],
        center: [],
        right: []
      };
    columnConfig.forEach(groupConfig => {
      if (typePeriodGroup !== groupConfig.type) {
        countChangeTypes += 1;
        arrayTypeGroupConfig.center.push(groupConfig);
      } else {
        if (countChangeTypes === 0) {
          arrayTypeGroupConfig.left.push(groupConfig);
        } else {
          arrayTypeGroupConfig.right.push(groupConfig);
        }
      }
    });
    return arrayTypeGroupConfig;
  };
  
  const groupSectionConfig = groupSectionConfiguration();

  /*
   * FUNCIONES DE APOYO A LA VISUALIZACIÓN
   */
  const groupPreviewConfiguration = () => {
    let arrayTypeGroupConfig = [];
    columnConfig.forEach(groupConfig => {
      // Se recorren las columnas que conforman al grupo
      groupConfig.columns.forEach(excelConfig => {
        arrayTypeGroupConfig.push({
          position: excelConfig.id,
          name: excelConfig.label,
          date: excelConfig.date,
          points: excelConfig.points,
          category: groupConfig.type,
          type: groupConfig.type
        });
      });
    });
    return arrayTypeGroupConfig;
  }
  
  const groupPreviewConfig = groupPreviewConfiguration();

  /*
   * FUNCIONES PARA TRATAR CON LA CONFIGURACIÓN DE GRUPOS DE COLUMNAS
   */
  const updatedColumnGroup = (colGroupConfig: ColumnGroupConfig[]): void => {
    setConfig(colGroupConfig ? [...colGroupConfig] : []);
    recalculateColumnGroupRanges();
  };

  // Función para calcular la posición de una columna específica dentro de un grupo
  const getColumnPositionInGroup = (groupId: string, columnIndex: number): string => {
    // Buscar el grupo correspondiente
    const group = columnConfig?.find(p => p.id === groupId);
    // Si el grupo no existe, entonces regresar cadena vacía
    if (!group) return '';
    const groupIndex = columnConfig.indexOf(group) | -1;
    // Calcular la cantidad de columnas a la izquierda del grupo
    let leftColumnsCount = -1;
    for (let i = 0; i < groupIndex; i++) {
      const colsConfig = columnConfig[i] || [];
      leftColumnsCount += colsConfig.columns.length;
    }
    // Calcular la posición de la columna dentro del grupo
    return getExcelColumnName((leftColumnsCount + 1) + columnIndex);
  };

  // Calcular automáticamente los rangos de los grupos de columnas
  const recalculateColumnGroupRanges = (): { newGroupIndex: number; newColIndex: number } => {
    // Redefinir el ID de los grupos de columnas
    let currentColumnIndex = 0;
    let newGroupIndex = -1;
    let newColIndex = -1;
    for (let x = 0; x < columnConfig.length; x++) {
      const colsConfig = columnConfig[x];
      const firstColIndex = currentColumnIndex;
      const lastColIndex = currentColumnIndex + (colsConfig.columns.length - 1);
      for (let y = 0; y < colsConfig.columns.length; y++) {
        if ((newGroupIndex === -1) && (newColIndex === -1) && !columnConfig[x].columns[y].id) {
          newColIndex = y;
        }
        // Redefinir el ID de las columnas de los grupos de columnas
        columnConfig[x].columns[y].id = getExcelColumnName(currentColumnIndex);
        currentColumnIndex += 1;
      }
      if ((newGroupIndex === -1) && (!colsConfig.id || (newColIndex !== -1))) {
        if (newColIndex === -1) {
          newColIndex = (colsConfig.columns.length - 1);
        }
        newGroupIndex = x;
      }
      columnConfig[x].id = getExcelColumnName(firstColIndex) + ':' + getExcelColumnName(lastColIndex);
    }
    // Actualizar la configuración de los grupos de columnas
    setConfig(columnConfig ? [...columnConfig] : []);
    // Devuelve los indices de los primeros grupos sin ID
    return {
      newGroupIndex,
      newColIndex
    };
  };

  /*
   * FUNCIONES PARA TRATAR CON GRUPOS DE COLUMNAS
   */
  // Función para agregar un nuevo grupo de columnas
  const addColumnGroup = (typeGroup: 'period') => {
    // Generar un nuevo grupo
    const newColumnGroup: ColumnGroupConfig = {
      id: '',
      color: '#3b82f6',
      label: `Título`,
      type: typeGroup,
      columns: Array.from({ length: 1 }, (_, i) => ({
        id: ``,
        label: `Actividad`,
        date: null,
        points: null
      })),
      isNew: true
    };
    // Determinar posición que debera ocupar el nuevo grupo
    if (columnConfig.length > 0) {
      // Buscar el ultimo grupo de columnas
      let lastColumnConfig = null;
      if (typeGroup === typePeriodGroup) {
        for (const colsConfig of columnConfig) {
          if (colsConfig.type === typePeriodGroup) {
            lastColumnConfig = colsConfig;
          }
        }
      }
      // Calcular la posición inicial del nuevo grupo
      if (lastColumnConfig) {
        // Insertar el nuevo grupo después del último grupo del mismo tipo
        const lastColumnIndex = columnConfig.indexOf(lastColumnConfig) + 1;
        columnConfig.splice(lastColumnIndex, 0, newColumnGroup);
      } else {
        // Lanzar mensaje de error
        toast.current?.show({
          severity: 'error',
          summary: 'Error al agregar un nuevo periodo',
          detail: 'Existe un problema con la configuración del archivo',
          life: 3000
        });
      }
    } else {
      // Lanzar mensaje de error
      toast.current?.show({
        severity: 'error',
        summary: 'Error al agregar un nuevo periodo',
        detail: 'Existe un problema con la configuración del archivo',
        life: 3000
      });
    }
    // Actualizar la configuración de los grupos de columnas
    updatedColumnGroup(columnConfig);
    // Lanzar mensaje de exito
    toast.current?.show({
      severity: 'success',
      summary: 'Período agregado',
      detail: 'Nuevo período creado exitosamente',
      life: 3000
    });
  };

  // Función para eliminar un período
  const removeColumnGroup = (groupId: string) => {
    confirmDialog({
      message: '¿Estás seguro de que deseas eliminar este período? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
          const columnPeriodGroups = columnConfig.filter(p => p.type === typePeriodGroup);
          if (columnPeriodGroups.length > 1) {
            // Actualizar la configuración de los grupos de columnas
            updatedColumnGroup(columnConfig.filter(p => p.id !== groupId));
            // Lanzar mensaje de exito
            toast.current?.show({
              severity: 'info',
              summary: 'Período eliminado',
              detail: 'El período ha sido eliminado exitosamente',
              life: 3000
            });
          } else {
            // Lanzar mensaje de error
            toast.current?.show({
              severity: 'error',
              summary: 'Error al eliminar período',
              detail: 'No se puede eliminar el período, debe haber al menos uno',
              life: 3000
            });
          }
      }
    });
  };

  // Función para actualizar un período
  const updateColumnGroup = (groupId: string, updates: Partial<ColumnGroupConfig>) => {
    setConfig(
      columnConfig.map(p => 
        p.id === groupId ? { ...p, ...updates } : p
      )
    );
  };

  /*
   * FUNCIONES PARA TRATAR CON COLUMNAS
   */
  // Función para agregar columna a un grupo
  const addColumnToGroup = (groupId: string, typeGroup: 'info' | 'columns' | 'period') => {
    // Buscar el grupo correspondiente
    const group = columnConfig.find(p => p.id === groupId);
    if (!group) return;
    // Añadir una nueva columna al grupo
    const groupIndex = columnConfig.indexOf(group);
    const newColumn: ColumnExcelConfig = {
      id: ``,
      label: (typeGroup === 'period')
        ? `Actividad`
        : `Columna`,
      date: null,
      points: null
    };
    columnConfig[groupIndex].columns.push(newColumn);
    // Actualizar la configuración de los grupos de columnas
    updatedColumnGroup(columnConfig);
    // Lanzar mensaje de éxito
    toast.current?.show({
      severity: 'success',
      summary: 'Columna agregada',
      detail: 'Nueva columna agregada',
      life: 3000
    });
  };

  // Función para eliminar columna de un período
  const removeColumnFromGroup = (groupId: string, columnId: string) => {
    confirmDialog({
      message: '¿Estás seguro de que deseas eliminar esta columna? Esta acción no se puede deshacer.',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {    
          // Buscar el grupo correspondiente
          const group = columnConfig.find(p => p.id === groupId);
          const column = group?.columns.find(c => c.id === columnId);
          if (group && (group?.columns.length || 0) > 1) {
            const groupIndex = columnConfig.indexOf(group!);
            const columnIndex = group.columns.indexOf(column!);
            columnConfig[groupIndex].columns.splice(columnIndex, 1);
            // Actualizar la configuración de los grupos de columnas
            updatedColumnGroup(columnConfig);
            // Lanzar mensaje de exito
            toast.current?.show({
              severity: 'info',
              summary: 'Columna eliminada',
              detail: 'Columna eliminada',
              life: 3000
            });
          } else {
            // Lanzar mensaje de error
            toast.current?.show({
              severity: 'error',
              summary: 'Error al eliminar columna',
              detail: 'No se puede eliminar la columna, debe haber al menos una',
              life: 3000
            });
          }
      }
    });
  };

  // Función para actualizar una columna específica
  const updateColumnFromGroup = (groupId: string, columnId: string, updates: { label?: string; date?: string; points?: number }) => {    
      const group = columnConfig.find(p => p.id === groupId);
      group?.columns.map(c => 
        c.id === columnId ? { ...c, ...updates } : c
      );
      setConfig(
        columnConfig.map(p => 
          p.id === groupId ? { ...p, ...group } : p
        )
      );
  };

  /*
   * FUNCIONES PARA TRATAR CON EL ARCHIVO DE EXCEL
   */
  // Función para actualizar la configuración de un archivo de Excel
  const updatedExcelFileConfiguration = (fileName: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        
        // ==================== ===================== ====================

        // Crear un workbook
        const wb = XLSX.utils.book_new();
        
        // ==================== HOJA 1: DATOS DE CALIFICACIONES ====================
        
        // Preparar lista de encabezados de la hoja de datos
        const arrayHeaderFields: string[] = [];

        // Construir encabezado de la primera hoja
        const matrixExcelData: (string | number)[][] = [[],[],[]];
        columnConfig.forEach(groupConfig => {
          // Se recorren las columnas que conforman al grupo
          groupConfig.columns.forEach(excelConfig => {
            // Se insertan los encabezados de las columnas (Titulo, Fecha, Puntos)
            matrixExcelData[0].push(excelConfig.label || '');
            matrixExcelData[1].push(excelConfig.date || '');
            matrixExcelData[2].push(
              (excelConfig.points == 0 || excelConfig.points)
                ? excelConfig.points
                : '');
            // Se crear un arreglo con los nombres de las columnas
            arrayHeaderFields.push(excelConfig.label || '');
          });
        });
        if (excelData && (excelData.length > 0) && (arrayHeaderFields.length > 0)) {
          excelData.forEach((rowData) => {
            // Se inserta una nueva fila
            matrixExcelData.push([]);
            const lastIndex = matrixExcelData.length - 1;
            // Se recorre cada columna para agregar los datos
            arrayHeaderFields.forEach((headerField) => {
              debugger;
              matrixExcelData[lastIndex].push(rowData[headerField] || '');
            });
          });
        }

        const wsData = XLSX.utils.aoa_to_sheet(matrixExcelData);

        // ==================== ===================== ====================

        // Crear worksheet de datos
        XLSX.utils.book_append_sheet(wb, wsData, 'Calificaciones');
        
        // ==================== HOJA 2: CONFIGURACIÓN ====================
        
        // Construir la configuración detallada
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
              '', '', '', 'Columna', 'Fecha', 'Puntos'
            ]);
            matrixConfigData.push([
              '', '', '', excelConfig.id,
              (excelConfig.date || ''),
              ((excelConfig.points == 0 || excelConfig.points)
                  ? excelConfig.points
                  : '')
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
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Crear un File object
        const file = new File([blob], fileName, { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const saveExcelFileConfiguration = async () => {
    // Validar que cada período tenga al menos una columna
    const periodsWithoutColumns = columnConfig.filter(g => g.columns.length < 1);
    if (periodsWithoutColumns.length > 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error de validación',
        detail: 'Todos los períodos deben tener al menos una columna',
        life: 5000
      });
      return;
    }

    try {
      // Guardar configuraciones en localStorage
      localStorage.setItem('columnConfig', JSON.stringify(columnConfig));
      
      // Lanzar mensaje
      toast.current?.show({
        severity: 'info',
        summary: 'Generando archivo actualizado',
        detail: 'Creando archivo Excel con datos y configuración completa...',
        life: 3000
      });

      // Generar archivo Excel con la configuración
      const fileNameXLS = 'CONC._CALIF._X°Y_.xlsx';
      const excelFile = await updatedExcelFileConfiguration(fileNameXLS);
      // Crear enlace para descargar el archivo
      const url = URL.createObjectURL(excelFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileNameXLS;
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Limpiar URL
      URL.revokeObjectURL(url);

      // Lanzar mensaje
      toast.current?.show({
        severity: 'success',
        summary: 'Actualización de archivo generada',
        detail: 'Excel con hoja de datos y configuración descargado. Cargándolo en el sistema...',
        life: 4000
      });

      // Simular el proceso de carga del archivo recién generado
      setTimeout(async () => {
        try {
          if (context?.loadExcelFromFile) {
            // Lanzar mensaje
            toast.current?.show({
              severity: 'success',
              summary: 'Configuración aplicada',
              detail: 'El archivo ha sido cargado con la nueva configuración',
              life: 3000
            });
            // Navegar al catálogo después de cargar
            setTimeout(() => {
              navigate('/');
            }, 1000);
          } else {
            // Si no hay contexto, solo navegar a cargar hoja
            toast.current?.show({
              severity: 'warn',
              summary: 'Archivo generado',
              detail: 'El archivo fue descargado. Puedes cargarlo desde la página principal.',
              life: 4000
            });
            // Navegar al catálogo después de cargar
            setTimeout(() => {
              navigate('/cargar-hoja');
            }, 1000);
          }
        } catch (error) {
          // Lanzar mensaje
          toast.current?.show({
            severity: 'warn',
            summary: 'Archivo generado',
            detail: 'El archivo fue descargado pero debes cargarlo manualmente',
            life: 4000
          });
          // Navegar al catálogo después de cargar
          setTimeout(() => {
            navigate('/cargar-hoja');
          }, 1000);
        }
      }, 2000);

    } catch (error) {
      // Lanzar mensaje
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el archivo Excel',
        life: 5000
      });
    }
  };

  // Determinar el título basado en si hay datos de Excel
  const getPageTitle = () => {
    return hasExcelData
      ? 'Configuración de hoja de calificaciones'
      : 'Crear nueva hoja de calificaciones';
  };

  // Determinar botones de navegación
  const getNavigationButtons = () => {
    if (hasExcelData) {
      return (
        <Button 
          label="Volver al catálogo" 
          icon="pi pi-arrow-left"
          onClick={() => navigate('/')}
          className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2"
        />
      );
    } else {
      return (
        <Button 
          label="Volver a carga de archivos" 
          icon="pi pi-arrow-left"
          onClick={() => navigate('/cargar-hoja')}
          className="p-button-secondary text-white bg-red-500 hover:bg-red-800 p-2"
        />
      );
    }
  };

  // Contenido principal que se renderiza con o sin Menu
  const mainContent = (
    <>
      <ConfirmDialog />
      <Toast ref={toast} />
      <div className="p-4 max-w-7xl w-full">

        {/* Botones de acción */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex">
          </div>
          <div className="flex gap-3">
            <Button
              label="Generar archivo Excel"
              icon="pi pi-download"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
              onClick={saveExcelFileConfiguration}
            />
            {getNavigationButtons()}
          </div>
        </div>

        {/* Panel de Períodos */}
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}  className="p-0">
          
          {/* Panel de Columnas Centrales */}
          <TabPanel header="Configuración de Períodos" leftIcon="pi pi-calendar mr-2" className="p-0">
            <Card className="mb-6 p-0">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Configuración de Períodos de Colores</h4>
                <Button
                  label="Agregar Período"
                  icon="pi pi-plus"
                  className="p-button-success"
                  onClick={() => addColumnGroup('period')}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {groupSectionConfig.center.map((arrayColumnConfig) => {
                  return (
                    <>
                      {(
                        arrayColumnConfig.map((groupConfig) => {
                          const isNew = groupConfig.isNew;
                          return (
                            <Card 
                              key={groupConfig.id} 
                              className={`border-l-4 transition-all duration-500 ${
                                isNew 
                                  ? 'border-2 border-green-400 shadow-lg shadow-green-200 bg-green-50' 
                                  : ''
                              }`}
                              style={{ borderLeftColor: groupConfig.color }}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded border"
                                    style={{ backgroundColor: groupConfig.color }}
                                  ></div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{groupConfig.label}</h3>
                                    {isNew && (
                                      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full animate-pulse">
                                        ¡NUEVO!
                                      </span>
                                    )}
                                  </div>
                                </div>
                            
                                <div className="flex gap-2">
                                  <Button
                                    icon="pi pi-plus"
                                    className="p-button-sm p-button-success"
                                    tooltip="Agregar columna"
                                    onClick={() => addColumnToGroup(groupConfig.id, typePeriodGroup)}
                                  />
                                  {groupConfig.columns.length > 1 && (
                                    <Button
                                      icon="pi pi-trash"
                                      className="p-button-sm p-button-danger"
                                      tooltip="Eliminar período"
                                      onClick={() => removeColumnGroup(groupConfig.id)}
                                    />
                                  )}
                                </div>
                              </div>
                          
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Nombre del período</label>
                                  <InputText 
                                    value={groupConfig.label} 
                                    onChange={(e) => updateColumnGroup(groupConfig.id, { label: e.target.value })} 
                                    className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Color</label>
                                  <div className="flex gap-2 items-center">
                                    <ColorPicker 
                                      value={groupConfig.color.replace('#', '')} 
                                      onChange={(e) => updateColumnGroup(groupConfig.id, { color: `#${e.value}` })} 
                                    />
                                    <InputText 
                                      value={groupConfig.color} 
                                      onChange={(e) => updateColumnGroup(groupConfig.id, { color: e.target.value })}
                                      className="flex-1 bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                      placeholder="#000000"
                                    />
                                  </div>
                                </div>
                              </div>
          
                              {/* Sección de columnas del período */}
                              <div className="border-t pt-4">

                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-medium">Columnas del Período</h5>
                                  <span className="text-sm text-gray-500">{groupConfig.columns.length} columnas</span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-3">
                                  {groupConfig.columns.map((excelConfig, colIndex) => {
                                    const isNewColumn = excelConfig.isNew;
                                    return (
                                      <div 
                                        key={excelConfig.id} 
                                        className={`flex gap-3 items-center p-3 rounded transition-all duration-500 ${
                                          isNewColumn 
                                            ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                            : 'bg-gray-50'
                                        }`}
                                      >
                                        <span className="text-sm font-medium w-8 text-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                          {getColumnPositionInGroup(excelConfig.id, colIndex)}
                                        </span>
                                        
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <label className="block text-xs text-gray-600">Nombre</label>
                                            {isNewColumn && (
                                              <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                                                ¡NUEVA!
                                              </span>
                                            )}
                                          </div>
                                          <InputText
                                            value={excelConfig.header}
                                            onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { label: e.target.value })}
                                            className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                            placeholder="Nombre de la actividad"
                                          />
                                        </div>
                                      
                                        <div className="w-32">
                                          <label className="block text-xs text-gray-600 mb-1">Fecha</label>
                                          <InputText
                                            value={excelConfig.date}
                                            onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { date: e.target.value })}
                                            className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                            placeholder="DD-MMM-AA"
                                          />
                                        </div>
                                        
                                        <div className="w-20">
                                          <label className="block text-xs text-gray-600 mb-1">Puntos</label>
                                          <InputNumber
                                            value={excelConfig.points}
                                            onValueChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { points: e.value || 0 })}
                                            className="w-20 text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                            min={0}
                                            max={100}
                                          />
                                        </div>
                                        
                                        {groupConfig.columns.length > 1 && (
                                          <Button
                                            icon="pi pi-trash"
                                            className="p-button-sm p-button-danger p-button-text"
                                            tooltip="Eliminar columna"
                                            onClick={() => removeColumnFromGroup(groupConfig.id, excelConfig.id)}
                                          />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </>
                  );
                })}
              </div>
            </Card>
          </TabPanel>

          {/* Panel de Columnas Fijas */}
          <TabPanel header="Columnas Fijas" leftIcon="pi pi-table mr-2" className="p-0">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-0">
              
              {/* Columnas Fijas Izquierdas */}
              {groupSectionConfig.left.map((arrayColumnConfig) => {
                return (
                  <>
                    {(
                      arrayColumnConfig.map((groupConfig, indexGroup) => {
                        groupConfig.columns.map((excelConfig, colIndex) => {
                          const isNewColumn = excelConfig.isNew;
                          return (
                            <Card>
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold">Columnas Fijas Izquierdas</h4>
                                <Button
                                  icon="pi pi-plus"
                                  className="p-button-sm p-button-success"
                                  onClick={() => addColumnToGroup(groupConfig.id, typeColumnsGroup)}
                                  tooltip="Agregar columna"
                                />
                              </div>
                              <div className="space-y-2">
                                <div 
                                  key={indexGroup} 
                                  className={`flex gap-2 items-center p-2 rounded transition-all duration-500 ${
                                    isNewColumn 
                                      ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                      : 'bg-transparent'
                                  }`}
                                >
                                  <span className="text-sm text-gray-500 w-8">{getExcelColumnName(indexGroup + 1)}</span>
                                  <div className="flex-1 flex items-center gap-2">
                                    <InputText
                                      value={excelConfig.label}
                                      onChange={e => updateColumnFromGroup(groupConfig.id, indexGroup, { label: e.target.value })}
                                      className="flex-1 bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                    />
                                    {isNewColumn && (
                                      <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                                        ¡NUEVA!
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    icon="pi pi-trash"
                                    className="p-button-sm p-button-danger p-button-text"
                                    onClick={() => removeColumnFromGroup(groupConfig.id, indexGroup)}
                                  />
                                </div>
                              </div>
                            </Card>
                          );
                        });
                      })
                    )}
                  </>
                );
              })}

              {/* Columnas Fijas Derechas */}
              {groupSectionConfig.right.map((arrayColumnConfig) => {
                return (
                  <>
                    {(
                      arrayColumnConfig.map((groupConfig, indexGroup) => {
                        groupConfig.columns.map((excelConfig, colIndex) => {
                          const isNewColumn = excelConfig.isNew;
                          return (
                            <Card>
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold">Columnas Fijas Derechas</h4>
                                <Button
                                  icon="pi pi-plus"
                                  className="p-button-sm p-button-success"
                                  onClick={() => addColumnToGroup(groupConfig.id, typeColumnsGroup)}
                                  tooltip="Agregar columna"
                                />
                              </div>
                              <div className="space-y-4">
                                {groupSectionConfig.right.map((column, index) => {
                                  const totalPeriodsColumns = extendedConfig.periods.reduce((sum, p) => sum + p.numColumns, 0);
                                  const position = extendedConfig.fixedColumnsLeft.length + totalPeriodsColumns + index + 1;
                                  const isNewRight = newlyAdded.fixedColumnsRight.has(index);
                                  
                                  return (
                                    <div 
                                      key={index} 
                                      className={`p-3 rounded border transition-all duration-500 ${
                                        isNewRight 
                                          ? 'bg-green-100 border-2 border-green-300 shadow-lg' 
                                          : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="text-sm font-medium text-gray-500 w-8">
                                          {getExcelColumnName(position)}
                                        </span>
                                        <h6 className="font-medium text-gray-700">Columna {index + 1}</h6>
                                        {isNewRight && (
                                          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full animate-pulse">
                                            ¡NUEVA!
                                          </span>
                                        )}
                                        <div className="flex-1"></div>
                                        <Button
                                          icon="pi pi-trash"
                                          className="p-button-sm p-button-danger p-button-text"
                                          onClick={() => removeColumnFromGroup(groupConfig.id, excelConfig.id)}
                                          tooltip="Eliminar columna"
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
                                          <InputText
                                            value={excelConfig.label}
                                            onChange={e => updateColumnFromGroup(groupConfig.id, excelConfig.id, { label: e.target.value })}
                                            className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                            placeholder="Nombre de la columna"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">Fecha (opcional)</label>
                                          <InputText
                                            value={excelConfig.date || ''}
                                            onChange={e => updateColumnFromGroup(groupConfig.id, excelConfig.id, { date: e.target.value === '' ? undefined : e.target.value })}
                                            className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                            placeholder="DD-MMM-AA"
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs text-gray-600 mb-1">Puntos (opcional)</label>
                                          <InputNumber
                                            value={excelConfig.points ?? null}
                                            onValueChange={(e) => {
                                              const newValue = e.value !== null && e.value !== undefined ? e.value : undefined;
                                              updateColumnFromGroup(groupConfig.id, excelConfig.id, { points: newValue });
                                            }}
                                            className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                            placeholder="0"
                                            min={0}
                                            max={100}
                                            showButtons={false}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </Card>
                          );
                        });
                      })
                    )}
                  </>
                );
              })}

            </div>
          </TabPanel>

          <TabPanel header="Vista Previa" leftIcon="pi pi-eye mr-2">
            <Card className="p-0">
              <h4 className="font-bold mb-4">Vista Previa de la Estructura</h4>
              <div className="overflow-x-auto">
                <DataTable value={groupPreviewConfig} className="text-sm">
                  <Column field="position" header="Posición Excel" style={{ width: '100px' }} />
                  <Column field="name" header="Nombre de Columna" style={{ width: '200px' }} />
                  <Column 
                    field="date" 
                    header="Fecha" 
                    style={{ width: '120px' }}
                    body={(rowData) => (
                      <span className="text-xs text-gray-600">
                        {rowData.date || '-'}
                      </span>
                    )}
                  />
                  <Column 
                    field="points" 
                    header="Puntos" 
                    style={{ width: '80px' }}
                    body={(rowData) => (
                      <span className="text-xs text-gray-600">
                        {rowData.points !== undefined ? rowData.points : '-'}
                      </span>
                    )}
                  />
                  <Column 
                    field="category" 
                    header="Categoría" 
                    style={{ width: '120px' }}
                    body={(rowData) => (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rowData.type === 'fixed-left' ? 'bg-blue-100 text-blue-800' :
                        rowData.type === 'fixed-right' ? 'bg-gray-100 text-gray-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {rowData.category}
                      </span>
                    )}
                  />
                  <Column 
                    field="type" 
                    header="Detalle" 
                    body={(rowData) => (
                      <span className="text-xs text-gray-500">
                        {rowData.type === 'fixed-left' ? 'Fija Izq.' :
                         rowData.type === 'fixed-right' ? 'Fija Der.' :
                         rowData.periodName || rowData.type}
                      </span>
                    )}
                  />
                </DataTable>
              </div>

            </Card>
          </TabPanel>
        </TabView>

        <div className="mt-6 flex justify-end">
          <div className="flex gap-3 pt-3">
            <Button
              label="Generar archivo Excel"
              icon="pi pi-download"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
              onClick={saveExcelFileConfiguration}
            />
            {getNavigationButtons()}
          </div>
        </div>
      </div>
    </>
  );

  // Renderizado condicional: con Menu si hay datos de Excel, sin Menu si no los hay
  return hasExcelData ? (
    <Menu navBarTitle={getPageTitle()}>
      {mainContent}
    </Menu>
  ) : (
    <div className="min-h-screen bg-gray-100">
      <div className="container w-full mx-auto py-8">
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{getPageTitle()}</h1>
          <p className="text-gray-600">Configura los períodos y columnas para tu hoja de calificaciones</p>
        </div>
        <div className="flex justify-center">
          {mainContent}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionHoja;
