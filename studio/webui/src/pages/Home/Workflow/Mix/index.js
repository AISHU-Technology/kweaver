/* eslint-disable */
/**
 * 融合
 */

import React, { Component, createRef } from 'react';
import intl from 'react-intl-universal';
import { Switch, Button, Modal, ConfigProvider, Radio } from 'antd';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

import serviceWorkflow from '@/services/workflow';
import TimedTask from '@/components/timedTask';
import AddMember from '@/components/AddMember';

import SetAttr from './SetAttr';
import NodeInfo from './NodeInfo';
import { isDocment, initConfig, updateConfig } from './assisFunction';

import emptyImg from '@/assets/images/empty.svg';
import full from '@/assets/images/quanliang.svg';
import increment from '@/assets/images/zengliang.svg';
import './style.less';

class Mix extends Component {
  isPassStep4 = createRef(false);

  state = {
    check: true, // 融合开关
    modalVisible: false, // 执行任务成功弹窗
    entity: [], // 点类信息
    showIndex: -1, // 当前展开的点类
    isError: false, // 配置是否有错误
    errMsg: '', // 错误信息
    errIndex: -1, // 错误配置索引
    saveLoading: false, // 接口loading状态
    isAddMember: false, // 邀请成员界面是否可见
    taskModalType: 'select', // 执行任务弹窗内容
    updateType: 'increment', // 更新方式
    isImmediately: false, // mq数据源立即执行任务
    timedTaskVisible: false // 定时任务弹窗
  };

  runSingal = false;

  componentDidUpdate(preProps) {
    const { current, ontoData, infoExtrData, conflation, dataSourceData } = this.props;

    if (current === 3) this.isPassStep4.current = true; // 经过第四步才会重新更新点类信息
    if (preProps.current !== current && current === 5 && this.isPassStep4.current) {
      const { entity } = ontoData[0]; // 第三步的点信息
      const extr = [...infoExtrData]; // 第四步的点信息
      const isDocModel = isDocment(entity, extr); // 判断是否包含文档知识模型

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
    }

    if (preProps.dataSourceData !== dataSourceData) {
      this.setState({ isImmediately: dataSourceData[0]?.data_source === 'rabbitmq' });
    }
  }

  // 生成保存的数据让父组件调用
  getFlowData = () => {
    const data = this.generateData();
    return data;
  };

  /**
   * @description 上一步
   */
  mixPrev = () => {
    this.isPassStep4.current = false;
    this.saveState();
    this.props.prev();
  };

  /**
   * @description 点击执行任务
   */
  onImplementClick = async () => {
    if (this.state.isError || this.state.saveLoading) return;

    const data = this.generateData();
    const params = { graph_step: 'graph_KMerge', graph_process: data };

    // 保存数据
    this.setSaveLoading(true);
    const res = await serviceWorkflow.graphEdit(this.props.graphId, params);

    await this.props.getAuthLevel(this.props.graphId);
    if (this.state.isImmediately) return this.setState({ updateType: 'full' }, this.updateTask);
    if (res && res.res) this.setState({ modalVisible: true });

    this.setSaveLoading(false);
    this.props.next(res || {});
  };

  /**
   * @description 执行任务
   */
  updateTask = async () => {
    if (this.runSingal) return;
    this.runSingal = true;
    const { updateType, saveLoading } = this.state;
    let data = { tasktype: updateType };

    // 执行
    const taskRes = await serviceWorkflow.performTask(this.props.graphId, data);
    saveLoading && this.setState({ saveLoading: false });

    if (taskRes && taskRes.res) {
      window.history.pushState({}, null, window.origin + '/home/graph-list');
      this.setState({ taskModalType: 'save', modalVisible: true });
    }

    if (taskRes && taskRes.Code) this.props.next(taskRes);

    setTimeout(() => {
      this.runSingal = false;
    }, 100);
  };

  /**
   * @description 点击执行任务的请求状态
   * @param {boolean} bool
   */
  setSaveLoading = bool => {
    this.setState({ saveLoading: bool });
  };

  /**
   * @description 保存state到父组件
   */
  saveState = () => {
    const data = this.generateData();
    this.props.setConflation(data);
  };

  /**
   * @description 是否融合开关
   * @param {boolean} value
   */
  onChange = value => {
    let index = this.state.showIndex === -1 ? 0 : this.state.showIndex;
    this.setState({ check: value, showIndex: index });
  };

  /**
   * @description 展开的点的索引
   * @param {Number} index
   */
  setShowIndex = index => this.setState({ showIndex: index });

  /**
   * @description 更新点类信息
   * @param {Array} properties
   */
  setEntity = entity => this.setState({ entity });

  /**
   * @description 设置是否错误
   * @param {Boolean} boolean
   */
  setIsError = boolean => this.setState({ isError: boolean });

