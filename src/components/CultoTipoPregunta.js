/**
 * Mantenimiento de Preguntas de Cultotipo
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
import filterFactory, { textFilter, numberFilter } from 'react-bootstrap-table2-filter';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { ValidatorForm } from 'react-form-validator-core';
import TextValidator from './TextValidator';
import SelectValidator from './SelectValidator';

import ModalAction from './ModalAction';
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import _, { isEmpty, isNull, isUndefined } from 'lodash';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';

const myInitObject = require('./config').myInitObject;
let languageI18N = localStorage.getItem("language");

/**
 * Componente que implementa los procesos CRUD para Preguntas de CultoTipos
 */
class CultoTipoPreguntas extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        // unsubscribe to ensure no memory leaks
        this.subscription.unsubscribe();
    }

    /**
     * Hay que ser administrador para poder acceder al menú de Preguntas de CultoTipos.
     * Definición de las rutas del mantenimiento de Preguntas de CultoTipos
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
                    {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTIONS_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/cultotipo_pregunta" render={() => <CultoTipoPreguntasList {...this.props} />} />
                    <Route path="/cultotipo_pregunta/add" component={withAuth(CultoTipoPreguntasAdd)} />
                    <Route path="/cultotipo_pregunta/edit/:id" component={withAuth(CultoTipoPreguntasEdit)} />
                    <Route path="/cultotipo_pregunta/delete/:id" component={withAuth(CultoTipoPreguntasDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(CultoTipoPreguntas);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de Preguntas de CultoTipos
 */
const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <CultoTipoPreguntasListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <CultoTipoPreguntasAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <CultoTipoPreguntasListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <CultoTipoPreguntasAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de Preguntas de CultoTipos
 */
const CultoTipoPreguntasListLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/cultotipo_pregunta') }}>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTIONS_LIST')}</button>
    );
};

/**
 * Enlace a crear una Pregunta de CultoTipo
 */
const CultoTipoPreguntasAddLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/cultotipo_pregunta/add') }}>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTIOSN_ADD')}</button>
    );
};


/**
 * Componente para listar Preguntas de CultoTipos en una tabla
 */
