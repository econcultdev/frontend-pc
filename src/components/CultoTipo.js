/**
 * Mantenimiento de CultoTipos
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
import Select from 'react-select';
import ModalAction from './ModalAction';

import withAuth from './witAuth';
import BackEnd from './BackEnd';
import { withTranslation, useTranslation, Trans } from 'react-i18next';
import cellEditFactory from 'react-bootstrap-table2-editor';

import _, { isEmpty, isNull, isUndefined } from 'lodash';
import { languageService } from '../config/i18nextConf';

const myInitObject = require('./config').myInitObject;
let languageI18N = localStorage.getItem("language");


/**
 * Componente que implementa los procesos CRUD para CultoTipos
 */
class CultoTipo extends Component {

    componentDidMount() {
        this.subscription = languageService.get().subscribe(l => languageI18N = l.language);
    }

    componentWillUnmount() {
        // unsubscribe to ensure no memory leaks
        this.subscription.unsubscribe();
    }

    /**
     * Hay que ser administrador para poder acceder al menú de CultoTipos.
     * Definición de las rutas del mantenimiento de CultoTipos
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
                    {t('CULTOTYPE.CULTOTYPE_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/cultotipo" render={() => <CultoTipoList {...this.props} />} />
                    <Route path="/cultotipo/add" component={withAuth(CultoTipoAdd)} />
                    <Route path="/cultotipo/edit/:id" component={withAuth(CultoTipoEdit)} />
                    <Route path="/cultotipo/delete/:id" component={withAuth(CultoTipoDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(CultoTipo);

/**
 * Función para pintar el menú de enlaces del mantenimiento de listado de CultoTipos
 *
 */
const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <CultoTipoListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <CultoTipoAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <CultoTipoListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <CultoTipoAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

/**
 * Enlace al listado de CultoTipos
 */
const CultoTipoListLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/cultotipo') }}>{t('CULTOTYPE.CULTOTYPE_LIST')}</button>
    );
};

/**
 * Enlace a crear un CultoTipo
 */
const CultoTipoAddLink = ({ history }) => {
    const { t } = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/cultotipo/add') }}>{t('CULTOTYPE.CULTOTYPE_ADD')}</button>
    );
};


/**
 * Componente para listar CultoTipos en una tabla
 */
