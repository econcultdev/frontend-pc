/**
 * Mantenimiento de Preguntas de Encuestas
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
import Select from 'react-select';

import ModalAction from './ModalAction';
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';
import TextValidator from './TextValidator';

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

/**
 * Componente que implementa los procesos CRUD para ls preguntas de encuestas
 */
class EncuestaPreguntas extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        // unsubscribe to ensure no memory leaks
        this.subscription.unsubscribe();
    }

    /**
     * Definición de las rutas del mantenimiento de las preguntas
     */
    render() {
        const { t } = this.props;
        return (
            <React.Fragment>
                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('SURVEYSQUESTIONS.SURVEY_QUESTIONS_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/encuesta_pregunta" render={() => <EncuestaPreguntasList {...this.props} />} />
                    <Route path="/encuesta_pregunta/add" component={withAuth(EncuestaPreguntasAdd)} />
                    <Route path="/encuesta_pregunta/edit/:id" component={withAuth(EncuestaPreguntasEdit)} />
                    <Route path="/encuesta_pregunta/delete/:id" component={withAuth(EncuestaPreguntasDelete)} />
                </Switch>
            </React.Fragment>
        )
    }
};

export default withTranslation('global')(EncuestaPreguntas);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de preguntas
 *
 */
const ListLinks = ({ history, action, administrador, permisosAcciones }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    {(administrador || permisosAcciones['/encuesta_pregunta']['listar']) &&
                        <div className="col-md-2">
                            <EncuestaPreguntasListLink history={history} />
                        </div>
                    }
                    {(administrador || permisosAcciones['/encuesta_pregunta']['crear']) &&
                        <div className="col-md-2">
                            <EncuestaPreguntasAddLink history={history} />
                        </div>
                    }
                </div>
            </div>
        );
    }
    if (action !== 'list' && (administrador || permisosAcciones['/encuesta_pregunta']['listar'])) {
        ret = true;
        return (
            <div className="container">
                <EncuestaPreguntasListLink history={history} />
            </div>
        );
    }
    if (action !== 'add' && (administrador || permisosAcciones['/encuesta_pregunta']['crear'])) {
        ret = true;
        return (
            <div className="container">
                <EncuestaPreguntasAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de preguntas
 */
const EncuestaPreguntasListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/encuesta_pregunta') }}>
            {t('SURVEYSQUESTIONS.SURVEY_QUESTIONS_LIST')}
        </button>
    );
};

/**
 * Enlace a crear una pregunta
 */
const EncuestaPreguntasAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/encuesta_pregunta/add') }}>
            {t('SURVEYSQUESTIONS.SURVEY_QUESTIOSN_ADD')}
        </button>
    );
};


/**
 * Componente para listar preguntas en una tabla
 */
