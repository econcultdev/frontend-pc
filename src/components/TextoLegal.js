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
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import { ValidatorForm } from 'react-form-validator-core';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';
import Select from 'react-select';
import SelectValidator from './SelectValidator';

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

class TextoLegal extends Component {

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
                    {t('LEGALTEXT.LEGAL_TEXT_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/dg_textolegal" render={() => <TextoLegalList {...this.props} />} />
                    <Route path="/dg_textolegal/add" component={withAuth(TextoLegalAdd)} />
                    <Route path="/dg_textolegal/edit/:id" component={withAuth(TextoLegalEdit)} />
                    <Route path="/dg_textolegal/delete/:id" component={withAuth(TextoLegalDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(TextoLegal);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <TextoLegalListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <TextoLegalAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <TextoLegalListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <TextoLegalAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const TextoLegalListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_textolegal') }}>
            {t('LEGALTEXT.LEGAL_TEXT_LIST')}
        </button>
    );
};

const TextoLegalAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/dg_textolegal/add') }}>
            {t('LEGALTEXT.LEGAL_TEXT_ADD')}
        </button>
    );
};


const TextoLegalList = ({ history }) => {
    const [TextoLegal, setTextoLegal] = useState([]);
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
                    <div className="col-md-4"></div>
                    <div className="col-md-2">
                        <button className="btn btn-primary" onClick={() => { history.push('/dg_textolegal/edit/' + row.row.id) }}>
                            {t('LEGALTEXT.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('LEGALTEXT.DELETE')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

    const activoFormatter = (cell, row) => {
        return (
            <span>{(row.activo && "Sí") || "No"}</span>
        )
    };

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
            text: t('LEGALTEXT.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('LEGALTEXT.NAME'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: getColumnJSONMultilanguage('TypeLegalText.name', 'TypeLegalText.name'),
            text: t('LEGALTEXT.TYPE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: 'activo',
            text: t('LEGALTEXT.ACTIVE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            formatter: activoFormatter,
            editable: false
        },
        {
            dataField: '',
            text: t('LEGALTEXT.ACTIONS'),
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
            axios.get(myInitObject.crudServer + '/crud/textolegal',
                { withCredentials: true })
                .then(response => {
                    setTextoLegal(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="LEGALTEXT.PAGINATION_TOTAL">
                {t('LEGALTEXT.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: TextoLegal,
        totalsize: TextoLegal.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: TextoLegal.length === 0,
        withFirstAndLast: true,
        firstPageText: t('LEGALTEXT.FIRST_PAGE_TEXT'),
        firstPageTitle: t('LEGALTEXT.FIRST_PAGE_TITLE'),
        prePageText: t('LEGALTEXT.PRE_PAGE_TEXT'),
        prePageTitle: t('LEGALTEXT.PRE_PAGE_TITLE'),
        nextPageText: t('LEGALTEXT.NEXT_PAGE_TEXT'),
        nextPageTitle: t('LEGALTEXT.NEXT_PAGE_TITLE'),
        lastPageText: t('LEGALTEXT.LAST_PAGE_TEXT'),
        lastPageTitle: t('LEGALTEXT.LAST_PAGE_TITLE'),
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
        history.push('/dg_textolegal/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">
            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('LEGALTEXT.LEGAL_TEXT_DELETE')}
                </ModalHeader>
                <ModalBody>{t('LEGALTEXT.LEGAL_TEXT_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('LEGALTEXT.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('LEGALTEXT.DELETE')}
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
                                    data={TextoLegal}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('LEGALTEXT.LEGAL_TEXT_NO')}
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


const TextoLegalDelete = ({ history, match }) => {

    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/textolegal/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/dg_textolegal'))
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


const TextoLegalAdd = ({ history }) => {
    const [legalText, setLegalText] = useState({
        nombre: '',
        nombre_multi: [],
        texto: '',
        texto_multi: [],
        activo: false,
        TypeLegalTextId: 0,
        valid: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});
    const [TypeLegalText, setTypeLegalText] = useState([]);
    const [t] = useTranslation("global");

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
                        legalText.nombre_multi = _.cloneDeep(responseLanguages.data);
                        legalText.texto_multi = _.cloneDeep(responseLanguages.data);
                        setLegalText(legalText);
                    }
                });
            setTypeLegalTextData();
        },
        [history]
    );

    /**
     * Set type legal text data
     */
    const setTypeLegalTextData = () => {
        const lTypeLegalText = axios.get(myInitObject.crudServer + '/crud/typelegaltext',
            { withCredentials: true });
        Promise.all([lTypeLegalText])
            .then(response => {
                setTypeLegalText(response[0].data.map(element => {
                    let lLabel = null;
                    if (element.name[languageI18N]) {
                        lLabel = element.name[languageI18N];
                    } else {
                        lLabel = element.name['en'];
                    }
                    return {
                        value: element.id,
                        label: lLabel
                    }
                }));
            })
            .catch(function (error) {
                console.error(error);
            });
    }

    /**
     * It is used to assign the value to a variable
     * @param {*} variable Variable
     * @param {*} value Value
     */
    const setPropertyLegalText = (variable, value) => {
        let lLegalText = _.cloneDeep(legalText);
        lLegalText[variable] = value;
        setLegalText(lLegalText);
    }

    /**
     * Change type legal text id
     * @param {*} e Event
     */
    const handleTypeLegalText = ((e) => {
        setPropertyLegalText('TypeLegalTextId', e.value);
    });

    /**
     * Change activo checkbox
     */
    const onChangeCheckboxActivo = (() => {
        setPropertyLegalText('activo', !legalText.activo);
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
                        {t('LEGALTEXT.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
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
        setLegalText(lBaseObject);
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
            texto: baseObject.texto,
            texto_multi: baseObject.texto_multi2,
            TypeLegalTextId: baseObject.TypeLegalTextId,
            activo: baseObject.activo,
            valid: baseObject.valid
        }
        return lBaseObject;
    }

    /**
     * Show modal error
     * @param {*} legalTextObject Legal Text object
     */
    const showModalError = (legalTextObject) => {
        setShowModalMessage({
            title: 'LEGALTEXT.LEGAL_TEXT_REGISTRATION',
            body: 'LEGALTEXT.LEGAL_TEXT_REGISTRATION_ERROR', object: { legalText: legalTextObject.nombre[languageI18N] }
        });
        setModalOpen(true);
        setLegalText(legalTextObject);
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        let lLegalTextClone = _.cloneDeep(legalText);
        let lVariablesObligation = ['nombre_multi', 'texto_multi'];
        changeResponseValidation(legalText, lVariablesObligation);
        transformObjectToMultiLenguage(legalText, lVariablesObligation);
        if (legalText && legalText.valid) {
            let lLegalText = getObjectComplete(legalText);
            axios.post(myInitObject.crudServer + '/crud/textolegal/add', lLegalText,
                { withCredentials: true })
                .then(res => {
                    setShowModalMessage({
                        title: 'LEGALTEXT.LEGAL_TEXT_REGISTRATION',
                        body: 'LEGALTEXT.LEGAL_TEXT_REGISTRATION_OK', object: { legalText: lLegalTextClone.nombre[languageI18N] }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_textolegal/');
                    }, 2000);
                }).catch(function (error) {
                    showModalError(lLegalTextClone);
                });
        } else {
            showModalError(lLegalTextClone);
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('LEGALTEXT.LEGAL_TEXT_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('LEGALTEXT.NAME')} (*):  </label>
                        <TableMultiLanguage
                            languages={legalText.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, legalText, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('LEGALTEXT.LEGAL_TEXT')} (*):  </label>
                        <TableMultiLanguage
                            languages={legalText.texto_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, legalText, 'texto', 'texto_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('LEGALTEXT.TYPE')}:  </label>
                        <Select name={t('LEGALTEXT.TYPE')} isSearchable={true}
                            onChange={handleTypeLegalText}
                            options={TypeLegalText}
                        />
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="activo"
                            id="activo"
                            onChange={onChangeCheckboxActivo}
                        />
                        <label className="form-check-label" htmlFor="activo">
                            {t('LEGALTEXT.ACTIVE')}
                        </label>
                    </div>
                    <div className="form-group pt-4">
                        <input type="submit" value={t('LEGALTEXT.LEGAL_TEXT_REGISTER')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

const TextoLegalEdit = ({ history, match }) => {
    const [legalText, setLegalText] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
        texto: '',
        texto_multi: [],
        activo: false,
        TypeLegalTextId: 0,
        valid: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});
    const [TypeLegalText, setTypeLegalText] = useState([]);
    const [t] = useTranslation("global");

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
                        axios.get(myInitObject.crudServer + '/crud/textolegal/edit/' + match.params.id,
                            { withCredentials: true })
                            .then(response => {
                                let lVariablesMulti = ['nombre_multi', 'texto_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                setLegalText(response.data);
                            })
                            .catch(function (error) {
                                console.error(error);
                            });
                    }
                });
            setTypeLegalTextData();
        },
        [history, match]
    );

    /**
     * Set type legal text data
     */
    const setTypeLegalTextData = () => {
        const lTypeLegalText = axios.get(myInitObject.crudServer + '/crud/typelegaltext',
            { withCredentials: true });
        Promise.all([lTypeLegalText])
            .then(response => {
                setTypeLegalText(response[0].data.map(element => {
                    let lLabel = null;
                    if (element.name[languageI18N]) {
                        lLabel = element.name[languageI18N];
                    } else {
                        lLabel = element.name['en'];
                    }
                    return {
                        value: element.id,
                        label: lLabel
                    }
                }));
            })
            .catch(function (error) {
                console.error(error);
            });
    }

    /**
      * It is used to assign the value to a variable
      * @param {*} variable Variable
      * @param {*} value Value
      */
    const setPropertyLegalText = (variable, value) => {
        let lLegalText = _.cloneDeep(legalText);
        lLegalText[variable] = value;
        setLegalText(lLegalText);
    }

    /**
     * Change type legal text id
     * @param {*} e Event
     */
    const handleTypeLegalText = ((e) => {
        setPropertyLegalText('TypeLegalTextId', e.value);
    });

    /**
     * Change activo checkbox
     */
    const onChangeCheckboxActivo = (() => {
        setPropertyLegalText('activo', !legalText.activo);
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
                        {t('LEGALTEXT.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
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
        setLegalText(lBaseObject);
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
            texto: baseObject.texto,
            texto_multi: baseObject.texto_multi2,
            TypeLegalTextId: baseObject.TypeLegalTextId,
            activo: baseObject.activo,
            valid: baseObject.valid
        }
        return lBaseObject;
    }

    /**
     * Show modal error
     * @param {*} legalTextObject Legal Text object
     */
    const showModalError = (legalTextObject) => {
        setShowModalMessage({
            title: 'LEGALTEXT.LEGAL_TEXT_MODIFICATION',
            body: 'LEGALTEXT.LEGAL_TEXT_MODIFY_ERROR', object: { legalText: legalTextObject.nombre[languageI18N] }
        });
        setModalOpen(true);
        setLegalText(legalTextObject);
    }

    const onSubmit = ((e) => {
        e.preventDefault();
        let lLegalTextClone = _.cloneDeep(legalText);
        let lVariablesObligation = ['nombre_multi', 'texto_multi'];
        changeResponseValidation(legalText, lVariablesObligation);
        transformObjectToMultiLenguage(legalText, lVariablesObligation);
        if (legalText && legalText.valid) {
            let lLegalText = getObjectComplete(legalText);
            axios.post(myInitObject.crudServer + '/crud/textolegal/update', lLegalText,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'LEGALTEXT.LEGAL_TEXT_MODIFICATION',
                        body: 'LEGALTEXT.LEGAL_TEXT_MODIFY_OK', object: { legalText: lLegalTextClone.nombre[languageI18N] }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/dg_textolegal/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lLegalTextClone);
                });
        } else {
            showModalError(lLegalTextClone);
        }
    });

    return (
        <div className="container">
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('LEGALTEXT.LEGAL_TEXT_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('LEGALTEXT.NAME')} (*):  </label>
                        <TableMultiLanguage
                            languages={legalText.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, legalText, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('LEGALTEXT.LEGAL_TEXT')} (*):  </label>
                        <TableMultiLanguage
                            languages={legalText.texto_multi}
                            showTextArea={true}
                            onChange={(response) =>
                                changeValuesMultilanguages(response, legalText, 'texto', 'texto_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('LEGALTEXT.TYPE')}:  </label>
                        <SelectValidator name={t('LEGALTEXT.TYPE')}
                            value={TypeLegalText.filter(({ value }) => value === legalText.TypeLegalTextId)}
                            isSearchable={true}
                            onChange={handleTypeLegalText}
                            options={TypeLegalText}
                        />
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="activo"
                            id="activo"
                            onChange={onChangeCheckboxActivo}
                            checked={legalText.activo}
                        />
                        <label className="form-check-label" htmlFor="activo">
                            {t('LEGALTEXT.ACTIVE')}
                        </label>
                    </div>
                    <div className="form-group pt-4">
                        <input type="submit" value={t('LEGALTEXT.LEGAL_TEXT_MODIFY')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

