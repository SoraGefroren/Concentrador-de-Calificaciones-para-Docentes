// Tipos para la configuración de headers personalizados

export interface HeaderRow {
  id: string;
  columnName: string;
  value: string;
  group: 'fixed-left' | 'black' | 'green' | 'purple' | 'fixed-right';
  position: number;
}

export interface ExcelHeaderConfiguration {
  // Fila 0: Headers principales de columnas
  columnHeaders: HeaderRow[];
  
  // Fila 1: Fechas asociadas a cada columna
  dateHeaders: HeaderRow[];
  
  // Fila 2: Puntos/pesos asociados a cada columna
  pointHeaders: HeaderRow[];
}

export interface HeaderConfigurationState {
  excelHeaders: ExcelHeaderConfiguration;
  isModified: boolean;
  lastSaved: Date | null;
}

export interface GroupHeaderTemplate {
  group: 'black' | 'green' | 'purple';
  periodName: string;
  activities: {
    name: string;
    date: string;
    points: number;
  }[];
}

export const DEFAULT_FIXED_LEFT_HEADERS_INFO = [
  { name: 'ID', date: '', points: 0 },
  { name: 'NOMBRE', date: '', points: 0 },
  { name: 'APELLIDO', date: '', points: 0 },
  { name: 'CORREO.ELECTONICO ', date: '', points: 0 }
];

export const DEFAULT_FIXED_RIGHT_HEADERS_COLS = [
  { name: 'SUMA.PORCENTAJE.ACTIVIDADES', date: '', points: 90 },
  { name: 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', date: '', points: 60 },
  { name: 'PARTICIPACIÓN', date: '', points: 10 },
  { name: 'TOTAL.ALCANZADO', date: '', points: 100 },
];

export const DEFAULT_FIXED_RIGHT_HEADERS_INFO = [
  { name: 'CALIFICACION', date: '', points: 0 }
];

export const DEFAULT_ACTIVITY_TEMPLATES = {
  black: {
    periodName: 'Primer Período',
    activities: [
      { name: 'PRESENTACION-ENCUADRE', date: '27-AGO-21', points: 5 },
      { name: 'PROPIEDADES-NUMEROS-REALES', date: '03-SEP-21', points: 10 },
      { name: 'JERARQUIA-OPERACIONES-MCM-MCD', date: '10-SEP-21', points: 13 },
      { name: 'PROPORCIONALIDAD', date: '17-SEP-21', points: 11 },
      { name: 'VARIACION.DIRECTA-INVERSA', date: '24-SEP-21', points: 11 },
      { name: 'SUCESION-SERIES', date: '01-OCT-21', points: 10 },
      { name: '1ER-PARCIAL', date: '30-SEP-21', points: 30 }
    ]
  },
  green: {
    periodName: 'Segundo Período',
    activities: [
      { name: 'SUCESIONES-SERIES-ARITMETICAS', date: '08-OCT-21', points: 10 },
      { name: 'SUCESIONES-SERIES-GEOMETRICAS', date: '15-OCT-21', points: 10 },
      { name: 'MEDIDAS.TENDENCIA.CENTRAL', date: '22-OCT-21', points: 10 },
      { name: 'MEDIDAS.DISPERSION', date: '29-OCT-21', points: 8 },
      { name: 'CONCEPTOS.BASICOS.PROBABILIDAD', date: '05-NOV-21', points: 15 },
      { name: 'CONTEXTO ALGEBRAICO', date: '12-NOV-21', points: 15 },
      { name: 'SUMA-RESTA-POLINOMIOS', date: '19-NOV-21', points: 15 },
      { name: '2DO-PARCIAL', date: '19-NOV-21', points: 30 }
    ]
  },
  purple: {
    periodName: 'Tercer Período',
    activities: [
      { name: 'MULTIPLICACION.POLINOMIOA', date: '26-NOV-21', points: 15 },
      { name: 'DIVISION.POLINOMIOS', date: '03-DIC-21', points: 15 },
      { name: 'ECUACION.LINEAL.UNA-VARIABLE', date: '10-DIC-21', points: 15 },
      { name: 'ECUACION.LINEAL.DOS-VARIABLES', date: '17-DIC-21', points: 15 },
      { name: 'ECUACION.LINEAL.TRES-VARIABLES', date: '07-ENE-22', points: 15 },
      { name: 'CLASIFICACION.METODOS.ECUACIONES-CUADRATICAS', date: '14-ENE-22', points: 15 },
      { name: 'EXAMEN-FINAL', date: '19-ENE-22', points: 30 }
    ]
  }
};
