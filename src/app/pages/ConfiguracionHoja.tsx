import Menu from '../common/Menu.tsx';
import { useRef, useState } from 'react';
import { useExcelContext } from '../common/contexts/ExcelContext.tsx';
import { ColumnExcelConfig, ColumnExcelData, ColumnGroupConfig, typeColumnsGroup, typeInfoGroup, typePeriodGroup} from '../common/hooks/useExcelData.tsx';
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
import * as XLSX from 'xlsx';

// Funciones de utilidad para calcular rangos de columnas Excel
const getExcelColumnName = (columnNumber: number): string => {
  let columnName = '';
  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }
  return columnName;
};

const getColumnNumber = (columnName: string): number => {
  let result = 0;
  for (let i = 0; i < columnName.length; i++) {
    result = result * 26 + (columnName.charCodeAt(i) - 64);
  }
  return result;
};

const calculateRange = (startColumn: string, numColumns: number): string => {
  const startNum = getColumnNumber(startColumn);
  const endNum = startNum + numColumns - 1;
  const endColumn = getExcelColumnName(endNum);
  return `${startColumn}1:${endColumn}1`;
};

const ConfiguracionHoja = () => {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  
  // Intentar obtener datos del contexto si existen, pero no depender de ellos
  const context = useExcelContext();
  const excelData: ColumnExcelData[] = context?.excelData || [];
  const columnConfig: ColumnGroupConfig[] = context?.columnConfig || [];

  // Usar configuración existente o valores por defecto
  const [config, setConfig] = useState<ColumnGroupConfig[]>(() => {
    return columnConfig || [];
  });

  const [activeTab, setActiveTab] = useState(0);
  
  // Estado para trackear elementos recién agregados
  const [newlyAdded, setNewlyAdded] = useState<{
    periods: Set<string>;
    columns: Set<string>;
    fixedColumnsLeft: Set<number>;
    fixedColumnsRight: Set<number>;
  }>({
    periods: new Set(),
    columns: new Set(),
    fixedColumnsLeft: new Set(),
    fixedColumnsRight: new Set()
  });

  // Función para marcar elementos como nuevos y limpiar la marca después de un tiempo
  const markAsNew = (type: 'period' | 'column' | 'fixedLeft' | 'fixedRight', id: string | number) => {
    if (type === 'period' || type === 'column') {
      setNewlyAdded(prev => ({
        ...prev,
        [type === 'period' ? 'periods' : 'columns']: new Set([...prev[type === 'period' ? 'periods' : 'columns'], id as string])
      }));
    } else {
      setNewlyAdded(prev => ({
        ...prev,
        [type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight']: new Set([...prev[type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight'], id as number])
      }));
    }

    // Remover la marca después de 5 segundos
    setTimeout(() => {
      setNewlyAdded(prev => {
        if (type === 'period' || type === 'column') {
          const newSet = new Set(prev[type === 'period' ? 'periods' : 'columns']);
          newSet.delete(id as string);
          return {
            ...prev,
            [type === 'period' ? 'periods' : 'columns']: newSet
          };
        } else {
          const newSet = new Set(prev[type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight']);
          newSet.delete(id as number);
          return {
            ...prev,
            [type === 'fixedLeft' ? 'fixedColumnsLeft' : 'fixedColumnsRight']: newSet
          };
        }
      });
    }, 5000);
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
  const recalculateColumnGroupRanges = () => {
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
      }))
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
        const lastColumnIndex = columnConfig.indexOf(lastColumnConfig) + 1;
        columnConfig.splice(lastColumnIndex, 0, newColumnGroup);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error al agregar un nuevo periodo',
          detail: 'Existe un problema con la configuración del archivo',
          life: 3000
        });
      }
    } else {
      toast.current?.show({
        severity: 'error',
        summary: 'Error al agregar un nuevo periodo',
        detail: 'Existe un problema con la configuración del archivo',
        life: 3000
      });
    }
    // Recalcular rangos después de agregar un nuevo grupo
    const colConfigIndexs = recalculateColumnGroupRanges();
    const newGroupIndex = colConfigIndexs.newGroupIndex;
    const newId = columnConfig ? columnConfig[newGroupIndex]?.id || '' : '';
    // Marcar el nuevo período como recién agregado
    markAsNew('period', newId);
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
            setConfig(columnConfig.filter(p => p.id !== groupId));
            recalculateColumnGroupRanges();
            toast.current?.show({
              severity: 'info',
              summary: 'Período eliminado',
              detail: 'El período ha sido eliminado exitosamente',
              life: 3000
            });
          } else {
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
    // Recalcular rangos después de agregar un nuevo grupo
    const colConfigIndexs = recalculateColumnGroupRanges();
    const newGroupIndex = colConfigIndexs.newGroupIndex;
    const newColIndex = colConfigIndexs.newColIndex;
    const newColumnId = columnConfig ? columnConfig[newGroupIndex]?.columns[newColIndex]?.id || '' : '';
    // Marcar la nueva columna como recién agregada
    markAsNew('column', newColumnId);
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
          if ((group?.columns.length || 0) > 1) {
            const groupIndex = columnConfig.indexOf(group!);
            const columnIndex = group.columns.indexOf(column!);
            columnConfig[groupIndex].columns.splice(columnIndex, 1);
            // Actualizar la configuración de los grupos de columnas
            setConfig(columnConfig);
            recalculateColumnGroupRanges();
            toast.current?.show({
              severity: 'info',
              summary: 'Columna eliminada',
              detail: 'Columna eliminada',
              life: 3000
            });
          } else {
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

  // Función para generar archivo Excel con la configuración aplicada
  const generateExcelWithConfiguration = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        // Crear un workbook
        const wb = XLSX.utils.book_new();
        
        // ==================== HOJA 1: DATOS DE CALIFICACIONES ====================
        
        // Generar headers basados en la configuración
        const headers: string[] = [];
        let currentColumnIndex = 0;
        const columnMapping: Array<{
          columnIndex: number;
          excelColumn: string;
          type: 'info' | 'period' | 'columns';
          periodId?: string;
          periodName?: string;
          columnId?: string;
          name: string;
          date?: string;
          points?: number;
          color?: string;
        }> = [];
        
        // Agregar columnas fijas izquierdas
        columnConfig.forEach(colsConfig => {
          headers.push(colName);
          columnMapping.push({
            columnIndex: currentColumnIndex,
            excelColumn: getExcelColumnName(currentColumnIndex + 1),
            type: 'fixed-left',
            name: colName
          });
          currentColumnIndex++;
        });
        
        // Agregar columnas de períodos ordenados
        const sortedPeriods = extendedConfig.periods.sort((a, b) => a.order - b.order);
        sortedPeriods.forEach(period => {
          const periodStartColumn = currentColumnIndex;
          
          period.columns.forEach((column) => {
            let headerName = column.header;
            if (column.date && column.date !== '01-ENE-24') {
              headerName += ` - ${column.date}`;
            }
            if (column.points && column.points !== 10) {
              headerName += ` (${column.points} pts)`;
            }
            headers.push(headerName);
            
            columnMapping.push({
              columnIndex: currentColumnIndex,
              excelColumn: getExcelColumnName(currentColumnIndex + 1),
              type: 'period',
              periodId: period.id,
              periodName: period.name,
              columnId: column.id,
              name: column.header,
              date: column.date,
              points: column.points,
              color: period.color
            });
            currentColumnIndex++;
          });
          
          // Actualizar el rango del período
          const periodEndColumn = currentColumnIndex - 1;
          const updatedPeriod = {
            ...period,
            rangeColumns: `${getExcelColumnName(periodStartColumn + 1)}1:${getExcelColumnName(periodEndColumn + 1)}1`
          };
          
          // Actualizar la configuración con el rango calculado
          setExtendedConfig(prev => ({
            ...prev,
            periods: prev.periods.map(p => p.id === period.id ? updatedPeriod : p)
          }));
        });
        
        // Agregar columnas fijas derechas
        extendedConfig.fixedColumnsRight.forEach(col => {
          let headerName = col.name;
          if (col.date) {
            headerName += ` - ${col.date}`;
          }
          if (col.points) {
            headerName += ` (${col.points} pts)`;
          }
          headers.push(headerName);
          
          columnMapping.push({
            columnIndex: currentColumnIndex,
            excelColumn: getExcelColumnName(currentColumnIndex + 1),
            type: 'fixed-right',
            name: col.name,
            date: col.date,
            points: col.points
          });
          currentColumnIndex++;
        });
        
        // Crear datos de ejemplo (5 estudiantes)
        const studentData: (string | number)[][] = [];
        studentData.push(headers); // Primera fila: headers
        
        // Agregar algunas filas de estudiantes de ejemplo
        for (let i = 1; i <= 5; i++) {
          const row: (string | number)[] = [];
          
          // Llenar columnas fijas izquierdas
          extendedConfig.fixedColumnsLeft.forEach((colName) => {
            switch (colName.toUpperCase()) {
              case 'ID':
                row.push(`EST${i.toString().padStart(3, '0')}`);
                break;
              case 'NOMBRE':
                row.push(`Estudiante${i}`);
                break;
              case 'APELLIDO':
                row.push(`Apellido${i}`);
                break;
              case 'CORREO.ELECTONICO':
              case 'CORREO ELECTONICO':
              case 'EMAIL':
                row.push(`estudiante${i}@universidad.edu`);
                break;
              default:
                row.push(`Dato${i}`);
            }
          });
          
          // Llenar columnas de períodos con valores en blanco
          sortedPeriods.forEach(period => {
            period.columns.forEach(() => {
              row.push(''); // Dejar en blanco para que el profesor llene las calificaciones
            });
          });
          
          // Llenar columnas fijas derechas con fórmulas o valores en blanco
          extendedConfig.fixedColumnsRight.forEach((col) => {
            if (col.name.includes('SUMA') || col.name.includes('TOTAL') || col.name.includes('CALIFICACION')) {
              row.push(''); // Dejar en blanco para fórmulas futuras
            } else {
              row.push(''); // Otros campos en blanco
            }
          });
          
          studentData.push(row);
        }
        
        // Crear worksheet de datos
        const wsData = XLSX.utils.aoa_to_sheet(studentData);
        XLSX.utils.book_append_sheet(wb, wsData, 'Calificaciones');
        
        // ==================== HOJA 2: CONFIGURACIÓN ====================
        
        const configData: (string | number)[][] = [];
        
        // Encabezados de la configuración
        configData.push([
          'CONFIGURACIÓN DEL SISTEMA DE CALIFICACIONES',
          '', '', '', '', '', ''
        ]);
        configData.push(['']); // Fila vacía
        
        // Información general
        configData.push(['Información General']);
        configData.push(['Fecha de creación:', new Date().toLocaleDateString()]);
        configData.push(['Total de columnas:', headers.length]);
        configData.push(['Total de períodos:', extendedConfig.periods.length]);
        configData.push(['']); // Fila vacía
        
        // Configuración de períodos
        configData.push(['CONFIGURACIÓN DE PERÍODOS']);
        configData.push([
          'ID Período', 'Nombre', 'Orden', 'Color', 'Num. Columnas', 'Rango Excel', 'Columna Inicio', 'Columna Fin'
        ]);
        
        sortedPeriods.forEach(period => {
          const startCol = columnMapping.find(c => c.periodId === period.id && c.type === 'period')?.excelColumn || '';
          const endCol = columnMapping.filter(c => c.periodId === period.id && c.type === 'period').pop()?.excelColumn || '';
          
          configData.push([
            period.id,
            period.name,
            period.order,
            period.color,
            period.numColumns,
            period.rangeColumns,
            startCol,
            endCol
          ]);
        });
        
        configData.push(['']); // Fila vacía
        
        // Detalle de columnas por período
        configData.push(['DETALLE DE ACTIVIDADES POR PERÍODO']);
        configData.push([
          'Período', 'Columna Excel', 'Nombre Actividad', 'Fecha', 'Puntos', 'Color Período'
        ]);
        
        sortedPeriods.forEach(period => {
          period.columns.forEach(column => {
            const mapping = columnMapping.find(c => c.columnId === column.id);
            configData.push([
              period.name,
              mapping?.excelColumn || '',
              column.header,
              column.date,
              column.points,
              period.color
            ]);
          });
        });
        
        configData.push(['']); // Fila vacía
        
        // Configuración de columnas fijas
        configData.push(['COLUMNAS FIJAS IZQUIERDAS']);
        configData.push(['Columna Excel', 'Nombre', 'Tipo']);
        
        extendedConfig.fixedColumnsLeft.forEach((col) => {
          const mapping = columnMapping.find(c => c.name === col && c.type === 'fixed-left');
          configData.push([
            mapping?.excelColumn || '',
            col,
            'Fija Izquierda'
          ]);
        });
        
        configData.push(['']); // Fila vacía
        
        configData.push(['COLUMNAS FIJAS DERECHAS']);
        configData.push(['Columna Excel', 'Nombre', 'Fecha', 'Puntos', 'Tipo']);
        
        extendedConfig.fixedColumnsRight.forEach(col => {
          const mapping = columnMapping.find(c => c.name === col.name && c.type === 'fixed-right');
          configData.push([
            mapping?.excelColumn || '',
            col.name,
            col.date || '',
            col.points || '',
            'Fija Derecha'
          ]);
        });
        
        configData.push(['']); // Fila vacía
        
        // Mapeo completo de columnas
        configData.push(['MAPEO COMPLETO DE COLUMNAS']);
        configData.push([
          'Índice', 'Columna Excel', 'Tipo', 'Nombre', 'Período', 'Fecha', 'Puntos', 'Color'
        ]);
        
        columnMapping.forEach(mapping => {
          configData.push([
            mapping.columnIndex + 1,
            mapping.excelColumn,
            mapping.type,
            mapping.name,
            mapping.periodName || '',
            mapping.date || '',
            mapping.points || '',
            mapping.color || ''
          ]);
        });
        
        configData.push(['']); // Fila vacía
        
        // Guardar configuración en formato JSON para fácil importación
        configData.push(['CONFIGURACIÓN JSON (Para importar)']);
        configData.push(['extendedConfig:', JSON.stringify(extendedConfig, null, 2)]);
        configData.push(['']);
        configData.push(['config:', JSON.stringify(config, null, 2)]);
        
        // Crear worksheet de configuración
        const wsConfig = XLSX.utils.aoa_to_sheet(configData);
        XLSX.utils.book_append_sheet(wb, wsConfig, 'Configuracion');
        
        // ==================== GENERAR ARCHIVO ====================
        
        // Generar el archivo
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Crear un File object
        const file = new File([blob], 'hoja_calificaciones_configurada.xlsx', { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleSave = async () => {
    // Validar configuración antes de proceder
    const validationErrors = validateConfiguration();
    if (validationErrors.length > 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error de validación',
        detail: 'Por favor corrige los errores antes de guardar',
        life: 5000
      });
      return;
    }

    try {
      // Guardar configuraciones en localStorage
      localStorage.setItem('columnConfig', JSON.stringify(config));
      localStorage.setItem('extendedColumnConfig', JSON.stringify(extendedConfig));
      
      toast.current?.show({
        severity: 'info',
        summary: 'Generando archivo',
        detail: 'Creando archivo Excel con datos y configuración completa...',
        life: 3000
      });

      // Generar archivo Excel con la configuración
      const excelFile = await generateExcelWithConfiguration();
      
      // Crear enlace para descargar el archivo
      const url = URL.createObjectURL(excelFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hoja_calificaciones_configurada.xlsx';
      
      // Simular click para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      URL.revokeObjectURL(url);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Archivo generado',
        detail: 'Excel con hoja de datos y configuración descargado. Cargándolo en el sistema...',
        life: 4000
      });

      // Simular el proceso de carga del archivo recién generado
      setTimeout(async () => {
        try {
          if (context?.loadExcelFromFile) {
            const excelData = await context.loadExcelFromFile(excelFile);
            localStorage.setItem('excelData', JSON.stringify(excelData));
            localStorage.setItem('fileRoute', 'true');
            
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
            
            setTimeout(() => {
              navigate('/cargar-hoja');
            }, 1000);
          }
        } catch (error) {
          console.error('Error al cargar el archivo generado:', error);
          toast.current?.show({
            severity: 'warn',
            summary: 'Archivo generado',
            detail: 'El archivo fue descargado pero debes cargarlo manualmente',
            life: 4000
          });
          
          setTimeout(() => {
            navigate('/cargar-hoja');
          }, 1000);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error al generar el archivo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el archivo Excel',
        life: 5000
      });
    }
  };

  const validateConfiguration = () => {
    const errors = [];
    
    // Validar que cada período tenga al menos una columna
    const periodsWithoutColumns = extendedConfig.periods.filter(p => p.numColumns < 1);
    if (periodsWithoutColumns.length > 0) {
      errors.push('Todos los períodos deben tener al menos una columna');
    }
    
    return errors;
  };

  const previewConfiguration = () => {
    const leftCols = extendedConfig.fixedColumnsLeft.map((col, idx) => ({
      name: col,
      position: getExcelColumnName(idx + 1),
      type: 'fixed-left',
      date: undefined,
      points: undefined,
      category: 'Fijas Izquierdas'
    }));

    let currentPosition = extendedConfig.fixedColumnsLeft.length + 1;
    const periodCols = extendedConfig.periods
      .sort((a, b) => a.order - b.order)
      .flatMap(period => 
        period.columns.map((column, idx) => ({
          name: column.header,
          position: getExcelColumnName(currentPosition + idx),
          type: period.id,
          periodName: period.name,
          date: column.date,
          points: column.points,
          category: 'Períodos'
        }))
      );

    // Actualizar currentPosition después de cada período
    currentPosition += extendedConfig.periods.reduce((sum, p) => sum + p.numColumns, 0);

    const rightCols = extendedConfig.fixedColumnsRight.map((col, idx) => ({
      name: col.name,
      position: getExcelColumnName(currentPosition + idx),
      type: 'fixed-right',
      date: col.date,
      points: col.points,
      category: 'Fijas Derechas'
    }));

    return [...leftCols, ...periodCols, ...rightCols];
  };

  const errors = validateConfiguration();
  const preview = previewConfiguration();

  // Determinar el título basado en si hay datos de Excel
  const getPageTitle = () => {
    const hasExcelData = localStorage.getItem('excelData');
    return hasExcelData ? 'Configuración de hoja de calificaciones' : 'Crear nueva hoja de calificaciones';
  };

  // Determinar botones de navegación
  const getNavigationButtons = () => {
    const hasExcelData = localStorage.getItem('excelData');
    
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

  // Determinar si hay datos de Excel para mostrar o no el Menu
  const hasExcelData = localStorage.getItem('excelData');

  // Contenido principal que se renderiza con o sin Menu
  const mainContent = (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="p-4 max-w-7xl w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <Button
              label="Recalcular rangos automáticamente"
              icon="pi pi-refresh"
              className="p-button-info text-white bg-blue-500 hover:bg-blue-800 p-2"
              onClick={recalculateRanges}
            />
          </div>
          <div className="flex gap-3">
            <Button
              label="Generar archivo Excel"
              icon="pi pi-download"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2"
              onClick={handleSave}
              disabled={errors.length > 0}
            />
            {getNavigationButtons()}
          </div>
        </div>

        {errors.length > 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="text-red-800">
              <h4 className="font-bold mb-2">Errores de Configuración:</h4>
              <ul className="list-disc list-inside">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}  className="p-0">
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
                {extendedConfig.periods
                  .sort((a, b) => a.order - b.order)
                  .map((period) => {
                    const isNew = newlyAdded.periods.has(period.id);
                    return (
                      <Card 
                        key={period.id} 
                        className={`border-l-4 transition-all duration-500 ${
                          isNew 
                            ? 'border-2 border-green-400 shadow-lg shadow-green-200 bg-green-50' 
                            : ''
                        }`} 
                        style={{ borderLeftColor: period.color }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: period.color }}
                            ></div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{period.name}</h3>
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
                          onClick={() => addColumnToGroup(period.id)}
                        />
                        {extendedConfig.periods.length > 1 && (
                          <Button
                            icon="pi pi-trash"
                            className="p-button-sm p-button-danger"
                            tooltip="Eliminar período"
                            onClick={() => removeColumnGroup(period.id)}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nombre del período</label>
                        <InputText 
                          value={period.name} 
                          onChange={(e) => updateColumnGroup(period.id, { name: e.target.value })} 
                          className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Número de columnas</label>
                        <InputNumber 
                          value={period.numColumns} 
                          onValueChange={(e) => updateColumnGroup(period.id, { numColumns: e.value || 1 })} 
                          className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                          min={1}
                          max={10}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <div className="flex gap-2 items-center">
                          <ColorPicker 
                            value={period.color.replace('#', '')} 
                            onChange={(e) => updateColumnGroup(period.id, { color: `#${e.value}` })} 
                          />
                          <InputText 
                            value={period.color} 
                            onChange={(e) => updateColumnGroup(period.id, { color: e.target.value })}
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
                        <span className="text-sm text-gray-500">{period.columns.length} columnas</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {period.columns.map((column, colIndex) => {
                          const isNewColumn = newlyAdded.columns.has(column.id);
                          return (
                            <div 
                              key={column.id} 
                              className={`flex gap-3 items-center p-3 rounded transition-all duration-500 ${
                                isNewColumn 
                                  ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                  : 'bg-gray-50'
                              }`}
                            >
                              <span className="text-sm font-medium w-8 text-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {getColumnPositionInGroup(period.id, colIndex)}
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
                                  value={column.header}
                                  onChange={(e) => updateColumnFromGroup(period.id, column.id, { header: e.target.value })}
                                  className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                  placeholder="Nombre de la actividad"
                                />
                              </div>
                            
                            <div className="w-32">
                              <label className="block text-xs text-gray-600 mb-1">Fecha</label>
                              <InputText
                                value={column.date}
                                onChange={(e) => updateColumnFromGroup(period.id, column.id, { date: e.target.value })}
                                className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                placeholder="DD-MMM-AA"
                              />
                            </div>
                            
                            <div className="w-20">
                              <label className="block text-xs text-gray-600 mb-1">Puntos</label>
                              <InputNumber
                                value={column.points}
                                onValueChange={(e) => updateColumnFromGroup(period.id, column.id, { points: e.value || 0 })}
                                className="w-20 text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                                min={0}
                                max={100}
                              />
                            </div>
                            
                            {period.columns.length > 1 && (
                              <Button
                                icon="pi pi-trash"
                                className="p-button-sm p-button-danger p-button-text"
                                tooltip="Eliminar columna"
                                onClick={() => removeColumnFromGroup(period.id, column.id)}
                              />
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                    );
                  })}
              </div>
            </Card>
          </TabPanel>

          <TabPanel header="Columnas Fijas" leftIcon="pi pi-table mr-2" className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-0">
              {/* Columnas Fijas Izquierdas */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Columnas Fijas Izquierdas</h4>
                  <Button
                    icon="pi pi-plus"
                    className="p-button-sm p-button-success"
                    onClick={() => addColumnToGroup(group.id)}
                    tooltip="Agregar columna"
                  />
                </div>
                <div className="space-y-2">
                  {extendedConfig.fixedColumnsLeft.map((column, index) => {
                    const isNewLeft = newlyAdded.fixedColumnsLeft.has(index);
                    return (
                      <div 
                        key={index} 
                        className={`flex gap-2 items-center p-2 rounded transition-all duration-500 ${
                          isNewLeft 
                            ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                            : 'bg-transparent'
                        }`}
                      >
                        <span className="text-sm text-gray-500 w-8">{getExcelColumnName(index + 1)}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <InputText
                            value={column}
                            onChange={e => updateColumnFromGroup(group.id, index, { label: e.target.value })}
                            className="flex-1 bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                          />
                          {isNewLeft && (
                            <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                              ¡NUEVA!
                            </span>
                          )}
                        </div>
                        <Button
                          icon="pi pi-trash"
                          className="p-button-sm p-button-danger p-button-text"
                          onClick={() => removeColumnFromGroup(group.id, index)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Columnas Fijas Derechas */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Columnas Fijas Derechas</h4>
                  <Button
                    icon="pi pi-plus"
                    className="p-button-sm p-button-success"
                    onClick={() => addColumnToGroup(group.id)}
                    tooltip="Agregar columna"
                  />
                </div>
                <div className="space-y-4">
                  {extendedConfig.fixedColumnsRight.map((column, index) => {
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
                            onClick={() => removeColumnFromGroup(group.id, index)}
                            tooltip="Eliminar columna"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Nombre *</label>
                            <InputText
                              value={column.name}
                              onChange={e => updateColumnFromGroup(group.id, index, { label: e.target.value })}
                              className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                              placeholder="Nombre de la columna"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Fecha (opcional)</label>
                            <InputText
                              value={column.date || ''}
                              onChange={e => updateColumnFromGroup(group.id, index, { date: e.target.value === '' ? undefined : e.target.value })}
                              className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-1"
                              placeholder="DD-MMM-AA"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Puntos (opcional)</label>
                            <InputNumber
                              value={column.points ?? null}
                              onValueChange={(e) => {
                                const newValue = e.value !== null && e.value !== undefined ? e.value : undefined;
                                updateColumnFromGroup(group.id, index, { points: newValue });
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
            </div>
          </TabPanel>

          <TabPanel header="Vista Previa" leftIcon="pi pi-eye mr-2">
            <Card className="p-0">
              <h4 className="font-bold mb-4">Vista Previa de la Estructura</h4>
              <div className="overflow-x-auto">
                <DataTable value={preview} className="text-sm">
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
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-600">
                    {extendedConfig.fixedColumnsLeft.length}
                  </div>
                  <div className="text-sm text-gray-600">Columnas Fijas Izq.</div>
                </div>
                
                <div className="text-center p-4 bg-indigo-50 rounded">
                  <div className="text-2xl font-bold text-indigo-600">
                    {extendedConfig.periods.reduce((sum, p) => sum + p.numColumns, 0)}
                  </div>
                  <div className="text-sm text-indigo-600">Columnas de Períodos</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-600">
                    {extendedConfig.fixedColumnsRight.length}
                  </div>
                  <div className="text-sm text-gray-600">Columnas Fijas Der.</div>
                </div>
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
              onClick={handleSave}
              disabled={errors.length > 0}
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
