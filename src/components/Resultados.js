import React, { Component, useState, useEffect } from 'react';
import { BrowserRouter as Switch, Route } from "react-router-dom";
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import * as d3 from 'd3';
import BackEnd from './BackEnd';

import Select from 'react-select';
import CheckboxGroup from 'react-checkbox-group';
import { CSVLink } from 'react-csv';
import { withTranslation, useTranslation } from 'react-i18next';

const myInitObject = require('./config').myInitObject;

// const ResultadosContext = React.createContext('resultados');

let resultados = [];
let preguntas = [];
let dataset = {};
let divTooltip = null;
let svg = null;
let barChart = null;

class Resultados extends Component {
  constructor(props) {
    super();
  }

  componentWillUnmount() {
    resultados = [];
    preguntas = [];
    dataset = {};
    divTooltip = null;
    svg = null;
    barChart = null;
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <BackEnd {...this.props} />
        <div className="h3 p-4">
          {t('RESULTS.RESULTS_SURVEYS')}
        </div>
        <Switch>
          <Route
            path='/resultados'
            render={() => <ResultadosList {...this.props} />}
          />
        </Switch>
      </React.Fragment>
    )
  }
};

export default withTranslation('global')(Resultados);

const ResultadosList = ({ history, userId, administrador, permisosAcciones }) => {
  const [encuestas, setEncuestas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [EncuestaId, setEncuestaId] = useState(0);
  const [UsuarioId, setUsuarioId] = useState(0);
  const [usuario, setUsuario] = useState({});
  const [labels, setLabels] = useState({ user: {}, globals: {} });
  const [color, setColor] = useState([]);
  const [checked, setChecked] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [Preguntas, setPreguntas] = useState([]);
  const [Resultados, setResultados] = useState([]);
  const [DataSet, setDataSet] = useState({});
  const width = 270;
  const height = 250;
  const offset = 30;
  const innerRadius = 10;
  const barHeight = height * .5 - 40;
  const [t] = useTranslation("global");

  useEffect(
    () => {
      if (!administrador && userId) {
        setUsuarioId(userId);
      }
      const color = [
        'rgba(255,240,151,1)', // light pink
        'rgba(241,28,39,1)', // red
        'rgba(28,145,241,1)', // blue
        'rgba(231,221,28,1)', // yellow
        'rgba(38,231,28,1)', // green
        'rgba(28,231,221,1)', // cyan
        'rgba(231,228,211,1)', // pink
        'rgba(239,107,51,1)', // orange
        'rgba(157,51,239,1)', // violet
        'rgba(16,82,248,1)', // royalblue
        'rgba(162, 109, 111, 1)'];
      setColor(color);
      const labels = {
        user: {
          user: { color: color[0], title: t('RESULTS.EVALUATION') },
          global: { color: color[1], title: t('RESULTS.GENERAL_EVALUATION') },
          edad: { color: color[2], title: t('RESULTS.EVENT_AGE_HALF') },
          sexo: { color: color[3], title: t('RESULTS.EVENT_GENDER_HALF') },
          cultotipo: { color: color[4], title: t('RESULTS.EVENT_CULTOTYPE_HALF') }
        },
        global: {
          user: { color: color[0], title: t('RESULTS.TOTAL_HALF'), nombre: 'user' },
          global: { color: color[1], title: t('RESULTS.TOTAL_GENERAL_HALF'), nombre: 'global' }
        }
      };
      setLabels(labels);
      const procesar = async () => {
        try {
          const encu = await axios.get(myInitObject.crudServer + '/crud/encuesta/finalizadas' + ((!administrador && userId) ? '?userId=' + userId : ''),
            { withCredentials: true });
          const usu = await axios.get(myInitObject.crudServer + '/crud/usuario/encuestasfinalizadas' + ((!administrador && userId) ? '?userId=' + userId : ''),
            { withCredentials: true });
          return [encu.data, usu.data];
        } catch (e) {
          throw new Error(e);
        }
      };
      procesar().then((res) => {
        let i = 1;
        for (const enc of res[0]) {
          if (labels.global[enc.Eventos.TipoEvento.nombre] !== undefined) {
            continue;
          }
          labels.global[enc.Eventos.TipoEvento.nombre] = {
            id: enc.Eventos.TipoEvento.id, color: color[1 + i],
            title: t('RESULTS.YOU_HALF') + enc.Eventos.TipoEvento.nombre,
            nombre: enc.Eventos.TipoEvento.nombre
          };
          i++;
        }
        res[0].unshift({ id: 0, nombre: t('RESULTS.ALL_SURVEYS') });
        setEncuestas(res[0]);
        res[1].unshift({ id: 0, username: t('RESULTS.ALL_SURVEYS') });
        setUsuarios(res[1]);
      }).catch((e) => {
        console.error(e);
      });
    },
    [history, administrador, userId]
  );


  useEffect(() => {
    if (loaded && UsuarioId) {
      d3.selectAll('g > *').remove();
      if (EncuestaId) {
        createSvgUser();
      } else {
        createSvgGlobal();
      }
    }
  }, [checked, EncuestaId, loaded, UsuarioId]);


  const handleEncuestaId = ((e) => {
    const enc = encuestas.find(({ id }) => id === e.value);
    if (enc && e.value !== EncuestaId) {
      if (loaded) {
        clearSvg();
        setLoaded(false);
      }
      setChecked(['user', 'global']);
      setEncuestaId(e.value);
    }
  });

  const handleUsuarioId = ((e) => {
    const usu = usuarios.find(({ id }) => id === e.value);
    if (usu && e.value !== UsuarioId) {
      if (loaded) {
        clearSvg();
        setLoaded(false);
      }
      setChecked(['user', 'global']);
      setUsuarioId(e.value);
      setUsuario(usu);
    }

  });

  const MostrarResultados = (() => {
    setLoaded(false);
    if (UsuarioId) {
      resultados = [];
      preguntas = [];
      dataset = {};
      if (EncuestaId) {
        axios.get(myInitObject.crudServer + '/crud/encuesta/resultados?userId=' + UsuarioId + '&encuestaId=' + EncuestaId,
          { withCredentials: true })
          .then((res) => {
            if (res.data) {
              resultados = res.data;
              createDataUser();
              setPreguntas(preguntas);
              setDataSet(dataset);
              if (dataset && Object.keys(dataset).length > 0 && dataset.constructor === Object) {
                initSvg();
                createSvgUser();
                document.getElementById('divBarChart').appendChild(barChart.node());
              }
            }
            setLoaded(true);
          }).catch((e) => {
            console.error(e);
          });
      } else {
        axios.get(myInitObject.crudServer + '/crud/encuesta/resultados_globales?userId=' + UsuarioId,
          { withCredentials: true })
          .then((res) => {
            if (res.data) {
              resultados = res.data;
              createDataGlobal();
              setPreguntas(preguntas);
              setDataSet(dataset);
              if (dataset && Object.keys(dataset).length > 0 && dataset.constructor === Object) {
                initSvg();
                createSvgGlobal();
                document.getElementById('divBarChart').appendChild(barChart.node());
              }
            }
            setLoaded(true);
          }).catch((e) => {
            console.error(e);
          });
      }
    } else if (EncuestaId) {
      axios.get(myInitObject.crudServer + '/crud/encuesta/editWithResponses/' + EncuestaId,
        { withCredentials: true })
        .then((res) => {
          resultados = res.data;
          resultados.preguntas.sort((a, b) => {
            return a.EncuestasPreguntas.orden - b.EncuestasPreguntas.orden ||
              a.pregunta.localeCompare(b.pregunta)
          });
          const ordenPreguntas = {};
          let i = 0;
          for (const pregunta of resultados.preguntas) {
            ordenPreguntas[pregunta.id] = {
              orden: pregunta.EncuestasPreguntas.orden, pregunta: pregunta.pregunta
              , index: i, tipo: pregunta.TipoPregunta.tipo
            };
            i++;
          }
          resultados.EncuestaRespuestaUser = resultados.EncuestaRespuestaUser.filter(el => ordenPreguntas[el.EncuestaPreguntaId]);
          resultados.EncuestaRespuestaUser.sort((a, b) => {
            return a.Usuarios.email.localeCompare(b.Usuarios.email)
              || a.Usuarios.username.localeCompare(b.Usuarios.username)
              || ordenPreguntas[a.EncuestaPreguntaId].orden - ordenPreguntas[b.EncuestaPreguntaId].orden
              || ordenPreguntas[a.EncuestaPreguntaId].pregunta.localeCompare(ordenPreguntas[b.EncuestaPreguntaId].pregunta);
          });
          const resp = [];
          let obj = { UserId: 0 };
          for (const resD of resultados.EncuestaRespuestaUser) {
            if (obj.UserId !== resD.UserId) {
              let finalizada = false;
              if (resultados.EncuestaUserFinalizada.filter(el => el.UserId === resD.UserId).length > 0) {
                finalizada = true;
              }
              obj = {
                username: resD.Usuarios.username, UserId: resD.UserId, email: resD.Usuarios.email, finalizada,
                respuestas: Array(resultados.preguntas.length).fill()
              };
              resp.push(obj);
            }
            let valor = resD.valor;
            switch (ordenPreguntas[resD.EncuestaPreguntaId].tipo) {
              case 'Precio':
                obj.respuestas[ordenPreguntas[resD.EncuestaPreguntaId].index] = ((valor === '1') ?
                  t('RESULTS.YES') : t('RESULTS.NO')) + ' ' + t('RESULTS.FOR_PRICE') + ' ' + resD.precio;
                break;
              case 'Sí/No':
                obj.respuestas[ordenPreguntas[resD.EncuestaPreguntaId].index] = (valor === '1') ? t('RESULTS.YES') : t('RESULTS.NO');
                break;
              default:
                obj.respuestas[ordenPreguntas[resD.EncuestaPreguntaId].index] = valor;
            }
          }
          setResultados(resp);
          clearSvg();
          setLoaded(true);
        }).catch((e) => {
          console.error(e);
        });
    }
  });


  const createDataUser = () => {
    for (const respuesta of resultados.respuestasContador) {
      preguntas.push({ id: respuesta.EncuestaPreguntaId, pregunta: respuesta.EncuestaPregunta.pregunta });
    }

    dataset = {};
    for (const datasetLabel in labels.user) {
      if (!datasetLabel) {
        continue;
      }
      if (!labels.user[datasetLabel]) {
        continue;
      }
      for (const pregunta of preguntas) {
        if (dataset[pregunta.id] === undefined) {
          dataset[pregunta.id] = [];
        }
        const obj = { label: datasetLabel, valor: null };
        dataset[pregunta.id].push(obj);
        switch (datasetLabel) {
          case 'user':
            const arrUser = resultados.respuestasUser.filter((el) => {
              return el.EncuestaPreguntaId === pregunta.id;
            }).map(el => el.valor);
            if (arrUser.length) {
              obj.valor = parseInt(arrUser.shift(), 10);
            }
            break;
          case 'global':
            const arrContador = resultados.respuestasContador.filter((el) => {
              return el.EncuestaPreguntaId === pregunta.id;
            }).map(el => el.valor);
            if (arrContador.length) {
              obj.valor = parseInt(arrContador.shift(), 10);
            }
            break;
          default:
            let valorUsuario = null;
            switch (datasetLabel) {
              case 'edad':
                valorUsuario = usuario['edad'] + '';
                break;
              case 'sexo':
                valorUsuario = usuario['sexo'];
                break;
              case 'cultotipo':
                valorUsuario = (usuario['CultoTipo']) ? usuario['CultoTipo']['nombre'] + '' : '';
                break;
              default:
                break;
            }
            const arrContadorCriterio = resultados.respuestasContadorCriterio.filter((el) => {
              return el.criterio === datasetLabel && el.EncuestaPreguntaId === pregunta.id &&
                ((valorUsuario !== null && el.criterioId === valorUsuario) || true);
            }).map(el => el.valor);
            if (arrContadorCriterio.length) {
              obj.valor = parseInt(arrContadorCriterio.shift(), 10);
            }
            break;
        }
        if (isNaN(obj.valor)) {
          obj.valor = 0;
        }
      }
    }
  };


  const createDataGlobal = () => {
    preguntas = [];
    const preguntasId = {};
    for (const respuesta of resultados.respuestasContador) {
      if (preguntasId[respuesta.EncuestaPreguntaId] === undefined) {
        preguntas.push({ id: respuesta.EncuestaPreguntaId, pregunta: respuesta.EncuestaPregunta.pregunta });
        preguntasId[respuesta.EncuestaPreguntaId] = respuesta.EncuestaPreguntaId;
      }
    }
    dataset = {};
    for (const datasetLabel in labels.global) {
      if (!datasetLabel) {
        continue;
      }
      if (!labels.global[datasetLabel]) {
        continue;
      }
      for (const pregunta of preguntas) {
        if (dataset[pregunta.id] === undefined) {
          dataset[pregunta.id] = [];
        }
        const obj = { label: datasetLabel, valor: null };
        dataset[pregunta.id].push(obj);
        switch (datasetLabel) {
          case 'user':
            const arrU = resultados.respuestasUser.filter((el) => {
              return el.EncuestaPreguntaId === pregunta.id;
            });
            obj.valor = arrU.reduce((acc, el) => { return acc + parseInt(el.valor, 10) }, 0) / arrU.length;
            break;
          case 'global':
            const arrG = resultados.respuestasContador.filter((el) => {
              return el.EncuestaPreguntaId === pregunta.id;
            });
            obj.valor = arrG.reduce((acc, el) => { return acc + parseInt(el.valor, 10) }, 0) / arrG.length;
            break;
          default:
            const arrT = resultados.respuestasUser.filter((el) => {
              return el.EncuestaPreguntaId === pregunta.id && el.Encuestas.Eventos.TipoEvento.nombre === datasetLabel;
            });
            obj.valor = arrT.reduce((acc, el) => { return acc + parseInt(el.valor, 10) }, 0) / arrT.length;
            break;
        }
        if (isNaN(obj.valor)) {
          obj.valor = 0;
        }
      }
    }
  };

  const clearSvg = () => {
    d3.selectAll('#barChart').remove();
    d3.selectAll('#tooltip').remove();
  };

  const initSvg = () => {
    clearSvg();
    barChart = d3.select('body').append('div').attr('id', 'barChart').attr('class', 'barChart');
    svg = d3.select('#barChart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + (width + offset) / 2 + ',' + (height + offset) / 2 + ')');
    divTooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .attr('id', 'tooltip')
      .style('opacity', 0);
  };

  const createSvgUser = () => {
    if (svg === null) {
      initSvg();
    }
    svg.append('circle')
      .attr('r', innerRadius)
      .classed('inner', true)
      .style('fill', 'none')
      .style('stroke', 'grey')
      .style('stroke-width', '2px');

    const numPreguntas = preguntas.length;
    const offsetAngle = (2 * Math.PI) / numPreguntas;
    // const offsetAngleGrad = 360 / numPreguntas;

    // const lines = svg.selectAll('line')
    //   .data(preguntas)
    //   .enter().append('line')
    //   .attr('y1', -innerRadius)
    //   .attr('y2', -((height - offset) / 2))
    //   .style('stroke', 'black')
    //   .style('stroke-width', '.5px')
    //   .attr('transform', (d, i) => 'rotate(' + (i * offsetAngleGrad) + ')');

    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'dropshadow');
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 2.5)
      .attr('result', 'blur');
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offsetBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur')
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    const arc = d3.arc()
      .innerRadius(innerRadius);
    let j = 0;
    let k = 1;
    const arcData = [];
    for (const preguntaId in dataset) {
      if (preguntaId) {
        const preguntaIdInt = parseInt(preguntaId, 10);
        const pregunta = preguntas.filter(el => el.id === preguntaIdInt)[0].pregunta;
        const extent = d3.extent(dataset[preguntaId].filter((el) => checked.find((c) => c === el.label))
          .map((el) => el.valor)
          , (d) => d);
        const barScale = d3.scaleLinear().domain([0, extent[1]]).range([10 + innerRadius, barHeight]);
        const numLabels = dataset[preguntaId].map((el) => el.label).filter((el) => checked.find((c) => c === el)).length + 2;
        const offsetArc = j * offsetAngle + (offsetAngle / numLabels);
        let i = 0;
        for (const valor of dataset[preguntaId]) {
          if (!checked.find((el) => el === valor.label)) {
            continue;
          }
          const color = (labels.user[valor.label]) ? labels.user[valor.label].color : 'white';
          arcData.push({
            barScale,
            outerRadiusEnd: barScale(valor.valor),
            outerRadius: 0,
            pregunta,
            color,
            label: labels.user[valor.label].title,
            startAngle: offsetArc + ((i * offsetAngle) / numLabels),
            endAngle: offsetArc + (((i + 1) * offsetAngle) / numLabels),
            valor: valor.valor,
            k
          });
          k++;
          i++;
        }
        j++;
      }
    }

    const arcs = svg.selectAll('path')
      .data(arcData)
      .enter().append('path')
      .style('fill', (d) => d.color)
      .attr('id', (d) => 'arc_' + d.k)
      .attr('d', arc)
      .attr('filter', 'url(#dropshadow)')
      .on('mouseover', (d, i, n) => {
        divTooltip.transition()
          .duration(200)
          .style('opacity', .9);
        divTooltip.html(t('RESULTS.QUESTION') + ': ' + d.pregunta + '. ' + t('RESULTS.DATA')
          + ': ' + d.label + '. ' + t('RESULTS.VALUE') + ': ' + d.valor.toFixed(2))
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px')
        d3.select(n[i]).transition()
          .duration('50')
          .attr('opacity', '.75');
      })
      .on('mousemove', (d, i, n) => {
        divTooltip.style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px')
      })
      .on('mouseout', (d, i, n) => {
        divTooltip.transition()
          .duration(500)
          .style('opacity', 0);
        d3.select(n[i]).transition()
          .duration('50')
          .attr('opacity', '1');
      });

    arcs.transition().ease(d3.easeElastic).duration(1000).delay((d, i) => (1 - i) * 100)
      .attrTween('d', (d, index) => {
        const i = d3.interpolate(d.outerRadius, d.barScale(+d.valor));
        return (t) => { d.outerRadius = i(t); return arc(d, index); };
      });
    const labelsSvg = svg.append('g').classed('labels', true);
    labelsSvg.selectAll('text')
      .data(arcData)
      .enter().append('text')
      .attr('transform', (d, i, j) => {
        const angle = ((d.endAngle + d.startAngle) / 2) - (Math.PI / 2);
        const radius = innerRadius + d.outerRadiusEnd + 10;
        return 'translate(' + (radius * Math.cos(angle)) + ','
          + (radius * Math.sin(angle)) + ')';
      })
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#3e3e3e')
      .text((d) => (d.valor) ? d.valor.toFixed(2) : 0);

  };


  const createSvgGlobal = () => {
    svg.append('circle')
      .attr('r', innerRadius)
      .classed('inner', true)
      .style('fill', 'none')
      .style('stroke', 'grey')
      .style('stroke-width', '2px');

    const numPreguntas = preguntas.length;
    const offsetAngle = (2 * Math.PI) / numPreguntas;
    // const offsetAngleGrad = 360 / numPreguntas;

    // const lines = svg.selectAll('line')
    //   .data(preguntas)
    //   .enter().append('line')
    //   .attr('y1', -innerRadius)
    //   .attr('y2', -((height - offset) / 2))
    //   .style('stroke', 'black')
    //   .style('stroke-width', '.5px')
    //   .attr('transform', (d, i) => 'rotate(' + (i * offsetAngleGrad) + ')');

    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'dropshadow');
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 2.5)
      .attr('result', 'blur');
    filter.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offsetBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'offsetBlur')
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    const arc = d3.arc()
      .innerRadius(innerRadius);
    let j = 0;
    let k = 1;
    const arcData = [];
    for (const preguntaId in dataset) {
      if (preguntaId) {
        const preguntaIdInt = parseInt(preguntaId, 10);
        const pregunta = preguntas.filter(el => el.id === preguntaIdInt)[0].pregunta;
        const extent = d3.extent(dataset[preguntaId].filter((el) => checked.find((c) => c === el.label))
          .map((el) => el.valor)
          , (d) => d);
        const barScale = d3.scaleLinear().domain([0, extent[1]]).range([10 + innerRadius, barHeight]);
        const numLabels = dataset[preguntaId].map((el) => el.label).filter((el) => checked.find((c) => c === el)).length + 2;
        const offsetArc = j * offsetAngle + (offsetAngle / numLabels);
        let i = 0;
        for (const valor of dataset[preguntaId]) {
          if (!checked.find((el) => el === valor.label)) {
            continue;
          }
          const color = (labels.global[valor.label]) ? labels.global[valor.label].color : 'white';
          arcData.push({
            barScale,
            outerRadiusEnd: barScale(valor.valor),
            outerRadius: 0,
            pregunta,
            color,
            label: labels.global[valor.label].title,
            startAngle: offsetArc + ((i * offsetAngle) / numLabels),
            endAngle: offsetArc + (((i + 1) * offsetAngle) / numLabels),
            valor: valor.valor,
            k
          });
          k++;
          i++;
        }
        j++;
      }
    }


    const arcs = svg.selectAll('path')
      .data(arcData)
      .enter().append('path')
      .style('fill', (d) => d.color)
      .attr('id', (d) => 'arc_' + d.k)
      .attr('d', arc)
      .attr('filter', 'url(#dropshadow)')
      .on('mouseover', (d, i, n) => {
        divTooltip.transition()
          .duration(200)
          .style('opacity', .9);
        divTooltip.html(t('RESULTS.QUESTION') + ': ' + d.pregunta + '. ' + t('RESULTS.DATA')
          + ': ' + d.label + '. ' + t('RESULTS.VALUE') + ': ' + d.valor.toFixed(2))
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px')
        d3.select(n[i]).transition()
          .duration('50')
          .attr('opacity', '.75');
      })
      .on('mousemove', (d, i, n) => {
        divTooltip.style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px')
      })
      .on('mouseout', (d, i, n) => {
        divTooltip.transition()
          .duration(500)
          .style('opacity', 0);
        d3.select(n[i]).transition()
          .duration('50')
          .attr('opacity', '1');
      });

    arcs.transition().ease(d3.easeElastic).duration(1000).delay((d, i) => (1 - i) * 100)
      .attrTween('d', (d, index) => {
        const i = d3.interpolate(d.outerRadius, d.barScale(+d.valor));
        return (t) => { d.outerRadius = i(t); return arc(d, index); };
      });

    const labelsSvg = svg.append('g').classed('labels', true);
    labelsSvg.selectAll('text')
      .data(arcData)
      .enter().append('text')
      .attr('transform', (d, i, j) => {
        const angle = ((d.endAngle + d.startAngle) / 2) - (Math.PI / 2);
        const radius = innerRadius + d.outerRadiusEnd + 10;
        return 'translate(' + (radius * Math.cos(angle)) + ','
          + (radius * Math.sin(angle)) + ')';
      })
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#3e3e3e')
      .text((d) => d.valor.toFixed(2));
  };


  const ExportarResultados2CSV = () => {
    const data = [];
    data.push(resultados.preguntas.map((pregunta) =>
      (pregunta.titulo_corto !== null) ? pregunta.titulo_corto : pregunta.pregunta
    ));
    data[0].unshift('Usuario');
    data.push(...Resultados.map((resultado) => {
      let arr = [];
      arr.push(resultado.email + '(' + resultado.username + ')' + ((resultado.finalizada) ?
        t('RESULTS.SURVEY_FINISHED') : t('RESULTS.SURVEY_PENDING')));
      arr.push(resultado.respuestas.map((resp) => resp));
      return arr.flat();
    })
    );
    return data;
  };

  return (
    <div className="container">
      { (!administrador && !permisosAcciones['/resultados']['listar']) &&
        <Redirect to="/backend" />
      }
      <div className="form-group">
        <label>{t('RESULTS.SURVEYS')}:  </label>
        <Select name={"EncuestaId"} isSearchable={true}
          onChange={handleEncuestaId}
          value={encuestas.filter(({ id }) => id === EncuestaId).map(element => {
            return {
              value: element.id, label: element.nombre + ((element.Eventos) ? ' (' +
                t('RESULTS.EVENT') + ': ' + element.Eventos.nombre + ')' : '')
            }
          })}
          options={encuestas.map(element => {
            return {
              value: element.id, label: element.nombre + ((element.Eventos) ? ' (' +
                t('RESULTS.EVENT') + ': ' + element.Eventos.nombre + ')' : '')
            }
          })}
        />
      </div>
      {administrador &&
        <div className="form-group">
          <label>{t('RESULTS.USERS')}:  </label>
          <Select name={"UsuarioId"} isSearchable={true}
            onChange={handleUsuarioId}
            value={usuarios.filter(({ id }) => id === UsuarioId).map(element => {
              return {
                value: element.id, label: element.username + ((element.email) ? ' (' +
                  t('RESULTS.EMAIL') + ': ' + element.email + ')' : '')
              }
            })}
            options={usuarios.map(element => {
              return {
                value: element.id, label: element.username + ((element.email) ? ' (' +
                  t('RESULTS.EMAIL') + ': ' + element.email + ')' : '')
              }
            })}
          />
        </div>
      }
      <div className="form-group">
        <div className="d-inline">
          <button className="btn btn-primary" onClick={() => MostrarResultados()}
            disabled={UsuarioId === 0 && EncuestaId === 0}>
            {t('RESULTS.RESULTS_SHOW')}
          </button>
        </div>
        {EncuestaId !== 0 && UsuarioId === 0 && loaded &&
          <div className="d-inline pl-4">
            <CSVLink data={ExportarResultados2CSV()}>
              {t('RESULTS.EXPORT_CSV')}
            </CSVLink>
          </div>
        }
      </div>
      <div className="d-flex justify-content-between">
        <div>
          <div id="divBarChart"></div>
          {EncuestaId !== 0 && UsuarioId !== 0 && loaded &&
            <div className="container"><CheckboxGroup name="checked" value={checked} onChange={setChecked}>
              {(Checkbox) => (
                <>
                  <div>
                    <label style={{ backgroundColor: labels.user['user'].color }}>
                      <Checkbox value="user" />{labels.user['user'].title}
                    </label>
                  </div>
                  <div>
                    <label style={{ backgroundColor: labels.user['global'].color }}>
                      <Checkbox value="global" />{labels.user['global'].title}
                    </label>
                  </div>
                  <div>
                    <label style={{ backgroundColor: labels.user['sexo'].color }}>
                      <Checkbox value="sexo" />{labels.user['sexo'].title}
                    </label>
                  </div>
                  <div>
                    <label style={{ backgroundColor: labels.user['edad'].color }}>
                      <Checkbox value="edad" />{labels.user['edad'].title}
                    </label>
                  </div>
                  <div>
                    <label style={{ backgroundColor: labels.user['cultotipo'].color }}>
                      <Checkbox value="cultotipo" />{labels.user['cultotipo'].title}
                    </label>
                  </div>
                </>
              )}
            </CheckboxGroup>
            </div>}
          {EncuestaId !== 0 && UsuarioId === 0 && loaded &&
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>{t('RESULTS.USERS')}</th>
                    {resultados.preguntas.map((pregunta, indexP) => {
                      return (
                        <th key={indexP}>{(pregunta.titulo_corto !== null) ? pregunta.titulo_corto : pregunta.pregunta}</th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {
                    Resultados.map((resultado, indexU) => {
                      return (
                        <tr key={indexU}>
                          <td>
                            {resultado.email}<br />
                            {'(' + resultado.username + ')'}<br />
                            {((resultado.finalizada) ? t('RESULTS.SURVEY_FINISHED') : t('RESULTS.SURVEY_PENDING'))}
                          </td>
                          {
                            resultado.respuestas.map((resp, indexR) => {
                              return (
                                <td key={indexR}>
                                  {resp}
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
            </div>
          }
          {EncuestaId === 0 && loaded &&
            <div className="container"><CheckboxGroup name="checked" value={checked} onChange={setChecked}>
              {(Checkbox) => (
                <>
                  <div>
                    <label style={{ backgroundColor: labels.global['user'].color }}>
                      <Checkbox value="user" />{labels.global['user'].title}
                    </label>
                  </div>
                  <div>
                    <label style={{ backgroundColor: labels.global['global'].color }}>
                      <Checkbox value="global" />{labels.user['global'].title}
                    </label>
                  </div>
                  {
                    Object.keys(labels.global).filter(i => i !== 'user' && i !== 'global').map(i => {
                      return { label: i, data: labels.global[i] }
                    }).map((item, index) => {
                      return (
                        <div key={index}>
                          <label style={{ backgroundColor: item.data.color }}>
                            <Checkbox value={item.label} />{item.data.title}
                          </label>
                        </div>
                      );
                    })
                  }
                </>
              )}
            </CheckboxGroup>
            </div>}
        </div>
        <div>
          {loaded && Preguntas.length &&
            <h4>{t('RESULTS.RESULTS')}</h4>}
          {
            loaded && Preguntas.map((pregunta, index) => {
              return (
                <div key={index}>
                  <p>{pregunta.pregunta}</p>
                  <ul>
                    {
                      DataSet[pregunta.id].map((data, indexD) => {
                        return (
                          <li key={index + '_' + indexD}>
                            <p>{(EncuestaId) ? labels.user[data.label].title : labels.global[data.label].title}: {(data.valor) ? data.valor.toFixed(2) : 0}</p>
                          </li>
                        );
                      })
                    }
                  </ul>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
};