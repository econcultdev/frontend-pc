/**
 * Mantenimiento de QuestionBlockGeneral
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
import Select from 'react-select';
import { registerLocale } from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import withAuth from './witAuth';
import BackEnd from './BackEnd';
import _ from 'lodash';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import { languageService } from '../config/i18nextConf';
import TableMultiLanguage from './table-multi-language/TableMultiLanguage';


import es from 'date-fns/locale/es';
registerLocale('es', es);

let languageI18N = localStorage.getItem("language");
const myInitObject = require('./config').myInitObject;

/**
 * Componente que implementa los procesos CRUD para questionBlockGeneral
 */
class QuestionBlockGeneral extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    /**
     * Definición de las rutas del mantenimiento de questionBlockGeneral
     */
    render() {
        const { t } = this.props;
        return (
            <React.Fragment>

                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/questionblockgeneral" render={() => <QuestionBlockList {...this.props} />} />
                    <Route exact path="/questionblockgeneral/add" component={withAuth(QuestionBlockGeneralAdd)} />
                    <Route exact path="/questionblockgeneral/clone/:id" component={withAuth(QuestionBlockGeneralAdd)} />
                    <Route path="/questionblockgeneral/edit/:id" component={withAuth(QuestionBlockGeneralEdit)} />
                    <Route path="/questionblockgeneral/delete/:id" component={withAuth(QuestionBlockGeneralDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(QuestionBlockGeneral);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de questionBlockGeneral
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
                        {(administrador || permisosAcciones['/questionblockgeneral']['listar']) &&
                            <QuestionBlockGeneralListLink history={history} />
                        }
                    </div>
                    <div className="col-md-2">
                        {(administrador || permisosAcciones['/questionblockgeneral']['crear']) &&
                            <QuestionBlockGeneralAddLink history={history} />
                        }
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list' && (administrador || permisosAcciones['/questionblockgeneral']['listar'])) {
        ret = true;
        return (
            <div className="container">
                <QuestionBlockGeneralListLink history={history} />
            </div>
        );
    }
    if (action !== 'add' && (administrador || permisosAcciones['/questionblockgeneral']['crear'])) {
        ret = true;
        return (
            <div className="container">
                <QuestionBlockGeneralAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de questionBlockGeneral
 */
const QuestionBlockGeneralListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/questionblockgeneral') }}>
            {t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_MAITENANCE_LIST')}
        </button>
    );
};

/**
 * Enlace a crear una questionBlock
 */
const QuestionBlockGeneralAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/questionblockgeneral/add') }}>
            {t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_MAITENANCE_ADD')}
        </button>
    );
};

/**
 * Componente para listar questionBlockGeneral en una tabla
 */
const QuestionBlockList = ({ history, administrador, userId, permisosAcciones }) => {

    const [questionBlockGeneral, setQuestionBlockGeneral] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const [t] = useTranslation("global");


    /**
     * Borrar questionBlock
     * @param {*} row
     */
    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, nombre: row.row.nombre });
        setShowDeleteConfirm(true);
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
                            <button className="btn btn-primary" onClick={() => { history.push('/questionblockgeneral/edit/' + row.row.id) }}>
                                {t('QUESTION_BLOCK_GENERAL.EDIT')}
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                {t('QUESTION_BLOCK_GENERAL.DELETE')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else if (permisosAcciones['/questionblockgeneral'] && (permisosAcciones['/questionblockgeneral']['modificar']
            || permisosAcciones['/questionblockgeneral']['crear'] || permisosAcciones['/eventos']['borrar'])) {
            return (
                <div className="container">
                    <div style={flexStyle}>
                        {permisosAcciones['/questionblockgeneral']['modificar'] &&
                            <div className="col-md-4">
                                <button className="btn btn-primary" onClick={() => { history.push('/questionblockgeneral/edit/' + row.row.id) }}>
                                    {t('QUESTION_BLOCK_GENERAL.EDIT')}
                                </button>
                            </div>
                        }
                        {permisosAcciones['/questionblockgeneral']['borrar'] &&
                            <div className="col-md-4">
                                <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                                    {t('QUESTION_BLOCK_GENERAL.DELETE')}
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

    const getColumnJSONMultilanguage = (columnMulti) => {
        if (languageI18N) {
            return columnMulti + '.' + languageI18N;
        } else {
            return columnMulti + '.en';
        }
    }

    // columnas de la tabla
    const columns = [
        {
            dataField: 'id',
            text: t('QUESTION_BLOCK_GENERAL.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('name'),
            text: t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('QUESTION_BLOCK_GENERAL.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger las questionBlockGeneral
     */
    useEffect(
        () => {
            let urlSuffix = (!administrador) ? '?userId=' + userId : '';
            axios.get(myInitObject.crudServer + '/crud/questionblockgeneral' + urlSuffix,
                { withCredentials: true })
                .then(response => {
                    setQuestionBlockGeneral(response.data);
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
            <Trans i18nKey="QUESTION_BLOCK_GENERAL.PAGINATION_TOTAL">
                {t('QUESTION_BLOCK_GENERAL.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: questionBlockGeneral,
        totalsize: questionBlockGeneral.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: questionBlockGeneral.length === 0,
        withFirstAndLast: true,
        firstPageText: t('QUESTION_BLOCK_GENERAL.FIRST_PAGE_TEXT'),
        firstPageTitle: t('QUESTION_BLOCK_GENERAL.FIRST_PAGE_TITLE'),
        prePageText: t('QUESTION_BLOCK_GENERAL.PRE_PAGE_TEXT'),
        prePageTitle: t('QUESTION_BLOCK_GENERAL.PRE_PAGE_TITLE'),
        nextPageText: t('QUESTION_BLOCK_GENERAL.NEXT_PAGE_TEXT'),
        nextPageTitle: t('QUESTION_BLOCK_GENERAL.NEXT_PAGE_TITLE'),
        lastPageText: t('QUESTION_BLOCK_GENERAL.LAST_PAGE_TEXT'),
        lastPageTitle: t('QUESTION_BLOCK_GENERAL.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    // campo de ordenación por defecto en la tabla
    const defaultSorted = [{
        dataField: 'id',
        order: 'asc'
    }];

    // cerrar modal de confirmación de borrado
    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }

    // borrado de la questionBlock
    const handleDelete = () => {
        history.push('/questionblockgeneral/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">
            { (!administrador && !permisosAcciones['/questionblockgeneral']['listar']) &&
                <Redirect to="/backend" />
            }
            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_DELETE')}
                </ModalHeader>
                <ModalBody>{t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('QUESTION_BLOCK_GENERAL.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('QUESTION_BLOCK_GENERAL.DELETE')}
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
                                    data={questionBlockGeneral}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_NO_QUESTION_BLOCKS')}
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
 * Componente de borrado de questionBlockGeneral
 */
const QuestionBlockGeneralDelete = ({ history, match, administrador, permisosAcciones }) => {

    // borrar la questionBlock y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/questionblock/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/questionblockgeneral'))
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
 * Componente para añadir una questionBlock
 */
const QuestionBlockGeneralAdd = ({ history, match, administrador, permisosAcciones }) => {

    const [questionBlock, setQuestionBlock] = useState({
        name: [],
        general: 1,
        cultotype: 0,
        questions: [{ id: 0 }],
        valid: false
    });
    const [questions, setQuestions] = useState([]);
    const [questionsSelected, setQuestionsSelected] = useState([]);
    const [nextQuestions, setNextQuestions] = useState([]);
    const [question, setQuestion] = useState({});
    const [t] = useTranslation("global");

    const [modalOpen, setModalOpen] = useState(false);
    const [showModalMessage, setShowModalMessage] = useState({});

    // recoger preguntas de questionBlockGeneral, eventos y preguntas siguientes para mostrarlas en un combo
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
                        questionBlock.name = _.cloneDeep(responseLanguages.data);
                        setQuestionBlock(questionBlock);
                    }
                });
            const surveyQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapreguntas/available', { withCredentials: true });
            const nextQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapregunta/preguntas_siguientes', { withCredentials: true });
            const surveyPromise = (match.params.id) ? axios.get(myInitObject.crudServer + '/crud/encuesta/edit/' + match.params.id, { withCredentials: true }) : null;
            Promise.all([surveyQuestionsPromise, nextQuestionsPromise, surveyPromise]).then((res) => {
                setQuestions(res[0].data.map(element => {
                    return {
                        value: element.id,
                        label: element.pregunta_multi[languageI18N] ? element.pregunta_multi[languageI18N] : element.pregunta
                    }
                }));
                setNextQuestions(res[1].data);
                if (res[2]) {
                    res[2].data.nombre_multi = questionBlock.name;
                    setQuestionBlock(res[2].data);
                    if (res[2].data.preguntas) {
                        let preguntas = [];
                        for (const pregunta of res[2].data.preguntas) {
                            preguntas.push({ id: pregunta.id, pregunta: pregunta.pregunta, orden: pregunta.EncuestaPreguntas.orden });
                        }
                        setQuestionsSelected(preguntas.sort((a, b) => { return a.orden - b.orden }));
                    }
                }
            }).catch(function (error) {
                console.error(error);
            });
        },
        [history, match.params.id]
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
                        {t('QUESTION_BLOCK_GENERAL.CLOSE')}
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
            title: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER',
            body: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setQuestionBlock(objectBase);
    }

    const handleQuestion = ((e) => {
        setQuestion({ id: e.value, pregunta: e.label });
    });

    const AddQuestionEmpty = ((e) => {
        e.preventDefault();
        for (const questionSelected of questionsSelected) {
            if (questionSelected.id === question.id) {
                return;
            }
        }
        if (question.id) {
            let obj = JSON.parse(JSON.stringify(questionsSelected));
            obj.push({ id: question.id, pregunta: question.pregunta, orden: 1, visible: true });
            setQuestionsSelected(obj);
        }
    });

    const DeleteQuestion = (index) => {
        const values = [...questionsSelected];
        values.splice(index, 1);
        setQuestionsSelected(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesSurvey = (response, multiVariable) => {
        let lSurvey = _.cloneDeep(questionBlock);
        lSurvey[multiVariable] = response;
        setQuestionBlock(lSurvey);
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
     * Get transformed list questions with id and visible parametters 
     * @returns List transformed questions
     */
    const getTransformQuestionsSelected = () => {
        let lQuestionsSelected = [];
        questionsSelected.map(question => {
            lQuestionsSelected.push({ id: question.id });
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
            name: baseObject.name2,
            general: baseObject.general,
            cultotype: baseObject.cultotype,
            questions: getTransformQuestionsSelected()
        }
        return lBaseObject;
    }

    // crear questionBlock
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(questionBlock);
        let lVariablesObligation = ['name'];
        changeResponseValidation(questionBlock, lVariablesObligation);
        transformObjectToMultiLenguage(questionBlock, lVariablesObligation);
        if (questionBlock && questionBlock.valid) {
            let lQuestionBlock = getObjectComplete(questionBlock);
            const pregIds = questionsSelected.map(el => el.id);
            const nextQuestionsBuffer = [];
            for (const nQ of nextQuestions) {
                if (pregIds.includes(nQ.EncuestaPreguntaId) && !pregIds.includes(nQ.EncuestaPreguntaSiguienteId)) {
                    let lQuestionBase = lQuestionBlock.questions.find(qt => qt.id === nQ.EncuestaPreguntaId);
                    nextQuestionsBuffer.push(nQ);
                    lQuestionBlock.questions.push({ id: nQ.EPSId.id, parentId: lQuestionBase.id });
                    pregIds.push(nQ.EPSId.id);
                }
            }
            while (nextQuestionsBuffer.length) {
                const preg = nextQuestionsBuffer.shift();
                const nextQuestionsChildren = nextQuestions.filter((el) => el.EncuestaPreguntaId === preg.EncuestaPreguntaSiguienteId
                    && !pregIds.includes(el.EncuestaPreguntaSiguienteId));
                if (nextQuestionsChildren.length) {
                    for (const nQC of nextQuestionsChildren) {
                        let lQuestionBase = lQuestionBlock.questions.find(qt => qt.id === nQC.EncuestaPreguntaId);
                        lQuestionBlock.questions.push({ id: nQC.EPSId.id, parentId: lQuestionBase.id });
                        pregIds.push(nQC.EPSId.id);
                    }
                    nextQuestionsBuffer.push(...nextQuestionsChildren);
                }
            }

            axios.post(myInitObject.crudServer + '/crud/questionblockgeneral/add', lQuestionBlock,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER',
                        body: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/questionblockgeneral/');
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

    // pintar formulario de creación
    return (
        <div className="container">
            { (!administrador && !permisosAcciones['/questionblockgeneral']['crear']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}
            <ListLinks history={history} action="add" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_ADD_QUESTION')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK')} (*):  </label>
                        <TableMultiLanguage
                            languages={questionBlock.name}
                            onChange={(response) =>
                                changeValuesMultilanguagesSurvey(response, 'name')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('QUESTION_BLOCK_GENERAL.SELECTED_QUESTIONS')}</p></div>
                        <div className="form-group">
                            <label>{t('QUESTION_BLOCK_GENERAL.SELECT_QUESTION')}:  </label>
                            <Select name={"Pregunta"} isSearchable={true}
                                onChange={handleQuestion}
                                options={questions}
                                placeholder={t('QUESTION_BLOCK_GENERAL.SELECT')}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionEmpty} disabled={!question.id}>
                                {t('QUESTION_BLOCK_GENERAL.QUESTION_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {questionsSelected.map((pregunta, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('QUESTION_BLOCK_GENERAL.QUESTION')}: {getQuestionSurveyLabel(pregunta)}</p>
                                        </div>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteQuestion(index) }}>
                                                {t('QUESTION_BLOCK_GENERAL.DATE_QUESTION')}
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
                        <input type="submit" value={t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTRATION')} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};



/**
 * Componente para editar y modificar una questionBlock
 */
const QuestionBlockGeneralEdit = ({ history, match, administrador, permisosAcciones }) => {

    const [questionBlock, setQuestionBlock] = useState({
        name: [],
        general: 1,
        cultotype: 0,
        questions: [{ id: 0 }],
        valid: false
    });
    const [questions, setQuestions] = useState([]);
    const [questionsSelected, setQuestionsSelected] = useState([]);
    const [nextQuestions, setNextQuestions] = useState([]);
    const [question, setQuestion] = useState({});
    const [t] = useTranslation("global");

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

    // recoger datos de la questionBlock, preguntas de questionBlockGeneral, eventos y preguntas siguientes para mostrarlas en un combo
    useEffect(
        () => {
            const surveyQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapreguntas', { withCredentials: true });
            const nextQuestionsPromise = axios.get(myInitObject.crudServer + '/crud/encuestapregunta/preguntas_siguientes', { withCredentials: true });
            const questionBlockPromise = axios.get(myInitObject.crudServer + '/crud/questionblock/edit/' + match.params.id, { withCredentials: true });
            Promise.all([surveyQuestionsPromise, nextQuestionsPromise, questionBlockPromise]).then((res) => {
                setQuestions(res[0].data.map(element => {
                    return {
                        value: element.id,
                        label: element.pregunta_multi[languageI18N] ? element.pregunta_multi[languageI18N] : element.pregunta
                    }
                }));
                setNextQuestions(res[1].data);
                if (res[2]) {
                    if (res[2].data.preguntas) {
                        let preguntas = [];
                        for (const pregunta of res[2].data.preguntas) {
                            preguntas.push({ id: pregunta.id, pregunta: pregunta.pregunta, orden: pregunta.QuestionBlockGeneralPreguntas.orden });
                        }
                        setQuestionsSelected(preguntas.sort((a, b) => { return a.orden - b.orden }));
                    }

                    axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                        .then(responseLanguages => {
                            if (responseLanguages.data && responseLanguages.data.length > 0) {
                                responseLanguages.data.map(d => {
                                    d.value = d.id;
                                    d.label = d.name;
                                    return d;
                                });
                                let lVariablesMulti = ['name'];
                                lVariablesMulti.map(vMulti => {
                                    let lLanguage = _.cloneDeep(responseLanguages.data);
                                    let lValues = transformLanguageByValues(lLanguage, res[2].data[vMulti]);
                                    res[2].data[vMulti] = lValues;
                                });

                                if (res[2].data && res[2].data.questions) {
                                    let lQuestionsSelected = _.cloneDeep(questionsSelected);
                                    res[2].data.questions.map(qt => {
                                        lQuestionsSelected.push({ id: qt.id, pregunta: qt.pregunta, orden: 1 });
                                    });
                                    setQuestionsSelected(lQuestionsSelected);
                                }

                                setQuestionBlock(res[2].data);
                            }
                        });
                }
            }).catch(function (error) {
                console.error(error);
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
                        {t('QUESTION_BLOCK_GENERAL.CLOSE')}
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
            title: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER',
            body: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_REGISTRATION_ERROR'
        });
        setModalOpen(true);
        setQuestionBlock(objectBase);
    }

    const handleQuestion = ((e) => {
        setQuestion({ id: e.value, pregunta: e.label });
    });

    const AddQuestionEmpty = ((e) => {
        e.preventDefault();
        for (const questionSelected of questionsSelected) {
            if (questionSelected.id === question.id)
                return;
        }
        if (question.id) {
            let obj = JSON.parse(JSON.stringify(questionsSelected));
            obj.push({ id: question.id, pregunta: question.pregunta, orden: 1 });
            setQuestionsSelected(obj);
        }
    });

    const DeleteQuestion = (index) => {
        const values = [...questionsSelected];
        values.splice(index, 1);
        setQuestionsSelected(values);
    };

    /****************************************************
     ******************** TABLE *************************
     ****************************************************/

    /**
     * Assign the new multi languages values to event type
     * @param {*} response Values from new languages
     */
    const changeValuesMultilanguagesSurvey = (response, multiVariable) => {
        let lSurvey = _.cloneDeep(questionBlock);
        lSurvey[multiVariable] = response;
        setQuestionBlock(lSurvey);
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
     * Get transformed list questions with id and visible parametters 
     * @returns List transformed questions
     */
    const getTransformQuestionsSelected = () => {
        let lQuestionsSelected = [];
        questionsSelected.map(question => {
            lQuestionsSelected.push({ id: question.id });
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
            name: baseObject.name2,
            general: baseObject.general,
            cultotype: baseObject.cultotype,
            questions: getTransformQuestionsSelected()
        }
        return lBaseObject;
    }

    // modificar questionBlock
    const onSubmit = ((e) => {
        e.preventDefault();
        let lObjectClone = _.cloneDeep(questionBlock);
        let lVariablesObligation = ['name'];
        changeResponseValidation(questionBlock, lVariablesObligation);
        transformObjectToMultiLenguage(questionBlock, lVariablesObligation);
        if (questionBlock && questionBlock.valid) {
            let lQuestionBlock = getObjectComplete(questionBlock);
            const pregIds = questionsSelected.map(el => el.id);
            const nextQuestionsBuffer = [];
            for (const nQ of nextQuestions) {
                if (pregIds.includes(nQ.EncuestaPreguntaId) && !pregIds.includes(nQ.EncuestaPreguntaSiguienteId)) {
                    let lQuestionBase = lQuestionBlock.questions.find(qt => qt.id === nQ.EncuestaPreguntaId);
                    nextQuestionsBuffer.push(nQ);
                    lQuestionBlock.questions.push({ id: nQ.EPSId.id, parentId: lQuestionBase.id });
                    pregIds.push(nQ.EPSId.id);
                }
            }
            while (nextQuestionsBuffer.length) {
                const preg = nextQuestionsBuffer.shift();
                const nextQuestionsChildren = nextQuestions.filter((el) => el.EncuestaPreguntaId === preg.EncuestaPreguntaSiguienteId
                    && !pregIds.includes(el.EncuestaPreguntaSiguienteId));
                if (nextQuestionsChildren.length) {
                    for (const nQC of nextQuestionsChildren) {
                        let lQuestionBase = lQuestionBlock.questions.find(qt => qt.id === nQC.EncuestaPreguntaId);
                        lQuestionBlock.questions.push({ id: nQC.EPSId.id, parentId: lQuestionBase.id });
                        pregIds.push(nQC.EPSId.id);
                    }
                    nextQuestionsBuffer.push(...nextQuestionsChildren);
                }
            }

            axios.post(myInitObject.crudServer + '/crud/questionblockgeneral/update', lQuestionBlock,
                { withCredentials: true })
                .then(() => {
                    setShowModalMessage({
                        title: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER',
                        body: 'QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_REGISTRATION_OK'
                    });
                    setModalOpen(true);
                    setTimeout(() => {
                        history.push('/questionblockgeneral/');
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

    // pintar formulario de modificación de questionBlockGeneral
    return (
        <div className="container">
            { (!administrador && !permisosAcciones['/questionblockgeneral']['modificar']) &&
                <Redirect to="/backend" />
            }
            {modalOpen && openModal()}

            <ListLinks history={history} action="edit" administrador={administrador} permisosAcciones={permisosAcciones} />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_REGISTER_QUESTION_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK')} (*):  </label>
                        <TableMultiLanguage
                            languages={questionBlock.name}
                            onChange={(response) =>
                                changeValuesMultilanguagesSurvey(response, 'name')
                            }
                            onValid={() => { }}
                        ></TableMultiLanguage>
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <div className="form-group"><p className="h4">{t('QUESTION_BLOCK_GENERAL.SELECTED_QUESTIONS')}</p></div>
                        <div className="form-group">
                            <label>{t('QUESTION_BLOCK_GENERAL.SELECT_QUESTION')}:  </label>
                            <Select name={"Pregunta"} isSearchable={true}
                                onChange={handleQuestion}
                                options={questions}
                            />
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionEmpty} disabled={!question.id}>
                                {t('QUESTION_BLOCK_GENERAL.QUESTION_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {questionsSelected.map((pregunta, index) => {
                                return (
                                    <li className="list-group-item" id={"pregunta_" + index} key={index}>
                                        <div>
                                            <p className="h5">{t('QUESTION_BLOCK_GENERAL.QUESTION')}: {getQuestionSurveyLabel(pregunta)}</p>
                                        </div>
                                        <div>
                                            <button className="btn btn-danger mt-2" onClick={(e) => { e.preventDefault(); DeleteQuestion(index) }}>
                                                {t('QUESTION_BLOCK_GENERAL.DATE_QUESTION')}
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
                        <input type="submit" value={t('QUESTION_BLOCK_GENERAL.QUESTION_BLOCK_MODIFY')} disabled={!questionBlock.id} className="btn btn-primary" />
                    </div>
                </ValidatorForm>
            </div>
        </div>
    );
};
