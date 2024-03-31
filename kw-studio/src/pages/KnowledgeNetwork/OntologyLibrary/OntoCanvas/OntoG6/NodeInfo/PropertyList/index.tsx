/**
 * 点类、边类属性列表
 */
import React, { useImperativeHandle, forwardRef, useMemo, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Switch, Select } from 'antd';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { verifyProName, verifyProAlias, verifyProperty } from './assistant';
import { PropertyItem } from '../../types/items';
import './style.less';

const TYPE_LIST = ['boolean', 'date', 'datetime', 'decimal', 'double', 'float', 'integer', 'string'];

export interface PropertyListProps {
  type: 'node' | 'edge';
  property: PropertyItem[];
  errorData: Record<string, any>;
  page: number;
  PAGESIZE: number;
  disabled?: boolean;
  forceDisabled?: boolean;
  aliasChangeWithName: boolean; // 修改属性名, 显示名同步修改
  setAliasChangeWithName: (bool: boolean) => void;
  onChange: (data: PropertyItem[]) => void;
  onTypeChange: (data: PropertyItem[]) => void;
  onIndexesChange: (data: PropertyItem[]) => void;
  onError?: (data: any) => void;
  onDelete?: (data: PropertyItem[], index: number) => void;
  onBlur?: () => void;
  updateData?: any;
}

