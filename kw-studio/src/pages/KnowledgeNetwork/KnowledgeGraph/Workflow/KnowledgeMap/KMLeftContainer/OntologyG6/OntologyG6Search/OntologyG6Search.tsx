import React, { useEffect, useRef, useState } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import type { GraphData } from '@antv/g6';
import { Select, Tabs, Tooltip } from 'antd';
import { SwapOutlined } from '@ant-design/icons';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { tipModalFunc } from '@/components/TipModal';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

import './style.less';

const sortByLabel = (data?: any[]) => {
  const result = [...(data || [])];
  const isCN = (text: string) => /[\u4e00-\u9fa5]/.test(text);
  result.sort((a, b) => {
    const labelA = a.label?.toLocaleLowerCase?.() || '';
    const labelB = b.label?.toLocaleLowerCase?.() || '';
    if (isCN(labelA[0]) && !isCN(labelB[0])) return -1;
    if (!isCN(labelA[0]) && isCN(labelB[0])) return 1;
    return labelA.localeCompare(labelB, 'zh-CN');
  });
  return result;
};

interface OntologyG6SearchProps {
  data: GraphData;
  onChange?: (type: string, val: any) => void;
  onScanClick?: () => void;
  updateGraphDataStatusByDataFile?: () => void;
  removeG6ItemState?: () => void;
}

