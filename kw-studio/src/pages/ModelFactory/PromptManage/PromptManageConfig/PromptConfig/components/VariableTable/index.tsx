import React, { useState, useEffect } from 'react';
import { Input, Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import Format from '@/components/Format';
import ComposInput from '@/components/ComposInput';

import VariableModal from '../VariableModal';
import { verifyVariables } from './nameValidator';
import { TVariables } from '../../../types';
import './style.less';

import ErrorTip from '@/pages/KnowledgeNetwork/OntologyLibrary/OntoCanvas/OntoG6/components/PropertyTable/ErrorTip';
import { getParam } from '@/utils/handleFunction';

export interface VariableTableProps {
  className?: string;
  variables: TVariables;
  disabled?: boolean;
  onAdd?: (data: TVariables) => void;
  onChange?: (newList: TVariables, changedKey: keyof TVariables[number], changedIndex: number) => void;
  onDelete?: (data: TVariables[number], index: number) => void;
}

/**
 * 变量表格
 */
const VariableTable = (props: VariableTableProps) => {
  const { className, variables, disabled, onAdd, onChange, onDelete } = props;
  const [opController, setOpController] = useState({ visible: false, action: '', data: {} as any });
  const closeModal = () => setOpController({ visible: false, action: '', data: {} });
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    const action = getParam('action');
    setActionType(action);
  }, []);

  const clickAdd = () => {
    setOpController({ visible: true, action: 'create', data: {} });
  };

  const clickEdit = (data: TVariables[number]) => {
    if (disabled) return;
    setOpController({ visible: true, action: 'edit', data });
  };

  const handleChange = (key: keyof TVariables[number], value: any, index: number) => {
    let newVar = [...variables];
    const newItem = { ...variables[index], [key]: value };
    newVar[index] = newItem;

    if (['var_name', 'field_name'].includes(key)) {
      newVar = verifyVariables(newVar);
    }
    onChange?.(newVar, key, index);
  };

  const handleDelete = (data: TVariables[number], index: number) => {
    if (disabled) return;
    onDelete?.(data, index);
  };

  const onAfterOk = (data: TVariables[number], action: string) => {
    closeModal();
    if (action === 'create') {
      return onAdd?.([data]);
    }
    const index = _.findIndex(variables, v => v.id === data.id);
    const newVar = [...variables];
    newVar[index] = data;
    return onChange?.(newVar, 'var_name', index);
  };

  const tip = (
    <>
      {intl.get('prompt.varWarning3')}
      {/* &nbsp;
      <IconFont type="icon-tongbubianliang1" />
      &nbsp;
      {intl.get('prompt.var')}
      {intl.get('prompt.varWarning2')} */}
    </>
  );
  const btnStyles = { cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1 };
  return (
    <div
      className={classNames(className, 'manage-mf-prompt-variable-table', {
        'mf-prompt-manage-variable-table-root-other': variables?.length
      })}
    >
      <div className="table-title kw-space-between">
        <div className="kw-align-center">
          {/* <IconFont type="icon-bianliang" className="kw-c-warning" style={{ fontSize: 16 }} /> */}
          <div>{intl.get('prompt.var')}</div>
          <ExplainTip title={tip} />
        </div>
      </div>
      {variables?.length ? (
        <div className="variable-table-box">
          <div className="var-th kw-align-center">
            <div className="th-name">{intl.get('prompt.varName')}</div>
            <div className="th-alias">{intl.get('prompt.fieldName')}</div>
            <div className="th-switch">{intl.get('prompt.required')}</div>
            {actionType && <div className="th-op">{intl.get('global.operation')}</div>}
          </div>
          {_.map(variables, (item, index) => {
            return (
              <div key={item.id} className="tb-row kw-align-center">
                <div className="td-name kw-align-center">
                  {/* <IconFont type="icon-bianliangwenben" className="kw-mr-1" /> */}
                  <ErrorTip errorText={item.error?.var_name}>
                    <Input
                      className={classNames({ 'err-input': item.error?.var_name })}
                      size="small"
                      value={item.var_name}
                      placeholder="key"
                      readOnly={disabled}
                      onChange={e => {
                        const value = e.target.value.replace(/[\u4e00-\u9fa5]/g, '');
                        handleChange('var_name', value, index);
                      }}
                    />
                  </ErrorTip>
                </div>
                <div className="td-alias kw-align-center">
                  <ErrorTip errorText={item.error?.field_name}>
                    <ComposInput
                      className={classNames({ 'err-input': item.error?.field_name })}
                      useAntd
                      size={'small' as any}
                      value={item.field_name}
                      placeholder={intl.get('global.pleaseEnter')}
                      readOnly={disabled}
                      maxLength={50}
                      onChange={e => handleChange('field_name', e.target.value, index)}
                    />
                  </ErrorTip>
                </div>
                <div className="td-switch kw-align-center">
                  <Switch
                    size="small"
                    checked={!item.optional}
                    disabled={disabled}
                    onChange={checked => handleChange('optional', !checked, index)}
                  />
                </div>
                <div className="td-op kw-align-center">
                  <Tooltip title={intl.get('prompt.varSetting')}>
                    <IconFont
                      type="icon-setting"
                      className="kw-mr-3"
                      style={btnStyles}
                      onClick={() => clickEdit(item)}
                    />
                  </Tooltip>
                  <Tooltip title={intl.get('global.delete')}>
                    <IconFont type="icon-lajitong" style={btnStyles} onClick={() => handleDelete(item, index)} />
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="kw-c-subtext" style={{ fontSize: 12 }}>
          {tip}
        </div>
      )}

      {!disabled && (
        <div
          className={classNames(
            'kw-c-text-link kw-mt-2 kw-pt-2',
            variables?.length ? 'kw-align-center kw-c-primary' : 'kw-center add-border'
          )}
          onClick={clickAdd}
        >
          <IconFont type="icon-Add" />
          <span className="kw-ml-2">{intl.get('prompt.addVariable')}</span>
        </div>
      )}

      <VariableModal {...opController} variables={variables} onOk={onAfterOk} onCancel={closeModal} />
    </div>
  );
};

export default VariableTable;
