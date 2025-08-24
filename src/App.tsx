import { Routes, Route } from 'react-router-dom'
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './App.css'

import Home from './app/pages/Home.tsx'
import ResumenDeDatos from './app/pages/ResumenDeDatos.tsx'
import TotalesAlcanzados from './app/pages/TotalesAlcanzados.tsx'

import CargarHojaDeDatos from './app/pages/CargarHojaDeDatos.tsx'
import ConfiguracionHoja from './app/pages/ConfiguracionHoja.tsx';
import AlumnadoCatalogo from './app/pages/AlumnadoCatalogo.tsx'
import AlumnadoFormulario from './app/pages/AlumnadoFormulario.tsx'

import { ValidateAccessToRoute } from './app/common/hooks/ValidateAccessToRoute.tsx';
import { ExcelProvider } from './app/common/contexts/ExcelContext.tsx';

function App() {
  // Hoja de rutas
  return (
    <ExcelProvider>
      <Routes>
        <Route
          path="/"
          element={<ValidateAccessToRoute element={<AlumnadoCatalogo />} />}
        />
        <Route
          path="/alumno/:id"
          element={<ValidateAccessToRoute element={<AlumnadoFormulario />} />}
        />
        <Route
          path="/alumno/:id/:mode"
          element={<ValidateAccessToRoute element={<AlumnadoFormulario />} />}
        />
        <Route
          path="/alumno/nuevo"
          element={<ValidateAccessToRoute element={<AlumnadoFormulario />} />}
        />
        <Route
          path="/configuracion"
          element={<ValidateAccessToRoute element={<ConfiguracionHoja />} />}
        />
        <Route
          path="/crear-hoja"
          element={<ConfiguracionHoja />}
        />
        <Route
          path="/cargar-hoja"
          element={<CargarHojaDeDatos />}
        />
        <Route
          path="*"
          element={<h1>Not Found</h1>}
        />
      </Routes>
    </ExcelProvider>
  )
}

export default App
