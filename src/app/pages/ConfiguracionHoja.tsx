import Menu from '../common/Menu.tsx';
import { useRef, useState } from 'react';
import { useExcelContext } from '../common/contexts/ExcelContext.tsx';
import { ColumnExcelConfig, ColumnExcelData, ColumnGroupConfig, typeColumnsGroup, typePeriodGroup, TipoValor, tipoValorOptions, PreviewColumnInfo} from '../common/hooks/useExcelData.tsx';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { ColorPicker } from 'primereact/colorpicker';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { getSectionsColumnsConfig, validateDateFormat, formatDateFromExcel, recalculateConfigRanges, generateDefaultColumnConfig, validateFormulaComplete, updateFormulasAfterIdChange } from '../common/utils/clusterOfMethods.tsx';
import FormulaEditor from '../common/components/FormulaEditor.tsx';
import { translateToExcelFormula } from '../common/utils/excelFormulaTranslator.tsx';
import * as XLSX from 'xlsx';

const ConfiguracionHoja = () => {
  // References y hooks
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  
  // Intentar obtener datos del contexto si existen, pero no depender de ellos
  const context = useExcelContext();
  const excelData: ColumnExcelData[] = context?.excelData || [];

  // Determinar si hay datos de Excel para mostrar o no el Menu
  const hasExcelData: boolean = (excelData).length > 2;
  
  // Abstraer los datos de los estudiantes
  const studentsExcelData = excelData.length > 2 ? [...excelData].slice(2, excelData.length) : [];
  
  // Función para actualizar la configuración de los grupos de columnas
  // Maneja automáticamente la actualización de fórmulas cuando los IDs cambian
  const updatedColumnGroup = (colGroupConfig: ColumnGroupConfig[]): void => {
    // Guardar una copia de la configuración actual (antes de recalcular IDs)
    const oldConfig = JSON.parse(JSON.stringify(colGroupConfig)) as ColumnGroupConfig[];
    
    // Recalcular los IDs de las columnas (esto modifica colGroupConfig in-place)
    const newConfig = recalculateConfigRanges(colGroupConfig, null);
    
    // Actualizar las fórmulas para reflejar los nuevos IDs
    const configWithUpdatedFormulas = updateFormulasAfterIdChange(oldConfig, newConfig);
    
    // Actualizar el estado con la configuración final
    setConfig([...configWithUpdatedFormulas]);
  };

  /*
   * Variable de estado para la configuración de los grupos de columnas
   */
  // Usar configuración existente o valores por defecto
  const [columnConfig, setConfig] = useState<ColumnGroupConfig[]>(() => {
    // Si hay configuración en el contexto, usarla
    if (context?.columnConfig && context.columnConfig.length > 0) {
      return context.columnConfig;
    }
    // Si no hay configuración, generar la configuración por defecto
    return generateDefaultColumnConfig();
  });

  // Apuntador para manejar el tab Activo
  const [activeTab, setActiveTab] = useState(0);
  
  // Estados para el editor de fórmulas
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [currentEditingColumn, setCurrentEditingColumn] = useState<{groupId: string, columnId: string, currentFormula: string, currentLabel: string} | null>(null);
  
  /*
   * FUNCIONES PARA VALIDACIÓN DE FÓRMULAS
   */

  // Validar fórmula completa (sintaxis y tipos)
  // Ahora usa la función común del módulo clusterOfMethods
  const validateFormulaString = (formula: string): { isValid: boolean, error: string } => {
    return validateFormulaComplete(formula, groupPreviewConfig);
  };

  /*
   * FUNCIONES PARA EL EDITOR VISUAL DE FÓRMULAS
   */

  // Abrir el editor de fórmulas
  const openFormulaEditor = (groupId: string, columnId: string, currentFormula: string, currentLabel: string) => {
    setCurrentEditingColumn({ groupId, columnId, currentFormula, currentLabel });
    setShowFormulaEditor(true);
  };

  // Guardar la fórmula editada
  const handleSaveFormula = (formulaString: string) => {
    if (!currentEditingColumn) return;
    
    updateColumnFromGroup(
      currentEditingColumn.groupId, 
      currentEditingColumn.columnId, 
      { formula: formulaString }
    );
    
    setShowFormulaEditor(false);
    setCurrentEditingColumn(null);
    
    toast.current?.show({
      severity: 'success',
      summary: 'Fórmula guardada',
      detail: 'La fórmula se guardó correctamente',
      life: 2000
    });
  };

  // Cancelar edición de fórmula
  const handleCancelFormulaEdit = () => {
    setShowFormulaEditor(false);
    setCurrentEditingColumn(null);
  };
  
  /*
   * FUNCIONES DE APOYO A LA VISUALIZACIÓN
   */
  const groupSectionConfiguration = () => {
    // Tomar la configuración de secciones izquierda, centro y derecha
    const result = getSectionsColumnsConfig(columnConfig);
    return result;
  };
  
  const groupSectionConfig = groupSectionConfiguration();

  /*
   * FUNCIONES DE APOYO A LA VISUALIZACIÓN
   */
  const groupPreviewConfiguration = () => {
    const arrayTypeGroupConfig: Array<PreviewColumnInfo> = [];
    columnConfig.forEach(groupConfig => {
      // Se recorren las columnas que conforman al grupo
      groupConfig.columns.forEach(excelConfig => {
        arrayTypeGroupConfig.push({
          // Propiedades de la columna (ColumnExcelConfig)
          id: excelConfig.id,
          label: excelConfig.label || '',
          date: excelConfig.date || null,
          points: excelConfig.points,
          isEditable: excelConfig.isEditable || false,
          tipoValor: excelConfig.tipoValor || 'Texto',
          formula: excelConfig.formula || null,
          // Propiedades del grupo
          groupId: groupConfig.id,
          groupLabel: groupConfig.label,
          groupColor: groupConfig.color || '',
          groupType: groupConfig.type,
        });
      });
    });
    return arrayTypeGroupConfig;
  }
  
  const groupPreviewConfig = groupPreviewConfiguration();

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
      columns: [{
        id: ``,
        label: `Actividad`,
        date: null,
        points: null,
        isEditable: true,
        tipoValor: 'Número' as TipoValor,
        formula: null
      }],
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
      label: (typeGroup === typePeriodGroup)
        ? `Actividad`
        : `Columna`,
      date: null,
      points: null,
      isEditable: true,
      tipoValor: (typeGroup === typePeriodGroup) ? 'Número' as TipoValor : 'Texto' as TipoValor,
      formula: null,
      isNew: true
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
  // Función especializada para manejar actualizaciones de fecha
  // Formatos de entrada soportados:
  // - "27/08/21", "27-08-21" -> "27-AGO-21"
  // - "3/septiembre/21", "3-SEP-21" -> "03-SEP-21"  
  // - "05/dic/21", "5-12-21" -> "05-DIC-21"
  // - "27-agosto-2021" -> "27-AGO-21"
  // - Formato final esperado: DD-MMM-AA (ej: "27-AGO-21")
  const updateColumnDate = (groupId: string, columnId: string, newDate: string) => {
    const formattedDate = formatDateFromExcel(newDate);
    
    // Solo validar el formato final si hay contenido completo
    if (formattedDate && formattedDate.length >= 9 && !validateDateFormat(formattedDate)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Formato de fecha incorrecto',
        detail: 'Use el formato DD-MMM-AA (ej: 27-AGO-21)',
        life: 3000
      });
      return;
    }
    
    updateColumnFromGroup(groupId, columnId, { date: formattedDate });
  };

  // Función para actualizar una columna específica dentro de un grupo
  const updateColumnFromGroup = (groupId: string, columnId: string, updates: { label?: string; date?: string; points?: number; isEditable?: boolean; tipoValor?: TipoValor, formula?: string }) => {
      // Si se está actualizando el label, validar y actualizar fórmulas
      if (updates.label !== undefined) {
        // Obtener el label anterior
        const newLabel = updates.label;
        // Validar que un label sea único
        const isLabelUnique = ((label: string, currentGroupId: string, currentColumnId: string): boolean => {
            if (!label || label.trim() === '')
              return true;
            let count = 0;
            columnConfig.forEach(group => {
              group.columns.forEach(col => {
                if (col.label === label) {
                  // Si es la misma columna que estamos editando, no contar
                  if (group.id === currentGroupId && col.id === currentColumnId) {
                    return;
                  }
                  count++;
                }
              });
            });
            return count === 0;
          })(newLabel, groupId, columnId);
        // Validar unicidad del nuevo label
        if (newLabel && newLabel.trim() !== '' && !isLabelUnique) {
          toast.current?.show({
            severity: 'warn',
            summary: 'Label duplicado',
            detail: `Ya existe otra columna con el nombre "${newLabel}". Se recomienda usar nombres únicos para evitar confusión en las fórmulas.`,
            life: 5000
          });
        }
      }
      
      const updatedConfig = columnConfig.map(group => {
        if (group.id === groupId) {
          const updatedColumns = group.columns.map(column =>
            column.id === columnId ? { ...column, ...updates } : column
          );
          return { ...group, columns: updatedColumns };
        }
        return group;
      });
      setConfig(updatedConfig);
  };

  /*
   * FUNCIONES PARA TRATAR CON EL ARCHIVO DE EXCEL
   */
  
  // Función para validar la configuración completa
  const validateConfiguration = (): boolean => {
    // Validar que existan períodos
    const periodGroups = columnConfig.filter(g => g.type === typePeriodGroup);
    if (periodGroups.length === 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error de validación',
        detail: 'Debe existir al menos un período',
        life: 5000
      });
      return false;
    }

    // Validar que cada grupo tenga al menos una columna
    for (const group of columnConfig) {
      if (group.columns.length === 0) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error de validación',
          detail: `El grupo "${group.label}" debe tener al menos una columna`,
          life: 5000
        });
        return false;
      }

      // Validar que todas las columnas tengan nombre
      for (const column of group.columns) {
        if (!column.label || column.label.trim() === '') {
          toast.current?.show({
            severity: 'error',
            summary: 'Error de validación',
            detail: `Todas las columnas deben tener un nombre válido`,
            life: 5000
          });
          return false;
        }
      }
    }

    return true;
  };
  
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
              (excelConfig.points == 0 || (excelConfig.points && (excelConfig.points > 0)))
                ? excelConfig.points
                : '');
            // Se crear un arreglo con los nombres de las columnas
            arrayHeaderFields.push(excelConfig.label || '');
          });
        });

        if (studentsExcelData && (studentsExcelData.length > 0) && (arrayHeaderFields.length > 0)) {
          studentsExcelData.forEach((rowData, studentIndex) => {
            // Se inserta una nueva fila
            matrixExcelData.push([]);
            const lastIndex = matrixExcelData.length - 1;
            // Número de fila real en Excel (fila 1 = headers, fila 2 = dates, fila 3 = points, fila 4+ = students)
            const excelRowNumber = studentIndex + 4; // +4 porque las filas 1,2,3 son headers/dates/points
            
            // Se recorre cada columna para agregar los datos
            arrayHeaderFields.forEach((headerField) => {
              matrixExcelData[lastIndex].push(rowData[headerField] || '');
            });
          });
        }

        // Convertir a worksheet
        const wsData = XLSX.utils.aoa_to_sheet(matrixExcelData);
        
        // PASO CRÍTICO: Reemplazar valores por fórmulas Excel en columnas calculadas
        if (studentsExcelData && studentsExcelData.length > 0) {
          studentsExcelData.forEach((_rowData, studentIndex) => {
            const excelRowNumber = studentIndex + 4; // Fila real en Excel
            
            // Buscar columnas con fórmulas en la configuración
            columnConfig.forEach(group => {
              group.columns.forEach(col => {
                // Si la columna tiene fórmula Y no es editable = columna calculada
                if (col.formula && col.formula.trim() !== '' && col.isEditable === false && col.id) {
                  // Traducir fórmula personalizada → fórmula Excel
                  const excelFormula = translateToExcelFormula(
                    col.formula,
                    excelRowNumber,
                    columnConfig
                  );
                  
                  // Escribir la fórmula en la celda (formato: columna + fila, ej: "J4")
                  const cellAddress = `${col.id}${excelRowNumber}`;
                  
                  if (wsData[cellAddress]) {
                    // Reemplazar el valor por la fórmula
                    // XLSX usa la propiedad 'f' para fórmulas (sin el '=')
                    wsData[cellAddress] = {
                      f: excelFormula.startsWith('=') ? excelFormula.substring(1) : excelFormula,
                      t: 'n' // Tipo numérico
                    };
                  }
                }
              });
            });
          });
        }

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
              '', '', '', 'Columna', 'Fecha', 'Puntos', 'Editable', 'Formula'
            ]);
            matrixConfigData.push([
              '', '', '', excelConfig.id,
              (excelConfig.date || ''),
              ((excelConfig.points == 0 || excelConfig.points)
                  ? excelConfig.points
                  : ''),
              (excelConfig.isEditable !== undefined ? (excelConfig.isEditable ? 'SI' : 'NO') : 'SI'),
              (excelConfig.formula || '')
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
    // Ejecutar validación completa
    if (!validateConfiguration()) {
      return;
    }

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

    // Validar que exista al menos un período
    const periodGroups = columnConfig.filter(g => g.type === typePeriodGroup);
    if (periodGroups.length === 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error de validación',
        detail: 'Debe existir al menos un período',
        life: 5000
      });
      return;
    }

    // NUEVA VALIDACIÓN: Validar todas las fórmulas
    const invalidFormulas: Array<{column: string, error: string}> = [];
    columnConfig.forEach(group => {
      group.columns.forEach(col => {
        if (col.formula && col.formula.trim() !== '' && !col.isEditable) {
          const validation = validateFormulaString(col.formula);
          if (!validation.isValid) {
            invalidFormulas.push({
              column: col.label,
              error: validation.error
            });
          }
        }
      });
    });

    if (invalidFormulas.length > 0) {
      const errorDetails = invalidFormulas.map(f => `• ${f.column}: ${f.error}`).join('\n');
      toast.current?.show({
        severity: 'error',
        summary: 'Fórmulas inválidas detectadas',
        detail: `Se encontraron ${invalidFormulas.length} fórmula(s) con errores. Por favor, corrígelas antes de guardar.`,
        life: 8000
      });
      
      // Mostrar un toast adicional con los detalles (si son pocas)
      if (invalidFormulas.length <= 3) {
        setTimeout(() => {
          toast.current?.show({
            severity: 'warn',
            summary: 'Detalles de errores',
            detail: errorDetails,
            life: 10000
          });
        }, 500);
      }
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
            await context.loadExcelFromFile(excelFile);
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
          className="p-button-secondary text-white bg-gray-500 hover:bg-gray-800 p-2 w-full sm:w-auto text-sm sm:text-base"
        />
      );
    } else {
      return (
        <Button 
          label="Volver a carga de archivos" 
          icon="pi pi-arrow-left"
          onClick={() => navigate('/cargar-hoja')}
          className="p-button-secondary text-white bg-red-500 hover:bg-red-800 p-2 w-full sm:w-auto text-sm sm:text-base"
        />
      );
    }
  };

  // Contenido principal que se renderiza con o sin Menu
  const mainContent = (
    <>
      <ConfirmDialog />
      <Toast ref={toast} />
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl w-full">

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex">
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              label="Generar archivo Excel"
              icon="pi pi-download"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2 w-full sm:w-auto text-sm sm:text-base"
              onClick={saveExcelFileConfiguration}
            />
            {getNavigationButtons()}
          </div>
        </div>

        {/* Tabs de configuración */}
        <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}  className="p-0">
          
          {/* 1. Panel de Columnas Centrales */}
          <TabPanel header="Períodos" leftIcon="pi pi-calendar mr-2" className="p-0">
            <Card className="mb-6 p-0">
              {/* Titulo de sección y, control para agregar un nuevo Grupo de Columnas */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h4 className="font-bold text-lg sm:text-xl">Configuración de Períodos</h4>
                <Button
                  label="Agregar Período"
                  icon="pi pi-plus"
                  className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2 w-full sm:w-auto text-sm"
                  onClick={() => addColumnGroup(typePeriodGroup)}
                />
              </div>
              {/* Grupos de Columnas */}
              <div className="grid grid-cols-1 gap-6">
                {groupSectionConfig.center.map((groupConfig) => {
                  const isNewGroup = groupConfig.isNew;
                  return (
                    <Card 
                      key={groupConfig.id} 
                      className={`border-l-4 transition-all duration-500 ${
                        isNewGroup
                          ? 'border-2 border-green-400 shadow-lg shadow-green-200 bg-green-50' 
                          : ''
                      }`}
                      style={{ borderLeftColor: groupConfig.color }}
                    >
                      {/* Controles para agregar columnas al Grupo, o eliminar al Grupo */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded border flex-shrink-0"
                            style={{ backgroundColor: groupConfig.color }}
                          ></div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg truncate">{groupConfig.label}</h3>
                            {isNewGroup && (
                              <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full animate-pulse self-start">
                                ¡NUEVO!
                              </span>
                            )}
                          </div>
                        </div>
                    
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            tooltip="Agregar columna"
                            className="p-button-sm p-button-success text-white bg-green-500 hover:bg-green-800 p-2 flex-1 sm:flex-initial"
                            icon="pi pi-plus"
                            onClick={() => addColumnToGroup(groupConfig.id, typePeriodGroup)}
                          />
                          {columnConfig.filter(g => g.type === typePeriodGroup).length > 1 && (
                            <Button
                              tooltip="Eliminar período"
                              className="p-button-sm p-button-danger text-white bg-red-500 hover:bg-red-800 p-2 flex-1 sm:flex-initial"
                              icon="pi pi-trash"
                              onClick={() => removeColumnGroup(groupConfig.id)}
                            />
                          )}
                        </div>
                      </div>
                  
                      {/* Titulo y color del Grupo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-sm font-medium mb-1">Nombre del período</label>
                          <InputText 
                            value={groupConfig.label} 
                            onChange={(e) => updateColumnGroup(groupConfig.id, { label: e.target.value })} 
                            className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
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
                              className="flex-1 bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      </div>
      
                      {/* Columnas de la Grupo */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium">Columnas del Período</h5>
                          <span className="text-sm text-gray-500">{groupConfig.columns.length} columnas</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {groupConfig.columns.map((excelConfig) => {
                            const isNewColumn = excelConfig.isNew;
                            return (
                              <div 
                                key={excelConfig.id} 
                                className={`p-3 rounded transition-all duration-500 ${
                                  isNewColumn 
                                    ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                    : 'bg-gray-50'
                                }`}
                              >
                                {/* Header con ID y badge de nueva columna */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {excelConfig.id}
                                    </span>
                                    {isNewColumn && (
                                      <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                                        ¡NUEVA!
                                      </span>
                                    )}
                                  </div>
                                  {groupConfig.columns.length > 1 && (
                                    <Button
                                      icon="pi pi-trash"
                                      className="p-button-sm p-button-danger text-white bg-red-500 hover:bg-red-800 p-1"
                                      tooltip="Eliminar columna"
                                      onClick={() => removeColumnFromGroup(groupConfig.id, excelConfig.id)}
                                    />
                                  )}
                                </div>

                                {/* Campos en grid responsivo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="sm:col-span-2 lg:col-span-1">
                                    <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                                    <InputText
                                      value={excelConfig.label}
                                      onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { label: e.target.value })}
                                      className="w-full text-sm bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                                      placeholder="Nombre de la actividad"
                                    />
                                  </div>
                                
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Fecha</label>
                                    <div className="relative">
                                      <InputText
                                        value={excelConfig.date || ''}
                                        onChange={(e) => updateColumnDate(groupConfig.id, excelConfig.id, e.target.value)}
                                        className={`w-full text-sm bg-white rounded border focus:ring-2 p-2 pr-8 ${
                                          excelConfig.date 
                                            ? validateDateFormat(excelConfig.date)
                                              ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                              : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                                        }`}
                                        placeholder="27-AGO-21"
                                        maxLength={15}
                                        tooltip="Formatos válidos: 27-AGO-21, 27/08/21, 27 agosto 21, 27ago21. Se formateará automáticamente."
                                      />
                                      {excelConfig.date && (
                                        <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                          validateDateFormat(excelConfig.date) ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                          {validateDateFormat(excelConfig.date) ? '✓' : '⚠'}
                                        </span>
                                      )}
                                    </div>
                                    {excelConfig.date && !validateDateFormat(excelConfig.date) && (
                                      <small className="text-red-500 text-xs mt-1 block">
                                        Formato esperado: DD-MMM-AA (ej: 27-AGO-21)
                                      </small>
                                    )}
                                    {excelConfig.date && validateDateFormat(excelConfig.date) && (
                                      <small className="text-green-600 text-xs mt-1 block">
                                        ✓ Formato correcto
                                      </small>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Puntos</label>
                                    <InputNumber
                                      value={excelConfig.points}
                                      onValueChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { points: e.value || 0 })}
                                      className="w-full"
                                      inputClassName="w-full text-right bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                                      min={0}
                                      max={100}
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Tipo de Valor</label>
                                    <Dropdown
                                      value={excelConfig.tipoValor || 'Texto'}
                                      options={tipoValorOptions}
                                      onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { tipoValor: e.value as TipoValor })}
                                      className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      placeholder="Seleccionar tipo"
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-center">
                                    <div className="text-center">
                                      <label className="block text-xs text-gray-600 mb-1">Editable</label>
                                      <Checkbox
                                        checked={excelConfig.isEditable ?? true}
                                        onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { isEditable: e.checked })}
                                        className="mt-1 rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        tooltip="Permite editar esta columna en el catálogo de alumnos"
                                      />
                                    </div>
                                  </div>

                                  
                                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                                    <label className="block text-xs text-gray-600 mb-1">
                                      Fórmula
                                      {!excelConfig.isEditable && (
                                        <span className="ml-2 text-blue-600 text-xs">
                                          ✨ Editor visual disponible
                                        </span>
                                      )}
                                    </label>
                                    <div className="flex gap-2">
                                      <div className="flex-1 relative">
                                        <InputText
                                          value={excelConfig.formula || ''}
                                          onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { formula: e.target.value })}
                                          onBlur={(e) => {
                                            const formula = e.target.value;
                                            if (formula && formula.trim() !== '' && !excelConfig.isEditable) {
                                              const validation = validateFormulaString(formula);
                                              if (!validation.isValid) {
                                                toast.current?.show({
                                                  severity: 'warn',
                                                  summary: `Error en fórmula de "${excelConfig.label}"`,
                                                  detail: validation.error,
                                                  life: 5000
                                                });
                                              }
                                            }
                                          }}
                                          className={`w-full text-sm bg-white rounded border p-2 pr-8 ${
                                            excelConfig.isEditable 
                                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                              : excelConfig.formula
                                                ? validateFormulaString(excelConfig.formula).isValid
                                                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                                  : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                          }`}
                                          disabled={excelConfig.isEditable === true}
                                          placeholder={excelConfig.isEditable ? 'Desmarque "Editable" para usar fórmula' : 'Ej: [Actividad 1] + [Actividad 2] / 2'}
                                          maxLength={200}
                                        />
                                        {!excelConfig.isEditable && excelConfig.formula && (
                                          <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                            validateFormulaString(excelConfig.formula).isValid ? 'text-green-500' : 'text-red-500'
                                          }`}>
                                            {validateFormulaString(excelConfig.formula).isValid ? '✓' : '⚠'}
                                          </span>
                                        )}
                                      </div>
                                      {!excelConfig.isEditable && (
                                        <Button
                                          icon="pi pi-pencil"
                                          className="p-button-sm bg-blue-500 hover:bg-blue-700 text-white"
                                          tooltip="Abrir editor visual de fórmulas"
                                          onClick={() => openFormulaEditor(groupConfig.id, excelConfig.id, excelConfig.formula || '', excelConfig.label)}
                                        />
                                      )}
                                    </div>
                                    {!excelConfig.isEditable && excelConfig.formula && (
                                      <>
                                        {validateFormulaString(excelConfig.formula).isValid ? (
                                          <small className="text-green-600 text-xs block mt-1">
                                            ✓ Fórmula válida: {excelConfig.formula}
                                          </small>
                                        ) : (
                                          <small className="text-red-600 text-xs block mt-1">
                                            ⚠ {validateFormulaString(excelConfig.formula).error}
                                          </small>
                                        )}
                                      </>
                                    )}
                                  </div>

                                </div>
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

          {/* 2. Panel de Columnas Fijas */}
          <TabPanel header="Fijas" leftIcon="pi pi-table mr-2" className="p-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-0">
              
              {/* Grupo de Columnas Fijas Izquierdas */}
              {groupSectionConfig.left.length > 0 && (
                groupSectionConfig.left.map((groupConfig) =>
                  <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                      <h4 className="font-bold text-lg">Columnas Fijas Izquierdas</h4>
                      <Button
                        icon="pi pi-plus"
                        className="p-button-sm p-button-success text-white bg-green-500 hover:bg-green-800 p-2 w-full sm:w-auto"
                        onClick={() => addColumnToGroup(groupConfig.id || '', typeColumnsGroup)}
                        tooltip="Agregar columna"
                      />
                    </div>
                    <div className="space-y-2">
                      {groupConfig.columns.map((excelConfig) => (
                        <div 
                          key={`${groupConfig.id}-${excelConfig.id}`}
                          className={`p-3 rounded transition-all duration-500 ${
                              excelConfig.isNew 
                                ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                : 'bg-gray-50'
                            }`}
                        >
                          {/* Header con ID y controles */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {excelConfig.id}
                              </span>
                              {excelConfig.isNew && (
                                <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                                  ¡NUEVA!
                                </span>
                              )}
                            </div>
                            {groupConfig.columns.length > 1 && (
                              <Button
                                icon="pi pi-trash"
                                className="p-button-sm p-button-danger text-white bg-red-500 hover:bg-red-800 p-1"
                                onClick={() => removeColumnFromGroup(groupConfig.id, excelConfig.id)}
                                tooltip="Eliminar columna"
                              />
                            )}
                          </div>

                          {/* Campos en grid responsivo */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                              <InputText
                                value={excelConfig.label}
                                onChange={e => updateColumnFromGroup(groupConfig.id, excelConfig.id, { label: e.target.value })}
                                className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Tipo de Valor</label>
                              <Dropdown
                                value={excelConfig.tipoValor || 'Texto'}
                                options={tipoValorOptions}
                                onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { tipoValor: e.value as TipoValor })}
                                className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Seleccionar tipo"
                              />
                            </div>
                            
                            
                            <div className="flex items-center justify-center">
                              <div className="text-center">
                                <label className="block text-xs text-gray-600 mb-1">Editable</label>
                                <Checkbox
                                  checked={excelConfig.isEditable ?? true}
                                  onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { isEditable: e.checked })}
                                  className="mt-1 rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  tooltip="Permite editar esta columna en el catálogo de alumnos"
                                />
                              </div>
                            </div>
                            
                            <div className="col-span-1 sm:col-span-4 lg:col-span-3">
                              <label className="block text-xs text-gray-600 mb-1">
                                Fórmula
                                {!excelConfig.isEditable && (
                                  <span className="ml-2 text-blue-600 text-xs">
                                    ✨ Editor visual disponible
                                  </span>
                                )}
                              </label>
                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <InputText
                                    value={excelConfig.formula || ''}
                                    onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { formula: e.target.value })}
                                    onBlur={(e) => {
                                      const formula = e.target.value;
                                      if (formula && formula.trim() !== '' && !excelConfig.isEditable) {
                                        const validation = validateFormulaString(formula);
                                        if (!validation.isValid) {
                                          toast.current?.show({
                                            severity: 'warn',
                                            summary: `Error en fórmula de "${excelConfig.label}"`,
                                            detail: validation.error,
                                            life: 5000
                                          });
                                        }
                                      }
                                    }}
                                    className={`w-full text-sm bg-white rounded border p-2 pr-8 ${
                                      excelConfig.isEditable 
                                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                        : excelConfig.formula
                                          ? validateFormulaString(excelConfig.formula).isValid
                                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                            : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                                    disabled={excelConfig.isEditable === true}
                                    placeholder={excelConfig.isEditable ? 'Desmarque "Editable" para usar fórmula' : 'Ej: [Columna A] + [Columna B]'}
                                    maxLength={200}
                                  />
                                  {!excelConfig.isEditable && excelConfig.formula && (
                                    <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                      validateFormulaString(excelConfig.formula).isValid ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                      {validateFormulaString(excelConfig.formula).isValid ? '✓' : '⚠'}
                                    </span>
                                  )}
                                </div>
                                {!excelConfig.isEditable && (
                                  <Button
                                    icon="pi pi-pencil"
                                    className="p-button-sm bg-blue-500 hover:bg-blue-700 text-white"
                                    tooltip="Abrir editor visual de fórmulas"
                                    onClick={() => openFormulaEditor(groupConfig.id, excelConfig.id, excelConfig.formula || '', excelConfig.label)}
                                  />
                                )}
                              </div>
                              {!excelConfig.isEditable && excelConfig.formula && (
                                <>
                                  {validateFormulaString(excelConfig.formula).isValid ? (
                                    <small className="text-green-600 text-xs block mt-1">
                                      ✓ Fórmula válida: {excelConfig.formula}
                                    </small>
                                  ) : (
                                    <small className="text-red-600 text-xs block mt-1">
                                      ⚠ {validateFormulaString(excelConfig.formula).error}
                                    </small>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}

              {/* Grupo de Columnas Fijas Derechas */}
              {groupSectionConfig.right.length > 0 && (
                groupSectionConfig.right.map((groupConfig) =>
                  <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                      <h4 className="font-bold text-lg">Columnas Fijas Derechas</h4>
                      <Button
                        icon="pi pi-plus"
                        className="p-button-sm p-button-success text-white bg-green-500 hover:bg-green-800 p-2 w-full sm:w-auto"
                        onClick={() => addColumnToGroup(groupConfig.id || '', typeColumnsGroup)}
                        tooltip="Agregar columna"
                      />
                    </div>
                    <div className="space-y-2">
                      {groupConfig.columns.map((excelConfig) => (
                          <div 
                            key={`${groupConfig.id}-${excelConfig.id}`}
                            className={`p-3 rounded transition-all duration-500 ${
                              excelConfig.isNew 
                                ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                : 'bg-gray-50'
                            }`}
                          >
                            {/* Header con ID y controles */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {excelConfig.id}
                                </span>
                                {excelConfig.isNew && (
                                  <span className="px-1.5 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded animate-pulse">
                                    ¡NUEVA!
                                  </span>
                                )}
                              </div>
                              {groupConfig.columns.length > 1 && (
                                <Button
                                  icon="pi pi-trash"
                                  className="p-button-sm p-button-danger text-white bg-red-500 hover:bg-red-800 p-1"
                                  onClick={() => removeColumnFromGroup(groupConfig.id, excelConfig.id)}
                                  tooltip="Eliminar columna"
                                />
                              )}
                            </div>

                            {/* Campos en grid responsivo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                                <InputText
                                  value={excelConfig.label}
                                  onChange={e => updateColumnFromGroup(groupConfig.id, excelConfig.id, { label: e.target.value })}
                                  className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                                />
                              </div>
                              
                              {groupConfig.type == typeColumnsGroup && (
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Puntos</label>
                                  <InputNumber
                                    value={excelConfig.points}
                                    onValueChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { points: e.value || 0 })}
                                    className="w-full"
                                    inputClassName="w-full text-right bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                                    min={0}
                                    max={100}
                                  />
                                </div>
                              )}
                              
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Tipo de Valor</label>
                                <Dropdown
                                  value={excelConfig.tipoValor || 'texto'}
                                  options={tipoValorOptions}
                                  onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { tipoValor: e.value as TipoValor })}
                                  className="w-full bg-white rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Seleccionar tipo"
                                />
                              </div>
                              
                              <div className="flex items-center justify-center">
                                <div className="text-center">
                                  <label className="block text-xs text-gray-600 mb-1">Editable</label>
                                  <Checkbox
                                    checked={excelConfig.isEditable ?? true}
                                    onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { isEditable: e.checked })}
                                    className="mt-1 rounded border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    tooltip="Permite editar esta columna en el catálogo de alumnos"
                                  />
                                </div>
                              </div>
                              
                              <div className="col-span-1 sm:col-span-2 lg:col-span-3 ">
                                <label className="block text-xs text-gray-600 mb-1">
                                  Fórmula
                                  {!excelConfig.isEditable && (
                                    <span className="ml-2 text-blue-600 text-xs">
                                      ✨ Editor visual disponible
                                    </span>
                                  )}
                                </label>
                                <div className="flex gap-2">
                                  <div className="flex-1 relative">
                                    <InputText
                                      value={excelConfig.formula || ''}
                                      onChange={(e) => updateColumnFromGroup(groupConfig.id, excelConfig.id, { formula: e.target.value })}
                                      onBlur={(e) => {
                                        const formula = e.target.value;
                                        if (formula && formula.trim() !== '' && !excelConfig.isEditable) {
                                          const validation = validateFormulaString(formula);
                                          if (!validation.isValid) {
                                            toast.current?.show({
                                              severity: 'warn',
                                              summary: `Error en fórmula de "${excelConfig.label}"`,
                                              detail: validation.error,
                                              life: 5000
                                            });
                                          }
                                        }
                                      }}
                                      className={`w-full text-sm bg-white rounded border p-2 pr-8 ${
                                        excelConfig.isEditable 
                                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                          : excelConfig.formula
                                            ? validateFormulaString(excelConfig.formula).isValid
                                              ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                              : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                      }`}
                                      disabled={excelConfig.isEditable === true}
                                      placeholder={excelConfig.isEditable ? 'Desmarque "Editable" para usar fórmula' : 'Ej: ([Parcial 1] + [Parcial 2]) / 2'}
                                      maxLength={200}
                                    />
                                    {!excelConfig.isEditable && excelConfig.formula && (
                                      <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                        validateFormulaString(excelConfig.formula).isValid ? 'text-green-500' : 'text-red-500'
                                      }`}>
                                        {validateFormulaString(excelConfig.formula).isValid ? '✓' : '⚠'}
                                      </span>
                                    )}
                                  </div>
                                  {!excelConfig.isEditable && (
                                    <Button
                                      icon="pi pi-pencil"
                                      className="p-button-sm bg-blue-500 hover:bg-blue-700 text-white"
                                      tooltip="Abrir editor visual de fórmulas"
                                      onClick={() => openFormulaEditor(groupConfig.id, excelConfig.id, excelConfig.formula || '', excelConfig.label)}
                                    />
                                  )}
                                </div>
                                {!excelConfig.isEditable && excelConfig.formula && (
                                  <>
                                    {validateFormulaString(excelConfig.formula).isValid ? (
                                      <small className="text-green-600 text-xs block mt-1">
                                        ✓ Fórmula válida: {excelConfig.formula}
                                      </small>
                                    ) : (
                                      <small className="text-red-600 text-xs block mt-1">
                                        ⚠ {validateFormulaString(excelConfig.formula).error}
                                      </small>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </Card>
                )
              )}

            </div>
          </TabPanel>

          {/* 3. Panel con Vista Previa */}
          <TabPanel header="Vista Previa" leftIcon="pi pi-eye mr-2">
            <Card className="p-0">
              <h4 className="font-bold mb-4">Vista Previa de la Estructura</h4>
              <div className="overflow-x-auto">
                <DataTable value={groupPreviewConfig} className="text-sm">
                  <Column
                    field="position"
                    header="Posición Excel"
                    style={{ width: '100px', textAlign: 'center' }}
                    body={(rowData) => (
                      <div className="flex items-center justify-end gap-2">
                        <div 
                          className="w-full h-8 rounded border"
                          style={{ backgroundColor: rowData.color }}
                        ></div>
                        <span className={`px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800`}>
                          {rowData.position || '-'}
                        </span>
                      </div>
                    )}
                  />
                  <Column field="name" header="Nombre de Columna" style={{ width: '200px' }} />
                  <Column 
                    field="date" 
                    header="Fecha" 
                    style={{ width: '120px', textAlign: 'center' }}
                    body={(rowData) => (
                      <span className="text-xs text-gray-600">
                        {rowData.date || '-'}
                      </span>
                    )}
                  />
                  <Column 
                    field="points" 
                    header="Puntos" 
                    style={{ width: '80px', textAlign: 'right' }}
                    body={(rowData) => (
                      <span className="text-xs text-gray-600">
                        {rowData.points !== undefined ? rowData.points : '-'}
                      </span>
                    )}
                  />
                  <Column 
                    field="category" 
                    header="Categoría" 
                    style={{ width: '120px', textAlign: 'center' }}
                    body={(rowData) => (
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800`}>
                        { (rowData.category || '').toUpperCase() }
                      </span>
                    )}
                  />
                  <Column 
                    field="tipoValor" 
                    header="Tipo Valor" 
                    style={{ width: '100px', textAlign: 'center' }}
                    body={(rowData) => (
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800`}>
                        {(rowData.tipoValor || 'texto').toUpperCase()}
                      </span>
                    )}
                  />
                  <Column 
                    field="formula" 
                    header="Fórmula" 
                    style={{ width: '120px', textAlign: 'center' }}
                    body={(rowData) => (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rowData.formula ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rowData.formula ? rowData.formula.toUpperCase() : 'NINGUNA'}
                      </span>
                    )}
                  />
                  <Column 
                    field="editable" 
                    header="Editable" 
                    style={{ width: '80px', textAlign: 'center' }}
                    body={(rowData) => (
                      <div className="flex justify-center">
                        <Checkbox
                          checked={rowData.editable}
                          disabled={true}
                          className="cursor-not-allowed"
                        />
                      </div>
                    )}
                  />
                  <Column 
                    field="detail" 
                    header="Detalle" 
                    body={(rowData) => (
                      <span className="text-xs text-gray-500">
                        {rowData.detail || '-'}
                      </span>
                    )}
                  />
                </DataTable>
              </div>
            </Card>
          </TabPanel>

          {/* 4. Panel de Ayuda para Fórmulas */}
          <TabPanel header="Ayuda de Fórmulas" leftIcon="pi pi-question-circle mr-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card de Información General */}
              <Card className="bg-blue-50 border-l-4 border-blue-500">
                <h4 className="font-bold text-lg mb-3 text-blue-800">📝 ¿Cómo escribir fórmulas?</h4>
                <div className="space-y-3 text-sm">
                  <p>Las fórmulas permiten calcular valores automáticamente basándose en otras columnas.</p>
                  
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold mb-2">Sintaxis básica:</p>
                    <code className="text-blue-700 bg-blue-100 px-2 py-1 rounded block">
                      [Nombre de Columna] + [Otra Columna] / 2
                    </code>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                    <p className="font-semibold text-yellow-800">⚠️ Importante:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Use nombres de columnas entre <code className="bg-yellow-200 px-1">[corchetes]</code></li>
                      <li>Los nombres deben coincidir exactamente</li>
                      <li>Se recomienda usar nombres únicos para evitar confusiones</li>
                      <li>La columna debe estar marcada como NO editable</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Card de Ejemplos */}
              <Card className="bg-green-50 border-l-4 border-green-500">
                <h4 className="font-bold text-lg mb-3 text-green-800">✨ Ejemplos de Fórmulas</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold text-gray-700">Promedio simple:</p>
                    <code className="text-green-700 bg-green-100 px-2 py-1 rounded block mt-1">
                      ([Parcial 1] + [Parcial 2]) / 2
                    </code>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold text-gray-700">Suma de actividades:</p>
                    <code className="text-green-700 bg-green-100 px-2 py-1 rounded block mt-1">
                      [Actividad 1] + [Actividad 2] + [Actividad 3]
                    </code>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold text-gray-700">Promedio ponderado:</p>
                    <code className="text-green-700 bg-green-100 px-2 py-1 rounded block mt-1">
                      ([Parcial 1] * 0.4) + ([Parcial 2] * 0.6)
                    </code>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <p className="font-semibold text-gray-700">Cálculo de promedio final:</p>
                    <code className="text-green-700 bg-green-100 px-2 py-1 rounded block mt-1">
                      ([Promedio P1] + [Promedio P2] + [Promedio P3]) / 3
                    </code>
                  </div>
                </div>
              </Card>

              {/* Card de Operadores */}
              <Card className="bg-purple-50 border-l-4 border-purple-500">
                <h4 className="font-bold text-lg mb-3 text-purple-800">🔢 Operadores Disponibles</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-mono font-bold text-purple-700">+</span>
                    <span>Suma</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-mono font-bold text-purple-700">-</span>
                    <span>Resta</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-mono font-bold text-purple-700">*</span>
                    <span>Multiplicación</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-mono font-bold text-purple-700">/</span>
                    <span>División</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="font-mono font-bold text-purple-700">( )</span>
                    <span>Paréntesis para agrupar</span>
                  </div>
                </div>
              </Card>

            </div>
          </TabPanel>
        </TabView>

        <div className="mt-6 flex justify-center sm:justify-end">
          <div className="flex flex-col sm:flex-row gap-3 pt-3 w-full sm:w-auto">
            <Button
              label="Generar archivo Excel"
              icon="pi pi-download"
              className="p-button-success text-white bg-green-500 hover:bg-green-800 p-2 w-full sm:w-auto text-sm sm:text-base"
              onClick={saveExcelFileConfiguration}
            />
            {getNavigationButtons()}
          </div>
        </div>
      </div>

      {/* Componente del Editor Visual de Fórmulas */}
      <FormulaEditor
        visible={showFormulaEditor}
        onSave={handleSaveFormula}
        onHide={handleCancelFormulaEdit}
        currentFormula={currentEditingColumn?.currentFormula || ''}
        currentColumnLabel={currentEditingColumn?.currentLabel}
        availableColumns={groupPreviewConfig}
      />
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
