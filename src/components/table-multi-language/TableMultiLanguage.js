/* eslint react/no-multi-comp: 0, react/prop-types: 0 */
import React, { useEffect, useState } from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import { Trans, useTranslation, withTranslation } from 'react-i18next';
import paginationFactory, { PaginationProvider } from 'react-bootstrap-table2-paginator';
import filterFactory from 'react-bootstrap-table2-filter';
import { isEmpty, isNull, isUndefined } from 'lodash';
import ModalPro from '../modal/ModalPro';
import _ from 'lodash';

const myInitObject = require('../config').myInitObject;

const TableMultiLanguage = (props) => {

  const { languages, showPagination, showTextArea } = props;
  const [showMultilanguageEdit, setShowMultiLanguageEdit] = useState(false);
  const [rowInvocation, setRowInvocation] = useState({});
  const [englishValue, setEnglishValue] = useState(false);
  useEffect(() => {
    setEnglishValue(checkEnglishValidation(languages));
  }, [languages]);
  const { t } = useTranslation('global');

  /****************************************************
   ******************** TABLE *************************
   ****************************************************/

  /**
   * Used to paint edit and delete buttons
   * @param {*} row Row
   */
  const ActionsFormatter = (row) => {
    return (
      <div className="container">
        <div className="d-flex flex-row justify-content-center">
          <div className="p-2">
            <button className="btn btn-primary" onClick={(e) => { clickEdit(row, e) }}>
              {t('TABLE_MULTI_LANGUAGE.EDIT')}
            </button>
          </div>
          <div className="p-2">
            <button className="btn btn-danger" onClick={(e) => { clickDelete(row, e) }}>
              {t('TABLE_MULTI_LANGUAGE.DELETE')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Used to paint component in row and cell
   * @param {*} cell Cell
   * @param {*} row Row
   */
  const actionsFormatter = (cell, row) => <ActionsFormatter row={row} />;

  /**
     * Table columns
     */
  const columns = [
    {
      dataField: 'label',
      text: t('TABLE_MULTI_LANGUAGE.LANGUAGE').toUpperCase(),
      sort: true,
      headerAlign: 'center',
      align: 'center',
      editable: false
    },
    {
      dataField: 'multilanguage',
      text: t('TABLE_MULTI_LANGUAGE.VALUE').toUpperCase(),
      headerAlign: 'center',
      align: 'center',
      editable: false
    },
    {
      dataField: '',
      text: t('TABLE_MULTI_LANGUAGE.ACTIONS').toUpperCase(),
      headerAlign: 'center',
      align: 'center',
      editable: false,
      isDummyField: true,
      csvExport: false,
      formatter: actionsFormatter
    }
  ];

  /**
   * Pagination total render
   * @param {*} from From
   * @param {*} to To
   * @param {*} size Size
   */
  const paginationTotalRenderer = (from, to, size) => (
    <span className="react-bootstrap-table-pagination-total">
      <Trans i18nKey="TABLE_MULTI_LANGUAGE.PAGINATION_TOTAL">
        {t('TABLE_MULTI_LANGUAGE.PAGINATION_TOTAL', { from: from || 1, to: to || 1, size: size || 0 })}
      </Trans>
    </span>
  );

  /**
   * Pagination options
   */
  const paginationOptions = () => {
    let lPaginationOption = {
      data: languages ? languages : [],
      custom: true,
      sizePerPage: myInitObject.pageSize,
      showTotal: false,
      hideSizePerPage: languages.length === 0,
      withFirstAndLast: true
    };
    lPaginationOption = { ...lPaginationOption, ...paginationTotalRenderer }
    return lPaginationOption;
  }

  /**
   * Set the value to specific language 
   * @param {*} id Id
   * @param {*} multiLanguageValue Value from language
   * @param {*} languages Array languages
   */
  const setMultiLanguageValue2Language = (id, multiLanguageValue, languages) => {
    if (languages && Array.isArray(languages) && languages.length > 0) {
      languages.map(lng => {
        if (lng.id === id) {
          lng.multilanguage = multiLanguageValue;
        }
        return lng;
      });
      return languages;
    }
    return [];
  }

  /**
   * Action from delete button
   * @param {*} row 
   * @param {*} event 
   */
  const clickDelete = (row, event) => {
    event.preventDefault();
    languages.map(lng => {
      if (lng.id === row.row.id) {
        lng.multilanguage = undefined;
      }
      return lng;
    });
    props.onChange(languages);
    checkEnglishValidationValue();
  };


  /**
   * Actiom from edit button
   * @param {*} row 
   * @param {*} event 
   */
  const clickEdit = (row, event) => {
    event.preventDefault();
    setRowInvocation(row);
    setShowMultiLanguageEdit(true);
  }

  /**
    * Check english language are multilanguage value
    * @param {*} language Language
    * @returns Return true = ok, false = isNull or isUndefined or isEmpty
    */
  const checkEnglishValidation = (language) => {
    if (language && Array.isArray(language) && language.length > 0) {
      let lngEnglish = language.find(lng => lng.id === 'en');
      if (lngEnglish && lngEnglish.multilanguage) {
        return !isNull(lngEnglish.multilanguage)
          && !isUndefined(lngEnglish.multilanguage)
          && !isEmpty(lngEnglish.multilanguage.trim());
      }
    }
    return false;
  }

  /**
   * Check English Validation value from error english message
   */
  const checkEnglishValidationValue = () => {
    let res = checkEnglishValidation(languages);
    setEnglishValue(res);
    return res;
  }

  /**
   * Set multilanguage value to correct language id
   * @param {*} value Multilanguage value
   */
  const changeInputValue = (value) => {
    rowInvocation.row.multilanguage = value;
    let lModifyLanguages = languages;
    if (rowInvocation && rowInvocation.row && rowInvocation.row.id) {
      lModifyLanguages = setMultiLanguageValue2Language(rowInvocation.row.id, value, languages);
    }
    props.onChange(languages);
    props.onValid(checkEnglishValidationValue());
  }

  return (
    <div>
      {showMultilanguageEdit &&
        <ModalPro
          titleHeader={t('TABLE_MULTI_LANGUAGE.EDIT').toLocaleUpperCase()}
          showTextArea={showTextArea}
          showModal={showMultilanguageEdit}
          setShowModal={setShowMultiLanguageEdit}
          saveButtonText={t('TABLE_MULTI_LANGUAGE.SAVE')}
          currentValue={rowInvocation.row.multilanguage}
          onReturn={changeInputValue} />}
      {showPagination &&
        <PaginationProvider pagination={paginationFactory(paginationOptions)}>
          {
            ({
              paginationTableProps
            }) => (
              <div className="p-1">
                <BootstrapTable
                  striped
                  hover
                  keyField='id'
                  data={languages ? languages : []}
                  columns={columns}
                  defaultSortDirection="asc"
                  noDataIndication={t('TABLE_MULTI_LANGUAGE.NO_DATA')}
                  filter={filterFactory()}
                  {...paginationTableProps} />
              </div>
            )
          }
        </PaginationProvider>
      }
      {!showPagination &&
        <BootstrapTable
          striped
          hover
          keyField='id'
          data={languages ? languages : []}
          columns={columns}
          defaultSortDirection="asc"
          noDataIndication={t('TABLE_MULTI_LANGUAGE.NO_DATA')}
          filter={filterFactory()} />
      }
      <div>
        {!englishValue &&
          <h6 style={{ color: "red" }}>{t('TABLE_MULTI_LANGUAGE.ENGLISH_MUST_COMPLETED')}</h6>}
      </div>
    </div>
  );
}

export default withTranslation('global')(TableMultiLanguage);