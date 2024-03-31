import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

import { Button, Select, Tooltip, message, Input } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';

import cognitiveSearchService from '@/services/cognitiveSearch';

import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { getParam } from '@/utils/handleFunction';
import graphSvg from '@/assets/images/graphCircle.svg';

import './style.less';
import Icon from '@ant-design/icons/lib/components/Icon';

const ThesaurusGraphHeader = (props: any, ref: any) => {
  const { setVisible, onChangeTableData, tableData, tabKey } = props;
  const [graphList, setGraphList] = useState<any>([{ name: intl.get('cognitiveSearch.all'), id: '-1' }]); // 历史任务成功的图谱
  const [value, setValue] = useState('-1');
  const [inputValue, setInputValue] = useState('');
  const [focus, setFocus] = useState(false);

  useImperativeHandle(ref, () => ({ getConfigGraph }));

  useEffect(() => {
    setInputValue('');
    onChangeTableData({ page: 1, query: '', graph: '-1' });
    setValue('-1');
  }, [tabKey]);

  useEffect(() => {
    getConfigGraph(tableData);
  }, [tableData]);

  /**
   * 获取有效图谱
   */
  const getConfigGraph = (data: any) => {
    const allUsedGraphName = onUsedGraphName(data);
    setGraphList([{ name: intl.get('cognitiveSearch.all'), id: '-1' }, ...allUsedGraphName]);
  };

  /**
   * 已添加的图谱名称
   */
  const onUsedGraphName = (data: any) => {
    const reduceData = _.reduce(
      _.cloneDeep(data),
      (pre: any, key: any) => {
        pre[key.graph_id] = {};
        return pre;
      },
      {}
    );
    _.map(_.cloneDeep(data), (item: any) => {
      reduceData[item.graph_id] = { name: item?.name, id: item?.graph_id };
    });
    const formatHandle = _.map(reduceData, (item: any) => item);
    return formatHandle;
  };

  /**
   * 知识图谱选择
   */
  const onChangeSelect = (value: string) => {
    setValue(value);
    onChangeTableData({ page: 1, graph: value });
  };

  /**
   * 搜索
   */
  const onSearch = _.debounce(e => {
    onChangeTableData({ page: 1, query: e?.target?.value });
  }, 300);

  const onFocus = (e: any) => {
    setFocus(true);
  };

  const onBlur = (e: any) => {
    setFocus(false);
  };

  return (
    <div className="thesaurus-mode-create-graph-header-root kw-mb-4">
      <div className="thesaurus-left">
        <Button type="primary" onClick={() => setVisible(true)}>
          <IconFont type="icon-Add" />
          {intl.get('global.add')}
        </Button>
      </div>
      <div className="thesaurus-right kw-flex">
        <span>{intl.get('exploreAnalysis.graphName')}</span>
        <Select
          onChange={onChangeSelect}
          getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
          className="kw-mr-3 kw-ml-3 thesaurus-select"
          value={value}
        >
          {_.map(graphList, (item: any) => {
            return (
              <Select.Option key={item?.id} value={item?.id}>
                <div className="kw-flex select-graph-name">
                  <IconFont type="icon-color-zhishitupu11" className="icon-box kw-mr-2" />
                  <div className="kw-ellipsis" title={item?.name}>
                    {item?.name}
                  </div>
                </div>
              </Select.Option>
            );
          })}
        </Select>

        <Input
          value={inputValue}
          onFocus={onFocus}
          onBlur={onBlur}
          className="thesaurus-search kw-mr-3"
          allowClear
          prefix={<IconFont type="icon-sousuo" className={focus ? 'kw-c-header' : 'kw-c-watermark'} />}
          placeholder={intl.get('ThesaurusManage.createMode.searchEntities')}
          onChange={(e: any) => {
            e.persist();
            onSearch(e);
            setInputValue(e?.target?.value);
          }}
        />
      </div>
    </div>
  );
};

export default forwardRef(ThesaurusGraphHeader);
