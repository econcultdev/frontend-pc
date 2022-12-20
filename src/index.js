/**
 * Render etiqueta principal de la app
 */

import React from 'react';
import ReactDOM from 'react-dom';
import i18n from './config/i18nextConf';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { I18nextProvider } from 'react-i18next';

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
  , document.getElementById('root'));

serviceWorker.unregister();