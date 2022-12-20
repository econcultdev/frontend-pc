import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Cookies from "js-cookie";
import Login from './components/Login';
import BackEnd from './components/BackEnd';
import withAuth from './components/witAuth';

import Paises from './components/Paises';
import Provincias from './components/Provincias';
import Ciudades from './components/Ciudades';
import NivelFormacion from './components/NivelFormacion';
import Ingresos from './components/Ingresos';
import TipoPregunta from './components/TipoPregunta';
import CultoTipo from './components/CultoTipo';
import CultoTipoPregunta from './components/CultoTipoPregunta';
import TipoEvento from './components/TipoEvento';
import Eventos from './components/Eventos';
import Roles from './components/Roles';
import Encuestas from './components/Encuestas';
import EncuestaPregunta from './components/EncuestaPregunta';
import Usuarios from './components/Usuarios';
import Resultados from './components/Resultados';
import EncuestaQR from './components/EncuestaQR';
import TextoLegal from './components/TextoLegal';
import { useTranslation, withTranslation } from 'react-i18next';
import i18n from 'i18next';

import DropdownPopOver from './components/dropdown-popover/DropdownPopOver';
import TypeLegalText from './components/TypeLegalText';
import Language from './components/Language';
import QuestionBlockGeneral from './components/QuestionBlockGeneral';

const myInitObject = require('./components/config').myInitObject;
const createHistory = require("history").createBrowserHistory;

const history = createHistory();

export const SessionContext = React.createContext();


/**
 * Componentes para definir las rutas y las variables de sesión con los datos del usuario registrado
 */
const Routes = () => {

  const { t } = useTranslation("global");
  const [userName, setUserName] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');


  /**
   * Inicialización de las variables
   */
  useEffect(
    () => {
      if (sessionStorage.getItem('username') !== null) {
        setUserName(sessionStorage.getItem('username'));
      }
      if (sessionStorage.getItem('nombre') !== null) {
        setNombre(sessionStorage.getItem('nombre'));
      }
      if (sessionStorage.getItem('apellidos') !== null) {
        setApellidos(sessionStorage.getItem('apellidos'));
      }
    }, []
  );


  const navLinkShow = (() => {
    let reg = new RegExp("^/(dg_|usuarios|cultotipo|evento|agenda|backend|logout)");
    if (reg.test(window.location.pathname))
      return false;
    return true;
  });

  // renderizado de las rutas. Actualizamos rutas siempre para recargar menú superior on el estado actual,
  // no es lo más ortodoxo ni recomendable, pero...
  return (
    /* eslint no-restricted-globals:0 */
    <SessionContext.Provider>

      <Router history={history} forceRefresh={true}>
        <div className="container p-4">
          {/* {userName === '' && location.pathname !== '/login' &&
            <div className="col-md-2"><Link to="/login">{t("APP.LOGIN")}</Link></div>
          } */}
          {userName !== '' && location.pathname !== '/logout' && location.pathname !== '/login' &&
            <div className="row">
              <div className="col-md-2">
                <Link to="/logout">{t("APP.LOGOUT")}</Link>
              </div>
              <div className="col-md-4">
                {t("APP.USER")}: {userName}. ({apellidos}, {nombre})
              </div>
            </div>
          }
          {userName !== '' && navLinkShow() &&
            <div><Link to="/backend">{t("APP.MAITENANCES")}</Link>
            </div>
          }
        </div>
        <Switch>
          <Route exact path='/' component={Login} />
          <Route path="/login" component={Login} />
          <Route path="/logout" component={Logout} />
          <Route path="/backend" component={withAuth(BackEnd)} />
          <Route path="/dg_paises" component={withAuth(Paises)} />
          <Route path="/dg_provincias" component={withAuth(Provincias)} />
          <Route path="/dg_ciudades" component={withAuth(Ciudades)} />
          <Route path="/dg_nivelformacion" component={withAuth(NivelFormacion)} />
          <Route path="/dg_ingresos" component={withAuth(Ingresos)} />
          <Route path="/dg_tipopregunta" component={withAuth(TipoPregunta)} />
          <Route path="/dg_roles" component={withAuth(Roles)} />
          <Route path="/dg_textolegal" component={withAuth(TextoLegal)} />
          <Route path="/dg_textolegal" component={withAuth(TextoLegal)} />
          <Route path="/typelegaltext" component={withAuth(TypeLegalText)} />
          <Route path="/dg_language" component={withAuth(Language)} />
          <Route path="/cultotipo" component={withAuth(CultoTipo)} />
          <Route path="/cultotipo_pregunta" component={withAuth(CultoTipoPregunta)} />
          <Route path="/evento_tipo" component={withAuth(TipoEvento)} />
          <Route path="/eventos" component={withAuth(Eventos)} />
          <Route path="/encuestas" component={withAuth(Encuestas)} />
          <Route path="/questionblockgeneral" component={withAuth(QuestionBlockGeneral)} />
          <Route path="/encuesta_pregunta" component={withAuth(EncuestaPregunta)} />
          <Route path="/encuesta_qr" component={withAuth(EncuestaQR)} />
          <Route path="/usuarios" component={withAuth(Usuarios)} />
          <Route path="/resultados" component={withAuth(Resultados)} />
        </Switch>
      </Router>
    </SessionContext.Provider>
  );
};


/**
 * Componente de logout del usuario. Se borran cookies y valores de sesión.
 * Muestra un mensaje de salida.
 *
 * @param {*} history historial de navegación
 */
const Logout = ({ history }) => {
  const { t } = useTranslation("global");
  useEffect(
    () => {
      Cookies.remove(myInitObject.nameCookie);
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('nombre');
      sessionStorage.removeItem('apellidos');
      history.push("/login");
    },
    [history]
  );

  return <div>{t("APP.LOGINOUT")}</div>;
};


/**
 * Componente App. Renderiza el contenedor principal y llama al componente de las rutas
 */
const App = () => {
  //let lUserName = null;
  const { t } = useTranslation("global");
  useEffect(
    () => {
      const changeLanguage = () => {
        i18n.changeLanguage(localStorage.getItem('language'));
        // lUserName = sessionStorage ? sessionStorage.getItem('username') : null;
      };
      changeLanguage();
    }, []
  );

  return (
    <div>
      {/* {lUserName !== null &&
        <div className="container">
          <MultiLenguage />
          <h2>{t("APP.AUCULTURA_MAITENANCE")}</h2>
          <Routes />
        </div>
      }
      {lUserName === null &&
        <div className="login-page">
          <Routes />
        </div>
      } */}

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>{t("APP.AUCULTURA_MAITENANCE")}</h2>
          <DropdownPopOver />
        </div>
        <Routes />
      </div>
    </div >
  );
}

export default withTranslation('global')(App);
