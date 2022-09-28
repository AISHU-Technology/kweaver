/* eslint-disable max-lines */
import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { withRouter } from 'react-router-dom';
import { Button, message, Modal, ConfigProvider } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import FreeGraph from '@/components/freeGraph';
import NewCreateEntityHead from '@/components/NewCreateEntityHead';
import NewCreateEnityRightMenu from '@/components/newCreateEnityRightMenu';
import { setSaveData, analyUrl, isFlow, handleTaskId } from './assistFunction';

import './style.less';

class CreateEntity extends Component {
  state = {
    centerSelect: '', // 选择中间操作栏里的操作
    rightSelect: '', // 右上角操作栏选择
    nodes: [], // 点集合
    edges: [], // 边集合
    selectedElement: '', // 选中的点或边
    dataInfoRef: '', // dataInfo模块
    nodeFamilyRef: '', // nodeFamily模块
    edgeFamilyRef: '', // edgeFamily模块
    gatherListRef: '', // gatherList模块
    freeGraphRef: '', // freeGraphRef模块
    taskListRef: '', // taskList模块
    newCreateEntityHeadRefRef: '',
    ontology_id: '', // 本体库id
    used_task: [], // 使用过的任务
    ontology_name: '', // 本体名
    ontology_des: '', // 本体描述
    modalVisible: false, // 退出弹框
    isTouch: false,
    editEntityModalRef: ''
  };

  isFistLoading = true;

  signalNext = false;

  componentDidMount() {
    if (window.location.pathname === '/new-create-entity') {
      setTimeout(() => {
        document.title = `${intl.get('createEntity.title')}_KWeaver`;
      }, 0);
    }
      this.getEditData();
    this.props.childRef && (this.props.childRef.current = this);
  }

  componentDidUpdate(prevProps, preStates) {
    if (isFlow() && prevProps.current !== this.props.current && this.props.current === 2) {
      this.handleFlowData();
    }
  }

  /**
   * @description 获取初始数据（编辑进入）
   */
  getEditData = async () => {
    if (isFlow()) {
      return;
    }

    const { name, type } = analyUrl(window.location.search);
    if (name && (type === 'edit' || type === 'view')) {
      const res = await servicesCreateEntity.getEntityInfo(decodeURI(name));

      if (res && res.res && res.res.df[0]) {
        this.setState({
          ontology_name: res.res.df[0].ontology_name,
          ontology_des: res.res.df[0].ontology_des,
          used_task: res.res.df[0].used_task,
          ontology_id: res.res.df[0].id
        });
        const ontologyId = res.res.df[0].id;
        this.props.ontoData([{ ontology_id: res.res.df[0].id }]);
        this.props.setOntologyId(res.res.df[0].id);
        const { Hentity, Hedge } = handleTaskId(res.res.df[0].entity, res.res.df[0].edge);

        this.state.freeGraphRef.externalImport({ entity: Hentity, edge: Hedge });
        this.flowEditEntity(ontologyId);
      }
    }
  };

  /**
   * @param 编辑本体
   */

  flowEditEntity = async value => {
    const { graphName, graphDes, graphId } = this.props;
    const data = {
      ontology_name: graphName,
      ontology_des: graphDes,
      id: value
    };

    const requestData = {
      graph_step: 'graph_otl',
      updateoradd: 'update_otl_name',
      graph_process: [data]
    };

    const resData = await servicesCreateEntity.changeFlowData(graphId, requestData);

    if (resData && resData.Code === 500002) {
      this.addEntityF();
    }

    if (resData && resData.res) {
      this.changeEntityT(data);
    }
  };

