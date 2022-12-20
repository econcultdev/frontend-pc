/**
 * Mantenimiento de Usuarios
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
import SelectValidator from './SelectValidator';
import Select from 'react-select';
import ModalAction from './ModalAction';
import withAuth from './witAuth';
import BackEnd from './BackEnd';

import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { withTranslation, useTranslation, Trans } from 'react-i18next';

import "react-datepicker/dist/react-datepicker.css";

import es from 'date-fns/locale/es';
registerLocale('es', es);

const myInitObject = require('./config').myInitObject;

class Usuarios extends Component {
    render() {
        const { t } = this.props;
        if (!this.props.administrador) {
            return <Redirect to="/backend" />;
        }
        return (
            <React.Fragment>
                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('USERS.USERS_MAITENANCE')}
                </div>
                <Switch>
                    <Route exact path="/usuarios" render={() => <UsuariosList {...this.props} />} />
                    <Route exact path="/usuarios/add" component={withAuth(UsuariosAdd)} />
                    <Route path="/usuarios/add/:id" component={withAuth(UsuariosAdd)} />
                    <Route path="/usuarios/edit/:id" component={withAuth(UsuariosEdit)} />
                    <Route path="/usuarios/delete/:id" component={withAuth(UsuariosDelete)} />
                </Switch>

            </React.Fragment>
        )
    }
};

export default withTranslation('global')(Usuarios);

const ListLinks = ({ history, action }) => {
    let ret = false;
    if (action !== 'list' && action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-2">
                        <UsuariosListLink history={history} />
                    </div>
                    <div className="col-md-2">
                        <UsuariosAddLink history={history} />
                    </div>
                </div>
            </div>
        );
    }
    if (action !== 'list') {
        ret = true;
        return (
            <div className="container">
                <UsuariosListLink history={history} />
            </div>
        );
    }
    if (action !== 'add') {
        ret = true;
        return (
            <div className="container">
                <UsuariosAddLink history={history} />
            </div>
        );
    }
    if (!ret) return '';
};

const UsuariosListLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/usuarios') }}>
            {t('USERS.USERS_LIST')}
        </button>
    );
};

const UsuariosAddLink = ({ history }) => {
    const [t] = useTranslation("global");
    return (
        <button className="btn btn-link" onClick={() => { history.push('/usuarios/add') }}>
            {t('USERS.USERS_ADD')}
        </button>
    );
};


const UsuariosList = ({ history }) => {
    const [usuarios, setUsuarios] = useState([]);
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
                    <div className="col-md-0"></div>
                    <div className="col-md-6">
                        <button className="btn btn-primary" onClick={() => { history.push('/usuarios/edit/' + row.row.id) }}>
                            {t('USERS.EDIT')}
                        </button>
                    </div>
                    <div className="col-md-6">
                        <button className="btn btn-danger" onClick={() => { clickDelete(row) }}>
                            {t('USERS.DELETE')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

    const nombreFormatter = (cell, row) => {
        return (
            <span>{row.apellidos + ", " + row.nombre + " (" + row.username + ")"}</span>
        )
    };

    const administradorFormatter = (cell, row) => {
        return (
            <span>{row.administrador && (t('USERS.YES') || t('USERS.NO'))}</span>
        )
    };

    const activoFormatter = (cell, row) => {
        return (
            <span>{row.validado && row.acepto_privacidad && (t('USERS.YES') || t('USERS.NO'))}</span>
        )
    };

    const columns = [
        {
            dataField: 'id',
            text: t('USERS.ID'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false
        },
        {
            dataField: 'nombre',
            text: t('USERS.USER'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false,
            formatter: nombreFormatter
        },
        {
            dataField: 'email',
            text: t('USERS.EMAIL'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            filter: textFilter(),
            editable: false
        },
        {
            dataField: 'administrador',
            text: t('USERS.ADMIN'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false,
            formatter: administradorFormatter
        },
        {
            dataField: 'validado',
            text: t('USERS.ACTIVE'),
            sort: true,
            headerAlign: 'center',
            align: 'center',
            editable: false,
            formatter: activoFormatter
        },
        {
            dataField: '',
            text: t('USERS.ACTIONS'),
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
            axios.get(myInitObject.crudServer + '/crud/usuarios',
                { withCredentials: true })
                .then(response => {
                    setUsuarios(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const paginationTotalRenderer = (from, to, size) => (
        <span className="react-bootstrap-table-pagination-total">
            <Trans i18nKey="USERS.PAGINATION_TOTAL">
                {t('USERS.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
            </Trans>
        </span>
    );

    const paginationOption = {
        data: usuarios,
        totalsize: usuarios.length,
        page: 1,
        custom: true,
        sizePerPage: myInitObject.pageSize,
        showTotal: true,
        hideSizePerPage: usuarios.length === 0,
        withFirstAndLast: true,
        firstPageText: t('USERS.FIRST_PAGE_TEXT'),
        firstPageTitle: t('USERS.FIRST_PAGE_TITLE'),
        prePageText: t('USERS.PRE_PAGE_TEXT'),
        prePageTitle: t('USERS.PRE_PAGE_TITLE'),
        nextPageText: t('USERS.NEXT_PAGE_TEXT'),
        nextPageTitle: t('USERS.NEXT_PAGE_TITLE'),
        lastPageText: t('USERS.LAST_PAGE_TEXT'),
        lastPageTitle: t('USERS.LAST_PAGE_TITLE'),
        paginationTotalRenderer
    };

    const defaultSorted = [{
        dataField: 'id',
        order: 'asc'
    }];

    const handleClose = () => {
        setIdDelete({});
        setShowDeleteConfirm(false);
    }
    const handleDelete = () => {
        history.push('/usuarios/delete/' + idDelete.id);
        setIdDelete({});
        setShowDeleteConfirm(false);
    };

    return (
        <div className="container">

            <Modal isOpen={showDeleteConfirm}>
                <ModalHeader>
                    {t('USERS.USER_DELETE')}
                </ModalHeader>
                <ModalBody>{t('USERS.USER_DELETE')}: {idDelete.nombre}!</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleClose}>{t('USERS.CLOSE')}</Button>
                    <button className='btn btn-primary' variant="primary" onClick={handleDelete}>
                        {t('USERS.DELETE')}
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
                                    data={usuarios}
                                    columns={columns}
                                    defaultSorted={defaultSorted}
                                    defaultSortDirection="asc"
                                    noDataIndication={t('USERS.USERS_NO')}
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




const UsuariosDelete = ({ history, match }) => {

    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/usuario/delete/' + match.params.id,
                { withCredentials: true })
                .then(history.push('/usuarios'))
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




const UsuariosAdd = ({ history, match }) => {
    const [Paises, setPaises] = useState([]);
    const [PaisId, setPaisId] = useState(0);
    const [Provincias, setProvincias] = useState([]);
    const [ProvinciaId, setProvinciaId] = useState(0);
    const [Ciudades, setCiudades] = useState([]);
    const [CiudadId, setCiudadId] = useState(0);
    const [NivelFormacion, setNivelFormacion] = useState([]);
    const [NivelFormacionId, setNivelFormacionId] = useState(0);
    const [Ingresos, setIngresos] = useState([]);
    const [IngresoId, setIngresoId] = useState(0);
    const [Languages, setLanguages] = useState([]);
    const [LanguageId, setLanguageId] = useState();
    const [CultoTipo, setCultoTipo] = useState([]);
    const [CultoTipoId, setCultoTipoId] = useState(0);
    const [Roles, setRoles] = useState([]);
    const [RolId, setRolId] = useState(0);
    const [Sexo, setSexo] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
    const [Usuario, setUsuario] = useState({
        username: '', password: '', nombre: '', apellidos: '', email: '',
        nombre_empresa: '', direccion: '', telefono: '', sexo: '', ocupacion: '', languageId: null,
        CP: '', administrador: false, acepto_privacidad: false, acepto_comercial: false, acepto_compartir: false,
        validado: false, NivelFormacionId: 0,
        PaisId: 0, ProvinciaId: 0, CiudadId: 0, IngresoId: 0, CultoTipoId: 0, RolId: 0, fecha_nacimiento: new Date().toISOString()
    });
    const [ok, setOk] = useState({ ok: 0, Usuario: '' });
    const [administrador, setAdministrador] = useState(false);
    const [aceptoprivacidad, setAceptoPrivacidad] = useState(false);
    const [aceptocompartir, setAceptoCompartir] = useState(false);
    const [aceptocomercial, setAceptoComercial] = useState(false);
    const [validado, setValidado] = useState(false);
    const [t] = useTranslation("global");

    useEffect(
        () => {
            const paisesPromise = axios.get(myInitObject.crudServer + '/crud/paises', { withCredentials: true });
            const provinciasPromise = axios.get(myInitObject.crudServer + '/crud/provincias', { withCredentials: true });
            const ciudadesPromise = axios.get(myInitObject.crudServer + '/crud/ciudades', { withCredentials: true });
            const nivelformacionPromise = axios.get(myInitObject.crudServer + '/crud/nivelformacion', { withCredentials: true });
            const ingresosPromise = axios.get(myInitObject.crudServer + '/crud/ingresos', { withCredentials: true });
            const cultotiposPromise = axios.get(myInitObject.crudServer + '/crud/cultotipos/minify', { withCredentials: true });
            const rolesPromise = axios.get(myInitObject.crudServer + '/crud/roles', { withCredentials: true });
            const languagesPromise = axios.get(myInitObject.crudServer + '/crud/language', { withCredentials: true });
            Promise.all([paisesPromise, provinciasPromise, ciudadesPromise, nivelformacionPromise,
                ingresosPromise, cultotiposPromise, rolesPromise, languagesPromise]).then((res) => {
                    setPaises(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setProvincias(res[1].data);
                    setCiudades(res[2].data);
                    setNivelFormacion(res[3].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setIngresos(res[4].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setCultoTipo(res[5].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setRoles(res[6].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setLanguages(res[7].data.map(element => { return { value: element.id, label: element.name } }));
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history, match]
    );

    const onChangeUsuario = ((e) => {
        setLanguageId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.LanguageId = e.value;
        setUsuario(obj);
    });
    const onChangePaisId = ((e) => {
        setPaisId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.PaisId = e.value;
        setUsuario(obj);
    });
    const onChangeProvinciaId = ((e) => {
        setProvinciaId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.ProvinciaId = e.value;
        setUsuario(obj);
    });
    const onChangeCiudadId = ((e) => {
        setCiudadId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.CiudadId = e.value;
        setUsuario(obj);
    });
    const onChangeIngresoId = ((e) => {
        setIngresoId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.IngresoId = e.value;
        setUsuario(obj);
    });
    const onChangeNivelFormacionId = ((e) => {
        setNivelFormacionId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.NivelFormacionId = e.value;
        setUsuario(obj);
    });
    const onChangeCultoTipoId = ((e) => {
        setCultoTipoId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.CultoTipoId = e.value;
        setUsuario(obj);
    });
    const onChangeRolId = ((e) => {
        setRolId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.RolId = e.value;
        setUsuario(obj);
    });
    const onChangeSexo = ((e) => {
        setSexo(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.sexo = e.value;
        setUsuario(obj);
    });
    const handleChangeFechaNacimiento = date => {
        setFechaNacimiento(date);
        let obj = JSON.parse(JSON.stringify(Usuario));
        obj.fecha_nacimiento = date.toISOString();
        setUsuario(obj);
    };

    const onChangeCheckboxAdministrador = ((e) => {
        setAdministrador(!administrador);
    });

    const onChangeCheckboxAceptoPrivacidad = ((e) => {
        setAceptoPrivacidad(!aceptoprivacidad);
    });

    const onChangeCheckboxAceptoCompartir = ((e) => {
        setAceptoCompartir(!aceptocompartir);
    });

    const onChangeCheckboxAceptoComercial = ((e) => {
        setAceptoComercial(!aceptocomercial);
    });

    const onChangeCheckboxValidado = ((e) => {
        setValidado(!validado);
    });

    const onSubmit = ((e) => {
        e.preventDefault();
        const obj = JSON.parse(JSON.stringify(Usuario));
        if (!obj.NivelFormacionId) {
            delete obj['NivelFormacionId'];
        }
        if (!obj.PaisId) {
            delete obj['PaisId'];
        }
        if (!obj.ProvinciaId) {
            delete obj['ProvinciaId'];
        }
        if (!obj.CiudadId) {
            delete obj['CiudadId'];
        }
        if (!obj.IngresoId) {
            delete obj['IngresoId'];
        }
        if (!obj.CultoTipoId) {
            delete obj['CultoTipoId'];
        }
        if (!obj.RolId) {
            delete obj['RolId'];
        }
        if (!obj.sexo) {
            obj.sexo = 'M';
        }
        if (!obj.LanguageId) {
            delete obj['LanguageId'];
        }
        obj.validado = validado;
        obj.acepto_privacidad = aceptoprivacidad;
        obj.acepto_comercial = aceptocomercial;
        obj.acepto_compartir = aceptocompartir;
        obj.administrador = administrador;
        axios.post(myInitObject.crudServer + '/crud/usuario/add', obj,
            { withCredentials: true })
            .then(res => {
                setOk({ ok: 1, Usuario: res.data.username });
                setTimeout(() => {
                    history.push('/usuarios/');
                }, 2000);
            }).catch(function (error) {
                setOk({ ok: -1, Usuario: obj.username });
            });
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="USERS.USER_REGISTRATION_OK_STRONG">
                        {t('USERS.USER_REGISTRATION_OK_STRONG', { user: ok.Usuario })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="USERS.USER_REGISTRATION_ERROR_STRONG">
                        {t('USERS.USER_REGISTRATION_ERROR_STRONG', { user: ok.Usuario })}
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
        setOk({ ok: 0, Usuario: ok.Usuario });
    };

    return (
        <div className="container">
            <ModalAction show={ok.ok === 1}
                header={t('USERS.USER_REGISTRATION')}
                body={t('USERS.USER_REGISTRATION_OK', { user: ok.Usuario })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('USERS.USER_REGISTRATION')}
                body={t('USERS.USER_REGISTRATION_ERROR', { user: ok.Usuario })}
                showModalActionClose={showModalActionClose} />
            <ListLinks history={history} action="add" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('USERS.USERS_ADD')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('USERS.NAME')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"nombre"}
                            className="form-control"
                            value={Usuario.nombre}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_NAME_EMPTY'),
                                    t('USERS.USER_NAME_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.SURNAME')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"apellidos"}
                            className="form-control"
                            value={Usuario.apellidos}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_SURNAME_EMPTY'),
                                    t('USERS.USER_SURNAME_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.USER')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"username"}
                            className="form-control"
                            value={Usuario.username}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_EMPTY'),
                                    t('USERS.USER_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.KEY')}:  </label>
                        <TextValidator
                            type="password"
                            name={"password"}
                            className="form-control"
                            value={Usuario.password}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_KEY_EMPTY'),
                                    t('USERS.USER_KEY_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.EMAIL')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"email"}
                            className="form-control"
                            value={Usuario.email}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_EMAIL_EMPTY'),
                                    t('USERS.USER_EMAIL_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.SEX')}:  </label>
                        <Select
                            name={"sexo"}
                            onChange={onChangeSexo}
                            options={myInitObject.sexo}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.USER_DATE_BORN')}:  </label>
                        <DatePicker id="fecha_nacimiento"
                            name="fecha_nacimiento"
                            selected={fechaNacimiento}
                            onChange={handleChangeFechaNacimiento}
                            dateFormat="dd-MM-yyyy"
                            maxDate={new Date()}
                            showYearDropdown
                            yearDropdownItemNumber={100}
                            scrollableYearDropdown
                            locale="es"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.ROLES')}:  </label>
                        <SelectValidator name={"RolId"} isSearchable={true} onChange={onChangeRolId}
                            value={Roles.filter(({ value }) => value === RolId)}
                            options={Roles}
                        />
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="administrador"
                            id="administrador"
                            onChange={onChangeCheckboxAdministrador}
                        />
                        <label className="form-check-label" htmlFor="administrador">{t('USERS.ADMIN')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="acepto_privacidad"
                            id="acepto_privacidad"
                            onChange={onChangeCheckboxAceptoPrivacidad}
                        />
                        <label className="form-check-label" htmlFor="acepto_privacidad">{t('USERS.PRIVACY_ACCEPT')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="acepto_comercial"
                            id="acepto_comercial"
                            onChange={onChangeCheckboxAceptoComercial}
                        />
                        <label className="form-check-label" htmlFor="acepto_comercial">{t('USERS.COMERCIAL_ACCEPT')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="acepto_compartir"
                            id="acepto_compartir"
                            onChange={onChangeCheckboxAceptoCompartir}
                        />
                        <label className="form-check-label" htmlFor="acepto_compartir">{t('USERS.SHARE_ACCEPT')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="validado"
                            id="validado"
                            onChange={onChangeCheckboxValidado}
                        />
                        <label className="form-check-label" htmlFor="validado">{t('USERS.VALIDATE')}: </label>
                    </div>
                    <div className="form-group pt-4">
                        <label>{t('USERS.COUNTRIES')}:  </label>
                        <SelectValidator name={"PaisId"} isSearchable={true} onChange={onChangePaisId}
                            value={Paises.filter(({ value }) => value === PaisId)}
                            options={Paises}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.PROVINCE')}:  </label>
                        <SelectValidator name={"ProvinciaId"} isSearchable={true}
                            onChange={onChangeProvinciaId}
                            value={Provincias.filter(({ id }) => id === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={PaisId > 0 && (Provincias.filter((provincia) => provincia.PaisId === PaisId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.CITIES')}:  </label>
                        <SelectValidator name={"CiudadId"} isSearchable={true}
                            onChange={onChangeCiudadId}
                            value={Ciudades.filter(({ id }) => id === CiudadId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={ProvinciaId > 0 && (Ciudades.filter((ciudad) => ciudad.ProvinciaId === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.ADDRESS')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="direccion"
                            onChange={onChangeUsuario}
                            value={Usuario.direccion}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.POSTAL_CODE')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="CP"
                            onChange={onChangeUsuario}
                            value={Usuario.CP}
                            size="10"
                            maxLength="10"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.PHONE')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="telefono"
                            onChange={onChangeUsuario}
                            value={Usuario.telefono}
                            size="20"
                            maxLength="20"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.OCCUPATION')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="ocupacion"
                            onChange={onChangeUsuario}
                            value={Usuario.ocupacion}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.COMPANY_NAME')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="nombre_empresa"
                            onChange={onChangeUsuario}
                            value={Usuario.nombre_empresa}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.MOTHER_LANGUAGE')}:  </label>
                        <SelectValidator name={"LanguageId"} isSearchable={true} onChange={onChangeUsuario}
                            value={Languages.filter(({ value }) => value === LanguageId)}
                            options={Languages}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.INCOMES')}:  </label>
                        <SelectValidator name={"IngresoId"} isSearchable={true} onChange={onChangeIngresoId}
                            value={Ingresos.filter(({ value }) => value === IngresoId)}
                            options={Ingresos}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.FORMATION_LEVEL')}:  </label>
                        <SelectValidator name={"NivelFormacionId"} isSearchable={true} onChange={onChangeNivelFormacionId}
                            value={NivelFormacion.filter(({ value }) => value === NivelFormacionId)}
                            options={NivelFormacion}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.CULTOTYPE')}:  </label>
                        <SelectValidator name={"CultoTipoId"} isSearchable={true} onChange={onChangeCultoTipoId}
                            value={CultoTipo.filter(({ value }) => value === CultoTipoId)}
                            options={CultoTipo}
                        />
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('USERS.USER_REGISTER')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};




const UsuariosEdit = ({ history, match }) => {
    const [Paises, setPaises] = useState([]);
    const [PaisId, setPaisId] = useState(0);
    const [Provincias, setProvincias] = useState([]);
    const [ProvinciaId, setProvinciaId] = useState(0);
    const [Ciudades, setCiudades] = useState([]);
    const [CiudadId, setCiudadId] = useState(0);
    const [NivelFormacion, setNivelFormacion] = useState([]);
    const [NivelFormacionId, setNivelFormacionId] = useState(0);
    const [Ingresos, setIngresos] = useState([]);
    const [IngresoId, setIngresoId] = useState(0);
    const [Languages, setLanguages] = useState([]);
    const [LanguageId, setLanguageId] = useState(0);
    const [CultoTipo, setCultoTipo] = useState([]);
    const [CultoTipoId, setCultoTipoId] = useState(0);
    const [Roles, setRoles] = useState([]);
    const [RolId, setRolId] = useState(0);
    const [Sexo, setSexo] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
    const [Usuario, setUsuario] = useState({
        username: '', password: '', nombre: '', apellidos: '', email: '',
        nombre_empresa: '', direccion: '', telefono: '', sexo: '', ocupacion: '', LanguageId: null,
        CP: '', administrador: false, acepto_privacidad: false, acepto_comercial: false, acepto_compartir: false,
        validado: false, NivelFormacionId: 0,
        PaisId: 0, ProvinciaId: 0, CiudadId: 0, IngresoId: 0, CultoTipoId: 0, RolId: 0, fecha_nacimiento: new Date().toISOString()
    });
    const [ok, setOk] = useState({ ok: 0, Usuario: '' });
    const [administrador, setAdministrador] = useState(false);
    const [aceptoprivacidad, setAceptoPrivacidad] = useState(false);
    const [aceptocompartir, setAceptoCompartir] = useState(false);
    const [aceptocomercial, setAceptoComercial] = useState(false);
    const [validado, setValidado] = useState(false);
    const [t] = useTranslation("global");

    useEffect(
        () => {
            const paisesPromise = axios.get(myInitObject.crudServer + '/crud/paises', { withCredentials: true });
            const provinciasPromise = axios.get(myInitObject.crudServer + '/crud/provincias', { withCredentials: true });
            const ciudadesPromise = axios.get(myInitObject.crudServer + '/crud/ciudades', { withCredentials: true });
            const nivelformacionPromise = axios.get(myInitObject.crudServer + '/crud/nivelformacion', { withCredentials: true });
            const ingresosPromise = axios.get(myInitObject.crudServer + '/crud/ingresos', { withCredentials: true });
            const cultotiposPromise = axios.get(myInitObject.crudServer + '/crud/cultotipos/minify', { withCredentials: true });
            const rolesPromise = axios.get(myInitObject.crudServer + '/crud/roles', { withCredentials: true });
            const languagesPromise = axios.get(myInitObject.crudServer + '/crud/language', { withCredentials: true });
            Promise.all([paisesPromise, provinciasPromise, ciudadesPromise, nivelformacionPromise,
                ingresosPromise, cultotiposPromise, rolesPromise, languagesPromise]).then((res) => {
                    setPaises(res[0].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setProvincias(res[1].data);
                    setCiudades(res[2].data);
                    setNivelFormacion(res[3].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setIngresos(res[4].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setCultoTipo(res[5].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setRoles(res[6].data.map(element => { return { value: element.id, label: element.nombre } }));
                    setLanguages(res[7].data.map(element => { return { value: element.id, label: element.name } }));
                })
                .catch(function (error) {
                    console.error(error);
                });

            axios.get(myInitObject.crudServer + '/crud/usuario/edit/' + match.params.id,
                { withCredentials: true })
                .then(response => {
                    setPaisId(response.data.PaisId);
                    setProvinciaId(response.data.ProvinciaId);
                    setCiudadId(response.data.CiudadId);
                    setSexo(response.data.sexo);
                    setFechaNacimiento(new Date(response.data.fecha_nacimiento));
                    setNivelFormacionId(response.data.NivelFormacionId);
                    setIngresoId(response.data.IngresoId);
                    setCultoTipoId(response.data.CultoTipoId);
                    setRolId(response.data.RolId);
                    setLanguageId(response.data.LanguageId);
                    response.data.password = '';
                    setValidado(response.data.validado);
                    setAdministrador(response.data.administrador);
                    setAceptoPrivacidad(response.data.acepto_privacidad);
                    setAceptoComercial(response.data.acepto_comercial);
                    setAceptoCompartir(response.data.acepto_compartir);
                    ['direccion', 'CP', 'telefono', 'ocupacion', 'nombre_empresa'].forEach((el) => {
                        if (response.data[el] === null) {
                            response.data[el] = '';
                        }
                    });
                    setUsuario(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        [history, match]
    );

    const onChangeUsuario = ((e) => {
        setLanguageId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.LanguageId = e.value;
        setUsuario(obj);
    });
    const onChangePaisId = ((e) => {
        setPaisId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.PaisId = e.value;
        setUsuario(obj);
    });
    const onChangeProvinciaId = ((e) => {
        setProvinciaId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.ProvinciaId = e.value;
        setUsuario(obj);
    });
    const onChangeCiudadId = ((e) => {
        setCiudadId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.CiudadId = e.value;
        setUsuario(obj);
    });
    const onChangeIngresoId = ((e) => {
        setIngresoId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.IngresoId = e.value;
        setUsuario(obj);
    });
    const onChangeNivelFormacionId = ((e) => {
        setNivelFormacionId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.NivelFormacionId = e.value;
        setUsuario(obj);
    });
    const onChangeCultoTipoId = ((e) => {
        setCultoTipoId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.CultoTipoId = e.value;
        setUsuario(obj);
    });
    const onChangeRolId = ((e) => {
        setRolId(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.RolId = e.value;
        setUsuario(obj);
    });
    const onChangeSexo = ((e) => {
        setSexo(e.value);
        const obj = JSON.parse(JSON.stringify(Usuario));
        obj.sexo = e.value;
        setUsuario(obj);
    });
    const handleChangeFechaNacimiento = date => {
        setFechaNacimiento(date);
        let obj = JSON.parse(JSON.stringify(Usuario));
        obj.fecha_nacimiento = date.toISOString();
        setUsuario(obj);
    };

    const onChangeCheckboxAdministrador = ((e) => {
        setAdministrador(!administrador);
    });

    const onChangeCheckboxAceptoPrivacidad = ((e) => {
        setAceptoPrivacidad(!aceptoprivacidad);
    });

    const onChangeCheckboxAceptoCompartir = ((e) => {
        setAceptoCompartir(!aceptocompartir);
    });

    const onChangeCheckboxAceptoComercial = ((e) => {
        setAceptoComercial(!aceptocomercial);
    });

    const onChangeCheckboxValidado = ((e) => {
        setValidado(!validado);
    });


    const onSubmit = ((e) => {
        e.preventDefault();
        const obj = JSON.parse(JSON.stringify(Usuario));
        if (!obj.NivelFormacionId) {
            delete obj['NivelFormacionId'];
        }
        if (!obj.PaisId) {
            delete obj['PaisId'];
        }
        if (!obj.ProvinciaId) {
            delete obj['ProvinciaId'];
        }
        if (!obj.CiudadId) {
            delete obj['CiudadId'];
        }
        if (!obj.IngresoId) {
            delete obj['IngresoId'];
        }
        if (!obj.CultoTipoId) {
            delete obj['CultoTipoId'];
        }
        if (!obj.RolId) {
            delete obj['RolId'];
        }
        if (!obj.sexo) {
            obj.sexo = 'M';
        }
        if (!obj.LanguageId) {
            delete obj['LanguageId'];
        }
        obj.validado = validado;
        obj.acepto_privacidad = aceptoprivacidad;
        obj.acepto_comercial = aceptocomercial;
        obj.acepto_compartir = aceptocompartir;
        obj.administrador = administrador;
        if (obj.password === '') delete obj.password;
        axios.post(myInitObject.crudServer + '/crud/usuario/update', obj,
            { withCredentials: true })
            .then(res => {
                setOk({ ok: 1, Usuario: res.data.nombre });
                setTimeout(() => {
                    history.push('/usuarios/');
                }, 2000);
            }).catch(function (error) {
                setOk({ ok: -1, Usuario: obj.nombre });
            });
    });

    const showOk = () => {
        if (ok.ok > 0) {
            return (
                <div>
                    <Trans i18nKey="USERS.USER_MODIFY_OK_STRONG">
                        {t('USERS.USER_MODIFY_OK_STRONG', { user: ok.Usuario })}
                    </Trans>
                </div>
            );
        } else if (ok.ok === -1) {
            return (
                <div>
                    <Trans i18nKey="USERS.USER_MODIFY_ERROR_STRONG">
                        {t('USERS.USER_MODIFY_ERROR_STRONG', { user: ok.Usuario })}
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
        setOk({ ok: 2, Usuario: ok.Usuario });
    };

    return (
        <div className="container">

            <ModalAction show={ok.ok === 1}
                header={t('USERS.USERS_MODIFICATION')}
                body={t('USERS.USER_MODIFY_OK', { user: ok.Usuario })}
                showModalActionClose={showModalActionClose} />
            <ModalAction show={ok.ok === -1}
                header={t('USERS.USERS_MODIFICATION')}
                body={t('USERS.USER_MODIFY_ERROR', { user: ok.Usuario })}
                showModalActionClose={showModalActionClose} />

            <ListLinks history={history} action="edit" />
            <div className="container" style={{ marginTop: 10 }}>
                <h3>{t('USERS.USERS_EDIT')}</h3>
                <ValidatorForm onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>{t('USERS.NAME')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"nombre"}
                            className="form-control"
                            value={Usuario.nombre}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_NAME_EMPTY'),
                                    t('USERS.USER_NAME_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.SURNAME')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"apellidos"}
                            className="form-control"
                            value={Usuario.apellidos}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={['apellidos vacío', 'Los apellidos no pueden exceder los 255 caracteres']}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.USER')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"username"}
                            className="form-control"
                            value={Usuario.username}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_SURNAME_EMPTY'),
                                    t('USERS.USER_SURNAME_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.KEY')}:  </label>
                        <TextValidator
                            type="password"
                            name={"password"}
                            className="form-control"
                            value={Usuario.password}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.EMAIL')} (*):  </label>
                        <TextValidator
                            type="text"
                            name={"email"}
                            className="form-control"
                            value={Usuario.email}
                            onChange={onChangeUsuario}
                            size="100"
                            maxLength="255"
                            validators={['required', 'maxStringLength:255']}
                            errorMessages={
                                [
                                    t('USERS.USER_EMAIL_EMPTY'),
                                    t('USERS.USER_EMAIL_LIMIT_LENGTH')
                                ]
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.SEX')}:  </label>
                        <Select
                            name={"telefono"}
                            onChange={onChangeSexo}
                            value={myInitObject.sexo.filter(({ value }) => value === Sexo)}
                            options={myInitObject.sexo}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.USER_DATE_BORN')}:  </label>
                        <DatePicker id="fecha_nacimiento"
                            name="fecha_nacimiento"
                            selected={fechaNacimiento}
                            onChange={handleChangeFechaNacimiento}
                            dateFormat="dd-MM-yyyy"
                            maxDate={new Date()}
                            showYearDropdown
                            yearDropdownItemNumber={100}
                            scrollableYearDropdown
                            locale="es"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.ROLES')}:  </label>
                        <SelectValidator name={"RolId"} isSearchable={true} onChange={onChangeRolId}
                            value={Roles.filter(({ value }) => value === RolId)}
                            options={Roles}
                        />
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="administrador"
                            id="administrador"
                            onChange={onChangeCheckboxAdministrador}
                            checked={administrador === null ? false : administrador}
                        />
                        <label className="form-check-label" htmlFor="administrador">{t('USERS.ADMIN')}:  </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="acepto_privacidad"
                            id="acepto_privacidad"
                            onChange={onChangeCheckboxAceptoPrivacidad}
                            checked={aceptoprivacidad === null ? false : aceptoprivacidad}
                        />
                        <label className="form-check-label" htmlFor="acepto_privacidad">{t('USERS.PRIVACY_ACCEPT')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="acepto_comercial"
                            id="acepto_comercial"
                            onChange={onChangeCheckboxAceptoComercial}
                            checked={aceptocomercial === null ? false : aceptocomercial}
                        />
                        <label className="form-check-label" htmlFor="acepto_comercial">{t('USERS.COMERCIAL_ACCEPT')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="acepto_compartir"
                            id="acepto_compartir"
                            onChange={onChangeCheckboxAceptoCompartir}
                            checked={aceptocompartir === null ? false : aceptocompartir}
                        />
                        <label className="form-check-label" htmlFor="acepto_compartir">{t('USERS.SHARE_ACCEPT')}: </label>
                    </div>
                    <div className="form-check pt-2">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="validado"
                            id="validado"
                            onChange={onChangeCheckboxValidado}
                            checked={validado === null ? false : validado}
                        />
                        <label className="form-check-label" htmlFor="validado">{t('USERS.VALIDATE')}:  </label>
                    </div>
                    <div className="form-group pt-4">
                        <label>{t('USERS.COUNTRIES')}:  </label>
                        <SelectValidator name={"PaisId"} isSearchable={true} onChange={onChangePaisId}
                            value={Paises.filter(({ value }) => value === PaisId)}
                            options={Paises}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.PROVINCE')}:  </label>
                        <SelectValidator name={"ProvinciaId"} isSearchable={true}
                            onChange={onChangeProvinciaId}
                            value={Provincias.filter(({ id }) => id === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={PaisId > 0 && (Provincias.filter((provincia) => provincia.PaisId === PaisId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.CITIES')}:  </label>
                        <SelectValidator name={"CiudadId"} isSearchable={true}
                            onChange={onChangeCiudadId}
                            value={Ciudades.filter(({ id }) => id === CiudadId).map(element => { return { value: element.id, label: element.nombre } })}
                            options={ProvinciaId > 0 && (Ciudades.filter((ciudad) => ciudad.ProvinciaId === ProvinciaId).map(element => { return { value: element.id, label: element.nombre } }) || [])}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.ADDRESS')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="direccion"
                            onChange={onChangeUsuario}
                            value={Usuario.direccion}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.POSTAL_CODE')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="CP"
                            onChange={onChangeUsuario}
                            value={Usuario.CP}
                            size="10"
                            maxLength="10"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.PHONE')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="telefono"
                            onChange={onChangeUsuario}
                            value={Usuario.telefono}
                            size="20"
                            maxLength="20"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.OCCUPATION')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="ocupacion"
                            onChange={onChangeUsuario}
                            value={Usuario.ocupacion}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.COMPANY_NAME')}:  </label>
                        <input
                            type="text"
                            className="form-control"
                            name="nombre_empresa"
                            onChange={onChangeUsuario}
                            value={Usuario.nombre_empresa}
                            size="100"
                            maxLength="255"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.MOTHER_LANGUAGE')}:  </label>
                        <SelectValidator name={"LanguageId"} isSearchable={true} onChange={onChangeUsuario}
                            value={Languages.filter(({ value }) => value === LanguageId)}
                            options={Languages}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.INCOMES')}:  </label>
                        <SelectValidator name={"IngresoId"} isSearchable={true} onChange={onChangeIngresoId}
                            value={Ingresos.filter(({ value }) => value === IngresoId)}
                            options={Ingresos}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.FORMATION_LEVEL')}:  </label>
                        <SelectValidator name={"NivelFormacionId"} isSearchable={true} onChange={onChangeNivelFormacionId}
                            value={NivelFormacion.filter(({ value }) => value === NivelFormacionId)}
                            options={NivelFormacion}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('USERS.CULTOTYPE')}:  </label>
                        <SelectValidator name={"CultoTipoId"} isSearchable={true} onChange={onChangeCultoTipoId}
                            value={CultoTipo.filter(({ value }) => value === CultoTipoId)}
                            options={CultoTipo}
                        />
                    </div>
                    <div className="form-group">
                        <input type="submit" value={t('USERS.USERS_MODIFY')} className="btn btn-primary" />
                    </div>
                    {showOk()}
                </ValidatorForm>
            </div>
        </div>
    );
};
