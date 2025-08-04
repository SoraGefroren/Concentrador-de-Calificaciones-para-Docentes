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

export const DEFAULT_FIXED_LEFT_HEADERS = [
  { name: 'ID', date: '', points: 0 },
  { name: 'NOMBRE', date: '', points: 0 },
  { name: 'APELLIDO', date: '', points: 0 },
  { name: 'CORREO.ELECTONICO ', date: '', points: 0 }
];

export const DEFAULT_FIXED_RIGHT_HEADERS = [
  { name: 'SUMA.PORCENTAJE.ACTIVIDADES', date: '', points: 0 },
  { name: 'TOTAL.ALCANZADO.DE.PORCENTAJE.ACTIVIDADES', date: '', points: 0 },
  { name: 'PARTICIPACIÓN', date: '', points: 10 },
  { name: 'TOTAL.ALCANZADO', date: '', points: 0 },
  { name: 'CALIFICACION', date: '', points: 100 }
];

export const DEFAULT_ACTIVITY_TEMPLATES = {
  black: {
    periodName: 'Primer Período',
    activities: [
      { name: 'PRESENTACION-ENCUADRE', date: '27-AGO-21', points: 5 },
      { name: 'ACTIVIDAD-1', date: '03-SEP-21', points: 10 },
      { name: 'ACTIVIDAD-2', date: '10-SEP-21', points: 10 },
      { name: 'ACTIVIDAD-3', date: '17-SEP-21', points: 10 },
      { name: 'ACTIVIDAD-4', date: '24-SEP-21', points: 10 },
      { name: 'ACTIVIDAD-5', date: '01-OCT-21', points: 10 },
      { name: '1ER-PARCIAL', date: '30-SEP-21', points: 25 }
    ]
  },
  green: {
    periodName: 'Segundo Período',
    activities: [
      { name: 'ACTIVIDAD-6', date: '08-OCT-21', points: 10 },
      { name: 'ACTIVIDAD-7', date: '15-OCT-21', points: 10 },
      { name: 'ACTIVIDAD-8', date: '22-OCT-21', points: 10 },
      { name: 'ACTIVIDAD-9', date: '29-OCT-21', points: 10 },
      { name: 'ACTIVIDAD-10', date: '05-NOV-21', points: 10 },
      { name: 'ACTIVIDAD-11', date: '12-NOV-21', points: 10 },
      { name: 'ACTIVIDAD-12', date: '19-NOV-21', points: 10 },
      { name: '2DO-PARCIAL', date: '19-NOV-21', points: 25 }
    ]
  },
  purple: {
    periodName: 'Tercer Período',
    activities: [
      { name: 'ACTIVIDAD-13', date: '26-NOV-21', points: 10 },
      { name: 'ACTIVIDAD-14', date: '03-DIC-21', points: 10 },
      { name: 'ACTIVIDAD-15', date: '10-DIC-21', points: 10 },
      { name: 'ACTIVIDAD-16', date: '17-DIC-21', points: 10 },
      { name: 'ACTIVIDAD-17', date: '07-ENE-22', points: 10 },
      { name: 'ACTIVIDAD-18', date: '14-ENE-22', points: 10 },
      { name: 'EXAMEN-FINAL', date: '19-ENE-22', points: 30 }
    ]
  }
};
