/**
 * 导入本体
 */
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import intl from 'react-intl-universal';
import { Select, Empty, message } from 'antd';
import _ from 'lodash';
import servicesCreateEntity from '@/services/createEntity';
import Format from '@/components/Format';
import { PreviewCanvas, parseOntoGraph } from '@/components/SourceImportComponent';
import kong from '@/assets/images/kong.svg';
import './style.less';
import classNames from 'classnames';

const { Option } = Select;

export interface EntityPanelProps {
  isError?: boolean;
  onChange?: (data?: any) => void;
}
// 取出图谱坐标
const getGraphXY = (graph: any) => {
  const func = (item: any) => {
    const x = item._sourceData.x || item.x + window.innerWidth / 4;
    const y = item._sourceData.y || item.y + window.innerHeight / 5;
    return { ...item._sourceData, x, y };
  };
  const nodes = _.map(graph.nodes, func);
  const edges = _.map(graph.edges, func);
  return { nodes, edges };
};

const EntityPanel: React.ForwardRefRenderFunction<unknown, EntityPanelProps> = (props, ref) => {
  const { isError, onChange } = props;
  const [ontoList, setOntoList] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] }); // 图数据

  useImperativeHandle(ref, () => ({
    getGraph: () => (selected.graph_name ? getGraphXY(graphData) : null)
  }));

  useEffect(() => {
    getAllOnto();
  }, []);

  /**
   * 获取所有本体数据
   */
  const getAllOnto = async () => {
    const OntologyData = {
      page: -1,
      size: 10,
      order: 'descend',
      knw_id:
        window.sessionStorage.getItem('selectedKnowledgeId') &&
        parseInt(window.sessionStorage.getItem('selectedKnowledgeId')!)
    };
    const { res } = (await servicesCreateEntity.getAllNoumenon(OntologyData)) || {};
    if (res?.df) {
      setOntoList(res.df);
    }
  };

  /**
   * 切换本体
   */
  const onEntityChange = async (_: string, option: Record<string, any>) => {
    onChange?.(option);
    if (!option) {
      setSelected({});
      setGraphData({ nodes: [], edges: [] });
      return;
    }
    setSelected(option.data);
    const ontology_id = option.data.graph_otl.slice(1, -1);
    const { res, Code, Cause = '' } = (await servicesCreateEntity.getEntityInfo(ontology_id)) || {};

    if (res?.df) {
      setGraphData(parseOntoGraph(res.df[0]));
      return;
    }
    switch (true) {
      case Code === 500403:
        // message.error(intl.get('graphList.authErr'));
        message.error({
          content: intl.get('graphList.authErr'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        break;
      case Code === 500001 && Cause.includes('not exist'):
        // message.error(intl.get('createEntity.ontoNotExist'));
        message.error({
          content: intl.get('createEntity.ontoNotExist'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        break;
      default:
        // Cause && message.error(Cause);
        Cause &&
          message.error({
            content: Cause,
            className: 'custom-class',
            style: {
              marginTop: '6vh'
            }
          });
    }
  };

  return (
    <div className="flow-3-entity-Panel kw-h-100 kw-pt-5">
      <div className="p-title kw-mb-5">
        <Format.Title level={3}>{intl.get('createEntity.selectO')}</Format.Title>
      </div>
      <Select
        className={classNames('kw-w-100 kw-mb-5', { 'err-border': isError })}
        placeholder={intl.get('createEntity.inputOrSelect')}
        showSearch
        allowClear
        getPopupContainer={triggerNode => triggerNode.parentElement}
        value={selected.graph_name}
        onChange={onEntityChange}
        notFoundContent={<Empty image={kong} description={intl.get('global.noContent')} />}
      >
        {ontoList.map((item, index) => {
          return (
            <Option value={item.graph_name} key={item.graph_name} data={item}>
              {item.graph_name}
            </Option>
          );
        })}
      </Select>

      <div className="kw-space-between kw-mb-2">
        <div className="kw-c-header">
          {intl.get('workflow.information.preview')}
          <span className="kw-ml-2 kw-c-subtext">{intl.get('createEntity.previewOnto')}</span>
        </div>
      </div>

      <div className="preview-box">
        <PreviewCanvas graphData={graphData} center />
      </div>
    </div>
  );
};

export default forwardRef(EntityPanel);
