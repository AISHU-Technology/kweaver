/**
 * 点类、边类属性列表
 */
import React, { useImperativeHandle, forwardRef, useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Select, Checkbox, Button, Tooltip, Popover, message } from 'antd';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import ErrorTip from './ErrorTip';
import PropertyViewer from './PropertyViewer';
import PartPropCard from './PartPropCard';
import { verifyProName, verifyProAlias, verifyProperty } from './assistant';
import { AttributeItem } from '../../types/items';
import './style.less';
import { useLocation } from 'react-router-dom';

const TYPE_LIST = ['boolean', 'date', 'datetime', 'decimal', 'double', 'float', 'integer', 'string'];

export interface PropertyListProps {
  type: 'node' | 'edge';
  // property: AttributeItem[];
  property: any[];
  disabled?: boolean; // 模型编辑禁用, 只禁用部分
  readOnly?: boolean; // 仅查看, 全禁用
  aliasChangeWithName: boolean; // 修改属性名, 显示名同步修改
  setAliasChangeWithName: (bool: boolean) => void;
  onChange: (data: AttributeItem[]) => void;
  onEdit?: (data: AttributeItem, index: number) => void;
  onDelete?: (data: AttributeItem[], index: number) => void;
  updateData?: any;
  errorIndex: number[];
  checkVectorServiceStatus?: () => any;
}