  /**
   * @description 设置错误信息
   * @param {String} errMsg
   */
  setErrMsg = errMsg => this.setState({ errMsg });

  /**
   * @description 设置错误索引
   * @param {Number} index
   */
  setErrIndex = index => this.setState({ errIndex: index });

  /**
   * @description 设置邀请成员界面是否可见
   * @param {Boolean} bool
   */
  setIsAddMember = bool => this.setState({ isAddMember: bool });

  /**
   * @description 生成后端接口需要的数据
   */
  generateData = () => {
    let data = this.state.check
      ? this.state.entity.map(item => {
          return { name: item.name, properties: item.properties };
        })
      : [];

    return [{ status: this.state.check, entity_classes: data }];
  };

  /**
   * @description 点击邀请成员
   */
  onInviteClick = () => {
    this.setIsAddMember(true);
  };

  /**
   * @description 点击返回知识网络列表
   */
  returnGraph = () => {
    const knw_id =
      window.sessionStorage.getItem('selectedKnowledgeId') &&
      parseInt(window.sessionStorage.getItem('selectedKnowledgeId'));
    this.props.history.push(`/knowledge/network?id=${knw_id}`);
  };

  /**
   * @description 跳转到任务管理界面
   */
  goToTask = () => {
    const knw_id =
      window.sessionStorage.getItem('selectedKnowledgeId') &&
      parseInt(window.sessionStorage.getItem('selectedKnowledgeId'));
    this.props.history.push(`/knowledge/network?id=${knw_id}&tabsKey=${this.props.graphId}`);
  };

  render() {
    const { authLevel, graphName, graphId, getAuthLevel } = this.props;
    const {
      check,
      entity,
      showIndex,
      isError,
      errMsg,
      errIndex,
      modalVisible,
      saveLoading,
      taskModalType,
      updateType,
      isAddMember,
      isImmediately,
      timedTaskVisible
    } = this.state;

    return (
      <div className="mix">
        <div className="head">
          <span className="word">{intl.get('workflow.conflation.isMix')}</span>
          <Switch checked={this.state.check} onChange={this.onChange} />
        </div>

        <div className="content">
          <div className={check ? 'hidden' : 'none'}>
            <img className="none-img" src={emptyImg} alt="nodata" />
            <p className="none-info-sub-title">{intl.get('workflow.conflation.pleaseOpen')}</p>
          </div>
          <div className={check ? 'info' : 'hidden'}>
            <div className="node-info">
              <NodeInfo
                entity={entity}
                showIndex={showIndex}
                setShowIndex={this.setShowIndex}
                setIsError={this.setIsError}
                isError={isError}
                setErrMsg={this.setErrMsg}
                setErrIndex={this.setErrIndex}
              />
            </div>
            <div className="attr-set">
              <SetAttr
                entity={entity}
                showIndex={showIndex}
                setEntity={this.setEntity}
                isError={isError}
                setIsError={this.setIsError}
                errMsg={errMsg}
                setErrMsg={this.setErrMsg}
                setErrIndex={this.setErrIndex}
                errIndex={errIndex}
              />
            </div>
          </div>
        </div>

        <div className={`mix-loading ${saveLoading && 'isLoading'}`}>
          <LoadingOutlined className="icon" />
        </div>

        <div className="work-flow-footer">
          <Button className="ant-btn-default btn" onClick={this.mixPrev}>
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
          width={isAddMember ? 800 : 480}
          footer={null}
          maskClosable={false}
          closable={isAddMember || taskModalType === 'select'}
          keyboard={false}
          visible={modalVisible}
          destroyOnClose={true}
          onCancel={() => {
            if (taskModalType === 'select') return this.setState({ modalVisible: false });
            if (isAddMember) this.setIsAddMember(false);
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
                      <img src={increment} className="image"></img>
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
                      <img src={full} className="image"></img>
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
                    {[intl.get('createEntity.cancel')]}
                  </Button>

                  <Button type="primary" className="save" onClick={this.updateTask}>
                    {[intl.get('createEntity.ok')]}
                  </Button>
                </ConfigProvider>
              </div>
            </div>
          ) : isAddMember ? (
            <AddMember
              graphId={parseInt(graphId)}
              graphName={graphName}
              authLevel={authLevel}
              setVisible={this.setIsAddMember}
              effect={() => getAuthLevel(graphId)}
            />
          ) : (
            <div className="mix-modal-content">
              <div className="title-box">
                <CheckCircleFilled className="check-icon" />
                <p className="title">{intl.get('workflow.conflation.teskSuccess')}</p>
              </div>

              <p className="warming">{intl.get('workflow.conflation.successInfo')}</p>

              <div className="footer">
                <Button type="primary" className="btn" style={{ marginBottom: 16 }} onClick={this.onInviteClick}>
                  {intl.get('workflow.conflation.addMember')}
                </Button>
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
