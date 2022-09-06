import React, { Component, createRef } from 'react';
import intl from 'react-intl-universal';
import { Button, message } from 'antd';

import serviceWorkflow from '@/services/workflow';

import RuleList from './ruleList';
import ClassInfo from './classInfo';
import ClassMuster from './classMuster';
import { updateProperty, newFirstHandleData, newHanleCheckData, newHandleDataToNext } from './assistFunction';

import './style.less';

class NewKnowledgeMap extends Component {
  musterRef = createRef();

  state = {
    nodes: [], // 实体类集合
    edges: [], // 关系类集合
    selectedElement: '', // 被选中点元素
    mapEntity: [],
    isLoadingNext: true, // 是否在加载数据
    fromRelation: false, // 用来定义nodeInfo是否显示返回按钮
    relationInfo: {} // 保存当前信息
  };

  componentDidUpdate(preProps) {
    if (preProps.current !== this.props.current && this.props.current === 4) {
      this.getDataForStepThree();
      this.getNodeGather();
    }
  }

  /**
   * @description 保存数据
   */
  saveInfo = selectedElement => {
    this.setState({ relationInfo: selectedElement });
  };

  /**
   * 生成保存的数据让父组件调用
   */
  getFlowData = () => {
    const { nodes, edges } = this.state;

    const { otls_map, relations_map } = newHandleDataToNext(nodes, edges);

    if (!otls_map.length && !relations_map.length) {
      return [];
    }

    const data = [{ otls_map, relations_map }];

    return data;
  };

  /**
   * @description 上一步
   */
  pre = () => {
    const { nodes, edges } = this.state;
    const { otls_map, relations_map } = newHandleDataToNext(nodes, edges);

    const data = { graph_step: 'graph_KMap', graph_process: [{ otls_map, relations_map }] };
    this.props.setKnowMapData(data.graph_process);

    this.props.prev();
  };

  /**
   * @description 从第三步后去点边数据
   */
  getDataForStepThree = () => {
    this.setState({ nodes: this.props.ontoData[0].entity, edges: this.props.ontoData[0].edge });
  };

  /**
   * @description 选中的类别
   */
  setSelectedElement = selectedElement => {
    this.setState({ selectedElement });
  };

  /**
   * @description  获取映射点的集合
   */
  getNodeGather = async () => {
    const { graphId } = this.props;
    const res = await serviceWorkflow.graphGetInfoExt(graphId);

    if (res && res.res) {
      this.setState({ mapEntity: res.res }, () => {
        const { nodes, edges, mapEntity } = this.state;
        this.getCheckData(nodes, edges, mapEntity);
      });
    }
  };

  /**
   * @description 修改点的信息
   */
  changeNodeInfo = data => {
    const { nodes, selectedElement } = this.state;
    nodes[this.getIndexForId(nodes, selectedElement.name)].nodeInfo = data;

    this.setState({ nodes });
  };

  /**
   * @description  如果所有信息错误解决，将点的错误标记去掉
   */
  changeNodeType = () => {
    const { nodes, selectedElement } = this.state;
    nodes[this.getIndexForId(nodes, selectedElement.name)].Type = 0;

    this.setState({ nodes });
  };

  /**
   * @description 根据类别name获取其在数组中的下标
   */
  getIndexForId = (arr, name) => {
    for (let i = 0, { length } = arr; i < length; i++) {
      if (name === arr[i].name) return i;
    }
  };

  /**
   * @description 获取校验之后点初始化数据
   */
  getCheckData = async (nodes, edges, mapEntity) => {
    if (this.props.knowMapData.length === 0) {
      const { newNodes, newEdges } = newFirstHandleData(nodes, edges, mapEntity);

      this.setState({ nodes: newNodes, edges: newEdges, isLoadingNext: false });
      return;
    }
    const data = {
      graphid: parseInt(this.props.graphId),
      graph_KMap: [
        {
          otls_map: this.props.knowMapData[0].otls_map,
          relations_map: this.props.knowMapData[0].relations_map
        }
      ]
    };

    // 第三步修改属性更新,如果属性不存在了，就在校验参数里去掉
    const { otls_map, relations_map } = updateProperty(this.props.ontoData, data);
    data.graph_KMap[0].otls_map = otls_map;
    data.graph_KMap[0].relations_map = relations_map;
    const saveRelationMap = relations_map;
    const resData = await serviceWorkflow.graphCheckKmApInfo(data);

    if (resData) {
      const { otls_map, relations_map } = resData;
      newHanleCheckData({ nodes, edges, mapEntity, otls_map, relations_map, saveRelationMap });
    }

    this.setState({ nodes, edges, isLoadingNext: false });
  };

