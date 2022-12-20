/**
 * Mantenimiento de Ciudades
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
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { ValidatorForm } from 'react-form-validator-core';
import SelectValidator from './SelectValidator';
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from './table-multi-language/TableMultiLanguage';

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

/**
 * Componente que implementa los procesos CRUD para ciudades
 */
class Ciudades extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    /**
     * Hay que ser administrador para poder acceder al menú de ciudades.
     * Definición de las rutas del mantenimiento de ciudades
     */
    render() {
        const { t } = this.props;
        if (!this.props.administrador) {
            return <Redirect to="/backend" />;
        }
        return (
            <React.Fragment>

                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('CITIES.CITIES_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_ciudades" render={() => <CiudadesList {...this.props} />} />
                    <Route exact path="/dg_ciudades/add" component={withAuth(CiudadesAdd)} />
                    <Route path="/dg_ciudades/add/:id" component={withAuth(CiudadesAdd)} />
                    <Route path="/dg_ciudades/edit/:id" component={withAuth(CiudadesEdit)} />
                    <Route path="/dg_ciudades/delete/:id" component={withAuth(CiudadesDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};
export default withTranslation('global')(Ciudades);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de ciudades
 *
 */
const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <CiudadesListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <CiudadesAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <CiudadesListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <CiudadesAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de ciudades
 */
const CiudadesListLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_ciudades') }}>{t('CITIES.CITIES_LIST')}</button>
    );
};

/**
 * Enlace a crear una ciudad
 */
const CiudadesAddLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_ciudades/add') }}>{t('CITIES.CITIES_ADD')}</button>
    );
};


/**
 * Componente para listar ciudades en una tabla
 */
