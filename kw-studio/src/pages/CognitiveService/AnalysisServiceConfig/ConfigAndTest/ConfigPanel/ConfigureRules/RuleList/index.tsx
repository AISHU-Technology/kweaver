import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Select, Tooltip, message, Popconfirm } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { ANALYSIS_PROPERTIES } from '@/enums';
import KwResizeObserver from '@/components/KwResizeObserver';

import SelectorClass from '@/components/ClassSelector';
import PropertyFilter from '../PropertyFilter';
import RuleHeader from './HeaderBtn';
import EmptyBox from './Empty';
import GroupLine from './GroupLine';

import {
  RELATION,
  GROUPCONDITIONS,
  defaultOperator,
  PARAM_TYPE,
  defaultParam_custom,
  groupType,
  GROUP_RELATION
} from '../enums';

import { TYPEFILTER, FILTER_TYPE } from '../type';

import './style.less';

type TypeRuleList = {
  saveParamNames: any;
  checkParam: boolean; // 校验规则
  hasTip: boolean; // 同时配置点和边需要提示
  searchRules: any;
  filterType: TYPEFILTER;
  ontoData: any;
  onChangeRules: (data: any) => void;
};
const { SATISFY_ALL, SATISFY_ANY, UNSATISFY_ALL, UNSATISFY_ANY } = GROUP_RELATION;
const RuleList = (props: TypeRuleList) => {
  const { hasTip, searchRules, filterType, ontoData, saveParamNames, checkParam, onChangeRules } = props;
  const [existError, setExistError] = useState<{ proId: string; msg?: string }>({ proId: '', msg: '' });
  const ontoType = useMemo(() => (filterType === FILTER_TYPE?.v ? 'entity' : 'edge'), [filterType]);
  const ruleRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<any>(null);
  const randomStr = _.sampleSize('abcdefghijklmnopqrstuvwxyz0123456789', 10).join('');

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
    const id = _.uniqueId(`tag${randomStr}`);
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
    if (op === 'add' && existError?.msg) return;

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
          const proId = _.uniqueId(`pro${randomStr}`);
          const op_value = data?.type === 'boolean' ? 'true' : '';
          item.property_filters = [
            ...item.property_filters,
            {
              proId,
              name: data?.name,
              operation: defaultOperator?.EQUALS_TO,
              op_value,
              property_type: data?.type,
              type: PARAM_TYPE?._CONSTANT,
              custom_param: defaultParam_custom,
              time_param: {}
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
  const onChangeProRelation = (id: any, key: string) => {
    const filter = _.cloneDeep(searchRules);
    const rules = _.map(filter[filterType], item => {
      if (id === item?.id) {
        // 满足/不满足 + 且/或返回组内属性的关系
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

  const isDisabled = (property: any) => {
    const result = _.filter(property || [], p => !_.includes(ANALYSIS_PROPERTIES.defaultAtr, p.name));
    return result?.length === 0;
  };

  // 获取右侧竖线高度
  // const getLineHeight = (property: any) => {
  //   if (property?.length === 0) return 0;
  //   if (property?.length === 1) return 0;

  //   let lineHeight = property?.length > 1 ? 56 * (property?.length - 1) + 16 : 0;
  //   const variableLen = _.filter(property?.slice(0, -1), item => item?.type === PARAM_TYPE?._CUSTOMVAR)?.length;
  //   const timeLen = _.filter(property?.slice(0, -1), item => item?.type === PARAM_TYPE?._SYSTIME)?.length;
  //   const errorLine = _.reduce(property?.slice(0, -1), (accumulator, value) => accumulator + value?.errorLine, 0);

  //   lineHeight = variableLen > 0 ? lineHeight + variableLen * 112 : lineHeight;
  //   lineHeight = timeLen > 0 ? lineHeight + timeLen * 44 : lineHeight;
  //   lineHeight = errorLine > 0 ? lineHeight + errorLine * 22 : lineHeight;

  //   return lineHeight;
  // };

  /** 获取属性长度 */
  const getLength = (id: string) => {
    const ruleKV = _.keyBy(searchRules?.[filterType], 'id');
    return ruleKV?.[id]?.property_filters?.length;
  };

  return (
    <div className="serviceConfigRulesList" ref={ruleRef}>
      <div className="kw-pb-3">
        <RuleHeader
          hasTip={hasTip}
          filterType={filterType}
          searchRules={searchRules}
          onSortProperty={onSortProperty}
          onDeleteAll={onDeleteAll}
        />
      </div>
      <div className="kw-mt-2 ruleScrollWrapper" id="serviceRulesId">
        {_.isEmpty(searchRules?.[filterType]) ? (
          <EmptyBox onAddRuleGroup={onAddRuleGroup} />
        ) : (
          <div>
            {_.map(searchRules?.[filterType] || [], (ruleItem, index: number) => {
              const { dataSource, relation, selfProperties, property_filters, id, error } = ruleItem;
              const lineHeight = heightRef?.current?.[id] || 0;

              return (
                <div key={ruleItem.id}>
                  {/* 与上一组的关系 且、或 */}
                  {index !== 0 && <GroupLine value={relation} onChange={(v: any) => onChangeRelation(id, v)} />}
                  <div className="classSelect">
                    {/* 规则中属性之间的关系  满足/不满足*/}
                    <Select
                      style={{ width: 132 }}
                      value={groupType?.[ruleItem.type]?.type}
                      onChange={e => onChangeProRelation(id, 'type')}
                      getPopupContainer={() => document.getElementById('serviceRulesId')!}
                      options={_.map(GROUPCONDITIONS, item => ({
                        label: intl.get(item.label),
                        value: item.value
                      }))}
                    />
                    {/* 实体类  */}
                    <span>
                      <SelectorClass
                        className={classNames('tagSelector kw-ml-3', {
                          nodeTag: filterType === FILTER_TYPE?.v,
                          errBor: error,
                          edgeTag: filterType === FILTER_TYPE?.e
                        })}
                        data={dataSource}
                        entities={ontoData?.entity}
                        type={filterType}
                        classList={ontoData?.[ontoType]}
                        listHeight={32 * 4}
                        getPopupContainer={() => document.getElementById('serviceRulesId')!}
                        onChange={(data: any) => onChangeRuleGroup(id, data)}
                      />
                      {error && (
                        <span className="kw-c-error errorText">{intl.get('exploreGraph.deletedRelation')}</span>
                      )}
                    </span>
                    {/* 删除icon */}
                    <Popconfirm
                      placement="topRight"
                      title={intl.get('exploreGraph.deleteGroup')}
                      onConfirm={() => onDeleteRuleGroup(id)}
                      okText={intl.get('global.ok')}
                      cancelText={intl.get('global.cancel')}
                      getPopupContainer={() => document.getElementById('serviceRulesId')!}
                    >
                      <Tooltip className={classNames('kw-ml-3 kw-pointer')} title={intl.get('exploreGraph.clear')}>
                        <IconFont type="icon-lajitong" />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                  {/* 属性规则列表 */}
                  <KwResizeObserver
                    onResize={({ height }) => {
                      const len = getLength(id);
                      if (len > 1) {
                        if (heightRef.current === null) {
                          heightRef.current = { [id]: height - 48 };
                        } else {
                          heightRef.current[id] = height - 48;
                        }
                      }
                    }}
                  >
                    <div className="kw-flex kw-mt-4" style={{ paddingLeft: 64 }}>
                      {/* 属性之间的关系 且或 */}
                      {lineHeight > 0 && (
                        <div className="kw-pt-2" style={{ height: lineHeight, width: 1, position: 'relative' }}>
                          <div style={{ height: lineHeight, width: 1, background: 'rgba(0,0,0,0.1)' }} />
                          <Select
                            className="kw-align-center dividerVerticalWrapper"
                            style={{ minWidth: 64, height: 28 }}
                            value={groupType?.[ruleItem.type]?.relation}
                            bordered={false}
                            onChange={e => onChangeProRelation(id, 'relation')}
                            getPopupContainer={() => document.getElementById('serviceRulesId')!}
                          >
                            {_.map(RELATION, op => {
                              return (
                                <Select.Option value={op.value} key={op.value}>
                                  {intl.get(op.label)}
                                </Select.Option>
                              );
                            })}
                          </Select>
                        </div>
                      )}
                      <div className="kw-pt-2">
                        {_.map(property_filters || [], (item, index: number) => {
                          return (
                            <PropertyFilter
                              key={item.proId}
                              existError={existError}
                              propertyFilter={item}
                              error={error}
                              saveParamNames={saveParamNames}
                              divider={{ height: lineHeight > 0 ? 1 : 0 }}
                              selfProperties={selfProperties}
                              checkParam={checkParam}
                              setExistError={setExistError}
                              onDeleteProperty={() => onDeleteProperty(id, index)}
                              addOrChangeProperty={data => addOrChangeProperty(id, item?.proId, data)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </KwResizeObserver>

                  {/* 新增按钮 */}
                  <div className="kw-flex" style={{ paddingLeft: 146 }}>
                    <div
                      className={classNames('kw-pointer kw-c-primary', {
                        'kw-c-watermark': isDisabled(selfProperties)
                      })}
                      onClick={() => {
                        if (isDisabled(selfProperties)) return;
                        addOrChangeProperty(id, '', selfProperties?.[0], 'add');
                      }}
                    >
                      <IconFont type="icon-Add" className="kw-mr-1" />
                      {intl.get('exploreGraph.newCondition')}
                    </div>
                    <div className="kw-pl-4 kw-pr-4">|</div>
                    <div className="kw-c-primary kw-pointer" onClick={onAddRuleGroup}>
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
