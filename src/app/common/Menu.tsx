import React from 'react'
import { useNavigate } from 'react-router-dom';
import ChangeDataSheetModal from './modals/ChangeDataSheetModal';

interface MenuProps {
    children: React.ReactNode;
    navBarTitle?: string;
    showLateralMenu?: boolean;
    showControlsMenu?: boolean;
}

const Menu = ({ children, navBarTitle, showLateralMenu = true, showControlsMenu = true }: MenuProps) => {
    const navigate = useNavigate();
    const [lateralMenuVisible, setLateralMenuVisible] = React.useState(showLateralMenu);
    const [changeDataModalVisible, setChangeDataModalVisible] = React.useState(false);
    return (
        <main>
            <div className="flex">
                {/* Menú lateral */}
                <div className={`w-0 ${
                        lateralMenuVisible ? 'sm:w-48' : 'hidden'
                     }`}>
                    <nav className="fixed w-48 py-4 h-screen bg-gray-800 text-white flex flex-col">
                        <button onClick={() => navigate(`/`)}>
                            <h2 className="text-2xl font-bold px-4 py-2 text-center">
                                Cocado
                            </h2>
                        </button>
                        <ul className='flex-1 py-4 h-full overflow-y-auto'>
                            <li>
                                <button 
                                    onClick={() => setChangeDataModalVisible(true)}
                                    className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group"
                                >
                                    <span className='text-left pr-2'>
                                        Alternar
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" 
                                        className="icon icon-tabler icon-tabler-arrows-exchange group-hover:stroke-white" 
                                        width="44" height="44" viewBox="0 0 24 24"
                                        stroke="#2c3e50" fill="none">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M5 10h14l-4 -4" />
                                        <path d="M19 14h-14l4 4" />
                                    </svg>
                                </button>
                            </li>
                            <li>
                                <a href="/" className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
                                    <span className='text-left pr-2'>
                                        Alumnado
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className="group-hover:stroke-white icon icon-tabler icon-tabler-users-group"
                                        width="44" height="44" viewBox="0 0 24 24"
                                        stroke="#2c3e50" fill="none">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                        <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1" />
                                        <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                        <path d="M17 10h2a2 2 0 0 1 2 2v1" />
                                        <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                                        <path d="M3 13v-1a2 2 0 0 1 2 -2h2" />
                                    </svg>
                                </a>
                            </li>
                            <li>
                                <a href="/configuracion" className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
                                    <span className='text-left pr-2'>
                                        Configuración
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className="group-hover:stroke-white icon icon-tabler icon-tabler-settings"
                                        width="44" height="44" viewBox="0 0 24 24"
                                        stroke="#2c3e50" fill="none">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
                                        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                                    </svg>
                                </a>
                            </li>
                        </ul>
                        <div className="flex justify-center items-center font-bold px-4">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                className="icon icon-tabler icon-tabler-copyright"
                                width="44" height="44" viewBox="0 0 24 24"
                                stroke="#2c3e50" fill="none">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M14 9.75a3.016 3.016 0 0 0 -4.163 .173a2.993 2.993 0 0 0 0 4.154a3.016 3.016 0 0 0 4.163 .173" />
                            </svg>
                            <span className='pl-2'>
                                PP Calificaciones
                            </span>
                        </div>
                    </nav>
                </div>
                {/* Contenido principal */}
                <div className="flex-1 bg-white overflow-y-auto">
                    <div className="flex w-full py-4 bg-gray-800 text-white pl-4 sm:pl-0 pr-4">
                        <div className={`flex flex justify-center items-center ${
                                showControlsMenu ? '' : 'hidden'
                             }`}>
                            <button 
                                className={`group ${lateralMenuVisible ? 'hidden sm:block' : 'hidden'}`}
                                onClick={() => setLateralMenuVisible(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-layout-sidebar-left-collapse"
                                    width="44" height="44" viewBox="0 0 24 24"
                                    stroke="#2c3e50" fill="none">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                                    <path d="M9 4v16" />
                                    <path d="M15 10l-2 2l2 2" />
                                </svg>
                            </button>
                            <button 
                                className={`group ${!lateralMenuVisible ? 'hidden sm:block' : 'hidden'}`}
                                onClick={() => setLateralMenuVisible(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-layout-sidebar-left-expand"
                                    width="44" height="44" viewBox="0 0 24 24"
                                    stroke="#2c3e50" fill="none">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                                    <path d="M9 4v16" />
                                    <path d="M14 10l2 2l-2 2" />
                                </svg>
                            </button>
                            <button className='block sm:hidden group'>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-menu-2"
                                    width="44" height="44" viewBox="0 0 24 24"
                                    stroke="#2c3e50" fill="none">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M4 6l16 0" />
                                    <path d="M4 12l16 0" />
                                    <path d="M4 18l16 0" />
                                </svg>
                            </button>
                        </div>
                        <div className='flex-1 text-center'>
                            <h2 className='text-4xl font-bold'>
                                { navBarTitle || 'Concentrador de Calificaciones para Docentes' }
                            </h2>
                        </div>
                        <div className={`flex flex justify-center items-center ${
                                showControlsMenu ? '' : 'hidden'
                             }`}>
                            <button 
                                onClick={() => setChangeDataModalVisible(true)}
                                className='group'>
                                <svg xmlns="http://www.w3.org/2000/svg" 
                                    className="icon icon-tabler icon-tabler-arrows-exchange group-hover:stroke-white" 
                                    width="44" height="44" viewBox="0 0 24 24"
                                    stroke="#2c3e50" fill="none">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M5 10h14l-4 -4" />
                                    <path d="M19 14h-14l4 4" />
                                </svg>
                            </button>
                            <button 
                                className='group'
                                onClick={() => navigate('/cerrar-hoja')}>
                                <svg xmlns="http://www.w3.org/2000/svg" 
                                    className="icon icon-tabler icon-tabler-logout" 
                                    width="44" height="44" viewBox="0 0 24 24"
                                    stroke="#2c3e50" fill="none">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2v-2" />
                                    <path d="M9 12h12l-3 -3" />
                                    <path d="M18 15l3 -3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className='p-4 flex justify-center flex-col items-center'>
                        {children}
                    </div>
                </div>
            </div>
            
            {/* Modal para cambiar hoja de datos */}
            <ChangeDataSheetModal 
                visible={changeDataModalVisible}
                onHide={() => setChangeDataModalVisible(false)}
            />
        </main>
    );
};
  
  export default Menu;