const CiudadesList = ({ history }) => {
    const [ciudades, setCiudades] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const { t } = useTranslation("global");

    /**
     * Borrar ciudad
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
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2"></div>
                    <div className="col-md-4">
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_ciudades/edit/' + row.row.id) }}>{t('CITIES.EDIT')}</button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>{t('CITIES.DELETE')}</button>
                    </div>
                </div>
            </div>
        );
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
            text: 'ID',
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('CITIES.CITY'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: getColumnJSONMultilanguage('Provincia.nombre', 'Provincia.nombre_multi'),
            text: t('CITIES.PROVINCE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('CITIES.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger las ciudades
     */
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/ciudades',
                { withCredentials: true })
                .then(response => {
                    setCiudades(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    // paginado de la tabla
    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="CITIES.PAGINATION_TOTAL">
                {t('CITIES.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: ciudades,
        totalsize: ciudades.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: ciudades.length === 0,
        withFirstAndLast: true,
        firstPageText: t('CITIES.FIRST_PAGE_TEXT'),
        firstPageTitle: t('CITIES.FIRST_PAGE_TITLE'),
        prePageText: t('CITIES.PRE_PAGE_TEXT'),
        prePageTitle: t('CITIES.PRE_PAGE_TITLE'),
        nextPageText: t('CITIES.NEXT_PAGE_TEXT'),
        nextPageTitle: t('CITIES.NEXT_PAGE_TITLE'),
        lastPageText: t('CITIES.LAST_PAGE_TEXT'),
        lastPageTitle: t('CITIES.LAST_PAGE_TITLE'),
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

    // borrado de la ciudad
    const handleDelete = () => {
        history.push('/dg_ciudades/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('CITIES.DELETE')} {t('CITIES.CITY')}
                </ModalHeader>
                <ModalBody>{t('CITIES.DELETE')} {t('CITIES.CITY')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('CITIES.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('CITIES.DELETE')}
                    </button>
                </ModalFooter>
            </Modal>

            <ListLinks history={history} action="list" />
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
                                    data={ciudades}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('CITIES.CITIES_NOT')}
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
 * Componente de borrado de ciudades
 */
const CiudadesDelete = ({ history, match }) => {

    // borrar la ciudad y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/ciudades/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_ciudades'))
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history, match]
    );

    return (
        <ListLinks history={history} action="delete" />
    );
};



/**
 * Componente para añadir una ciudad
 * Si se pasa un id, se asigna la provincia a ese id
 */
const CiudadesAdd = ({ history, match }) => {
    const [t] = useTranslation("global");
    const [Provincias, setProvincias] = useState([]);
    const [ProvinciaId, setProvinciaId] = useState((match.params.id !== undefined) ? parseInt(match.params.id, 10) : 0);
    const [city, setCity] = useState({
        nombre: '',
        nombre_multi: [],
        ProvinciaId: 0,
        valid: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

    // recoger provincias para mostrarlas en un combo
    useEffect(
        () => {
            if (match.params.id !== undefined) {
                setProvinciaId(parseInt(match.params.id, 10));
            }
            axios.get(myInitObject.crudServer + '/crud/provincias',
                { withCredentials: true })
                .then(response => {
                    setProvincias(response.data.map(element => {
                        return {
                            value: element.id,
                            label: element.nombre_multi[languageI18N] ? element.nombre_multi[languageI18N] : element.nombre
                        }
                    }));
                })
                .catch(function (error) {
                    console.error(error);
                })

            axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                .then(responseLanguages => {
                    if (responseLanguages.data && responseLanguages.data.length > 0) {
                        responseLanguages.data.map(d => {
                            d.value = d.id;
                            d.label = d.name;
                            return d;
                        });
                        let lCity = _.cloneDeep(city);
                        lCity.nombre_multi = _.cloneDeep(responseLanguages.data);
                        setCity(lCity);
                    }
                });
        },
        [history, match]
    );

    // cambia la provincia
    const onChangeProvinciaId = ((e) => {
        setProvinciaId(e.value);
    });

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
                        {t('CITIES.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal error
     * @param {*} objectBase Object base
     * @param {*} variable Variable multilanguage
     */
    const showModalError = (objectBase, variable) => {
        setShowModalMessage({
            title: 'CITIES.CITY_REGISTRATION',
            body: 'CITIES.CITY_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setCity(objectBase);
    }

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     * @param {*} baseObject Base Object
     * @param {*} singleVariable Variable not contains multilanguage
     * @param {*} multiVariable Multilanguage variable
     */
    const changeValuesMultilanguages = (response, baseObject, singleVariable, multiVariable) => {
        let lBaseObject = _.cloneDeep(baseObject);
        lBaseObject[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lBaseObject[singleVariable] = rp.multilanguage;
            }
        });
        setCity(lBaseObject);
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
     * @param {*} baseObject Base Object
     * @param {*} variablesMulti Multilanguage variable
     */
    const transformObjectToMultiLenguage = (baseObject, variablesMulti) => {
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(baseObject[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            baseObject[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} baseObject Base object
     * @param {*} listAttributesObligation List of obligation attributes
     */
    const changeResponseValidation = (baseObject, listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!baseObject[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                baseObject.valid = false;
                break;
            } else {
                baseObject.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} baseObject Base Object
     * @returns 
     */
    const getObjectComplete = (baseObject) => {
        let lBaseObject = {
            nombre: baseObject.nombre,
            nombre_multi: baseObject.nombre_multi2,
            ProvinciaId: ProvinciaId
        }
        return lBaseObject;
    }

    // crear la ciudad
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(city);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(city, lVariablesObligation);
        transformObjectToMultiLenguage(city, lVariablesObligation);
        if (city && city.valid) {
            let lCity = getObjectComplete(city);
            axios.post(myInitObject.crudServer + '/crud/ciudades/add', lCity,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'CITIES.CITY_REGISTRATION',
                        body: 'CITIES.CITY_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_ciudades/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'nombre_multi');
                });
        } else {
            showModalError(lObjectClone, 'nombre_multi');
        }
    });

    // pintar formulario de creación de la ciudad
    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('CITIES.CITY_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label title={t('CITIES.CITY_ADD_MORE')}>{t('CITIES.CITY')} (*):  </label>
                        <TableMultiLanguage
                            languages={city.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, city, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('CITIES.PROVINCE')} (*):  </label>
                        <SelectValidator name={"ProvinciaId"} isSearchable={true}
                            value={Provincias.filter(({ value }) => value === ProvinciaId)}
                            options={Provincias} onChange={onChangeProvinciaId}
                            validators={['required']}
                            errorMessages={[t('CITIES.PROVINCE_REQUIRED_SELECTION')]}
                            placeholder={t('CITIES.PROVINCE_REQUIRED_SELECTION')}
                        />
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('CITIES.CITY_REGISTRATION')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar una ciudad
 */
const CiudadesEdit = ({ history, match }) => {

    const [t] = useTranslation("global");
    const [Provincias, setProvincias] = useState([]);
    const [city, setCity] = useState({
        nombre: '',
        nombre_multi: [],
        ProvinciaId: 0,
        valid: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

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

    // recoger datos de la ciudad y de las provincias
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
                        axios.get(myInitObject.crudServer + '/crud/ciudades/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                axios.get(myInitObject.crudServer + '/crud/provincias',
                                    { withCredentials: true })
                                    .then(responseP => {
                                        let lVariablesMulti = ['nombre_multi'];
                                        lVariablesMulti.map(vMulti => {
                                            let lLanguage = _.cloneDeep(responseLanguages.data);
                                            let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                            response.data[vMulti] = lValues;
                                        });
                                        setCity(response.data);
                                        setProvincias(responseP.data.map(element => {
                                            return {
                                                value: element.id,
                                                label: element.nombre_multi[languageI18N] ? element.nombre_multi[languageI18N] : element.nombre
                                            }
                                        }));
                                    })
                                    .catch(function (error) {
                                        console.error(error);
                                    });
                            })
                            .catch(function (error) {
                                console.error(error);
                            });
                    }
                });
        },
        [history, match]
    );

    const onChangeProvinciaId = ((e) => {
        let lCity = _.cloneDeep(city);
        lCity.ProvinciaId = e.value;
        setCity(lCity)
    });

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
                        {t('CITIES.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal error
     * @param {*} objectBase Object base
     * @param {*} variable Variable multilanguage
     */
    const showModalError = (objectBase, variable) => {
        setShowModalMessage({
            title: 'CITIES.CITY_REGISTRATION',
            body: 'CITIES.CITY_MODIFICATION_ERROR'
        });
        setModalOpen(true);
        setCity(objectBase);
    }

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     * @param {*} baseObject Base Object
     * @param {*} singleVariable Variable not contains multilanguage
     * @param {*} multiVariable Multilanguage variable
     */
    const changeValuesMultilanguages = (response, baseObject, singleVariable, multiVariable) => {
        let lBaseObject = _.cloneDeep(baseObject);
        lBaseObject[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lBaseObject[singleVariable] = rp.multilanguage;
            }
        });
        setCity(lBaseObject);
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
     * @param {*} baseObject Base Object
     * @param {*} variablesMulti Multilanguage variable
     */
    const transformObjectToMultiLenguage = (baseObject, variablesMulti) => {
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(baseObject[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            baseObject[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} baseObject Base object
     * @param {*} listAttributesObligation List of obligation attributes
     */
    const changeResponseValidation = (baseObject, listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!baseObject[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                baseObject.valid = false;
                break;
            } else {
                baseObject.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} baseObject Base Object
     * @returns 
     */
    const getObjectComplete = (baseObject) => {
        let lBaseObject = {
            id: baseObject.id,
            nombre: baseObject.nombre,
            nombre_multi: baseObject.nombre_multi2,
            ProvinciaId: baseObject.ProvinciaId
        }
        return lBaseObject;
    }

    // modificar ciudad
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(city);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(city, lVariablesObligation);
        transformObjectToMultiLenguage(city, lVariablesObligation);
        if (city && city.valid) {
            let lCity = getObjectComplete(city);
            axios.post(myInitObject.crudServer + '/crud/ciudades/update', lCity,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'CITIES.CITY_REGISTRATION',
                        body: 'CITIES.CITY_MODIFICATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_ciudades/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'nombre_multi');
                });
        } else {
            showModalError(lObjectClone, 'nombre_multi');
        }
    });

    // pintar formulario de modificación de la ciudad
    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('CITIES.EDIT')} {t('CITIES.CITY')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('CITIES.CITY')} (*):  </label>
                        <TableMultiLanguage
                            languages={city.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, city, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('CITIES.PROVINCE')} (*):  </label>
                        <SelectValidator name={"ProvinciaId"}
                            value={Provincias.filter(({ value }) => value === city.ProvinciaId)}
                            isSearchable={true} options={Provincias} onChange={onChangeProvinciaId}
                            validators={['required']}
                            errorMessages={[t('CITIES.PROVINCE_REQUIRED_SELECTION')]}
                            placeholder={t('CITIES.PROVINCE_REQUIRED_SELECTION')}
                        />
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('CITIES.CITY_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

