/**
 * Mantenimiento de QR para encuestas
 */

import React, { Component, useState, useEffect } from 'react';
import { BrowserRouter as Switch, Route } from "react-router-dom";
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode';
import BackEnd from './BackEnd';
import { withTranslation, useTranslation } from 'react-i18next';

import Select from 'react-select';

const myInitObject = require('./config').myInitObject;

/**
 * Componente que implementa los procesos CRUD para QR
 */
class EncuestaQR extends Component {

    /**
     * Definición de las rutas del mantenimiento de QR
     */
    render() {
        const { t } = this.props;
        return (
            <React.Fragment>
                <BackEnd {...this.props} />
                <div className="h3 p-4">
                    {t('QRSURVEYS.SURVEY_QR_TITLE')}
                </div>
                <Switch>
                    <Route
                        path='/encuesta_qr'
                        render={() => <GenerarQR {...this.props} />}
                    />
                </Switch>

            </React.Fragment>
        )
    }
}

export default withTranslation('global')(EncuestaQR);

/**
 * Componente para generar un QR
 */
const GenerarQR = ({ history, administrador, permisosAcciones }) => {

    const [encuestas, setEncuestas] = useState([]);
    const [EncuestaId, setEncuestaId] = useState(0);
    const [texto, setTexto] = useState('');
    const [url, setUrl] = useState('');
    const [t] = useTranslation("global");

    // recoger encuestas
    useEffect(
        () => {
            axios.get(myInitObject.crudServer + '/crud/encuestas',
                { withCredentials: true })
                .then(response => {
                    setEncuestas(response.data);
                })
                .catch(function (error) {
                    console.error(error);
                })
        },
        [history]
    );

    const handleEncuestaId = ((e) => {
        const enc = encuestas.find(({ id }) => id === e.value);
        if (enc && e.value !== EncuestaId) {
            setEncuestaId(e.value);
            setTexto(myInitObject.appServer + '/app/home/encuesta/' + e.value);
            setUrl('');
        }
    });

    const handleTexto = ((e) => {
        setTexto(e.target.value);
        setUrl('');
    });

    // mostrar QR del texto
    const handleGenerarQR = (() => {
        QRCode.toDataURL(texto)
            .then(url => {
                setUrl(url);
            })
            .catch(err => {
                console.error(err)
            })
    });

    return (
        <div className="container">
            { (!administrador && !permisosAcciones['/encuesta_qr']['crear']) &&
                <Redirect to="/backend" />
            }
            <div className="form-group">
                <label>{t('QRSURVEYS.SURVEYS')}:  </label>
                <Select name={"EncuestaId"} isSearchable={true}
                    onChange={handleEncuestaId}
                    placeholder={t('QRSURVEYS.SELECT')}
                    value={encuestas.filter(({ id }) => id === EncuestaId).map(element => {
                        return {
                            value: element.id, label: element.nombre + ((element.Eventos)
                                ? ' (Evento: ' + element.Eventos.nombre + ')'
                                : '')
                        }
                    })}
                    options={encuestas.map(element => {
                        return {
                            value: element.id, label: element.nombre + ((element.Eventos)
                                ? ' (' + t('QRSURVEYS.EVENT') + ': ' + element.Eventos.nombre + ')'
                                : '')
                        }
                    })}
                />
            </div>
            <div className="form-group">
                <label>{t('QRSURVEYS.TEXT')}:  </label>
                <input className="form-control" type="text" size="100" value={texto} onChange={handleTexto} />
            </div>
            <div className="form-group">
                <button className="btn btn-primary" onClick={() => handleGenerarQR()} disabled={texto === ''}>{t('QRSURVEYS.SURVEY_QR_GENERATE')}</button>
            </div>
            <div className="form-group">
                {url && <img src={url} alt="" />}
            </div>
        </div>
    );
};
