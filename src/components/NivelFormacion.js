/**
 * Mantenimiento de Niveles de Formación
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

class NivelFormacion extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    render() {
        const { t } = this.props;
        if (!this.props.administrador) {
            return <Redirect to="/backend" />;
        }
        return (
            <React.Fragment>

                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('EDUCATIONLEVEL.EDUCATION_LEVEL_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_nivelformacion" render={() => <NivelFormacionList {...this.props} />} />
                    <Route path="/dg_nivelformacion/add" component={withAuth(NivelFormacionAdd)} />
                    <Route path="/dg_nivelformacion/edit/:id" component={withAuth(NivelFormacionEdit)} />
                    <Route path="/dg_nivelformacion/delete/:id" component={withAuth(NivelFormacionDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};
export default withTranslation('global')(NivelFormacion);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <NivelFormacionListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <NivelFormacionAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <NivelFormacionListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <NivelFormacionAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const NivelFormacionListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_nivelformacion') }}>
            {t('EDUCATIONLEVEL.EDUCATION_LEVEL_LIST')}
        </button>
    );
};

const NivelFormacionAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_nivelformacion/add') }}>
            {t('EDUCATIONLEVEL.EDUCATION_LEVEL_ADD')}
        </button>
    );
};

const NivelFormacionList = ({ history }) => {
    const [nivelformacion, setNivelFormacion] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");

    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, nombre: row.row.nombre });
        setShowDeleteConfirm(true);
    };

    const ActionsFormatter = (row) => {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2"></div>
                    <div className="col-md-4">
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_nivelformacion/edit/' + row.row.id) }} >
                            {t('EDUCATIONLEVEL.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('EDUCATIONLEVEL.DELETE')}
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

    const columns = [
        {
            dataField: 'id',
            text: t('EDUCATIONLEVEL.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('EDUCATIONLEVEL.EDUCATION_LEVEL'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('EDUCATIONLEVEL.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/nivelformacion',
                { withCredentials: true })
                .then(response => {
                    setNivelFormacion(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="EDUCATIONLEVEL.PAGINATION_TOTAL">
                {t('EDUCATIONLEVEL.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: nivelformacion,
        totalsize: nivelformacion.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: nivelformacion.length === 0,
        withFirstAndLast: true,
        firstPageText: t('EDUCATIONLEVEL.FIRST_PAGE_TEXT'),
        firstPageTitle: t('EDUCATIONLEVEL.FIRST_PAGE_TITLE'),
        prePageText: t('EDUCATIONLEVEL.PRE_PAGE_TEXT'),
        prePageTitle: t('EDUCATIONLEVEL.PRE_PAGE_TITLE'),
        nextPageText: t('EDUCATIONLEVEL.NEXT_PAGE_TEXT'),
        nextPageTitle: t('EDUCATIONLEVEL.NEXT_PAGE_TITLE'),
        lastPageText: t('EDUCATIONLEVEL.LAST_PAGE_TEXT'),
        lastPageTitle: t('EDUCATIONLEVEL.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    const defaultSorted = [{
        dataField: 'nombre',
        order: 'asc'
    }];

    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }
    const handleDelete = () => {
        history.push('/dg_nivelformacion/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('EDUCATIONLEVEL.EDUCATION_LEVEL_DELETE')}
                </ModalHeader>
                <ModalBody>{t('EDUCATIONLEVEL.EDUCATION_LEVEL_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('EDUCATIONLEVEL.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('EDUCATIONLEVEL.DELETE')}
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
                                    data={nivelformacion}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('EDUCATIONLEVEL.EDUCATION_LEVEL_NOT_FOUND')}
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

const NivelFormacionDelete = ({ history, match }) => {
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/nivelformacion/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_nivelformacion'))
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


const NivelFormacionAdd = ({ history }) => {
    const [t] = useTranslation("global");
    const [educationLevel, setEducationLevel] = useState({
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
                        let lEducationLevel = _.cloneDeep(educationLevel);
                        lEducationLevel.nombre_multi = _.cloneDeep(responseLanguages.data);
                        setEducationLevel(lEducationLevel);
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
            title: 'EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTRATION',
            body: 'EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setEducationLevel(objectBase);
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
        setEducationLevel(lBaseObject);
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

    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(educationLevel);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(educationLevel, lVariablesObligation);
        transformObjectToMultiLenguage(educationLevel, lVariablesObligation);
        if (educationLevel && educationLevel.valid) {
            let lEducationLevel = getObjectComplete(educationLevel);
            axios.post(myInitObject.crudServer + '/crud/nivelformacion/add', lEducationLevel,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTRATION',
                        body: 'EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_nivelformacion/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'nombre_multi');
                });
        } else {
            showModalError(lObjectClone, 'nombre_multi');
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('EDUCATIONLEVEL.EDUCATION_LEVEL_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('EDUCATIONLEVEL.EDUCATION_LEVEL')} (*):  </label>
                        <TableMultiLanguage
                            languages={educationLevel.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, educationLevel, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTER')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

const NivelFormacionEdit = ({ history, match }) => {
    const [t] = useTranslation("global");
    const [educationLevel, setEducationLevel] = useState({
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
                        axios.get(myInitObject.crudServer + '/crud/nivelformacion/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let lVariablesMulti = ['nombre_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                setEducationLevel(response.data);
                            })
                            .catch(function (error) {
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
            title: 'EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTRATION',
            body: 'EDUCATIONLEVEL.EDUCATION_LEVEL_MODIFY_ERROR'
        });
        setModalOpen(true);
        setEducationLevel(objectBase);
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
        setEducationLevel(lBaseObject);
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

    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(educationLevel);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(educationLevel, lVariablesObligation);
        transformObjectToMultiLenguage(educationLevel, lVariablesObligation);
        if (educationLevel && educationLevel.valid) {
            let lEducationLevel = getObjectComplete(educationLevel);
            axios.post(myInitObject.crudServer + '/crud/nivelformacion/update', lEducationLevel,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'EDUCATIONLEVEL.EDUCATION_LEVEL_REGISTRATION',
                        body: 'EDUCATIONLEVEL.EDUCATION_LEVEL_MODIFY_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_nivelformacion/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone, 'nombre_multi');
                });
        } else {
            showModalError(lObjectClone, 'nombre_multi');
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('EDUCATIONLEVEL.EDUCATION_LEVEL_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('EDUCATIONLEVEL.EDUCATION_LEVEL')} (*):  </label>
                        <TableMultiLanguage
                            languages={educationLevel.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, educationLevel, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('EDUCATIONLEVEL.EDUCATION_LEVEL_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

