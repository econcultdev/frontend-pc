/**
 * Mantenimiento de Language
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
 * Componente que implementa los procesos CRUD para language
 */
class Language extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    /**
     * Hay que ser administrador para poder acceder al menú de language.
     * Definición de las rutas del mantenimiento de language
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
                    {t('LANGUAGE.LANGUAGE_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_language" render={() => <LanguageList {...this.props} />} />
                    <Route path="/dg_language/add" component={withAuth(LanguageAdd)} />
                    <Route path="/dg_language/edit/:id" component={withAuth(LanguageEdit)} />
                    <Route path="/dg_language/delete/:id" component={withAuth(LanguageDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(Language);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de language
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
                        <LanguageListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <LanguageAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <LanguageListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <LanguageAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de language
 */
const LanguageListLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_language') }}>
            {t('LANGUAGE.LANGUAGE_LIST')}
        </button>
    );
};

/**
 * Enlace a crear una language
 */
const LanguageAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_language/add') }}>
            {t('LANGUAGE.LANGUAGE_ADD')}
        </button>
    );
};

/**
 * Componente para listar language en una tabla
 */
const LanguageList = ({ history }) => {

    const [language, setLanguage] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");


    /**
     * Borrar language
     * @param {*} row
     */
    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, name: row.row.name });
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
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_language/edit/' + row.row.id) }}>
                            {t('LANGUAGE.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('LANGUAGE.DELETE')}
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
            text: t('LANGUAGE.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('name', 'name_multi'),
            text: t('LANGUAGE.LANGUAGE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: 'show_in_multilanguage_table',
            text: t('LANGUAGE.MULTILANGUAGE_TABLE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: '',
            text: t('LANGUAGE.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger las language
     */
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/language',
                { withCredentials: true })
                .then(response => {
                    setLanguage(response.data);
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
            <Trans i18nKey="LANGUAGE.PAGINATION_TOTAL">
                {t('LANGUAGE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: language,
        totalsize: language.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: language.length === 0,
        withFirstAndLast: true,
        firstPageText: t('LANGUAGE.FIRST_PAGE_TEXT'),
        firstPageTitle: t('LANGUAGE.FIRST_PAGE_TITLE'),
        prePageText: t('LANGUAGE.PRE_PAGE_TEXT'),
        prePageTitle: t('LANGUAGE.PRE_PAGE_TITLE'),
        nextPageText: t('LANGUAGE.NEXT_PAGE_TEXT'),
        nextPageTitle: t('LANGUAGE.NEXT_PAGE_TITLE'),
        lastPageText: t('LANGUAGE.LAST_PAGE_TEXT'),
        lastPageTitle: t('LANGUAGE.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    // campo de ordenación por defecto en la tabla
    const defaultSorted = [{
        dataField: 'name',
        order: 'asc'
    }];

    // cerrar modal de confirmación de borrado
    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }

    // borrado del language
    const handleDelete = () => {
        history.push('/dg_language/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('LANGUAGE.LANGUAGE_DELETE')}
                </ModalHeader>
                <ModalBody>
                    {t('LANGUAGE.LANGUAGE_DELETE')}: {idDelete.name}!
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>
                        {t('LANGUAGE.CLOSE')}
                    </Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('LANGUAGE.DELETE')}
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
                                    data={language}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('LANGUAGE.LANGUAGE_NOT')}
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
const LanguageDelete = ({ history, match }) => {

    // borrar el language y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/language/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_language'))
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
 * Componente para añadir un language
 */
const LanguageAdd = ({ history }) => {

    const [t] = useTranslation("global");
    const [language, setLanguage] = useState({
        id: '',
        name: '',
        name_multi: [],
        order: 0,
        show_in_multilanguage_table: false,
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

                        axios.get(myInitObject.crudServer + '/crud/language/nextorder', { withCredentials: true })
                            .then(response => {
                                if (response.data) {
                                    let lLanguage = _.cloneDeep(language);
                                    lLanguage.order = response.data.nextOrder;
                                    lLanguage.name_multi = _.cloneDeep(responseLanguages.data);
                                    setLanguage(lLanguage);
                                }
                            });
                    }
                });
        },
        [history]
    );

    /**
     * Set value to language
     * @param {*} e Event
     */
    const changeValueLanguageEvent = ((e, param) => {
        let lLanguage = _.cloneDeep(language);
        switch (param) {
            case 'id':
                lLanguage.id = e.target.value;
                break;
            case 'show_in_multilanguage_table':
                lLanguage.show_in_multilanguage_table = !lLanguage.show_in_multilanguage_table;
                break;
            default:
                break;
        }
        setLanguage(lLanguage);
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
                        {t('LANGUAGE.CLOSE')}
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
            title: 'LANGUAGE.LANGUAGE_REGISTRATION',
            body: 'LANGUAGE.LANGUAGE_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setLanguage(objectBase);
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
        setLanguage(lBaseObject);
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
            name: baseObject.name,
            name_multi: baseObject.name_multi2,
            order: baseObject.order,
            show_in_multilanguage_table: baseObject.show_in_multilanguage_table
        }
        return lBaseObject;
    }

    // crear language
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(language);
        let lVariablesObligation = ['name_multi'];
        changeResponseValidation(language, lVariablesObligation);
        transformObjectToMultiLenguage(language, lVariablesObligation);
        if (language && language.valid) {
            let lLanguage = getObjectComplete(language);
            axios.post(myInitObject.crudServer + '/crud/language/add', lLanguage,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'LANGUAGE.LANGUAGE_REGISTRATION',
                        body: 'LANGUAGE.LANGUAGE_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_language/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'name_multi');
                });
        } else {
            showModalError(lObjectClone, 'name_multi');
        }
    });

    // pintar formulario de creación de language
    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('LANGUAGE.LANGUAGE_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('LANGUAGE.ID')} (*):  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={language.id}
                            name="id"
                            onChange={(e) => { changeValueLanguageEvent(e, 'id') }}
                            size="50"
                            maxLength="3"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('LANGUAGE.LANGUAGE')} (*):  </label>
                        <TableMultiLanguage
                            languages={language.name_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, language, 'name', 'name_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="show_in_multilanguage_table"
                            id="show_in_multilanguage_table"
                            onChange={(e) => { changeValueLanguageEvent(e, 'show_in_multilanguage_table') }}
                        />
                        <label className="form-check-label" htmlFor="show_in_multilanguage_table">
                            {t('LANGUAGE.MULTILANGUAGE_TABLE')} (*)
                        </label>
                    </div>
                    <br></br>
                    <div className="form-group">
                        <input type="submit" value={t('LANGUAGE.LANGUAGE_REGISTER')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar un language
 */

const LanguageEdit = ({ history, match }) => {

    const [t] = useTranslation("global");
    const [language, setLanguage] = useState({
        id: 0,
        name: '',
        name_multi: [],
        order: 0,
        show_in_multilanguage_table: false,
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

    // recoger datos del language
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
                        axios.get(myInitObject.crudServer + '/crud/language/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let lVariablesMulti = ['name_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                setLanguage(response.data);
                            }).catch(function (error) {
                                console.error(error);
                            });
                    }
                });
        },
        [history, match]
    );

    /**
     * Set value to language
     * @param {*} e Event
     */
    const changeValueLanguageEvent = ((e, param) => {
        let lLanguage = _.cloneDeep(language);
        switch (param) {
            case 'id':
                lLanguage.id = e.target.value;
                break;
            case 'show_in_multilanguage_table':
                lLanguage.show_in_multilanguage_table = !lLanguage.show_in_multilanguage_table;
                break;
            default:
                break;
        }
        setLanguage(lLanguage);
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
                        {t('LANGUAGE.CLOSE')}
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
            title: 'LANGUAGE.LANGUAGE_REGISTRATION',
            body: 'LANGUAGE.LANGUAGE_MODIFY_ERROR'
        });
        setModalOpen(true);
        setLanguage(objectBase);
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
        setLanguage(lBaseObject);
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
            name: baseObject.name,
            name_multi: baseObject.name_multi2,
            order: baseObject.order,
            show_in_multilanguage_table: baseObject.show_in_multilanguage_table
        }
        return lBaseObject;
    }

    // modificar language
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(language);
        let lVariablesObligation = ['name_multi'];
        changeResponseValidation(language, lVariablesObligation);
        transformObjectToMultiLenguage(language, lVariablesObligation);
        if (language && language.valid) {
            let lLanguage = getObjectComplete(language);
            axios.post(myInitObject.crudServer + '/crud/language/update', lLanguage,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'LANGUAGE.LANGUAGE_REGISTRATION',
                        body: 'LANGUAGE.LANGUAGE_MODIFY_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_language/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'name_multi');
                });
        } else {
            showModalError(lObjectClone, 'name_multi');
        }
    });
    // pintar formulario de modificación del language
    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('LANGUAGE.LANGUAGE_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('LANGUAGE.ID')} (*):  </label>
                        <input
                            type="text"
                            className="form-control"
                            value={language.id}
                            name="id"
                            onChange={(e) => { changeValueLanguageEvent(e, 'id') }}
                            size="50"
                            maxLength="3"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('LANGUAGE.LANGUAGE')} (*):  </label>
                        <TableMultiLanguage
                            languages={language.name_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, language, 'name', 'name_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="show_in_multilanguage_table"
                            id="show_in_multilanguage_table"
                            checked={language.show_in_multilanguage_table}
                            onChange={(e) => { changeValueLanguageEvent(e, 'show_in_multilanguage_table') }}
                        />
                        <label className="form-check-label" htmlFor="show_in_multilanguage_table">
                            {t('LANGUAGE.MULTILANGUAGE_TABLE')} (*)
                        </label>
                    </div>
                    <br></br>
                    <div className="form-group">
                        <input type="submit" value={t('LANGUAGE.LANGUAGE_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