const PropertyList = (props: PropertyListProps, ref: any) => {
  const lastInputRef = useRef<any>();
  const { type, page, property, errorData, PAGESIZE, forceDisabled, aliasChangeWithName } = props;
  const { onChange, onTypeChange, onIndexesChange, onError, onDelete, updateData, setAliasChangeWithName } = props;
  const { isErr, content: errContent, errIndex } = errorData || {};
  const [showProperty, startIndex] = useMemo(() => {
    const curPage = page || 1;
    const startIndex = (curPage - 1) * PAGESIZE;
    const endIndex = curPage * PAGESIZE;
    return [_.slice(property, startIndex, endIndex), startIndex, endIndex];
  }, [property, page, PAGESIZE]);

  useImperativeHandle(ref, () => ({
    /**
     * 聚焦最后一个属性名输入框(新增时调用)
     */
    focusLast: () => {
      lastInputRef.current?.focus();
    }
  }));

  /**
   * 输入值、下拉值变化
   * @param value 变更的值
   * @param field 变更字段
   * @param index 数组下标
   */
  const handleChange = (value: string, field: keyof PropertyItem, index: number) => {
    const newProList = [...property];
    const newProItem = { ...property[index], [field]: value };
    if (aliasChangeWithName && index === property.length - 1 && field === 'name') {
      newProItem.alias = value;
    }
    newProList[index] = newProItem;
    onChange(newProList);
    const func = field === 'name' ? verifyProName : verifyProAlias;
    const errMsg = func(value, property);
    const newErrContent = { ...(errContent || {}), [field]: errMsg };
    if (aliasChangeWithName && index === property.length - 1 && field === 'name') {
      const aliasErr = verifyProAlias(value, property);
      newErrContent.alias = aliasErr;
    }
    const hasErr = _.some(_.values(newErrContent), msg => !!msg);
    onError?.({
      ...errorData,
      isErr: hasErr,
      content: hasErr ? newErrContent : null,
      errIndex: hasErr ? index : -1
    });
  };

  /**
   * 属性索引变化
   * @param checked 是否开启属性索引
   * @param index 数组下标
   */
  const handleCheck = (checked: boolean, index: number) => {
    const newProList = [...property];
    const newProItem = { ...property[index], checked };
    newProList[index] = newProItem;
    onIndexesChange(newProList);

    if (type !== 'node') return;

    let notIndex = !checked;
    if (!checked) {
      notIndex = !newProList.some(item => item.checked);
    }
    onError?.({ ...errorData, notIndex });
  };

  /**
   * 选中属性类型
   * @param type 类型
   * @param index 数组下标
   */
  const handleTypeChange = (type: string, index: number) => {
    const newProList = [...property];
    const newProItem = { ...property[index], type };
    newProList[index] = newProItem;
    onTypeChange(newProList);
  };

  /**
   * 删除属性
   * @param index 删除的数组下标
   */
  const handleDelete = (index: number) => {
    const newProList = [...property];
    newProList.splice(index, 1);

    let notIndex = false;

    // 自动开启第一个索引
    if (type === 'node') {
      notIndex = !newProList.some(item => item.checked);
      if (notIndex && newProList.length) {
        newProList[0].checked = true;
        notIndex = false;
      }
    }

    // 如果删除的项是出错的项，则重置错误状态, 否则更新错误的数组下标
    if (index === errorData.errIndex) {
      // 删除后再校验剩余的
      const { errIndex, errMsg } = verifyProperty(newProList);
      if (errIndex < 0) {
        onError?.({
          isErr: false,
          content: null,
          errIndex: -1,
          notIndex
        });
      } else {
        onError?.({
          isErr: true,
          content: errMsg,
          errIndex,
          notIndex
        });
      }
    } else {
      errorData.isErr &&
        onError?.({
          ...errorData,
          errIndex: index > errorData.errIndex ? errorData.errIndex : errorData.errIndex - 1,
          notIndex
        });
    }

    onDelete?.(newProList, index);
  };

  /**
   * 是否可以删除
   */
  const shouldDelete = (index: number) => {
    if (type === 'edge') return !forceDisabled;
    return !((index === 0 && showProperty.length === 1) || forceDisabled);
  };

  return (
    <div className="flow3-pro-list">
      {showProperty?.length > 0 &&
        _.map(showProperty, (item, index: number) => {
          const { name, alias, type, checked } = item;
          const curIndex = startIndex + index;
          return (
            <React.Fragment key={String(index)}>
              <div className="attr-rows kw-flex kw-mt-4">
                <IconFont
                  type="icon-remove"
                  className={classNames('kw-mt-2', shouldDelete(curIndex) ? 'delete' : 'no-delete')}
                  onClick={() => shouldDelete(curIndex) && handleDelete(curIndex)}
                />
                <div className="attr-input kw-ml-3">
                  <Input
                    ref={curIndex === property.length - 1 ? lastInputRef : undefined}
                    className={classNames('kw-w-100', {
                      'err-input': isErr && errIndex === curIndex && errContent?.name
                    })}
                    placeholder={intl.get('createEntity.enterAttr')}
                    autoComplete="off"
                    title={name}
                    value={name}
                    disabled={forceDisabled || (isErr && curIndex !== errIndex)}
                    onChange={e => handleChange(e.target.value, 'name', curIndex)}
                    onBlur={() => updateData?.('isBatch')}
                  />
                  {errIndex === curIndex && errContent?.name && <div className="error-content">{errContent?.name}</div>}
                </div>

                <div className="alias-input kw-ml-3">
                  <Input
                    className={classNames('kw-w-100', {
                      'err-input': isErr && errIndex === curIndex && errContent?.alias
                    })}
                    placeholder={intl.get('createEntity.proHolder')}
                    autoComplete="off"
                    title={alias}
                    value={alias}
                    disabled={isErr && curIndex !== errIndex}
                    onChange={e => handleChange(e.target.value, 'alias', curIndex)}
                    onBlur={() => {
                      updateData?.('isBatch');
                      if (aliasChangeWithName && curIndex === property.length - 1 && alias) {
                        setAliasChangeWithName(false);
                      }
                    }}
                  />
                  {errIndex === curIndex && errContent?.alias && (
                    <div className="error-content">{errContent?.alias}</div>
                  )}
                </div>

                <Select
                  className="attr-select kw-ml-3"
                  listHeight={32 * 5}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  value={type}
                  disabled={forceDisabled}
                  onChange={value => handleTypeChange(value, curIndex)}
                >
                  {_.map(TYPE_LIST, item => (
                    <Select.Option key={item} value={item}>
                      {item}
                    </Select.Option>
                  ))}
                </Select>
                <Switch className="kw-ml-3 kw-mt-1" checked={checked} onClick={value => handleCheck(value, curIndex)} />
              </div>
            </React.Fragment>
          );
        })}
    </div>
  );
};

export default forwardRef(PropertyList);
