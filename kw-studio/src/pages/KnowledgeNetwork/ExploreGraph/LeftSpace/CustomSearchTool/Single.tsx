/**
 * 单个参数
 */
import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { DoubleRightOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import { paramPolyfill } from '@/components/ParamCodeEditor';
import EntitySelector from '../components/EntitySelector';
import { CustomSearchToolProps } from './index';

const Single = (props: CustomSearchToolProps) => {
  const { className, triggerHeight, zIndex = 9, myStyle, canvasInstance, visible, data, readOnly } = props;
  const { onChange, onSearch, onVisibleChange } = props;
  const [paramItem, setParamItem] = useState<ParamItem>(() => paramPolyfill(_.cloneDeep(data?.parameters))?.[0] || {});

  useEffect(() => {
    setParamItem(paramPolyfill(_.cloneDeep(data?.parameters))?.[0] || {});
  }, [data?.parameters]);

  /**
   * 显示占位符: 请输入`alias`（示例：`example`）
   */
  const showSinglePlaceholder = (data: ParamItem) => {
    if (data.param_type === 'string') {
      return `${intl.get('global.pleaseEnter')}${data.alias}（${intl.get('function.example')}：${data.example}）`;
    }
    if (data.param_type === 'entity') {
      return intl.get('function.PleaseSelectEntity');
    }
  };

  /**
   * 字符串参数
   * @param e
   */
  const handleInputChange = (e: any) => {
    const { value } = e.target;
    const newItem = { ...paramItem, input: value };
    setParamItem(newItem);
    onChange?.([newItem], newItem);
  };

  /**
   * 实体参数变化
   * @param value
   */
  const handleSelectChange = (data: { input?: string | string[]; nodes?: Record<string, any>[] }) => {
    const newItem = { ...paramItem, ...data };
    setParamItem(newItem);
    onChange?.([newItem], newItem);
  };

  /**
   * 处理字符类型的搜索逻辑
   */
  const handleInputSearch = () => {
    if (_.isEmpty(paramItem.input)) return;
    onSearch?.([paramItem]);
  };

  /**
   * 处理实体类型的搜索逻辑
   */
  const handleSelectSearch = (action: 'add' | 'cover', value: string | string[]) => {
    const newItem = { ...paramItem, input: value };
    setParamItem(newItem);
    onChange?.([newItem], newItem);
    onSearch?.([newItem], action);
  };

  return (
    <div
      className={classNames(className, 'canvas-search-tool-single-root', !visible && 'close')}
      style={{ ...myStyle, zIndex }}
    >
      <div style={{ display: visible ? undefined : 'none' }}>
        {paramItem.param_type === 'string' && (
          <Input
            placeholder={showSinglePlaceholder(paramItem)}
            suffix={
              <IconFont
                type="icon-sousuo"
                className={classNames('s-icon kw-ml-2', { disabled: !paramItem.input })}
                onClick={handleInputSearch}
              />
            }
            allowClear
            readOnly={readOnly}
            onPressEnter={handleInputSearch}
            value={paramItem.input}
            onChange={handleInputChange}
          />
        )}
        {paramItem.param_type === 'entity' && (
          <EntitySelector
            tags={paramItem?.entity_classes}
            canvasInstance={canvasInstance}
            readOnly={readOnly}
            triggerHeight={triggerHeight}
            placeholder={intl.get('analysisService.entityPlace', { alias: paramItem.alias })}
            multiple={paramItem.options === 'multiple'}
            value={paramItem.options === 'multiple' ? paramItem.nodes : paramItem.nodes?.[0]}
            onSearch={handleSelectSearch}
            onChange={handleSelectChange}
          />
        )}
      </div>

      <div
        className="s-close"
        style={{ display: !visible ? undefined : 'none' }}
        onClick={() => onVisibleChange?.(true)}
      >
        <DoubleRightOutlined />
      </div>
    </div>
  );
};

export default Single;
