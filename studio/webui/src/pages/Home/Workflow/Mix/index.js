/**
 * 融合
 */
import React, { Component, createRef } from 'react';
import intl from 'react-intl-universal';
import { Button, Modal, ConfigProvider, Radio } from 'antd';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

import serviceWorkflow from '@/services/workflow';
import servicesCreateEntity from '@/services/createEntity';
import TimedTask from '@/components/timedTask';
import { updateUrl, getParam } from '@/utils/handleFunction';

import SetAttr from './SetAttr';
import NodeInfo from './NodeInfo';
import { isDocument, initConfig, updateConfig } from './assistFunction';

import full from '@/assets/images/quanliang.svg';
import increment from '@/assets/images/zengliang.svg';
import './style.less';

class Mix extends Component {
  isPassStep4 = createRef(false);

  state = {
    /**
     * TODO 融合开关, [183804]UI上删除融合按钮, 默认选择融合, 关闭融合会对领域智商计算产生影响
     */
    check: true,

    modalVisible: false, // 执行任务成功弹窗
    entity: [], // 点类信息
    showIndex: -1, // 当前展开的点类
    isError: false, // 配置是否有错误
    errMsg: '', // 错误信息
    errIndex: -1, // 错误配置索引
    saveLoading: false, // 接口loading状态
    taskModalType: 'select', // 执行任务弹窗内容
    updateType: 'increment', // 更新方式
    isImmediately: false, // mq数据源立即执行任务
    timedTaskVisible: false // 定时任务弹窗
  };

  runSignal = false;

  componentDidUpdate(preProps) {
    this.graphMix(preProps);
  }

  /**
   * 融合
   */
  graphMix = async preProps => {
    const { current, infoExtrData, conflation, dataSourceData } = this.props;

    if (current === 3) this.isPassStep4.current = true; // 经过第四步才会重新更新点类信息
    if (preProps.current !== current && current === 5 && this.isPassStep4.current) {
      try {
        const id = parseInt(getParam('id'));
        const mes = await serviceWorkflow.graphGet(id);
        const ontologyId = mes.res.graph_otl[0].id;
        const res = await servicesCreateEntity.getEntityInfo(decodeURI(ontologyId));
        const { entity } = res.res.df[0]; // 第三步的点信息
        const extr = [...infoExtrData]; // 第四步的点信息
        const isDocModel = isDocument(entity, extr); // 判断是否包含文档知识模型
        if (conflation.length === 0) {
          // 初次进入, 直接取第三步的点
          const newEntity = initConfig(entity, isDocModel);
          this.setState({ entity: newEntity, showIndex: 0 });
        } else {
          // 已经配置了属性, 需要和第三步的点比较, 是否有更新
          const newEntity = updateConfig(conflation, entity, isDocModel);
          const { status } = conflation[0];

          this.setState({
            check: status,
            entity: newEntity,
            showIndex: 0,
            isError: false,
            errIndex: -1,
            errMsg: ''
          });
        }
      } catch (error) {
        //
      }
    }

    if (preProps.dataSourceData !== dataSourceData) {
      this.setState({ isImmediately: dataSourceData[0]?.data_source === 'rabbitmq' });
    }
  };

  /**
   * 生成保存的数据让父组件调用
   */
  getFlowData = () => {
    const data = this.generateData();
    return data;
  };

  /**
   * 上一步
   */
  onPrev = () => {
    this.isPassStep4.current = false;
    this.saveState();
    this.props.prev();
  };

  /**
   * 点击执行任务
   */
  onImplementClick = async () => {
    const { isError, saveLoading, isImmediately } = this.state;
    if (isError || saveLoading) return;

    const data = this.generateData();
    const params = { graph_step: 'graph_KMerge', graph_process: data };
    this.setSaveLoading(true);
    const res = (await serviceWorkflow.graphEdit(this.props.graphId, params)) || {};

    if (isImmediately) return this.setState({ updateType: 'full' }, this.updateTask);
    res.res && this.setState({ modalVisible: true });
    this.setSaveLoading(false);
    this.props.next(res);
  };

  /**
   * 执行任务
   */
  updateTask = async () => {
    if (this.runSignal) return;
    this.runSignal = true;
    const { updateType, saveLoading } = this.state;
    const data = { tasktype: updateType };
    const taskRes = await serviceWorkflow.taskPerform(this.props.graphId, data);
    saveLoading && this.setState({ saveLoading: false });

    if (taskRes?.res) {
      this.setState({ taskModalType: 'save', modalVisible: true });
      updateUrl('/home/graph-list');
    }

    if (taskRes?.Code) this.props.next(taskRes);

    setTimeout(() => {
      this.runSignal = false;
    }, 100);
  };

  /**
   * 点击执行任务的请求状态
   * @param {boolean} bool
   */
  setSaveLoading = bool => {
    this.setState({ saveLoading: bool });
  };

  /**
   * 保存state到父组件
   */
  saveState = () => {
    const data = this.generateData();
    this.props.setConflation(data);
  };

  /**
   * 展开的点的索引
   * @param {number} index
   */
  setShowIndex = index => this.setState({ showIndex: index });

  /**
   * 更新点类信息
   * @param {array} properties
   */
  setEntity = entity => this.setState({ entity });

  /**
   * @description 设置是否错误
   * @param {Boolean} boolean
   */
  setIsError = boolean => this.setState({ isError: boolean });

  /**
   * 设置错误信息
   * @param {string} errMsg
   */
  setErrMsg = errMsg => this.setState({ errMsg });

  /**
   * 设置错误索引
   * @param {number} index
   */
  setErrIndex = index => this.setState({ errIndex: index });

