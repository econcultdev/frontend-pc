/**
 * Mantenimiento de Roles
 */

import React, { Component, useState, useEffect } from 'react';
import { BrowserRouter as Switch, Route } from "react-router-dom";
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import ModalAction from './ModalAction';
import BackEnd from './BackEnd';
import { withTranslation, useTranslation } from 'react-i18next';

const myInitObject = require('./config').myInitObject;

class Roles extends Component {
  render() {
    const { t } = this.props;
    if (!this.props.administrador) {
      return <Redirect to="/backend" />;
    }
    return (
      <React.Fragment>
        <BackEnd {...this.props} />
        <div className="h3 p-4">
          {t('ROLES.ROLES_MAITENANCE')}
        </div>
        <Switch>
          <Route exact path="/dg_roles" render={() => <RolesList {...this.props} />} />
        </Switch>

      </React.Fragment>
    )
  }
};

export default withTranslation('global')(Roles);

const RolesList = ({ history, match }) => {

  const [Roles, setRoles] = useState([]);
  const [Recursos, setRecursos] = useState([]);
  const [Permisos, setPermisos] = useState([]);
  const [RolesRecursosPermisos, setRolesRecursosPermisos] = useState([]);
  const [RolesRecursosPermisosHash, setRolesRecursosPermisosHash] = useState({});
  const [ok, setOk] = useState({ ok: 0, Rol: '' });
  const [showCrear, setShowCrear] = useState({ rol: false, recurso: false, permiso: false });
  const [Rol, setRol] = useState('');
  const [Recurso, setRecurso] = useState({ nombre: '', url: '' });
  const [Permiso, setPermiso] = useState('');
  const [t] = useTranslation("global");

  useEffect(
    () => {
      const rolesPromise = axios.get(myInitObject.crudServer + '/crud/roles', { withCredentials: true });
      const recursosPromise = axios.get(myInitObject.crudServer + '/crud/recursos', { withCredentials: true });
      const permisosPromise = axios.get(myInitObject.crudServer + '/crud/permisos', { withCredentials: true });
      const rrpPromise = axios.get(myInitObject.crudServer + '/crud/rolesrecursospermisos', { withCredentials: true });
      Promise.all([rolesPromise, recursosPromise, permisosPromise, rrpPromise]).then((res) => {
        setRoles(res[0].data);
        setRecursos(res[1].data);
        setPermisos(res[2].data);
        setRolesRecursosPermisos(res[3].data);
        const rolesRecursosPermisosHash = {};
        for (const data of res[3].data) {
          rolesRecursosPermisosHash[data.RolId + '_' + data.RecursoId + '_' + data.PermisoId] = true;
        }
        setRolesRecursosPermisosHash(rolesRecursosPermisosHash);
      })
        .catch(function (error) {
          console.error(error);
        });
    },
    [history, match]
  );

  const onChangeRRPermiso = ((e) => {
    const obj = JSON.parse(JSON.stringify(RolesRecursosPermisosHash));
    obj[e.target.id.replace('permiso_', '')] = e.target.checked;
    setRolesRecursosPermisosHash(obj);
  });

  const getPermiso = ((value) => {
    let rolePermiso = RolesRecursosPermisosHash[value];
    return rolePermiso === undefined ? false : rolePermiso;
  });

  const modifyRecurso = ((id) => {
    axios.post(myInitObject.crudServer + '/crud/rolesrecursospermisos/update/' + id, RolesRecursosPermisosHash,
      { withCredentials: true })
      .then(res => {
        setOk({ ok: 1, Rol: Roles.filter(el => el.id === id)[0].nombre });
      }
      ).catch(function (error) {
        setOk({ ok: -1, Rol: Roles.filter(el => el.id === id)[0].nombre });
      });
  });

  const showModalActionClose = () => {
    setOk({ ok: 2, Rol: ok.Rol });
  };

  const crearRol = () => {
    setShowCrear({ rol: true, recurso: false, permiso: false });
  };

  const crearRecurso = () => {
    setShowCrear({ rol: false, recurso: true, permiso: false });
  };

  const crearPermiso = () => {
    setShowCrear({ rol: false, recurso: false, permiso: true });
  };

  const handleClose = () => {
    setShowCrear({ rol: false, recurso: false, permiso: false });
  };

  const onChangeRol = (e) => {
    setRol(e.target.value);
  };

  const onChangeRecurso = (e) => {
    let obj = JSON.parse(JSON.stringify(Recurso));
    obj[e.target.name] = e.target.value;
    setRecurso(obj);
  };

  const onChangePermiso = (e) => {
    setPermiso(e.target.value);
  };

  const handleCrearRol = (e) => {
    e.preventDefault();
    axios.post(myInitObject.crudServer + '/crud/role/add/', { nombre: Rol },
      { withCredentials: true })
      .then(res => {
        const obj = JSON.parse(JSON.stringify(Roles));
        obj.push(res.data);
        setRoles(obj);
      }
      ).catch(function (error) {
      });
  }

  const handleCrearRecurso = (e) => {
    e.preventDefault();
    axios.post(myInitObject.crudServer + '/crud/recurso/add/', { nombre: Recurso.nombre, url: Recurso.url },
      { withCredentials: true })
      .then(res => {
        const obj = JSON.parse(JSON.stringify(Recursos));
        obj.push(res.data);
        setRecursos(obj);
      }
      ).catch(function (error) {
      });
  }

  const handleCrearPermiso = (e) => {
    e.preventDefault();
    axios.post(myInitObject.crudServer + '/crud/permiso/add/', { nombre: Permiso },
      { withCredentials: true })
      .then(res => {
        const obj = JSON.parse(JSON.stringify(Permisos));
        obj.push(res.data);
        setPermisos(obj);
      }
      ).catch(function (error) {
      });
  }

  return (
    <div className="container">

      <Modal isOpen={showCrear.rol}>
        <ModalHeader>
          {t('ROLES.ROL_CREATE')}
        </ModalHeader>
        <ModalBody>
          <div>
            {t('ROLES.ROL')}: </div>
          <div><input type="text" onChange={onChangeRol} size="20" maxLength="100"></input></div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={handleClose}>{t('ROLES.CLOSE')}</Button>
          <button className='btn btn-primary' variant="primary" onClick={handleCrearRol}>
            {t('ROLES.CREATE')}
          </button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showCrear.recurso}>
        <ModalHeader>
          {t('ROLES.RESOURCE_CREATE')}
        </ModalHeader>
        <ModalBody>
          <div>{t('ROLES.RESOURCE')}: </div>
          <div><input type="text" onChange={onChangeRecurso} name="nombre" size="20" maxLength="100"></input></div>
          <div>{t('ROLES.URL')}: </div>
          <div><input type="text" onChange={onChangeRecurso} size="20" name="url" maxLength="100"></input></div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={handleClose}>{t('ROLES.CLOSE')}</Button>
          <button className='btn btn-primary' variant="primary" onClick={handleCrearRecurso}>
            {t('ROLES.CREATE')}
          </button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showCrear.permiso}>
        <ModalHeader>
          {t('ROLES.PERMISSION_CREATE')}
        </ModalHeader>
        <ModalBody>
          <div>
            {t('ROLES.PERMISSION')}:
          </div>
          <div><input type="text" onChange={onChangePermiso} size="20" maxLength="100"></input></div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onClick={handleClose}>{t('ROLES.CLOSE')}</Button>
          <button className='btn btn-primary' variant="primary" onClick={handleCrearPermiso}>
            {t('ROLES.CREATE')}
          </button>
        </ModalFooter>
      </Modal>

      <ModalAction show={ok.ok === 1}
        header={t('ROLES.ROLES_REGISTRATION')}
        body={t('ROLES.ROLES_REGISTRATION_OK', { rol: ok.Rol })}
        showModalActionClose={showModalActionClose} />
      <ModalAction show={ok.ok === -1}
        header={t('ROLES.ROLES_REGISTRATION')}
        body={t('ROLES.ROLES_REGISTRATION_ERROR', { rol: ok.Rol })}
        showModalActionClose={showModalActionClose} />

      <div className="container">
        <div className="container">
          <div className="d-inline">
            <button className="btn btn-secondary" onClick={(e) => { e.preventDefault(); crearRol() }}>
              {t('ROLES.ROL_CREATE')}
            </button>
          </div>
          <div className="d-inline pl-3">
            <button className="btn btn-secondary" onClick={(e) => { e.preventDefault(); crearRecurso() }}>
              {t('ROLES.RESOURCE_CREATE')}
            </button>
          </div>
          <div className="d-inline pl-3">
            <button className="btn btn-secondary" onClick={(e) => { e.preventDefault(); crearPermiso() }}>
              {t('ROLES.PERMISSION_CREATE')}
            </button>
          </div>
        </div>
        {
          Roles.map((rol, indexR) => {
            return (
              <div className="container pt-4" key={indexR}>
                <div className="pb-2 text-center"><h4>{rol.nombre}</h4></div>
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>{t('ROLES.RESOURCE')}</th>
                        {
                          Permisos.map((permiso, indexP) => {
                            return (
                              <th key={indexP}>{permiso.nombre}</th>
                            )
                          })
                        }
                      </tr>
                    </thead>
                    <tbody>
                      {
                        Recursos.map((recurso, indexC) => {
                          return (
                            <tr key={indexC}>
                              <td>{recurso.nombre}</td>
                              {
                                Permisos.map((permiso, indexCP) => {
                                  return (
                                    <td key={indexCP}>
                                      <input type="checkbox"
                                        id={'permiso_' + rol.id + '_' + recurso.id + '_' + permiso.id}
                                        onChange={onChangeRRPermiso}
                                        checked={getPermiso(rol.id + '_' + recurso.id + '_' + permiso.id)}
                                      // checked={RolesRecursosPermisosHash[rol.id + '_' + recurso.id + '_' + permiso.id]}
                                      >
                                      </input>
                                    </td>
                                  )
                                })
                              }
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                  <div>
                    <button className="btn btn-primary" onClick={(e) => { e.preventDefault(); modifyRecurso(rol.id) }}>
                      {t('ROLES.MODIFY')} {rol.nombre}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  );
}