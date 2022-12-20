/* eslint react/no-multi-comp: 0, react/prop-types: 0 */
import React, { useState } from 'react';
import { Button, UncontrolledPopover } from 'reactstrap';
import i18n, { languagesOptions, languageService } from '../../config/i18nextConf';

const options2 = languagesOptions;

const DropdownPopOver = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const toggle = () => setPopoverOpen(!popoverOpen);

  const getLanguage = () => {
    languageService.set(localStorage.getItem("language"));
    let lngStorage = localStorage.getItem('language');
    if (lngStorage !== undefined) {
      let lngDef = options2.find(lg => lg.value === lngStorage);
      lngDef = lngDef ? lngDef : options2[0];
      storeLanguageInLocalStorage(lngDef.value)
      return lngDef ? lngDef : options2[0];
    }
  }

  function storeLanguageInLocalStorage(language) {
    localStorage.setItem("language", language);
    localStorage.setItem("i18nextLng", language);
  }

  function handleClick(e) {
    storeLanguageInLocalStorage(e.target.value);
    i18n.changeLanguage(localStorage.getItem("language"));
    languageService.set(localStorage.getItem("language"));
  };

  return (
    <div>
      <Button id="PopoverFocus" type="button" style={{ background: 'transparent', color: 'black', border: 0, boxShadow: 'none' }}>
        <img
          src={getLanguage().icon}
          style={{ width: 36, padding: 5 }}
          alt=""
        />
      </Button>
      <UncontrolledPopover trigger="focus" placement="bottom" isOpen={popoverOpen} target="PopoverFocus" toggle={toggle}
        fade flip>
        {languagesOptions.map(function (object, i) {
          return (
            <div key={i}>
              <Button style={{ background: 'transparent', color: 'black', border: 0, boxShadow: 0, width: '100%' }}
                onClick={handleClick} value={object.value}>
                <img
                  src={object.icon}
                  style={{ width: 36, padding: 5 }}
                  alt=""
                />
                {object.label}
              </Button>
            </div>
          )
        })}
      </UncontrolledPopover>
    </div>
  );
}

export default DropdownPopOver;