  /**
   * @description 处理流程数据
   */
  handleFlowData = () => {
    if (isFlow()) {
      // 流程第三步新增处理
      if (this.props.ontoData.length === 0) return this.openEditEntityModal();
      if (!this.props.ontoData[0].ontology_name || typeof this.props.ontoData[0].id !== 'number') {
        this.openEditEntityModal();
        return;
      }
      if (!this.isFistLoading) return;
      this.isFistLoading = false;

      // 流程第三步编辑处理
      if (this.props.ontoData && this.props.ontoData[0]) {
        const { used_task, entity, edge, id, ontology_name, ontology_des } = this.props.ontoData[0];
        this.setState({
          ontology_id: id,
          used_task,
          ontology_name,
          ontology_des
        });

        const { Hentity, Hedge } = handleTaskId(entity, edge);
        this.state.freeGraphRef.externalImport({ entity: Hentity, edge: Hedge });
      }
    }
  };

  /**
   * @description 打开编辑弹窗
   */
  openEditEntityModal = () => {
    if (this.props.ontologyError !== '') {
      setTimeout(() => {
        this.state.newCreateEntityHeadRefRef.setEditEntityModal(false);
      }, 0);
    }
  };

  /**
   * @description 设置本体名称
   */
  setName = ontology_name => {
    this.setState({ ontology_name });
  };

  /**
   * @description 设置本体描述
   */
  setDes = ontology_des => {
    this.setState({ ontology_des });
  };

  /**
   * @description 修改点
   */
  setNodes = nodes => {
    this.setState({ nodes });
  };

  /**
   * @description 修改边
   */
  setEdges = edges => {
    this.setState({ edges });
  };

  /**
   * @description 设置使用过的任务
   */
  setUsedTask = used_task => {
    this.setState({ used_task });
  };

  /**
   * @description 选中元素
   */
  setSelectedElement = selectedElement => {
    this.setState({ selectedElement });
  };

  /**
   * @description 获取freeGraph组件内部方法
   */
  onFreeGraphRef = ref => {
    this.setState({ freeGraphRef: ref });
  };

  /**
   *  @description 获取dataInfo组件内部方法
   */
  onDataInfoRef = ref => {
    this.setState({ dataInfoRef: ref });
  };

  /**
   * @description 获取nodeFamily组件内部方法
   */
  onNodeFamilyRef = ref => {
    this.setState({ nodeFamilyRef: ref });
  };

  /**
   *
   * @description 获取nodeFamily组件内部方法
   */
  onEdgeFamilyRef = ref => {
    this.setState({ edgeFamilyRef: ref });
  };

  /**
   *
   * @description 获取gatherList组件内部方法
   */
  onGatherListRef = ref => {
    this.setState({ gatherListRef: ref });
  };

  /**
   * @description 获取tasklist组件内部方法
   */
  onTaskListRef = ref => {
    this.setState({ taskListRef: ref });
  };

  /**
   * @description 获取newCreateEntityHeadRef组件内部方法
   */
  onNewCreateEntityHeadRef = ref => {
    this.setState({ newCreateEntityHeadRefRef: ref });
  };

  /**
   * @description 获取编辑本体组件
   */
  onEditEntityModalRef = ref => {
    this.setState({ editEntityModalRef: ref });
  };

  /**
   * @description 选择中间的操作工具
   */
  selectCenterTool = centerSelect => {
    const { dataInfoRef } = this.state;

    // 如果输入栏有错误，则取消操作
    if (dataInfoRef) {
      if (dataInfoRef.state.checkData.isIncorrect) return;

      if (dataInfoRef.formNameRef.current) {
        dataInfoRef.formNameRef.current
          .validateFields()
          .then(() => {
            this.setState({ centerSelect });
          })
          .catch(() => {});

        this.setState({ centerSelect });
        return;
      }
    }

    this.setState({ centerSelect });
  };

  /**
   * @description 保存并关闭
   */
  getFlowData = () => {
    const { nodes, edges, ontology_id, used_task, ontology_name } = this.state;

    if (!ontology_name) return [];

    const { entity, edge } = setSaveData(nodes, edges);
    const data = {
      entity,
      edge,
      used_task,
      id: ontology_id,
      ontology_id: ontology_id.toString(),
      ontology_name,
      ontology_des: this.props.ontology_des
    };

    return [data];
  };

