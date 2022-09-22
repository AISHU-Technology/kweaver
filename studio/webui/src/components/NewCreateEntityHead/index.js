/* eslint-disable max-lines */
import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { withRouter } from 'react-router-dom';
import { Button, ConfigProvider, Modal, message } from 'antd';
import { LeftOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import servicesCreateEntity from '@/services/createEntity';

import IconFont from '@/components/IconFont';
import EdgesModal from './edgesModal';
import ExportModal from './exportModal';
import EditEntityModal from './editEntityModal';
import { handleTaskData, asError, handAsData, isFlow, analyUrl } from './assistFunction';

import dianIcon from '@/assets/images/dian.svg';
import edgeIcon from '@/assets/images/edge.svg';
import daoruIcon from '@/assets/images/daoru.svg';
import guanxileiIcon from '@/assets/images/guanxilei.svg';
import './style.less';

const PAGESIZE = 20;

class NewCreateEntityHead extends Component {
  state = {
    edgesModal: false, // 关系类管理弹窗
    exportModal: false, // 一键导入弹窗
    editEntityModal: true, // 编辑本体弹窗
    saveData: {
      data: undefined, // 数据
      type: 'entity' // 导入类型
    } // 预测点数据
  };
  isGetTaskData = false; // 是否有获取任务数据的接口正在调用(如果有，则定时器不发送请求)

  isBuildTaskAPIRun = false; // 是否构建任务的接口被点击（如果被点击，则下次请求不触发，用于阻止双击产生两个任务）

  componentDidMount() {
    const { graphName, setName, setOntologyId, graphId } = this.props;
    this.props.onNewCreateEntityHeadRef(this);
    this.interValGetData();
    setName(graphName);
    // setOntologyId();
    if (typeof graphId === 'number') {
      const ontology_id = graphId;
      setOntologyId(graphId);
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  /**
   * @description 单击添加节点
   */
  addNode = () => {
    this.props.freeGraphRef && this.props.freeGraphRef.addNode();
    this.props.setTouch(true);
  };

  /**
   * @description 获取需要预测点数据
   */
  setSaveData = saveData => {
    this.setState({
      saveData
    });
  };

  /**
   * @description 获取第一页点数据(正在预测点任务一直在第一页，所以用第一页也判断是否预测完点状态)
   */
  getPageOneData = async () => {
    const { ontology_id, used_task } = this.props;

    if (typeof ontology_id !== 'number') {
      return;
    }

    const data = {
      page: this.props.taskListRef ? this.props.taskListRef.state.page : 1,
      size: PAGESIZE,
      ontology_id,
      used_task
    };

    this.isGetTaskData = true;

    const res = await servicesCreateEntity.getEntityTasks(data);

    // 处理任务数据点和边，导入到绘图中
    if (res && res.res && res.res.result_info && res.res.result_info.results.length > 0) {
      const { taskListData, addUsedTask } = handleTaskData(res.res.result_info.results);

      this.props.setUsedTask([...used_task, ...addUsedTask]);

      this.props.freeGraphRef.taskImport(taskListData);
    }

    if (res && res.res && res.res.result_info) {
      // 更新右侧任务列表
      if (this.props.taskListRef) {
        this.props.taskListRef.intervalUpdateData(res.res.task_info.task_count, res.res.task_info.tasks);
      }
    }

    if (res && res.res && res.res.all_task_status === 'finished') {
      clearInterval(this.timer);
    }

    this.isGetTaskData = false;
  };

  /**
   * @description 定时器获取任务信息
   */
  interValGetData = () => {
    this.getPageOneData();

    clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (this.isGetTaskData) {
        return;
      }

      this.getPageOneData();
    }, 2000);
  };

  /**
   * @description 生成本体
   */
  onSave = async () => {
    const { saveData } = this.state;
    const { ontology_id } = this.props;

    if (saveData.type === 'entity') {
      // 如果data为 '',给输入框添加报错状态
      if (saveData.data === undefined) {
        saveData.data = '';

        this.setState({
          saveData
        });

        return;
      }

      this.props.freeGraphRef.externalImport(saveData.data);
    }

    if (saveData.type === 'model') {
      const { entity, edge } = saveData.data;

      let newEdge = [];

      for (let i = 0, { length } = edge; i < length; i++) {
        newEdge = [...newEdge, edge[i].data];
      }

      this.props.freeGraphRef.externalImport({ entity, edge: newEdge });
    }

    if (saveData.type === 'sql') {
      if (saveData.data && saveData.data.length > 0) {
        if (this.isBuildTaskAPIRun) {
          return;
        }

        // 数据表预测添加任务处理
        const resquestData = {
          ds_id: saveData.selectedValue.id,
          file_list: saveData.data,
          ontology_id,
          postfix: ''
        };

        this.isBuildTaskAPIRun = true;

        const resStandData = await servicesCreateEntity.buildTask(resquestData);

        this.ErrorShow(resStandData);

        if (resStandData && resStandData.res) {
          this.interValGetData();

          this.props.selectRightTool('taskList');
        }

        this.isBuildTaskAPIRun = false;
      } else {
        message.error(intl.get('createEntity.noSelectData'));

        return;
      }
    }

    if (saveData.type === 'as') {
      if (saveData.data && saveData.data.length > 0) {
        // as数据处理(标注抽取)
        if (saveData.selectedValue.extract_type === 'labelExtraction') {
          const resquestData = {
            data_source: saveData.selectedValue.data_source,
            ds_id: saveData.selectedValue.id.toString(),
            extract_type: 'labelExtraction',
            // file_list: [[saveData.data[0][0].docid, saveData.data[0][2], saveData.data[0][0].name]],
            file_list: [
              { docid: saveData.data[0][0].docid, type: saveData.data[0][0].type, name: saveData.data[0][0].name }
            ],
            postfix: saveData.selectedValue.postfix
          };

          const resData = await servicesCreateEntity.getFileGraphData(resquestData);

          asError(resData);

          if (resData && resData.res && resData.res.entity_list.length) {
            const { nodes, edges } = handAsData(resData.res, saveData.selectedValue);

            this.props.freeGraphRef.externalImport({ entity: nodes, edge: edges });
          }
        }

        // as数据处理(标准抽取)
        if (saveData.selectedValue.extract_type === 'standardExtraction') {
          if (this.isBuildTaskAPIRun) {
            return;
          }

          const file_list = saveData.data.map((item, index) => {
            return item[0];
          });

          const resquestData = {
            ds_id: saveData.selectedValue.id,
            file_list,
            ontology_id,
            postfix: saveData.selectedValue.postfix
          };

          this.isBuildTaskAPIRun = true;

          const resStandData = await servicesCreateEntity.buildTask(resquestData);

          this.ErrorShow(resStandData);

          if (resStandData && resStandData.res) {
            this.interValGetData();

            this.props.selectRightTool('taskList');
          }

          this.isBuildTaskAPIRun = false;
        }
      } else {
        message.error(intl.get('createEntity.noSelectData'));

        return;
      }
    }

    if (saveData.type === 'rabbitmq') {
      if (this.isBuildTaskAPIRun) {
        return;
      }

      // 数据表预测添加任务处理
      const resquestData = {
        ds_id: saveData.data.id,
        file_list: [saveData.data.queue],
        ontology_id,
        postfix: ''
      };

      this.isBuildTaskAPIRun = true;

      const resStandData = await servicesCreateEntity.buildTask(resquestData);

      this.isBuildTaskAPIRun = false;
      this.ErrorShow(resStandData);

      if (resStandData && resStandData.res) {
        this.interValGetData();

        this.props.selectRightTool('taskList');
      }
    }

    this.closeExportModal();
  };

  /**
   * @description 错误提示
   */
  ErrorShow = resStandData => {
    if (resStandData && resStandData.Code === 500026) {
      message.error(intl.get('createEntity.taskError'));

      return;
    }

    if (resStandData && resStandData.Code === 500002) {
      message.error(intl.get('createEntity.sourceIncorrect'));
    }

    if (resStandData && resStandData.Code === 500006) {
      message.error(intl.get('createEntity.sourceNoexist'));
    }

    if (resStandData && resStandData.Code === 500009) {
      message.error(intl.get('createEntity.fileNoExist'));
    }

    if (resStandData && resStandData.Code === 500010) {
      message.error(intl.get('createEntity.fileNotPre'));
    }

    if (resStandData && resStandData.Code === 500011) {
      message.error(intl.get('createEntity.someFileNotPre'));
    }
  };

  /**
   * @description 关闭外部导入弹窗
   */
  closeExportModal = () => {
    this.setState({
      exportModal: false,
      saveData: {
        data: undefined, // 数据
        type: 'entity' // 导入类型
      }
    });
  };

  /**
   * @description 设置本体弹窗
   */
  setEditEntityModal = editEntityModal => {
    this.setState({
      editEntityModal
    });
  };

  /**
   * @description 设置一键创建边弹窗
   */
  setEdgesModal = edgesModal => {
    this.setState({
      edgesModal
    });
  };

  render() {
    const { edgesModal, exportModal, saveData, editEntityModal } = this.state;
    const { centerSelect, nodes, edges, graphName } = this.props;
    const TYPE = window?.location?.pathname?.includes('knowledge') ? 'view' : analyUrl(window.location.search).type; // 进入图谱的类型
    return (
      <div className="new-create-entity-head">
        <div className="name">
          {isFlow() ? (
            <div className="flow-back"></div>
          ) : (
            <div className="back">
              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button
                  className="ant-btn-default back-button"
                  onClick={() => {
                    if (TYPE === 'view') {
                      this.props.quit();

                      return;
                    }

                    if (!this.props.isTouch) {
                      this.props.quit();

                      return;
                    }

                    this.props.setModalVisible(true);
                  }}
                >
                  <LeftOutlined />
                  <span>{intl.get('createEntity.back')}</span>
                </Button>
              </ConfigProvider>
            </div>
          )}

          <div className="entity-name" title={graphName}>
            {graphName}
          </div>

          {TYPE === 'view' ? null : (
            <div
              className="icon"
              onClick={() => {
                this.setEditEntityModal(true);
                this.props.setTouch(true);
              }}
            >
              <IconFont type="icon-edit" className="icon" />
            </div>
          )}
        </div>

        <div className="tool tool-center">
          {/* 创建实体类 */}
          <div
            className={TYPE === 'view' ? 'handle handle-view' : 'handle'}
            onClick={() => {
              if (TYPE === 'view') {
                return;
              }

              this.props.setTouch(true);

              // 如果输入栏有错误，则取消操作
              if (this.props.dataInfoRef) {
                if (this.props.dataInfoRef.state.checkData.isIncorrect) {
                  message.error([intl.get('createEntity.de')]);
                  this.props.dataInfoRef.setActiveKey(['1', '2']);

                  return;
                }

                if (this.props.dataInfoRef.formNameRef.current) {
                  this.props.dataInfoRef.formNameRef.current
                    .validateFields()
                    .then(() => {
                      this.props.selectCenterTool();
                      this.addNode();
                    })
                    .catch(() => {
                      message.error([intl.get('createEntity.de')]);
                      this.props.dataInfoRef.setActiveKey(['1', '2']);
                    });

                  return;
                }
              }

              this.props.selectCenterTool();
              this.addNode();
            }}
          >
            <div className="icon-box">
              <img src={dianIcon} alt="KWeaver" className="hanle-icon" />
            </div>
            <div className="word word-o">{intl.get('createEntity.createEntityC')}</div>
          </div>

          {/* 创建关系类 */}
          <div
            className={
              TYPE === 'view' ? 'handle handle-view' : centerSelect === 'edge' ? 'handle handle-selected' : 'handle'
            }
            onClick={() => {
              if (TYPE === 'view') {
                return;
              }

              // 如果输入栏有错误，则取消操作
              if (this.props.dataInfoRef) {
                if (this.props.dataInfoRef.state.checkData.isIncorrect) {
                  message.error([intl.get('createEntity.de')]);
                  this.props.dataInfoRef.setActiveKey(['1', '2']);

                  return;
                }

                if (this.props.dataInfoRef.formNameRef.current) {
                  this.props.dataInfoRef.formNameRef.current
                    .validateFields()
                    .then(() => {
                      this.props.selectCenterTool('edge');
                      this.props.setTouch(true);
                    })
                    .catch(() => {
                      message.error([intl.get('createEntity.de')]);
                      this.props.dataInfoRef.setActiveKey(['1', '2']);
                    });

                  return;
                }
              }

              this.props.selectCenterTool('edge');
              this.props.setTouch(true);
            }}
          >
            <div className="icon-box">
              <img src={edgeIcon} alt="KWeaver" className="hanle-icon" />
            </div>
            <div className="word word-t">{intl.get('createEntity.createR')}</div>
          </div>

          <div className="set"></div>

          {/* 一键导入 */}
          <div
            className={TYPE === 'view' ? 'handle handle-view' : 'handle'}
            onClick={() => {
              if (TYPE === 'view') {
                return;
              }

              this.props.setTouch(true);

              // 如果输入栏有错误，则取消操作
              if (this.props.dataInfoRef) {
                if (this.props.dataInfoRef.state.checkData.isIncorrect) {
                  message.error([intl.get('createEntity.de')]);
                  this.props.dataInfoRef.setActiveKey(['1', '2']);

                  return;
                }

                if (this.props.dataInfoRef.formNameRef.current) {
                  this.props.dataInfoRef.formNameRef.current
                    .validateFields()
                    .then(() => {
                      this.props.selectCenterTool();

                      this.setState({
                        exportModal: true
                      });
                    })
                    .catch(() => {
                      message.error([intl.get('createEntity.de')]);
                      this.props.dataInfoRef.setActiveKey(['1', '2']);
                    });

                  return;
                }
              }

              this.props.selectCenterTool();

              this.setState({
                exportModal: true
              });
            }}
          >
            <div className="icon-box">
              <img src={daoruIcon} alt="KWeaver" className="hanle-icon" />
            </div>
            <div className="word word-h">{intl.get('createEntity.clickI')}</div>
          </div>

          {/* 批量关系类 */}
          <div
            className={TYPE === 'view' ? 'handle handle-view' : 'handle'}
            onClick={() => {
              if (TYPE === 'view') {
                return;
              }

              this.props.setTouch(true);

              // 如果点边名称有错误，则取消操作
              if (this.props.checkSaveData('edge')) {
                return;
              }

              // 如果输入栏有错误，则取消操作
              if (this.props.dataInfoRef) {
                if (this.props.dataInfoRef.state.checkData.isIncorrect) {
                  message.error([intl.get('createEntity.de')]);
                  this.props.dataInfoRef.setActiveKey(['1', '2']);

                  return;
                }

                if (this.props.dataInfoRef.formNameRef.current) {
                  this.props.dataInfoRef.formNameRef.current
                    .validateFields()
                    .then(() => {
                      this.setEdgesModal(true);

                      this.props.selectCenterTool();
                    })
                    .catch(() => {
                      message.error([intl.get('createEntity.de')]);
                      this.props.dataInfoRef.setActiveKey(['1', '2']);
                    });

                  return;
                }
              }

              this.setEdgesModal(true);

              this.props.selectCenterTool();
            }}
          >
            <div className="icon-box">
              <img src={guanxileiIcon} alt="KWeaver" className="hanle-icon" />
            </div>
            <div className="word word-f">{intl.get('createEntity.bulikR')}</div>
          </div>
        </div>

        <div className="tool tool-right">
          {/* 操作帮助 */}
          {/* <div
            className="handle"
            onClick={() => {
              message.info([intl.get('createEntity.comSoon')]);
            }}
          >
            <div className="icon-box">
              <img src={helpIcon} alt="KWeaver" className="hanle-icon" />
            </div>
            <div className="word word-k">{intl.get('createEntity.help')}</div>
          </div> */}

          {/* <div className="set"></div> */}

          {/* 切换视图 */}
          {/* <div
            className="handle"
            onClick={() => {
              message.info([intl.get('createEntity.comSon')]);
            }}
          >
            <div className="icon-box">
              <img src={changeIcon} alt="KWeaver" className="hanle-icon" />
            </div>
            <div className="word word-k">{intl.get('createEntity.changeI')}</div>
          </div> */}

          {/* <div className="set"></div> */}

          {/* 汇总信息 */}
          <div
            className="handle"
            onClick={() => {
              this.props.setTouch(true);

              if (this.props.selectedElement && this.props.selectedElement.model) {
                this.props.selectRightTool('gatherList', true);

                return;
              }

              // 如果输入栏有错误，则取消操作
              if (this.props.dataInfoRef) {
                if (this.props.dataInfoRef.state.checkData.isIncorrect) {
                  message.error([intl.get('createEntity.de')]);
                  this.props.dataInfoRef.setActiveKey(['1', '2']);

                  return;
                }

                if (this.props.dataInfoRef.formNameRef.current) {
                  this.props.dataInfoRef.formNameRef.current
                    .validateFields()
                    .then(() => {
                      this.props.selectRightTool('gatherList');
                    })
                    .catch(() => {
                      message.error([intl.get('createEntity.de')]);
                      this.props.dataInfoRef.setActiveKey(['1', '2']);
                    });

                  return;
                }
              }

              this.props.selectRightTool('gatherList');
            }}
          >
            <div className="icon-box">
              <IconFont type="icon-huizongxinxi" className="hanle-icon" />
            </div>
            <div className="word word-o">{intl.get('createEntity.summary')}</div>
          </div>

          <div className="set"></div>

          {/* 任务列表 */}
          <div
            className="handle"
            onClick={() => {
              this.props.setTouch(true);

              // 如果输入栏有错误，则取消操作
              if (this.props.dataInfoRef) {
                if (this.props.dataInfoRef.state.checkData.isIncorrect) {
                  message.error([intl.get('createEntity.de')]);
                  this.props.dataInfoRef.setActiveKey(['1', '2']);

                  return;
                }

                if (this.props.dataInfoRef.formNameRef.current) {
                  this.props.dataInfoRef.formNameRef.current
                    .validateFields()
                    .then(() => {
                      this.props.selectRightTool('taskList');
                    })
                    .catch(() => {
                      message.error([intl.get('createEntity.de')]);
                      this.props.dataInfoRef.setActiveKey(['1', '2']);
                    });

                  return;
                }
              }

              this.props.selectRightTool('taskList');
            }}
          >
            <div className="icon-box">
              <IconFont type="icon-renwuliebiao" className="hanle-icon" />
            </div>
            <div className="word word-t">{intl.get('createEntity.taskList')}</div>
          </div>
        </div>

        {/* 编辑本体弹层 */}
        <Modal
          className="set-entity-244-edit"
          title={this.props.ontology_id ? intl.get('createEntity.editE') : intl.get('createEntity.createEntity')}
          width={640}
          destroyOnClose={true}
          maskClosable={false}
          // visible={editEntityModal}
          visible={false}
          footer={null}
          closable={false}
        >
          <EditEntityModal
            setEditEntityModal={this.setEditEntityModal}
            setOntologyId={this.props.setOntologyId}
            ontology_name={this.props.ontology_name}
            setName={this.props.setName}
            ontology_des={this.props.ontology_des}
            setDes={this.props.setDes}
            ontology_id={this.props.ontology_id}
            nodes={nodes}
            edges={edges}
            freeGraphRef={this.props.freeGraphRef}
            graphId={this.props.graphId}
            ontoData={this.props.ontoData}
            prev={this.props.prev}
            setQuitVisible={this.props.setQuitVisible}
            setTouch={this.props.setTouch}
            setOntoData={this.props.setOntoData}
            onEditEntityModalRef={this.props.onEditEntityModalRef}
          />
        </Modal>

        {/* 关系类管理弹层 */}
        <Modal
          className="edge-modal-qzdj-true"
          title={
            <div className="modalTitle" style={{ display: 'flex' }}>
              <span className="title">{intl.get('createEntity.bulikR')}</span>
              <span className="tip">
                <ExclamationCircleFilled className="tipIcon" />
                {intl.get('createEntity.tip')}
              </span>
            </div>
          }
          width={1000}
          visible={edgesModal}
          footer={null}
          destroyOnClose={true}
          maskClosable={false}
          onCancel={() => {
            this.setEdgesModal(false);
          }}
        >
          <EdgesModal
            nodes={nodes}
            edges={edges}
            setEdgesModal={this.setEdgesModal}
            freeGraphRef={this.props.freeGraphRef}
            setTouch={this.props.setTouch}
          />
        </Modal>

        {/* 一键导入弹层 */}
        <Modal
          className="add-modal-create-entity-model"
          width={1000}
          maskClosable={false}
          destroyOnClose={true}
          visible={exportModal}
          footer={[
            <ConfigProvider key="entityInfoMadalControl" autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default add-modal-cancel" key="cancel" onClick={this.closeExportModal}>
                {[intl.get('createEntity.cancel')]}
              </Button>
              {/* 预测本体弹框确定 */}
              <Button type="primary" className="add-modal-save" key="ok" onClick={this.onSave}>
                {[intl.get('createEntity.ok')]}
              </Button>
            </ConfigProvider>
          ]}
          onCancel={this.closeExportModal}
        >
          <ExportModal
            saveData={saveData}
            setSaveData={this.setSaveData}
            setTouch={this.props.setTouch}
            graphId={this.props.graphId}
          />
        </Modal>
      </div>
    );
  }
}

NewCreateEntityHead.defaultProps = {
  onNewCreateEntityHeadRef: () => {},
  onEditEntityModalRef: () => {},
  freeGraphRef: '',
  setTouch: () => {},
  selectCenterTool: () => {},
  checkSaveData: () => {},
  selectRightTool: () => {}
};

export default withRouter(NewCreateEntityHead);
