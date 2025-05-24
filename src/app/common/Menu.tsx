import React from 'react'

const Menu = ({ children, showLateralMenu = true, showControlsMenu = true }) => {
    const [navbarOpen, setNavbarOpen] = React.useState(false);
    return (
        <main>
            <div className="flex">
                {/* Menú lateral */}
                <div className={`w-0 ${
                        showLateralMenu ? 'sm:w-48' : 'hidden'
                     }`}>
                    <nav className="fixed w-48 py-4 h-screen bg-gray-800 text-white flex flex-col">
                        <h2 className="text-2xl font-bold px-4 py-2 text-center">
                            Menú
                        </h2>
                        <ul className='flex-1 py-4 h-full overflow-y-auto'>
                            <li>
                                <a href="/alumnado/catalogo" className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
                                    <span className='text-left pr-2'>
                                        Alumnado
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className="group-hover:stroke-white icon icon-tabler icon-tabler-users-group"
                                        width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                        stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
                                <a href="/totales_alcanzados" className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
                                    <span className='text-left pr-2'>
                                        Totales alcanzados
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className="group-hover:stroke-white icon icon-tabler icon-tabler-sum"
                                        width="44" height="44" viewBox="0 0 24 24"
                                        strokeWidth="1.5" stroke="#2c3e50" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M18 16v2a1 1 0 0 1 -1 1h-11l6 -7l-6 -7h11a1 1 0 0 1 1 1v2" />
                                    </svg>
                                </a>
                            </li>
                            <li>
                                <a href="/resumen_de_datos" className="flex justify-between items-center px-4 py-2 w-full hover:bg-gray-600 hover:font-bold hover:text-white group">
                                    <span className='text-left pr-2'>
                                        Resumen de datos
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                        className="group-hover:stroke-white icon icon-tabler icon-tabler-brand-databricks"
                                        width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                        stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M3 17l9 5l9 -5v-3l-9 5l-9 -5v-3l9 5l9 -5v-3l-9 5l-9 -5l9 -5l5.418 3.01" />
                                    </svg>
                                </a>
                            </li>
                        </ul>
                        <div className="flex justify-center items-center font-bold px-4">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                className="icon icon-tabler icon-tabler-copyright"
                                width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
                            <button className='hidden sm:block group'>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-layout-sidebar-left-collapse"
                                    width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                    stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                                    <path d="M9 4v16" />
                                    <path d="M15 10l-2 2l2 2" />
                                </svg>
                            </button>
                            <button className='hidden sm:block group'>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-layout-sidebar-left-expand"
                                    width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                    stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                                    <path d="M9 4v16" />
                                    <path d="M14 10l2 2l-2 2" />
                                </svg>
                            </button>
                            <button className='block sm:hidden group'>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-menu-2"
                                    width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                    stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M4 6l16 0" />
                                    <path d="M4 12l16 0" />
                                    <path d="M4 18l16 0" />
                                </svg>
                            </button>
                        </div>
                        <div className='flex-1 text-center'>
                            <h2 className='text-4xl font-bold'>
                                Titulo
                            </h2>
                        </div>
                        <div className={`flex flex justify-center items-center ${
                                showControlsMenu ? '' : 'hidden'
                             }`}>
                            <button className='group'>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-tools"
                                    width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                    stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4" />
                                    <path d="M14.5 5.5l4 4" />
                                    <path d="M12 8l-5 -5l-4 4l5 5" />
                                    <path d="M7 8l-1.5 1.5" />
                                    <path d="M16 12l5 5l-4 4l-5 -5" />
                                    <path d="M16 17l-1.5 1.5" />
                                </svg>
                            </button>
                            <button className='group'>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    className="group-hover:stroke-white icon icon-tabler icon-tabler-settings"
                                    width="44" height="44" viewBox="0 0 24 24" strokeWidth="1.5"
                                    stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                    <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
                                    <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className='p-4 flex justify-center flex-col items-center'>
                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
};
  
  export default Menu;