  /**
   * @description 选择右侧操作工具
   */
  selectRightTool = (rightSelect, isIgnoreCheck) => {
    const { dataInfoRef } = this.state;

    // 是否忽略检查
    if (isIgnoreCheck) {
      this.setState({ rightSelect });
      return;
    }

    // 如果输入栏有错误，则取消操作
    if (dataInfoRef) {
      if (dataInfoRef.state.checkData.isIncorrect) return;

      if (dataInfoRef.formNameRef.current) {
        dataInfoRef.formNameRef.current
          .validateFields()
          .then(() => {
            this.setState({ rightSelect });
          })
          .catch(() => {});
        return;
      }
    }

    this.setState({ rightSelect });
  };

  /**
   * @description 校验保存数据
   */
  checkSaveData = type => {
    const { nodes, edges } = this.state;

    if (nodes.length === 0) {
      message.warning([intl.get('createEntity.hasNode')]);
      return true;
    }

    const checkNodes = [...nodes, ...edges];
    const checkEdges = [...edges, ...nodes];
    const reg = /^\w+$/;
    const maxLength = 50;

    for (let i = 0, { length } = nodes; i < length; i++) {
      for (let j = 0, { length } = checkNodes; j < length; j++) {
        if (
          (nodes[i].name &&
            checkNodes[j].name &&
            nodes[i]?.name?.toLowerCase() === checkNodes[j]?.name?.toLowerCase() &&
            i !== j) ||
          !reg.test(nodes[i].name) ||
          nodes[i].name.length > maxLength ||
          (nodes[i]?.alias?.toLowerCase() === checkNodes[j]?.alias?.toLowerCase() && i !== j && i < nodes.length - 1)
        ) {
          this.selectRightTool('gatherList');

          setTimeout(() => {
            this.state.gatherListRef && this.state.gatherListRef.changeSelectedTag('node');
            this.state.nodeFamilyRef && this.state.nodeFamilyRef.scrollTop(i * 47);
          }, 0);

          if (type) {
            message.error([intl.get('createEntity.ee')]);
          } else {
            message.error([intl.get('createEntity.configError')]);
          }

          return true;
        }
      }
    }

    for (let i = 0, { length } = edges; i < length; i++) {
      for (let j = 0, { length } = checkEdges; j < length; j++) {
        if (
          (edges[i].name &&
            checkEdges[j].name &&
            edges[i]?.name?.toLowerCase() === checkEdges[j]?.name?.toLowerCase() &&
            edges[i].source.name === checkEdges[j].source.name &&
            edges[i].target.name === checkEdges[j].target.name &&
            i !== j) ||
          !reg.test(edges[i].name) ||
          edges[i].name?.length > maxLength
        ) {
          this.selectRightTool('gatherList');

          setTimeout(() => {
            this.state.gatherListRef && this.state.gatherListRef.changeSelectedTag('line');
            this.state.edgeFamilyRef && this.state.edgeFamilyRef.scrollTop(i * 47);
          }, 0);

          if (type) {
            message.error([intl.get('createEntity.ee')]);
          } else {
            message.error([intl.get('createEntity.configEdgeRepeatError')]);
          }

          return true;
        }
      }
    }

    return false;
  };

