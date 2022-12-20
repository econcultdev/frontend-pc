/**
 * Mantenimiento de Ingresos
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
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from './table-multi-language/TableMultiLanguage';

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

/**
 * Componente que implementa los procesos CRUD para ingresos
 */
class Ingresos extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    /**
     * Hay que ser administrador para poder acceder al menú de ingresos.
     * Definición de las rutas del mantenimiento de ingresos
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
                    {t('INCOMES.INCOME_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_ingresos" render={() => <IngresosList {...this.props} />} />
                    <Route path="/dg_ingresos/add" component={withAuth(IngresosAdd)} />
                    <Route path="/dg_ingresos/edit/:id" component={withAuth(IngresosEdit)} />
                    <Route path="/dg_ingresos/delete/:id" component={withAuth(IngresosDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(Ingresos);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de ingresos
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
                        <IngresosListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <IngresosAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <IngresosListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <IngresosAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de ingresos
 */
const IngresosListLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_ingresos') }}>
            {t('INCOMES.INCOME_LIST')}
        </button>
    );
};

/**
 * Enlace a crear una ingreso
 */
const IngresosAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_ingresos/add') }}>
            {t('INCOMES.INCOME_ADD')}
        </button>
    );
};

/**
 * Componente para listar ingresos en una tabla
 */
const IngresosList = ({ history }) => {

    const [ingresos, setIngresos] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");


    /**
     * Borrar ingreso
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
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_ingresos/edit/' + row.row.id) }}>
                            {t('INCOMES.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('INCOMES.DELETE')}
                        </button>
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
            text: t('INCOMES.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('INCOMES.INCOME'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('INCOMES.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger las ingresos
     */
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/ingresos',
                { withCredentials: true })
                .then(response => {
                    setIngresos(response.data);
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
            <Trans i18nKey="INCOMES.PAGINATION_TOTAL">
                {t('INCOMES.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: ingresos,
        totalsize: ingresos.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: ingresos.length === 0,
        withFirstAndLast: true,
        firstPageText: t('INCOMES.FIRST_PAGE_TEXT'),
        firstPageTitle: t('INCOMES.FIRST_PAGE_TITLE'),
        prePageText: t('INCOMES.PRE_PAGE_TEXT'),
        prePageTitle: t('INCOMES.PRE_PAGE_TITLE'),
        nextPageText: t('INCOMES.NEXT_PAGE_TEXT'),
        nextPageTitle: t('INCOMES.NEXT_PAGE_TITLE'),
        lastPageText: t('INCOMES.LAST_PAGE_TEXT'),
        lastPageTitle: t('INCOMES.LAST_PAGE_TITLE'),
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

    // borrado del ingreso
    const handleDelete = () => {
        history.push('/dg_ingresos/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('INCOMES.INCOME_DELETE')}
                </ModalHeader>
                <ModalBody>
                    {t('INCOMES.INCOME_DELETE')}: {idDelete.nombre}!
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>
                        {t('INCOMES.CLOSE')}
                    </Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('INCOMES.DELETE')}
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
                                    data={ingresos}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('INCOMES.INCOMES_NOT')}
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
const IngresosDelete = ({ history, match }) => {

    // borrar el ingreso y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/ingresos/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_ingresos'))
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
 * Componente para añadir un ingreso
 */
const IngresosAdd = ({ history }) => {

    const [t] = useTranslation("global");
    const [income, setIncome] = useState({
        nombre: '',
        nombre_multi: [],
        valid: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

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
                        let lIncome = _.cloneDeep(income);
                        lIncome.nombre_multi = _.cloneDeep(responseLanguages.data);
                        setIncome(lIncome);
                    }
                });
        },
        [history]
    );

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
                        {t('INCOMES.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal error
     * @param {*} objectBase Object base
     */
    const showModalError = (objectBase) => {
        setShowModalMessage({
            title: 'INCOMES.INCOME_REGISTRATION',
            body: 'INCOMES.INCOME_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setIncome(objectBase);
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
        setIncome(lBaseObject);
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
            nombre_multi: baseObject.nombre_multi2
        }
        return lBaseObject;
    }

    // crear ingreso
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(income);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(income, lVariablesObligation);
        transformObjectToMultiLenguage(income, lVariablesObligation);
        if (income && income.valid) {
            let lIncome = getObjectComplete(income);
            axios.post(myInitObject.crudServer + '/crud/ingresos/add', lIncome,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'INCOMES.INCOME_REGISTRATION',
                        body: 'INCOMES.INCOME_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_ingresos/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'nombre_multi');
                });
        } else {
            showModalError(lObjectClone, 'nombre_multi');
        }
    });

    // pintar formulario de creación de ingreso
    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('INCOMES.INCOME_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('INCOMES.INCOME')} (*):  </label>
                        <TableMultiLanguage
                            languages={income.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, income, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('INCOMES.INCOME_REGISTER')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar un ingreso
 */

const IngresosEdit = ({ history, match }) => {

    const [t] = useTranslation("global");
    const [income, setIncome] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
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

    // recoger datos del ingreso
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
                        axios.get(myInitObject.crudServer + '/crud/ingresos/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let lVariablesMulti = ['nombre_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                setIncome(response.data);
                            }).catch(function (error) {
                                console.error(error);
                            });
                    }
                });
        },
        [history, match]
    );



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
                        {t('INCOMES.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal error
     * @param {*} objectBase Object base
     */
    const showModalError = (objectBase) => {
        setShowModalMessage({
            title: 'INCOMES.INCOME_REGISTRATION',
            body: 'INCOMES.INCOME_MODIFY_ERROR'
        });
        setModalOpen(true);
        setIncome(objectBase);
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
        setIncome(lBaseObject);
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
            nombre_multi: baseObject.nombre_multi2
        }
        return lBaseObject;
    }

    // modificar ingreso
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(income);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(income, lVariablesObligation);
        transformObjectToMultiLenguage(income, lVariablesObligation);
        if (income && income.valid) {
            let lIncome = getObjectComplete(income);
            axios.post(myInitObject.crudServer + '/crud/ingresos/update', lIncome,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'INCOMES.INCOME_REGISTRATION',
                        body: 'INCOMES.INCOME_MODIFY_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_ingresos/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'nombre_multi');
                });
        } else {
            showModalError(lObjectClone, 'nombre_multi');
        }
    });
    // pintar formulario de modificación del ingreso
    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('INCOMES.INCOME_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('INCOMES.INCOME')} (*):  </label>
                        <TableMultiLanguage
                            languages={income.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, income, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('INCOMES.INCOME_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

