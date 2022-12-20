/**
 * Mantenimiento de Encuestas
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
import filterFactory, { textFilter, dateFilter } from 'react-bootstrap-table2-filter';

import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { ValidatorForm } from 'react-form-validator-core';
import SelectValidator from './SelectValidator';
import Select from 'react-select';
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import ModalAction from './ModalAction';
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import Moment from 'moment';
import TableMultiLanguage from '../components/table-multi-language/TableMultiLanguage';


import es from 'date-fns/locale/es';
registerLocale('es', es);

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

/**
 * Componente que implementa los procesos CRUD para encuestas
 */
class Encuestas extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    /**
     * Definición de las rutas del mantenimiento de encuestas
     */
    render() {
        const { t } = this.props;
        return (
            <React.Fragment>

                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('SURVEYS.SURVEY_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/encuestas" render={() => <EncuestaList {...this.props} />} />
                    <Route exact path="/encuestas/add" component={withAuth(EncuestaAdd)} />
                    <Route exact path="/encuestas/clone/:id" component={withAuth(EncuestaClone)} />
                    <Route path="/encuestas/edit/:id" component={withAuth(EncuestaEdit)} />
                    <Route path="/encuestas/delete/:id" component={withAuth(EncuestaDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(Encuestas);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de encuestas
 *
 */
const ListLinks = ({ history, action, administrador, permisosAcciones }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        {(administrador || permisosAcciones['/encuestas']['listar']) &&
                            <EncuestaListLink history={history} />
                        }
                    </div>
                    <div className="col-md-2">
                        {(administrador || permisosAcciones['/encuestas']['crear']) &&
                            <EncuestaAddLink history={history} />
                        }
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list' && (administrador || permisosAcciones['/encuestas']['listar'])) {
        ret = true;
        return (
            <div className="container">
                <EncuestaListLink history={history} />
            </div>
        );
    }
    if (action !== 'add' && (administrador || permisosAcciones['/encuestas']['crear'])) {
        ret = true;
        return (
            <div className="container">
                <EncuestaAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de encuestas
 */
const EncuestaListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/encuestas') }}>
            {t('SURVEYS.SURVEY_MAITENANCE_LIST')}
        </button>
    );
};

/**
 * Enlace a crear una encuesta
 */
const EncuestaAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/encuestas/add') }}>
            {t('SURVEYS.SURVEY_MAITENANCE_ADD')}
        </button>
    );
};

/**
 * Componente para listar encuestas en una tabla
 */
const EncuestaList = ({ history, administrador, userId, permisosAcciones }) => {

    const [encuestas, setEncuestas] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");


    /**
     * Borrar encuesta
     * @param {*} row
     */
    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, nombre: row.row.nombre });
        setShowDeleteConfirm(true);
    };

    // clonar encuesta
    const clickClone = (row) => {
        history.push('/encuestas/clone/' + row.row.id);
    };

    const flexStyle = {
        display: 'flex'
    };

    /**
     * Componente para pintar las acciones de edición y borrado
     * @param {*} row
     */
    const ActionsFormatter = (row) => {
        if (administrador) {
            return (
                <div className="container">
                    <div style={flexStyle}>
                        <div className="col-md-4">
                            <button className="btn btn-primary" onClick={() => { history.push('/encuestas/edit/' + row.row.id) }}>
                                {t('SURVEYS.EDIT')}
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                {t('SURVEYS.DELETE')}
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-secondary" onClick={() => { clickClone(row) }}>
                                {t('SURVEYS.CLONE')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else if (permisosAcciones['/encuestas'] && (permisosAcciones['/encuestas']['modificar'] || permisosAcciones['/encuestas']['crear'] || permisosAcciones['/eventos']['borrar'])) {
            return (
                <div className="container">
                    <div style={flexStyle}>
                        {permisosAcciones['/encuestas']['modificar'] &&
                            <div className="col-md-4">
                                <button className="btn btn-primary" onClick={() => { history.push('/encuestas/edit/' + row.row.id) }}>
                                    {t('SURVEYS.EDIT')}
                                </button>
                            </div>
                        }
                        {permisosAcciones['/encuestas']['borrar'] &&
                            <div className="col-md-4">
                                <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                    {t('SURVEYS.DELETE')}
                                </button>
                            </div>
                        }
                        {permisosAcciones['/encuestas']['crear'] &&
                            <div className="col-md-4">
                                <button className="btn btn-secondary" onClick={() => { clickClone(row) }}>
                                    {t('SURVEYS.CLONE')}
                                </button>
                            </div>
                        }
                    </div>
                </div>
            );
        } else {
            return (
                <div className="container">
                    <div style={flexStyle}></div>
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

    /**
     * Used to change the date format
     * @param {*} cell Date
     * @returns Formated date to Day/Month/Year Hours:Minutes
     */
    const changeDateFormat = (cell) => {
        Moment.locale('en');
        return Moment(cell).format('DD/MM/YYYY HH:MM');
    }

    // columnas de la tabla
    const columns = [
        {
            dataField: 'id',
            text: t('SURVEYS.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('SURVEYS.SURVEY'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: 'fecha_cierre_encuesta',
            text: t('SURVEYS.DATE_CLOSE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: dateFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : changeDateFormat(cell))
        },
        {
            dataField: getColumnJSONMultilanguage('Eventos.nombre', 'Eventos.nombre_multi'),
            text: t('SURVEYS.EVENT'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('SURVEYS.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger las encuestas
     */
    useEffect(
        () => {
            let urlSuffix = (!administrador) ? '?userId=' + userId : '';
            axios.get(myInitObject.crudServer + '/crud/encuestas' + urlSuffix,
                { withCredentials: true })
                .then(response => {
                    setEncuestas(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history, administrador, userId]
    );

    // paginado de la tabla
    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="SURVEYS.PAGINATION_TOTAL">
                {t('SURVEYS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: encuestas,
        totalsize: encuestas.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: encuestas.length === 0,
        withFirstAndLast: true,
        firstPageText: t('SURVEYS.FIRST_PAGE_TEXT'),
        firstPageTitle: t('SURVEYS.FIRST_PAGE_TITLE'),
        prePageText: t('SURVEYS.PRE_PAGE_TEXT'),
        prePageTitle: t('SURVEYS.PRE_PAGE_TITLE'),
        nextPageText: t('SURVEYS.NEXT_PAGE_TEXT'),
        nextPageTitle: t('SURVEYS.NEXT_PAGE_TITLE'),
        lastPageText: t('SURVEYS.LAST_PAGE_TEXT'),
        lastPageTitle: t('SURVEYS.LAST_PAGE_TITLE'),
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

    // borrado de la encuesta
    const handleDelete = () => {
        history.push('/encuestas/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">
            {(!administrador && !permisosAcciones['/encuestas']['listar']) &&
                <Redirect to="/backend" />
            }
            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('SURVEYS.SURVEY_REGISTER_DELETE')}
                </ModalHeader>
                <ModalBody>{t('SURVEYS.SURVEY_REGISTER_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('SURVEYS.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('SURVEYS.DELETE')}
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
                                    data={encuestas}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('SURVEYS.SURVEY_REGISTER_NO_SURVEYS')}
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
 * Componente de borrado de encuestas
 */
const EncuestaDelete = ({ history, match, administrador, permisosAcciones }) => {

    // borrar la encuesta y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/encuesta/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/encuestas'))
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
 * Componente para añadir una encuesta
 */
const EncuestaAdd = ({ history, match, administrador, permisosAcciones }) => {

    const [encuesta, setEncuesta] = useState({
        nombre: '',
        nombre_multi: [],
        activo: false,
        fecha_cierre_encuesta: new Date().toISOString(),
        EventoId: 0,
        valid: false,
    });
    const [fecha_cierre_encuesta, setFechaCierreEncuesta] = useState(new Date());
    const [EventoId, setEventoId] = useState(0);
    const [eventos, setEventos] = useState([]);
    const [questionBlock, setQuestionBlock] = useState({});
    const [questionsBlocks, setQuestionsBlocks] = useState([]);
    const [questionsBlocksSelected, setQuestionsBlocksSelected] = useState([]);
    const [nextQuestions, setNextQuestions] = useState([]);
    const [activo, setActivo] = useState(false);
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
                    <div>
                        {t(showModalMessage.body)}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('SURVEYS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal ERROR
     * @param {*} objectBase Object base
     * @param {*} variable Variable multilanguage
     */
    const showModalError = (objectBase) => {
        setShowModalMessage({
            title: 'SURVEYS.SURVEY_REGISTER',
            body: 'SURVEYS.SURVEY_REGISTER_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setEncuesta(objectBase);
    }

    /**
     * Show modal OK
     */
    const showModalOk = () => {
        setShowModalMessage({
            title: 'SURVEYS.SURVEY_REGISTER',
            body: 'SURVEYS.SURVEY_REGISTER_REGISTRATION_OK'
        });
        setModalOpen(true);
    }

    // recoger preguntas de encuestas, eventos y preguntas siguientes para mostrarlas en un combo
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
                        encuesta.nombre_multi = _.cloneDeep(responseLanguages.data);
                        setEncuesta(encuesta);
                    }
                });
            const eventosPromise = axios.get(myInitObject.crudServer + '/crud/eventos', { withCredentials: true });
            const encuestaPromise = (match.params.id) ? axios.get(myInitObject.crudServer + '/crud/encuesta/edit/' + match.params.id, { withCredentials: true }) : null;
            const nextQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapregunta/preguntas_siguientes', { withCredentials: true });
            const questionsBlocksPromise = axios.get(myInitObject.crudServer + '/crud/questionblockgeneral', { withCredentials: true });
            Promise.all([eventosPromise, nextQuestionsPromise, encuestaPromise, questionsBlocksPromise]).then((res) => {
                setEventos(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                setNextQuestions(res[1].data);
                if (res[2]) {
                    setFechaCierreEncuesta(new Date(res[2].data.fecha_cierre_encuesta));
                    setEventoId(res[2].data.EventoId);
                    res[2].data.nombre_multi = encuesta.nombre_multi;
                    setEncuesta(res[2].data);
                    setActivo(res[2].data.activo);
                }
                if (res[3] && res[3].data) {
                    setQuestionsBlocks(res[3].data.map(element => {
                        return {
                            value: element.id,
                            label: element.name[languageI18N] ? element.name[languageI18N] : element.name['en'],
                            id: element.id,
                            name: element.name,
                            general: element.general,
                            cultotype: element.cultotype,
                            questions: element.questions
                        }
                    }));
                }
            }).catch(function (error) {
                console.error(error);
            });
        },
        [history, match.params.id]
    );

    const handleChangeFechaCierre = date => {
        setFechaCierreEncuesta(date);
        let obj = JSON.parse(JSON.stringify(encuesta));
        obj.fecha_cierre_encuesta = date.toISOString();
        setEncuesta(obj);
    };

    const handleEventoId = ((e) => {
        setEventoId(e.value);
        let obj = JSON.parse(JSON.stringify(encuesta));
        obj.EventoId = e.value;
        setEncuesta(obj);
    });

    const onChangeCheckboxActivo = ((e) => {
        setActivo(!activo);
    });

    const onChangeCheckboxVisible = ((e, questionBlock, question) => {
        e.preventDefault();
        let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
        lQuestionsBlocksSelected.map(qtBl => {
            if (qtBl.id === questionBlock.id) {
                qtBl.questions.map(q => {
                    if (q.id === question.id) {
                        q.visible = !q.visible;
                    }
                    return q;
                });
                return qtBl;
            }
        });
        setTimeout(() => {
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }, 100);
    });

    const handleQuestionBlock = ((e) => {
        let lQuestionBlock = questionsBlocks.find(qb => qb.id === e.value);
        setQuestionBlock(lQuestionBlock);
    });

    const AddQuestionBlockEmpty = ((e) => {
        e.preventDefault();
        for (const questionBlockSelected of questionsBlocksSelected) {
            if (questionBlockSelected.id === questionBlock.id)
                return;
        }
        if (questionBlock.id) {
            let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
            let lQuestions = [];
            questionBlock.questions.map(qt => {
                lQuestions.push({
                    id: qt.id,
                    QuestionBlockId: qt.QuestionBlockId,
                    orden: 1,
                    pregunta: qt.pregunta,
                    pregunta_multi: qt.pregunta_multi,
                    visible: true
                })
            });
            lQuestionsBlocksSelected.push({ id: questionBlock.id, name: questionBlock.name, questions: lQuestions });
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }
    });

    const ModQuestionOrden = ((e, questionBlock, question) => {
        let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
        lQuestionsBlocksSelected.map(qtBl => {
            if (qtBl.id === questionBlock.id) {
                qtBl.questions.map(q => {
                    if (q.id === question.id) {
                        q.orden = e.target.value;
                    }
                    return q;
                });
                return qtBl;
            }
        });
        setTimeout(() => {
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }, 100);
    });

    const DeleteQuestionBlock = (index) => {
        const values = [...questionsBlocksSelected];
        values.splice(index, 1);
        setQuestionsBlocksSelected(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesSurvey = (response, singleVariable, multiVariable) => {
        let lSurvey = _.cloneDeep(encuesta);
        lSurvey[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lSurvey[singleVariable] = rp.multilanguage;
            }
        });
        setEncuesta(lSurvey);
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
    const transformEventToMultiLenguage = (baseObject, multiVariables) => {
        multiVariables.map(vm => {
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
     * @param {*} responses Responses
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
     * Get transformed list questions with id and visible parametters 
     * @returns List transformed questions
     */
    const getTransformQuestionsSelected = () => {
        let lQuestionsSelected = [];
        questionsBlocksSelected.map(questionBlock => {
            questionBlock.questions.map(question => {
                lQuestionsSelected.push({
                    id: question.id,
                    visible: question.visible ? 1 : 0,
                    orden: Number(question.orden)
                });
            });
        });
        return lQuestionsSelected;
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
            activo: activo,
            fecha_cierre_encuesta: baseObject.fecha_cierre_encuesta,
            EventoId: baseObject.EventoId,
            questions: getTransformQuestionsSelected(),
            questionsNext: []
        }
        return lBaseObject;
    }

    // crear encuesta
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(encuesta);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(encuesta, lVariablesObligation);
        transformEventToMultiLenguage(encuesta, lVariablesObligation);
        if (encuesta && encuesta.valid) {
            let lSurvey = getObjectComplete(encuesta);
            let pregIds = [];
            questionsBlocksSelected.map(block => {
                block.questions.map(q => {
                    pregIds.push(q.id);
                });
            });

            const nextQuestionsBuffer = [];
            let i = 1;
            for (const nQ of nextQuestions) {
                if (pregIds.includes(nQ.EncuestaPreguntaId) && !pregIds.includes(nQ.EncuestaPreguntaSiguienteId)) {
                    let lQuestionBase = lSurvey.questions.find(qt => qt.id === nQ.EncuestaPreguntaId);
                    nextQuestionsBuffer.push(nQ);
                    lSurvey.questions.push({
                        id: nQ.EPSId.id,
                        parentId: lQuestionBase.id,
                        visible: lQuestionBase.visible,
                        orden: lQuestionBase.orden + i
                    });
                    pregIds.push(nQ.EPSId.id);
                    i++;
                }
            }
            while (nextQuestionsBuffer.length) {
                const preg = nextQuestionsBuffer.shift();
                const nextQuestionsChildren = nextQuestions.filter((el) => el.EncuestaPreguntaId === preg.EncuestaPreguntaSiguienteId
                    && !pregIds.includes(el.EncuestaPreguntaSiguienteId));
                if (nextQuestionsChildren.length) {
                    for (const nQC of nextQuestionsChildren) {
                        let lQuestionBase = lSurvey.questions.find(qt => qt.id === nQC.EncuestaPreguntaId);
                        lSurvey.questions.push({
                            id: nQC.EPSId.id,
                            parentId: lQuestionBase.id,
                            visible: lQuestionBase.visible,
                            orden: lQuestionBase.orden + i
                        });
                        pregIds.push(nQC.EPSId.id);
                    }
                    nextQuestionsBuffer.push(...nextQuestionsChildren);
                }
            }
            axios.post(myInitObject.crudServer + '/crud/encuesta/questionblock/add', lSurvey,
                { withCredentials: true })
                .then(() => {
                    showModalOk();
                    setTimeout(() => {
                        history.push('/encuestas/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone);
                });
        } else {
            showModalError(lObjectClone);
        }
    });

    /**
     * Get question label
     * @param {*} question Question
     * @returns Return question label with translation if exist
     */
    const getQuestionSurveyLabel = (question) => {
        if (question.pregunta_multi) {
            if (question.pregunta_multi[languageI18N]) {
                return question.pregunta_multi[languageI18N];
            }
        }
        return question.pregunta;
    }

    /**
     * Get question block label
     * @param {*} question Question
     * @returns Return question block label with translation if exist
     */
    const getQuestionBlockLabel = (questionBlock) => {
        if (questionBlock.name[languageI18N]) {
            return questionBlock.name[languageI18N];
        }
        return questionBlock.name.en;
    }

    // pintar formulario de creación
    return (
        <div className="container">
            {(!administrador && !permisosAcciones['/encuestas']['crear']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ListLinks history={history} action="add" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('SURVEYS.SURVEY_REGISTER_ADD_QUESTION')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('SURVEYS.SURVEY')} (*):  </label>
                        <TableMultiLanguage
                            languages={encuesta.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesSurvey(response, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYS.EVENT')} (*):  </label>
                        <SelectValidator name={"EventoId"} isSearchable={true}
                            onChange={handleEventoId}
                            value={eventos.filter(({ value }) => value === EventoId)}
                            options={eventos}
                            validators={['required']}
                            placeholder={t('SURVEYS.SELECT')}
                            errorMessages={[t('SURVEYS.EVENT_EMPTY')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYS.DATE_CLOSE')} (*):  </label>
                        <DatePicker id="fecha_cierre_encuesta"
                            name="fecha_cierre_encuesta"
                            selected={fecha_cierre_encuesta}
                            onChange={handleChangeFechaCierre}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="activo"
                            id="activo"
                            onChange={onChangeCheckboxActivo}
                            checked={activo}
                        />
                        <label className="form-check-label" htmlFor="activo">{t('SURVEYS.ACTIVE')} (*):  </label>
                    </div>
                    <div className="form-group">&nbsp;</div>

                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('SURVEYS.SELECTED_QUESTIONS_BLOCKS')}</p></div>
                        <div className="form-group">
                            <label>{t('SURVEYS.SELECT_QUESTION_BLOCK')}:  </label>
                            <Select name={"questionBlock"} isSearchable={true}
                                onChange={handleQuestionBlock}
                                options={questionsBlocks}
                                placeholder={t('SURVEYS.SELECT')}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionBlockEmpty} disabled={!questionBlock.id}>
                                {t('SURVEYS.QUESTION_BLOCK_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {questionsBlocksSelected.map((questionBlock, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('SURVEYS.QUESTION_BLOCK')}: {getQuestionBlockLabel(questionBlock)}</p>
                                        </div>

                                        <ul className="list-group">
                                            {questionBlock.questions.map((question, index) => {
                                                return (
                                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                                        <div>
                                                            <p className="h5">{t('SURVEYS.QUESTION')}: {getQuestionSurveyLabel(question)}</p>
                                                        </div>
                                                        <div>
                                                            {t('SURVEYS.ORDER')}:
                                                            <input type="number" name={"orden_" + question.id} id={"orden_" + question.id} min="1" max="1000"
                                                                onChange={(e) => ModQuestionOrden(e, questionBlock, question)} value={question.orden}></input>
                                                        </div>
                                                        <div>
                                                            <div className="form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    onChange={(e) => onChangeCheckboxVisible(e, questionBlock, question)}
                                                                    checked={question.visible}
                                                                />
                                                                <label className="form-check-label">{t('SURVEYS.VISIBLE')}</label>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })
                                            }
                                        </ul>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteQuestionBlock(index) }}>
                                                {t('SURVEYS.DELETE_QUESTION_BLOCK')}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })
                            }
                        </ul>
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('SURVEYS.SURVEY_REGISTRATION')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};



/**
 * Componente para editar y modificar una encuesta
 */
const EncuestaEdit = ({ history, match, administrador, permisosAcciones }) => {

    const [encuesta, setEncuesta] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
        activo: false,
        fecha_cierre_encuesta: new Date().toISOString(),
        EventoId: 0,
        valid: false,
    });
    const [fecha_cierre_encuesta, setFechaCierreEncuesta] = useState(new Date());
    const [EventoId, setEventoId] = useState(0);
    const [eventos, setEventos] = useState([]);
    const [questionBlock, setQuestionBlock] = useState({});
    const [questionsBlocks, setQuestionsBlocks] = useState([]);
    const [questionsBlocksSelected, setQuestionsBlocksSelected] = useState([]);
    const [nextQuestions, setNextQuestions] = useState([]);
    const [activo, setActivo] = useState(false);
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
                    <div>
                        {t(showModalMessage.body)}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('SURVEYS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal ERROR
     * @param {*} objectBase Object base
     * @param {*} variable Variable multilanguage
     */
    const showModalError = (objectBase) => {
        setShowModalMessage({
            title: 'SURVEYS.SURVEY_REGISTER',
            body: 'SURVEYS.SURVEY_REGISTER_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setEncuesta(objectBase);
    }

    /**
     * Show modal OK
     */
    const showModalOk = () => {
        setShowModalMessage({
            title: 'SURVEYS.SURVEY_REGISTER',
            body: 'SURVEYS.SURVEY_REGISTER_REGISTRATION_OK'
        });
        setModalOpen(true);
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

    // recoger datos de la encuesta, preguntas de encuestas, eventos y preguntas siguientes para mostrarlas en un combo
    useEffect(
        () => {
            const eventosPromise = axios.get(myInitObject.crudServer + '/crud/eventos', { withCredentials: true });
            const encuestaPromise = axios.get(myInitObject.crudServer + '/crud/encuesta/questionblock/back/edit/' + match.params.id, { withCredentials: true });
            const nextQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapregunta/preguntas_siguientes', { withCredentials: true });
            const questionsBlocksPromise = axios.get(myInitObject.crudServer + '/crud/questionblockgeneral', { withCredentials: true });
            Promise.all([eventosPromise, nextQuestionsPromise, encuestaPromise, questionsBlocksPromise]).then((res) => {
                setEventos(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                setNextQuestions(res[1].data);
                if (res[2]) {
                    setFechaCierreEncuesta(new Date(res[2].data.fecha_cierre_encuesta));
                    setEventoId(res[2].data.EventoId);
                    setActivo(res[2].data.activo);
                    if (res[3] && res[3].data) {
                        let lQuestionsBlocks = res[3].data.map(element => {
                            return {
                                value: element.id,
                                label: element.name[languageI18N] ? element.name[languageI18N] : element.name['en'],
                                id: element.id,
                                name: element.name,
                                general: element.general,
                                cultotype: element.cultotype,
                                questions: element.questions
                            }
                        });
                        setQuestionsBlocks(lQuestionsBlocks);

                        let lQuestionsBlocksClone = _.cloneDeep(lQuestionsBlocks);
                        let lQuestionsBlocksSelected = [];
                        let lQuestionBlockQuestions = _.cloneDeep(res[2].data.preguntas);
                        if (lQuestionBlockQuestions) {
                            let lQuestionsParent = [];
                            let lQuestionsVisited = [];
                            lQuestionBlockQuestions.map(qt => {
                                if (qt.EPId && qt.EPId[0] && qt.EPId[0].EncuestaPreguntaSiguienteId) {
                                    let lQuestionsSons = [];
                                    qt.EPId.map(qNext => {
                                        let lQuestion = lQuestionBlockQuestions.find(qtBlQNext => qtBlQNext.id === qNext.EncuestaPreguntaSiguienteId);
                                        if (lQuestion) {
                                            lQuestion.orden = lQuestion.EncuestasPreguntas.orden;
                                            lQuestion.visible = lQuestion.EncuestasPreguntas.visible === 1 ? true : false;
                                            lQuestionsVisited.push(qNext.EncuestaPreguntaSiguienteId);
                                            lQuestionsSons.push(lQuestion);
                                        }
                                    });
                                    qt.orden = qt.EncuestasPreguntas.orden;
                                    qt.visible = qt.EncuestasPreguntas.visible === 1 ? true : false;
                                    qt.questionsNext = lQuestionsSons;
                                    lQuestionsVisited.push(qt.id);
                                    lQuestionsParent.push(qt);
                                }
                            });

                            lQuestionBlockQuestions.map(qt => {
                                if (!lQuestionsVisited.includes(qt.id)) {
                                    qt.orden = qt.EncuestasPreguntas.orden;
                                    qt.visible = qt.EncuestasPreguntas.visible === 1 ? true : false;
                                    qt.questionsNext = [];
                                    lQuestionsVisited.push(qt.id);
                                    lQuestionsParent.push(qt);
                                }
                            });

                            if (lQuestionsParent && lQuestionsParent.length > 0) {
                                let lQuestionsBlocksAppears = [];
                                lQuestionsParent.map(qPr => {
                                    if (!lQuestionsBlocksAppears.includes(qPr.QuestionBlockId)) {
                                        lQuestionsBlocksAppears.push(qPr.QuestionBlockId);
                                    }
                                })

                                lQuestionsBlocksAppears.map(qBlAp => {
                                    let lQuestionsBlockSelected = lQuestionsBlocksClone.find(qtBl => qtBl.id === qBlAp);
                                    lQuestionsBlockSelected.questions = lQuestionsParent.filter(qP => qP.QuestionBlockId === lQuestionsBlockSelected.id);
                                    lQuestionsBlocksSelected.push(lQuestionsBlockSelected);
                                });
                            }
                        }
                        setQuestionsBlocksSelected(lQuestionsBlocksSelected);
                    }

                    axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                        .then(responseLanguages => {
                            if (responseLanguages.data && responseLanguages.data.length > 0) {
                                responseLanguages.data.map(d => {
                                    d.value = d.id;
                                    d.label = d.name;
                                    return d;
                                });

                                let lVariablesMulti = ['nombre_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, res[2].data[vMulti]);
                                    res[2].data[vMulti] = lValues;
                                });

                                setEncuesta(res[2].data);
                            }
                        });
                }
            }).catch(function (error) {
                console.error(error);
            });
        },
        [history, match]
    );

    const handleChangeFechaCierre = date => {
        setFechaCierreEncuesta(date);
        let obj = JSON.parse(JSON.stringify(encuesta));
        obj.fecha_cierre_encuesta = date.toISOString();
        setEncuesta(obj);
    };

    const handleEventoId = ((e) => {
        setEventoId(e.value);
        let obj = JSON.parse(JSON.stringify(encuesta));
        obj.EventoId = e.value;
        setEncuesta(obj);
    });

    const onChangeCheckboxActivo = ((e) => {
        e.preventDefault();
        setActivo(!activo);
    });

    const onChangeCheckboxVisible = ((e, questionBlock, question) => {
        e.preventDefault();
        let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
        lQuestionsBlocksSelected.map(qtBl => {
            if (qtBl.id === questionBlock.id) {
                qtBl.questions.map(q => {
                    if (q.id === question.id) {
                        q.visible = !q.visible;
                    }
                    return q;
                });
                return qtBl;
            }
        });
        setTimeout(() => {
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }, 100);
    });

    const handleQuestionBlock = ((e) => {
        let lQuestionBlock = questionsBlocks.find(qb => qb.id === e.value);
        setQuestionBlock(lQuestionBlock);
    });

    const AddQuestionBlockEmpty = ((e) => {
        e.preventDefault();
        for (const questionBlockSelected of questionsBlocksSelected) {
            if (questionBlockSelected.id === questionBlock.id)
                return;
        }
        if (questionBlock.id) {
            let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
            let lQuestions = [];
            questionBlock.questions.map(qt => {
                lQuestions.push({
                    id: qt.id,
                    QuestionBlockId: qt.QuestionBlockId,
                    orden: 1,
                    pregunta: qt.pregunta,
                    pregunta_multi: qt.pregunta_multi,
                    visible: true
                })
            });
            lQuestionsBlocksSelected.push({ id: questionBlock.id, name: questionBlock.name, questions: lQuestions });
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }
    });

    const ModQuestionBlockOrden = ((e, questionBlock, question) => {
        let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
        lQuestionsBlocksSelected.map(qtBl => {
            if (qtBl.id === questionBlock.id) {
                qtBl.questions.map(q => {
                    if (q.id === question.id) {
                        q.orden = e.target.value;
                    }
                    return q;
                });
                return qtBl;
            }
        });
        setTimeout(() => {
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }, 100);
    });

    const DeleteQuestionBlock = (index) => {
        const values = [...questionsBlocksSelected];
        values.splice(index, 1);
        setQuestionsBlocksSelected(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesSurvey = (response, singleVariable, multiVariable) => {
        let lSurvey = _.cloneDeep(encuesta);
        lSurvey[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lSurvey[singleVariable] = rp.multilanguage;
            }
        });
        setEncuesta(lSurvey);
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
    const transformEventToMultiLenguage = (baseObject, multiVariables) => {
        multiVariables.map(vm => {
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
     * @param {*} responses Responses
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
     * Get transformed list questions with id and visible parametters 
     * @returns List transformed questions
     */
    const getTransformQuestionsSelected = () => {
        let lQuestionsSelected = [];
        questionsBlocksSelected.map(questionBlock => {
            questionBlock.questions.map(question => {
                lQuestionsSelected.push({
                    id: question.id,
                    visible: question.visible ? 1 : 0,
                    orden: Number(question.orden)
                });
            });
        });
        return lQuestionsSelected;
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
            activo: activo,
            fecha_cierre_encuesta: baseObject.fecha_cierre_encuesta,
            EventoId: baseObject.EventoId,
            questions: getTransformQuestionsSelected(),
            questionsNext: []
        }
        return lBaseObject;
    }

    // modificar encuesta
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(encuesta);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(encuesta, lVariablesObligation);
        transformEventToMultiLenguage(encuesta, lVariablesObligation);
        if (encuesta && encuesta.valid) {
            let lSurvey = getObjectComplete(encuesta);
            let pregIds = [];
            questionsBlocksSelected.map(block => {
                block.questions.map(q => {
                    pregIds.push(q.id);
                });
            });

            const nextQuestionsBuffer = [];
            let i = 1;
            for (const nQ of nextQuestions) {
                if (pregIds.includes(nQ.EncuestaPreguntaId) && !pregIds.includes(nQ.EncuestaPreguntaSiguienteId)) {
                    let lQuestionBase = lSurvey.questions.find(qt => qt.id === nQ.EncuestaPreguntaId);
                    nextQuestionsBuffer.push(nQ);
                    lSurvey.questions.push({
                        id: nQ.EPSId.id,
                        parentId: lQuestionBase.id,
                        visible: lQuestionBase.visible,
                        orden: lQuestionBase.orden + i
                    });
                    pregIds.push(nQ.EPSId.id);
                    i++;
                }
            }
            while (nextQuestionsBuffer.length) {
                const preg = nextQuestionsBuffer.shift();
                const nextQuestionsChildren = nextQuestions.filter((el) => el.EncuestaPreguntaId === preg.EncuestaPreguntaSiguienteId
                    && !pregIds.includes(el.EncuestaPreguntaSiguienteId));
                if (nextQuestionsChildren.length) {
                    for (const nQC of nextQuestionsChildren) {
                        let lQuestionBase = lSurvey.questions.find(qt => qt.id === nQC.EncuestaPreguntaId);
                        lSurvey.questions.push({
                            id: nQC.EPSId.id,
                            parentId: lQuestionBase.id,
                            visible: lQuestionBase.visible,
                            orden: lQuestionBase.orden + i
                        });
                        pregIds.push(nQC.EPSId.id);
                    }
                    nextQuestionsBuffer.push(...nextQuestionsChildren);
                }
            }
            axios.post(myInitObject.crudServer + '/crud/encuesta/questionblock/update', lSurvey,
                { withCredentials: true })
                .then(() => {
                    showModalOk();
                    setTimeout(() => {
                        history.push('/encuestas/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone);
                });
        } else {
            showModalError(lObjectClone);
        }
    });

    /**
     * Get question label
     * @param {*} question Question
     * @returns Return question label with translation if exist
     */
    const getQuestionSurveyLabel = (question) => {
        if (question.pregunta_multi) {
            if (question.pregunta_multi[languageI18N]) {
                return question.pregunta_multi[languageI18N];
            }
        }
        return question.pregunta;
    }

    /**
     * Get question block label
     * @param {*} question Question
     * @returns Return question block label with translation if exist
     */
    const getQuestionBlockLabel = (questionBlock) => {
        if (questionBlock.name[languageI18N]) {
            return questionBlock.name[languageI18N];
        }
        return questionBlock.name.en;
    }

    // pintar formulario de modificación de encuestas
    return (
        <div className="container">
            {(!administrador && !permisosAcciones['/encuestas']['modificar']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('SURVEYS.SURVEY_REGISTER_QUESTION_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('SURVEYS.SURVEY')} (*):  </label>
                        <TableMultiLanguage
                            languages={encuesta.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesSurvey(response, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYS.EVENT')} (*):  </label>
                        <SelectValidator name={"EventoId"} isSearchable={true}
                            onChange={handleEventoId}
                            value={eventos.filter(({ value }) => value === EventoId)}
                            options={eventos}
                            validators={['required']}
                            errorMessages={[t('SURVEYS.EVENT_EMPTY')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYS.DATE_CLOSE')} (*):  </label>
                        <DatePicker id="fecha_cierre_encuesta"
                            name="fecha_cierre_encuesta"
                            selected={fecha_cierre_encuesta}
                            onChange={handleChangeFechaCierre}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="activo"
                            id="activo"
                            onChange={onChangeCheckboxActivo}
                            checked={activo}
                        />
                        <label className="form-check-label" htmlFor="activo">{t('SURVEYS.ACTIVE')} (*):  </label>
                    </div>
                    <div className="form-group">&nbsp;</div>

                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('SURVEYS.SELECTED_QUESTIONS_BLOCKS')}</p></div>
                        <div className="form-group">
                            <label>{t('SURVEYS.SELECT_QUESTION_BLOCK')}:  </label>
                            <Select name={"questionBlock"} isSearchable={true}
                                onChange={handleQuestionBlock}
                                options={questionsBlocks}
                                placeholder={t('SURVEYS.SELECT')}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionBlockEmpty} disabled={!questionBlock.id}>
                                {t('SURVEYS.QUESTION_BLOCK_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {questionsBlocksSelected.map((questionBlock, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('SURVEYS.QUESTION_BLOCK')}: {getQuestionBlockLabel(questionBlock)}</p>
                                        </div>

                                        <ul className="list-group">
                                            {questionBlock && questionBlock.questions.map((question, index) => {
                                                return (
                                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                                        <div>
                                                            <p className="h5">{t('SURVEYS.QUESTION')}: {getQuestionSurveyLabel(question)}</p>
                                                        </div>
                                                        <div>
                                                            {t('SURVEYS.ORDER')}:
                                                            <input type="number" name={"orden_" + question.id} id={"orden_" + question.id} min="1" max="1000"
                                                                onChange={(e) => ModQuestionBlockOrden(e, questionBlock, question)} value={question.orden}></input>
                                                        </div>
                                                        <div>
                                                            <div className="form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    onChange={(e) => onChangeCheckboxVisible(e, questionBlock, question)}
                                                                    checked={question.visible}
                                                                />
                                                                <label className="form-check-label">{t('SURVEYS.VISIBLE')}</label>
                                                            </div>
                                                        </div>
                                                        <ul className="list-group">
                                                            {question && question.questionsNext && question.questionsNext.length > 0 &&
                                                                <div>
                                                                    <div>&nbsp;</div>
                                                                    <p className="h5">{t('SURVEYS.QUESTIONS_NEXT')}:</p>
                                                                </div>
                                                            }
                                                            {question && question.questionsNext && question.questionsNext.length > 0 &&
                                                                question.questionsNext.map((questionNext, index) => {
                                                                    return (
                                                                        <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                                                            <div>
                                                                                <p className="h6">{getQuestionSurveyLabel(questionNext)}</p>
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })
                                                            }
                                                        </ul>
                                                    </li>
                                                );
                                            })
                                            }
                                        </ul>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteQuestionBlock(index) }}>
                                                {t('SURVEYS.DELETE_QUESTION_BLOCK')}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })
                            }
                        </ul>
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('SURVEYS.SURVEY_MODIFY')} disabled={!encuesta.id} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};

/**
 * Componente para editar y modificar una encuesta
 */
const EncuestaClone = ({ history, match, administrador, permisosAcciones }) => {

    const [encuesta, setEncuesta] = useState({
        id: 0,
        nombre: '',
        nombre_multi: [],
        activo: false,
        fecha_cierre_encuesta: new Date().toISOString(),
        EventoId: 0,
        valid: false,
    });
    const [fecha_cierre_encuesta, setFechaCierreEncuesta] = useState(new Date());
    const [EventoId, setEventoId] = useState(0);
    const [eventos, setEventos] = useState([]);
    const [questionBlock, setQuestionBlock] = useState({});
    const [questionsBlocks, setQuestionsBlocks] = useState([]);
    const [questionsBlocksSelected, setQuestionsBlocksSelected] = useState([]);
    const [nextQuestions, setNextQuestions] = useState([]);
    const [activo, setActivo] = useState(false);
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
                    <div>
                        {t(showModalMessage.body)}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>
                        {t('SURVEYS.CLOSE')}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Show modal ERROR
     * @param {*} objectBase Object base
     * @param {*} variable Variable multilanguage
     */
    const showModalError = (objectBase) => {
        setShowModalMessage({
            title: 'SURVEYS.SURVEY_REGISTER',
            body: 'SURVEYS.SURVEY_REGISTER_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setEncuesta(objectBase);
    }

    /**
     * Show modal OK
     */
    const showModalOk = () => {
        setShowModalMessage({
            title: 'SURVEYS.SURVEY_REGISTER',
            body: 'SURVEYS.SURVEY_REGISTER_REGISTRATION_OK'
        });
        setModalOpen(true);
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

    // recoger datos de la encuesta, preguntas de encuestas, eventos y preguntas siguientes para mostrarlas en un combo
    useEffect(
        () => {
            const eventosPromise = axios.get(myInitObject.crudServer + '/crud/eventos', { withCredentials: true });
            const encuestaPromise = axios.get(myInitObject.crudServer + '/crud/encuesta/questionblock/back/edit/' + match.params.id, { withCredentials: true });
            const nextQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapregunta/preguntas_siguientes', { withCredentials: true });
            const questionsBlocksPromise = axios.get(myInitObject.crudServer + '/crud/questionblockgeneral', { withCredentials: true });
            Promise.all([eventosPromise, nextQuestionsPromise, encuestaPromise, questionsBlocksPromise]).then((res) => {
                setEventos(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                setNextQuestions(res[1].data);
                if (res[2]) {
                    setFechaCierreEncuesta(new Date(res[2].data.fecha_cierre_encuesta));
                    setEventoId(res[2].data.EventoId);
                    setActivo(res[2].data.activo);
                    if (res[3] && res[3].data) {
                        let lQuestionsBlocks = res[3].data.map(element => {
                            return {
                                value: element.id,
                                label: element.name[languageI18N] ? element.name[languageI18N] : element.name['en'],
                                id: element.id,
                                name: element.name,
                                general: element.general,
                                cultotype: element.cultotype,
                                questions: element.questions
                            }
                        });
                        setQuestionsBlocks(lQuestionsBlocks);

                        let lQuestionsBlocksClone = _.cloneDeep(lQuestionsBlocks);
                        let lQuestionsBlocksSelected = [];
                        let lQuestionBlockQuestions = _.cloneDeep(res[2].data.preguntas);
                        if (lQuestionBlockQuestions) {
                            let lQuestionsParent = [];
                            let lQuestionsVisited = [];
                            lQuestionBlockQuestions.map(qt => {
                                if (qt.EPId && qt.EPId[0] && qt.EPId[0].EncuestaPreguntaSiguienteId) {
                                    let lQuestionsSons = [];
                                    qt.EPId.map(qNext => {
                                        let lQuestion = lQuestionBlockQuestions.find(qtBlQNext => qtBlQNext.id === qNext.EncuestaPreguntaSiguienteId);
                                        if (lQuestion) {
                                            lQuestion.orden = lQuestion.EncuestasPreguntas.orden;
                                            lQuestion.visible = lQuestion.EncuestasPreguntas.visible === 1 ? true : false;
                                            lQuestionsVisited.push(qNext.EncuestaPreguntaSiguienteId);
                                            lQuestionsSons.push(lQuestion);
                                        }
                                    });
                                    qt.orden = qt.EncuestasPreguntas.orden;
                                    qt.visible = qt.EncuestasPreguntas.visible === 1 ? true : false;
                                    qt.questionsNext = lQuestionsSons;
                                    lQuestionsVisited.push(qt.id);
                                    lQuestionsParent.push(qt);
                                }
                            });

                            lQuestionBlockQuestions.map(qt => {
                                if (!lQuestionsVisited.includes(qt.id)) {
                                    qt.orden = qt.EncuestasPreguntas.orden;
                                    qt.visible = qt.EncuestasPreguntas.visible === 1 ? true : false;
                                    qt.questionsNext = [];
                                    lQuestionsVisited.push(qt.id);
                                    lQuestionsParent.push(qt);
                                }
                            });

                            if (lQuestionsParent && lQuestionsParent.length > 0) {
                                let lQuestionsBlocksAppears = [];
                                lQuestionsParent.map(qPr => {
                                    if (!lQuestionsBlocksAppears.includes(qPr.QuestionBlockId)) {
                                        lQuestionsBlocksAppears.push(qPr.QuestionBlockId);
                                    }
                                })

                                lQuestionsBlocksAppears.map(qBlAp => {
                                    let lQuestionsBlockSelected = lQuestionsBlocksClone.find(qtBl => qtBl.id === qBlAp);
                                    lQuestionsBlockSelected.questions = lQuestionsParent.filter(qP => qP.QuestionBlockId === lQuestionsBlockSelected.id);
                                    lQuestionsBlocksSelected.push(lQuestionsBlockSelected);
                                });
                            }
                        }
                        setQuestionsBlocksSelected(lQuestionsBlocksSelected);
                    }

                    axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                        .then(responseLanguages => {
                            if (responseLanguages.data && responseLanguages.data.length > 0) {
                                responseLanguages.data.map(d => {
                                    d.value = d.id;
                                    d.label = d.name;
                                    return d;
                                });

                                let lVariablesMulti = ['nombre_multi'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, res[2].data[vMulti]);
                                    res[2].data[vMulti] = lValues;
                                });

                                setEncuesta(res[2].data);
                            }
                        });
                }
            }).catch(function (error) {
                console.error(error);
            });
        },
        [history, match]
    );

    const handleChangeFechaCierre = date => {
        setFechaCierreEncuesta(date);
        let obj = JSON.parse(JSON.stringify(encuesta));
        obj.fecha_cierre_encuesta = date.toISOString();
        setEncuesta(obj);
    };

    const handleEventoId = ((e) => {
        setEventoId(e.value);
        let obj = JSON.parse(JSON.stringify(encuesta));
        obj.EventoId = e.value;
        setEncuesta(obj);
    });

    const onChangeCheckboxActivo = ((e) => {
        e.preventDefault();
        setActivo(!activo);
    });

    const onChangeCheckboxVisible = ((e, questionBlock, question) => {
        e.preventDefault();
        let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
        lQuestionsBlocksSelected.map(qtBl => {
            if (qtBl.id === questionBlock.id) {
                qtBl.questions.map(q => {
                    if (q.id === question.id) {
                        q.visible = !q.visible;
                    }
                    return q;
                });
                return qtBl;
            }
        });
        setTimeout(() => {
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }, 100);
    });

    const handleQuestionBlock = ((e) => {
        let lQuestionBlock = questionsBlocks.find(qb => qb.id === e.value);
        setQuestionBlock(lQuestionBlock);
    });

    const AddQuestionBlockEmpty = ((e) => {
        e.preventDefault();
        for (const questionBlockSelected of questionsBlocksSelected) {
            if (questionBlockSelected.id === questionBlock.id)
                return;
        }
        if (questionBlock.id) {
            let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
            let lQuestions = [];
            questionBlock.questions.map(qt => {
                lQuestions.push({
                    id: qt.id,
                    QuestionBlockId: qt.QuestionBlockId,
                    orden: 1,
                    pregunta: qt.pregunta,
                    pregunta_multi: qt.pregunta_multi,
                    visible: true
                })
            });
            lQuestionsBlocksSelected.push({ id: questionBlock.id, name: questionBlock.name, questions: lQuestions });
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }
    });

    const ModQuestionBlockOrden = ((e, questionBlock, question) => {
        let lQuestionsBlocksSelected = _.cloneDeep(questionsBlocksSelected);
        lQuestionsBlocksSelected.map(qtBl => {
            if (qtBl.id === questionBlock.id) {
                qtBl.questions.map(q => {
                    if (q.id === question.id) {
                        q.orden = e.target.value;
                    }
                    return q;
                });
                return qtBl;
            }
        });
        setTimeout(() => {
            setQuestionsBlocksSelected(lQuestionsBlocksSelected);
        }, 100);
    });

    const DeleteQuestionBlock = (index) => {
        const values = [...questionsBlocksSelected];
        values.splice(index, 1);
        setQuestionsBlocksSelected(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesSurvey = (response, singleVariable, multiVariable) => {
        let lSurvey = _.cloneDeep(encuesta);
        lSurvey[multiVariable] = response;
        response.map(rp => {
            if (rp.id === 'en') {
                lSurvey[singleVariable] = rp.multilanguage;
            }
        });
        setEncuesta(lSurvey);
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
    const transformEventToMultiLenguage = (baseObject, multiVariables) => {
        multiVariables.map(vm => {
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
     * @param {*} responses Responses
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
     * Get transformed list questions with id and visible parametters 
     * @returns List transformed questions
     */
    const getTransformQuestionsSelected = () => {
        let lQuestionsSelected = [];
        questionsBlocksSelected.map(questionBlock => {
            questionBlock.questions.map(question => {
                lQuestionsSelected.push({
                    id: question.id,
                    visible: question.visible ? 1 : 0,
                    orden: Number(question.orden)
                });
            });
        });
        return lQuestionsSelected;
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
            activo: activo,
            fecha_cierre_encuesta: baseObject.fecha_cierre_encuesta,
            EventoId: baseObject.EventoId,
            questions: getTransformQuestionsSelected(),
            questionsNext: []
        }
        return lBaseObject;
    }

    // modificar encuesta
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(encuesta);
        let lVariablesObligation = ['nombre_multi'];
        changeResponseValidation(encuesta, lVariablesObligation);
        transformEventToMultiLenguage(encuesta, lVariablesObligation);
        if (encuesta && encuesta.valid) {
            let lSurvey = getObjectComplete(encuesta);
            let pregIds = [];
            questionsBlocksSelected.map(block => {
                block.questions.map(q => {
                    pregIds.push(q.id);
                });
            });

            const nextQuestionsBuffer = [];
            let i = 1;
            for (const nQ of nextQuestions) {
                if (pregIds.includes(nQ.EncuestaPreguntaId) && !pregIds.includes(nQ.EncuestaPreguntaSiguienteId)) {
                    let lQuestionBase = lSurvey.questions.find(qt => qt.id === nQ.EncuestaPreguntaId);
                    nextQuestionsBuffer.push(nQ);
                    lSurvey.questions.push({
                        id: nQ.EPSId.id,
                        parentId: lQuestionBase.id,
                        visible: lQuestionBase.visible,
                        orden: lQuestionBase.orden + i
                    });
                    pregIds.push(nQ.EPSId.id);
                    i++;
                }
            }
            while (nextQuestionsBuffer.length) {
                const preg = nextQuestionsBuffer.shift();
                const nextQuestionsChildren = nextQuestions.filter((el) => el.EncuestaPreguntaId === preg.EncuestaPreguntaSiguienteId
                    && !pregIds.includes(el.EncuestaPreguntaSiguienteId));
                if (nextQuestionsChildren.length) {
                    for (const nQC of nextQuestionsChildren) {
                        let lQuestionBase = lSurvey.questions.find(qt => qt.id === nQC.EncuestaPreguntaId);
                        lSurvey.questions.push({
                            id: nQC.EPSId.id,
                            parentId: lQuestionBase.id,
                            visible: lQuestionBase.visible,
                            orden: lQuestionBase.orden + i
                        });
                        pregIds.push(nQC.EPSId.id);
                    }
                    nextQuestionsBuffer.push(...nextQuestionsChildren);
                }
            }
            axios.post(myInitObject.crudServer + '/crud/encuesta/questionblock/add', lSurvey,
                { withCredentials: true })
                .then(() => {
                    showModalOk();
                    setTimeout(() => {
                        history.push('/encuestas/');
                    }, 2000);
                }).catch(function (error) {
                    console.log(error);
                    showModalError(lObjectClone);
                });
        } else {
            showModalError(lObjectClone);
        }
    });

    /**
     * Get question label
     * @param {*} question Question
     * @returns Return question label with translation if exist
     */
    const getQuestionSurveyLabel = (question) => {
        if (question.pregunta_multi) {
            if (question.pregunta_multi[languageI18N]) {
                return question.pregunta_multi[languageI18N];
            }
        }
        return question.pregunta;
    }

    /**
     * Get question block label
     * @param {*} question Question
     * @returns Return question block label with translation if exist
     */
    const getQuestionBlockLabel = (questionBlock) => {
        if (questionBlock.name[languageI18N]) {
            return questionBlock.name[languageI18N];
        }
        return questionBlock.name.en;
    }

    // pintar formulario de modificación de encuestas
    return (
        <div className="container">
            {(!administrador && !permisosAcciones['/encuestas']['modificar']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ListLinks history={history} action="clone" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('SURVEYS.SURVEY_REGISTER_QUESTION_CLONE')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('SURVEYS.SURVEY')} (*):  </label>
                        <TableMultiLanguage
                            languages={encuesta.nombre_multi}
                            onChange={(response) =>
                                changeValuesMultilanguagesSurvey(response, 'nombre', 'nombre_multi')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYS.EVENT')} (*):  </label>
                        <SelectValidator name={"EventoId"} isSearchable={true}
                            onChange={handleEventoId}
                            value={eventos.filter(({ value }) => value === EventoId)}
                            options={eventos}
                            validators={['required']}
                            errorMessages={[t('SURVEYS.EVENT_EMPTY')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('SURVEYS.DATE_CLOSE')} (*):  </label>
                        <DatePicker id="fecha_cierre_encuesta"
                            name="fecha_cierre_encuesta"
                            selected={fecha_cierre_encuesta}
                            onChange={handleChangeFechaCierre}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={60}
                            timeCaption="time"
                            dateFormat="yyyy-MM-dd HH:mm:ss"
                            locale="es"
                        />
                    </div>
                    <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="activo"
                            id="activo"
                            onChange={onChangeCheckboxActivo}
                            checked={activo}
                        />
                        <label className="form-check-label" htmlFor="activo">{t('SURVEYS.ACTIVE')} (*):  </label>
                    </div>
                    <div className="form-group">&nbsp;</div>

                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('SURVEYS.SELECTED_QUESTIONS_BLOCKS')}</p></div>
                        <div className="form-group">
                            <label>{t('SURVEYS.SELECT_QUESTION_BLOCK')}:  </label>
                            <Select name={"questionBlock"} isSearchable={true}
                                onChange={handleQuestionBlock}
                                options={questionsBlocks}
                                placeholder={t('SURVEYS.SELECT')}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionBlockEmpty} disabled={!questionBlock.id}>
                                {t('SURVEYS.QUESTION_BLOCK_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {questionsBlocksSelected.map((questionBlock, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('SURVEYS.QUESTION_BLOCK')}: {getQuestionBlockLabel(questionBlock)}</p>
                                        </div>

                                        <ul className="list-group">
                                            {questionBlock.questions.map((question, index) => {
                                                return (
                                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                                        <div>
                                                            <p className="h5">{t('SURVEYS.QUESTION')}: {getQuestionSurveyLabel(question)}</p>
                                                        </div>
                                                        <div>
                                                            {t('SURVEYS.ORDER')}:
                                                            <input type="number" name={"orden_" + question.id} id={"orden_" + question.id} min="1" max="1000"
                                                                onChange={(e) => ModQuestionBlockOrden(e, questionBlock, question)} value={question.orden}></input>
                                                        </div>
                                                        <div>
                                                            <div className="form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    onChange={(e) => onChangeCheckboxVisible(e, questionBlock, question)}
                                                                    checked={question.visible}
                                                                />
                                                                <label className="form-check-label">{t('SURVEYS.VISIBLE')}</label>
                                                            </div>
                                                        </div>
                                                        <ul className="list-group">
                                                            {question.questionsNext && question.questionsNext.length > 0 &&
                                                                <div>
                                                                    <div>&nbsp;</div>
                                                                    <p className="h5">{t('SURVEYS.QUESTIONS_NEXT')}:</p>
                                                                </div>
                                                            }
                                                            {question && question.questionsNext && question.questionsNext.length > 0 &&
                                                                question.questionsNext.map((questionNext, index) => {
                                                                    return (
                                                                        <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                                                            <div>
                                                                                <p className="h6">{getQuestionSurveyLabel(questionNext)}</p>
                                                                            </div>
                                                                        </li>
                                                                    );
                                                                })
                                                            }
                                                        </ul>
                                                    </li>
                                                );
                                            })
                                            }
                                        </ul>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteQuestionBlock(index) }}>
                                                {t('SURVEYS.DELETE_QUESTION_BLOCK')}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })
                            }
                        </ul>
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('SURVEYS.SURVEY_MODIFY')} disabled={!encuesta.id} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};
