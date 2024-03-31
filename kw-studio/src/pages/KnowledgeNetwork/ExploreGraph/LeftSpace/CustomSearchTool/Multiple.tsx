/**
 * 多个参数
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from 'antd';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import HOOKS from '@/hooks';
import Format from '@/components/Format';
import ExplainTip from '@/components/ExplainTip';
import { paramPolyfill } from '@/components/ParamCodeEditor';
import { ParamItem } from '@/components/ParamCodeEditor/type';
import EntitySelector from '../components/EntitySelector';
import { CustomSearchToolProps } from './index';

import AddTypeSelector, {
  ADD_TYPES_SIMPLE
} from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/AddTypeSelector';

const Multiple = (props: CustomSearchToolProps) => {
  const { className, zIndex = 9, myStyle, visible, data, hideExpandIcon, canvasInstance } = props;
  const { onChange, onSearch, onVisibleChange } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollDOM, setScrollDOM] = useState<HTMLDivElement | null>(null);
  const [paramList, setParamList] = useState<ParamItem[]>(() => paramPolyfill(_.cloneDeep(data.parameters)));
  const [addType, setAddType] = useState(ADD_TYPES_SIMPLE.ADD); // 添加方式
  const size = HOOKS.useWindowSize(); // 取值无意义, 只是为了在窗口变化时触发render

  useEffect(() => {
    setParamList(paramPolyfill(_.cloneDeep(data.parameters)));
  }, [data?.parameters]);

  /**
   * 参数信息未填写全，【搜索】按钮禁用
   */
  const isBtnDisabled = () => {
    return _.some(paramList, item => _.isEmpty(item.input));
  };

  /**
   * `回车`触发搜索
   */
  const handlePressEnter = () => {
    if (isBtnDisabled()) return;
    handleSearch();
  };

  /**
   * 字符串参数
   * @param value 输入值
   * @param index 参数索引
   */
  const handleInputChange = (value: string, index: number) => {
    const newData = _.map(paramList, (item, i) => (i === index ? { ...item, input: value } : item));
    setParamList(newData);
    onChange?.(newData, newData[index]);
  };

  /**
   * 实体参数变化回调
   * @param data 选择数据
   * @param index 参数索引
   */
  const handleSelectChange = (data: { input?: string | string[]; nodes?: Record<string, any>[] }, index: number) => {
    const newData = _.map(paramList, (item, i) => (i === index ? { ...item, ...data } : item));
    setParamList(newData);
    onChange?.(newData, newData[index]);
  };

  /**
   * 处理搜索的逻辑
   */
  const handleSearch = () => {
    onSearch?.(paramList, addType);
  };

  /**
   * 处理实体类型的搜索逻辑
   */
  const handleSelectSearch = (action: 'add' | 'cover', value: string | string[], index: number) => {
    const newData = _.map(paramList, (item, i) => (i === index ? { ...item, input: value } : item));
    setParamList(newData);
    onChange?.(newData, newData[index]);
    onSearch?.(newData, action);
  };

  // 滚动时关闭下拉
  const forceBlur = (e: any) => {
    if (document.activeElement?.tagName !== 'BODY' && document.activeElement?.classList?.contains('compos-input')) {
      (document.activeElement as HTMLElement)?.blur();
    }
  };

  return (
    <div
      ref={containerRef}
      className={classNames(className, 'canvas-search-tool-multiple-root', !visible && 'close')}
      style={{ ...myStyle, zIndex }}
    >
      {!hideExpandIcon && (containerRef.current?.clientHeight || 0) > 160 && (
        <div className="close-bar" onClick={() => onVisibleChange?.(!visible)}>
          <LeftOutlined rotate={visible ? 0 : 180} />
        </div>
      )}

      <div className="content-wrap kw-h-100">
        <div className="t-header kw-space-between">
          <Format.Title>{intl.get('function.query')}</Format.Title>
          <div className="close-mask kw-pointer" onClick={() => onVisibleChange?.(false)}>
            <CloseOutlined />
          </div>
        </div>

        <div ref={setScrollDOM} className="param-list" onScroll={forceBlur}>
          {_.map(paramList, (item, index) => {
            const { name, example, alias, description, input, nodes = [], options, param_type } = item;

            return (
              <div key={item.name} className="param-item kw-mt-6">
                <div className="p-label kw-c-header kw-mb-2" title={alias}>
                  <div className="p-text kw-ellipsis"> {alias}</div>
                  <ExplainTip
                    overlayClassName="canvas-search-tool-tip"
                    title={
                      <>
                        <div>{`${intl.get('function.paramName')}：${name}`}</div>
                        <div>{description || intl.get('global.notDes')}</div>
                      </>
                    }
                  />
                </div>

                {param_type === 'string' && (
                  <Input
                    placeholder={`${intl.get('function.example')}：${example}`}
                    allowClear
                    value={input}
                    onChange={e => handleInputChange(e.target.value, index)}
                    onPressEnter={handlePressEnter}
                  />
                )}

                {param_type === 'entity' && (
                  <EntitySelector
                    tags={item?.entity_classes}
                    canvasInstance={canvasInstance}
                    placeholder={intl.get('analysisService.entityPlace', { alias })}
                    multiple={options === 'multiple'}
                    hideSearchBtn
                    value={options === 'multiple' ? nodes : nodes[0]}
                    onSearch={(action, value) => handleSelectSearch(action, value, index)}
                    onChange={data => handleSelectChange(data, index)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="kw-mt-6 kw-pl-6 kw-pr-6">
          <AddTypeSelector mode="simple" value={addType} onChange={setAddType} />
        </div>

        <div
          className={classNames('f-btn', { fixed: (scrollDOM?.scrollHeight || 0) > (scrollDOM?.clientHeight || 0) })}
        >
          <Button type="primary" block disabled={isBtnDisabled()} onClick={handleSearch}>
            {intl.get('function.query')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Multiple;
