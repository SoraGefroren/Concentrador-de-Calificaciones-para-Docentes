import * as XLSX from 'xlsx';
import Menu from '../common/Menu.tsx';
import { React, useEffect, useState } from 'react';

const Home = ({ excelData }) => {
    return (
        <Menu>
            <form className="w-full max-w-md">
                <div className="flex flex-wrap -mx-3 mb-6">
                    <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-first-name">
                            ID
                        </label>
                        <input className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-red rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" id="grid-first-name" type="email" placeholder="Jane"/>
                        <p className="text-red text-xs italic">Please fill out this field.</p>
                    </div>
                    <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-first-name">
                            Correo electronico
                        </label>
                        <input className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-red rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" id="grid-first-name" type="email" placeholder="Jane"/>
                        <p className="text-red text-xs italic">Please fill out this field.</p>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-3 mb-6">
                    <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-first-name">
                            Nombre
                        </label>
                        <input className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-red rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white" id="grid-first-name" type="text" placeholder="Jane"/>
                        <p className="text-red text-xs italic">Please fill out this field.</p>
                    </div>
                    <div className="w-full md:w-1/2 px-3">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-last-name">
                            Apellidos
                        </label>
                        <input className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-grey" id="grid-last-name" type="text" placeholder="Doe"/>
                    </div>
                </div>
                <div className="flex justify-center -mx-3 mb-2">
                    <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                        <button className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-grey">
                            Negros
                                PRESEN-ENCUADRE-27-AGO-21
                                PROPIEDADES-NUMEROS-REALES-03-SEP-21
                                JERARQUIA-OPERACIONES-MCM-MCD-10-SEP-21
                                PROPORCIONALIDAD-17-SEP-21
                                VARIACION.DIRECTA-INVERSA-24-SEP-21
                                SUCESION-SERIES-01-OCT-21
                                1ER.PARCIAL-30-SEP-21
                            Verdes
                                SUCESIONES-SERIES-ARITMETICAS-08-OCT-21
                                SUCESIONES-SERIES-GEOMETRICAS-15-OCT-21
                                MEDIDAS.TENDENCIA.CENTRAL-22-OCT-21
                                MEDIDAS.DISPERSION-29-OCT-21
                                CONCEPTOS.BASICOS.PROBABILIDAD-05-NOV-21
                                CONTEXTO ALGEBRAICO-12-NOV-21
                                SUMA-RESTA-POLINOMIOS-19-NOV-21
                                2DO.PARCIAL-19-NOV-21
                            Morados
                                MULTIPLICACION.POLINOMIOA-26-NOV-21
                                DIVISION.POLINOMIOS-03-DIC-21
                                ECUACION.LINEAL.UNA-VARIABLE-10-DIC-21
                                ECUACION.LINEAL.DOS-VARIABLES-17-DIC-21
                                ECUACION.LINEAL.TRES-VARIABLES-07-ENE-22
                                CLASIFICACION.METODOS.ECUACIONES-CUADRATICAS-14-ENE-22
                                EXAMEN.FINAL-19-ENE-22
                            Azules
                                PARTICIPACIÓN
                                CALIFICACION
                        </button>
                    </div>
                </div>
                <div className="flex justify-center -mx-3 mb-2">
                    <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                        <button className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-grey">
                            Actualizar
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap -mx-3 mb-2">
                    <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-city">
                            City
                        </label>
                        <input className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-grey" id="grid-city" type="text" placeholder="Albuquerque"/>
                    </div>
                    <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-state">
                            State
                        </label>
                        <div className="relative">
                            <select className="block appearance-none w-full bg-grey-lighter border border-grey-lighter text-grey-darker py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-grey" id="grid-state">
                            <option>New Mexico</option>
                            <option>Missouri</option>
                            <option>Texas</option>
                            </select>
                            <div className="pointer-events-none absolute pin-y pin-r flex items-center px-2 text-grey-darker">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/3 px-3 mb-6 md:mb-0">
                        <label className="block uppercase tracking-wide text-grey-darker text-xs font-bold mb-2" htmlFor="grid-zip">
                            Zip
                        </label>
                        <input className="appearance-none block w-full bg-grey-lighter text-grey-darker border border-grey-lighter rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-grey" id="grid-zip" type="text" placeholder="90210"/>
                    </div>
                </div>
            </form>
        </Menu>
    );
};
  
export default Home;