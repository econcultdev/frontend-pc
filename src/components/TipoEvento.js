/**
 * Mantenimiento de Tipos de Eventos
 */

import React, { Component, useState, useEffect } from 'react';
import { BrowserRouter as Switch, Route } from "react-router-dom";
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
import ModalAction from './ModalAction';

import withAuth from './witAuth';
import BackEnd from './BackEnd';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import _ from 'lodash';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';
import { event } from 'jquery';

const myInitObject = require('./config').myInitObject;
let languageI18N = localStorage.getItem("language");

class TipoEventos extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        // unsubscribe to ensure no memory leaks
        this.subscription.unsubscribe();
    }

    render() {
        const { t } = this.props;
        return (
            <React.Fragment>
                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('EVENTTYPE.EVENT_TYPE_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/evento_tipo" render={() => <TipoEventosList {...this.props} />} />
                    <Route path="/evento_tipo/add" component={withAuth(TipoEventosAdd)} />
                    <Route path="/evento_tipo/edit/:id" component={withAuth(TipoEventosEdit)} />
                    <Route path="/evento_tipo/delete/:id" component={withAuth(TipoEventosDelete)} />
                </Switch>
            </React.Fragment>
        )
    }
};

export default withTranslation('global')(TipoEventos);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <TipoEventosListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <TipoEventosAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <TipoEventosListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <TipoEventosAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const TipoEventosListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/evento_tipo') }}>
            {t('EVENTTYPE.EVENT_TYPE_LIST')}
        </button>
    );
};

const TipoEventosAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/evento_tipo/add') }}>
            {t('EVENTTYPE.EVENT_TYPE_ADD')}
        </button>
    );
};


