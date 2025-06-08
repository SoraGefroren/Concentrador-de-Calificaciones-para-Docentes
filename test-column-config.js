// Test file para verificar que la funcionalidad de configuración de columnas funciona
console.log('Verificando configuración de columnas...');

// Simular la estructura de datos de la cuarta hoja
const configData = [
    ['PRIMER.PERIODO', '7', 'negro', 'F1:L1'],
    ['SEGUNDO.PERIODO', '8', 'verde', 'M1:T1'],
    ['TERCER.PERIODO', '6', 'morado', 'U1:AA1']
];

// Función para procesar la configuración
const processColumnConfig = (configData) => {
    const defaultConfig = { black: 7, green: 8, purple: 7 };
    
    if (!configData || configData.length === 0) {
        return defaultConfig;
    }

    const config = { ...defaultConfig };

    configData.forEach(row => {
        if (row && row.length >= 3) {
            const [periodo, numColumns, color] = row;
            const columns = parseInt(numColumns?.toString() ?? '0', 10);
            
            if (isNaN(columns)) return;

            const colorLower = color?.toString().toLowerCase();
            
            if (periodo?.toString().includes('PRIMER') && colorLower === 'negro') {
                config.black = columns;
            } else if (periodo?.toString().includes('SEGUNDO') && colorLower === 'verde') {
                config.green = columns;
            } else if (periodo?.toString().includes('TERCER') && colorLower === 'morado') {
                config.purple = columns;
            }
        }
    });

    return config;
};

const result = processColumnConfig(configData);
console.log('Configuración resultante:', result);
console.log('✅ Test completado exitosamente');
