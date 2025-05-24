import { Navigate } from 'react-router-dom';

interface ValidateAccessToRouteProps {
    element: React.ReactElement;
}

export const ValidateAccessToRoute = ({ element }: ValidateAccessToRouteProps) => {
    const fileRoute = localStorage.getItem('fileRoute');
    // return localStorage.getItem('fileRoute') !== null;
    // fileRoute ? element : <Navigate to="/login" />;
    // if (!fileRoute) {
    //     return <Navigate to="/login" replace />;
    // }
    return element;
};