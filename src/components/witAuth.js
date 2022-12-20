/**
 * Comprobación del token y de los permisos del recurso actual para las llamadas a url seguras
 */

import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
const myInitObject = require('./config').myInitObject;

/**
 * Función que comprueba token y de los permisos del recurso actual para las llamadas a url seguras y devuelve el componente pasado como argumento con los datos de los permisos
 *
 * @param {*} ComponentToProtect componente a renderizar al final de la comprobación
 *
 * @return retorna un componente que renderiza el componente pasado como argumento
 */
export default function withAuth(ComponentToProtect) {
  return class extends Component {
    constructor() {
      super();
      this.state = {
        loading: true,
        redirect: false,
        userId: 0,
        token: '',
        administrador: false,
        roles: null,
        permisosAcciones: null
      };
    };

    componentDidMount() {

      fetch(myInitObject.crudServer + '/crud/checkToken', {
        method: 'GET',
        credentials: 'include'
      })
        .then(res => {
          if (res.status === 200) {
            res.text().then((data) => {
              let obj = JSON.parse(data);
              const permisosAcciones = {};
              // let currentUrl = '/' + window.location.href.replace(/^https?:\/\/.+?\//, '');
              if (obj.roles && obj.roles.rolesRecursosPermisos) {
                for (const rpp of obj.roles.rolesRecursosPermisos) {
                  if (permisosAcciones[rpp.Recursos.url] === undefined) {
                    permisosAcciones[rpp.Recursos.url] = {};
                  }
                  permisosAcciones[rpp.Recursos.url][rpp.Permisos.nombre] = true;
                }
              }
              this.setState({ loading: false, userId: obj.userId, token: obj.token, administrador: obj.administrador, roles: obj.roles, permisosAcciones });

            });
          } else {
            const error = new Error(res.error);
            throw error;
          }
        })
        .catch(err => {
          console.error(err);
          this.setState({ loading: false, redirect: true });
        });
    };

    render() {
      const { loading, redirect } = this.state;
      if (loading) {
        return null;
      }
      if (redirect) {
        return <Redirect to="/logout" />;
      }
      return (
        <React.Fragment>
          <ComponentToProtect {...this.props} userId={this.state.userId} token={this.state.token} administrador={this.state.administrador} roles={this.state.roles} permisosAcciones={this.state.permisosAcciones} />
        </React.Fragment>
      );
    };

  }
};
