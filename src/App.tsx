import { Routes, Route } from 'react-router-dom'
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './App.css'

import Home from './app/pages/Home.tsx'
import Login from './app/pages/Login.tsx'
import ResumenDeDatos from './app/pages/ResumenDeDatos.tsx'
import AlumnadoCatalogo from './app/pages/AlumnadoCatalogo.tsx'
import AlumnadoFormulario from './app/pages/AlumnadoFormulario.tsx'
import TotalesAlcanzados from './app/pages/TotalesAlcanzados.tsx'

import { ValidateAccessToRoute } from './app/common/hooks/ValidateAccessToRoute.tsx';
import { ExcelProvider } from './app/common/contexts/ExcelContext.tsx';

function App() {
  // Hoja de rutas
  return (
    <ExcelProvider>
      <Routes>
        <Route
          path="/"
          element={<ValidateAccessToRoute element={<Home />} />}
        />
        <Route
          path="/alumnado/catalogo"
          element={<ValidateAccessToRoute element={<AlumnadoCatalogo />} />}
        />
        <Route
          path="/alumnado/formulario"
          element={<ValidateAccessToRoute element={<AlumnadoFormulario />} />}
        />
        <Route
          path="/totales_alcanzados"
          element={<ValidateAccessToRoute element={<TotalesAlcanzados />} />}
        />
        <Route
          path="/resumen_de_datos"
          element={<ValidateAccessToRoute element={<ResumenDeDatos />} />}
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
    </ExcelProvider>
  )
}

export default App
