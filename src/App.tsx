import { Routes, Route, Navigate  } from 'react-router-dom'
import { useEffect } from 'react';

import 'primereact/resources/themes/saga-blue/theme.css';  // Cambia el tema si lo deseas
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './App.css'

import Home from './app/pages/Home.tsx'
import Login from './app/pages/Login.tsx'
import ResumenDeDatos from './app/pages/ResumenDeDatos.tsx'
import AlumnadoCatalogo from './app/pages/AlumnadoCatalogo.tsx'
import AlumnadoFormulario from './app/pages/AlumnadoFormulario.tsx'
import TotalesAlcanzados from './app/pages/TotalesAlcanzados.tsx'

import { useExcelData } from './app/common/hooks/useExcelData.tsx';
import { ValidateAccessToRoute } from './app/common/hooks/ValidateAccessToRoute.tsx'; 

        
function App() {
  // Variables de estado
  const { 
    excelData, 
    loading, 
    error, 
    loadExcelFromPath 
  } = useExcelData();
  // Funcion que se ejecuta cuando el componente se monta, ejecuta cosas fuera del componente
  useEffect(() => {
    loadExcelFromPath('../../__FileTest.xlsx');
  }, []);
  // Loaders
  if (loading) {
    return <div>Cargando datos...</div>;
  }
  // Mensaje de error
  if (error) {
    return <div>Error: {error}</div>;
  }
  // Hoja de rutas
  return (
    <Routes>
      <Route
        path="/"
        element={<ValidateAccessToRoute element={<Home excelData={excelData} />} />}
      />
      <Route
        path="/alumnado/catalogo"
        element={<ValidateAccessToRoute element={<AlumnadoCatalogo excelData={excelData} />} />}
      />
      <Route
        path="/alumnado/formulario"
        element={<ValidateAccessToRoute element={<AlumnadoFormulario excelData={excelData} />} />}
      />
      <Route
        path="/totales_alcanzados"
        element={<ValidateAccessToRoute element={<TotalesAlcanzados excelData={excelData} />} />}
      />
      <Route
        path="/resumen_de_datos"
        element={<ValidateAccessToRoute element={<ResumenDeDatos excelData={excelData} />} />}
      />
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="*"
        element={<h1>Not Found</h1>}
      />
    </Routes>
  )
}

export default App
