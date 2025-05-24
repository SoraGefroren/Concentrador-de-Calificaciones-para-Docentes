import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const { loadExcelFromPath } = useExcelContext();
    const navigate = useNavigate();

    useEffect(() => {
        const loadInitialData = async () => {
            await loadExcelFromPath('../../__FileTest.xlsx');
            localStorage.setItem('fileRoute', 'true');
            navigate('/');
        };
        loadInitialData();
    }, []);

    return <div>Cargando archivo inicial...</div>;
}