  /**
   * @description 保存到后端数据是否正确（不校验是否为空）
   */
  isSaveData = () => {
    const { nodes, edges } = this.state;

    const checkNodes = [...nodes, ...edges];
    const checkEdges = [...edges, ...nodes];
    const reg = /^\w+$/;
    const maxLength = 50;

    for (let i = 0, { length } = nodes; i < length; i++) {
      for (let j = 0, { length } = checkNodes; j < length; j++) {
        if (
          (nodes[i]?.name?.toLowerCase() === checkNodes[j]?.name?.toLowerCase() && i !== j) ||
          !reg.test(nodes[i].name) ||
          nodes[i].name.length > maxLength ||
          (nodes[i]?.alias?.toLowerCase() === checkNodes[j]?.alias?.toLowerCase() && i !== j && i < nodes.length - 1)
        ) {
          this.selectRightTool('gatherList');

          setTimeout(() => {
            this.state.gatherListRef && this.state.gatherListRef.changeSelectedTag('node');
            this.state.nodeFamilyRef && this.state.nodeFamilyRef.scrollTop(i * 47);
          }, 0);

          message.error([intl.get('createEntity.configError')]);

          return true;
        }
      }
    }

    for (let i = 0, { length } = edges; i < length; i++) {
      for (let j = 0, { length } = checkEdges; j < length; j++) {
        if (
          (edges[i]?.name?.toLowerCase() === checkEdges[j]?.name?.toLowerCase() &&
            edges[i].source.name === checkEdges[j].source.name &&
            edges[i].target.name === checkEdges[j].target.name &&
            i !== j) ||
          !reg.test(edges[i].name) ||
          edges[i].name?.length > maxLength
        ) {
          this.selectRightTool('gatherList');

          setTimeout(() => {
            this.state.gatherListRef && this.state.gatherListRef.changeSelectedTag('line');
            this.state.edgeFamilyRef && this.state.edgeFamilyRef.scrollTop(i * 47);
          }, 0);

          message.error([intl.get('createEntity.configEdgeRepeatError')]);

          return true;
        }
      }
    }

    return false;
  };

  /**
   * @description 保存数据
   */
  saveData = async () => {
    if (this.isSaveData()) {
      return;
    }

    const { nodes, edges, ontology_id, used_task, dataInfoRef } = this.state;
    const { entity, edge } = setSaveData(nodes, edges);
    const data = { entity, edge, used_task, flag: 'save' };

    // 如果输入栏有错误，则取消操作
    if (dataInfoRef) {
      if (dataInfoRef.state.checkData.isIncorrect) {
        message.error([intl.get('createEntity.de')]);
        this.state.dataInfoRef.setActiveKey(['1', '2']);

        return;
      }

      if (dataInfoRef.formNameRef.current) {
        dataInfoRef.formNameRef.current
          .validateFields()
          .then(async () => {
            const res = await servicesCreateEntity.updateEntity(data, ontology_id);

            if (res && res.res) {
              message.success([intl.get('datamanagement.savedSuccessfully')]);
              this.setTouch(false);
            }
            if (res && res.Code === 500026) {
              message.warning([intl.get('createEntity.predicting')]);
            }
            if (res && res.Code === 'Studio.Graph.KnowledgeNetworkNotFoundError') {
              message.error([intl.get('createEntity.entityDelete')]);
              setTimeout(() => {
                this.props.history.push('/home/data-management/onto');
              }, 1000);
            }
          })
          .catch(() => {
            message.error([intl.get('createEntity.de')]);
            this.state.dataInfoRef.setActiveKey(['1', '2']);
          });

        return;
      }
    }

    const res = await servicesCreateEntity.updateEntity(data, ontology_id);

    if (res && res.res) {
      message.success([intl.get('datamanagement.savedSuccessfully')]);
      this.setTouch(false);
    }
    if (res && res.Code === 500026) {
      message.warning([intl.get('createEntity.predicting')]);
    }
    if (res && res.Code === 'Studio.Graph.KnowledgeNetworkNotFoundError') {
      message.error([intl.get('createEntity.entityDelete')]);
      setTimeout(() => {
        this.props.history.push('/home/data-management/onto');
      }, 1000);
    }
  };

  /**
   * @description 设置本体id
   */
  setOntologyId = ontology_id => {
    this.setState({ ontology_id });
  };

