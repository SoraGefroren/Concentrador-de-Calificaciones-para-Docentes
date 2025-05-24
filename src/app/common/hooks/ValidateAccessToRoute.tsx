import { Navigate } from 'react-router-dom';

interface ValidateAccessToRouteProps {
    element: React.ReactElement;
}

export const ValidateAccessToRoute = ({ element }: ValidateAccessToRouteProps) => {
    // Recupera la ruta almacenada
    const fileRoute = localStorage.getItem('fileRoute');
    // Si no tengo la ruta, volvemos al login
    if (!fileRoute) {
        return <Navigate to="/login" replace />;
    }
    return element;
};