  /**
   * 生成后端接口需要的数据
   */
  generateData = () => {
    const data = this.state.check
      ? this.state.entity.map(item => {
          return { name: item.name, properties: item.properties };
        })
      : [];

    return [{ status: this.state.check, entity_classes: data }];
  };

  /**
   * 点击返回知识网络列表
   */
  returnGraph = () => {
    const knw_id =
      window.sessionStorage.getItem('selectedKnowledgeId') &&
      parseInt(window.sessionStorage.getItem('selectedKnowledgeId'));
    this.props.history.push(`/knowledge/network?id=${knw_id}`);
  };

  /**
   * 跳转到任务管理界面
   */
  goToTask = () => {
    const knw_id =
      window.sessionStorage.getItem('selectedKnowledgeId') &&
      parseInt(window.sessionStorage.getItem('selectedKnowledgeId'));
    this.props.history.push(`/knowledge/network?id=${knw_id}&cid=${this.props.graphId}&tab=3`);
  };

  render() {
    const { graphId } = this.props;
    const {
      entity,
      showIndex,
      isError,
      errMsg,
      errIndex,
      modalVisible,
      saveLoading,
      taskModalType,
      updateType,
      isImmediately,
      timedTaskVisible
    } = this.state;

    return (
      <div className="mix">
        <div className="content">
          <div className="info">
            <div className="node-info">
              <NodeInfo
                entity={entity}
                showIndex={showIndex}
                isError={isError}
                setShowIndex={this.setShowIndex}
                setIsError={this.setIsError}
                setErrMsg={this.setErrMsg}
                setErrIndex={this.setErrIndex}
              />
            </div>
            <div className="attr-set">
              <SetAttr
                entity={entity}
                showIndex={showIndex}
                errIndex={errIndex}
                errMsg={errMsg}
                isError={isError}
                setEntity={this.setEntity}
                setIsError={this.setIsError}
                setErrMsg={this.setErrMsg}
                setErrIndex={this.setErrIndex}
              />
            </div>
          </div>
        </div>

        <div className={`mix-loading ${saveLoading && 'isLoading'}`}>
          <LoadingOutlined className="icon" />
        </div>

        <div className="work-flow-footer">
          <Button className="ant-btn-default btn" onClick={this.onPrev}>
            {intl.get('workflow.previous')}
          </Button>

          {/* rabbitmq无定时任务 */}
          {!isImmediately && (
            <Button className="ant-btn-default btn" onClick={() => this.setState({ timedTaskVisible: true })}>
              {intl.get('workflow.conflation.timedrun')}
            </Button>
          )}

          <Button type="primary" className="btn" onClick={this.onImplementClick}>
            {intl.get('workflow.conflation.RunNow')}
          </Button>
        </div>

        <Modal
          className={`mix-modal ${taskModalType}`}
          title={taskModalType === 'select' ? intl.get('task.mt') : null}
          width={480}
          footer={null}
          maskClosable={false}
          closable={taskModalType === 'select'}
          keyboard={false}
          visible={modalVisible}
          destroyOnClose={true}
          onCancel={() => {
            if (taskModalType === 'select') return this.setState({ modalVisible: false });
          }}
        >
          {taskModalType === 'select' ? (
            <div className="mix-select-content">
              <div className="select-box">
                <div className="box">
                  <div
                    className={updateType === 'increment' ? 'update-type update-type-seleted' : 'update-type'}
                    onClick={() => {
                      this.setState({ updateType: 'increment' });
                    }}
                  >
                    <div className="radio-select">
                      <Radio checked={updateType === 'increment'}></Radio>
                    </div>
                    <div>
                      <img src={increment} className="image" alt="increment" />
                    </div>
                    <div className="word">
                      <div className="title">{intl.get('task.iu')}</div>
                      <div className="des">{intl.get('task.am')}</div>
                    </div>
                  </div>

                  <div
                    className={updateType === 'full' ? 'update-type update-type-seleted' : 'update-type'}
                    onClick={() => {
                      this.setState({ updateType: 'full' });
                    }}
                  >
                    <div className="radio-select">
                      <Radio checked={updateType === 'full'}></Radio>
                    </div>
                    <div>
                      <img src={full} className="image" alt="full" />
                    </div>
                    <div className="word">
                      <div className="title">{intl.get('task.fu')}</div>
                      <div className="des">{intl.get('task.fm')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bottom">
                <ConfigProvider autoInsertSpaceInButton={false}>
                  <Button
                    className="ant-btn-default cancel"
                    onClick={() => {
                      this.setState({ modalVisible: false });
                    }}
                  >
                    {intl.get('createEntity.cancel')}
                  </Button>

                  <Button type="primary" className="save" onClick={this.updateTask}>
                    {intl.get('createEntity.ok')}
                  </Button>
                </ConfigProvider>
              </div>
            </div>
          ) : (
            <div className="mix-modal-content">
              <div className="title-box">
                <CheckCircleFilled className="check-icon" />
                <p className="title">{intl.get('workflow.conflation.teskSuccess')}</p>
              </div>

              <p className="warming">{intl.get('workflow.conflation.successInfo')}</p>

              <div className="footer">
                <Button className="ant-btn-default btn" onClick={this.goToTask}>
                  {intl.get('workflow.conflation.viewTask')}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <TimedTask
          graphId={graphId}
          visible={timedTaskVisible}
          onCancel={() => {
            this.setState({ timedTaskVisible: false });
          }}
          onOk={() => {
            this.onImplementClick();

            this.setState({
              timedTaskVisible: false,
              taskModalType: 'save',
              modalVisible: true
            });
          }}
        />
      </div>
    );
  }
}

export default Mix;
