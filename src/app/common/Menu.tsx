import React from 'react'
import { useNavigate } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import ChangeDataSheetModal from './modals/ChangeDataSheetModal';
import CloseFileModal from './modals/CloseFileModal';

interface MenuProps {
    children: React.ReactNode;
    navBarTitle?: string;
    showLateralMenu?: boolean;
    showControlsMenu?: boolean;
}

const Menu = ({ children, navBarTitle, showLateralMenu = true, showControlsMenu = true }: MenuProps) => {
    const navigate = useNavigate();
    const [changeDataModalVisible, setChangeDataModalVisible] = React.useState(false);
    const [closeFileModalVisible, setCloseFileModalVisible] = React.useState(false);
    
    // Detectar móvil inmediatamente para evitar race conditions
    const [isMobile, setIsMobile] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768;
        }
        return false;
    });

    // Estados separados para escritorio y móvil para evitar conflictos
    const [desktopMenuVisible, setDesktopMenuVisible] = React.useState(showLateralMenu);
    const [mobileSidebarVisible, setMobileSidebarVisible] = React.useState(false);

    // Hook para detectar cambios de tamaño de ventana
    React.useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Sincronizar estado de escritorio con prop cuando cambia
    React.useEffect(() => {
        if (!isMobile) {
            setDesktopMenuVisible(showLateralMenu);
        }
    }, [showLateralMenu, isMobile]);

    const handleMenuToggle = () => {
        if (isMobile) {
            console.log('Mobile menu toggle:', !mobileSidebarVisible);
            setMobileSidebarVisible(!mobileSidebarVisible);
        } else {
            console.log('Desktop menu toggle:', !desktopMenuVisible);
            setDesktopMenuVisible(!desktopMenuVisible);
        }
    };

    const handleSidebarHide = () => {
        console.log('Sidebar hide called');
        setMobileSidebarVisible(false);
    };

    const MenuContent = () => (
        <nav className="w-full h-full">
            <div className="w-full h-full flex flex-col py-4 bg-gray-800 text-white">
                <button onClick={() => navigate(`/`)}
                        className='flex flex-none items-center justify-center px-4'>
                    <h2 className="text-2xl font-bold py-2">
                        Cocado
                    </h2>
                </button>
                <ul className='grow py-4 overflow-y-auto'>
                    <li>
                        <button 
                            onClick={() => {
                                setChangeDataModalVisible(true);
                                if (isMobile) setMobileSidebarVisible(false);
                            }}
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
                        <a href="/" onClick={() => {if (isMobile) setMobileSidebarVisible(false);}} className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
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
                        <a href="/configuracion" onClick={() => {if (isMobile) setMobileSidebarVisible(false);}} className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
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
                    <li>
                        <button 
                            onClick={() => {
                                setCloseFileModalVisible(true);
                                if (isMobile) setMobileSidebarVisible(false);
                            }}
                            className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
                            <span className='text-left pr-2'>
                                Cerrar archivo
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" 
                                className="icon icon-tabler icon-tabler-logout group-hover:stroke-white" 
                                width="44" height="44" viewBox="0 0 24 24"
                                stroke="#2c3e50" fill="none">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M14 8v-2a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2 -2v-2" />
                                <path d="M9 12h12l-3 -3" />
                                <path d="M18 15l3 -3" />
                            </svg>
                        </button>
                    </li>
                </ul>
                <div className="flex flex-none items-center px-4">
                    <svg xmlns="http://www.w3.org/2000/svg"
                        className="icon icon-tabler icon-tabler-copyright"
                        width="44" height="44" viewBox="0 0 24 24"
                        stroke="#2c3e50" fill="none">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                        <path d="M14 9.75a3.016 3.016 0 0 0 -4.163 .173a2.993 2.993 0 0 0 0 4.154a3.016 3.016 0 0 0 4.163 .173" />
                    </svg>
                    <span className='pl-2 font-bold'>
                        PP Calificaciones
                    </span>
                </div>
            </div>
        </nav>
    );

    return (
        <main>
            {/* Sidebar para móvil - siempre renderizado para event listeners */}
            <Sidebar
                visible={mobileSidebarVisible}
                position="left"
                onHide={handleSidebarHide}
                className="w-64"
                blockScroll={true}
            >
                <MenuContent />
            </Sidebar>

            <div className="flex">
                {/* Menú lateral para escritorio */}
                {!isMobile && (
                    <div className={`${desktopMenuVisible ? 'flex-none' : 'hidden'}`}>
                        <nav className="w-48 h-screen">
                            <div className="fixed w-48 h-screen">
                                <MenuContent />
                            </div>
                        </nav>
                    </div>
                )}
                {/* Contenido principal */}
                <div className="grow bg-white overflow-y-auto">
                    <div className="block w-full bg-gray-800 text-white py-4 pl-4 sm:pl-0 pr-4">
                        <div className="flex items-center">
                            <div className={`flex-none flex items-center ${
                                    showControlsMenu ? '' : 'hidden'
                                }`}>
                                {/* Botones para escritorio */}
                                {!isMobile && (
                                    <>
                                        <button 
                                            className={`group ${desktopMenuVisible ? '' : 'hidden'}`}
                                            onClick={() => setDesktopMenuVisible(false)}
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
                                            className={`group ${!desktopMenuVisible ? '' : 'hidden'}`}
                                            onClick={() => setDesktopMenuVisible(true)}
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
                                    </>
                                )}
                                {/* Botón hamburguesa para móvil */}
                                {isMobile && (
                                    <button 
                                        className='group'
                                        onClick={handleMenuToggle}
                                    >
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
                                )}
                            </div>
                            <div className='grow text-center'>
                                <h2 className='text-4xl font-bold'>
                                    { navBarTitle || 'Concentrador de Calificaciones para Docentes' }
                                </h2>
                            </div>
                            <div className={`flex-none flex items-center ${
                                    showControlsMenu && !isMobile ? '' : 'hidden'
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
                                    onClick={() => setCloseFileModalVisible(true)}
                                    className={`group ${
                                        !desktopMenuVisible ? '' : 'hidden'
                                    }`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" 
                                        className="icon icon-tabler icon-tabler-logout group-hover:stroke-white" 
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
                    </div>
                    <div className='block w-full p-4'>
                        {children}
                    </div>
                </div>
            </div>
            
            {/* Modal para cambiar hoja de datos */}
            <ChangeDataSheetModal 
                visible={changeDataModalVisible}
                onHide={() => setChangeDataModalVisible(false)}
            />
            
            {/* Modal para cerrar archivo */}
            <CloseFileModal 
                visible={closeFileModalVisible}
                onHide={() => setCloseFileModalVisible(false)}
            />
        </main>
    );
};
  
export default Menu;