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
import TextValidator from './TextValidator';

import ModalAction from './ModalAction';
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

class TipoPreguntas extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        // unsubscribe to ensure no memory leaks
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
                    {t('QUESTIONTYPE.QUESTION_TYPE_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_tipopregunta" render={() => <TipoPreguntasList {...this.props} />} />
                    <Route path="/dg_tipopregunta/add" component={withAuth(TipoPreguntasAdd)} />
                    <Route path="/dg_tipopregunta/edit/:id" component={withAuth(TipoPreguntasEdit)} />
                    <Route path="/dg_tipopregunta/delete/:id" component={withAuth(TipoPreguntasDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(TipoPreguntas);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <TipoPreguntasListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <TipoPreguntasAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <TipoPreguntasListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <TipoPreguntasAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const TipoPreguntasListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_tipopregunta') }}>
            {t('QUESTIONTYPE.QUESTION_TYPE_LIST')}
        </button>
    );
};

const TipoPreguntasAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_tipopregunta/add') }}>
            {t('QUESTIONTYPE.QUESTION_TYPE_ADD')}
        </button>
    );
};


const TipoPreguntasList = ({ history }) => {
    const [tipopreguntas, setTipoPreguntas] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");

    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, tipo: row.row.tipo });
        setShowDeleteConfirm(true);
    };

    const ActionsFormatter = (row) => {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2"></div>
                    <div className="col-md-4">
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_tipopregunta/edit/' + row.row.id) }}>
                            {t('QUESTIONTYPE.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('QUESTIONTYPE.DELETE')}
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
            text: t('QUESTIONTYPE.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('tipo', 'tipo_multi'),
            text: t('QUESTIONTYPE.QUESTION_TYPE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('QUESTIONTYPE.ACTIONS'),
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
            axios.get(myInitObject.crudServer + '/crud/tipopreguntas',
                { withCredentials: true })
                .then(response => {
                    setTipoPreguntas(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="QUESTIONTYPE.PAGINATION_TOTAL">
                {t('QUESTIONTYPE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: tipopreguntas,
        totalsize: tipopreguntas.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: tipopreguntas.length === 0,
        withFirstAndLast: true,
        firstPageText: t('QUESTIONTYPE.FIRST_PAGE_TEXT'),
        firstPageTitle: t('QUESTIONTYPE.FIRST_PAGE_TITLE'),
        prePageText: t('QUESTIONTYPE.PRE_PAGE_TEXT'),
        prePageTitle: t('QUESTIONTYPE.PRE_PAGE_TITLE'),
        nextPageText: t('QUESTIONTYPE.NEXT_PAGE_TEXT'),
        nextPageTitle: t('QUESTIONTYPE.NEXT_PAGE_TITLE'),
        lastPageText: t('QUESTIONTYPE.LAST_PAGE_TEXT'),
        lastPageTitle: t('QUESTIONTYPE.LAST_PAGE_TITLE'),
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
        history.push('/dg_tipopregunta/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('QUESTIONTYPE.QUESTION_TYPE_DELETE')}
                </ModalHeader>
                <ModalBody>{t('QUESTIONTYPE.QUESTION_TYPE_DELETE')}: {idDelete.tipo}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('QUESTIONTYPE.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('QUESTIONTYPE.DELETE')}
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
                                    data={tipopreguntas}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('QUESTIONTYPE.QUESTION_TYPE_NO')}
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


const TipoPreguntasDelete = ({ history, match }) => {

    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/tipopreguntas/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_tipopregunta'))
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


const TipoPreguntasAdd = ({ history }) => {

    const [questionType, setQuestionType] = useState({
        tipo: '',
        tipo_multi: [],
        impact: false,
        globalSatisfaction: false,
        valid: false
    });
    const [ok, setOk] = useState({ ok: 0, tipopregunta: '' });
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
                        {t('QUESTIONTYPE.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK_STRONG">
                        {t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK_STRONG', { typeQuestion: ok.tipopregunta })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_ERROR_STRONG">
                        {t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_ERROR_STRONG', { typeQuestion: ok.tipopregunta })}
                    </Trans>
                </div>
            );
        } else {
            return (
                <div>&nbsp;</div>
            )
        }
    };

    const showModalActionClose = () => {
        setOk({ ok: 2, tipopregunta: ok.tipopregunta });
    };

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
                        let lQuestionType = _.cloneDeep(questionType);
                        lQuestionType.tipo_multi = _.cloneDeep(responseLanguages.data);
                        setQuestionType(lQuestionType);
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
    const changeValuesMultilanguagesQuestionType = (response, singleVariable, multiVariable) => {
        let lQuestionType = _.cloneDeep(questionType);
        lQuestionType[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lQuestionType[singleVariable] = rp.multilanguage;
            }
        });
        setQuestionType(lQuestionType);
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
        let variablesMulti = ['tipo_multi'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(questionType[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            questionType[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!questionType[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                questionType.valid = false;
                break;
            } else {
                questionType.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getQuestionTypeObject2Add = () => {
        let lQuestionType = {
            tipo: questionType.tipo,
            tipo_multi: questionType.tipo_multi2,
            impact: questionType.impact,
            globalSatisfaction: questionType.globalSatisfaction
        }
        return lQuestionType;
    }

    const onChangeCheckboxImpact = ((e) => {
        let lQuestionType = _.cloneDeep(questionType);
        lQuestionType.impact = !lQuestionType.impact;
        setQuestionType(lQuestionType);
    });

    const onChangeCheckboxGlobalSatisfaction = ((e) => {
        let lQuestionType = _.cloneDeep(questionType);
        lQuestionType.globalSatisfaction = !lQuestionType.globalSatisfaction;
        setQuestionType(lQuestionType);
    });

    const onSubmit = ((e) => {
        e.preventDefault();
        changeResponseValidation(['tipo_multi']);
        transformEventToMultiLenguage();
        if (questionType && questionType.valid) {
            let lSpanish = questionType.tipo_multi.find(r =>
                r.id === 'es' && r.multilanguage && r.multilanguage !== '');
            if (!!lSpanish) {
                questionType.tipo = lSpanish.multilanguage;
            }
            let lQuestionType = getQuestionTypeObject2Add();
            axios.post(myInitObject.crudServer + '/crud/tipopreguntas/add', lQuestionType,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'QUESTIONTYPE.QUESTION_TYPE_REGISTRATION',
                        body: 'QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK', object: { typeQuestion: lQuestionType.tipo }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_tipopregunta/');
                    }, 2000);
                }).catch(function (error) {
                    setOk({ ok: -1, tipopregunta: questionType.tipo });
                    setTimeout(() => {
                        history.push('/dg_tipopregunta/');
                    }, 2000);
                });
        } else {
            setOk({ ok: -1, tipopregunta: questionType.tipo });
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}
            <ModalAction show={ok.ok === 1}
                header={t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION')}
                body={t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK', { typeQuestion: ok.tipopregunta })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION')}
                body={t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_ERROR', { typeQuestion: ok.tipopregunta })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('QUESTIONTYPE.QUESTION_TYPE_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('QUESTIONTYPE.QUESTION_TYPE')} (*):  </label>
                        <TableMultiLanguage
                            languages={questionType.tipo_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionType(response, 'tipo', 'tipo_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="impact"
                                id="impact"
                                onChange={onChangeCheckboxImpact}
                                checked={questionType.impact}
                            />
                            <label className="form-check-label" htmlFor="impact">
                                {t('QUESTIONTYPE.IMPACT')}
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="globalSatisfaction"
                                id="globalSatisfaction"
                                onChange={onChangeCheckboxGlobalSatisfaction}
                                checked={questionType.globalSatisfaction}
                            />
                            <label className="form-check-label" htmlFor="globalSatisfaction">
                                {t('QUESTIONTYPE.GLOBAL_SATISFACTION')}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <input type="submit" value={t('QUESTIONTYPE.QUESTION_TYPE_REGISTER')} className="btn btn-primary" />
                    </div>

                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};

const TipoPreguntasEdit = ({ history, match }) => {
    const [questionType, setQuestionType] = useState({
        id: 0,
        tipo: '',
        tipo_multi: [],
        impact: false,
        globalSatisfaction: false,
        valid: false
    });
    const [ok, setOk] = useState({ ok: 0, tipopregunta: '' });
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
                        {t('QUESTIONTYPE.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK_STRONG">
                        {t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK_STRONG', { typeQuestion: ok.tipopregunta })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_ERROR_STRONG">
                        {t('QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_ERROR_STRONG', { typeQuestion: ok.tipopregunta })}
                    </Trans>
                </div>
            );
        } else {
            return (
                <div>&nbsp;</div>
            )
        }
    };

    const showModalActionClose = () => {
        setOk({ ok: 2, tipopregunta: ok.tipopregunta });
    };

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

                        axios.get(myInitObject.crudServer + '/crud/tipopreguntas/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let lVariablesMulti = ['tipo_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                setQuestionType(response.data);
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
    const changeValuesMultilanguagesQuestionType = (response, singleVariable, multiVariable) => {
        let lQuestionType = _.cloneDeep(questionType);
        lQuestionType[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lQuestionType[singleVariable] = rp.multilanguage;
            }
        });
        setQuestionType(lQuestionType);
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
        let variablesMulti = ['tipo_multi'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(questionType[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            questionType[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!questionType[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                questionType.valid = false;
                break;
            } else {
                questionType.valid = true;
            }
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getQuestionTypeObject2Add = () => {
        let lQuestionType = {
            id: questionType.id,
            tipo: questionType.tipo,
            tipo_multi: questionType.tipo_multi2,
            impact: questionType.impact,
            globalSatisfaction: questionType.globalSatisfaction
        }
        return lQuestionType;
    }

    const onChangeCheckboxImpact = ((e) => {
        let lQuestionType = _.cloneDeep(questionType);
        lQuestionType.impact = !lQuestionType.impact;
        setQuestionType(lQuestionType);
    });

    const onChangeCheckboxGlobalSatisfaction = ((e) => {
        let lQuestionType = _.cloneDeep(questionType);
        lQuestionType.globalSatisfaction = !lQuestionType.globalSatisfaction;
        setQuestionType(lQuestionType);
    });

    const onSubmit = ((e) => {
        e.preventDefault();
        changeResponseValidation(['tipo_multi']);
        transformEventToMultiLenguage();
        if (questionType && questionType.valid) {
            let lSpanish = questionType.tipo_multi.find(r =>
                r.id === 'es' && r.multilanguage && r.multilanguage !== '');
            if (!!lSpanish) {
                questionType.tipo = lSpanish.multilanguage;
            }
            let lQuestionType = getQuestionTypeObject2Add();
            axios.post(myInitObject.crudServer + '/crud/tipopreguntas/update', lQuestionType,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'QUESTIONTYPE.QUESTION_TYPE_REGISTRATION',
                        body: 'QUESTIONTYPE.QUESTION_TYPE_REGISTRATION_OK', object: { typeQuestion: lQuestionType.tipo }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_tipopregunta/');
                    }, 2000);
                }).catch(function (error) {
                    setOk({ ok: -1, tipopregunta: questionType.tipo });
                    setTimeout(() => {
                        history.push('/dg_tipopregunta/');
                    }, 2000);
                });
        } else {
            setOk({ ok: -1, tipopregunta: questionType.tipo });
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}
            <ModalAction show={ok.ok === 1}
                header={t('QUESTIONTYPE.QUESTION_TYPE_MODIFICATION')}
                body={t('QUESTIONTYPE.QUESTION_TYPE_MODIFY_OK', { typeQuestion: ok.tipopregunta })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('QUESTIONTYPE.QUESTION_TYPE_MODIFICATION')}
                body={t('QUESTIONTYPE.QUESTION_TYPE_MODIFY_ERROR', { typeQuestion: ok.tipopregunta })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('QUESTIONTYPE.QUESTION_TYPE_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('QUESTIONTYPE.QUESTION_TYPE')} (*):  </label>
                        <TableMultiLanguage
                            languages={questionType.tipo_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionType(response, 'tipo', 'tipo_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>

                    <div className="form-group">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="impact"
                                id="impact"
                                onChange={onChangeCheckboxImpact}
                                checked={questionType.impact}
                            />
                            <label className="form-check-label" htmlFor="impact">
                                {t('QUESTIONTYPE.IMPACT')}
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                name="globalSatisfaction"
                                id="globalSatisfaction"
                                onChange={onChangeCheckboxGlobalSatisfaction}
                                checked={questionType.globalSatisfaction}
                            />
                            <label className="form-check-label" htmlFor="globalSatisfaction">
                                {t('QUESTIONTYPE.GLOBAL_SATISFACTION')}
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <input type="submit" value={t('QUESTIONTYPE.QUESTION_TYPE_MODIFY')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};