  /**
   * @description 取消关联的数据源
   */
  cancelSource = data => {
    let { nodes, edges } = this.state;

    // 取消点
    if (typeof data.entity_id === 'number') {
      nodes = nodes.map((item, index) => {
        if (data.entity_id === item.entity_id) {
          item.dataType = '';
          item.data_source = '';
          item.ds_id = '';
          item.ds_name = '';
          item.ds_path = '';
          item.extract_type = '';
          item.file_type = '';
          item.model = '';
          item.source_table = [];
          item.source_type = 'manual';
          item.task_id = '';
          item.ds_address = '';

          item.properties = data.properties.map(ditem => [ditem[0], ditem[1]]);
          return item;
        }

        return item;
      });
    }

    // 取消边
    if (typeof data.edge_id === 'number') {
      edges = edges.map(item => {
        if (data.edge_id === item.edge_id) {
          item.dataType = '';
          item.data_source = '';
          item.ds_id = '';
          item.ds_name = '';
          item.ds_path = '';
          item.extract_type = '';
          item.file_type = '';
          item.model = '';
          item.source_table = [];
          item.source_type = 'manual';
          item.task_id = '';

          item.properties = data.properties.map(ditem => [ditem[0], ditem[1]]);
          return item;
        }

        return item;
      });
    }

    this.setState({ nodes, edges });
    this.deleteTaskFromSource(nodes, edges, data.task_id);
  };

  /**
   * @description 删除关联数据源引起点任务删除
   */
  deleteTaskFromSource = async (nodes, edges, task_id) => {
    if (typeof task_id === 'number') {
      let taskId = [];

      nodes.forEach((item, index) => {
        if (typeof item.task_id === 'number') taskId = [...taskId, item.task_id];
      });

      edges.forEach((item, index) => {
        if (typeof item.task_id === 'number') taskId = [...taskId, item.task_id];
      });

      taskId = Array.from(new Set(taskId));

      if (!taskId.includes(task_id)) {
        const res = await servicesCreateEntity.deleteEntityTask({ task_list: [task_id] });

        if (res && res.res) {
          // 如果使用的过的任务里有删除的任务，则在使用过的任务中删除该任务
          let { used_task } = this.state;

          used_task = used_task.filter((item, index) => {
            return item !== task_id;
          });

          this.setState({ used_task });
        }
      }
    }
  };

  /**
   * @description 退出弹窗
   */
  setModalVisible = modalVisible => {
    this.setState({ modalVisible });
  };

  /**
   * @description 退出不保存
   */
  quit = async () => {
    const { ontology_id } = this.state;

    if (!ontology_id) {
      this.props.history.push('/home/data-management/onto');
    }

    const res = await servicesCreateEntity.delAllEntityTask(ontology_id);

    if (res && res.res) {
      this.props.history.push('/home/data-management/onto');
      return;
    }

    if (res && res.Code) {
      message.error([intl.get('createEntity.entityDelete')]);
      setTimeout(() => {
        this.props.history.push('/home/data-management/onto');
      }, 1000);
    }
  };

