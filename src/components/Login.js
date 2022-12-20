/**
 * Autenticación
 */

import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import '../pages/login/login.css';
// import WaveSVG from '../assets/login/wave.png';
// import PhoneSVG from '../assets/login/phone.svg';
// import ProfileSVG from '../assets/login/profile.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const myInitObject = require('./config').myInitObject;

let activeEye = false;

class Login extends Component {

  constructor(props) {
    super(props)
    this.state = {
      username: '',
      password: '',
      fieldUserActivate: false,
      fieldPassActivate: false
    };

    this.fieldUserActivate = this.fieldUserActivate.bind(this);
    this.fieldPassActivate = this.fieldPassActivate.bind(this);
    this.disableFocus = this.disableFocus.bind(this);
  };

  fieldUserActivate() {
    this.setState({
      fieldUserActivate: true
    });
  }

  fieldPassActivate() {
    this.setState({
      fieldPassActivate: true
    });
  }

  disableFocus() {
    if (this.state.username === '') {
      this.setState({
        fieldUserActivate: false
      });
    }
    if (this.state.password === '') {
      this.setState({
        fieldPassActivate: false
      });
    }
  }

  handleInputChange = (event) => {
    const { value, name } = event.target;
    this.setState({
      [name]: value
    });
  };

  activeEyeChange = () => {
    activeEye = !activeEye;
    this.setState({
      activeEye: activeEye
    });
  };

  // enviar datos del usuario para validar
  onSubmit = (event) => {
    event.preventDefault();

    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    fetch(myInitObject.crudServer + '/crud/authenticate', {
      method: 'POST',
      //mode: 'same-origin',
      redirect: 'follow',
      credentials: 'include',
      body: JSON.stringify(this.state),
      headers: headers
    })
      .then((res) => {
        if (res.status === 200) {
          res.text().then((data) => {
            let obj = JSON.parse(data);
            sessionStorage.setItem('username', obj.username);
            sessionStorage.setItem('nombre', obj.nombre);
            sessionStorage.setItem('apellidos', obj.apellidos);
            this.props.history.push('/backend');
          }).catch(err => {
            console.error(err);
            alert('Error logging in please try again');
          });
        } else {
          const error = new Error(res.error);
          throw error;
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error logging in please try again');
      });
  };

  // pintar formulario de validación
  render() {
    const { t } = this.props;
    return (
      // <div className="login-page"> 
      //   <img className="wave" src={WaveSVG} />
      //   <div className="container2">
      //     <div className="phone">
      //       <img src={PhoneSVG} />
      //     </div>
      //     <div className="login-content">
      //       <form onSubmit={this.onSubmit}>
      //         <img src={ProfileSVG} />
      //         <h2 className="title">Welcome</h2>
      //         <div className="input-div one">
      //           <div className="icon">
      //             <FontAwesomeIcon icon={faUser} className="font-icon" />
      //           </div>
      //           <div className="div">
      //             <h5 className={this.state.fieldUserActivate ? "field-active" : ""}>Username</h5>
      //             <input className="input" type="username" name="username"
      //               onFocus={this.fieldUserActivate}
      //               onBlur={this.disableFocus}
      //               onChange={this.handleInputChange}
      //               required />
      //           </div>
      //         </div>
      //         <div className="input-div pass">
      //           <div className="icon">
      //             <FontAwesomeIcon icon={faLock} className="font-icon" />
      //           </div>
      //           <div className="div">
      //             <h5 className={this.state.fieldPassActivate ? "field-active" : ""}>Password</h5>
      //             <input className="input" type={activeEye ? "text" : "password"} name="password"
      //               onFocus={this.fieldPassActivate}
      //               onBlur={this.disableFocus}
      //               onChange={this.handleInputChange}
      //               required />
      //           </div>
      //           <div className="icon">
      //             <FontAwesomeIcon icon={activeEye ? faEye : faEyeSlash} className="font-icon pass" onClick={this.activeEyeChange} />
      //           </div>
      //         </div>
      //         <a href="/#">Forgot Password?</a>
      //         <input type="submit" className="btn-login" value="Login" />
      //       </form>
      //     </div>
      //   </div>
      // </div>

      <div className="container">
        <form onSubmit={this.onSubmit}>
          <div className="form-group">
            <label>{t('LOGIN.USERNAME')}:</label>
            <input
              type="username"
              name="username"
              onChange={this.handleInputChange}
              required
              className="form-control"
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <input
                type={activeEye ? "text" : "password"}
                name="password"
                onChange={this.handleInputChange}
                required
                className="form-control"
              />
              <div className="icon" style={{ padding: '0 0 0 10px' }}>
                <FontAwesomeIcon icon={activeEye ? faEye : faEyeSlash} className="font-icon pass" onClick={this.activeEyeChange} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <input type="submit" value="Submit" className="btn btn-primary" />
          </div>
        </form>
      </div>
    );
  };

}

export default withTranslation('global')(Login);
