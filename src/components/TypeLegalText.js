/**
 * Mantenimiento de Tipos de Preguntas
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

class TypeLegalText extends Component {

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
                    {t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/typelegaltext" render={() => <TypeLegalTextsList {...this.props} />} />
                    <Route path="/typelegaltext/add" component={withAuth(TypeLegalTextsAdd)} />
                    <Route path="/typelegaltext/edit/:id" component={withAuth(TypeLegalTextsEdit)} />
                    <Route path="/typelegaltext/delete/:id" component={withAuth(TypeLegalTextsDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(TypeLegalText);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <TypeLegalTextsListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <TypeLegalTextsAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <TypeLegalTextsListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <TypeLegalTextsAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const TypeLegalTextsListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/typelegaltext') }}>
            {t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_LIST')}
        </button>
    );
};

const TypeLegalTextsAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/typelegaltext/add') }}>
            {t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_ADD')}
        </button>
    );
};


const TypeLegalTextsList = ({ history }) => {
    const [typelegaltext, setTypeLegalTexts] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");

    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, name: row.row.name[languageI18N] });
        setShowDeleteConfirm(true);
    };

    const ActionsFormatter = (row) => {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2"></div>
                    <div className="col-md-4">
                        <button className="btn btn-primary" onClick={() => { history.push('/typelegaltext/edit/' + row.row.id) }}>
                            {t('TYPELEGALTEXT.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('TYPELEGALTEXT.DELETE')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

    const getColumnJSONMultilanguage = (columnMulti) => {
        if (languageI18N) {
            return columnMulti + '.' + languageI18N;
        } else {
            return columnMulti + '.en';
        }
    }

    const columns = [
        {
            dataField: 'id',
            text: t('TYPELEGALTEXT.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('name'),
            text: t('TYPELEGALTEXT.TYPE_LEGAL_TEXT'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('TYPELEGALTEXT.ACTIONS'),
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
            axios.get(myInitObject.crudServer + '/crud/typelegaltext',
                { withCredentials: true })
                .then(response => {
                    setTypeLegalTexts(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="TYPELEGALTEXT.PAGINATION_TOTAL">
                {t('TYPELEGALTEXT.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: typelegaltext,
        totalsize: typelegaltext.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: typelegaltext.length === 0,
        withFirstAndLast: true,
        firstPageText: t('TYPELEGALTEXT.FIRST_PAGE_TEXT'),
        firstPageTitle: t('TYPELEGALTEXT.FIRST_PAGE_TITLE'),
        prePageText: t('TYPELEGALTEXT.PRE_PAGE_TEXT'),
        prePageTitle: t('TYPELEGALTEXT.PRE_PAGE_TITLE'),
        nextPageText: t('TYPELEGALTEXT.NEXT_PAGE_TEXT'),
        nextPageTitle: t('TYPELEGALTEXT.NEXT_PAGE_TITLE'),
        lastPageText: t('TYPELEGALTEXT.LAST_PAGE_TEXT'),
        lastPageTitle: t('TYPELEGALTEXT.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    const defaultSorted = [{
        dataField: 'tipo',
        order: 'asc'
    }];

    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }
    const handleDelete = () => {
        history.push('/typelegaltext/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">
            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_DELETE')}
                </ModalHeader>
                <ModalBody>{t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_DELETE')}: {idDelete.name}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('TYPELEGALTEXT.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('TYPELEGALTEXT.DELETE')}
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
                                    data={typelegaltext}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_NO')}
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


const TypeLegalTextsDelete = ({ history, match }) => {

    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/typelegaltext/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/typelegaltext'))
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


const TypeLegalTextsAdd = ({ history }) => {

    const [t] = useTranslation("global");
    const [typeLegalText, setTypeLegalText] = useState({
        name: [],
        valid: false
    });
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
                        {t('TYPELEGALTEXT.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
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
                        let lTypeLegalText = _.cloneDeep(typeLegalText);
                        lTypeLegalText.name = _.cloneDeep(responseLanguages.data);
                        setTypeLegalText(lTypeLegalText);
                    }
                });
        },
        [history, t]
    );

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesTypeLegalText = (response, multiVariable) => {
        let lTypeLegalText = _.cloneDeep(typeLegalText);
        lTypeLegalText[multiVariable] = response;
        setTypeLegalText(lTypeLegalText);
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
        let variablesMulti = ['name'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(typeLegalText[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            typeLegalText[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!typeLegalText[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                typeLegalText.valid = false;
                break;
            } else {
                typeLegalText.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getTypeLegalTextObject2Add = () => {
        let lTypeLegalText = {
            name: typeLegalText.name2
        }
        return lTypeLegalText;
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        let lTypeLegalTextClone = _.cloneDeep(typeLegalText);
        changeResponseValidation(['name']);
        transformEventToMultiLenguage();
        if (typeLegalText && typeLegalText.valid) {
            let lTypeLegalText = getTypeLegalTextObject2Add();
            axios.post(myInitObject.crudServer + '/crud/typelegaltext/add', lTypeLegalText,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION',
                        body: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION_OK', object: { typeLegalText: lTypeLegalText.name[languageI18N] }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/typelegaltext/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    setShowModalMessage({
                        title: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION',
                        body: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION_ERROR', object: { typeLegalText: lTypeLegalTextClone.name[languageI18N] }
                    });
                    setModalOpen(true);
                    setTypeLegalText(lTypeLegalTextClone);
                });
        } else {
            setShowModalMessage({
                title: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION',
                body: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION_ERROR', object: { typeLegalText: lTypeLegalTextClone.name[languageI18N] }
            });
            setModalOpen(true);
            setTypeLegalText(lTypeLegalTextClone);
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('TYPELEGALTEXT.TYPE_LEGAL_TEXT')} (*):  </label>
                        <TableMultiLanguage
                            languages={typeLegalText.name}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeLegalText(response, 'name')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <input type="submit" value={t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTER')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

const TypeLegalTextsEdit = ({ history, match }) => {

    const [t] = useTranslation("global");
    const [typeLegalText, setTypeLegalText] = useState({
        id: 0,
        name: [],
        valid: false
    });
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
                        {t('TYPELEGALTEXT.CLOSE')}
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

                        axios.get(myInitObject.crudServer + '/crud/typelegaltext/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let lVariablesMulti = ['name'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                setTypeLegalText(response.data);
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
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesTypeLegalText = (response, multiVariable) => {
        let lTypeLegalText = _.cloneDeep(typeLegalText);
        lTypeLegalText[multiVariable] = response;
        setTypeLegalText(lTypeLegalText);
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
        let variablesMulti = ['name'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(typeLegalText[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            typeLegalText[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!typeLegalText[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                typeLegalText.valid = false;
                break;
            } else {
                typeLegalText.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getTypeLegalTextObject2Add = () => {
        let lTypeLegalText = {
            id: typeLegalText.id,
            name: typeLegalText.name2
        }
        return lTypeLegalText;
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        let lTypeLegalTextClone = _.cloneDeep(typeLegalText);
        changeResponseValidation(['name']);
        transformEventToMultiLenguage();
        if (typeLegalText && typeLegalText.valid) {
            let lTypeLegalText = getTypeLegalTextObject2Add();
            axios.post(myInitObject.crudServer + '/crud/typelegaltext/update', lTypeLegalText,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION',
                        body: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_REGISTRATION_OK', object: { typeLegalText: lTypeLegalText.name[languageI18N] }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/typelegaltext/');
                    }, 2000);
                }).catch(function (error) {
                    console.error(error)
                    setShowModalMessage({
                        title: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_MODIFICATION',
                        body: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_MODIFY_ERROR', object: { typeLegalText: lTypeLegalTextClone.name[languageI18N] }
                    });
                    setModalOpen(true);
                    setTypeLegalText(lTypeLegalTextClone);
                });
        } else {
            setShowModalMessage({
                title: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_MODIFICATION',
                body: 'TYPELEGALTEXT.TYPE_LEGAL_TEXT_MODIFY_ERROR', object: { typeLegalText: lTypeLegalTextClone.name[languageI18N] }
            });
            setModalOpen(true);
            setTypeLegalText(lTypeLegalTextClone);
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('TYPELEGALTEXT.TYPE_LEGAL_TEXT')} (*):  </label>
                        <TableMultiLanguage
                            languages={typeLegalText.name}
                            onChange={(response) =>
                                changeValuesMultilanguagesTypeLegalText(response, 'name')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <input type="submit" value={t('TYPELEGALTEXT.TYPE_LEGAL_TEXT_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