const CultoTipoPreguntasList = ({ history }) => {

    const [cultotipopreguntas, setCultoTipoPreguntas] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const { t } = useTranslation("global");

    /**
     * Borrar Pregunta de CultoTipo
     * @param {*} row
     */
    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, pregunta: row.row.pregunta });
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
                    <div>
                        <button className="btn btn-primary" onClick={() => { history.push('/cultotipo_pregunta/edit/' + row.row.id) }}>
                            {t('CULTOTYPEQUESTIONS.EDIT')}
                        </button>
                    </div>
                    <div>
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('CULTOTYPEQUESTIONS.DELETE')}
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
            text: t('CULTOTYPEQUESTIONS.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('pregunta', 'pregunta_multi'),
            text: t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('TipoPregunta.tipo', 'TipoPregunta.tipo_multi'),
            text: t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_TYPE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false
        },
        {
            dataField: 'orden',
            text: t('CULTOTYPEQUESTIONS.ORDER'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: numberFilter(),
            editable: false
        },
        {
            dataField: '',
            text: t('CULTOTYPEQUESTIONS.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];


    /**
     * Inicializar variables y llamar a la crud rest para recoger las Preguntas de CultoTipos
     */
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/cultotipo_pregunta',
                { withCredentials: true })
                .then(response => {
                    setCultoTipoPreguntas(response.data);
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
            <Trans i18nKey="CULTOTYPEQUESTIONS.PAGINATION_TOTAL">
                {t('CULTOTYPEQUESTIONS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: cultotipopreguntas,
        totalsize: cultotipopreguntas.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: cultotipopreguntas.length === 0,
        withFirstAndLast: true,
        firstPageText: t('CULTOTYPEQUESTIONS.FIRST_PAGE_TEXT'),
        firstPageTitle: t('CULTOTYPEQUESTIONS.FIRST_PAGE_TITLE'),
        prePageText: t('CULTOTYPEQUESTIONS.PRE_PAGE_TEXT'),
        prePageTitle: t('CULTOTYPEQUESTIONS.PRE_PAGE_TITLE'),
        nextPageText: t('CULTOTYPEQUESTIONS.NEXT_PAGE_TEXT'),
        nextPageTitle: t('CULTOTYPEQUESTIONS.NEXT_PAGE_TITLE'),
        lastPageText: t('CULTOTYPEQUESTIONS.LAST_PAGE_TEXT'),
        lastPageTitle: t('CULTOTYPEQUESTIONS.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    // campo de ordenación por defecto en la tabla
    const defaultSorted = [{
        dataField: 'orden',
        order: 'asc'
    }];

    // cerrar modal de confirmación de borrado
    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }

    // borrado de la ciudad
    const handleDelete = () => {
        history.push('/cultotipo_pregunta/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_DELETE')}
                </ModalHeader>
                <ModalBody> {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_DELETE')}: {idDelete.pregunta}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>
                        {t('CULTOTYPEQUESTIONS.CLOSE')}
                    </Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('CULTOTYPEQUESTIONS.DELETE')}
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
                                    data={cultotipopreguntas}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('CULTOTYPEQUESTIONS.NOT_CULTOTYPE_QUESTION')}
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
 * Componente de borrado de Preguntas de CultoTipos
 */
const CultoTipoPreguntasDelete = ({ history, match }) => {

    // borrar la Pregunta de CultoTipo y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/cultotipo_pregunta/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/cultotipo_pregunta'))
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
 * Componente para añadir una Pregunta de CultoTipo
 */
const CultoTipoPreguntasAdd = ({ history }) => {

    const [TipoPreguntas, setTipoPreguntas] = useState([]);
    const [CultoTipoPregunta, setCultoTipoPregunta] = useState({ pregunta: '', orden: 1 });
    const [TipoPreguntaId, setTipoPreguntaId] = useState(0);
    const [ok, setOk] = useState({ ok: 0, CultoTipoPregunta: '' });
    const [Respuestas, SetRespuestas] = useState([]);
    const { t } = useTranslation("global");

    const [languages, setLanguages] = useState([]);
    const [showMultilanguageDeleteConfirm, setShowMultiLanguageDeleteConfirm] = useState(false);
    const [multiLanguageDelete, setMultiLanguageDelete] = useState({});
    const [showMultilanguageEdit, setShowMultiLanguageEdit] = useState(false);
    const [whoShowEdit, setWhoShowEdit] = useState('');
    const [multiLanguageEdit, setMultiLanguageEdit] = useState({});
    const [inputValue, setInputValue] = useState();
    const [showSaveError, setSaveError] = useState(false);
    const [showSaveErrorMessage, setShowSaveErrorMessage] = useState({});

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Used to paint edit and delete buttons
     * @param {*} row Row
     */
    const ActionsFormatter = (row) => {
        return (
            <div className="container">
                <div className="d-flex flex-row justify-content-center">
                    <div className="p-2">
                        <button className="btn btn-primary" onClick={(e) => { clickEdit(row, e) }}>{t('CULTOTYPEQUESTIONS.EDIT')}</button>
                    </div>
                    <div className="p-2">
                        <button className="btn btn-danger" onClick={(e) => { clickDelete(row, e) }}>{t('CULTOTYPEQUESTIONS.DELETE')}</button>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Used to paint component in row and cell
     * @param {*} cell Cell
     * @param {*} row Row
     */
    const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

    /**
     * Table columns
     */
    const columns = [
        {
            dataField: 'label',
            text: t('CULTOTYPEQUESTIONS.LANGUAGE').toUpperCase(),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: 'multilanguage',
            text: t('CULTOTYPEQUESTIONS.VALUE').toUpperCase(),
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: '',
            text: t('CULTOTYPEQUESTIONS.ACTIONS').toUpperCase(),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Pagination total render
     * @param {*} from From
     * @param {*} to To
     * @param {*} size Size
     */
    const paginationTotalRenderer = (from, to, size) => (

        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="CULTOTYPEQUESTIONS.PAGINATION_TOTAL">
                {t('CULTOTYPEQUESTIONS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    /**
     * Pagination to questions table
     */
    const paginationOptions = {
        data: languages,
        totalsize: languages.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languages.length === 0,
        withFirstAndLast: true,
        paginationTotalRenderer
    };

    /****************************************************
     ******************** ALERTS *************************
     ****************************************************/

    /**
     * Close modal
     * @param {*} action Action: 'delete' | 'edit'
     */
    const handleClose = (action) => {
        switch (action) {
            case 'delete':
                setMultiLanguageDelete({});
                setShowMultiLanguageDeleteConfirm(false);
                break;
            case 'edit':
                setMultiLanguageEdit({});
                setShowMultiLanguageEdit(false);
                break;
            case 'save':
                setShowSaveErrorMessage({});
                setSaveError(false);
                break;
            default:
                break;
        }
    }

    /**
     * Set the value to specific language 
     * @param {*} id Id
     * @param {*} multiLanguageValue Value from language
     * @param {*} languages Array languages
     */
    const setMultiLanguageValue2Language = (id, multiLanguageValue, languages) => {
        languages.map(lng => {
            if (lng.id === id) {
                lng.multilanguage = multiLanguageValue;
            }
            return lng;
        });
    }

    /**
     * Get the languages array from parent
     * @param {*} parent Parent
     */
    const getLanguageForParent = (parent) => {
        let lng = [];
        if (parent) {
            switch (parent) {
                case 'questions':
                default:
                    lng = languages;
                    break;
            }
        }
        return lng;
    }

    /**
     * Modify cultotype attibute from parent and set value
     * @param {*} parent Parent
     * @param {*} value Value
     */
    const modifyCultoTypeQuestionForm = (parent, value) => {
        let attribute = '';
        switch (parent) {
            case 'questions':
            default:
                attribute = 'pregunta';
                break;
        }
        CultoTipoPregunta[attribute] = value;
    }

    /**
     * Delete the value from language
     */
    const handleDelete = () => {
        if (multiLanguageDelete.parent) {
            let lng = getLanguageForParent(multiLanguageDelete.parent);
            setMultiLanguageValue2Language(multiLanguageDelete.id, null, lng);
            if (multiLanguageDelete.id === 'en') {
                modifyCultoTypeQuestionForm(multiLanguageDelete.parent, '');
            }
        }
        handleClose('delete');
    };

    /**
     * Action from delete button
     * @param {*} row 
     * @param {*} event 
     */
    const clickDelete = (row, event) => {
        event.preventDefault();
        setWhoShowEdit(row.row.parent);
        setMultiLanguageDelete({ id: row.row.id, multilanguage: row.row.multilanguage, parent: row.row.parent });
        setShowMultiLanguageDeleteConfirm(true);
    };

    /**
     * Actiom from edit button
     * @param {*} row 
     * @param {*} event 
     */
    const clickEdit = (row, event) => {
        event.preventDefault();
        setWhoShowEdit(row.row.parent);
        setShowMultiLanguageEdit(true);
        setMultiLanguageEdit(row.row);
    }

    /**
     * Change input value
     * @param {*} event Event
     */
    const handleChangeInput = (event) => {
        setInputValue(event.target.value);
    }

    /**
     * Set value in corresponding language
     * @param {*} event Event
     */
    const handleSaveEdit = (event) => {
        event.preventDefault();
        if (whoShowEdit) {
            let lng = getLanguageForParent(whoShowEdit);
            setMultiLanguageValue2Language(multiLanguageEdit.id, inputValue, lng);
            if (multiLanguageEdit.id === 'en') {
                modifyCultoTypeQuestionForm(whoShowEdit, inputValue);
            }
        }
        handleClose('edit');
    }

    /**
     * Build Add Modal
     */
    const AddModal = () => {
        return (
            <Modal isOpen={showMultilanguageEdit}>
                <ModalHeader>
                    {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_NEW')}
                </ModalHeader>
                <ModalBody>
                    {t('CULTOTYPEQUESTIONS.NEW')}
                    {<input className="form-control" type="text" maxLength="255" onChange={(e) => { handleChangeInput(e) }} />}
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-primary' variant="primary" onClick={(e) => handleSaveEdit(e)}>
                        {t('CULTOTYPEQUESTIONS.SAVE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('edit') }}>{t('CULTOTYPEQUESTIONS.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Build Delete Modal
     */
    const deleteModal = () => {
        return (
            <Modal isOpen={showMultilanguageDeleteConfirm}>
                <ModalHeader>
                    {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_DELETE')}
                </ModalHeader>
                <ModalBody>{t('CULTOTYPEQUESTIONS.DELETE')}: {multiLanguageDelete.multilanguage}!</ModalBody>
                <ModalFooter>
                    <button className='btn btn-secondary' variant="secondary" onClick={handleDelete}>
                        {t('CULTOTYPEQUESTIONS.DELETE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('delete') }}>{t('CULTOTYPEQUESTIONS.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * It is used to add the multilanguage value to its corresponding language
     * @param {*} language Language
     * @param {*} values Values
     * @param {*} parent Parent: 'woman' | 'man' | 'description'
     */
    const transformLanguageByValues = (language, values, parent) => {
        let lngs = _.cloneDeep(language);
        if (lngs && Array.isArray(lngs)) {
            lngs.map(lng => {
                if (values && values[lng.id]) {
                    lng.multilanguage = values[lng.id];
                }
                lng.parent = parent;
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
                    }

                    axios.get(myInitObject.crudServer + '/crud/tipopreguntas',
                        { withCredentials: true })
                        .then(response => {
                            setTipoPreguntas(response.data.map(element => { return { value: element.id, label: element.tipo } }));
                            let lngs = transformLanguageByValues(responseLanguages.data, response.data.pregunta_multi, 'questions');
                            setLanguages(lngs);
                        })
                        .catch(function (error) {
                            console.error(error);
                        })
                });
        },
        [history]
    );


    // cambio en el formulario del valor de alguna propiedad de la pregunta
    const onChangeCultoTipoPregunta = ((e) => {
        let obj = JSON.parse(JSON.stringify(CultoTipoPregunta));
        obj[e.target.name] = e.target.value;
        setCultoTipoPregunta(obj);
        setOk({ ok: 0, CultoTipoPregunta: '' });
    });

    const onChangeTipoPreguntaId = ((e) => {
        setTipoPreguntaId(e.value);
    });

    /**
     * Check english language are multilanguage value
     * @param {*} language Language
     * @returns Return true = ok, false = isNull or isUndefined or isEmpty
     */
    const checkEnglishValidation = (language) => {
        let lngEnglish = language.filter(lng => lng.id === 'en');
        if (lngEnglish && lngEnglish[0] && lngEnglish[0].multilanguage) {
            return !isNull(lngEnglish[0].multilanguage)
                && !isUndefined(lngEnglish[0].multilanguage)
                && !isEmpty(lngEnglish[0].multilanguage.trim());

        }
        return false;
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
     * Show error Modal when save cultotype not is completed with english parameters
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
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>{t('CULTOTYPEQUESTIONS.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Change response from cultotype question
     * @param {*} response Values from new languages
     * @param {*} id Id from language
     */
    const changeRespuestaMultilanguages = (response, id) => {
        let responses = _.cloneDeep(Respuestas)
        responses.map(resp => {
            if (resp.id === id) {
                resp.languages = response;
            }
            return resp;
        });
        SetRespuestas(responses);
    }

    /**
     * Change response from cultotype question
     * @param {*} response Values from new languages
     * @param {*} id Id from language
     */
    const onValid = (response, id) => {
        let responses = _.cloneDeep(Respuestas)
        responses.map(resp => {
            if (resp.id === id) {
                resp.valid = response;
            }
            return resp;
        });
        SetRespuestas(responses);
    }

    /**
     * Add to responses the multi language values
     * @param {*} responses Responses
     */
    const addResponseMultiLanguageValues = (responses) => {
        responses.map(resp => {
            let lngJSON = transformLanguageToJson(resp.languages);
            if (JSON.parse(lngJSON) && JSON.parse(lngJSON).en) {
                resp.respuesta_multi = JSON.parse(lngJSON);
                resp.respuesta = JSON.parse(lngJSON).en;
            }
            return resp;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (responses) => {
        if (responses) {
            responses.map(rp => {
                if (rp.languages && rp.languages.find(r => r.id === 'en')) {
                    rp.valid = true;
                } else {
                    rp.valid = false;
                }
                return rp;
            });
        }
    }

    // crear la pregunta
    const onSubmit = ((e) => {
        e.preventDefault();
        setOk({ error: null });
        addResponseMultiLanguageValues(Respuestas);
        changeResponseValidation(Respuestas);
        let responsesValidation = Respuestas.find(resp => !resp.valid) === undefined;
        if (checkEnglishValidation((languages)) && responsesValidation) {
            let lngJSON = transformLanguageToJson(languages);
            if (JSON.parse(lngJSON) && JSON.parse(lngJSON).en) {
                CultoTipoPregunta.pregunta = JSON.parse(lngJSON).en;
            }

            const obj = {
                pregunta: CultoTipoPregunta.pregunta,
                pregunta_multi: lngJSON,
                orden: CultoTipoPregunta.orden,
                TipoPreguntaId: TipoPreguntaId,
                respuestas: Respuestas,
                visible: 1
            };
            axios.post(myInitObject.crudServer + '/crud/cultotipo_pregunta/add', obj,
                { withCredentials: true })
                .then(res => {
                    let retStr = res.data.pregunta;
                    if (res.data.respuestas.length > 0) {
                        retStr += ' con respuestas: ';
                        res.data.respuestas.forEach((respuesta, index) => {
                            if (index > 0) retStr += " ; ";
                            retStr += respuesta.respuesta + ', valor: ' + respuesta.valor;
                        });
                    }
                    setOk({ ok: 1, CultoTipoPregunta: retStr });
                    setCultoTipoPregunta({ pregunta: '', orden: 1 });
                    setTipoPreguntaId(0);
                    SetRespuestas([]);
                    setTimeout(() => {
                        history.push('/cultotipo_pregunta/');
                    }, 2000);
                }).catch(function (error) {
                    if (error && error.response && error.response.data && JSON.stringify(error.response.data) !== '{}') {
                        setOk({ ok: -1, CultoTipoPregunta: obj.pregunta, error: error.response.data });
                    } else {
                        setOk({ ok: -1, CultoTipoPregunta: obj.pregunta });
                    }
                });
        } else {
            let body = 'CULTOTYPEQUESTIONS.';
            if (transformLanguageToJson(languages)) {
                body += 'CULTOTYPE_QUESTION_ENGLISH'
            }
            setShowSaveErrorMessage({ title: 'CULTOTYPEQUESTIONS.ERROR', body: body });
            setSaveError(true);
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPEQUESTIONS.CULTOTYPE_REGISTRATION_OK_STRONG">
                        {t('CULTOTYPEQUESTIONS.CULTOTYPE_REGISTRATION_OK_STRONG', { cultotypePregunta: ok.CultoTipoPregunta })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPEQUESTIONS.CULTOTYPE_REGISTRATION_ERROR_STRONG">
                        {t('CULTOTYPEQUESTIONS.CULTOTYPE_REGISTRATION_ERROR_STRONG', { cultotypePregunta: ok.CultoTipoPregunta })}
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
        setOk({ ok: 2, CultoTipoPregunta: ok.CultoTipoPregunta });
    };

    // crear en el formlario una respuesta vacía
    const AddAnswerEmpty = ((e) => {
        const values = [...Respuestas];
        let lng = _.cloneDeep(languages);
        lng.map(ln => {
            ln.multilanguage = undefined;
            ln.parent = undefined;
            return ln;
        })
        values.push({ respuesta: '', valor: '', languages: lng, valid: false });
        SetRespuestas(values);
    });

    // añadir un valor a la respuesta
    const AddAnswerV = ((e) => {
        let index = e.target.id.replace('answer_v_', '');
        const values = [...Respuestas];
        if (values[index] === undefined) {
            values[index] = { respuesta: '', valor: '' };
        }
        values[index].valor = e.target.value;
        SetRespuestas(values);
    });

    const DeleteAnswer = (event, index) => {
        event.preventDefault();
        const values = [...Respuestas];
        values.splice(index, 1);
        SetRespuestas(values);
    };

    // pintar formulario
    return (
        <div className="container">
            {showMultilanguageEdit && AddModal()}
            {showSaveErrorMessage && errorModal()}
            {ok.ok !== 1 && ok.ok !== 1 && showMultilanguageDeleteConfirm && deleteModal()}
            <ModalAction show={ok.ok === 1}
                header={t('CULTOTYPEQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('CULTOTYPEQUESTIONS.CULTOTYPE_REGISTRATION_OK', { cultotypePregunta: ok.CultoTipoPregunta })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('CULTOTYPEQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('CULTOTYPEQUESTIONS.CULTOTYPE_REGISTRATION_ERROR', { cultotypePregunta: ok.CultoTipoPregunta })}
                showModalActionClose={showModalActionClose} />
            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTIOSN_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"pregunta"}
                            className="form-control"
                            value={CultoTipoPregunta.pregunta}
                            onChange={onChangeCultoTipoPregunta}
                            size="30"
                            maxLength="255"
                            disabled
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_EMPTY'),
                                    t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_LIMIT_LENGTH')
                                ]
                            }
                        />
                        { /* Question table section start */}
                        <PaginationProvider pagination={paginationFactory(paginationOptions)}>
                            {
                                ({
                                    paginationTableProps
                                }) => (
                                    <div className="p-1">
                                        <BootstrapTable
                                            striped
                                            hover
                                            keyField='id'
                                            data={languages}
                                            columns={columns}
                                            defaultSortDirection="asc"
                                            noDataIndication={t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_NO')}
                                            filter={filterFactory()}
                                            {...paginationTableProps} />
                                    </div>
                                )
                            }
                        </PaginationProvider>
                        {/* Question table section end */}
                    </div>
                    <div className="form-group">
                        <label>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_TYPE')} (*):  </label>
                        <SelectValidator name={"TipoPreguntaId"} isSearchable={true}
                            value={TipoPreguntas.filter(({ value }) => value === TipoPreguntaId)}
                            options={TipoPreguntas} onChange={onChangeTipoPreguntaId}
                            validators={['required']}
                            errorMessages={[t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_SELECT')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('CULTOTYPEQUESTIONS.ORDER')} (*):  </label>
                        <TextValidator
                            type="numeric"
                            name={"orden"}
                            className="form-control"
                            value={CultoTipoPregunta.orden}
                            onChange={onChangeCultoTipoPregunta}
                            size="30"
                            maxLength="10"
                            validators={['required', 'isPositive']}
                            errorMessages={
                                [
                                    t('CULTOTYPEQUESTIONS.ORDER_EMPTY'),
                                    t('CULTOTYPEQUESTIONS.ORDER_REQUIRED_NUMBER')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <div className="form-group">
                            <p className="h4">{t('CULTOTYPEQUESTIONS.RESPONSES')}</p>
                        </div>
                        <div className="form-group">
                            <button className="btn btn-secondary" onClick={AddAnswerEmpty}>
                                {t('CULTOTYPEQUESTIONS.RESPONSE_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {Respuestas.map((value, index) => {
                                return (
                                    <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                        <div className="form-group" style={{ width: '100%' }}>
                                            <h5>{t('CULTOTYPEQUESTIONS.RESPONSE')} (*):  </h5>
                                            <br />

                                            <TableMultiLanguage
                                                languages={Respuestas[index].languages}
                                                onChange={(response) => changeRespuestaMultilanguages(response, Respuestas[index].id)}
                                                onValid={(response) => onValid(response, Respuestas[index].id)}
                                            >
                                            </TableMultiLanguage>

                                            <br />

                                            <label title="Número racional">{t('CULTOTYPEQUESTIONS.VALUE')} (*):  </label>
                                            <TextValidator
                                                type="numeric"
                                                title="Número racional"
                                                className="form-control"
                                                size="10"
                                                maxLength="255"
                                                value={Respuestas[index].valor}
                                                id={"answer_v_" + index}
                                                name={"answer_v_" + index}
                                                onChange={AddAnswerV}
                                                validators={['required', 'isFloat']}
                                                errorMessages={
                                                    [
                                                        t('CULTOTYPEQUESTIONS.VALUE_EMPTY'),
                                                        t('CULTOTYPEQUESTIONS.RESPONSE_VALUE_EMPTY')
                                                    ]
                                                }
                                            />
                                            <button className="btn btn-danger mt-2" onClick={(event) => DeleteAnswer(event, index)}>
                                                {t('CULTOTYPEQUESTIONS.RESPONSE_DELETE')}
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                        {Respuestas.length > 0 &&
                            <button className="btn btn-secondary" onClick={AddAnswerEmpty}>
                                {t('CULTOTYPEQUESTIONS.RESPONSE_ADD')}
                            </button>}
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('CULTOTYPEQUESTIONS.SAVE')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar una Pregunta de CultoTipo
 */
const CultoTipoPreguntasEdit = ({ history, match }) => {

    const [TipoPreguntas, setTipoPreguntas] = useState([]);
    const [CultoTipoPregunta, setCultoTipoPregunta] = useState({ id: 0, pregunta: '', orden: 1, TipoPreguntaId: 0 });
    const [ok, setOk] = useState({ ok: 0, CultoTipoPregunta: '', error: null });
    const [Respuestas, SetRespuestas] = useState([]);
    const { t } = useTranslation("global");

    const [languages, setLanguages] = useState([]);
    const [showMultilanguageDeleteConfirm, setShowMultiLanguageDeleteConfirm] = useState(false);
    const [multiLanguageDelete, setMultiLanguageDelete] = useState({});
    const [showMultilanguageEdit, setShowMultiLanguageEdit] = useState(false);
    const [whoShowEdit, setWhoShowEdit] = useState('');
    const [multiLanguageEdit, setMultiLanguageEdit] = useState({});
    const [inputValue, setInputValue] = useState();
    const [showSaveError, setSaveError] = useState(false);
    const [showSaveErrorMessage, setShowSaveErrorMessage] = useState({});

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Used to paint edit and delete buttons
     * @param {*} row Row
     */
    const ActionsFormatter = (row) => {
        return (
            <div className="container">
                <div className="d-flex flex-row justify-content-center">
                    <div className="p-2">
                        <button className="btn btn-primary" onClick={(e) => { clickEdit(row, e) }}>{t('CULTOTYPEQUESTIONS.EDIT')}</button>
                    </div>
                    <div className="p-2">
                        <button className="btn btn-danger" onClick={(e) => { clickDelete(row, e) }}>{t('CULTOTYPEQUESTIONS.DELETE')}</button>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Used to paint component in row and cell
     * @param {*} cell Cell
     * @param {*} row Row
     */
    const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

    /**
     * Table columns
     */
    const columns = [
        {
            dataField: 'label',
            text: t('CULTOTYPEQUESTIONS.LANGUAGE').toUpperCase(),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: 'multilanguage',
            text: t('CULTOTYPEQUESTIONS.VALUE').toUpperCase(),
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: '',
            text: t('CULTOTYPEQUESTIONS.ACTIONS').toUpperCase(),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Pagination total render
     * @param {*} from From
     * @param {*} to To
     * @param {*} size Size
     */
    const paginationTotalRenderer = (from, to, size) => (

        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="CULTOTYPEQUESTIONS.PAGINATION_TOTAL">
                {t('CULTOTYPEQUESTIONS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    /**
     * Pagination to questions table
     */
    const paginationOptions = {
        data: languages,
        totalsize: languages.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languages.length === 0,
        withFirstAndLast: true,
        paginationTotalRenderer
    };

    /****************************************************
     ******************** ALERTS *************************
     ****************************************************/

    /**
     * Close modal
     * @param {*} action Action: 'delete' | 'edit'
     */
    const handleClose = (action) => {
        switch (action) {
            case 'delete':
                setMultiLanguageDelete({});
                setShowMultiLanguageDeleteConfirm(false);
                break;
            case 'edit':
                setMultiLanguageEdit({});
                setShowMultiLanguageEdit(false);
                break;
            case 'save':
                setShowSaveErrorMessage({});
                setSaveError(false);
                break;
            default:
                break;
        }
    }

    /**
     * Set the value to specific language 
     * @param {*} id Id
     * @param {*} multiLanguageValue Value from language
     * @param {*} languages Array languages
     */
    const setMultiLanguageValue2Language = (id, multiLanguageValue, languages) => {
        languages.map(lng => {
            if (lng.id === id) {
                lng.multilanguage = multiLanguageValue;
            }
            return lng;
        });
    }

    /**
     * Get the languages array from parent
     * @param {*} parent Parent
     */
    const getLanguageForParent = (parent) => {
        let lng = [];
        if (parent) {
            switch (parent) {
                case 'questions':
                default:
                    lng = languages;
                    break;
            }
        }
        return lng;
    }

    /**
     * Modify cultotype attibute from parent and set value
     * @param {*} parent Parent
     * @param {*} value Value
     */
    const modifyCultoTypeQuestionForm = (parent, value) => {
        let attribute = '';
        switch (parent) {
            case 'questions':
            default:
                attribute = 'pregunta';
                break;
        }
        CultoTipoPregunta[attribute] = value;
    }

    /**
     * Delete the value from language
     */
    const handleDelete = () => {
        if (multiLanguageDelete.parent) {
            let lng = getLanguageForParent(multiLanguageDelete.parent);
            setMultiLanguageValue2Language(multiLanguageDelete.id, null, lng);
            if (multiLanguageDelete.id === 'en') {
                modifyCultoTypeQuestionForm(multiLanguageDelete.parent, '');
            }
        }
        handleClose('delete');
    };

    /**
     * Action from delete button
     * @param {*} row 
     * @param {*} event 
     */
    const clickDelete = (row, event) => {
        event.preventDefault();
        setWhoShowEdit(row.row.parent);
        setMultiLanguageDelete({ id: row.row.id, multilanguage: row.row.multilanguage, parent: row.row.parent });
        setShowMultiLanguageDeleteConfirm(true);
    };

    /**
     * Actiom from edit button
     * @param {*} row 
     * @param {*} event 
     */
    const clickEdit = (row, event) => {
        event.preventDefault();
        setWhoShowEdit(row.row.parent);
        setShowMultiLanguageEdit(true);
        setMultiLanguageEdit(row.row);
    }

    /**
     * Change input value
     * @param {*} event Event
     */
    const handleChangeInput = (event) => {
        setInputValue(event.target.value);
    }

    /**
     * Set value in corresponding language
     * @param {*} event Event
     */
    const handleSaveEdit = (event) => {
        event.preventDefault();
        if (whoShowEdit) {
            let lng = getLanguageForParent(whoShowEdit);
            setMultiLanguageValue2Language(multiLanguageEdit.id, inputValue, lng);
            if (multiLanguageEdit.id === 'en') {
                modifyCultoTypeQuestionForm(whoShowEdit, inputValue);
            }
        }
        handleClose('edit');
    }

    /**
     * Build Add Modal
     */
    const AddModal = () => {
        return (
            <Modal isOpen={showMultilanguageEdit}>
                <ModalHeader>
                    {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_NEW')}
                </ModalHeader>
                <ModalBody>
                    {t('CULTOTYPEQUESTIONS.NEW')}
                    {<input className="form-control" type="text" maxLength="255" onChange={(e) => { handleChangeInput(e) }} />}
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-primary' variant="primary" onClick={(e) => handleSaveEdit(e)}>
                        {t('CULTOTYPEQUESTIONS.SAVE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('edit') }}>{t('CULTOTYPEQUESTIONS.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Build Delete Modal
     */
    const deleteModal = () => {
        return (
            <Modal isOpen={showMultilanguageDeleteConfirm}>
                <ModalHeader>
                    {t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_DELETE')}
                </ModalHeader>
                <ModalBody>{t('CULTOTYPEQUESTIONS.DELETE')}: {multiLanguageDelete.multilanguage}!</ModalBody>
                <ModalFooter>
                    <button className='btn btn-secondary' variant="secondary" onClick={handleDelete}>
                        {t('CULTOTYPEQUESTIONS.DELETE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('delete') }}>{t('CULTOTYPEQUESTIONS.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * It is used to add the multilanguage value to its corresponding language
     * @param {*} language Language
     * @param {*} values Values
     * @param {*} parent Parent: 'woman' | 'man' | 'description'
     */
    const transformLanguageByValues = (language, values, parent) => {
        let lngs = _.cloneDeep(language);
        if (lngs && Array.isArray(lngs)) {
            lngs.map(lng => {
                if (values && values[lng.id]) {
                    lng.multilanguage = values[lng.id];
                }
                lng.parent = parent;
                return lng;
            });
        }
        return lngs;
    }

    const addSpanishValueWhenNoMultiLanguage = (obj, attributeBase, attributeMultiLanguage) => {
        let value = obj[attributeMultiLanguage];
        if (obj && (obj[attributeMultiLanguage] === null || obj[attributeMultiLanguage] === undefined)) {
            value = { 'es': obj[attributeBase] };
        }
        return value;
    }

    /**
     * Add for any one response the languages array for table multilanguage
     * @param {*} language Language
     * @param {*} responses Responses
     * @returns Return responses with languages array for any one
     */
    const transformResponsesQuestion = (language, responses) => {
        responses.map(resp => {
            resp.respuesta_multi = addSpanishValueWhenNoMultiLanguage(resp, 'respuesta', 'respuesta_multi');
            let lngs = _.cloneDeep(language);
            lngs.map(lng => {
                let rspFind = resp.respuesta_multi[lng.id];
                if (rspFind) {
                    lng.multilanguage = rspFind;
                }
                return lng;
            });
            let englishLanguage = lngs.find(lng => lng.id === 'en');
            if (englishLanguage && !isNull(englishLanguage.multilanguage)
                && !isUndefined(englishLanguage.multilanguage)
                && !isEmpty(englishLanguage.multilanguage.trim())) {
                resp.valid = true;
            } else {
                resp.valid = false;
            }
            resp.languages = lngs;
            return resp;
        });
        return responses;
    }

    // recoger los datos de la pregunta y de los tipos de preguntas
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
                    }

                    axios.get(myInitObject.crudServer + '/crud/cultotipo_pregunta/edit/' + match.params.id,
                        { withCredentials: true })
                        .then(response => {
                            axios.get(myInitObject.crudServer + '/crud/tipopreguntas',
                                { withCredentials: true })
                                .then(responseP => {
                                    let responsesModified = transformResponsesQuestion(responseLanguages.data, response.data.respuestas);
                                    SetRespuestas(responsesModified);
                                    setCultoTipoPregunta(response.data);
                                    setTipoPreguntas(responseP.data.map(element => { return { value: element.id, label: element.tipo } }));
                                    let lngs = transformLanguageByValues(responseLanguages.data, response.data.pregunta_multi, 'questions');
                                    setLanguages(lngs);
                                })
                                .catch(function (error) {
                                    console.error(error);
                                })
                        })
                        .catch(function (error) {
                            console.error(error);
                        })
                });
        },
        [history, match]
    );

    // cambio en el formulario del valor de alguna propiedad de la pregunta
    const onChangeCultoTipoPregunta = ((e) => {
        let obj = JSON.parse(JSON.stringify(CultoTipoPregunta));
        obj[e.target.name] = e.target.value;
        setCultoTipoPregunta(obj);
    });

    const onChangeTipoPreguntaId = ((e) => {
        const obj = {
            id: CultoTipoPregunta.id, pregunta: CultoTipoPregunta.pregunta,
            orden: CultoTipoPregunta.orden, TipoPreguntaId: e.value
        };
        setCultoTipoPregunta(obj);
    });

    // modificar pregunta
    const onSubmit = ((e) => {
        e.preventDefault();
        setOk({ error: null });
        let responsesValidation = Respuestas.find(resp => !resp.valid) === undefined;
        if (checkEnglishValidation((languages)) && responsesValidation) {
            Respuestas.map(resp => {
                let lngJSON = transformLanguageToJson(resp.languages);
                if (JSON.parse(lngJSON) && JSON.parse(lngJSON).en) {
                    resp.respuesta_multi = JSON.parse(lngJSON);
                    resp.respuesta = JSON.parse(lngJSON).en;
                }
                return resp;
            })
            let lngJSON = transformLanguageToJson(languages);
            if (JSON.parse(lngJSON) && JSON.parse(lngJSON).en) {
                CultoTipoPregunta.pregunta = JSON.parse(lngJSON).en;
            }

            const obj = {
                id: CultoTipoPregunta.id,
                pregunta: CultoTipoPregunta.pregunta,
                pregunta_multi: lngJSON,
                orden: CultoTipoPregunta.orden,
                TipoPreguntaId: CultoTipoPregunta.TipoPreguntaId,
                respuestas: Respuestas,
                visible: 1
            };
            axios.post(myInitObject.crudServer + '/crud/cultotipo_pregunta/update', obj,
                { withCredentials: true })
                .then(res => {
                    let retStr = res.data.pregunta;
                    if (res.data.respuestas.length > 0) {
                        retStr += ' con respuestas: ';
                        res.data.respuestas.forEach((respuesta, index) => {
                            if (index > 0) retStr += " ; ";
                            retStr += respuesta.respuesta + ', valor: ' + respuesta.valor;
                        });
                    }
                    setOk({ ok: 1, CultoTipoPregunta: retStr });
                    setTimeout(() => {
                        history.push('/cultotipo_pregunta/');
                    }, 2000);
                }
                ).catch(function (error) {
                    if (error && error.response && error.response.data && JSON.stringify(error.response.data) !== '{}') {
                        setOk({ ok: -1, CultoTipoPregunta: obj.pregunta, error: error.response.data });
                    } else {
                        setOk({ ok: -1, CultoTipoPregunta: obj.pregunta });
                    }
                });
            setOk({ ok: 0, CultoTipoPregunta: '' });
        } else {
            let body = 'CULTOTYPEQUESTIONS.';
            if (transformLanguageToJson(languages)) {
                body += 'CULTOTYPE_QUESTION_ENGLISH'
            }
            setShowSaveErrorMessage({ title: 'CULTOTYPEQUESTIONS.ERROR', body: body });
            setSaveError(true);
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPEQUESTIONS.CULTOTYPE_MODIFICATION_OK_STRONG">
                        {t('CULTOTYPEQUESTIONS.CULTOTYPE_MODIFICATION_OK_STRONG', { cultotypePregunta: ok.CultoTipoPregunta })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPEQUESTIONS.CULTOTYPE_MODIFICATION_ERROR_STRONG">
                        {t('CULTOTYPEQUESTIONS.CULTOTYPE_MODIFICATION_ERROR_STRONG', { cultotypePregunta: ok.CultoTipoPregunta })}
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
        setOk({ ok: 2, CultoTipoPregunta: ok.CultoTipoPregunta });
    };

    // añadir respuesta vacía al formulario
    const AddAnswerEmpty = ((e) => {
        const values = [...Respuestas];
        let lng = _.cloneDeep(languages);
        lng.map(ln => {
            ln.multilanguage = undefined;
            ln.parent = undefined;
            return ln;
        })
        values.push({ respuesta: '', valor: '', languages: lng, valid: false });
        SetRespuestas(values);
    });

    // añadir valor a la respuesta
    const AddAnswerV = ((e) => {
        let index = e.target.id.replace('answer_v_', '');
        const values = [...Respuestas];
        if (values[index] === undefined) {
            values[index] = { respuesta: '', valor: '' };
        }
        values[index].valor = e.target.value;
        SetRespuestas(values);
    });

    const DeleteAnswer = (event, index) => {
        event.preventDefault();
        const values = [...Respuestas];
        values.splice(index, 1);
        SetRespuestas(values);
    };

    /**
     * Check english language are multilanguage value
     * @param {*} language Language
     * @returns Return true = ok, false = isNull or isUndefined or isEmpty
     */
    const checkEnglishValidation = (language) => {
        let lngEnglish = language.find(lng => lng.id === 'en');
        if (lngEnglish && lngEnglish.multilanguage) {
            return !isNull(lngEnglish.multilanguage)
                && !isUndefined(lngEnglish.multilanguage)
                && !isEmpty(lngEnglish.multilanguage.trim());
        }
        return false;
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
     * Show error Modal when save cultotype not is completed with english parameters
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
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>{t('CULTOTYPEQUESTIONS.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Change response from cultotype question
     * @param {*} response Values from new languages
     * @param {*} id Id from language
     */
    const changeRespuestaMultilanguages = (response, id) => {
        let responses = _.cloneDeep(Respuestas)
        responses.map(resp => {
            if (resp.id === id) {
                resp.languages = response;
            }
            return resp;
        });
        SetRespuestas(responses);
    }

    /**
     * Change response from cultotype question
     * @param {*} response Values from new languages
     * @param {*} id Id from language
     */
    const onValid = (response, id) => {
        let responses = _.cloneDeep(Respuestas)
        responses.map(resp => {
            if (resp.id === id) {
                resp.valid = response;
            }
            return resp;
        });
        SetRespuestas(responses);
    }

    // pintar formulario
    return (
        <div className="container">
            {showMultilanguageEdit && AddModal()}
            {showSaveErrorMessage && errorModal()}
            {ok.ok !== 1 && ok.ok !== 1 && showMultilanguageDeleteConfirm && deleteModal()}

            <ModalAction show={ok.ok === 1}
                header={t('CULTOTYPEQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('CULTOTYPEQUESTIONS.CULTOTYPE_MODIFICATION_OK', { cultotypePregunta: ok.CultoTipoPregunta })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('CULTOTYPEQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('CULTOTYPEQUESTIONS.CULTOTYPE_MODIFICATION_ERROR', { cultotypePregunta: ok.CultoTipoPregunta })}
                errorMessage={ok.error}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTIOSN_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"pregunta"}
                            className="form-control"
                            value={CultoTipoPregunta.pregunta}
                            onChange={onChangeCultoTipoPregunta}
                            size="30"
                            maxLength="255"
                            disabled
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_EMPTY'),
                                    t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_LIMIT_LENGTH')
                                ]
                            }
                        />

                        { /* Question table section start */}
                        <PaginationProvider pagination={paginationFactory(paginationOptions)}>
                            {
                                ({
                                    paginationTableProps
                                }) => (
                                    <div className="p-1">
                                        <BootstrapTable
                                            striped
                                            hover
                                            keyField='id'
                                            data={languages}
                                            columns={columns}
                                            defaultSortDirection="asc"
                                            noDataIndication={t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_NO')}
                                            filter={filterFactory()}
                                            {...paginationTableProps} />
                                    </div>
                                )
                            }
                        </PaginationProvider>
                        {/* Question table section end */}
                    </div>
                    <div className="form-group">
                        <label>{t('CULTOTYPEQUESTIONS.CULTOTYPE_QUESTION_TYPE')} (*):  </label>
                        <SelectValidator name={"TipoPreguntaId"}
                            value={TipoPreguntas.filter(({ value }) => value === CultoTipoPregunta.TipoPreguntaId)}
                            isSearchable={true} options={TipoPreguntas} onChange={onChangeTipoPreguntaId} />
                    </div>
                    <div className="form-group">
                        <label>{t('CULTOTYPEQUESTIONS.ORDER')} (*): </label>
                        <TextValidator
                            type="numeric"
                            name={"orden"}
                            className="form-control"
                            value={CultoTipoPregunta.orden}
                            onChange={onChangeCultoTipoPregunta}
                            size="30"
                            maxLength="10"
                            validators={['required', 'isPositive']}
                            errorMessages={
                                [
                                    t('CULTOTYPEQUESTIONS.ORDER_EMPTY'),
                                    t('CULTOTYPEQUESTIONS.ORDER_REQUIRED_NUMBER')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <div className="form-group">
                            <p className="h4">{t('CULTOTYPEQUESTIONS.RESPONSES')}</p>
                        </div>
                        <div className="form-group">
                            <button className="btn btn-secondary" onClick={AddAnswerEmpty}>
                                {t('CULTOTYPEQUESTIONS.RESPONSE_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {Respuestas.map((value, index) => {
                                return (
                                    <li className="list-group-item d-flex justify-content-between align-items-center" key={index}>
                                        <div className="form-group" style={{ width: '100%' }}>
                                            <h5>{t('CULTOTYPEQUESTIONS.RESPONSE')} (*):  </h5>

                                            <TableMultiLanguage
                                                languages={Respuestas[index].languages}
                                                onChange={(response) => changeRespuestaMultilanguages(response, Respuestas[index].id)}
                                                onValid={(response) => onValid(response, Respuestas[index].id)}
                                            >
                                            </TableMultiLanguage>

                                            <br />

                                            <label title="Número racional">{t('CULTOTYPEQUESTIONS.VALUE')} (*):  </label>
                                            <TextValidator
                                                type="numeric"
                                                title="Número racional"
                                                className="form-control"
                                                size="10"
                                                maxLength="255"
                                                value={Respuestas[index].valor}
                                                id={"answer_v_" + index}
                                                name={"answer_v_" + index}
                                                onChange={AddAnswerV}
                                                validators={['required', 'isFloat']}
                                                errorMessages={
                                                    [
                                                        t('CULTOTYPEQUESTIONS.VALUE_EMPTY'),
                                                        t('CULTOTYPEQUESTIONS.RESPONSE_VALUE_EMPTY')
                                                    ]
                                                }
                                            />
                                            <button className="btn btn-danger mt-2" onClick={(event) => DeleteAnswer(event, index)}>
                                                {t('CULTOTYPEQUESTIONS.RESPONSE_DELETE')}
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                        {Respuestas.length > 0 &&
                            <button className="btn btn-secondary" onClick={AddAnswerEmpty}>
                                {t('CULTOTYPEQUESTIONS.RESPONSE_ADD')}
                            </button>}
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('CULTOTYPEQUESTIONS.SAVE')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};
