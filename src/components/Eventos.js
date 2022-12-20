/**
 * Mantenimiento de Eventos
 */

import React, { Component, useState, useEffect } from 'react';
import { BrowserRouter as Switch, Route } from "react-router-dom";
import { Redirect } from 'react-router-dom';
import axios from 'axios';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory, {
    PaginationProvider,
    PaginationListStandalone,
    SizePerPageDropdownStandalone,
    PaginationTotalStandalone
} from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter, dateFilter } from 'react-bootstrap-table2-filter';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { ValidatorForm } from 'react-form-validator-core';
import TextValidator from './TextValidator';
import SelectValidator from './SelectValidator';
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ReactBootstrapSlider from 'react-bootstrap-slider';
import "bootstrap-slider/dist/css/bootstrap-slider.css";

import ModalAction from './ModalAction';
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _, { isEmpty, isNull, isUndefined } from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';

import es from 'date-fns/locale/es';
registerLocale('es', es);

const myInitObject = require('./config').myInitObject;
const MIN_PRECIO = 0;
const MAX_PRECIO = 200;
let languageI18N = localStorage.getItem("language");


/**
 * Componente que implementa los procesos CRUD para eventos
 */
class Evento extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        // unsubscribe to ensure no memory leaks
        this.subscription.unsubscribe();
    }
    /**
     * Definición de las rutas del mantenimiento de eventos
     */
    render() {
        const { t } = this.props;
        return (
            <React.Fragment>
                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('EVENTS.EVENTS_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/eventos" render={() => <EventoList {...this.props} />} />
                    <Route path="/eventos/add" component={withAuth(EventoAdd)} />
                    <Route path="/eventos/edit/:id" component={withAuth(EventoEdit)} />
                    <Route path="/eventos/delete/:id" component={withAuth(EventoDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(Evento);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de eventos
 *
 */
const ListLinks = ({ history, action, administrador, permisosAcciones }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        {(administrador || permisosAcciones['/eventos']['listar']) &&
                            <EventoListLink history={history} />
                        }
                    </div>
                    <div className="col-md-2">
                        {(administrador || permisosAcciones['/eventos']['crear']) &&
                            <EventoAddLink history={history} />
                        }
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list' && (administrador || permisosAcciones['/eventos']['listar'])) {
        ret = true;
        return (
            <div className="container">
                <EventoListLink history={history} />
            </div>
        );
    }
    if (action !== 'add' && (administrador || permisosAcciones['/eventos']['crear'])) {
        ret = true;
        return (
            <div className="container">
                <EventoAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de eventos
 */
const EventoListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/eventos') }}>
            {t('EVENTS.EVENTS_LIST')}
        </button>
    );
};

/**
 * Enlace a crear una eventos
 */
const EventoAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/eventos/add') }}>
            {t('EVENTS.EVENT_ADD')}
        </button>
    );
};


/**
 * Componente para listar eventos en una tabla
 */
const EventoList = ({ history, administrador, userId, permisosAcciones }) => {

    const [eventos, setEventos] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");

    /**
     * Borrar evento
     * @param {*} row
     */
    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, nombre: row.row.nombre });
        setShowDeleteConfirm(true);
    };

    /**
     * Componente para pintar las acciones de edición y borrado
     * @param {*} row
     */
    const ActionsFormatter = (row) => {

        if (administrador) {
            return (
                <div className="container">
                    <div className="row">
                        <div className="col-md-2"></div>
                        <div className="col-md-4">
                            <button className="btn btn-primary" onClick={() => { history.push('/eventos/edit/' + row.row.id) }}>
                                {t('EVENTS.EDIT')}
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                {t('EVENTS.DELETE')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        else if (permisosAcciones['/eventos'] && (permisosAcciones['/eventos']['modificar'] || permisosAcciones['/eventos']['borrar'])) {
            return (
                <div className="container">
                    <div className="row">
                        <div className="col-md-2"></div>
                        {permisosAcciones['/eventos']['modificar'] &&
                            <div className="col-md-4">
                                <button className="btn btn-primary" onClick={() => { history.push('/eventos/edit/' + row.row.id) }}>
                                    {t('EVENTS.EDIT')}
                                </button>
                            </div>
                        }
                        {permisosAcciones['/eventos']['borrar'] &&
                            <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                {t('EVENTS.DELETE')}
                            </button>
                        }
                    </div>
                </div>
            );
        } else {
            return (
                <div className="container">
                    <div className="row"></div>
                </div>
            );
        }
    };

    const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

    const getColumnJSONMultilanguage = (columnBase, columnMulti) => {
        if (languageI18N) {
            return columnMulti + '.' + languageI18N;
        } else {
            return columnBase;
        }
    }


    // columnas de la tabla
    const columns = [
        {
            dataField: 'id',
            text: t('EVENTS.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('EVENTS.EVENT'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: 'fecha_fin',
            text: t('EVENTS.DATE_END'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: dateFilter(),
            editable: false
        },
        {
            dataField: '',
            text: t('EVENTS.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];


    /**
     * Inicializar variables y llamar a la crud rest para recoger los eventos del usuario o todos si es administrador
     */
    useEffect(
        () => {
            let urlSuffix = (!administrador) ? '?userId=' + userId : '';
            axios.get(myInitObject.crudServer + '/crud/eventos' + urlSuffix,
                { withCredentials: true })
                .then(response => {
                    setEventos(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [administrador, history, userId]
    );

    // paginado de la tabla
    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="EVENTS.PAGINATION_TOTAL">
                {t('EVENTS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: eventos,
        totalsize: eventos.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: eventos.length === 0,
        withFirstAndLast: true,
        firstPageText: t('EVENTS.FIRST_PAGE_TEXT'),
        firstPageTitle: t('EVENTS.FIRST_PAGE_TITLE'),
        prePageText: t('EVENTS.PRE_PAGE_TEXT'),
        prePageTitle: t('EVENTS.PRE_PAGE_TITLE'),
        nextPageText: t('EVENTS.NEXT_PAGE_TEXT'),
        nextPageTitle: t('EVENTS.NEXT_PAGE_TITLE'),
        lastPageText: t('EVENTS.LAST_PAGE_TEXT'),
        lastPageTitle: t('EVENTS.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    // campo de ordenación por defecto en la tabla
    const defaultSorted = [{
        dataField: 'nombre',
        order: 'asc'
    }];

    // cerrar modal de confirmación de borrado
    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }

    // borrado del evento
    const handleDelete = () => {
        history.push('/eventos/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">

            { (!administrador && !permisosAcciones['/eventos']['listar']) &&
                <Redirect to="/backend" />
            }
            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('EVENTS.EVENT_DELETE')}
                </ModalHeader>
                <ModalBody>
                    {t('EVENTS.EVENT_DELETE')}: {idDelete.nombre}!
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>
                        {t('EVENTS.CLOSE')}
                    </Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('EVENTS.DELETE')}
                    </button>
                </ModalFooter>
            </Modal>

            <ListLinks history={history} action="list" administrador={administrador} permisosAcciones={permisosAcciones} />
            <PaginationProvider pagination={paginationFactory(paginationOption)}>
                {
                    ({
                        paginationProps,
                        paginationTableProps
                    }) => (

                        <div className="container">
                            <div className="container">
                                <div className="row">
                                    <div className="col-md-1">
                                        <SizePerPageDropdownStandalone
                                            {...paginationProps}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        {paginationProps !== undefined && paginationProps.dataSize !== undefined &&
                                            <PaginationTotalStandalone
                                                {...paginationProps}
                                            />
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="p-3">
                                <BootstrapTable
                                    striped
                                    hover
                                    keyField='id'
                                    data={eventos}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('EVENTS.EVENTS_NO_EVENTS')}
                                    filter={filterFactory()}
                                    {...paginationTableProps} />
                            </div>
                            <div className="container">
                                <PaginationListStandalone
                                    {...paginationProps}
                                />
                            </div>
                        </div>
                    )
                }
            </PaginationProvider>
        </div>
    );
};



/**
 * Componente de borrado de eventos
 */
const EventoDelete = ({ history, match, administrador, permisosAcciones }) => {

    // borrar el evento y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/eventos/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/eventos'))
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history, match]
    );

    return (
        <ListLinks history={history} action="delete" administrador={administrador} permisosAcciones={permisosAcciones} />
    );
};


/**
 * Componente para añadir un evento
 */
const EventoAdd = ({ history, administrador, userId, permisosAcciones }) => {

    const [evento, setEvento] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
        imagen: '',
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date().toISOString(),
        gratuito: false,
        activo: false,
        direccion: '',
        direccion_multi: [],
        UserId: userId,
        hora: '',
        aforo: '',
        precio: '',
        link_externo: '',
        produccion: '',
        produccion_multi: [],
        participantes: '',
        participantes_multi: [],
        resumen: '',
        resumen_multi: [],
        valid: false
    });

    const [fechas, setFechas] = useState({ fecha_inicio: new Date(), fecha_fin: new Date() });
    const [fileState, setFileState] = useState('');
    const [ok, setOk] = useState({ ok: 0, evento: '' });
    const [tiposevento, setTiposEvento] = useState([]);
    const [paises, setPaises] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [TipoEventoId, setTipoEventoId] = useState(0);
    const [PaisId, setPaisId] = useState(0);
    const [ProvinciaId, setProvinciaId] = useState(0);
    const [CiudadId, setCiudadId] = useState(0);
    const [gratuito, setGratuito] = useState(false);
    const [activo, setActivo] = useState(false);
    const [precios, setPrecios] = useState([MIN_PRECIO, MAX_PRECIO]);
    const [t] = useTranslation("global");

    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

    /****************************************************
     ******************** ALERTS *************************
     ****************************************************/

    /**
    * Close modal
    * @param {*} action Action: 'save'
    */
    const handleClose = (action) => {
        switch (action) {
            case 'save':
                setShowModalMessage({});
                setModalOpen(false);
                break;
            default:
                break;
        }
    }

    // recoger países, provincias, ciudades y tipos de eventos para mostrarlos en un combo
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                .then(responseLanguages => {
                    if (responseLanguages.data && responseLanguages.data.length > 0) {
                        responseLanguages.data.map(d => {
                            d.value = d.id;
                            d.label = d.name;
                            return d;
                        });
                        evento.nombre_multi = _.cloneDeep(responseLanguages.data);
                        evento.direccion_multi = _.cloneDeep(responseLanguages.data);
                        evento.participantes_multi = _.cloneDeep(responseLanguages.data);
                        evento.produccion_multi = _.cloneDeep(responseLanguages.data);
                        evento.resumen_multi = _.cloneDeep(responseLanguages.data);
                        setEvento(evento)
                    }
                });
            const paisesPromise = axios.get(myInitObject.crudServer + '/crud/paises', { withCredentials: true });
            const provinciasPromise = axios.get(myInitObject.crudServer + '/crud/provincias', { withCredentials: true });
            const ciudadesPromise = axios.get(myInitObject.crudServer + '/crud/ciudades', { withCredentials: true });
            const tipoEventosPromise = axios.get(myInitObject.crudServer + '/crud/tipoeventos', { withCredentials: true });
            Promise.all([paisesPromise, provinciasPromise, ciudadesPromise, tipoEventosPromise]).then((res) => {
                setPaises(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                setProvincias(res[1].data);
                setCiudades(res[2].data);
                setTiposEvento(res[3].data.map(element => { return { value: element.id, label: element.nombre } }));
            })
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history]
    );

    // actualizar el evento si cambian los precios
    useEffect(() => {
        let obj = JSON.parse(JSON.stringify(evento));
        obj.precio = precios.join(',');
        setEvento(obj);
    }, [precios]);


    const handleChangeFechaInicio = date => {
        setFechas({ fecha_inicio: date, fecha_fin: fechas.fecha_fin });
        let obj = JSON.parse(JSON.stringify(evento));
        obj.fecha_inicio = date.toISOString();
        setEvento(obj);
    };
    const handleChangeFechaFin = date => {
        setFechas({ fecha_inicio: fechas.fecha_inicio, fecha_fin: date });
        let obj = JSON.parse(JSON.stringify(evento));
        obj.fecha_fin = date.toISOString();
        setEvento(obj);
    };

    const handleTipoEventoId = ((e) => {
        setTipoEventoId(e.value);
    });
    const handlePaisId = ((e) => {
        setPaisId(e.value);
    });
    const handleProvinciaId = ((e) => {
        setProvinciaId(e.value);
    });
    const handleCiudadId = ((e) => {
        setCiudadId(e.value);
    });

    // comprobar el rango de precios
    const onBlurPrecio = ((e) => {
        let obj = JSON.parse(JSON.stringify(evento));
        if (/^\s*\d+\s*,\s*\d+\s*$/.test(e.target.value)) {
            const arr = e.target.value.split(/\s*,\s*/);
            let min = parseInt(arr[0].trim(), 10);
            let max = parseInt(arr[1].trim(), 10);
            if (min < MIN_PRECIO) {
                min = MIN_PRECIO;
            }
            if (min > MAX_PRECIO) {
                min = MAX_PRECIO;
            }
            if (max > MAX_PRECIO) {
                max = MAX_PRECIO;
            }
            if (max < MIN_PRECIO) {
                max = MIN_PRECIO;
            }
            if (max < min) {
                max = min;
            }
            obj.precio = min + ',' + max;
        } else if (/^\s*\d+\s*,?$/.test(e.target.value)) {
            obj.precio = (e.target.value.indexOf(',') < 0) ? e.target.value + ',' + MAX_PRECIO : e.target.value + MAX_PRECIO;
        } else if (/^\s*,\s*\d+\s*$/.test(e.target.value)) {
            obj.precio = MIN_PRECIO + e.target.value;
        } else {
            obj.precio = MIN_PRECIO + ',' + MAX_PRECIO;
        }
        setEvento(obj);
    });

    // cambia alguna propiedad del evento
    const onChangeEvento = ((e) => {
        let obj = JSON.parse(JSON.stringify(evento));
        if (e.target.name === 'precio') {
            let values = MIN_PRECIO + ',' + MAX_PRECIO;
            if (/^\s*\d+\s*,\s*\d+\s*$/.test(e.target.value)) {
                const arr = e.target.value.split(/\s*,\s*/);
                let min = parseInt(arr[0].trim(), 10);
                let max = parseInt(arr[1].trim(), 10);
                if (min < MIN_PRECIO) {
                    min = MIN_PRECIO;
                }
                if (min > MAX_PRECIO) {
                    min = MAX_PRECIO;
                }
                if (max > MAX_PRECIO) {
                    max = MAX_PRECIO;
                }
                if (max < MIN_PRECIO) {
                    max = MIN_PRECIO;
                }
                values = min + ',' + max;
            } else if (/^\s*\d+\s*,?$/.test(e.target.value)) {
                values = (e.target.value.indexOf(',') < 0) ? e.target.value + ',' + MAX_PRECIO : e.target.value + MAX_PRECIO;
            } else if (/^\s*,\s*\d+\s*$/.test(e.target.value)) {
                values = MIN_PRECIO + e.target.value;
            } else {
                values = MIN_PRECIO + ',' + MAX_PRECIO;
            }
            const arr = values.split(/\s*,\s*/);
            setPrecios([parseInt(arr[0], 10), parseInt(arr[1], 10)]);
            obj[e.target.name] = e.target.value;
        } else {
            obj[e.target.name] = e.target.value;
        }
        setEvento(obj);
        if (e.target.name === 'imagen') {
            let imageFile = document.querySelector('#imagen');
            let file = imageFile.files[0];
            if (file !== undefined && file.size <= myInitObject.imgMaxSize
                && /^(image\/png|image\/jpeg|image\/jpg|image\/gif)$/.test(file.type)) {

                getBase64(file)
                    .then(result => { setFileState(result) })
                    .catch(error => console.log(error));

                let reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState === FileReader.DONE) {
                        document.querySelector("#img").src = evt.target.result;
                    }
                };
                reader.readAsDataURL(file);
            } else {
                evento.imagen = null;
                e.target.value = null;
                setFileState('');
                return;
            };
        }
    });

    const onChangeCheckboxGratuito = ((e) => {
        setGratuito(!gratuito);
    });

    const onChangeCheckboxActivo = ((e) => {
        setActivo(!activo);
    });

    const onChangePrecioSlider = ((e) => {
        setPrecios(e.target.value);
    });

    /**
     * Convert file to base64
     * @param {*} file File
     * @returns Return Base64 string
     */
    const getBase64 = file => {
        return new Promise(resolve => {
            let baseURL = "";
            // Make new FileReader
            let reader = new FileReader();
            // Convert the file to base64 text
            reader.readAsDataURL(file);

            // on reader load somthing...
            reader.onload = () => {
                baseURL = reader.result;
                resolve(baseURL);
            };
        });
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesTypeEvent = (response, singleVariable, multiVariable) => {
        let lEvento = _.cloneDeep(evento);
        lEvento[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lEvento[singleVariable] = rp.multilanguage;
            }
        });
        setEvento(lEvento);
    }

    /**
     * Transform to json language
     * Example: {'en': 'Hello', 'es': 'Hola'}
     * @param {*} language Array of values from languages
     */
    const transformLanguageToJson = (language) => {
        let lngs = {};
        language.map(lng => {
            if (lng.multilanguage !== undefined && lng.multilanguage !== null) {
                lngs = {
                    ...lngs,
                    ...{ [lng.id]: lng.multilanguage.trim() }
                };
            }
            return lng;
        });
        return JSON.stringify(lngs);
    }

    /**
     * Transform variable multi language in json format
     */
    const transformEventToMultiLenguage = () => {
        let variablesMulti = ['nombre_multi', 'produccion_multi', 'participantes_multi', 'direccion_multi', 'resumen_multi'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(evento[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            evento[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!evento[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                evento.valid = false;
                break;
            } else {
                evento.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getEventObject2Add = (image) => {
        let lEvent = {
            nombre: evento.nombre,
            nombre_multi: evento.nombre_multi2,
            imagen: image,
            fecha_inicio: evento.fecha_inicio,
            fecha_fin: evento.fecha_fin,
            gratuito: gratuito,
            activo: activo,
            direccion: evento.direccion,
            direccion_multi: evento.direccion_multi2,
            UserId: userId,
            hora: evento.hora,
            aforo: evento.aforo,
            precio: precios.join(','),
            link_externo: evento.link_externo,
            produccion: evento.produccion,
            produccion_multi: evento.produccion_multi2,
            participantes: evento.participantes,
            participantes_multi: evento.participantes_multi2,
            resumen: evento.resumen,
            resumen_multi: evento.resumen_multi2,
            TipoEventoId: TipoEventoId,
            PaisId: PaisId,
            ProvinciaId: ProvinciaId,
            CiudadId: CiudadId
        }
        return lEvent;
    }

    // crear evento
    const onSubmit = ((e) => {
        e.preventDefault();
        changeResponseValidation(['nombre_multi', 'direccion_multi']);
        let imageFile = document.querySelector('#imagen');
        let file = imageFile.files[0];
        transformEventToMultiLenguage();
        if (evento && evento.valid) {
            getBase64(file)
                .then(result => {
                    let lEvent = getEventObject2Add(result);
                    axios.post(myInitObject.crudServer + '/crud/eventos/add', lEvent,
                        { withCredentials: true })
                        .then(() => {
                            setShowModalMessage({ title: 'EVENTS.EVENT_REGISTRATION', body: 'EVENTS.EVENT_REGISTRATION_OK', object: { event: lEvent.nombre } });
                            setModalOpen(true);
                            setTimeout(() => {
                                history.push('/eventos/');
                            }, 2000);
                        }).catch(function (error) {
                            setOk({ ok: -1, evento: evento.nombre });
                        });
                });
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="EVENTS.EVENT_REGISTRATION_OK_STRONG">
                        {t('EVENTS.EVENT_REGISTRATION_OK_STRONG', { event: ok.evento })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="EVENTS.EVENT_REGISTRATION_ERROR_STRONG">
                        {t('EVENTS.EVENT_REGISTRATION_ERROR_STRONG', { event: ok.evento })}
                    </Trans>
                </div>
            );
        } else {
            return (
                <div>&nbsp;</div>
            )
        }
    };

    /**
     * Show error modal
     */
    const openModal = () => {
        return (
            <Modal isOpen={modalOpen}>
                <ModalHeader>
                    {t(showModalMessage.title)}
                </ModalHeader>
                <ModalBody>
                    {showModalMessage.object &&
                        <div>
                            {t(showModalMessage.body, showModalMessage.object)}
                        </div>
                    }
                    {!showModalMessage.object &&
                        <div>
                            {t(showModalMessage.body)}
                        </div>
                    }
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('EVENTS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const showModalActionClose = () => {
        setOk({ ok: 2, evento: ok.evento });
    };

    // pintar formulario de creación de eventos si se poseen permisos
    return (
        <div className="container">
            { (!administrador && !permisosAcciones['/eventos']['crear']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ModalAction show={ok.ok === 1}
                header={t('EVENTS.EVENT_REGISTRATION')}
                body={t('EVENTS.EVENT_REGISTRATION_OK', { event: ok.evento })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('EVENTS.EVENT_REGISTRATION')}
                body={t('EVENTS.EVENT_REGISTRATION_ERROR', { event: ok.evento })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="add" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('EVENTS.EVENT_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit} method="post" encType="multipart/form-data">
                    <div className="form-group">
                        <label>{t('EVENTS.EVENT')} (*):  </label>
                        <TableMultiLanguage
                            languages={evento.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.EVENT_TYPE')} (*):  </label>
                        <SelectValidator name={"TipoEventoId"} isSearchable={true}
                            onChange={handleTipoEventoId}
                            value={tiposevento.filter(({ value }) => value === TipoEventoId)}
                            options={tiposevento}
                            validators={['required']}
                            errorMessages={[t('EVENTS.EVENT_TYPE_EMPTY')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.DATE_START')} (*):  </label>
                        <DatePicker id="fecha_inicio"
                            name="fecha_inicio"
                            selected={fechas.fecha_inicio}
                            onChange={handleChangeFechaInicio}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.DATE_END')} (*):  </label>
                        <DatePicker id="fecha_fin"
                            name="fecha_fin"
                            selected={fechas.fecha_fin}
                            onChange={handleChangeFechaFin}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.IMAGE')} (*):  </label>
                        <div className="form-group">
                            <img id="img" src={fileState} alt="" style={{ width: '50%' }} />
                        </div>

                        <TextValidator
                            type="file"
                            id="imagen"
                            className="form-control"
                            name="imagen"
                            accept=".jpeg, .jpg, .gif, .png"
                            onChange={onChangeEvento}
                        />
                    </div>
                    <div className="form-group">
                        <TextValidator
                            readOnly
                            onChange={() => { return }}
                            type="hidden"
                            name="filehidden"
                            value={fileState}
                            validators={['required']}
                            errorMessages={[t('EVENTS.IMAGE_NOT_VALID')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.COUNTRY')} (*):  </label>
                        <SelectValidator name={"PaisId"} isSearchable={true}
                            onChange={handlePaisId}
                            value={paises.filter(({ value }) => value === PaisId)}
                            options={paises}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PROVINCE')} (*):  </label>
                        <SelectValidator name={"ProvinciaId"} isSearchable={true}
                            onChange={handleProvinciaId}
                            value={provincias.filter(({ id }) => id === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={PaisId > 0 &&
                                (provincias.filter((provincia) => provincia.PaisId === PaisId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.CITY')} (*):  </label>
                        <SelectValidator name={"CiudadId"} isSearchable={true}
                            onChange={handleCiudadId}
                            value={ciudades.filter(({ id }) => id === CiudadId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={ProvinciaId > 0 && ciudades.filter((ciudad) => ciudad.ProvinciaId === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } })}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.ADDRESS')} (*):  </label>
                        <TableMultiLanguage
                            languages={evento.direccion_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'direccion', 'direccion_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <label>{t('EVENTS.HOUR')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.hora}
                            name="hora"
                            onChange={onChangeEvento}
                            size="20"
                            maxLength="100"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.CAPACITY')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.aforo}
                            name="aforo"
                            onChange={onChangeEvento}
                            size="50"
                            maxLength="100"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PRICE')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.precio}
                            name="precio"
                            onChange={onChangeEvento}
                            onBlur={onBlurPrecio}
                            size="20"
                            maxLength="100"
                        />
                        <div>
                            <ReactBootstrapSlider
                                id="precio_slider"
                                change={onChangePrecioSlider}
                                value={precios}
                                step={1}
                                max={MAX_PRECIO}
                                min={MIN_PRECIO}
                                ticks={[MIN_PRECIO, MAX_PRECIO]}
                                ticks_labels={[MIN_PRECIO + '', MAX_PRECIO + '']}
                                tooltip="show"
                                tooltip_split={true}
                                orientation="horizontal"
                                reversed={false} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.EXTERNAL_LINK')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.link_externo}
                            name="link_externo"
                            onChange={onChangeEvento}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PRODUCTION')}:</label>
                        <TableMultiLanguage
                            languages={evento.produccion_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'produccion', 'produccion_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PARTICIPANTS')}:</label>
                        <TableMultiLanguage
                            languages={evento.participantes_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'participantes', 'participantes_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.SUMMARY')}:</label>
                        <TableMultiLanguage
                            languages={evento.resumen_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'resumen', 'resumen_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="gratuito"
                                id="gratuito"
                                onChange={onChangeCheckboxGratuito}
                            />
                            <label className="form-check-label" htmlFor="gratuito">{t('EVENTS.FREE')} (*):  </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="activo"
                                id="activo"
                                onChange={onChangeCheckboxActivo}
                            />
                            <label className="form-check-label" htmlFor="activo">{t('EVENTS.ACTIVE')} (*):  </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <input type="submit" value={t('EVENTS.EVENT_REGISTER')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar un evento
 */
const EventoEdit = ({ history, match, userId, administrador, permisosAcciones }) => {

    const [evento, setEvento] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
        imagen: '',
        fecha_inicio: new Date().toISOString(),
        fecha_fin: new Date().toISOString(),
        gratuito: false,
        activo: false,
        direccion: '',
        direccion_multi: [],
        UserId: userId,
        hora: '',
        aforo: '',
        precio: '',
        link_externo: '',
        produccion: '',
        produccion_multi: [],
        participantes: '',
        participantes_multi: [],
        resumen: '',
        resumen_multi: [],
        CiudadId: 0,
        TipoEventoId: 0,
        ProvinciaId: 0,
        PaisId: 0,
        valid: false
    });
    const [fechas, setFechas] = useState({ fecha_inicio: new Date(), fecha_fin: new Date() });
    const [fileState, setFileState] = useState('');
    const [ok, setOk] = useState({ ok: 0, cultotipo: '' });
    const [tiposevento, setTiposEvento] = useState([]);
    const [paises, setPaises] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [TipoEventoId, setTipoEventoId] = useState(0);
    const [PaisId, setPaisId] = useState(0);
    const [ProvinciaId, setProvinciaId] = useState(0);
    const [CiudadId, setCiudadId] = useState(0);
    const [gratuito, setGratuito] = useState(false);
    const [activo, setActivo] = useState(false);
    const [precios, setPrecios] = useState([MIN_PRECIO, MAX_PRECIO]);
    const [t] = useTranslation("global");

    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

    /****************************************************
     ******************** ALERTS *************************
     ****************************************************/

    /**
    * Close modal
    * @param {*} action Action: 'save'
    */
    const handleClose = (action) => {
        switch (action) {
            case 'save':
                setShowModalMessage({});
                setModalOpen(false);
                break;
            default:
                break;
        }
    }

    /**
     * Show open modal
     */
    const openModal = () => {
        return (
            <Modal isOpen={modalOpen}>
                <ModalHeader>
                    {t(showModalMessage.title)}
                </ModalHeader>
                <ModalBody>
                    {showModalMessage.object &&
                        <div>
                            {t(showModalMessage.body, showModalMessage.object)}
                        </div>
                    }
                    {!showModalMessage.object &&
                        <div>
                            {t(showModalMessage.body)}
                        </div>
                    }
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('EVENTS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * It is used to add the multilanguage value to its corresponding language
     * @param {*} language Language
     * @param {*} values Values
     */
    const transformLanguageByValues = (language, values) => {
        let lngs = _.cloneDeep(language);
        if (lngs && Array.isArray(lngs)) {
            lngs.map(lng => {
                if (values && values[lng.id]) {
                    lng.multilanguage = values[lng.id];
                }
                return lng;
            });
        }
        return lngs;
    }

    // recoger los datos del evento, países, provincias, ciudades, tipos de eventos
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                .then(responseLanguages => {
                    if (responseLanguages.data && responseLanguages.data.length > 0) {
                        responseLanguages.data.map(d => {
                            d.value = d.id;
                            d.label = d.name;
                            return d;
                        });

                        axios.get(myInitObject.crudServer + '/crud/eventos/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let image = _.cloneDeep(response.data.imagen);
                                if (isNull(image) || isUndefined(image) || isEmpty(image)
                                    || (!isEmpty(image) && !image.includes('data:image/'))) {
                                    image = '';
                                }

                                let lVariablesMulti = ['nombre_multi', 'direccion_multi', 'participantes_multi', 'produccion_multi', 'resumen_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });

                                setEvento(response.data);

                                setFileState(image);
                                setTipoEventoId(response.data.TipoEventoId);
                                setPaisId(response.data.PaisId);
                                setProvinciaId(response.data.ProvinciaId);
                                setCiudadId(response.data.CiudadId);
                                setFechas({ fecha_inicio: new Date(response.data.fecha_inicio), fecha_fin: new Date(response.data.fecha_fin) });
                                setActivo(response.data.activo);
                                setGratuito(response.data.gratuito);
                                setPrecios((/^\s*\d+\s*,\s*\d+\s*$/.test(response.data.precio)) ? response.data.precio.split(/\s*,\s*/).map(Number) : [MIN_PRECIO, MAX_PRECIO]);
                            })
                            .catch(function (error) {
                                console.error(error);
                            });
                    }
                });

            const paisesPromise = axios.get(myInitObject.crudServer + '/crud/paises', { withCredentials: true });
            const provinciasPromise = axios.get(myInitObject.crudServer + '/crud/provincias', { withCredentials: true });
            const ciudadesPromise = axios.get(myInitObject.crudServer + '/crud/ciudades', { withCredentials: true });
            const tipoEventosPromise = axios.get(myInitObject.crudServer + '/crud/tipoeventos', { withCredentials: true });
            Promise.all([paisesPromise, provinciasPromise, ciudadesPromise, tipoEventosPromise]).then((res) => {
                setPaises(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                setProvincias(res[1].data);
                setCiudades(res[2].data);
                setTiposEvento(res[3].data.map(element => { return { value: element.id, label: element.nombre } }));
            })
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history, match]
    );

    useEffect(() => {
        let obj = JSON.parse(JSON.stringify(evento));
        obj.precio = precios.join(',');
        setEvento(obj);
    }, [precios]);

    const handleChangeFechaInicio = date => {
        setFechas({ fecha_inicio: date, fecha_fin: fechas.fecha_fin });
        let obj = JSON.parse(JSON.stringify(evento));
        obj.fecha_inicio = date.toISOString();
        setEvento(obj);
    };
    const handleChangeFechaFin = date => {
        setFechas({ fecha_inicio: fechas.fecha_inicio, fecha_fin: date });
        let obj = JSON.parse(JSON.stringify(evento));
        obj.fecha_fin = date.toISOString();
        setEvento(obj);
    };

    const handleTipoEventoId = ((e) => {
        setTipoEventoId(e.value);
    });
    const handlePaisId = ((e) => {
        setPaisId(e.value);
    });
    const handleProvinciaId = ((e) => {
        setProvinciaId(e.value);
    });
    const handleCiudadId = ((e) => {
        setCiudadId(e.value);
    });

    const onBlurPrecio = ((e) => {
        let obj = JSON.parse(JSON.stringify(evento));
        if (/^\s*\d+\s*,\s*\d+\s*$/.test(e.target.value)) {
            const arr = e.target.value.split(/\s*,\s*/);
            let min = parseInt(arr[0].trim(), 10);
            let max = parseInt(arr[1].trim(), 10);
            if (min < MIN_PRECIO) {
                min = MIN_PRECIO;
            }
            if (min > MAX_PRECIO) {
                min = MAX_PRECIO;
            }
            if (max > MAX_PRECIO) {
                max = MAX_PRECIO;
            }
            if (max < MIN_PRECIO) {
                max = MIN_PRECIO;
            }
            if (max < min) {
                max = min;
            }
            obj.precio = min + ',' + max;
        } else if (/^\s*\d+\s*,?$/.test(e.target.value)) {
            obj.precio = (e.target.value.indexOf(',') < 0) ? e.target.value + ',' + MAX_PRECIO : e.target.value + MAX_PRECIO;
        } else if (/^\s*,\s*\d+\s*$/.test(e.target.value)) {
            obj.precio = MIN_PRECIO + e.target.value;
        } else {
            obj.precio = MIN_PRECIO + ',' + MAX_PRECIO;
        }
        setEvento(obj);
    });

    /**
     * Convert file to base64
     * @param {*} file File
     * @returns Return Base64 string
     */
    const getBase64 = file => {
        return new Promise(resolve => {
            let baseURL = "";
            // Make new FileReader
            let reader = new FileReader();
            // Convert the file to base64 text
            reader.readAsDataURL(file);

            // on reader load somthing...
            reader.onload = () => {
                baseURL = reader.result;
                resolve(baseURL);
            };
        });
    };

    const onChangeEvento = ((e) => {
        let obj = JSON.parse(JSON.stringify(evento));
        if (e.target.name === 'precio') {
            let values = MIN_PRECIO + ',' + MAX_PRECIO;
            if (/^\s*\d+\s*,\s*\d+\s*$/.test(e.target.value)) {
                const arr = e.target.value.split(/\s*,\s*/);
                let min = parseInt(arr[0].trim(), 10);
                let max = parseInt(arr[1].trim(), 10);
                if (min < MIN_PRECIO) {
                    min = MIN_PRECIO;
                }
                if (min > MAX_PRECIO) {
                    min = MAX_PRECIO;
                }
                if (max > MAX_PRECIO) {
                    max = MAX_PRECIO;
                }
                if (max < MIN_PRECIO) {
                    max = MIN_PRECIO;
                }
                values = min + ',' + max;
            } else if (/^\s*\d+\s*,?$/.test(e.target.value)) {
                values = (e.target.value.indexOf(',') < 0) ? e.target.value + ',' + MAX_PRECIO : e.target.value + MAX_PRECIO;
            } else if (/^\s*,\s*\d+\s*$/.test(e.target.value)) {
                values = MIN_PRECIO + e.target.value;
            } else {
                values = MIN_PRECIO + ',' + MAX_PRECIO;
            }
            const arr = values.split(/\s*,\s*/);
            setPrecios([parseInt(arr[0], 10), parseInt(arr[1], 10)]);
            obj[e.target.name] = e.target.value;
        } else {
            obj[e.target.name] = e.target.value;
        }
        setEvento(obj);
        if (e.target.name === 'imagen') {
            let imageFile = document.querySelector('#imagen');
            let file = imageFile.files[0];
            if (file !== undefined && file.size <= myInitObject.imgMaxSize
                && /^(image\/png|image\/jpeg|image\/jpg|image\/gif)$/.test(file.type)) {

                getBase64(file)
                    .then(result => { setFileState(result) })
                    .catch(error => console.log(error));

                let reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState === FileReader.DONE) {
                        document.querySelector("#img").src = evt.target.result;
                    }
                };
                reader.readAsDataURL(file);
            } else {
                evento.imagen = null;
                e.target.value = null;
                setFileState('');
                return;
            };
        }
        setOk({ ok: 0, cultotipo: '' });
    });

    const onChangeCheckboxGratuito = ((e) => {
        setGratuito(!gratuito);
    });

    const onChangeCheckboxActivo = ((e) => {
        setActivo(!activo);
    });

    const onChangePrecioSlider = ((e) => {
        setPrecios(e.target.value);
    });

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesTypeEvent = (response, singleVariable, multiVariable) => {
        let lEvento = _.cloneDeep(evento);
        lEvento[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lEvento[singleVariable] = rp.multilanguage;
            }
        });
        setEvento(lEvento);
    }

    /**
     * Transform to json language
     * Example: {'en': 'Hello', 'es': 'Hola'}
     * @param {*} language Array of values from languages
     */
    const transformLanguageToJson = (language) => {
        let lngs = {};
        language.map(lng => {
            if (lng.multilanguage !== undefined && lng.multilanguage !== null) {
                lngs = {
                    ...lngs,
                    ...{ [lng.id]: lng.multilanguage.trim() }
                };
            }
            return lng;
        });
        return JSON.stringify(lngs);
    }

    /**
     * Transform variable multi language in json format
     */
    const transformEventToMultiLenguage = () => {
        let variablesMulti = ['nombre_multi', 'produccion_multi', 'participantes_multi', 'direccion_multi', 'resumen_multi'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(evento[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            evento[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!evento[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                evento.valid = false;
                break;
            } else {
                evento.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getEventObject2Add = (image) => {
        let lEvent = {
            id: evento.id,
            nombre: evento.nombre,
            nombre_multi: evento.nombre_multi2,
            imagen: image,
            fecha_inicio: fechas.fecha_inicio,
            fecha_fin: fechas.fecha_fin,
            gratuito: gratuito,
            activo: activo,
            direccion: evento.direccion,
            direccion_multi: evento.direccion_multi2,
            UserId: userId,
            hora: evento.hora,
            aforo: evento.aforo,
            precio: precios.join(','),
            link_externo: evento.link_externo,
            produccion: evento.produccion,
            produccion_multi: evento.produccion_multi2,
            participantes: evento.participantes,
            participantes_multi: evento.participantes_multi2,
            resumen: evento.resumen,
            resumen_multi: evento.resumen_multi2,
            TipoEventoId: TipoEventoId,
            PaisId: PaisId,
            ProvinciaId: ProvinciaId,
            CiudadId: CiudadId
        }
        return lEvent;
    }

    // modificar evento
    const onSubmit = ((e) => {
        e.preventDefault();


        changeResponseValidation(['nombre_multi', 'direccion_multi']);
        transformEventToMultiLenguage();
        if (evento && evento.valid) {
            let lEvent = getEventObject2Add(fileState);
            axios.post(myInitObject.crudServer + '/crud/eventos/update', lEvent,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({ title: 'EVENTS.EVENT_REGISTRATION', body: 'EVENTS.EVENT_REGISTRATION_OK', object: { event: lEvent.nombre } });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/eventos/');
                    }, 2000);
                }).catch(function (error) {
                    setOk({ ok: -1, evento: evento.nombre });
                });
        }
    });


    const showModalActionClose = () => {
        setOk({ ok: 2, evento: ok.evento });
    };

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="EVENTS.EVENT_MODIFY_OK_STRONG">
                        {t('EVENTS.EVENT_MODIFY_OK_STRONG', { event: ok.evento })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="EVENTS.EVENT_MODIFY_ERROR_STRONG">
                        {t('EVENTS.EVENT_MODIFY_ERROR_STRONG', { event: ok.evento })}
                    </Trans>
                </div>
            );
        } else {
            return (
                <div>&nbsp;</div>
            )
        }
    };

    // pintar formulario de modificación de eventos si se tiene permiso
    return (
        <div className="container">
            { (!administrador && !permisosAcciones['/eventos']['modificar']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ModalAction show={ok.ok === 1}
                header={t('EVENTS.EVENT_REGISTRATION')}
                body={t('EVENTS.EVENT_MODIFY_OK', { event: ok.evento })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('EVENTS.EVENT_REGISTRATION')}
                body={t('EVENTS.EVENT_MODIFY_ERROR', { event: ok.evento })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('EVENTS.EVENT_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit} method="post" encType="multipart/form-data">
                    <div className="form-group">
                        <label>{t('EVENTS.EVENT')} (*):  </label>
                        <TableMultiLanguage
                            languages={evento.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.EVENT_TYPE')} (*):  </label>
                        <SelectValidator name={"TipoEventoId"} isSearchable={true}
                            onChange={handleTipoEventoId}
                            value={tiposevento.filter(({ value }) => value === TipoEventoId)}
                            options={tiposevento}
                            validators={['required']}
                            errorMessages={[t('EVENTS.EVENT_TYPE_EMPTY')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.DATE_START')} (*):  </label>
                        <DatePicker id="fecha_inicio"
                            name="fecha_inicio"
                            selected={fechas.fecha_inicio}
                            onChange={handleChangeFechaInicio}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.DATE_END')} (*):  </label>
                        <DatePicker id="fecha_fin"
                            name="fecha_fin"
                            selected={fechas.fecha_fin}
                            onChange={handleChangeFechaFin}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.IMAGE')} (*):  </label>
                        <div className="form-group">
                            <img id="img" src={fileState} alt="" style={{ width: '50%' }} />
                        </div>

                        <TextValidator
                            type="file"
                            id="imagen"
                            className="form-control"
                            name="imagen"
                            accept=".jpeg, .jpg, .gif, .png"
                            onChange={onChangeEvento}
                        />
                    </div>
                    <div className="form-group">
                        <TextValidator
                            readOnly
                            onChange={() => { return }}
                            type="hidden"
                            name="filehidden"
                            value={fileState}
                            validators={['required']}
                            errorMessages={[t('EVENTS.IMAGE_NOT_VALID')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.COUNTRY')} (*):  </label>
                        <SelectValidator name={"PaisId"} isSearchable={true}
                            onChange={handlePaisId}
                            value={paises.filter(({ value }) => value === PaisId)}
                            options={paises}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PROVINCE')} (*):  </label>
                        <SelectValidator name={"ProvinciaId"} isSearchable={true}
                            onChange={handleProvinciaId}
                            value={provincias.filter(({ id }) => id === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={PaisId > 0 && (provincias.filter((provincia) => provincia.PaisId === PaisId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.CITY')} (*):  </label>
                        <SelectValidator name={"CiudadId"} isSearchable={true}
                            onChange={handleCiudadId}
                            value={ciudades.filter(({ id }) => id === CiudadId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={ProvinciaId > 0 && (ciudades.filter((ciudad) => ciudad.ProvinciaId === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.ADDRESS')} (*):  </label>
                        <TableMultiLanguage
                            languages={evento.direccion_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'direccion', 'direccion_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <label>{t('EVENTS.HOUR')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.hora}
                            name="hora"
                            onChange={onChangeEvento}
                            size="20"
                            maxLength="100"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.CAPACITY')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.aforo}
                            name="aforo"
                            onChange={onChangeEvento}
                            size="50"
                            maxLength="100"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PRICE')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.precio}
                            name="precio"
                            onChange={onChangeEvento}
                            onBlur={onBlurPrecio}
                            size="20"
                            maxLength="100"
                        />
                        <div>
                            <ReactBootstrapSlider
                                id="precio_slider"
                                change={onChangePrecioSlider}
                                value={precios}
                                step={1}
                                max={MAX_PRECIO}
                                min={MIN_PRECIO}
                                ticks={[MIN_PRECIO, MAX_PRECIO]}
                                ticks_labels={[MIN_PRECIO + '', MAX_PRECIO + '']}
                                tooltip="show"
                                tooltip_split={true}
                                orientation="horizontal"
                                reversed={false} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.EXTERNAL_LINK')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={evento.link_externo}
                            name="link_externo"
                            onChange={onChangeEvento}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PRODUCTION')}:  </label>
                        <TableMultiLanguage
                            languages={evento.produccion_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'produccion', 'produccion_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.PARTICIPANTS')}:  </label>
                        <TableMultiLanguage
                            languages={evento.participantes_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'participantes', 'participantes_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('EVENTS.SUMMARY')}:  </label>
                        <TableMultiLanguage
                            languages={evento.resumen_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeEvent(response, 'resumen', 'resumen_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="gratuito"
                                id="gratuito"
                                onChange={onChangeCheckboxGratuito}
                                checked={gratuito}
                            />
                            <label className="form-check-label" htmlFor="gratuito">{t('EVENTS.FREE')} (*):  </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="activo"
                                id="activo"
                                onChange={onChangeCheckboxActivo}
                                checked={activo}
                            />
                            <label className="form-check-label" htmlFor="activo">{t('EVENTS.ACTIVE')} (*):  </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <input type="submit" value={t('EVENTS.EVENT_MODIFY')} disabled={!evento.id} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};
