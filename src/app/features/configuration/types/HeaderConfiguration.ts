export const DEFAULT_FIXED_LEFT_HEADERS_INFO = [
  { name: 'ID', date: '', points: 0, editable: false, tipoValor: 'Número', formula: null },
];

export const DEFAULT_FIXED_LEFT_HEADERS_COLS = [
  { name: 'NOMBRE', date: '', points: 0, editable: true, tipoValor: 'Texto', formula: null },
  { name: 'APELLIDO', date: '', points: 0, editable: true, tipoValor: 'Texto', formula: null },
  { name: 'CORREO.ELECTONICO ', date: '', points: 0, editable: true, tipoValor: 'Email', formula: null }
];

export const DEFAULT_ACTIVITY_TEMPLATES = {
  black: {
    periodName: 'Primer Período',
    color: '#151c25ff',
    activities: [
      { name: 'PRESENTACION-ENCUADRE', date: '27-AGO-21', points: 5, editable: true, tipoValor: 'Número', formula: null },
      { name: 'PROPIEDADES-NUMEROS-REALES', date: '03-SEP-21', points: 10, editable: true, tipoValor: 'Número', formula: null },
      { name: 'JERARQUIA-OPERACIONES-MCM-MCD', date: '10-SEP-21', points: 13, editable: true, tipoValor: 'Número', formula: null },
      { name: 'PROPORCIONALIDAD', date: '17-SEP-21', points: 11, editable: true, tipoValor: 'Número', formula: null },
      { name: 'VARIACION.DIRECTA-INVERSA', date: '24-SEP-21', points: 11, editable: true, tipoValor: 'Número', formula: null },
      { name: 'SUCESION-SERIES', date: '01-OCT-21', points: 10, editable: true, tipoValor: 'Número', formula: null },
      { name: '1ER-PARCIAL', date: '30-SEP-21', points: 30, editable: true, tipoValor: 'Número', formula: null }
    ]
  },
  green: {
    periodName: 'Segundo Período',
    color: '#059669',
    activities: [
      { name: 'SUCESIONES-SERIES-ARITMETICAS', date: '08-OCT-21', points: 10, editable: true, tipoValor: 'Número', formula: null },
      { name: 'SUCESIONES-SERIES-GEOMETRICAS', date: '15-OCT-21', points: 10, editable: true, tipoValor: 'Número', formula: null },
      { name: 'MEDIDAS.TENDENCIA.CENTRAL', date: '22-OCT-21', points: 10, editable: true, tipoValor: 'Número', formula: null },
      { name: 'MEDIDAS.DISPERSION', date: '29-OCT-21', points: 8, editable: true, tipoValor: 'Número', formula: null },
      { name: 'CONCEPTOS.BASICOS.PROBABILIDAD', date: '05-NOV-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'CONTEXTO ALGEBRAICO', date: '12-NOV-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'SUMA-RESTA-POLINOMIOS', date: '19-NOV-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: '2DO-PARCIAL', date: '19-NOV-21', points: 30, editable: true, tipoValor: 'Número', formula: null }
    ]
  },
  purple: {
    periodName: 'Tercer Período',
    color: '#7c3aed',
    activities: [
      { name: 'MULTIPLICACION.POLINOMIOA', date: '26-NOV-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'DIVISION.POLINOMIOS', date: '03-DIC-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'ECUACION.LINEAL.UNA-VARIABLE', date: '10-DIC-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'ECUACION.LINEAL.DOS-VARIABLES', date: '17-DIC-21', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'ECUACION.LINEAL.TRES-VARIABLES', date: '07-ENE-22', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'CLASIFICACION.METODOS.ECUACIONES-CUADRATICAS', date: '14-ENE-22', points: 15, editable: true, tipoValor: 'Número', formula: null },
      { name: 'EXAMEN-FINAL', date: '19-ENE-22', points: 30, editable: true, tipoValor: 'Número', formula: null }
    ]
  }
};

export const DEFAULT_FIXED_RIGHT_HEADERS_COLS = [
  { name: 'SUMA.PORCENTAJE.ACTIVIDADES', date: '', points: 90, editable: true, tipoValor: 'Número', formula: null },
  { name: 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', date: '', points: 60, editable: true, tipoValor: 'Número', formula: null },
  { name: 'PARTICIPACIÓN', date: '', points: 10, editable: true, tipoValor: 'Número', formula: null },
  { name: 'TOTAL.ALCANZADO', date: '', points: 100, editable: false, tipoValor: 'Número', formula: null },
];

export const DEFAULT_FIXED_RIGHT_HEADERS_INFO = [
  { name: 'CALIFICACION', date: '', points: 0, editable: false, tipoValor: 'Número', formula: null }
];
