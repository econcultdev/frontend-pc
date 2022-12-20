/**
 * Mantenimiento de Provincias
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

class Provincias extends Component {

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
                    {t('PROVINCES.PROVINCES_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_provincias" render={() => <ProvinciasList {...this.props} />} />
                    <Route exact path="/dg_provincias/add" component={withAuth(ProvinciasAdd)} />
                    <Route path="/dg_provincias/add/:id" component={withAuth(ProvinciasAdd)} />
                    <Route path="/dg_provincias/edit/:id" component={withAuth(ProvinciasEdit)} />
                    <Route path="/dg_provincias/delete/:id" component={withAuth(ProvinciasDelete)} />
                </Switch>
            </React.Fragment>
        )
    }
};

export default withTranslation('global')(Provincias);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <ProvinciasListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <ProvinciasAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <ProvinciasListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <ProvinciasAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const ProvinciasListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_provincias') }}>
            {t('PROVINCES.PROVINCES_LIST')}
        </button>
    );
};

const ProvinciasAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_provincias/add') }}>
            {t('PROVINCES.PROVINCES_ADD')}
        </button>
    );
};


const ProvinciasList = ({ history }) => {
    const [provincias, setProvincias] = useState([]);
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
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_provincias/edit/' + row.row.id) }}>
                            {t('PROVINCES.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('PROVINCES.DELETE')}
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
            text: t('PROVINCES.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('PROVINCES.PROVINCE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: getColumnJSONMultilanguage('Pais.nombre', 'Pais.nombre_multi'),
            text: t('PROVINCES.COUNTRY'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('PROVINCES.ACTIONS'),
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
            axios.get(myInitObject.crudServer + '/crud/provincias',
                { withCredentials: true })
                .then(response => {
                    setProvincias(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="PROVINCES.PAGINATION_TOTAL">
                {t('PROVINCES.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: provincias,
        totalsize: provincias.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: provincias.length === 0,
        withFirstAndLast: true,
        firstPageText: t('PROVINCES.FIRST_PAGE_TEXT'),
        firstPageTitle: t('PROVINCES.FIRST_PAGE_TITLE'),
        prePageText: t('PROVINCES.PRE_PAGE_TEXT'),
        prePageTitle: t('PROVINCES.PRE_PAGE_TITLE'),
        nextPageText: t('PROVINCES.NEXT_PAGE_TEXT'),
        nextPageTitle: t('PROVINCES.NEXT_PAGE_TITLE'),
        lastPageText: t('PROVINCES.LAST_PAGE_TEXT'),
        lastPageTitle: t('PROVINCES.LAST_PAGE_TITLE'),
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
        history.push('/dg_provincias/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('PROVINCES.PROVINCE_DELETE')}
                </ModalHeader>
                <ModalBody>{t('PROVINCES.PROVINCE_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('PROVINCES.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('PROVINCES.DELETE')}
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
                                    data={provincias}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('PROVINCES.PROVINCES_NO')}
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




const ProvinciasDelete = ({ history, match }) => {

    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/provincias/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_provincias'))
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




const ProvinciasAdd = ({ history, match }) => {

    const [t] = useTranslation("global");
    const [Paises, setPaises] = useState([]);
    const [PaisId, setPaisId] = useState((match.params.id !== undefined) ? parseInt(match.params.id, 10) : 0);
    const [province, setProvince] = useState({
        nombre: '',
        nombre_multi: [],
        PaisId: 0,
        valid: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

    useEffect(
        () => {
            if (match.params.id !== undefined) {
                setPaisId(parseInt(match.params.id, 10));
            }
            axios.get(myInitObject.crudServer + '/crud/paises',
                { withCredentials: true })
                .then(response => {
                    setPaises(response.data.map(element => {
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
                        let lProvince = _.cloneDeep(province);
                        lProvince.nombre_multi = _.cloneDeep(responseLanguages.data);
                        setProvince(lProvince);
                    }
                });
        },
        [history, match]
    );

    const onChangePaisId = ((e) => {
        setPaisId(e.value);
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
                        {t('PROVINCES.CLOSE')}
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
            title: 'PROVINCES.PROVINCE_REGISTER_TITLE',
            body: 'PROVINCES.PROVINCE_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setProvince(objectBase);
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
        setProvince(lBaseObject);
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
            PaisId: PaisId
        }
        return lBaseObject;
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(province);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(province, lVariablesObligation);
        transformObjectToMultiLenguage(province, lVariablesObligation);
        if (province && province.valid) {
            let lProvince = getObjectComplete(province);
            axios.post(myInitObject.crudServer + '/crud/provincias/add', lProvince,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'PROVINCES.PROVINCE_REGISTER_TITLE',
                        body: 'PROVINCES.PROVINCE_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_provincias/');
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
                <h3>{t('PROVINCES.PROVINCE_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label title={t('PROVINCES.PROVINCE_ADD_MORE')}>{t('PROVINCES.PROVINCE')} (*):  </label>
                        <TableMultiLanguage
                            languages={province.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, province, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('PROVINCES.COUNTRIES')} (*):  </label>
                        <SelectValidator name={"PaisId"} isSearchable={true} onChange={onChangePaisId}
                            value={Paises.filter(({ value }) => value === PaisId)}
                            options={Paises}
                            validators={['required']}
                            errorMessages={[t('PROVINCES.COUNTRY_SELECT')]}
                        />
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('PROVINCES.PROVINCES_REGISTER')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};




const ProvinciasEdit = ({ history, match }) => {
    const [t] = useTranslation("global");
    const [Paises, setPaises] = useState([]);
    const [province, setProvince] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
        PaisId: 0,
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
                        axios.get(myInitObject.crudServer + '/crud/provincias/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                axios.get(myInitObject.crudServer + '/crud/paises',
                                    { withCredentials: true })
                                    .then(responseP => {
                                        let lVariablesMulti = ['nombre_multi'];
                                        lVariablesMulti.map(vMulti => {
                                            let lLanguage = _.cloneDeep(responseLanguages.data);
                                            let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                            response.data[vMulti] = lValues;
                                        });
                                        setProvince(response.data);
                                        setPaises(responseP.data.map(element => {
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

    const onChangePaisId = ((e) => {
        let lProvince = _.cloneDeep(province);
        lProvince.PaisId = e.value;
        setProvince(lProvince)
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
                        {t('PROVINCES.CLOSE')}
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
            title: 'PROVINCES.PROVINCE_REGISTER_TITLE',
            body: 'PROVINCES.PROVINCE_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setProvince(objectBase);
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
        setProvince(lBaseObject);
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
            PaisId: baseObject.PaisId
        }
        return lBaseObject;
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(province);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(province, lVariablesObligation);
        transformObjectToMultiLenguage(province, lVariablesObligation);
        if (province && province.valid) {
            let lProvince = getObjectComplete(province);
            axios.post(myInitObject.crudServer + '/crud/provincias/update', lProvince,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'PROVINCES.PROVINCE_REGISTER_TITLE',
                        body: 'PROVINCES.PROVINCE_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_provincias/');
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
                <h3>{t('PROVINCES.PROVINCE_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('PROVINCES.PROVINCE')} (*):  </label>
                        <TableMultiLanguage
                            languages={province.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, province, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('PROVINCES.COUNTRIES')} (*):  </label>
                        <SelectValidator name={"PaisId"}
                            value={Paises.filter(({ value }) => value === province.PaisId)}
                            isSearchable={true} options={Paises} onChange={onChangePaisId}
                            validators={['required']}
                            errorMessages={[t('PROVINCES.COUNTRY_SELECT')]} />
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('PROVINCES.PROVINCE_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

