import React, { useEffect, useMemo, useRef } from 'react';
import { Select, Tooltip, message, Divider, Popconfirm } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import ExplainTip from '@/components/ExplainTip';
import IconFont from '@/components/IconFont';
import { ANALYSIS_PROPERTIES } from '@/enums';

// import SelectorClass from '../ClassSelector';
import SelectorClass from '@/components/ClassSelector';
import PropertyFilter from '../PropertyFilter';
import { RELATION, GROUPCONDITIONS, defaultOperator, FILTER_TYPE, groupType, GROUP_RELATION } from '../enums';

import { TYPEFILTER } from '../type';
import kongImg from '@/assets/images/kong.svg';

import './style.less';

type TypeRuleList = {
  hasTip: boolean; // 同时配置点和边需要提示
  searchRules: any;
  filterType: TYPEFILTER;
  ontoData: any;
  onChangeRules: (data: any) => void;
};
const { SATISFY_ALL, SATISFY_ANY, UNSATISFY_ALL, UNSATISFY_ANY } = GROUP_RELATION;
const RuleList = (props: TypeRuleList) => {
  const { searchRules, filterType, ontoData, hasTip, onChangeRules } = props;
  const ontoType = useMemo(() => (filterType === FILTER_TYPE?.v ? 'entity' : 'edge'), [filterType]);
  const ruleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSortProperty(); // 默认进来排序
  }, []);

  /** 整理类下属性顺序 */
  const onSortProperty = () => {
    const filter = _.cloneDeep(searchRules);
    const rules = _.map(filter[filterType], item => {
      const properties = _.sortBy(item.property_filters, e => e.name);
      return { ...item, property_filters: properties };
    });
    onChangeRules(rules);
  };

  /** 切换类 */
  const onChangeRuleGroup = async (tagId: string, data: any) => {
    try {
      const list = _.map(searchRules?.[filterType], item => {
        if (item?.id === tagId) {
          const { id, relation, type } = item;
          const changeItem: any = {
            id,
            relation,
            type,
            error: false,
            dataSource: data,
            property_filters: [],
            selfProperties: data.properties || []
          };
          if (filterType === FILTER_TYPE?.v) changeItem.tag = data.name;
          if (filterType === FILTER_TYPE?.e) changeItem.edge_class = data.name;
          return changeItem;
        }
        return item;
      });
      onChangeRules(list);
    } catch (error) {
      if (error.type === 'message' && error?.response?.Description) {
        message.error(error?.response?.Description);
      }
    }
  };

  /** 新增组 */
  const onAddRuleGroup = () => {
    const id = _.uniqueId('tag');
    if (_.isEmpty(ontoData?.[ontoType])) return;
    const data = ontoData?.[ontoType]?.[0];

    const config: any = {
      id,
      relation: defaultOperator?.AND,
      type: defaultOperator.SATISFY_ALL,
      error: false,
      dataSource: data,
      property_filters: [],
      selfProperties: data?.properties
    };
    if (filterType === FILTER_TYPE?.v) config.tag = data?.name;
    if (filterType === FILTER_TYPE?.e) config.edge_class = data?.name;

    const filter = _.concat(searchRules?.[filterType] || [], [config]);
    onChangeRules(filter);
  };

  // 改变某个筛选属性
  const addOrChangeProperty = (id: any, proId: string, data: any, op = 'change') => {
    const rules = _.map(searchRules?.[filterType], item => {
      const result = item;
      if (id === item?.id) {
        if (op === 'change') {
          result.property_filters = _.map(item.property_filters, rule => {
            if (proId === rule?.proId) {
              return { ...rule, ...data };
            }
            return rule;
          });
        } else {
          const proId = _.uniqueId('pro');
          const op_value = data?.type === 'boolean' ? 'true' : '';
          item.property_filters = [
            ...item.property_filters,
            {
              proId,
              name: data?.name,
              operation: defaultOperator?.EQUALS_TO,
              op_value,
              property_type: data?.type
            }
          ];
        }
      }
      return result;
    });
    onChangeRules(rules);
  };

  /** 删除全部组 */
  const onDeleteAll = () => {
    onChangeRules([]);
  };

  /** 删除某项筛选属性 */
  const onDeleteProperty = (id: any, index: number) => {
    const filter = _.cloneDeep(searchRules);

    const list = _.map(filter?.[filterType], item => {
      if (id === item.id) {
        item?.property_filters.splice(index, 1);
      }
      return item;
    });
    onChangeRules(list);
  };

  /** 删除一个规则组 */
  const onDeleteRuleGroup = (id: any) => {
    const list = _.filter(searchRules?.[filterType], item => item?.id !== id);
    onChangeRules(list);
  };

  /** 切换组之间的关系 */
  const onChangeRelation = (id: any, relation: any) => {
    const filter = _.cloneDeep(searchRules);
    const rules = _.map(filter[filterType], item => {
      if (id === item?.id) return { ...item, relation };
      return item;
    });
    onChangeRules(rules);
  };

  /** 规则中属性之间的关系 */
  const onChangeProRelation = (id: any, value: any, key: string) => {
    const filter = _.cloneDeep(searchRules);
    const rules = _.map(filter[filterType], item => {
      if (id === item?.id) {
        const getRelation: Record<string, any> = {
          [SATISFY_ALL]: { type: UNSATISFY_ANY, relation: SATISFY_ANY },
          [SATISFY_ANY]: { type: UNSATISFY_ALL, relation: SATISFY_ALL },
          [UNSATISFY_ALL]: { type: SATISFY_ANY, relation: UNSATISFY_ANY },
          [UNSATISFY_ANY]: { type: SATISFY_ALL, relation: UNSATISFY_ALL }
        };
        const valueType = getRelation?.[item?.type]?.[key];
        return { ...item, type: valueType };
      }
      return item;
    });
    onChangeRules(rules);
  };

  // 所有规则组的属性是否为空，无属性条件时，按钮禁用
  const isPropertyEmpty = () => {
    if (_.isEmpty(searchRules?.[filterType])) return true;
    return _.every(searchRules?.[filterType], e => {
      if (!Array.isArray(e?.property_filters)) {
        return true; // 如果不是数组类型，则视为空数组
      }
      return e?.property_filters?.length === 0;
    });
  };

  const isDisabled = (property: any) => {
    const result = _.filter(property || [], p => !_.includes(ANALYSIS_PROPERTIES.defaultAtr, p.name));
    return result?.length === 0;
  };

  return (
    <div className="exploreGraphRulesList" ref={ruleRef}>
      <div className="kw-flex optionWrapper">
        <div className="kw-c-header">
          {intl.get('exploreGraph.ruleSet')}
          {/* 邻居配置规则需要 */}
          {!hasTip ? (
            <ExplainTip className="kw-ml-2 kw-c-subtext kw-pointer" title={intl.get('exploreGraph.ruleSetTip')} />
          ) : (
            <ExplainTip className="kw-ml-2 kw-c-subtext kw-pointer" title={intl.get('exploreGraph.relRuleSetTip')} />
          )}
        </div>
        <div
          className={classNames('hoverChange kw-mr-4 kw-ml-4 kw-pointer', { 'kw-c-watermark': isPropertyEmpty() })}
          onClick={onSortProperty}
        >
          <ExplainTip title={intl.get('exploreGraph.ruleSortTip')}>
            <IconFont type="icon-paixu11" className="kw-pr-2" />
            {intl.get('exploreGraph.sortPro')}
          </ExplainTip>
        </div>
        <Popconfirm
          placement="topRight"
          title={intl.get('exploreGraph.deleteAllGroup')}
          onConfirm={onDeleteAll}
          okText={intl.get('global.ok')}
          cancelText={intl.get('global.cancel')}
          disabled={_.isEmpty(searchRules?.[filterType])}
          getPopupContainer={() => ruleRef.current || document.body}
        >
          <div
            className={classNames('hoverChange kw-mr-2 kw-ml-2 kw-pointer', {
              'kw-c-watermark': _.isEmpty(searchRules?.[filterType])
            })}
          >
            <IconFont type="icon-lajitong" className="kw-pr-2" />
            {intl.get('exploreGraph.clear')}
          </div>
        </Popconfirm>
      </div>
      <div className="kw-mt-6 " style={{ maxHeight: 327, overflowY: 'auto' }}>
        {_.isEmpty(searchRules?.[filterType]) ? (
          <div className="empty-wrapper">
            <img src={kongImg} alt="no data" className="kw-tip-img" />
            <div className="kw-center">
              <span className="kw-c-text">{intl.get('exploreGraph.emptyRuleText')?.split('|')[0]}</span>
              <span
                className={classNames('kw-c-primary kw-pointer', {
                  'kw-c-watermark': _.isEmpty(ontoData?.[ontoType])
                })}
                onClick={onAddRuleGroup}
              >
                {intl.get('exploreGraph.emptyRuleText')?.split('|')[1]}
              </span>
              <span className="kw-c-text">{intl.get('exploreGraph.emptyRuleText')?.split('|')[2]}</span>
            </div>
          </div>
        ) : (
          <div>
            {_.map(searchRules?.[filterType] || [], (ruleItem, index: number) => {
              const { dataSource, relation, selfProperties, property_filters, id, error } = ruleItem;
              const lineHeight = property_filters?.length > 1 ? 48 * (property_filters?.length - 1) + 25 : 0;
              return (
                <div key={index}>
                  {/* 与上一组的关系 且、或 */}
                  {index !== 0 && (
                    <div className="kw-align-center">
                      <Divider orientation="center">
                        <Select
                          className={'relationSelect'}
                          style={{ minWidth: 64 }}
                          value={relation}
                          bordered={false}
                          onChange={e => onChangeRelation(id, e)}
                          getPopupContainer={() => ruleRef.current || document.body}
                        >
                          {_.map(RELATION, op => {
                            return (
                              <Select.Option value={op.value} key={op.value}>
                                {intl.get(op.label)}
                              </Select.Option>
                            );
                          })}
                        </Select>
                      </Divider>
                    </div>
                  )}
                  <div>
                    <div className="classSelect">
                      {/* 规则中属性之间的关系 */}
                      <Select
                        style={{ width: 132 }}
                        value={groupType?.[ruleItem.type]?.type}
                        onChange={e => onChangeProRelation(id, e, 'type')}
                        getPopupContainer={() => ruleRef.current || document.body}
                      >
                        {_.map(GROUPCONDITIONS, item => {
                          return (
                            <Select.Option key={item?.value} value={item?.value}>
                              {intl.get(item?.label)}
                            </Select.Option>
                          );
                        })}
                      </Select>
                      {/* 实体类  */}
                      {/* <span className=""> */}
                      <SelectorClass
                        className={classNames('tagSelector kw-ml-3', {
                          nodeTag: filterType === FILTER_TYPE?.v,
                          edgeTag: filterType === FILTER_TYPE?.e,
                          errBor: error,
                          emptyTag: !dataSource?.name
                        })}
                        data={dataSource}
                        entities={ontoData?.entity}
                        type={filterType}
                        classList={ontoData?.[ontoType]}
                        onChange={(data: any) => onChangeRuleGroup(id, data)}
                      />
                      {error && (
                        <span className="kw-c-error errorText">{intl.get('exploreGraph.deletedRelation')}</span>
                      )}
                      {/* </span> */}
                      {/* 删除icon */}
                      <Popconfirm
                        placement="topRight"
                        title={intl.get('exploreGraph.deleteGroup')}
                        onConfirm={() => onDeleteRuleGroup(id)}
                        okText={intl.get('global.ok')}
                        cancelText={intl.get('global.cancel')}
                        getPopupContainer={() => ruleRef.current || document.body}
                      >
                        <Tooltip className={classNames('kw-ml-3 kw-pointer')} title={intl.get('exploreGraph.clear')}>
                          <IconFont type="icon-lajitong" />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                    {/* 属性规则列表 */}
                    <div className="kw-flex kw-mt-4" style={{ paddingLeft: 64 }}>
                      {/* 属性之间的关系 且或 */}
                      {lineHeight > 0 && (
                        <div className="kw-pt-2" style={{ height: lineHeight, width: 1 }}>
                          <div style={{ height: (lineHeight - 32) / 2, width: 1, background: 'rgba(0,0,0,0.1)' }} />
                          <Select
                            className="kw-align-center dividerVerticalWrapper"
                            style={{ minWidth: 64, height: 28 }}
                            value={groupType?.[ruleItem.type]?.relation}
                            bordered={false}
                            onChange={e => onChangeProRelation(id, e, 'relation')}
                            getPopupContainer={() => ruleRef.current || document.body}
                          >
                            {_.map(RELATION, op => {
                              return (
                                <Select.Option value={op.value} key={op.value}>
                                  {intl.get(op.label)}
                                </Select.Option>
                              );
                            })}
                          </Select>
                          <div style={{ height: 32, width: 1 }} />
                          <div style={{ height: (lineHeight - 50) / 2, width: 1, background: 'rgba(0,0,0,0.1)' }} />
                        </div>
                      )}
                      <div className="kw-pt-2">
                        {_.map(property_filters || [], (item, index: number) => {
                          const middle = Math.floor(property_filters?.length / 2);
                          const lineWidth = property_filters?.length % 2 === 0 ? 80 : index === middle ? 48 : 80;
                          return (
                            <div key={index} className="kw-align-center kw-mb-4">
                              {/* 横线 */}
                              <div
                                style={{
                                  height: lineHeight > 0 ? 1 : 0,
                                  width: lineWidth,
                                  marginLeft: lineWidth === 80 ? 0 : 32,
                                  background: 'rgba(0,0,0,0.1)'
                                }}
                              />
                              <PropertyFilter
                                propertyFilter={item}
                                error={error}
                                selfProperties={selfProperties}
                                onDeleteProperty={() => onDeleteProperty(id, index)}
                                addOrChangeProperty={data => addOrChangeProperty(id, item?.proId, data)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="kw-flex">
                    <div
                      className={classNames('kw-pointer kw-c-primary', {
                        'kw-c-watermark': isDisabled(selfProperties)
                      })}
                      style={{ marginLeft: 146 }}
                      onClick={() => {
                        if (isDisabled(selfProperties)) return;
                        addOrChangeProperty(id, '', selfProperties?.[0], 'add');
                      }}
                    >
                      <IconFont type="icon-Add" className="kw-mr-1" />
                      {intl.get('exploreGraph.newCondition')}
                    </div>
                    <div className="kw-pl-4 kw-pr-4">|</div>
                    <div
                      className={classNames('kw-c-primary kw-pointer', {
                        'kw-c-watermark': _.isEmpty(ontoData?.[ontoType])
                      })}
                      onClick={onAddRuleGroup}
                    >
                      <IconFont type="icon-Add" className="kw-mr-1" />
                      {intl.get('exploreGraph.addgroup')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default RuleList;