  /**
   * @description 流程三检验数据
   */
  saveFlowData = async type => {
    if (this.checkSaveData() || this.signalNext) return;

    const { nodes, edges, used_task, dataInfoRef, ontology_name, ontology_des, ontology_id } = this.state;
    const { entity, edge } = setSaveData(nodes, edges);
    const data = {
      entity,
      edge,
      used_task,
      id: ontology_id !== '' ? ontology_id : this.props.ontologyId,
      ontology_id: ontology_id !== '' ? ontology_id.toString() : this.props.ontologyId.toString(),
      flag: type === 'check' ? 'save' : 'nextstep'
    };

    const requestData = {
      graph_step: 'graph_otl',
      updateoradd: 'update_otl_info',
      graph_process: [data]
    };

    this.signalNext = true;

    // 如果输入栏有错误，则取消操作
    if (dataInfoRef) {
      if (dataInfoRef.state.checkData.isIncorrect) {
        message.error([intl.get('createEntity.de')]);
        this.state.dataInfoRef.setActiveKey(['1', '2']);
        this.signalNext = false;
        return;
      }

      if (dataInfoRef.formNameRef.current) {
        dataInfoRef.formNameRef.current
          .validateFields()
          .then(async () => {
            const resData = await servicesCreateEntity.changeFlowData(this.props.graphId, requestData);

            this.signalNext = false;

            if (resData && resData.res) {
              data.ontology_name = ontology_name;
              data.ontology_des = ontology_des;
              this.props.setOntoData([data]);
              if (type === 'check') {
                message.success([intl.get('createEntity.vc')]);
              }

              if (type === 'next') {
                this.isFistLoading = false;
                this.props.next();
              }
            }

            if (resData && resData.Code === 500026) {
              message.warning([intl.get('createEntity.predicting')]);
            }

            if (resData && resData.Code) {
              this.props.next(resData);
            }
          })
          .catch(() => {
            message.error([intl.get('createEntity.de')]);
            this.state.dataInfoRef.setActiveKey(['1', '2']);
          });

        return;
      }
    }

    const resData = await servicesCreateEntity.changeFlowData(this.props.graphId, requestData);

    this.signalNext = false;

    if (resData && resData.res) {
      data.ontology_name = ontology_name;
      data.ontology_des = ontology_des;

      this.props.setOntoData([data]);

      if (type === 'check') {
        message.success([intl.get('createEntity.vc')]);
      }

      if (type === 'next') {
        this.isFistLoading = false;
        this.props.next();
      }
    }

    if (resData && resData.Code === 500026) {
      message.warning([intl.get('createEntity.predicting')]);
    }

    if (resData && resData.Code) {
      this.props.next(resData);
    }
  };

  /**
   * @description 用户是否操作过页面
   */
  setTouch = isTouch => {
    this.setState({ isTouch });
  };