const CultoTipoList = ({ history }) => {
    const [cultotipos, setCultoTipo] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [idDelete, setIdDelete] = useState({});
    const { t } = useTranslation("global");

    // Borrar cultotipo
    const clickDelete = (row) => {
        setIdDelete({ id: row.row.id, nombre: row.row.nombre });
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
                    <div className="col-md-2"></div>
                    <div className="col-md-4">
                        <button className="btn btn-primary" onClick={() => { history.push('/cultotipo/edit/' + row.row.id) }}>{t('CULTOTYPE.EDIT')}</button>
                    </div>
                    <div className="col-md-4">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>{t('CULTOTYPE.DELETE')}</button>
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
            text: t('CULTOTYPE.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: getColumnJSONMultilanguage('nombre', 'nombre_multi'),
            text: t('CULTOTYPE.CULTOTYPE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: getColumnJSONMultilanguage('nombreH', 'nombreH_multi'),
            text: t('CULTOTYPE.CULTOTYPE_MAN'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: cell => (!cell ? "-" : cell)
        },
        {
            dataField: '',
            text: t('CULTOTYPE.ACTIONS'),
            headerAlign: 'center',
            align: 'center',
            editable: false,
            isDummyField: true,
            csvExport: false,
            formatter: actionsFormatter
        }
    ];

    /**
     * Inicializar variables y llamar a la crud rest para recoger los CultoTipos
     */
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/cultotipos',
                { withCredentials: true })
                .then(response => {
                    setCultoTipo(response.data);
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
            <Trans i18nKey="CULTOTYPE.PAGINATION_TOTAL">
                {t('CULTOTYPE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    // configuración de la tabla
    const paginationOption = {
        data: cultotipos,
        totalsize: cultotipos.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: cultotipos.length === 0,
        withFirstAndLast: true,
        firstPageText: t('CULTOTYPE.FIRST_PAGE_TEXT'),
        firstPageTitle: t('CULTOTYPE.FIRST_PAGE_TITLE'),
        prePageText: t('CULTOTYPE.PRE_PAGE_TEXT'),
        prePageTitle: t('CULTOTYPE.PRE_PAGE_TITLE'),
        nextPageText: t('CULTOTYPE.NEXT_PAGE_TEXT'),
        nextPageTitle: t('CULTOTYPE.NEXT_PAGE_TITLE'),
        lastPageText: t('CULTOTYPE.LAST_PAGE_TEXT'),
        lastPageTitle: t('CULTOTYPE.LAST_PAGE_TITLE'),
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

    // borrado del CultoTipo
    const handleDelete = () => {
        history.push('/cultotipo/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    // pintar la tabla con paginado
    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('CULTOTYPE.CULTOTYPE_DELETE')}
                </ModalHeader>
                <ModalBody>{t('CULTOTYPE.CULTOTYPE_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('CULTOTYPE.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('CULTOTYPE.DELETE')}
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
                                    data={cultotipos}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
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
 * Componente de borrado de CultoTipos
 */
const CultoTipoDelete = ({ history, match }) => {

    // borrarel cultotipo y volver al listado
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/cultotipos/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/cultotipo'))
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
 * Componente para añadir un cultotipo
 */
const CultoTipoAdd = ({ history }) => {

    const [cultotipo, setCultoTipo] = useState({ id: 0, nombre: '', nombreH: '', imagen: '', descripcion: '' });
    const [fileState, setFileState] = useState('');
    const [ok, setOk] = useState({ ok: 0, cultotipo: '' });
    const [questions, setQuestions] = useState([]);
    const [preguntasCriterio, setPreguntasCriterio] = useState([]);
    const [question, setQuestion] = useState({ id: 0, pregunta: '' });
    const [responses, setResponses] = useState({});
    const { t } = useTranslation("global");

    const [languagesWoman, setLanguageWoman] = useState([]);
    const [languagesMan, setLanguageMan] = useState([]);
    const [languagesDescription, setLanguageDescription] = useState([]);
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
                        <button className="btn btn-primary" onClick={(e) => { clickEdit(row, e) }}>{t('CULTOTYPE.EDIT')}</button>
                    </div>
                    <div className="p-2">
                        <button className="btn btn-danger" onClick={(e) => { clickDelete(row, e) }}>{t('CULTOTYPE.DELETE')}</button>
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
            text: t('CULTOTYPE.LANGUAGE').toUpperCase(),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: 'multilanguage',
            text: t('CULTOTYPE.VALUE').toUpperCase(),
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: '',
            text: t('CULTOTYPE.ACTIONS').toUpperCase(),
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
            <Trans i18nKey="CULTOTYPE.PAGINATION_TOTAL">
                {t('CULTOTYPE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    /**
     * Pagination to woman table
     */
    const paginationOptionWoman = {
        data: languagesWoman,
        totalsize: languagesWoman.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languagesWoman.length === 0,
        withFirstAndLast: true,
        paginationTotalRenderer
    };

    /**
     * Pagination to man table
     */
    const paginationOptionMan = {
        data: languagesMan,
        totalsize: languagesMan.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languagesMan.length === 0,
        withFirstAndLast: true,
        paginationTotalRenderer
    };

    /**
     * Pagination to description table
     */
    const paginationOptionDescription = {
        data: languagesDescription,
        totalsize: languagesDescription.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languagesDescription.length === 0,
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
                case 'woman':
                    lng = languagesWoman;
                    break;
                case 'man':
                    lng = languagesMan;
                    break;
                case 'description':
                    lng = languagesDescription;
                    break;
                default:
                    lng = languagesMan;
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
    const modifyCultoTypeForm = (parent, value) => {
        let attribute = '';
        switch (parent) {
            case 'woman':
                attribute = 'nombre';
                break;
            case 'man':
                attribute = 'nombreH';
                break;
            case 'description':
                attribute = 'descripcion';
                break;
            default:
                attribute = 'nombre';
                break;
        }
        cultotipo[attribute] = value;
    }

    /**
     * Delete the value from language
     */
    const handleDelete = () => {
        if (multiLanguageDelete.parent) {
            let lng = getLanguageForParent(multiLanguageDelete.parent);
            setMultiLanguageValue2Language(multiLanguageDelete.id, null, lng);
            if (multiLanguageDelete.id === 'en') {
                modifyCultoTypeForm(multiLanguageDelete.parent, '');
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
                modifyCultoTypeForm(whoShowEdit, inputValue);
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
                    {whoShowEdit === 'woman' && t('CULTOTYPE.CULTOTYPE_WOMAN_NEW')}
                    {whoShowEdit === 'man' && t('CULTOTYPE.CULTOTYPE_MAN_NEW')}
                    {whoShowEdit === 'description' && t('CULTOTYPE.CULTOTYPE_DESCRIPTION_NEW')}
                </ModalHeader>
                <ModalBody>
                    {t('CULTOTYPE.NEW')}
                    {whoShowEdit !== 'description' &&
                        <input className="form-control" type="text" maxLength="255" onChange={(e) => { handleChangeInput(e) }} />}
                    {whoShowEdit === 'description' &&
                        <textarea className="form-control" onChange={(e) => { handleChangeInput(e) }} />}
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-primary' variant="primary" onClick={(e) => handleSaveEdit(e)}>
                        {t('CULTOTYPE.SAVE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('edit') }}>{t('CULTOTYPE.CLOSE')}</Button>
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
                    {whoShowEdit === 'woman' && t('CULTOTYPE.CULTOTYPE_WOMAN_DELETE')}
                    {whoShowEdit === 'man' && t('CULTOTYPE.CULTOTYPE_MAN_DELETE')}
                    {whoShowEdit === 'description' && t('CULTOTYPE.CULTOTYPE_DESCRIPTION_DELETE')}
                </ModalHeader>
                <ModalBody>{t('CULTOTYPE.DELETE')}: {multiLanguageDelete.multilanguage}!</ModalBody>
                <ModalFooter>
                    <button className='btn btn-secondary' variant="secondary" onClick={handleDelete}>
                        {t('CULTOTYPE.DELETE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('delete') }}>{t('CULTOTYPE.CLOSE')}</Button>
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
            });
        }
        return lngs;
    }


    // recoger preguntas y respuestas de los cultotipos
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                .then(responseLanguages => {
                    if (responseLanguages.data && responseLanguages.data.length > 0) {
                        responseLanguages.data.map(d => {
                            d.value = d.id;
                            d.label = d.name;
                        });
                    }
                    axios.get(myInitObject.crudServer + '/crud/cultotipo_pregunta_respuesta',
                        { withCredentials: true })
                        .then(response => {
                            setQuestions(response.data.map(element => { return { value: element.id, label: element.pregunta } }));
                            setResponses(response.data.reduce((obj, item) => {
                                obj[item.id] = item.CultoTipoRespuesta;
                                return obj;
                            }, {}));
                            let lngs = transformLanguageByValues(responseLanguages.data, response.data.nombre_multi, 'woman');
                            setLanguageWoman(lngs);
                            lngs = transformLanguageByValues(responseLanguages.data, response.data.nombreH_multi, 'man');
                            setLanguageMan(lngs);
                            lngs = transformLanguageByValues(responseLanguages.data, response.data.descripcion_multi, 'description');
                            setLanguageDescription(lngs);
                        })
                        .catch(function (error) {
                            console.error(error);
                        })
                }).catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    // cambio en el formulario del valor de alguna propiedad del cultotipo
    const onChangeCultoTipo = ((e) => {
        let obj = JSON.parse(JSON.stringify(cultotipo));
        obj[e.target.name] = e.target.value;
        setCultoTipo(obj);
        if (e.target.name === 'imagen') {
            let imageFile = document.querySelector('#imagen');
            let file = imageFile.files[0];
            if (file !== undefined && file.size <= myInitObject.imgMaxSize
                && /^(image\/png|image\/jpeg|image\/jpg|image\/gif)$/.test(file.type)) {
                setFileState(file.name);
            } else setFileState('');
        }
        setOk({ ok: 0, cultotipo: '' });
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
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>{t('CULTOTYPE.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Convert file to base64
     * @param {*} file File
     * @returns Return Base64 string
     */
    const getBase64 = file => {
        return new Promise(resolve => {
            let baseURL = "";
            // Make new FileReader
            let reader = new FileReader();
            // Convert the file to base64 text
            reader.readAsDataURL(file);

            // on reader load somthing...
            reader.onload = () => {
                baseURL = reader.result;
                resolve(baseURL);
            };
        });
    };

    // crear el cultotipo
    const onSubmit = ((e) => {
        e.preventDefault();
        if (checkEnglishValidation((languagesWoman)) && checkEnglishValidation((languagesMan)) &&
            checkEnglishValidation((languagesDescription))) {
            let lngWomanJSON = transformLanguageToJson(languagesWoman);
            if (JSON.parse(lngWomanJSON) && JSON.parse(lngWomanJSON).en) {
                cultotipo.nombre = JSON.parse(lngWomanJSON).en;
            }
            let lngManJSON = transformLanguageToJson(languagesMan);
            if (JSON.parse(lngManJSON) && JSON.parse(lngManJSON).en) {
                cultotipo.nombreH = JSON.parse(lngManJSON).en;
            }
            let lngDescriptionJSON = transformLanguageToJson(languagesDescription);
            if (JSON.parse(lngDescriptionJSON) && JSON.parse(lngDescriptionJSON).en) {
                cultotipo.descripcion = JSON.parse(lngDescriptionJSON).en;
            }

            let formData = new FormData();
            let imageFile = document.querySelector('#imagen');
            let file = imageFile.files[0];

            getBase64(file)
                .then(result => {
                    formData.append('imagen', result);
                    formData.append('nombre', cultotipo.nombre);
                    formData.append('nombreH', cultotipo.nombreH);
                    formData.append('descripcion', cultotipo.descripcion);
                    formData.append('nombre_multi', lngWomanJSON);
                    formData.append('nombreH_multi', lngManJSON);
                    formData.append('descripcion_multi', lngDescriptionJSON);
                    let obj = [];
                    for (const pregunta of preguntasCriterio) {
                        obj.push({
                            CultoTipoPreguntaId: pregunta.CultoTipoPreguntaId,
                            criterio: pregunta.criterio
                        });
                    }
                    formData.append('preguntascriterio', JSON.stringify(obj));
                    axios.post(myInitObject.crudServer + '/crud/cultotipos/add', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        withCredentials: true
                    }).then(res => {
                        //cultotipo.id = res.data.id;
                        setCultoTipo({ id: 0, nombre: '', nombreH: '', imagen: '', descripcion: '' });
                        setFileState('');
                        setPreguntasCriterio([]);
                        setQuestion({ id: 0, pregunta: '' });
                        setOk({ ok: 1, cultotipo: res.data.nombre });
                        setTimeout(() => {
                            history.push('/cultotipo/');
                        }, 2000);
                    }).catch(function (error) {
                        setOk({ ok: -1, cultotipo: cultotipo.nombre });
                    });
                });
        } else {
            let body = 'CULTOTYPE.';
            if (transformLanguageToJson(languagesWoman)) {
                body += 'CULTOTYPE_WOMAN_ENGLISH'
            } else if (transformLanguageToJson(languagesMan)) {
                body += 'CULTOTYPE_MAN_ENGLISH'
            } else if (transformLanguageToJson(languagesDescription)) {
                body += 'CULTOTYPE_DESCRIPTION_ENGLISH'
            }
            setShowSaveErrorMessage({ title: 'CULTOTYPE.ERROR', body: body });
            setSaveError(true);
        }
    });

    // mostrar mensaje del resultado de la creación del cultotipo
    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPE.CULTOTYPE_REGISTRATION_STRONG_OK">
                        {t('CULTOTYPE.CULTOTYPE_REGISTRATION_STRONG_OK', { cultotype: ok.cultotipo })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPE.CULTOTYPE_REGISTRATION_STRONG_ERROR">
                        {t('CULTOTYPE.CULTOTYPE_REGISTRATION_STRONG_ERROR', { cultotype: ok.cultotipo })}
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
        setOk({ ok: 2, cultotipo: ok.cultotipo });
    };

    // pregunta seleccionada
    const handleQuestion = ((e) => {
        const id = parseInt(e.value, 10);
        setQuestion({ id, pregunta: e.label });
    });

    // crear criterio para pregunta seleccionada
    const AddQuestionEmpty = ((e) => {
        e.preventDefault();
        for (const pregunta of preguntasCriterio) {
            if (pregunta.CultoTipoPreguntaId === question.id)
                return;
        }
        if (question.id && question.pregunta) {
            const obj = {
                criterio: '', CultoTipoPreguntaId: question.id, pregunta: question.pregunta,
                respuestas: []
            };
            if (responses[question.id] !== undefined) {
                obj.respuestas = responses[question.id].sort((a, b) => (a.respuesta > b.respuesta) ? 1 : (b.respuesta > a.respuesta) ? -1 : 0);
            }
            const values = [...preguntasCriterio];
            values.push(obj);
            setPreguntasCriterio(values);
        }
    });

    // añadir id al criterio
    const addResponseId2Criterio = ((index, id) => {
        const values = [...preguntasCriterio];
        let criterio = values[index].criterio;
        criterio += id + '';
        values[index].criterio = criterio;
        setPreguntasCriterio(values);
    });

    // cambio del criterio de una pregunta
    const ChangeCriterio = ((e) => {
        const index = e.target.id.replace('pregunta_', '');
        const values = [...preguntasCriterio];
        values[index].criterio = e.target.value;
        setPreguntasCriterio(values);
    });

    // borrar pregunta del formulario
    const DeleteQuestion = (index) => {
        const values = [...preguntasCriterio];
        values.splice(index, 1);
        setPreguntasCriterio(values);
    };

    // pintar formulario de creación de cultotipo
    return (
        <div className="container">
            {showMultilanguageEdit && AddModal()}
            {showSaveErrorMessage && errorModal()}
            {ok.ok !== 1 && ok.ok !== 1 && showMultilanguageDeleteConfirm && deleteModal()}
            <ModalAction show={ok.ok === 1} header={t('CULTOTYPE.CULTOTYPE_REGISTRATION')} body={t('CULTOTYPE.CULTOTYPE_REGISTRATION_OK', { cultotype: ok.cultotipo })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1} header={t('CULTOTYPE.CULTOTYPE_REGISTRATION')} body={t('CULTOTYPE.CULTOTYPE_REGISTRATION_ERROR', { cultotype: ok.cultotipo })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('CULTOTYPE.CULTOTYPE_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit} method="post" encType="multipart/form-data">
                    <div className="form-group">
                        <label>{t('CULTOTYPE.CULTOTYPE')} (*):  </label>
                        <TextValidator
                            type="text"
                            className="form-control"
                            value={cultotipo.nombre}
                            name="nombre"
                            onChange={onChangeCultoTipo}
                            size="30"
                            maxLength="255"
                            disabled
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={[t('CULTOTYPE.CULTOTYPE_EMPTY'), t('CULTOTYPE.CULTOTYPE_LIMIT_LENGTH')]}
                        />

                        { /* Woman selectionable section start */}
                        <PaginationProvider pagination={paginationFactory(paginationOptionWoman)}>
                            {
                                ({
                                    paginationTableProps
                                }) => (
                                    <div className="p-1">
                                        <BootstrapTable
                                            striped
                                            hover
                                            keyField='id'
                                            data={languagesWoman}
                                            columns={columns}
                                            defaultSortDirection="asc"
                                            noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
                                            filter={filterFactory()}
                                            cellEdit={cellEditFactory({ mode: 'click' })}
                                            {...paginationTableProps} />
                                    </div>
                                )
                            }
                        </PaginationProvider>
                        {/* Woman selectionable section end */}
                    </div>

                    <div className="form-group">
                        <label>{t('CULTOTYPE.CULTOTYPE_MAN')} (*):  </label>
                        <TextValidator
                            type="text"
                            className="form-control"
                            value={cultotipo.nombreH}
                            name="nombreH"
                            onChange={onChangeCultoTipo}
                            size="30"
                            maxLength="255"
                            disabled
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={[t('CULTOTYPE.CULTOTYPE_EMPTY'), t('CULTOTYPE.CULTOTYPE_LIMIT_LENGTH')]}
                        />

                        { /* Man selectionable section start */}
                        <PaginationProvider pagination={paginationFactory(paginationOptionMan)}>
                            {
                                ({
                                    paginationTableProps
                                }) => (
                                    <div className="p-1">
                                        <BootstrapTable
                                            striped
                                            hover
                                            keyField='id'
                                            data={languagesMan}
                                            columns={columns}
                                            defaultSortDirection="asc"
                                            noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
                                            filter={filterFactory()}
                                            cellEdit={cellEditFactory({ mode: 'click' })}
                                            {...paginationTableProps} />
                                    </div>
                                )
                            }
                        </PaginationProvider>
                        {/* Man selectionable section end */}
                    </div>

                    <div className="form-group">
                        <label>{t('CULTOTYPE.IMAGE')} (*):  </label>
                        <TextValidator
                            type="file"
                            id="imagen"
                            className="form-control"
                            name="imagen"
                            value={cultotipo.imagen}
                            onChange={onChangeCultoTipo}
                            accept="image/*"
                        />
                    </div>
                    <div className="form-group">
                        <TextValidator
                            readOnly
                            onChange={() => { return }}
                            type="hidden"
                            name="filehidden"
                            value={fileState}
                            validators={['required']}
                            errorMessages={[t('CULTOTYPE.IMAGE_NOT_VALID')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('CULTOTYPE.DESCRIPTION')} (*):  </label>
                        <TextValidator
                            type="text"
                            className="form-control"
                            value={cultotipo.descripcion}
                            name="descripcion"
                            onChange={onChangeCultoTipo}
                            rows="3" cols="80"
                            disabled
                            validators={['required']}
                            errorMessages={[t('CULTOTYPE.CULTOTYPE_EMPTY')]}
                        />

                        { /* Description selectionable section start */}
                        <PaginationProvider pagination={paginationFactory(paginationOptionDescription)}>
                            {
                                ({
                                    paginationTableProps
                                }) => (
                                    <div className="p-1">
                                        <BootstrapTable
                                            striped
                                            hover
                                            keyField='id'
                                            data={languagesDescription}
                                            columns={columns}
                                            defaultSortDirection="asc"
                                            noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
                                            filter={filterFactory()}
                                            cellEdit={cellEditFactory({ mode: 'click' })}
                                            {...paginationTableProps} />
                                    </div>
                                )
                            }
                        </PaginationProvider>
                        {/* Description selectionable section end */}
                    </div>

                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <p className="h4">{t('CULTOTYPE.QUESTIONS_AND_VALORATION_CRITERIA')}</p>
                        <div className="form-group">
                            <label>{t('CULTOTYPE.QUESTION_SELECT')} </label>
                            <Select name={"Pregunta"} isSearchable={true}
                                onChange={handleQuestion}
                                options={questions}
                            />
                        </div>
                        <div className="form-group">
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionEmpty} disabled={!question.id}>{t('CULTOTYPE.CRITERIA_ADD')}</button>
                        </div>
                        <ul className="list-group">
                            {preguntasCriterio.map((pregunta, index) => {
                                return (
                                    <li className="list-group-item" id={"li_pregunta_" + index} key={index}>
                                        <p className="h5">{t('CULTOTYPE.QUESTION')}: {pregunta.pregunta}</p>
                                        <div className="form-group">
                                            <label title={t('CULTOTYPE.MATHEMATIC_EXPRESSION')}>{t('CULTOTYPE.CRITERIA')}:  </label>
                                            <div className="input-group">
                                                <TextValidator
                                                    type="text"
                                                    title={t('CULTOTYPE.MATHEMATIC_EXPRESSION')}
                                                    className="form-control"
                                                    size="50"
                                                    maxLength="255"
                                                    value={pregunta.criterio}
                                                    id={"pregunta_" + index}
                                                    name={"pregunta_" + index}
                                                    onChange={ChangeCriterio}
                                                    validators={['required', 'maxStringLength:255', 'matchRegexp:^[<>=]+[0-9]+(\\.[0-9]+)?( *[|&] *[<>=]+[0-9]+(\\.[0-9]+)?)*$']}
                                                    errorMessages={[t('CULTOTYPE.CRITERIA_EMPTY'), t('CULTOTYPE.CRITERIA_EMPTY'), t('CULTOTYPE.CRITERIA_SYMBOLS')]}
                                                />
                                                {pregunta.respuestas && pregunta.respuestas.length > 0 &&
                                                    <div className="input-group-append">
                                                        <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true"
                                                            aria-expanded="false" title={t('CULTOTYPE.CRITERIA_SELECTION')}>{t('CULTOTYPE.RESPONSES')}</button>
                                                        <div className="dropdown-menu">
                                                            {pregunta.respuestas.map((respuesta, indexR) => {
                                                                return (
                                                                    <a className="dropdown-item" href="/#" onClick={(e) => { e.preventDefault(); addResponseId2Criterio(index, respuesta.valor) }}
                                                                        key={index + '_' + indexR}>{respuesta.respuesta + ' (' + t('CULTOTYPE.VALUE') + ': ' + respuesta.valor + ')'}</a>
                                                                )
                                                            })
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                        <button className="btn btn-danger mt-2" onClick={() => DeleteQuestion(index)}>{t('CULTOTYPE.CRITERIA_DELETE')}</button>
                                    </li>
                                )
                            })}
                        </ul>
                        {preguntasCriterio.length > 0 &&
                            <div className="form-group">
                                <div className="form-group">&nbsp;</div>
                                <div className="form-group"><label>{t('CULTOTYPE.QUESTION_SELECT')}:  </label></div>
                                <div className="form-group">
                                    <Select name={"Pregunta"} isSearchable={true}
                                        onChange={handleQuestion}
                                        options={questions}
                                    />
                                    <button className="btn btn-secondary mt-2" onClick={AddQuestionEmpty}
                                        disabled={!question.id}>{t('CULTOTYPE.CRITERIA_ADD')}</button></div></div>}
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('CULTOTYPE.CULTOTYPE_REGISTRATION')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};


/**
 * Componente para editar y modificar un cultotipo
 */
const CultoTipoEdit = ({ history, match }) => {

    const [cultotipo, setCultoTipo] = useState(
        {
            id: 0,
            nombre: '',
            nombre_multi: {},
            nombreH: '',
            nombreH_multi: {},
            descripcion: '',
            imagen: '',
            preguntascriterio: []
        }
    );
    const [fileState, setFileState] = useState('');
    const [ok, setOk] = useState({ ok: 0, cultotipo: '' });
    const [questions, setQuestions] = useState([]);
    const [preguntasCriterio, setPreguntasCriterio] = useState([]);
    const [question, setQuestion] = useState({ id: 0, pregunta: '' });
    const [responses, setResponses] = useState({});

    const [languagesWoman, setLanguageWoman] = useState([]);
    const [languagesMan, setLanguageMan] = useState([]);
    const [languagesDescription, setLanguageDescription] = useState([]);
    const [showMultilanguageDeleteConfirm, setShowMultiLanguageDeleteConfirm] = useState(false);
    const [multiLanguageDelete, setMultiLanguageDelete] = useState({});
    const [showMultilanguageEdit, setShowMultiLanguageEdit] = useState(false);
    const [whoShowEdit, setWhoShowEdit] = useState('');
    const [multiLanguageEdit, setMultiLanguageEdit] = useState({});
    const [inputValue, setInputValue] = useState();
    const [showSaveError, setSaveError] = useState(false);
    const [showSaveErrorMessage, setShowSaveErrorMessage] = useState({});

    const { t } = useTranslation("global");

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
                        <button className="btn btn-primary" onClick={(e) => { clickEdit(row, e) }}>{t('CULTOTYPE.EDIT')}</button>
                    </div>
                    <div className="p-2">
                        <button className="btn btn-danger" onClick={(e) => { clickDelete(row, e) }}>{t('CULTOTYPE.DELETE')}</button>
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
            text: t('CULTOTYPE.LANGUAGE').toUpperCase(),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: 'multilanguage',
            text: t('CULTOTYPE.VALUE').toUpperCase(),
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: '',
            text: t('CULTOTYPE.ACTIONS').toUpperCase(),
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
            <Trans i18nKey="CULTOTYPE.PAGINATION_TOTAL">
                {t('CULTOTYPE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    /**
     * Pagination to woman table
     */
    const paginationOptionWoman = {
        data: languagesWoman,
        totalsize: languagesWoman.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languagesWoman.length === 0,
        withFirstAndLast: true,
        paginationTotalRenderer
    };

    /**
     * Pagination to man table
     */
    const paginationOptionMan = {
        data: languagesMan,
        totalsize: languagesMan.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languagesMan.length === 0,
        withFirstAndLast: true,
        paginationTotalRenderer
    };

    /**
     * Pagination to description table
     */
    const paginationOptionDescription = {
        data: languagesDescription,
        totalsize: languagesDescription.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: languagesDescription.length === 0,
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
                case 'woman':
                    lng = languagesWoman;
                    break;
                case 'man':
                    lng = languagesMan;
                    break;
                case 'description':
                    lng = languagesDescription;
                    break;
                default:
                    lng = languagesMan;
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
    const modifyCultoTypeForm = (parent, value) => {
        let attribute = '';
        switch (parent) {
            case 'woman':
                attribute = 'nombre';
                break;
            case 'man':
                attribute = 'nombreH';
                break;
            case 'description':
                attribute = 'descripcion';
                break;
            default:
                attribute = 'nombre';
                break;
        }
        cultotipo[attribute] = value;
    }

    /**
     * Delete the value from language
     */
    const handleDelete = () => {
        if (multiLanguageDelete.parent) {
            let lng = getLanguageForParent(multiLanguageDelete.parent);
            setMultiLanguageValue2Language(multiLanguageDelete.id, null, lng);
            if (multiLanguageDelete.id === 'en') {
                modifyCultoTypeForm(multiLanguageDelete.parent, '');
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
                modifyCultoTypeForm(whoShowEdit, inputValue);
            }
        }
        handleClose('edit');
    }

    /**
     * Build Edit Modal
     */
    const EditModal = () => {
        return (
            <Modal isOpen={showMultilanguageEdit}>
                <ModalHeader>
                    {whoShowEdit === 'woman' && t('CULTOTYPE.CULTOTYPE_WOMAN_EDIT')}
                    {whoShowEdit === 'man' && t('CULTOTYPE.CULTOTYPE_MAN_EDIT')}
                    {whoShowEdit === 'description' && t('CULTOTYPE.CULTOTYPE_DESCRIPTION_EDIT')}
                </ModalHeader>
                <ModalBody>
                    {t('CULTOTYPE.EDIT')}
                    {whoShowEdit !== 'description' &&
                        <input className="form-control" type="text" maxLength="255" onChange={(e) => { handleChangeInput(e) }} />}
                    {whoShowEdit === 'description' &&
                        <textarea className="form-control" onChange={(e) => { handleChangeInput(e) }} />}
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-primary' variant="primary" onClick={(e) => handleSaveEdit(e)}>
                        {t('CULTOTYPE.SAVE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('edit') }}>{t('CULTOTYPE.CLOSE')}</Button>
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
                    {whoShowEdit === 'woman' && t('CULTOTYPE.CULTOTYPE_WOMAN_DELETE')}
                    {whoShowEdit === 'man' && t('CULTOTYPE.CULTOTYPE_MAN_DELETE')}
                    {whoShowEdit === 'description' && t('CULTOTYPE.CULTOTYPE_DESCRIPTION_DELETE')}
                </ModalHeader>
                <ModalBody>{t('CULTOTYPE.DELETE')}: {multiLanguageDelete.multilanguage}!</ModalBody>
                <ModalFooter>
                    <button className='btn btn-secondary' variant="secondary" onClick={handleDelete}>
                        {t('CULTOTYPE.DELETE')}
                    </button>
                    <Button color="danger" onClick={(e) => { handleClose('delete') }}>{t('CULTOTYPE.CLOSE')}</Button>
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
                lng.multilanguage = values[lng.id];
                lng.parent = parent;
            });
        }
        return lngs;
    }

    // recoger datos del cultptipo y de las preguntas y respuestas
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/language/multilanguagetable', { withCredentials: true })
                .then(responseLanguages => {
                    if (responseLanguages.data && responseLanguages.data.length > 0) {
                        responseLanguages.data.map(d => {
                            d.value = d.id;
                            d.label = d.name;
                        });
                    }
                    axios.get(myInitObject.crudServer + '/crud/cultotipo_pregunta_respuesta',
                        { withCredentials: true })
                        .then(response => {
                            let lQuestions = response.data.map(element => {
                                return { value: element.id, label: element.pregunta, multilanguage: element.pregunta_multi };
                            });
                            setQuestions(lQuestions);

                            const responsesObj = response.data.reduce((obj, item) => {
                                obj[item.id] = item.CultoTipoRespuesta;
                                return obj;
                            }, {});
                            setResponses(responsesObj);

                            axios.get(myInitObject.crudServer + '/crud/cultotipos/edit/' + match.params.id,
                                { withCredentials: true })
                                .then(response => {
                                    let image = _.cloneDeep(response.data.imagen);
                                    if (isNull(image) || isUndefined(image) || isEmpty(image)
                                        || (!isEmpty(image) && !image.includes('data:image/'))) {
                                        image = '';
                                    }
                                    response.data.imagen = '';
                                    setFileState(image);
                                    setCultoTipo(response.data);
                                    if (response.data.nombre_multi) {
                                        let lngs = transformLanguageByValues(responseLanguages.data, response.data.nombre_multi, 'woman');
                                        setLanguageWoman(lngs);
                                    }
                                    if (response.data.nombreH_multi) {
                                        let lngs = transformLanguageByValues(responseLanguages.data, response.data.nombreH_multi, 'man');
                                        setLanguageMan(lngs);
                                    }
                                    if (response.data.descripcion_multi) {
                                        let lngs = transformLanguageByValues(responseLanguages.data, response.data.descripcion_multi, 'description');
                                        setLanguageDescription(lngs);
                                    }

                                    const preguntas = [];
                                    for (const CultoTipoPreguntaCriterio of response.data.preguntascriterio) {
                                        let obj = {
                                            CultoTipoPreguntaId: CultoTipoPreguntaCriterio.CultoTipoPreguntaId,
                                            criterio: CultoTipoPreguntaCriterio.criterio,
                                            pregunta: CultoTipoPreguntaCriterio.CultoTipoPregunta.pregunta,
                                            pregunta_multi: CultoTipoPreguntaCriterio.CultoTipoPregunta.pregunta_multi,
                                            respuestas: []
                                        };
                                        if (responsesObj[obj.CultoTipoPreguntaId] !== undefined) {
                                            obj.respuestas = responsesObj[obj.CultoTipoPreguntaId].sort((a, b) => (a.respuesta > b.respuesta) ? 1 : (b.respuesta > a.respuesta) ? -1 : 0);
                                        }
                                        preguntas.push(obj);
                                    }
                                    setPreguntasCriterio(preguntas);
                                })
                                .catch(function (error) {
                                    console.error(error);
                                });
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                })
                .catch(
                    function (error) {
                        console.error(error);
                    }
                );
        },
        [history, match]
    );

    /**
     * Convert file to base64
     * @param {*} file File
     * @returns Return Base64 string
     */
    const getBase64 = file => {
        return new Promise(resolve => {
            let baseURL = "";
            // Make new FileReader
            let reader = new FileReader();
            // Convert the file to base64 text
            reader.readAsDataURL(file);

            // on reader load somthing...
            reader.onload = () => {
                baseURL = reader.result;
                resolve(baseURL);
            };
        });
    };

    // cambio en el formulario del valor de alguna propiedad del cultotipo
    const onChangeCultoTipo = ((e) => {
        let obj = JSON.parse(JSON.stringify(cultotipo));
        obj[e.target.name] = e.target.value;
        if (e.target.name === 'imagen') {
            let imageFile = document.querySelector('#imagen');
            let file = imageFile.files[0];
            if (file && file.size > 5000000) {
                setFileState('');
                return;
            }
            if (file !== undefined && file.size <= myInitObject.imgMaxSize
                && /^(image\/png|image\/jpeg|image\/jpg|image\/gif)$/.test(file.type)) {
                // setFileState(file.name);

                getBase64(file)
                    .then(result => { setFileState(result) })
                    .catch(error => console.log(error));

                let reader = new FileReader();
                reader.onloadend = function (evt) {
                    if (evt.target.readyState === FileReader.DONE) {
                        document.querySelector("#img").src = evt.target.result;
                    }
                };
                reader.readAsDataURL(file);

            } else {
                setFileState('');
            };
        }
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
                    <Button color="danger" onClick={(e) => { handleClose('save') }}>{t('CULTOTYPE.CLOSE')}</Button>
                </ModalFooter>
            </Modal>
        );
    }

    const getValueMultiLanguage = (pregunta) => {
        if (languageI18N) {
            if (pregunta.pregunta_multi) {
                if (pregunta.pregunta_multi[languageI18N]) {
                    return pregunta.pregunta_multi[languageI18N];
                } else if (pregunta.pregunta_multi['en']) {
                    return pregunta.pregunta_multi['en'];
                }
            }
        }
        return pregunta.pregunta;
    }

    const getValueJSONMultilanguage = (columnBase, columnMulti) => {
        if (languageI18N) {
            return columnMulti + '.' + languageI18N;
        } else {
            return columnBase;
        }
    }

    /**
     * Transform to correct format event object for save in db
     * @param {*} baseObject Base Object
     * @returns 
     */
    const getObjectComplete = (baseObject) => {
        let lQuestionsCriteria = [];
        for (const pregunta of preguntasCriterio) {
            lQuestionsCriteria.push({ CultoTipoPreguntaId: pregunta.CultoTipoPreguntaId, criterio: pregunta.criterio, CultoTipoId: cultotipo.id });
        }
        let lBaseObject = {
            id: baseObject.id,
            nombre: baseObject.nombre,
            nombre_multi: transformLanguageToJson(languagesWoman),
            nombreH: baseObject.nombreH,
            nombreH_multi: transformLanguageToJson(languagesMan),
            descripcion: baseObject.descripcion,
            descripcion_multi: transformLanguageToJson(languagesDescription),
            imagen: fileState,
            preguntascriterio: JSON.stringify(lQuestionsCriteria)
        }
        return lBaseObject;
    }

    /**
     * Change the cultotype
     * @param {*} e Event
     */
    const onSubmit = ((e) => {
        e.preventDefault();
        if (checkEnglishValidation((languagesWoman)) && checkEnglishValidation((languagesMan)) &&
            checkEnglishValidation((languagesDescription))) {
            let lCultoType = getObjectComplete(cultotipo);
            axios.post(myInitObject.crudServer + '/crud/cultotipos/update', lCultoType, {
                withCredentials: true
            }).then(res => {
                res.data.imagen = '';
                setCultoTipo(res.data);
                setOk({ ok: 1, cultotipo: res.data.nombre })
                setTimeout(() => {
                    history.push('/cultotipo/');
                }, 2000);
            }
            ).catch(function (error) {
                setOk({ ok: -1, cultotipo: cultotipo.nombre });
            });
        } else {
            let body = 'CULTOTYPE.';
            if (transformLanguageToJson(languagesWoman)) {
                body += 'CULTOTYPE_WOMAN_ENGLISH'
            } else if (transformLanguageToJson(languagesMan)) {
                body += 'CULTOTYPE_MAN_ENGLISH'
            } else if (transformLanguageToJson(languagesDescription)) {
                body += 'CULTOTYPE_DESCRIPTION_ENGLISH'
            }
            setShowSaveErrorMessage({ title: 'CULTOTYPE.ERROR', body: body });
            setSaveError(true);
        }
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPE.CULTOTYPE_MODIFY_STRONG_OK">
                        {t('CULTOTYPE.CULTOTYPE_MODIFY_STRONG_OK', { cultotype: ok.cultotipo })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="CULTOTYPE.CULTOTYPE_MODIFY_STRONG_ERROR">
                        {t('CULTOTYPE.CULTOTYPE_MODIFY_STRONG_ERROR', { cultotype: ok.cultotipo })}
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
        setOk({ ok: 2, cultotipo: ok.cultotipo });
    };

    const handleQuestion = ((e) => {
        setQuestion({ id: parseInt(e.value, 10), pregunta: e.label });
    });

    const AddQuestionEmpty = ((e) => {
        e.preventDefault();
        for (const pregunta of preguntasCriterio) {
            if (pregunta.CultoTipoPreguntaId === question.id)
                return;
        }
        if (question.id && question.pregunta) {
            const obj = {
                criterio: '', CultoTipoPreguntaId: question.id, pregunta: question.pregunta,
                respuestas: []
            };
            if (responses[question.id] !== undefined) {
                obj.respuestas = responses[question.id].sort((a, b) => (a.respuesta > b.respuesta) ? 1 : (b.respuesta > a.respuesta) ? -1 : 0);
            }
            const values = [...preguntasCriterio];
            values.push(obj);
            setPreguntasCriterio(values);
        }
    });

    const addResponseId2Criterio = ((index, id) => {
        const values = [...preguntasCriterio];
        let criterio = values[index].criterio;
        criterio += id + '';
        values[index].criterio = criterio;
        setPreguntasCriterio(values);
    });

    const ChangeCriterio = ((e) => {
        const index = e.target.id.replace('pregunta_', '');
        const values = [...preguntasCriterio];
        values[index].criterio = e.target.value;
        setPreguntasCriterio(values);
    });

    const DeleteQuestion = (index) => {
        const values = [...preguntasCriterio];
        values.splice(index, 1);
        setPreguntasCriterio(values);
    };

    // pintar formulario de modificación de cultotipo
    return (
        <div className="container">
            {showMultilanguageEdit && EditModal()}
            {showSaveErrorMessage && errorModal()}
            {ok.ok !== 1 && ok.ok !== 1 && showMultilanguageDeleteConfirm && deleteModal()}
            <ModalAction show={ok.ok === 1}
                header={t('CULTOTYPE.CULTOTYPE_MODIFICATION_OF')}
                body={t('CULTOTYPE.CULTOTYPE_MODIFY_OK', { cultotype: ok.cultotipo })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('CULTOTYPE.CULTOTYPE_MODIFICATION_OF')}
                body={t('CULTOTYPE.CULTOTYPE_MODIFY_ERROR', { cultotype: ok.cultotipo })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('CULTOTYPE.CULTOTYPE_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit} method="post" encType="multipart/form-data">
                    <div className="form-group">
                        <label>{t('CULTOTYPE.CULTOTYPE_WOMAN')} (*):  </label>
                        <TextValidator
                            type="text"
                            className="form-control"
                            value={cultotipo.nombre}
                            name="nombre"
                            onChange={onChangeCultoTipo}
                            size="30"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages=
                            {
                                [
                                    t('CULTOTYPE.CULTOTYPE_EMPTY'),
                                    t('CULTOTYPE.CULTOTYPE_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>

                    { /* Woman selectionable section start */}
                    <PaginationProvider pagination={paginationFactory(paginationOptionWoman)}>
                        {
                            ({
                                paginationTableProps
                            }) => (
                                <div className="p-1">
                                    <BootstrapTable
                                        striped
                                        hover
                                        keyField='id'
                                        data={languagesWoman}
                                        columns={columns}
                                        defaultSortDirection="asc"
                                        noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
                                        filter={filterFactory()}
                                        cellEdit={cellEditFactory({ mode: 'click' })}
                                        {...paginationTableProps} />
                                </div>
                            )
                        }
                    </PaginationProvider>
                    {/* Woman selectionable section end */}

                    <div className="form-group">
                        <label>{t('CULTOTYPE.CULTOTYPE_MAN')} (*):  </label>
                        <TextValidator
                            type="text"
                            className="form-control"
                            value={cultotipo.nombreH}
                            name="nombreH"
                            onChange={onChangeCultoTipo}
                            size="30"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages=
                            {
                                [
                                    t('CULTOTYPE.CULTOTYPE_EMPTY'),
                                    t('CULTOTYPE.CULTOTYPE_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>

                    { /* Man selectionable section start */}
                    <PaginationProvider pagination={paginationFactory(paginationOptionMan)}>
                        {
                            ({
                                paginationTableProps
                            }) => (
                                <div className="p-1">
                                    <BootstrapTable
                                        striped
                                        hover
                                        keyField='id'
                                        data={languagesMan}
                                        columns={columns}
                                        defaultSortDirection="asc"
                                        noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
                                        filter={filterFactory()}
                                        cellEdit={cellEditFactory({ mode: 'click' })}
                                        {...paginationTableProps} />
                                </div>
                            )
                        }
                    </PaginationProvider>
                    {/* Man selectionable section end */}

                    <div className="form-group">
                        <img id="img" src={fileState} alt="" style={{ width: '50%' }} />
                    </div>

                    <div className="form-group">
                        <label>{t('CULTOTYPE.IMAGE')} (*):  </label>
                        <TextValidator
                            type="file"
                            id="imagen"
                            className="form-control"
                            name="imagen"
                            accept=".jpeg, .jpg, .gif, .png"
                            value={cultotipo.imagen}
                            onChange={onChangeCultoTipo}
                        />
                    </div>
                    <div className="form-group">
                        <TextValidator
                            readOnly
                            onChange={() => { return }}
                            type="hidden"
                            name="filehidden"
                            value={fileState}
                            validators={['required']}
                            errorMessages={[t('CULTOTYPE.IMAGE_NOT_VALID')]}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('CULTOTYPE.DESCRIPTION')}:  </label>
                        <textarea
                            className="form-control"
                            value={cultotipo.descripcion}
                            name="descripcion"
                            onChange={onChangeCultoTipo}
                            rows="3" cols="80"
                        />
                    </div>

                    { /* Description selectionable section start */}
                    <PaginationProvider pagination={paginationFactory(paginationOptionDescription)}>
                        {
                            ({
                                paginationTableProps
                            }) => (
                                <div className="p-1">
                                    <BootstrapTable
                                        striped
                                        hover
                                        keyField='id'
                                        data={languagesDescription}
                                        columns={columns}
                                        defaultSortDirection="asc"
                                        noDataIndication={t('CULTOTYPE.CULTOTYPE_NO')}
                                        filter={filterFactory()}
                                        cellEdit={cellEditFactory({ mode: 'click' })}
                                        {...paginationTableProps} />
                                </div>
                            )
                        }
                    </PaginationProvider>
                    {/* Description selectionable section end */}

                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <p className="h4">{t('CULTOTYPE.QUESTIONS_AND_VALORATION_CRITERIA')}</p>
                        <div className="form-group">
                            <label>{t('CULTOTYPE.QUESTION_SELECT')}:  </label>
                            <Select name={"Pregunta"} isSearchable={true}
                                onChange={handleQuestion}
                                options={questions}
                            />
                        </div>
                        <div className="form-group">
                            <button className="btn btn-secondary mt-2" onClick={AddQuestionEmpty} disabled={!question.id}>
                                {t('CULTOTYPE.CRITERIA_ADD')}
                            </button>
                        </div>
                        <ul className="list-group">
                            {preguntasCriterio.map((pregunta, index) => {
                                return (
                                    <li className="list-group-item" id={"li_pregunta_" + index} key={index}>
                                        <p className="h5">{t('CULTOTYPE.QUESTION')}: {getValueMultiLanguage(pregunta)}</p>

                                        <label title={t('CULTOTYPE.MATHEMATIC_EXPRESSION')}>{t('CULTOTYPE.CRITERIA')}:  </label>
                                        <div className="input-group">
                                            <TextValidator
                                                type="text"
                                                title={t('CULTOTYPE.MATHEMATIC_EXPRESSION')}
                                                className="form-control"
                                                size="50"
                                                maxLength="255"
                                                value={pregunta.criterio}
                                                id={"pregunta_" + index}
                                                name={"pregunta_" + index}
                                                onChange={ChangeCriterio}
                                                validators={['required', 'maxStringLength:255', 'matchRegexp:^[<>=]+[0-9]+(\\.[0-9]+)?( *[|&] *[<>=]+[0-9]+(\\.[0-9]+)?)*$']}
                                                errorMessages={[t('CULTOTYPE.CRITERIA_EMPTY'), t('CULTOTYPE.CRITERIA_LIMIT_LENGTH'), t('CULTOTYPE.CRITERIA_SYMBOLS')]}
                                            />
                                            {pregunta.respuestas && pregunta.respuestas.length > 0 &&
                                                <div className="input-group-append">
                                                    <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true"
                                                        aria-expanded="false" title={t('CULTOTYPE.CRITERIA_SELECTION')}>{t('CULTOTYPE.RESPONSES')}</button>
                                                    <div className="dropdown-menu">
                                                        {pregunta.respuestas.map((respuesta, indexR) => {
                                                            return (
                                                                <a className="dropdown-item" href="/#" onClick={(e) => { e.preventDefault(); addResponseId2Criterio(index, respuesta.valor) }} key={index + '_' + indexR}>{respuesta.respuesta + ' (' + t('CULTOTYPE.VALUE') + ': ' + respuesta.valor + ')'}</a>
                                                            )
                                                        })
                                                        }
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                        <button className="btn btn-danger mt-2" onClick={() => DeleteQuestion(index)}>
                                            {t('CULTOTYPE.CRITERIA_DELETE')}
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                        {preguntasCriterio.length > 0 &&
                            <div className="form-group">
                                <div className="form-group">&nbsp;</div>
                                <div className="form-group">
                                    <label>{t('CULTOTYPE.QUESTION_SELECT')}: </label>
                                </div>
                                <div className="form-group">
                                    <Select name={"Pregunta"} isSearchable={true}
                                        onChange={handleQuestion}
                                        options={questions}
                                    />
                                    <button className="btn btn-secondary mt-2" onClick={AddQuestionEmpty}
                                        disabled={!question.id}>
                                        {t('CULTOTYPE.CRITERIA_ADD')}
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                    <div className="form-group">&nbsp;</div>
                    <div className="form-group">
                        <input type="submit" value={t('CULTOTYPE.CULTOTYPE_MODIFICATION_OF')}
                            className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};
