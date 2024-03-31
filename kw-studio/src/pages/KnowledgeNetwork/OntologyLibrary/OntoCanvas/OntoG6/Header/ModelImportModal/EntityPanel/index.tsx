/**
 * 导入本体
 */
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import intl from 'react-intl-universal';
import { Select, Empty, message } from 'antd';
import G6 from '@antv/g6';
import _ from 'lodash';
import servicesCreateEntity from '@/services/createEntity';
import { isDef, getParam } from '@/utils/handleFunction';
import Format from '@/components/Format';
import { PreviewCanvas, handleParallelEdges } from '@/components/SourceImportComponent';
import kong from '@/assets/images/kong.svg';
import './style.less';
import classNames from 'classnames';

const { Option } = Select;

// 弹窗的画布宽高
const WIDTH = 714;
const HEIGHT = 357;

const parseOntoGraph = (otl: { entity: any[]; edge: any[] }) => {
  let offsetX = 0;
  let offsetY = 0;
  if (isDef(otl.entity?.[0]?.x)) {
    const centerX = _.sumBy(otl.entity, 'x') / otl.entity.length;
    const centerY = _.sumBy(otl.entity, 'y') / otl.entity.length;
    offsetX = centerX - WIDTH / 2;
    offsetY = centerY - HEIGHT / 2;
  }
  // 构建nodes
  const nodes = _.map(otl.entity, d => {
    if (d.colour) d.color = d.colour;
    const { name, alias, color, fill_color, icon, x, y } = d;
    const label = alias.length < 20 ? alias : `${alias.substring(0, 17)}...`;
    d.fx = x - offsetX;
    d.fy = y - offsetY;
    const nodeData: any = {
      id: name,
      label,
      icon,
      style: { fill: color || fill_color },
      _sourceData: d
    };

    return nodeData;
  });

  // 构建edges
  const edges = _.map(otl.edge || [], d => {
    if (d.colour) d.color = d.colour;
    const { relations, alias } = d;
    const [source, _, target] = relations;
    const color = d.color || d.fill_color;

    return {
      color,
      source,
      target,
      label: alias.length < 20 ? alias : `${alias.substring(0, 17)}...`,
      style: { endArrow: { fill: color, path: G6.Arrow.triangle(8, 10, source === target ? 0 : 10) } },
      _sourceData: d
    };
  });

  // 两节点多条边的处理
  handleParallelEdges(edges);
  return { nodes, edges };
};

export interface EntityPanelProps {
  knData: Record<string, any>;
  isError?: boolean;
  onChange?: (data?: any) => void;
}
// 取出图谱坐标
const getGraphXY = (graph: any) => {
  const func = (item: any) => {
    return { ..._.omit(item._sourceData, 'fx', 'fy') };
  };
  const nodes = _.map(graph.nodes, func);
  const edges = _.map(graph.edges, func);
  return { nodes, edges };
};

const OntoEntityPanel: React.ForwardRefRenderFunction<unknown, EntityPanelProps> = (props, ref) => {
  const { isError, onChange, knData } = props;
  const [ontoList, setOntoList] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] }); // 图数据

  useImperativeHandle(ref, () => ({
    getGraph: () => (selected.ontology_name ? getGraphXY(graphData) : null)
  }));

  useEffect(() => {
    getAllOnto();
  }, []);

  /**
   * 获取所有本体数据
   */
  const getAllOnto = async () => {
    const OntologyData = {
      knw_id: knData.id || getParam('knId'),
      page: -1,
      size: 10,
      rule: 'update',
      order: 'desc',
      search: '',
      filter: 'import'
    };
    const { res } = (await servicesCreateEntity.getAllNoumenon(OntologyData)) || [];
    if (res?.otls) {
      setOntoList(res.otls);
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
    const ontology_id = option.data.otl_id;
    const { res, Code, Cause = '' } = (await servicesCreateEntity.getEntityInfo(ontology_id)) || {};
    if (res?.id) {
      setGraphData(parseOntoGraph({ entity: res.entity, edge: res.edge }));
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
    <div className="flow-3-entity-Panel kw-h-100">
      <div className="p-title">
        <Format.Title style={{ fontWeight: 400 }} level={21}>
          {intl.get('createEntity.selectO')}
        </Format.Title>
      </div>
      <Select
        className={classNames('kw-w-100 kw-mb-4', { 'err-border': isError })}
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
            <Option value={item.ontology_name} key={item.ontology_name} data={item}>
              {item.ontology_name}
            </Option>
          );
        })}
      </Select>

      <div className="kw-space-between kw-mb-4">
        <div className="kw-c-header">
          {intl.get('workflow.information.preview')}
          <span className="kw-ml-2 kw-c-subtext">{intl.get('createEntity.previewOnto')}</span>
        </div>
      </div>

      <div className="preview-box">
        <PreviewCanvas graphData={graphData} />
      </div>
    </div>
  );
};

export default forwardRef(OntoEntityPanel);