const OntologyG6Search: React.FC<OntologyG6SearchProps> = props => {
  const { data, onChange, onScanClick, updateGraphDataStatusByDataFile, removeG6ItemState } = props;
  const {
    knowledgeMapStore: { selectedG6Edge, selectedModel, selectedG6Node },
    setKnowledgeMapStore
  } = useKnowledgeMapContext();
  const parentDOM = useRef<HTMLDivElement>(null);
  const [tabProps, setTabProps] = useState({
    activeKey: 'entityClass',
    nodeNameMap: {} as Record<string, string>,
    content: {
      entityClass: [] as any,
      relationClass: [] as any
    }
  });
  const [selectProps, setSelectProps] = useState({ selectedData: {} as any, open: false });
  const selectRef = useRef<any>();
  const prefixCls = 'ontologyG6-search';
  const prefixLocale = 'workflow.knowledgeMap';
  useDeepCompareEffect(() => {
    const nodeNameMap = _.reduce(data.nodes, (res, d: any) => ({ ...res, [d.id]: d._sourceData?.alias }), {});
    setTabProps(prevState => ({
      ...prevState,
      nodeNameMap,
      content: {
        entityClass: sortByLabel(data.nodes),
        relationClass: sortByLabel(data.edges)
      }
    }));
  }, [data]);

  useEffect(() => {
    // 取消选中执行的逻辑
    if (selectedG6Edge.length === 0 && selectedG6Node.length === 0 && selectedModel.length === 0) {
      setSelectProps(prevState => ({
        ...prevState,
        selectedData: {}
      }));
      setTabProps(prevState => ({
        ...prevState,
        activeKey: 'entityClass'
      }));
    }
  }, [selectedG6Edge, selectedG6Node, selectedModel]);

  const tabChange = (key: string) => {
    setTabProps(prevState => ({ ...prevState, activeKey: key }));
  };

  const itemClick = (type: string, data: any) => {
    setSelectProps(prevState => ({
      ...prevState,
      selectedData: data,
      open: false
    }));
    selectRef.current?.blur();
    onChange && onChange(type, data);
  };

  const dropdownRender = () => {
    return (
      <Tabs
        activeKey={tabProps.activeKey}
        size="small"
        onChange={tabChange}
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Tabs.TabPane tab={intl.get(`${prefixLocale}.entityClassText`)} key="entityClass">
          <div className={`${prefixCls}-result`}>
            {tabProps.content.entityClass.length > 0 ? (
              tabProps.content.entityClass.map((node: any) => (
                <div
                  key={node.id}
                  className={classNames(`${prefixCls}-result-item kw-align-center kw-pl-3 kw-pr-3`, {
                    [`${prefixCls}-result-item-active`]: selectProps.selectedData.id === node.id
                  })}
                  onClick={() => itemClick('node', node)}
                >
                  <span className="kw-c-header">{node.label}</span>
                  <span className="kw-ml-3 kw-c-subtext">({node._sourceData?.name})</span>
                </div>
              ))
            ) : (
              <div className="kw-c-subtext" style={{ padding: '8px 12px' }}>
                {intl.get(`${prefixLocale}.noResult`)}
              </div>
            )}
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get(`${prefixLocale}.relationClassText`)} key="relationClass">
          <div className={`${prefixCls}-result`}>
            {tabProps.content.relationClass.length > 0 ? (
              tabProps.content.relationClass.map((edge: any) => (
                <div
                  key={edge.id}
                  className={classNames(`${prefixCls}-result-item-relation kw-pl-3 kw-pr-3`, {
                    [`${prefixCls}-result-item-active`]: selectProps.selectedData.id === edge.id
                  })}
                  onClick={() => itemClick('edge', edge)}
                >
                  <div className="kw-align-center">
                    <span className="kw-c-header">{edge.label}</span>
                    <span className="kw-ml-3 kw-c-subtext">({edge._sourceData?.name})</span>
                  </div>
                  <div className="relation-node kw-flex kw-c-subtext">
                    <div className="kw-ellipsis">{tabProps.nodeNameMap[edge.source]}</div>
                    &nbsp;&gt;&nbsp;
                    <div className="kw-ellipsis">{tabProps.nodeNameMap[edge.target]}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="kw-c-subtext" style={{ padding: '8px 12px' }}>
                {intl.get(`${prefixLocale}.noResult`)}
              </div>
            )}
          </div>
        </Tabs.TabPane>
      </Tabs>
    );
  };

  const onSearch = (value: string) => {
    const targetNodes = data.nodes?.filter(
      (node: any) => node.label.includes(value) || node._sourceData?.name?.includes(value)
    );
    const targetEdges = data.edges?.filter(
      (edge: any) => edge.label.includes(value) || edge._sourceData?.name?.includes(value)
    );
    setTabProps(prevState => ({
      ...prevState,
      content: {
        entityClass: sortByLabel(targetNodes),
        relationClass: sortByLabel(targetEdges)
      }
    }));
  };

  /**
   * 切换至列表形式
   */
  const switchList = () => {
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      ontologyDisplayType: 'list'
    }));
  };

  /**
   * 清空配置项
   */
  const onClearConfig = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('workflow.information.clearConfigTitle'),
      content: intl.get('workflow.information.clearConfigContent')
    });
    if (!isOk) return;
    setKnowledgeMapStore(preStore => ({
      ...preStore,
      graphKMap: { entity: [], edge: [], files: [] },
      selectedG6Node: [], // 选中的G6节点
      selectedG6Edge: [], // 选中的G6边
      selectedModel: [], // 选中的模型
      selectedG6ModelNode: [], // 选中的G6模型节点
      selectedG6ModelEdge: [] // 选中的G6模型边
    }));
    setTimeout(() => {
      updateGraphDataStatusByDataFile?.();
      removeG6ItemState?.();
    }, 0);
  };

  return (
    <div className="ontologyG6-search kw-flex" ref={parentDOM}>
      <span className="ontologyG6-search-icon">
        <IconFont type="icon-sousuo" />
      </span>
      <Select
        className="kw-mr-1"
        ref={selectRef}
        style={{ width: 352 }}
        onSearch={onSearch}
        showArrow={false}
        showSearch={true}
        allowClear
        dropdownRender={dropdownRender}
        open={selectProps.open}
        // open
        getPopupContainer={() => parentDOM.current as HTMLDivElement}
        placeholder={intl.get(`${prefixLocale}.searchPlaceholder`)}
        dropdownMatchSelectWidth={false}
        onBlur={() => {
          setSelectProps(prevState => ({
            ...prevState,
            open: false
          }));
        }}
        onFocus={() => {
          setSelectProps(prevState => ({
            ...prevState,
            open: true
          }));
        }}
      />
      <Tooltip title={intl.get('workflow.information.viewChange')} placement="top">
        <Format.Button type="icon" onClick={switchList}>
          <SwapOutlined />
        </Format.Button>
      </Tooltip>
      <Tooltip title={intl.get(`${prefixLocale}.scanBtnToolTip`)} placement="top">
        <Format.Button
          type="icon"
          onClick={() => {
            onScanClick?.();
          }}
        >
          <IconFont type="icon-scanning" />
        </Format.Button>
      </Tooltip>
      <Format.Button type="icon" tip={intl.get('workflow.information.clearConfig')} onClick={onClearConfig}>
        <IconFont type="icon-quanbuyichu" />
      </Format.Button>
    </div>
  );
};

export default OntologyG6Search;