const EncuestaPreguntasList = ({ history, administrador, permisosAcciones }) => {

    const [encuestapreguntas, setEncuestaPreguntas] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");

    /**
     * Borrar pregunta
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
        if (administrador) {
            return (
                <div className="container">
                    <div className="row">
                        <div className="col-md-8">
                            <button className="btn btn-primary" onClick={() => { history.push('/encuesta_pregunta/edit/' + row.row.id) }}>
                                {t('SURVEYSQUESTIONS.EDIT')}
                            </button>
                        </div>
                        <div className="col-md-8">
                            <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                {t('SURVEYSQUESTIONS.DELETE')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else if (permisosAcciones['/encuesta_pregunta'] && (permisosAcciones['/encuesta_pregunta']['modificar'] || permisosAcciones['/encuesta_pregunta']['borrar'])) {
            return (
                <div className="container">
                    <div className="row">
                        {permisosAcciones['/encuesta_pregunta']['modificar'] &&
                            <div className="col-md-8">
                                <button className="btn btn-primary" onClick={() => { history.push('/encuesta_pregunta/edit/' + row.row.id) }}>
                                    {t('SURVEYSQUESTIONS.EDIT')}
                                </button>
                            </div>
                        }
                        {permisosAcciones['/encuesta_pregunta']['borrar'] &&
                            <div className="col-md-8">
                                <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                    {t('SURVEYSQUESTIONS.DELETE')}
                                </button>
                            </div>
                        }
                    </div>
                </div>
            );
        } else {
            return (
                <div className="container">
                    <div className="row"></div>
                </div>
            );
        }
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
            text: t('SURVEYSQUESTIONS.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: 'code',
            text: t('SURVEYSQUESTIONS.CODE').toUpperCase(),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('pregunta', 'pregunta_multi'),
            text: t('SURVEYSQUESTIONS.QUESTION'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: getColumnJSONMultilanguage('TipoPregunta.tipo', 'TipoPregunta.tipo_multi'),
            text: t('SURVEYSQUESTIONS.SURVEY_QUESTION_TYPE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('SURVEYSQUESTIONS.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger las preguntas
     */
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/encuestapreguntas',
                { withCredentials: true })
                .then(response => {
                    setEncuestaPreguntas(response.data);
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
            <Trans i18nKey="SURVEYSQUESTIONS.PAGINATION_TOTAL">
                {t('SURVEYSQUESTIONS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: encuestapreguntas,
        totalsize: encuestapreguntas.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: encuestapreguntas.length === 0,
        withFirstAndLast: true,
        firstPageText: t('SURVEYSQUESTIONS.FIRST_PAGE_TEXT'),
        firstPageTitle: t('SURVEYSQUESTIONS.FIRST_PAGE_TITLE'),
        prePageText: t('SURVEYSQUESTIONS.PRE_PAGE_TEXT'),
        prePageTitle: t('SURVEYSQUESTIONS.PRE_PAGE_TITLE'),
        nextPageText: t('SURVEYSQUESTIONS.NEXT_PAGE_TEXT'),
        nextPageTitle: t('SURVEYSQUESTIONS.NEXT_PAGE_TITLE'),
        lastPageText: t('SURVEYSQUESTIONS.LAST_PAGE_TEXT'),
        lastPageTitle: t('SURVEYSQUESTIONS.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    // campo de ordenación por defecto en la tabla
    const defaultSorted = [{
        dataField: 'pregunta',
        order: 'asc'
    }];

    // cerrar modal de confirmación de borrado
    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }

    // borrado de la pregunta
    const handleDelete = () => {
        history.push('/encuesta_pregunta/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado si se tiene permisos
    return (
        <div className="container">

            {(!administrador && !permisosAcciones['/encuesta_pregunta']['listar']) &&
                <Redirect to="/backend" />
            }
            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('SURVEYSQUESTIONS.SURVEY_QUESTION_DELETE')}
                </ModalHeader>
                <ModalBody>
                    {t('SURVEYSQUESTIONS.SURVEY_QUESTION_DELETE')}: {idDelete.pregunta}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}> {t('SURVEYSQUESTIONS.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('SURVEYSQUESTIONS.DELETE')}
                    </button>
                </ModalFooter>
            </Modal>

            <ListLinks history={history} action="list" administrador={administrador} permisosAcciones={permisosAcciones} />
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
                                    data={encuestapreguntas}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('SURVEYSQUESTIONS.NOT_SURVEY_QUESTION')}
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
 * Componente de borrado de preguntas
 */
const EncuestaPreguntasDelete = ({ history, match, administrador, permisosAcciones }) => {

    // borrar la pregunta y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/encuestapregunta/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/encuesta_pregunta'))
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history, match]
    );

    return (
        <ListLinks history={history} action="delete" administrador={administrador} permisosAcciones={permisosAcciones} />
    );
};


/**
 * Componente para añadir una pregunta
 */
const EncuestaPreguntasAdd = ({ history, administrador, permisosAcciones }) => {

    const [questionSurvey, setQuestionSurvey] = useState({
        code: '',
        pregunta: '',
        pregunta_multi: [],
        titulo_corto: '',
        titulo_corto_multi: [],
        descripcion: '',
        descripcion_multi: [],
        valid: false
    });
    const [TipoPreguntas, setTipoPreguntas] = useState([]);
    const [TipoPreguntaId, setTipoPreguntaId] = useState(0);
    const [ok, setOk] = useState({ ok: 0, encuestapregunta: '' });
    const [Preguntas, setPreguntas] = useState([]);
    const [EncuestaPreguntasSiguientes, setEncuestaPreguntasSiguientes] = useState([]);
    const [EncuestaPreguntaSiguiente, setEncuestaPreguntaSiguiente] = useState({ PreguntaSiguienteId: 0, respuesta: '' });
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
                        {t('EVENTS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const showModalActionClose = () => {
        setOk({ ok: 2, evento: ok.evento });
    };

    // recoger tipos de preguntas y preguntas de encuestas para mostrarlas en un combo
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
                        questionSurvey.pregunta_multi = _.cloneDeep(responseLanguages.data);
                        questionSurvey.titulo_corto_multi = _.cloneDeep(responseLanguages.data);
                        questionSurvey.descripcion_multi = _.cloneDeep(responseLanguages.data);
                        setQuestionSurvey(questionSurvey);
                    }
                });

            const tipopreguntas = axios.get(myInitObject.crudServer + '/crud/tipopreguntas',
                { withCredentials: true });
            const preguntas = axios.get(myInitObject.crudServer + '/crud/encuestapreguntas',
                { withCredentials: true });
            Promise.all([tipopreguntas, preguntas])
                .then(response => {
                    setTipoPreguntas(response[0].data.map(element => { return { value: element.id, label: element.tipo } }));
                    setPreguntas(response[1].data.map(element => {
                        let lLabel = null;
                        if (element.pregunta_multi[languageI18N]) {
                            lLabel = element.pregunta_multi[languageI18N];
                        } else {
                            lLabel = element.pregunta;
                        }
                        lLabel = lLabel + ' | ' + t('SURVEYSQUESTIONS.TYPE') + ': ';
                        if (element.TipoPregunta.tipo_multi[languageI18N]) {
                            lLabel = lLabel + element.TipoPregunta.tipo_multi[languageI18N];
                        } else {
                            lLabel = lLabel + element.TipoPregunta.tipo;
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
        },
        [history, t]
    );

    const onChangeTipoPreguntaId = ((e) => {
        setTipoPreguntaId(e.value);
    });

    const onChangeCode = ((e) => {
        if (e && e.target && e.target.value && e.target.value.trim() !== '') {
            let lQuestionSurvey = _.cloneDeep(questionSurvey);
            lQuestionSurvey.code = e.target.value.trim();
            setQuestionSurvey(lQuestionSurvey);
        }
    });

    const handleEncuestaPreguntaSiguiente = ((e) => {
        setEncuestaPreguntaSiguiente({ PreguntaSiguienteId: e.value, respuesta: '' });
    });

    // añadir respuesta a una pregunta siguiente
    const handleEncuestaPreguntaSiguienteRespuesta = ((e) => {
        const name = e.target.name;
        const id = parseInt(name.replace('respuesta_', ''), 10);
        const respuesta = e.target.value;
        const values = [...EncuestaPreguntasSiguientes];
        let eps = values.filter((el) => el.PreguntaSiguienteId === id)[0];
        eps['respuesta'] = respuesta;
        setEncuestaPreguntasSiguientes(values);
    });

    // añadir una pregunta siguiente vacía al formulario
    const AddEncuestaPreguntaSiguienteEmpty = ((e) => {
        e.preventDefault();
        for (const eps of EncuestaPreguntasSiguientes) {
            if (eps.PreguntaSiguienteId === EncuestaPreguntaSiguiente.PreguntaSiguienteId)
                return;
        }
        if (EncuestaPreguntaSiguiente.PreguntaSiguienteId) {
            let obj = JSON.parse(JSON.stringify(EncuestaPreguntasSiguientes));
            obj.push({ PreguntaSiguienteId: EncuestaPreguntaSiguiente.PreguntaSiguienteId, respuesta: EncuestaPreguntaSiguiente.respuesta });
            setEncuestaPreguntasSiguientes(obj);
        }
    });

    const DeleteEncuestaPreguntaSiguiente = (index) => {
        const values = [...EncuestaPreguntasSiguientes];
        values.splice(index, 1);
        setEncuestaPreguntasSiguientes(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesQuestionSurvey = (response, singleVariable, multiVariable) => {
        let lQuestionSurvey = _.cloneDeep(questionSurvey);
        lQuestionSurvey[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lQuestionSurvey[singleVariable] = rp.multilanguage;
            }
        });
        setQuestionSurvey(lQuestionSurvey);
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
        let variablesMulti = ['pregunta_multi', 'titulo_corto_multi', 'descripcion_multi'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(questionSurvey[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            questionSurvey[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!questionSurvey[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                questionSurvey.valid = false;
                break;
            } else {
                questionSurvey.valid = true;
            }
        }
    }

    /**
     * Add next questions to Survey
     */
    const addQuestionSurveyNextQuestion = () => {
        let epss = JSON.parse(JSON.stringify(EncuestaPreguntasSiguientes));
        if (epss.length) {
            const tipo = TipoPreguntas.filter((el) => el.value === TipoPreguntaId)[0];
            for (const eps of epss) {
                if (tipo.label === 'Sí/No') {
                    if (/^\s*[SsyY1][íiÍI]?\s*$/.test(eps.respuesta)) {
                        eps['respuesta'] = 1;
                    } else {
                        eps['respuesta'] = 0;
                    }
                }
                if (eps.respuesta) {
                    eps.respuesta_multi = {
                        'en': eps.respuesta
                    }
                }
                eps.visible = 1;
            }
        }
        questionSurvey.nextQuestions = epss;
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getQuestionSurveyObject2Add = () => {
        let lQuestionSurvey = {
            code: questionSurvey.code,
            pregunta: questionSurvey.pregunta,
            pregunta_multi: questionSurvey.pregunta_multi2,
            titulo_corto: questionSurvey.titulo_corto,
            titulo_corto_multi: questionSurvey.titulo_corto_multi2,
            descripcion: questionSurvey.descripcion,
            descripcion_multi: questionSurvey.descripcion_multi2,
            TipoPreguntaId: TipoPreguntaId,
            encuestapreguntassiguientes: questionSurvey.nextQuestions
        }
        return lQuestionSurvey;
    }

    // crear pregunta
    const onSubmit = ((e) => {
        e.preventDefault();
        changeResponseValidation(['pregunta_multi']);
        transformEventToMultiLenguage();
        if (questionSurvey && questionSurvey.valid) {
            addQuestionSurveyNextQuestion();
            let lQuestionSurvey = getQuestionSurveyObject2Add();
            axios.post(myInitObject.crudServer + '/crud/encuestapregunta/add', lQuestionSurvey,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'SURVEYSQUESTIONS.QUESTION_OF_REGISTRATION',
                        body: 'SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_OK', object: { surveyQuestion: lQuestionSurvey.pregunta }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/encuesta_pregunta/');
                    }, 2000);
                }).catch(function (error) {
                    setOk({ ok: -1, encuestapregunta: questionSurvey.pregunta });
                    setTimeout(() => {
                        history.push('/encuesta_pregunta/');
                    }, 2000);
                });
        } else {
            setOk({ ok: -1, encuestapregunta: questionSurvey.pregunta });
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_OK_STRONG">
                        {t('SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_OK_STRONG', { surveyQuestion: ok.encuestapregunta })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_ERROR_STRONG">
                        {t('SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_ERROR_STRONG', { surveyQuestion: ok.encuestapregunta })}
                    </Trans>
                </div>
            );
        } else {
            return (
                <div>&nbsp;</div>
            )
        }
    };

    // pintar formulario de creación de la pregunta
    return (
        <div className="container">
            {(!administrador && !permisosAcciones['/encuesta_pregunta']['crear']) &&
                <Redirect to="/backend" />
            }

            {modalOpen && openModal()}

            <ModalAction show={ok.ok === 1}
                header={t('SURVEYSQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_OK', { surveyQuestion: ok.encuestapregunta })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('SURVEYSQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_ERROR', { surveyQuestion: ok.encuestapregunta })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="add" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('SURVEYSQUESTIONS.SURVEY_QUESTIOSN_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.CODE')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"code"}
                            className="form-control"
                            onChange={onChangeCode}
                            value={questionSurvey.code}
                            size="30"
                            maxLength="100"
                            validators={['required']}
                            errorMessages={
                                [
                                    t('SURVEYSQUESTIONS.CODE_EMPTY'),
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.QUESTION')} (*):  </label>
                        <TableMultiLanguage
                            languages={questionSurvey.pregunta_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionSurvey(response, 'pregunta', 'pregunta_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.SURVEY_QUESTION_TYPE')} (*):  </label>
                        <SelectValidator name={"TipoPreguntaId"} isSearchable={true}
                            value={TipoPreguntas.filter(({ value }) => value === TipoPreguntaId)}
                            options={TipoPreguntas} onChange={onChangeTipoPreguntaId}
                            validators={['required']}
                            errorMessages={[t('SURVEYSQUESTIONS.SURVEY_QUESTION_SELECT')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.TITLE_SHORT')}:  </label>
                        <TableMultiLanguage
                            languages={questionSurvey.titulo_corto_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionSurvey(response, 'titulo_corto', 'titulo_corto_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.DESCRIPTION')}:  </label>
                        <TableMultiLanguage
                            languages={questionSurvey.descripcion_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionSurvey(response, 'descripcion', 'descripcion_multi')
                            }
                            onValid={() => { }}
                            showTextArea={true}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('SURVEYSQUESTIONS.SURVEY_QUESTIONS_RESPONSES_NEXT')}</p></div>
                        <div className="form-group">
                            <label>{t('SURVEYSQUESTIONS.SURVEY_QUESTION_NEXT_SELECT')}:  </label>
                            <Select name={"Pregunta"} isSearchable={true}
                                onChange={handleEncuestaPreguntaSiguiente}
                                options={Preguntas}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddEncuestaPreguntaSiguienteEmpty}
                                disabled={!EncuestaPreguntaSiguiente.PreguntaSiguienteId}>
                                {t('SURVEYSQUESTIONS.SURVEY_QUESTION_ADD_NEXT')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {EncuestaPreguntasSiguientes.map((pregunta, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('SURVEYSQUESTIONS.QUESTION')}: {pregunta.pregunta}</p>
                                        </div>
                                        <div>
                                            {t('SURVEYSQUESTIONS.RESPONSE')}: <input type="text" name={"respuesta_" + pregunta.PreguntaSiguienteId}
                                                id={"respuesta_" + pregunta.PreguntaSiguienteId} onChange={handleEncuestaPreguntaSiguienteRespuesta}
                                                value={pregunta.respuesta}></input>
                                        </div>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteEncuestaPreguntaSiguiente(index) }}>
                                                {t('SURVEYSQUESTIONS.SURVEY_QUESTION_DELETE_NEXT')}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })
                            }
                        </ul>
                    </div>
                    {EncuestaPreguntasSiguientes.length > 0 &&
                        <div className="form-group">
                            <div className="form-group">
                                <label>{t('SURVEYSQUESTIONS.SURVEY_QUESTION_SELECT_OTHER')}:  </label>
                                <Select name={"Pregunta"} isSearchable={true}
                                    onChange={handleEncuestaPreguntaSiguienteRespuesta}
                                    options={Preguntas}
                                />
                                <button className="btn btn-secondary mt-2" onClick={AddEncuestaPreguntaSiguienteEmpty} disabled={!EncuestaPreguntaSiguiente.PreguntaSiguienteId}>
                                    {t('SURVEYSQUESTIONS.SURVEY_QUESTION_ADD_NEXT')}
                                </button>
                            </div>
                        </div>}
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTER')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar una pregunta
 */
const EncuestaPreguntasEdit = ({ history, match, administrador, permisosAcciones }) => {

    const [questionSurvey, setQuestionSurvey] = useState({
        code: '',
        pregunta: '',
        pregunta_multi: [],
        titulo_corto: '',
        titulo_corto_multi: [],
        descripcion: '',
        descripcion_multi: [],
        valid: false,
        TipoPreguntaId: null,
        id: 0
    });
    const [TipoPreguntas, setTipoPreguntas] = useState([]);
    const [encuestapregunta, setEncuestaPregunta] = useState({ id: 0, pregunta: '', TipoPreguntaId: 0, titulo_corto: '', descripcion: '' });
    const [ok, setOk] = useState({ ok: 0, encuestapregunta: '' });
    const [Preguntas, setPreguntas] = useState([]);
    const [EncuestaPreguntasSiguientes, setEncuestaPreguntasSiguientes] = useState([]);
    const [EncuestaPreguntaSiguiente, setEncuestaPreguntaSiguiente] = useState({ PreguntaSiguienteId: 0, respuesta: '' });
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
                        {t('EVENTS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const showModalActionClose = () => {
        setOk({ ok: 2, evento: ok.evento });
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

    // recoger datos de la pregunta, de los tipos de preguntas y de las preguntas de encuestas
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
                        questionSurvey.pregunta_multi = _.cloneDeep(responseLanguages.data);
                        questionSurvey.titulo_corto_multi = _.cloneDeep(responseLanguages.data);
                        questionSurvey.descripcion_multi = _.cloneDeep(responseLanguages.data);

                        axios.get(myInitObject.crudServer + '/crud/encuestapregunta/edit/' + match.params.id,
                            { withCredentials: true }).then(response => {
                                let lVariablesMulti = ['pregunta_multi', 'titulo_corto_multi', 'descripcion_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, response.data[vMulti]);
                                    response.data[vMulti] = lValues;
                                });
                                if (response.data && !response.data.code) {
                                    response.data.code = '';
                                }
                                setQuestionSurvey(response.data);
                            });
                    }
                });


            const encuestapregunta = axios.get(myInitObject.crudServer + '/crud/encuestapregunta/edit/' + match.params.id,
                { withCredentials: true });
            const preguntas = axios.get(myInitObject.crudServer + '/crud/encuestapreguntas',
                { withCredentials: true });
            const tipopreguntas = axios.get(myInitObject.crudServer + '/crud/tipopreguntas',
                { withCredentials: true });
            Promise.all([encuestapregunta, preguntas, tipopreguntas])
                .then(response => {
                    setEncuestaPregunta(response[0].data);

                    if (response[0].data.EPId.length) {
                        const tipo = response[2].data.filter((el) => el.id === response[0].data.TipoPreguntaId)[0];
                        for (let eps of response[0].data.EPId) {
                            eps['PreguntaSiguienteId'] = eps.EncuestaPreguntaSiguienteId;
                            delete eps['EncuestaPreguntaSiguienteId'];
                            delete eps['EncuestaPreguntaId'];
                            if (tipo.tipo === 'Sí/No') {
                                if (eps.respuesta === '1') {
                                    eps['respuesta'] = 'Sí';
                                } else {
                                    eps['respuesta'] = 'No';
                                }
                            }
                        }
                    }
                    setEncuestaPreguntasSiguientes(response[0].data.EPId);
                    setPreguntas(response[1].data.map(element => {
                        let lLabel = null;
                        if (element.pregunta_multi[languageI18N]) {
                            lLabel = element.pregunta_multi[languageI18N];
                        } else {
                            lLabel = element.pregunta;
                        }
                        lLabel = lLabel + ' | ' + t('SURVEYSQUESTIONS.TYPE') + ': ';
                        if (element.TipoPregunta.tipo_multi[languageI18N]) {
                            lLabel = lLabel + element.TipoPregunta.tipo_multi[languageI18N];
                        } else {
                            lLabel = lLabel + element.TipoPregunta.tipo;
                        }
                        return {
                            value: element.id,
                            label: lLabel
                        }
                    }));
                    setTipoPreguntas(response[2].data.map(element => { return { value: element.id, label: element.tipo } }));
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history, match, t]
    );

    const onChangeTipoPreguntaId = ((e) => {
        const obj = { id: encuestapregunta.id, pregunta: encuestapregunta.pregunta, TipoPreguntaId: e.value };
        setEncuestaPregunta(obj);
    });

    const onChangeCode = ((e) => {
        if (e && e.target && e.target.value && e.target.value.trim() !== '') {
            let lQuestionSurvey = _.cloneDeep(questionSurvey);
            lQuestionSurvey.code = e.target.value.trim();
            setQuestionSurvey(lQuestionSurvey);
        }
    });

    const handleEncuestaPreguntaSiguiente = ((e) => {
        setEncuestaPreguntaSiguiente({ PreguntaSiguienteId: e.value, respuesta: '', pregunta: e.label.replace(/\s*\|\s*Tipo:.+$/, '') });
    });

    // añadir respuesta a pregunta siguiente
    const handleEncuestaPreguntaSiguienteRespuesta = ((e) => {
        const name = e.target.name;
        const id = parseInt(name.replace('respuesta_', ''), 10);
        const respuesta = e.target.value;
        const values = [...EncuestaPreguntasSiguientes];
        let eps = values.filter((el) => el.PreguntaSiguienteId === id)[0];
        eps['respuesta'] = respuesta;
        setEncuestaPreguntasSiguientes(values);
    });

    // añadir pregunta siguiente vacía al formulario
    const AddEncuestaPreguntaSiguienteEmpty = ((e) => {
        e.preventDefault();
        for (const eps of EncuestaPreguntasSiguientes) {
            if (eps.PreguntaSiguienteId === EncuestaPreguntaSiguiente.PreguntaSiguienteId)
                return;
        }
        if (EncuestaPreguntaSiguiente.PreguntaSiguienteId) {
            let obj = JSON.parse(JSON.stringify(EncuestaPreguntasSiguientes));
            obj.push({
                PreguntaSiguienteId: EncuestaPreguntaSiguiente.PreguntaSiguienteId, respuesta: EncuestaPreguntaSiguiente.respuesta,
                EPSId: { pregunta: EncuestaPreguntaSiguiente.pregunta }
            });
            setEncuestaPreguntasSiguientes(obj);
        }
    });

    const DeleteEncuestaPreguntaSiguiente = (index) => {
        const values = [...EncuestaPreguntasSiguientes];
        values.splice(index, 1);
        setEncuestaPreguntasSiguientes(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesQuestionSurvey = (response, singleVariable, multiVariable) => {
        let lQuestionSurvey = _.cloneDeep(questionSurvey);
        lQuestionSurvey[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lQuestionSurvey[singleVariable] = rp.multilanguage;
            }
        });
        setQuestionSurvey(lQuestionSurvey);
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
        let variablesMulti = ['pregunta_multi', 'titulo_corto_multi', 'descripcion_multi'];
        variablesMulti.map(vm => {
            let lVariableMulti = _.cloneDeep(questionSurvey[vm]);
            let lVariableMultiTransformed = transformLanguageToJson(lVariableMulti);
            let lVariableMulti2 = vm + '2';
            if (lVariableMultiTransformed === "{}") {
                lVariableMultiTransformed = null;
            }
            questionSurvey[lVariableMulti2] = lVariableMultiTransformed;
        });
    }

    /**
     * Change valid attribute to response for english language
     * @param {*} responses Responses
     */
    const changeResponseValidation = (listAttributesObligation) => {
        for (var i = 0; i < listAttributesObligation.length; i++) {
            let evVal = !!questionSurvey[listAttributesObligation[i]].find(r =>
                r.id === 'en' && r.multilanguage && r.multilanguage !== '');
            if (evVal === false) {
                questionSurvey.valid = false;
                break;
            } else {
                questionSurvey.valid = true;
            }
        }
    }
    /**
     * Add next questions to Survey
     */
    const addQuestionSurveyNextQuestion = () => {
        let epss = JSON.parse(JSON.stringify(EncuestaPreguntasSiguientes));
        if (epss.length) {
            const tipo = TipoPreguntas.filter((el) => el.value === encuestapregunta.TipoPreguntaId)[0];
            for (const eps of epss) {
                if (tipo.label === 'Sí/No') {
                    if (/^\s*[SsyY1][íiÍI]?\s*$/.test(eps.respuesta)) {
                        eps['respuesta'] = 1;
                    } else {
                        eps['respuesta'] = 0;
                    }
                }
            }
        }
        questionSurvey.nextQuestions = epss;
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} image Image
     * @returns 
     */
    const getQuestionSurveyObject2Add = () => {
        let lQuestionSurvey = {
            id: questionSurvey.id,
            code: questionSurvey.code,
            pregunta: questionSurvey.pregunta,
            pregunta_multi: questionSurvey.pregunta_multi2,
            titulo_corto: questionSurvey.titulo_corto,
            titulo_corto_multi: questionSurvey.titulo_corto_multi2,
            descripcion: questionSurvey.descripcion,
            descripcion_multi: questionSurvey.descripcion_multi2,
            TipoPreguntaId: encuestapregunta.TipoPreguntaId,
            encuestapreguntassiguientes: questionSurvey.nextQuestions
        }
        return lQuestionSurvey;
    }

    // modificar pregunta
    const onSubmit = ((e) => {
        e.preventDefault();

        changeResponseValidation(['pregunta_multi']);
        transformEventToMultiLenguage();
        if (questionSurvey && questionSurvey.valid) {
            addQuestionSurveyNextQuestion();
            let lQuestionSurvey = getQuestionSurveyObject2Add();
            axios.post(myInitObject.crudServer + '/crud/encuestapregunta/update', lQuestionSurvey,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'SURVEYSQUESTIONS.QUESTION_OF_REGISTRATION',
                        body: 'SURVEYSQUESTIONS.SURVEY_QUESTION_REGISTRATION_OK', object: { surveyQuestion: lQuestionSurvey.pregunta }
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/encuesta_pregunta/');
                    }, 2000);
                }).catch(function (error) {
                    setOk({ ok: -1, encuestapregunta: questionSurvey.pregunta });
                    setTimeout(() => {
                        history.push('/encuesta_pregunta/');
                    }, 2000);
                });
        } else {
            setOk({ ok: -1, encuestapregunta: questionSurvey.pregunta });
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFICATION_OK_STRONG">
                        {t('SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFICATION_OK_STRONG', { surveyQuestion: ok.encuestapregunta })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFICATION_ERROR_STRONG">
                        {t('SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFICATION_ERROR_STRONG', { surveyQuestion: ok.encuestapregunta })}
                    </Trans>
                </div>
            );
        } else {
            return (
                <div>&nbsp;</div>
            )
        }
    };


    // pintar formulario de modificación
    return (
        <div className="container">
            {(!administrador && !permisosAcciones['/encuesta_pregunta']['modificar']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ModalAction show={ok.ok === 1}
                header={t('SURVEYSQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFICATION_OK', { surveyQuestion: ok.encuestapregunta })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('SURVEYSQUESTIONS.QUESTION_OF_REGISTRATION')}
                body={t('SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFICATION_OK', { surveyQuestion: ok.encuestapregunta })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('SURVEYSQUESTIONS.SURVEY_QUESTIOSN_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.CODE')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"code"}
                            className="form-control"
                            onChange={onChangeCode}
                            value={questionSurvey.code}
                            size="30"
                            maxLength="100"
                            validators={['required']}
                            errorMessages={
                                [
                                    t('SURVEYSQUESTIONS.CODE_EMPTY'),
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.QUESTION')} (*):  </label>
                        <TableMultiLanguage
                            languages={questionSurvey.pregunta_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionSurvey(response, 'pregunta', 'pregunta_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.SURVEY_QUESTION_TYPE')} (*):  </label>
                        <SelectValidator name={"TipoPreguntaId"}
                            value={TipoPreguntas.filter(({ value }) => value === encuestapregunta.TipoPreguntaId)}
                            isSearchable={true} options={TipoPreguntas} onChange={onChangeTipoPreguntaId} />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.TITLE_SHORT')}:  </label>
                        <TableMultiLanguage
                            languages={questionSurvey.titulo_corto_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionSurvey(response, 'titulo_corto', 'titulo_corto_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYSQUESTIONS.DESCRIPTION')}:  </label>
                        <TableMultiLanguage
                            languages={questionSurvey.descripcion_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesQuestionSurvey(response, 'descripcion', 'descripcion_multi')
                            }
                            onValid={() => { }}
                            showTextArea={true}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('SURVEYSQUESTIONS.SURVEY_QUESTIONS_RESPONSES_NEXT')}</p></div>
                        <div className="form-group">
                            <label>{t('SURVEYSQUESTIONS.SURVEY_QUESTION_NEXT_SELECT')}:  </label>
                            <Select name={"Pregunta"} isSearchable={true}
                                onChange={handleEncuestaPreguntaSiguiente}
                                options={Preguntas}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddEncuestaPreguntaSiguienteEmpty}
                                disabled={!EncuestaPreguntaSiguiente.PreguntaSiguienteId}>
                                {t('SURVEYSQUESTIONS.SURVEY_QUESTION_ADD_NEXT')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {EncuestaPreguntasSiguientes.map((pregunta, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('SURVEYSQUESTIONS.QUESTION')}: {pregunta.EPSId.pregunta}</p>
                                        </div>
                                        <div>
                                            {t('SURVEYSQUESTIONS.RESPONSE')}:
                                            <input type="text" name={"respuesta_" + pregunta.PreguntaSiguienteId}
                                                id={"respuesta_" + pregunta.PreguntaSiguienteId} onChange={handleEncuestaPreguntaSiguienteRespuesta}
                                                value={pregunta.respuesta}>
                                            </input>
                                        </div>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteEncuestaPreguntaSiguiente(index) }}>
                                                {t('SURVEYSQUESTIONS.SURVEY_QUESTION_DELETE_NEXT')}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })
                            }
                        </ul>
                    </div>
                    {EncuestaPreguntasSiguientes.length > 1 &&
                        <div className="form-group">
                            <div className="form-group">
                                <label>{t('SURVEYSQUESTIONS.SURVEY_QUESTION_SELECT_OTHER')}:  </label>
                                <Select name={"Pregunta"} isSearchable={true}
                                    onChange={handleEncuestaPreguntaSiguienteRespuesta}
                                    options={Preguntas}
                                />
                                <button className="btn btn-secondary mt-2" onClick={AddEncuestaPreguntaSiguienteEmpty}
                                    disabled={!EncuestaPreguntaSiguiente.PreguntaSiguienteId}>
                                    {t('SURVEYSQUESTIONS.SURVEY_QUESTION_ADD_NEXT')}
                                </button>
                            </div>
                        </div>}
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('SURVEYSQUESTIONS.SURVEY_QUESTION_MODIFY')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};
