/* eslint-disable */
/**
 * 属性配置
 */
import React, { useEffect, useState, useRef } from 'react';
import intl from 'react-intl-universal';
import { Select, Input, ConfigProvider, Empty, message } from 'antd';

import ScrollBar from '@/components/ScrollBar';
import IconFont from '@/components/IconFont';

import emptyImg from '@/assets/images/empty.svg';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

const SetAttr = props => {
  const { showIndex, entity, setEntity, isError, setIsError, errMsg, setErrMsg, errIndex, setErrIndex } = props;
  const attrScrollRef = useRef(); // 滚动条ref
  const preIndex = useRef(); // 上一次激活的点类索引
  const [attrList, setAttrList] = useState([]); // 属性列表
  const [properties, setProperties] = useState([]); // 配置列表

  const ENPTYERR = intl.get('workflow.conflation.enptyErr'); // 定义错误信息“空”
  const REPEATERR = intl.get('workflow.conflation.repeatErr'); // 定义错误信息“重复”
  const DELSUCCESS = intl.get('workflow.conflation.delSuccess'); // 定义“删除成功”

  // 切换点类时展开相应的信息
  useEffect(() => {
    if (entity.length > 0 && entity[showIndex]) {
      setProperties(entity[showIndex].properties);
      if (attrScrollRef.current && showIndex !== preIndex.current) {
        setAttrList(entity[showIndex].attrList);
        attrScrollRef.current.scrollbars.scrollToTop();
      }
    }

    if (showIndex !== preIndex.current) preIndex.current = showIndex;
  }, [showIndex, entity]);

  /**
   * @description 自定义结果空白页
   */
  const customizeRenderEmpty = () => (
    <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', textAlign: 'center', marginBottom: 30 }}>
      <Empty image={kongImg} description={[intl.get('createEntity.noData')]} style={{ marginTop: 10 }} />
    </div>
  );

  /**
   * @description 点击新增属性配置
   */
  const onAddClick = () => {
    if (isError) return;

    if (properties[properties.length - 1] && !properties[properties.length - 1].property) {
      setIsError(true);
      setErrIndex(properties.length - 1);
      setErrMsg(ENPTYERR);
      setTimeout(() => {
        if (attrScrollRef.current) attrScrollRef.current.scrollbars.scrollToBottom();
      }, 0);
      return;
    }

    updateProperties([
      ...properties,
      {
        property: undefined,
        function: 'equality'
      }
    ]);

    setTimeout(() => {
      if (attrScrollRef.current) attrScrollRef.current.scrollbars.scrollToBottom();
    }, 0);
  };

  /**
   * @description 更新属性配置
   * @param {Array} properties
   */
  const updateProperties = properties => {
    const _entity = [...entity];

    if (!_entity[showIndex]) return;

    _entity[showIndex].properties = properties;
    setEntity(_entity);
  };

  /**
   * @description 下拉选择属性
   * @param {string} value 选择的值
   * @param {Array} properties 属性配置列表
   * @param {number} index 配置的索引
   */
  const onAttrSelect = (value, properties, index) => {
    properties[index].property = value;

    updateProperties(properties);

    if (properties.filter(pro => pro.property === value).length > 1) {
      setIsError(true);
      setErrIndex(index);
      setErrMsg(REPEATERR);
      return;
    }

    if (isError) {
      setIsError(false);
      setErrIndex(-1);
      setErrMsg('');
    }
  };

  /**
   * @description 删除配置的属性
   * @param {Array} properties 属性配置列表
   * @param {number} index 配置的索引
   */
  const onDelClick = (properties, index) => {
    let pro = properties.filter((item, i) => i !== index);
    updateProperties(pro);
    message.success(DELSUCCESS);

    if (isError && index !== errIndex) {
      let i = index > errIndex ? errIndex : errIndex - 1;
      setErrIndex(i);
    }

    if (
      isError &&
      (index === errIndex || // 刚好删除了错误项, 直接解除错误
        properties.filter(pro => pro.property === properties[index].property).length > 1) // 刚好删除了重复项, 直接解除错误
    ) {
      setIsError(false);
      setErrIndex(-1);
      setErrMsg('');
    }
  };

  /**
   * select下拉框展开回调
   * @param {Boolean} open 是否展开
   * @param {Array} properties 属性配置列表
   * @param {number} index 配置的索引
   */
  const onDropdown = (open, properties, index) => {
    if (open) {
      if (
        index !== properties.length - 1 &&
        properties[properties.length - 1] &&
        properties[properties.length - 1].property === undefined
      ) {
        setIsError(true);
        setErrIndex(properties.length - 1);
        setErrMsg(ENPTYERR);

        setTimeout(() => {
          if (attrScrollRef.current) attrScrollRef.current.scrollbars.scrollToBottom();
        }, 0);
      }
    }
  };

  return (
    <div className="set-attr-box">
      <div className="config-title">
        <h1 className="title">
          <span className="word">{intl.get('workflow.conflation.attrTitle')}</span>
          <span className="config-tip">{intl.get('workflow.conflation.attrsubTitle')}</span>
          <span className="add-btn" onClick={onAddClick}>
            <IconFont type="icon-Add" />
            <span className="add-btn-span">{intl.get('workflow.conflation.add')}</span>
          </span>
        </h1>
      </div>
      <div></div>
      <div className="config-content">
        <div className="config-header">
          <span className="header-item relation">{intl.get('workflow.conflation.condition')}</span>
          <span className="header-item vertexs-h">{intl.get('workflow.conflation.vertexTh')}</span>
          <span className="header-item similarity-h">{intl.get('workflow.conflation.functionTh')}</span>
          <span className="header-item operation-h">{intl.get('workflow.conflation.operationTh')}</span>
        </div>

        <div className="set-attr-area">
          <ScrollBar isshowx="false" color="rgb(184,184,184)" ref={attrScrollRef} className="mix-attr-scroll">
            {properties.length > 0 ? (
              properties.map((pro, proIndex) => {
                return (
                  <div className="attr-row" key={pro.property + proIndex || 'no-pro'}>
                    <div className="attr-item">
                      <div className="relation">
                        {proIndex === 0 ? (
                          <div className="relation-select">{intl.get('workflow.conflation.satisfy')}</div>
                        ) : (
                          <Select className="relation-select" value="and" disabled={true}>
                            <Select.Option value="and" key="and">
                              {intl.get('workflow.conflation.and')}
                            </Select.Option>
                          </Select>
                        )}
                      </div>
                      <div className="vertex-select">
                        <ConfigProvider renderEmpty={customizeRenderEmpty}>
                          <Select
                            key={'select' + pro.property + proIndex || 'no-select'}
                            showSearch
                            allowClear
                            virtual={false}
                            className={isError && proIndex === errIndex ? 'attr-err' : 'vertex-selector '}
                            placeholder={intl.get('workflow.conflation.inputAndSelect')}
                            listHeight={32 * 5} // 1条选项heigh=32px, 最多显示5条
                            value={pro.property}
                            disabled={isError && proIndex !== errIndex}
                            onSelect={value => onAttrSelect(value, properties, proIndex)}
                            getPopupContainer={triggerNode => triggerNode.parentElement}
                            onDropdownVisibleChange={open => onDropdown(open, properties, proIndex)}
                          >
                            {attrList.map(attr => {
                              return (
                                <Option value={attr} key={attr}>
                                  {attr}
                                </Option>
                              );
                            })}
                          </Select>
                        </ConfigProvider>
                      </div>

                      <div className="similarity-input">
                        <Input autoComplete="off" disabled value={intl.get('workflow.conflation.equal')} />
                      </div>

                      <span className="operation-span" onClick={() => onDelClick(properties, proIndex)}>
                        {intl.get('workflow.conflation.delete')}
                      </span>
                    </div>

                    <div className="err-info">{isError && proIndex === errIndex ? errMsg : ''}</div>
                  </div>
                );
              })
            ) : (
              <div className="no-attr">
                <img className="none-img" src={emptyImg} alt="nodata" />
                <p className="none-info">
                  {intl.get('workflow.conflation.pleaseAdd').split('|')[0]}
                  <span className="create-span" onClick={onAddClick}>
                    {intl.get('workflow.conflation.pleaseAdd').split('|')[1]}
                  </span>
                  {intl.get('workflow.conflation.pleaseAdd').split('|')[2]}
                </p>
              </div>
            )}
          </ScrollBar>
        </div>
      </div>
    </div>
  );
};

export default SetAttr;
