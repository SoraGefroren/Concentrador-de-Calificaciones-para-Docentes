
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