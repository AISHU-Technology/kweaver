import React, { useState, useMemo } from 'react';
import { Select, Input, Divider, Collapse } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import NoDataBox from '@/components/NoDataBox';
import SearchInput from '@/components/SearchInput';
import { fuzzyMatch } from '@/utils/handleFunction';

const FILTER_FIELDS = {
  node: [
    {
      key: 'node-alias',
      label: intl.get('analysisService.entityAlias')
    },
    {
      key: 'node-name',
      label: intl.get('exploreGraph.entity')
    }
  ],
  edge: [
    {
      key: 'edge-alias',
      label: intl.get('analysisService.relationAlias')
    },
    {
      key: 'edge-name',
      label: intl.get('exploreGraph.edgesClass')
    },
    {
      key: 'node-alias',
      label: intl.get('analysisService.entityAlias')
    }
  ]
};

/**
 * 阻止mousedown冒泡和默认事件, 不让编辑器失焦
 */
const preventEvent = (e: any) => {
  e.stopPropagation();
  e.preventDefault();
};

type DataItem = {
  name: string;
  alias: string;
  color: string;
  properties: { name: string; alias: string; type: string }[];
  // 边额外添加起点终点信息
  sourceNode?: Omit<DataItem, 'sourceNode' | 'targetNode'>;
  targetNode?: Omit<DataItem, 'sourceNode' | 'targetNode'>;
};

export interface ListProps {
  className?: string;
  type: 'node' | 'edge';
  data: DataItem[];
  isEditorFocused?: boolean;
  onAdd?: (text: string) => void;
}

const List = (props: ListProps) => {
  const { className, type, data, isEditorFocused, onAdd } = props;
  const [filter, setFilter] = useState(FILTER_FIELDS[type][0].key); // 筛选方式
  const [keyword, setKeyword] = useState(''); // 搜索关键词

  // 显示的数据
  const showData = useMemo(() => {
    if (!keyword) return data;
    return _.filter(data, item => {
      let matchText = '';
      switch (true) {
        case type === 'edge' && filter === 'node-alias':
          matchText = `${item.sourceNode?.alias} > ${item.targetNode?.alias}`;
          break;
        case _.includes(filter, 'alias'):
          matchText = item.alias;
          break;
        default:
          matchText = item.name;
      }
      return fuzzyMatch(keyword, matchText);
    }) as DataItem[];
  }, [data, keyword, filter]);

  /**
   * 防抖搜索
   */
  const debounceSearch = _.debounce((value: string) => {
    setKeyword(value);
  }, 150);

  return (
    <div className={classNames(className, 'onto-info-list kw-h-100 kw-flex-column')}>
      <div className="search-tool kw-pl-6 kw-pr-6">
        <Input.Group compact>
          <Select bordered={false} style={{ width: '40%' }} value={filter} onChange={v => setFilter(v)}>
            {_.map(FILTER_FIELDS[type], item => (
              <Select.Option key={item.key}>{item.label}</Select.Option>
            ))}
          </Select>
          <SearchInput
            iconPosition="end"
            bordered={false}
            style={{ width: '60%' }}
            placeholder={intl.get('global.searchKw')}
            onChange={e => debounceSearch(e.target.value)}
          />
        </Input.Group>
        <Divider className="kw-m-0" />
      </div>
      <div className="kw-flex-item-full-height" style={{ overflow: 'auto' }}>
        {/* WARNING Collapse复用隔壁<ParamsList />组件的样式 */}
        <Collapse className="cog-service-param-collapse kw-mt-4" ghost>
          {_.map(showData, item => {
            const hasProperty = !!item.properties?.length;
            return (
              <Collapse.Panel
                key={item.name}
                className={type === 'node' ? 'node-panel' : 'edge-panel'}
                collapsible={!hasProperty ? 'disabled' : undefined}
                showArrow={hasProperty}
                header={
                  <div className="panel-header kw-align-center" onClick={preventEvent}>
                    {type === 'edge' && !hasProperty && <div className="edge-expand-icon" />}
                    <div
                      className={classNames('header-icon kw-mr-2', { circle: type === 'node' })}
                      style={{ background: item.color || '#126ee3' }}
                    />
                    {type === 'node' ? (
                      <div
                        className="kw-flex kw-flex-item-full-width"
                        onMouseDown={preventEvent}
                        onClick={() => isEditorFocused && onAdd?.(item.name)}
                        style={{ cursor: isEditorFocused ? 'pointer' : 'default' }}
                      >
                        <div className="kw-c-header kw-ellipsis" title={`${item.name}  (${item.alias})`}>
                          {item.name}
                          &nbsp;&nbsp;<span className="kw-c-subtext">({item.alias})</span>
                        </div>
                        <div
                          className={classNames('add-btn kw-ml-1 kw-pl-2 kw-pr-2 kw-pointer', {
                            disabled: !isEditorFocused
                          })}
                        >
                          {intl.get('global.add')}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="kw-flex-item-full-width"
                        onMouseDown={preventEvent}
                        onClick={() => isEditorFocused && onAdd?.(item.name)}
                        style={{ cursor: isEditorFocused ? 'pointer' : 'default' }}
                      >
                        <div className="kw-flex">
                          <div className="kw-c-header kw-ellipsis" title={`${item.name}  (${item.alias})`}>
                            {item.name}
                            &nbsp;&nbsp;<span className="kw-c-subtext">({item.alias})</span>
                          </div>
                          <div
                            className={classNames('add-btn kw-ml-1 kw-pl-2 kw-pr-2 kw-pointer', {
                              disabled: !isEditorFocused
                            })}
                          >
                            {intl.get('global.add')}
                          </div>
                        </div>
                        <div className="kw-c-subtext kw-ellipsis" style={{ transform: 'translateY(-2px)' }}>
                          {item.sourceNode?.alias}
                          &nbsp;&gt;&nbsp;
                          {item.targetNode?.alias}
                        </div>
                      </div>
                    )}
                  </div>
                }
              >
                <div className={type === 'node' ? 'node-padding' : 'edge-padding'}>
                  <div style={{ borderLeft: '1px solid var(--kw-line-color)' }}>
                    {_.map(item.properties, pro => (
                      <div
                        key={pro.name}
                        className={classNames('pro-row kw-flex kw-pl-4')}
                        title={`${pro.name}  (${pro.alias})`}
                        style={{ cursor: isEditorFocused ? 'pointer' : 'default' }}
                        onMouseDown={preventEvent}
                        onClick={() => isEditorFocused && onAdd?.(pro.name)}
                      >
                        <div className="pro-name kw-ellipsis">
                          {pro.name}
                          &nbsp;&nbsp;<span className="kw-c-subtext">({pro.alias})</span>
                        </div>
                        <div
                          className={classNames('add-btn kw-ml-1 kw-pl-2 kw-pr-2 kw-pointer', {
                            disabled: !isEditorFocused
                          })}
                        >
                          {intl.get('global.add')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Collapse.Panel>
            );
          })}
        </Collapse>
        {!!data.length && !showData.length && <NoDataBox.NO_RESULT />}
      </div>
    </div>
  );
};

export default List;