  /**
   * @description 信息是否有效
   */
  infoValid = () => {
    const { nodes, edges } = this.state;

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].Type) return false;
    }
    for (let i = 0; i < edges.length; i++) {
      if (edges[i].Type) return false;
    }

    return true;
  };

  /**
   * @description 下一步
   */
  nextChange = async () => {
    if (this.state.isLoadingNext) return;
    if (!this.infoValid()) return message.error([intl.get('workflow.knowledge.infoError')]);

    this.setState({ isLoadingNext: true });
    const { nodes, edges } = this.state;
    const { otls_map, relations_map } = newHandleDataToNext(nodes, edges);

    const data = { graph_step: 'graph_KMap', graph_process: [{ otls_map, relations_map }] };
    const resData = await serviceWorkflow.graphEdit(this.props.graphId, data);
    this.setState({ isLoadingNext: false });

    if (resData && resData.res && resData.res.includes('success')) {
      this.props.setKnowMapData(data.graph_process);
      this.props.next();
    }
  };

  /**
   * @description 修改多文件关系
   */
  changeMoreFile = data => {
    const { edges, selectedElement } = this.state;

    const newEdges = edges?.map(item => {
      if (item?.relations?.join(',') === selectedElement?.relations?.join(',')) item.moreFile = data;
      return item;
    });

    this.setState({ edges: newEdges });
  };

  /**
   * @description 修改边的信息
   */
  changeEdgeInfo = data => {
    const { edges, selectedElement } = this.state;

    const newEdges = edges?.map(item => {
      if (item?.relations?.join(',') === selectedElement?.relations?.join(',')) item.edgeInfo = data;
      return item;
    });

    this.setState({ edges: newEdges });
  };

  /**
   * @description  如果所有信息错误解决，将点的错误标记去掉
   */
  changeEdgeType = () => {
    const { edges, selectedElement } = this.state;

    const newEdges = edges?.map(item => {
      if (item?.relations?.join(',') === selectedElement?.relations?.join(',')) item.Type = 0;
      return item;
    });

    this.setState({ edges: newEdges });
  };

  /**
   * @description 设置显示返回按钮
   */
  showButton = fromRelation => {
    this.setState({ fromRelation });
  };

  /**
   *@description 调用子元素的方法切换tab
   */
  changeTab = selectTag => {
    this.musterRef.current.selectTag(selectTag);
  };

  render() {
    const { nodes, edges, selectedElement, mapEntity, fromRelation, relationInfo } = this.state;
    const { current, infoExtrData } = this.props;

    return (
      <div className="new-knowledge-map">
        <div className="class-muster">
          <ClassMuster
            nodes={nodes}
            edges={edges}
            current={current}
            selectedElement={selectedElement}
            setSelectedElement={this.setSelectedElement}
            showButton={this.showButton}
            saveInfo={this.saveInfo}
            ref={this.musterRef}
          />
        </div>

        <div className="info">
          {selectedElement && selectedElement.colour && (
            <ClassInfo
              nodes={nodes}
              selectedElement={selectedElement}
              mapEntity={mapEntity}
              changeNodeInfo={this.changeNodeInfo}
              changeNodeType={this.changeNodeType}
              changeMoreFile={this.changeMoreFile}
              changeEdgeInfo={this.changeEdgeInfo}
              changeEdgeType={this.changeEdgeType}
              setSelectedElement={this.setSelectedElement}
              showButton={this.showButton}
              changeTab={this.changeTab}
              fromRelation={fromRelation}
              relationInfo={relationInfo}
            />
          )}
        </div>

        <div className="rule-list">
          <RuleList infoExtrData={infoExtrData} />
        </div>

        <div className="work-flow-footer">
          <Button className="ant-btn-default btn" onClick={this.pre}>
            {intl.get('workflow.previous')}
          </Button>
          <Button type="primary" className="btn" onClick={this.nextChange}>
            {intl.get('workflow.next')}
          </Button>
        </div>
      </div>
    );
  }
}

export default NewKnowledgeMap;
