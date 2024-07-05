import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Select, Tooltip, Divider } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import ClassSelector from '@/components/ClassSelector';
import ProRightInput from './ProRightInput';
import { proType } from './ProRightInput/type';

import './style.less';
const DEFAULT_PRO = ['_ds_id_', '_name_', '_timestamp_'];
const FilterList = (props: any) => {
  const { selectedItem, classData, setSearchConfig, searchConfig } = props;
  const [rangeType, setRangeType] = useState('eq');

  useEffect(() => {
    setSearchConfig([]);
  }, [selectedItem?.detail?.kg?.kg_id]);

  // 可选的类
  const selectableData = useMemo(() => {
    const tags = _.map(searchConfig, item => item?.tag);
    return _.filter(classData, item => !_.includes(tags, item?.name));
  }, [searchConfig, classData]);

  // 切换筛选的类
  const setTag = async (index = 0, data: any, initList?: Array<any>) => {
    if (!data?.name) return;
    const list = _.map(initList || searchConfig, (item, i: number) => {
      if (i === index) {
        return { tag: data?.name, data, properties: [], proList: data?.properties };
      }
      return item;
    });
    setSearchConfig(list);
  };

  // 添加筛选类
  const addFilter = () => {
    const config = {
      tag: selectableData?.[0]?.name,
      properties: [],
      proList: [],
      data: selectableData?.[0]
    };
    const filter = [config, ...searchConfig];
    setTag(0, selectableData?.[0], filter);
  };

  // 改变某个筛选属性
  const changePro = (option: any, tag: any, index: number, op = 'change') => {
    const filter = _.cloneDeep(searchConfig);
    const f = _.map(filter, item => {
      if (tag === item?.tag) {
        if (op === 'change') {
          item.properties[index] = {
            name: option?.value,
            operation: '',
            op_value: '',
            type: option?.type,
            alias: option?.alias
          };
        } else {
          item.properties = [
            ...item.properties,
            { name: option?.name, operation: '', op_value: '', type: option?.type, alias: option?.alias }
          ];
        }
      }
      return item;
    });
    setSearchConfig(f);
  };

  const changeOpValue = (tag: any, index: number, op: any, value: any) => {
    const filter = _.cloneDeep(searchConfig);
    const f = _.map(filter, item => {
      if (tag === item?.tag) {
        item.properties[index] = { ...item.properties[index], operation: op, op_value: value };
      }
      return item;
    });
    setSearchConfig(f);
  };

  // 刪除所有筛选条件
  const deleteAll = () => {
    setSearchConfig([]);
  };

  // 删除某项筛选属性
  const deleteProperty = (tag: any, index: number) => {
    const filter = _.cloneDeep(searchConfig);

    const list = _.map(filter, item => {
      if (tag === item.tag) {
        item?.properties.splice(index, 1);
      }
      return item;
    });
    setSearchConfig(list);
  };

  // 删除某类
  const deleteAllProperty = (tag: any) => {
    const list = _.filter(searchConfig, item => item?.tag !== tag);
    setSearchConfig(list);
  };

  return (
    <div className="filterListRoot kw-h-100">
      <div className="kw-space-between kw-pt-8 kw-pb-5">
        <Format.Title>
          {intl.get('exploreGraph.screening')}
          <ExplainTip title={intl.get('exploreGraph.addChange')} />
        </Format.Title>
        <div>
          <Tooltip title={_.isEmpty(searchConfig) ? '' : intl.get('exploreGraph.clearAll')}>
            <IconFont
              className={classNames('kw-pointer', { 'kw-c-watermark': _.isEmpty(searchConfig) })}
              type="icon-lajitong"
              onClick={deleteAll}
            />
          </Tooltip>
          <Tooltip title={intl.get('exploreGraph.addScreening')}>
            <IconFont
              className={classNames('kw-ml-4 kw-pointer', { 'kw-c-watermark': _.isEmpty(selectableData) })}
              type="icon-Add"
              onClick={addFilter}
            />
          </Tooltip>
        </div>
      </div>
      {/* <KwScrollBar isShowX={false} style={{ maxHeight: 'calc(100% - 74px)' }}> */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100% - 74px)' }}>
        {_.isEmpty(searchConfig) ? (
          <div className="kw-c-subtext kw-mt-6 kw-center">{intl.get('exploreGraph.noFilter')}</div>
        ) : (
          _.map(searchConfig, (filter, index: any) => {
            const { proList: list, tag, data, properties } = filter || {};
            const proList: any = _.filter(list, p => !_.includes(DEFAULT_PRO, p?.name));
            return (
              <div key={filter?.tag} className="kw-pr-3">
                {index !== 0 && (
                  <Divider plain={true}>
                    <div className="kw-border andText">{intl.get('exploreGraph.or')}</div>
                  </Divider>
                )}
                <div className="kw-flex kw-mb-5" key={filter?.tag}>
                  <div style={{ minWidth: 30 }}>
                    {intl.get('exploreGraph.satisfy')}
                    <br></br>
                    <div className="kw-mr-3" style={{ textAlign: 'center', height: 'calc(100% - 36px)' }}>
                      <div className="verticalLine" />
                      <div className="kw-border andText kw-center">{intl.get('exploreGraph.and')}</div>
                      <div className="verticalLine" />
                    </div>
                  </div>
                  <div className={classNames('kw-w-100', 'kw-ml-3')}>
                    <div className="kw-align-center">
                      <ClassSelector
                        data={data}
                        entities={[]}
                        className="tagSelector"
                        type={'v_filters'}
                        classList={selectableData}
                        onChange={(data: any) => {
                          setTag(index, data);
                        }}
                        getPopupContainer={triggerNode => triggerNode.parentElement.parentElement}
                      />
                      <Tooltip title={intl.get('exploreGraph.clear')}>
                        <IconFont
                          type="icon-lajitong"
                          className="kw-pointer kw-ml-3"
                          onClick={() => deleteAllProperty(tag)}
                        />
                      </Tooltip>
                    </div>
                    <div className="kw-mt-4 ">
                      {_.isEmpty(properties) ? (
                        <div className="kw-mt-4 kw-mr-6 kw-p-4" style={{ backgroundColor: 'rgba(0,0,0,.03)' }}>
                          <Select
                            className="kw-w-100"
                            value={intl.get('exploreGraph.allAttributes')}
                            onChange={(_, option) => changePro(option, tag, 0)}
                            listHeight={32 * 4}
                            getPopupContainer={triggerNode => triggerNode.parentElement.parentElement}
                          >
                            {_.map(proList, pro => {
                              return (
                                <Select.Option key={pro?.name} type={pro?.type} alias={pro?.alias}>
                                  {pro?.alias || pro?.name}
                                </Select.Option>
                              );
                            })}
                          </Select>
                        </div>
                      ) : (
                        _.map(properties, (property, key: number) => {
                          return (
                            <div
                              key={key}
                              className="kw-mt-4 kw-mr-6 kw-p-4"
                              style={{ backgroundColor: 'rgba(0,0,0,.03)', position: 'relative' }}
                            >
                              <div className="kw-w-100 kw-space-between">
                                <Select
                                  key={key}
                                  style={{ width: 168 }}
                                  value={property?.name}
                                  listHeight={32 * 4}
                                  onChange={(_, option) => changePro(option, tag, key)}
                                  getPopupContainer={() =>
                                    document.getElementsByClassName('retrieval-scroll')?.[0] as any
                                  }
                                >
                                  {_.map(proList, pro => {
                                    return (
                                      <Select.Option
                                        key={pro?.name}
                                        value={pro?.name}
                                        type={pro?.type}
                                        alias={pro?.alias}
                                      >
                                        {pro?.alias || pro?.name}
                                      </Select.Option>
                                    );
                                  })}
                                </Select>
                                {_.includes([...proType.str, ...proType.bool], property?.type) ? (
                                  <Select disabled value="eq" style={{ width: 96 }}>
                                    <Select.Option value={'eq'}>{intl.get('exploreGraph.equalTo')}</Select.Option>
                                  </Select>
                                ) : (
                                  <Select
                                    value={rangeType}
                                    style={{ width: 96 }}
                                    onChange={v => setRangeType(v)}
                                    getPopupContainer={() =>
                                      document.getElementsByClassName('retrieval-scroll')?.[0] as any
                                    }
                                  >
                                    <Select.Option value={'lt'}>{intl.get('exploreGraph.less')}</Select.Option>
                                    <Select.Option value={'gt'}>{intl.get('exploreGraph.greater')}</Select.Option>
                                    <Select.Option value={'btw'}>{intl.get('exploreGraph.between')}</Select.Option>
                                    <Select.Option value={'eq'}>{intl.get('exploreGraph.equalTo')}</Select.Option>
                                  </Select>
                                )}
                              </div>
                              <ProRightInput
                                index={key}
                                type={property?.type}
                                rangeType={rangeType}
                                changeOpValue={(op: any, value: any) => changeOpValue(tag, key, op, value)}
                              />
                              <div style={{ position: 'absolute', top: 16, right: -24 }}>
                                <Tooltip title={intl.get('exploreGraph.clear')}>
                                  <IconFont
                                    type="icon-lajitong"
                                    className="kw-pointer"
                                    onClick={() => deleteProperty(tag, key)}
                                  />
                                </Tooltip>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {!_.isEmpty(properties) && (
                        <div
                          className="kw-mt-5 kw-pointer addProperty"
                          onClick={() => changePro(proList?.[0], tag, 0, 'add')}
                        >
                          <IconFont className=" kw-mr-2" type="icon-Add" />
                          {intl.get('exploreGraph.newAttribute')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* </KwScrollBar> */}
    </div>
  );
};
export default FilterList;