  render() {
    const {
      centerSelect,
      nodes,
      edges,
      rightSelect,
      selectedElement,
      dataInfoRef,
      used_task,
      ontology_name,
      ontology_id,
      taskListRef,
      modalVisible,
      isTouch
    } = this.state;

    const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型 // 进入图谱的类型
    return (
      <div className="new-create-entity">
        <div className="head-tent-c">
          <NewCreateEntityHead
            freeGraphRef={this.state.freeGraphRef}
            onNewCreateEntityHeadRef={this.onNewCreateEntityHeadRef}
            dataInfoRef={dataInfoRef}
            centerSelect={centerSelect}
            selectCenterTool={this.selectCenterTool}
            selectRightTool={this.selectRightTool}
            nodes={nodes}
            edges={edges}
            checkSaveData={this.checkSaveData}
            ontologyId={this.props.ontologyId}
            ontology_id={ontology_id}
            setOntologyId={this.setOntologyId}
            used_task={used_task}
            setUsedTask={this.setUsedTask}
            ontology_name={ontology_name}
            setName={this.setName}
            setDes={this.setDes}
            taskListRef={taskListRef}
            graphId={this.props.graphId}
            ontoData={this.props.ontoData}
            setModalVisible={this.setModalVisible}
            prev={this.props.prev}
            setQuitVisible={this.props.setQuitVisible}
            setTouch={this.setTouch}
            setOntoData={this.props.setOntoData}
            isTouch={isTouch}
            quit={this.quit}
            onEditEntityModalRef={this.onEditEntityModalRef}
            selectedElement={selectedElement}
            graphName={this.props.graphName}
            setOntologyDes={this.props.setOntologyDes}
            ontology_des={this.props.ontology_des}
          />
        </div>

        <div className={isFlow() ? 'graph-content-flow' : 'graph-content'}>
          <FreeGraph
            onFreeGraphRef={this.onFreeGraphRef}
            centerSelect={centerSelect}
            selectCenterTool={this.selectCenterTool}
            selectRightTool={this.selectRightTool}
            nodes={nodes}
            edges={edges}
            dataInfoRef={dataInfoRef}
            selectedElement={selectedElement}
            setSelectedElement={this.setSelectedElement}
            setNodes={this.setNodes}
            setEdges={this.setEdges}
            used_task={used_task}
            setUsedTask={this.setUsedTask}
            taskListRef={taskListRef}
            current={this.props.current}
            setTouch={this.setTouch}
            rightSelect={rightSelect}
          />
        </div>

        {rightSelect ? (
          <div className={isFlow() ? 'right-menu-flow' : 'right-menu'}>
            <NewCreateEnityRightMenu
              nodes={nodes}
              edges={edges}
              dbType={this.props.dbType}
              selectedElement={selectedElement}
              freeGraphRef={this.state.freeGraphRef}
              rightSelect={rightSelect}
              selectRightTool={this.selectRightTool}
              dataInfoRef={dataInfoRef}
              onDataInfoRef={this.onDataInfoRef}
              setSelectedElement={this.setSelectedElement}
              checkSaveData={this.checkSaveData}
              onNodeFamilyRef={this.onNodeFamilyRef}
              onEdgeFamilyRef={this.onEdgeFamilyRef}
              onGatherListRef={this.onGatherListRef}
              ontology_id={this.props.ontologyId}
              setEdges={this.setEdges}
              cancelSource={this.cancelSource}
              onTaskListRef={this.onTaskListRef}
              used_task={used_task}
              setUsedTask={this.setUsedTask}
              setTouch={this.setTouch}
            />
          </div>
        ) : null}

        <div className="bottom-box bottom-flow">
          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button className="ant-btn-default cancel" onClick={this.props.prev}>
              {[intl.get('createEntity.previous')]}
            </Button>
          </ConfigProvider>

          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button
              type="primary"
              className="check"
              onClick={() => {
                this.saveFlowData('check');
              }}
            >
              {[intl.get('createEntity.check')]}
            </Button>
          </ConfigProvider>

          <ConfigProvider autoInsertSpaceInButton={false}>
            <Button
              className="ant-btn-default cancel"
              onClick={() => {
                this.saveFlowData('next');
              }}
            >
              {[intl.get('createEntity.next')]}
            </Button>
          </ConfigProvider>
        </div>

        {/* {!ontology_id || TYPE === 'view' ? null : isFlow() ? (
          <div className="bottom-box bottom-flow">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default cancel" onClick={this.props.prev}>
                {[intl.get('createEntity.previous')]}
              </Button>
            </ConfigProvider>

            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                type="primary"
                className="check"
                onClick={() => {
                  this.saveFlowData('check');
                }}
              >
                {[intl.get('createEntity.check')]}
              </Button>
            </ConfigProvider>

            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default cancel"
                onClick={() => {
                  this.saveFlowData('next');
                }}
              >
                {[intl.get('createEntity.next')]}
              </Button>
            </ConfigProvider>
          </div>
        ) : (
          <div className="bottom-box bottom-create">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default cancel"
                onClick={() => {
                  if (!isTouch) {
                    this.quit();

                    return;
                  }

                  this.setModalVisible(true);
                }}
              >
                {[intl.get('createEntity.signout')]}
              </Button>
            </ConfigProvider>

            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                type="primary"
                className="save"
                onClick={() => {
                  this.saveData(true);
                }}
              >
                {[intl.get('createEntity.save')]}
              </Button>
            </ConfigProvider>
          </div>
        )} */}

        <Modal
          className="delete-create-info-4567911-cne"
          visible={modalVisible}
          bodyStyle={{ height: 92 }}
          footer={[
            <ConfigProvider key="deleteCreateInfo" autoInsertSpaceInButton={false}>
              <Button
                className="ant-btn-default add-modal-cancel"
                key="cancel"
                onClick={() => {
                  this.setModalVisible(false);
                }}
              >
                {[intl.get('createEntity.cancel')]}
              </Button>
              <Button type="primary" className="add-modal-save" key="ok" onClick={this.quit}>
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          ]}
          closable={false}
        >
          <div className="title-content">
            <InfoCircleFilled className="icon" />
            <span className="title-word">{[intl.get('createEntity.outLineOne')]}</span>
          </div>
          <div className="content-word">{[intl.get('createEntity.outLineTwo')]}</div>
        </Modal>
      </div>
    );
  }
}

export default withRouter(CreateEntity);