const TipoEventosList = ({ history }) => {
    const [tipoeventos, setTipoEventos] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const { t } = useTranslation("global");

    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, nombre: row.row.nombre, nombre_multi: row.row.nombre_multi });
        setShowDeleteConfirm(true);
    };

    const ActionsFormatter = (row) => {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2"></div>
                    <div className="col-md-4">
                        <button className="btn btn-primary" onClick={() => { history.push('/evento_tipo/edit/' + row.row.id) }}>
                            {t('EVENTTYPE.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('EVENTTYPE.DELETE')}
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
            text: t('EVENTTYPE.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('EVENTTYPE.EVENT_TYPE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('EVENTTYPE.ACTIONS'),
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
            axios.get(myInitObject.crudServer + '/crud/tipoeventos',
                { withCredentials: true })
                .then(response => {
                    setTipoEventos(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="EVENTTYPE.PAGINATION_TOTAL">
                {t('EVENTTYPE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: tipoeventos,
        totalsize: tipoeventos.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: tipoeventos.length === 0,
        withFirstAndLast: true,
        firstPageText: t('EVENTTYPE.FIRST_PAGE_TEXT'),
        firstPageTitle: t('EVENTTYPE.FIRST_PAGE_TITLE'),
        prePageText: t('EVENTTYPE.PRE_PAGE_TEXT'),
        prePageTitle: t('EVENTTYPE.PRE_PAGE_TITLE'),
        nextPageText: t('EVENTTYPE.NEXT_PAGE_TEXT'),
        nextPageTitle: t('EVENTTYPE.NEXT_PAGE_TITLE'),
        lastPageText: t('EVENTTYPE.LAST_PAGE_TEXT'),
        lastPageTitle: t('EVENTTYPE.LAST_PAGE_TITLE'),
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
        history.push('/evento_tipo/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('EVENTTYPE.EVENT_TYPE_DELETE')}
                </ModalHeader>
                <ModalBody>{t('EVENTTYPE.EVENT_TYPE_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('EVENTTYPE.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('EVENTTYPE.DELETE')}
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
                                    data={tipoeventos}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('EVENTTYPE.EVENT_TYPE_NO')}
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




const TipoEventosDelete = ({ history, match }) => {
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/tipoeventos/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/evento_tipo'))
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history, match]
    );
    return (
        <ListLinks history={history} action="delete" />
    );
};

const TipoEventosAdd = ({ history }) => {
    const [tipoevento, setTipoEvento] = useState();
    const [ok, setOk] = useState({ ok: 0, tipoevento: '' });
    const [t] = useTranslation("global");

    const [languages, setLanguages] = useState([]);
    const [showSaveError, setSaveError] = useState(false);
    const [showSaveErrorMessage, setShowSaveErrorMessage] = useState({});

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
                setShowSaveErrorMessage({});
                setSaveError(false);
                break;
            default:
                break;
        }
    }

    /**
     * Show error modal
     */
    const errorModal = () => {
        return (
            <Modal isOpen={showSaveError}>
                <ModalHeader>
                    {t(showSaveErrorMessage.title)}
                </ModalHeader>
                <ModalBody>
                    {t(showSaveErrorMessage.body)}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('EVENTTYPE.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    // recoger tipos de preguntas para mostrarlas en un combo
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
                        setLanguages(responseLanguages.data);
                        setTipoEvento({ nombre: '', nombre_multi: [], valid: false });
                    }
                });
        },
        [history]
    );

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesTypeEvent = (response) => {
        let lTipoEvento = _.cloneDeep(tipoevento);
        lTipoEvento.nombre_multi = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lTipoEvento.nombre = rp.multilanguage;
            }
        });
        setTipoEvento(lTipoEvento);
    }

    /**
     * Change the valid parameter from event type
     * @param {*} response Values from new languages
     */
    const onValid = (response) => {
        let lTipoEvento = _.cloneDeep(tipoevento);
        if (lTipoEvento.nombre_multi && lTipoEvento.nombre) {
            lTipoEvento.valid = response;
            setTipoEvento(lTipoEvento);
        }
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
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = () => {
        let eventTypeValid = false;
        if (tipoevento && tipoevento.nombre_multi.length > 0) {
            eventTypeValid = !!tipoevento.nombre_multi.find(r => r.id === 'en');
            tipoevento.valid = eventTypeValid;
        }
    }

    /**
     * Add to responses the multi language values
     * @param {*} responses Responses
     */
    const addMultiLanguageValues = () => {
        let lngJSON = transformLanguageToJson(tipoevento.nombre_multi);
        if (lngJSON) {
            lngJSON = JSON.parse(lngJSON);
            tipoevento.nombre_multi = lngJSON;
        }
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        changeResponseValidation();
        addMultiLanguageValues();
        if (tipoevento.valid) {
            const obj = {
                nombre: tipoevento.nombre,
                nombre_multi: JSON.stringify(tipoevento.nombre_multi)
            };
            axios.post(myInitObject.crudServer + '/crud/tipoeventos/add', obj,
                { withCredentials: true })
                .then(res => {
                    setOk({ ok: 1, tipoevento: res.data.nombre });
                    setTimeout(() => {
                        history.push('/evento_tipo/');
                    }, 2000);
                }
                ).catch(function (error) {
                    setOk({ ok: -1, tipoevento: obj.nombre });
                    setShowSaveErrorMessage({
                        title: 'EVENTTYPE.ERROR',
                        body: 'EVENTTYPE.EVENT_TYPE_QUESTION_ENGLISH'
                    });
                    setSaveError(true);
                });
            setTipoEvento('');
            setOk({ ok: 0, tipoevento: { nombre: '', nombre_multi: [], valid: false } });
        } else {
            setShowSaveErrorMessage({
                title: 'EVENTTYPE.ERROR',
                body: 'EVENTTYPE.EVENT_TYPE_QUESTION_ENGLISH'
            });
            setSaveError(true);
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="EVENTTYPE.EVENT_TYPE_REGISTRATION_OK_STRONG">
                        {t('EVENTTYPE.EVENT_TYPE_REGISTRATION_OK_STRONG', { eventType: ok.tipoevento })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="EVENTTYPE.EVENT_TYPE_REGISTRATION_ERROR_STRONG">
                        {t('EVENTTYPE.EVENT_TYPE_REGISTRATION_ERROR_STRONG', { eventType: ok.tipoevento })}
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
        setOk({ ok: 2, tipoevento: ok.tipoevento });
    };

    return (
        <div className="container">
            {showSaveErrorMessage && errorModal()}

            <ModalAction show={ok.ok === 1}
                header={t('EVENTTYPE.EVENT_TYPE_REGISTRATION')}
                body={t('EVENTTYPE.EVENT_TYPE_REGISTRATION_OK', { eventType: ok.tipoevento })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('EVENTTYPE.EVENT_TYPE_REGISTRATION')}
                body={t('EVENTTYPE.EVENT_TYPE_REGISTRATION_ERROR', { eventType: ok.tipoevento })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('EVENTTYPE.EVENT_TYPE_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('EVENTTYPE.EVENT_TYPE')} (*):  </label>
                        <TableMultiLanguage
                            languages={languages}
                            onChange={(response) => changeValuesMultilanguagesTypeEvent(response)}
                            onValid={(response) => onValid(response)}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('EVENTTYPE.EVENT_TYPE_REGISTER')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};

const TipoEventosEdit = ({ history, match }) => {
    const [tipoevento, setTipoEvento] = useState({ id: 0, nombre: '' });
    const [ok, setOk] = useState({ ok: 0, tipoevento: '' });
    const [t] = useTranslation("global");

    const [languages, setLanguages] = useState([]);
    const [showSaveError, setSaveError] = useState(false);
    const [showSaveErrorMessage, setShowSaveErrorMessage] = useState({});

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
                setShowSaveErrorMessage({});
                setSaveError(false);
                break;
            default:
                break;
        }
    }

    /**
     * Show error modal
     */
    const errorModal = () => {
        return (
            <Modal isOpen={showSaveError}>
                <ModalHeader>
                    {t(showSaveErrorMessage.title)}
                </ModalHeader>
                <ModalBody>
                    {t(showSaveErrorMessage.body)}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('EVENTTYPE.CLOSE')}
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

    // recoger tipos de preguntas para mostrarlas en un combo
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
                        // setLanguages(responseLanguages.data);
                        // setTipoEvento({ nombre: '', nombre_multi: [], valid: false });

                        axios.get(myInitObject.crudServer + '/crud/tipoeventos/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                setTipoEvento({
                                    id: response.data.id,
                                    nombre: '',
                                    nombre_multi: response.data.nombre_multi,
                                    valid: false
                                });
                                let lngs = transformLanguageByValues(responseLanguages.data, response.data.nombre_multi);
                                setLanguages(lngs);
                            })
                            .catch(function (error) {
                                console.error(error);
                            })
                    }
                });
        },
        [history]
    );

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesTypeEvent = (response) => {
        let lTipoEvento = _.cloneDeep(tipoevento);
        lTipoEvento.nombre_multi = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lTipoEvento.nombre = rp.multilanguage;
            }
        });
        setTipoEvento(lTipoEvento);
    }

    /**
     * Change the valid parameter from event type
     * @param {*} response Values from new languages
     */
    const onValid = (response) => {
        let lTipoEvento = _.cloneDeep(tipoevento);
        lTipoEvento.nombre = '';
        if (lTipoEvento.nombre_multi && lTipoEvento.nombre) {
            lTipoEvento.valid = response;
            setTipoEvento(lTipoEvento);
        }
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
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = () => {
        let eventTypeValid = false;
        if (tipoevento && tipoevento.nombre_multi.length > 0) {
            eventTypeValid = !!tipoevento.nombre_multi.find(r => r.id === 'en');
            tipoevento.valid = eventTypeValid;
        } else if (tipoevento && !Array.isArray(tipoevento.nombre_multi)) {
            let enValid = tipoevento.nombre_multi.en;
            if (enValid && enValid !== '') {
                tipoevento.nombre = enValid;
                tipoevento.valid = true;
            }
        }
    }

    /**
     * Add to responses the multi language values
     * @param {*} responses Responses
     */
    const addMultiLanguageValues = () => {
        let lngJSON = tipoevento.nombre_multi;
        if (!Array.isArray(tipoevento.nombre_multi)) {
            lngJSON = [];
            let keys = Object.keys(tipoevento.nombre_multi);
            keys.map(key => lngJSON.push({ id: key, multilanguage: tipoevento.nombre_multi[key] }));
        }
        lngJSON = transformLanguageToJson(lngJSON);
        if (lngJSON) {
            lngJSON = JSON.parse(lngJSON);
            tipoevento.nombre_multi = lngJSON;
        }
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        addMultiLanguageValues();
        changeResponseValidation();
        if (tipoevento.valid) {
            const obj = {
                id: tipoevento.id,
                nombre: tipoevento.nombre,
                nombre_multi: JSON.stringify(tipoevento.nombre_multi)
            };
            axios.post(myInitObject.crudServer + '/crud/tipoeventos/update', obj,
                { withCredentials: true })
                .then(res => {
                    setOk({ ok: 1, tipoevento: res.data.nombre });
                    setTipoEvento('');
                    setTimeout(() => {
                        history.push('/evento_tipo/');
                    }, 2000);
                }).catch(function (error) {
                    setOk({ ok: -1, tipoevento: obj.nombre });
                });
        } else {
            setShowSaveErrorMessage({
                title: 'EVENTTYPE.ERROR',
                body: 'EVENTTYPE.EVENT_TYPE_QUESTION_ENGLISH'
            });
            setSaveError(true);
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="EVENTTYPE.EVENT_TYPE_MODIFY_OK_STRONG">
                        {t('EVENTTYPE.EVENT_TYPE_MODIFY_OK_STRONG', { eventType: ok.tipoevento })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="EVENTTYPE.EVENT_TYPE_MODIFY_ERROR_STRONG">
                        {t('EVENTTYPE.EVENT_TYPE_MODIFY_ERROR_STRONG', { eventType: ok.tipoevento })}
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
        setOk({ ok: 2, tipoevento: ok.tipoevento });
    };

    return (
        <div className="container">
            {showSaveErrorMessage && errorModal()}

            <ModalAction show={ok.ok === 1}
                header={t('EVENTTYPE.EVENT_TYPE_MODIFICATION')}
                body={t('EVENTTYPE.EVENT_TYPE_MODIFY_OK', { eventType: ok.tipoevento })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('EVENTTYPE.EVENT_TYPE_MODIFICATION')}
                body={t('EVENTTYPE.EVENT_TYPE_MODIFY_ERROR', { eventType: ok.tipoevento })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('EVENTTYPE.EVENT_TYPE_MODIFICATION')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('EVENTTYPE.EVENT_TYPE')} (*):  </label>
                        <TableMultiLanguage
                            languages={languages}
                            onChange={(response) => changeValuesMultilanguagesTypeEvent(response)}
                            onValid={(response) => onValid(response)}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('EVENTTYPE.EVENT_TYPE_MODIFY')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};