const PropertyTable = (props: PropertyListProps, ref: any) => {
  const firstInputRef = useRef<any>();
  const { type, property, disabled, readOnly, aliasChangeWithName, errorIndex } = props;
  const { onChange, onDelete, onEdit, updateData, setAliasChangeWithName, checkVectorServiceStatus } = props;
  const [checkedError, setCheckedError] = useState<Record<string, string>>({}); // 索引、融合错误
  const [viewData, setViewData] = useState<Record<string, string>>({}); // 查看的属性

  useImperativeHandle(ref, () => ({
    /**
     * 聚焦首个属性名输入框(新增时调用)
     */
    focusFirst: () => {
      firstInputRef.current?.focus();
    },
    /**
     * 触发全部校验
     */
    validateFields: async () => {
      const { property: newPro, checkedError: newError, errorFields } = verifyProperty(property, type);
      onChange(newPro);
      setCheckedError(newError);
      if (_.isEmpty(errorFields)) {
        return Promise.resolve(newPro);
      }
      return Promise.reject({ values: newPro, errorFields });
    }
  }));

  /**
   * 输入值、下拉值变化
   * @param value 变更的值
   * @param field 变更字段
   * @param index 数组下标
   */
  const handleChange = (value: string, field: keyof AttributeItem, index: number) => {
    const newProList = [...property];
    const newProItem = { ...property[index], [field]: value };
    newProList[index] = newProItem;
    if (aliasChangeWithName && index === 0 && field === 'attrName') {
      newProItem.attrDisplayName = value;
    }
    const func = field === 'attrName' ? verifyProName : verifyProAlias;
    const errMsg = func(value, property);
    const newErrContent = { ...(newProItem.error || {}), [field]: errMsg };
    if (aliasChangeWithName && index === 0 && field === 'attrName') {
      const aliasErr = verifyProAlias(value, property);
      newErrContent.attrDisplayName = aliasErr;
    }
    newProItem.error = newErrContent;
    newProList[index] = newProItem;
    onChange(newProList);
  };

  /**
   * 属性索引、融合变化
   * @param checked 是否开启
   * @param index 数组下标
   */
  const handleCheck = (checked: boolean, field: keyof AttributeItem, index: number) => {
    const newProList = [...property];
    const newProItem = { ...property[index], [field]: checked };
    if (field === 'attrVector' && checked) {
      checkVectorServiceStatus?.();
      // 勾选向量时，自动勾选对应索引
      newProItem.attrIndex = true;
    }
    if (field === 'attrIndex' && !checked) {
      // 取消勾选索引，自动取消勾选向量
      newProItem.attrVector = false;
    }

    newProList[index] = newProItem;
    onChange(newProList);

    // 边不用校验索引唯一性
    if (type !== 'node') {
      return;
    }

    let notIndex = !checked;
    if (!checked) {
      notIndex = !newProList.some(item => item[field]);
    }
    if (notIndex || (!notIndex && checkedError[field === 'attrVector' ? 'attrIndex' : field])) {
      const getError = () => {
        if (field === 'attrIndex') {
          return intl.get('createEntity.limitIndex');
        }
        if (field === 'attrMerge') {
          return intl.get('ontoLib.errInfo.oneMerge');
        }
        return '';
      };
      setCheckedError(pre => ({
        ...pre,
        [field === 'attrVector' ? 'attrIndex' : field]: notIndex ? getError() : ''
      }));
    }
  };

  /**
   * 选中属性类型
   * @param type 类型
   * @param index 数组下标
   */
  const handleTypeChange = (type: string, index: number) => {
    const newProList = [...property];
    const newProItem = { ...property[index], attrType: type };
    newProList[index] = newProItem;
    onChange(newProList);
  };

  /**
   * 删除属性
   * @param index 删除的数组下标
   */
  const handleDelete = (index: number) => {
    const newProList = [...property];
    newProList.splice(index, 1);

    // 自动开启第一个索引
    // let notIndex = false;
    // if (type === 'node') {
    //   notIndex = !newProList.some(item => item.attrIndex);
    //   if (notIndex && newProList.length) {
    //     newProList[0].attrIndex = true;
    //     notIndex = false;
    //   }
    // }

    onDelete?.(newProList, index);
  };

  /**
   * 是否可以删除
   */
  const shouldDelete = (index: number) => {
    return !(disabled || readOnly);
    // if (type === 'edge') return !forceDisabled;
    // return !((index === 0 && property.length === 1) || forceDisabled);
  };

  return (
    <div className="flow3-pro-list">
      {!!property.length && (
        <div
          className={classNames(readOnly ? 'attr-th-box-readonly kw-flex' : 'attr-th-box kw-flex', {
            edge: type === 'edge'
          })}
        >
          <div className="th-name">
            <span style={{ color: '#f5222d' }}>* </span>
            {intl.get('ontoLib.canvasOnto.entityAttrName')}
          </div>
          <div className="th-alias">
            <span style={{ color: '#f5222d' }}>* </span>
            {intl.get('ontoLib.canvasOnto.entityAttrDisplayName')}
          </div>
          <div className="th-type">
            <span style={{ color: '#f5222d' }}>* </span>
            {intl.get('ontoLib.canvasOnto.entityAttrType')}
          </div>
          <div className="th-index">{intl.get('ontoLib.canvasOnto.entityAttrIndex')}</div>
          {type === 'node' && <div className="th-vector">{intl.get('ontoLib.canvasOnto.entityAttrVector')}</div>}
          {type === 'node' && <div className="th-merge">{intl.get('ontoLib.canvasOnto.entityAttrMerge')}</div>}
        </div>
      )}

      {_.map(property, (item, index: number) => {
        const { attrName, attrDisplayName, attrType, attrIndex, attrVector, attrMerge, error = {} } = item;
        return (
          <React.Fragment key={String(index)}>
            <div className="attr-rows kw-align-center kw-mt-3">
              <Tooltip title={intl.get('global.delete')}>
                <IconFont
                  type="icon-del"
                  className={classNames('del-icon kw-pointer', { disabled: !shouldDelete(index) })}
                  onClick={() => shouldDelete(index) && handleDelete(index)}
                />
              </Tooltip>

              <div className={readOnly ? 'attr-input' : 'attr-input kw-ml-3'}>
                <ErrorTip errorText={error.attrName}>
                  <Input
                    ref={index === 0 ? firstInputRef : undefined}
                    className={classNames('kw-w-100', {
                      'err-input': error.attrName
                    })}
                    placeholder={intl.get('createEntity.enterAttr')}
                    autoComplete="off"
                    title={error.attrName ? '' : attrName}
                    disabled={disabled || readOnly}
                    value={attrName}
                    onChange={e => handleChange(e.target.value, 'attrName', index)}
                    onBlur={() => {
                      updateData?.();
                    }}
                  />
                </ErrorTip>
              </div>

              <div className="alias-input kw-ml-3">
                <ErrorTip errorText={error.attrDisplayName}>
                  <Input
                    className={classNames('kw-w-100', {
                      'err-input': error.attrDisplayName
                    })}
                    placeholder={intl.get('createEntity.proHolder')}
                    autoComplete="off"
                    title={error.attrDisplayName ? '' : attrDisplayName}
                    disabled={readOnly}
                    value={attrDisplayName}
                    onChange={e => handleChange(e.target.value, 'attrDisplayName', index)}
                    onBlur={() => {
                      updateData?.();
                      if (aliasChangeWithName && index === 0 && attrDisplayName) {
                        setAliasChangeWithName(false);
                      }
                    }}
                  />
                </ErrorTip>
              </div>

              <Select
                className="attr-select kw-ml-3"
                listHeight={32 * 5}
                // getPopupContainer={triggerNode => triggerNode.parentElement}
                value={attrType}
                disabled={disabled || readOnly}
                onChange={value => handleTypeChange(value, index)}
              >
                {_.map(TYPE_LIST, item => (
                  <Select.Option key={item} value={item}>
                    {item}
                  </Select.Option>
                ))}
              </Select>

              <ErrorTip errorText={checkedError.attrIndex}>
                <Checkbox
                  className={classNames('kw-ml-5 kw-mr-4', { 'err-check': checkedError.attrIndex })}
                  checked={attrIndex}
                  disabled={disabled || readOnly}
                  onChange={e => handleCheck(e.target.checked, 'attrIndex', index)}
                />
              </ErrorTip>

              {type === 'node' && (
                <ErrorTip errorText={''}>
                  <Checkbox
                    className={classNames('kw-ml-4 kw-mr-4', { 'err-check': '' })}
                    checked={attrVector}
                    disabled={disabled || readOnly}
                    onChange={e => handleCheck(e.target.checked, 'attrVector', index)}
                  />
                </ErrorTip>
              )}

              {type === 'node' && (
                <ErrorTip errorText={checkedError.attrMerge}>
                  <Checkbox
                    className={classNames('kw-ml-4 kw-mr-4', { 'err-check': checkedError.attrMerge })}
                    checked={attrMerge}
                    disabled={disabled || readOnly}
                    onChange={e => handleCheck(e.target.checked, 'attrMerge', index)}
                  />
                </ErrorTip>
              )}

              {/* <ErrorTip
                errorText={
                  errorIndex.indexOf(index) > -1 ? intl.get('ontoLib.errInfo.attrSynonymsOrDescribeErr') : undefined
                }
              > */}
              {/* <PropertyViewer data={viewData}> */}
              <Popover
                overlayClassName="propCard"
                destroyTooltipOnHide
                onVisibleChange={(v: boolean) => setViewData(v ? item : {})}
                content={<PartPropCard data={viewData} onEdit={() => onEdit?.(item, index)} readOnly={readOnly} />}
                placement="bottomRight"
                trigger={['hover']}
              >
                <Button
                  style={{
                    width: 36,
                    minWidth: 36,
                    border: 0,
                    padding: '4px 10px',
                    color: errorIndex.indexOf(index) > -1 ? '#f5222d' : undefined
                  }}
                >
                  <IconFont type="icon-jindu" />
                </Button>
              </Popover>
              {/* </PropertyViewer> */}
              {/* </ErrorTip> */}

              <Button
                style={{
                  width: 36,
                  minWidth: 36,
                  border: 0,
                  padding: '4px 10px',
                  display: readOnly ? 'none' : undefined
                }}
                onClick={() => onEdit?.(item, index)}
                disabled={readOnly}
              >
                <IconFont type="icon-edit" />
              </Button>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default forwardRef(PropertyTable);
