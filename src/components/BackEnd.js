import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery/dist/jquery.slim.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { withTranslation } from 'react-i18next';


/**
 * Comprueba que la url actual es la ruta pasada para devolver el nombre de la clase css
 *
 * @param {*} ruta url a comprobar
 * @param {*} exact comprobación exacta
 *
 * @return activa si se corresponde o vacío
 */
const navActive = ((ruta, exact) => {
  if (exact) {
    if (ruta === window.location.pathname)
      return " active";
  } else {
    let reg = new RegExp("^" + ruta);
    if (reg.test(window.location.pathname))
      return " active";
  }
  return "";
});


/**
 * Muestra el enlace a un recurso si se tiene permiso
 *
 * @param {*} props propiedades del componente que llama a la función
 * @param {*} ruta url a comprobar
 * @param {*} label etiqueta a mostrar en el enlace
 * @param {*} exact comprobación exacta de la ruta
 * @param {*} className clase de css a mostrar
 *
 * @return enlace al recurso o vacío
 */
const renderLink = ((props, ruta, label, exact, className) => {
  if (!className) {
    className = 'dropdown-item';
  }
  switch (ruta) {
    case '/dg_paises':
    case '/dg_provincias':
    case '/dg_ciudades':
    case '/dg_ingresos':
    case '/dg_nivelformacion':
    case '/dg_roles':
    case '/dg_tipopregunta':
    case '/dg_textolegal':
    case '/typelegaltext':
    case '/dg_language':
    case '/cultotipo':
    case '/cultotipo_pregunta':
    case '/usuarios':
      if (props.administrador) {
        return (<Link to={ruta} className={className + navActive(ruta, exact) + ""}>{label}</Link>);
      }
      break;
    default:
      let ok = false;
      if (props.administrador) {
        ok = true;
      } else {
        const roles = props.roles;
        if (roles && roles.rolesRecursosPermisos) {
          for (const rrp of roles.rolesRecursosPermisos) {
            if (ruta === rrp.Recursos.url) {
              ok = true;
              break;
            }
          }
        }
      }
      if (ok) {
        return (<Link to={ruta} className={className + navActive(ruta, exact) + ""}>{label}</Link>);
      } else {
        return '';
      }
  }
});

/**
 * Componente que renderiza el menú superior del backend con los enlaces a los recursos
 */
class BackEnd extends Component {
  render() {
    const { t } = this.props;
    return (
      <Router forceRefresh={true}>
        <div className="container">
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav mr-auto">
                {this.props.administrador &&
                  <li className={"nav-item dropdown " + navActive("/dg_") + ""}>
                    <a className="nav-link dropdown-toggle" href="/#" id="navbarDropdown" role="button" data-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false" title={t('BACKEND.GENERAL_DATA_ADMIN')}>
                      {t('BACKEND.GENERAL_DATA')}
                    </a>
                    <div className="dropdown-menu" role="menu" aria-labelledby="navbarDropdown">
                      {renderLink(this.props, '/dg_paises', t('BACKEND.COUNTRIES'))}
                      {renderLink(this.props, '/dg_provincias', t('BACKEND.PROVINCES'))}
                      {renderLink(this.props, '/dg_ciudades', t('BACKEND.CITIES'))}
                      {renderLink(this.props, '/dg_ingresos', t('BACKEND.INCOMES'))}
                      {renderLink(this.props, '/dg_nivelformacion', t('BACKEND.EDUCATION_LEVEL'))}
                      {renderLink(this.props, '/dg_roles', t('BACKEND.ROLES'))}
                      {renderLink(this.props, '/dg_tipopregunta', t('BACKEND.QUESTION_TYPE'))}
                      {renderLink(this.props, '/dg_textolegal', t('BACKEND.LEGAL_TEXT'))}
                      {renderLink(this.props, '/typelegaltext', t('BACKEND.TYPE_LEGAL_TEXT'))}
                      {renderLink(this.props, '/dg_language', t('BACKEND.LANGUAGE'))}
                    </div>
                  </li>
                }
                {this.props.administrador &&
                  <li className={"nav-item dropdown " + navActive("/cultotipo") + ""}>
                    <a className="nav-link dropdown-toggle" href="/#" id="navbarDropdown" role="button" data-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false" title={t('BACKEND.CULTOTYPE_ADMIN')}>
                      {t('BACKEND.CULTOTYPE')}
                    </a>
                    <div className="dropdown-menu" role="menu" aria-labelledby="navbarDropdown">
                      {renderLink(this.props, '/cultotipo', t('BACKEND.CULTOTYPE'), true)}
                      {renderLink(this.props, '/cultotipo_pregunta', t('BACKEND.CULTOTYPE_QUESTIONS'))}
                    </div>
                  </li>
                }
                <li className={"nav-item dropdown " + navActive("/eventos") + ""}>
                  <a className="nav-link dropdown-toggle" href="/#" id="navbarDropdown" role="button" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                    {t('BACKEND.EVENTS')}
                  </a>
                  <div className="dropdown-menu" role="menu" aria-labelledby="navbarDropdown">
                    {renderLink(this.props, '/eventos', t('BACKEND.EVENTS'))}
                    {renderLink(this.props, '/evento_tipo', t('BACKEND.EVENTS_TYPES'))}
                  </div>
                </li>
                <li className={"nav-item dropdown " + navActive("/encuestas") + ""}>
                  <a className="nav-link dropdown-toggle" href="/#" id="navbarDropdown" role="button" data-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">
                    {t('BACKEND.SURVEYS')}
                  </a>
                  <div className="dropdown-menu" role="menu" aria-labelledby="navbarDropdown">
                    {renderLink(this.props, '/encuestas', t('BACKEND.SURVEYS'))}
                    {renderLink(this.props, '/questionblockgeneral', t('BACKEND.QUESTIONS_BLOCKS'))}
                    {renderLink(this.props, '/encuesta_pregunta', t('BACKEND.SURVEY_QUESTIONS'))}
                    {renderLink(this.props, '/encuesta_qr', t('BACKEND.SURVEY_QR'))}
                  </div>
                </li>
                <li className="nav-item" title={t('BACKEND.USERS_ADMIN')}>
                  {renderLink(this.props, '/usuarios', t('BACKEND.USERS'), false, 'nav-link')}
                </li>
                <li className="nav-item">
                  {renderLink(this.props, '/resultados', t('BACKEND.RESULTS'), false, 'nav-link')}
                </li>
              </ul>
            </div>
          </nav> <br />
        </div>
      </Router>
    );
  }
}

export default withTranslation('global')(BackEnd);