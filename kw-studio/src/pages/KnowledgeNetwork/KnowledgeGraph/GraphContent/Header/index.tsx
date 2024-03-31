import React, { useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Menu, message, Tooltip, Dropdown, Divider, Modal, Radio, Popover, Button } from 'antd';
import { QuestionCircleOutlined, EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import { GRAPH_STATUS, PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import HELPER from '@/utils/helper';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import RunNowTask from './RunNowTask/RunNowTask';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import TimedTask from '@/components/timedTask';

import ModalDelete from './ModalDelete';

import './style.less';
import servicesPermission from '@/services/rbacPermission';
import _ from 'lodash';
import serviceGraphDetail from '@/services/graphDetail';
import UniversalModal from '@/components/UniversalModal';
import serviceTaskManagement from '@/services/taskManagement';
import ModalBranchTask from '@/components/ModalBranchTask';
import { sessionStore } from '@/utils/handleFunction';

const ERROR_OBJECT = {
  500001: { intlText: 'graphList.abnormalErr', _alt: '服务异常' },
  500030: { intlText: 'graphList.errByAllRun', _alt: '状态全部是运行' },
  500031: { intlText: 'graphList.errByPartRun', _alt: '部分运行（运行+正常）' },
  500032: { intlText: 'graphList.abnormalErr', _alt: '全部异常(运行+权限)' },
  500033: { intlText: 'graphList.errByPartAuth', _alt: '部分无权限（权限+正常）' },
  500034: { intlText: 'graphList.errByAllAuth', _alt: '全部无权限' },
  500035: { intlText: 'graphList.errByPartAbnormal', _alt: '部分异常' },
  500036: { intlText: 'graphList.runErr', _alt: '单一运行' },
  500037: { intlText: 'graphList.authErr', _alt: '单一无权限' },
  500057: { intlText: 'graphList.noNetworkIdErr', _alt: '单一无权限，知识网络ID不存在' },
  500058: { intlText: 'graphList.networkIdErr', _alt: '单一无权限，知识网络ID与图谱ID不符合' }
};

const { NORMAL, WAITING, RUNNING, FAIL, CONFIGURATION, STOP } = GRAPH_STATUS;
const LABEL = {
  [NORMAL]: intl.get('graphDetail.normal'),
  [WAITING]: intl.get('graphDetail.waiting'),
  [RUNNING]: intl.get('graphDetail.running'),
  [FAIL]: intl.get('graphDetail.failed'),
  [CONFIGURATION]: intl.get('graphDetail.config'),
  [STOP]: intl.get('graphDetail.config')
};
const KEY_VALUE_COLOR = {
  [NORMAL]: {
    label: LABEL[NORMAL],
    color: 'var(--kw-success-color)',
    background: 'rgba(var(--kw-success-color-rgb), 0.06)'
  },
  [WAITING]: { label: LABEL[WAITING], color: 'var(--kw-text-color-secondary)', background: 'rgba(0,0,0, 0.06)' },
  [RUNNING]: {
    label: LABEL[RUNNING],
    color: 'var(--kw-warning-color)',
    background: 'rgba(var(--kw-warning-color-rgb), 0.06)'
  },
  [FAIL]: { label: LABEL[FAIL], color: 'var(--kw-error-color)', background: 'rgba(var(--kw-error-color-rgb), 0.06)' },
  [CONFIGURATION]: {
    label: LABEL[CONFIGURATION],
    color: 'var(--kw-primary-color)',
    background: 'rgba(var(--kw-primary-color-rgb), 0.06)'
  },
  [STOP]: {
    label: LABEL[STOP],
    color: 'var(--kw-primary-color)',
    background: 'rgba(var(--kw-primary-color-rgb), 0.06)'
  }
};
type StatusType = typeof KEY_VALUE_COLOR;

interface HeaderInterface {
  ad_graphStatus: StatusType | undefined;
  isFetching: boolean;
  graphBasicData: {
    graphdb_type: string;
    name: string;
    status: string;
    task_status: string;
    export: boolean;
    step_num: number;
    id: number;
    update_time: string;
    property_id: number;
    otl: any;
    __codes?: string[];
    error_result: any;
  };
  selectedKnowledge: { id: number };
  onRefresh: () => void;
  openAuthPage: () => void;
  onSelectedGraph: (graph: string) => void;
  onRefreshLeftSpace: () => void;
  onUpdateGraphStatus: (status: any) => void;
  collapsed: boolean;
  setCollapsed: any;
  openErrorModal: any;
  graphId: number;
}

const Header = (props: HeaderInterface) => {
  const history = useHistory();
  const { ad_graphStatus = 'NORMAL', graphId } = props;
  const { onUpdateGraphStatus, graphBasicData, selectedKnowledge, collapsed, setCollapsed, openErrorModal } = props;
  const { onRefresh, openAuthPage, onSelectedGraph, onRefreshLeftSpace } = props;
  const [taskTimedId, setTaskTimedId] = useState<number | null>(null); // 定时任务图谱 id
  const [isVisibleModalDelete, setIsVisibleModalDelete] = useState(false); // 删除弹窗 visible
  const [runNowModal, setRunNowModal] = useState({
    visible: false
  });
  const [runGroupModalVisible, setRunGroupModalVisible] = useState(false);
  const [latestTask, setLatestTask] = useState<any>({});
  const isVisibleTask = taskTimedId === 0 ? true : !!taskTimedId;

  useEffect(() => {
    getGraphTaskList();
    const timerId = setInterval(() => {
      getGraphTaskList();
    }, 30 * 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  const getGraphTaskList = async () => {
    const getData = {
      page: 1,
      size: 1,
      status: 'all',
      order: 'desc',
      graph_name: '',
      task_type: 'all',
      trigger_type: 'all',
      rule: 'start_time'
    };
    const response = await serviceTaskManagement.taskGet(graphId, getData);
    const { ErrorCode, Description } = response || {};
    if (response?.res) {
      onUpdateGraphStatus(response.res?.graph_status);
      setLatestTask(response?.res.df[0] ?? {});
      return response?.res;
    }
    ErrorCode && message.error(Description);
  };

  // 编辑图谱
  const editGraph = async () => {
    const { status, id } = graphBasicData;
    const graphStatus = ad_graphStatus || status; // 未刷新任务列表状态和图详情状态不一致

    if (graphStatus === GRAPH_STATUS.RUNNING) return message.warning(intl.get('graphList.needRun'));
    if (graphStatus === GRAPH_STATUS.WAITING) return message.warning(intl.get('graphList.needWait'));
    try {
      if (graphStatus === GRAPH_STATUS.CONFIGURATION) {
        const url = `/knowledge/workflow/edit?id=${id}&knId=${selectedKnowledge?.id}&status=${GRAPH_STATUS.CONFIGURATION}`;
        history.push(url, {
          current: 0
        });
      } else {
        const url = `/knowledge/workflow/edit?id=${id}&knId=${selectedKnowledge?.id}&status=${GRAPH_STATUS.NORMAL}`;
        history.push(url, {
          current: 0
        });
      }
    } catch (error) {}
  };

  // 打开关闭定时任务弹窗
  const onOpenModalTask = () => setTaskTimedId(graphBasicData?.id);
  const onCloseModalTask = () => setTaskTimedId(null);

  // 导出图谱
  const onExportGraph = () => {
    const kgConfigId = Number(graphBasicData?.id);
    const postData = { id: kgConfigId };
    const fileName = graphBasicData?.name || intl.get('exploreGraph.graph');
    serverKnowledgeNetwork.graphOutput(postData, fileName);
  };

  // 打开关闭删除弹窗
  const onOpenModalDelete = () => setIsVisibleModalDelete(true);
  const onCloseModalDelete = () => setIsVisibleModalDelete(false);
  const deleteGraph = async () => {
    try {
      const data = { graphids: [Number(graphBasicData.id)], knw_id: selectedKnowledge.id };
      const result = await serviceTaskManagement.graphDelByIds(data);
      if (result?.ErrorCode) {
        const error = ERROR_OBJECT[result.ErrorCode as keyof typeof ERROR_OBJECT];
        message.error(error ? intl.get(error.intlText) : result.Description);
        onCloseModalDelete();
        return;
      }
      message.success(intl.get('task.deleteSucc'));
      onRefreshLeftSpace();
      onSelectedGraph('');
      onCloseModalDelete();
    } catch (error) {}
  };

  const debugGraph = async () => {
    const { id, name } = graphBasicData;
    try {
      await serviceGraphDetail.graphGetInfoOnto({ graph_id: id });
    } catch (err) {
      const { type, response } = err as any;
      if (type === 'message') message.error(response?.Description || '');
      return;
    }
    history.push(
      `/knowledge/explore?knId=${selectedKnowledge.id}&opType=add&graphId=${id}&graphConfId=${id}&kg_name=${name}`
    );
  };

  const jumpTaskRecord = () => {
    const { id, name } = graphBasicData;
    history.push(`/knowledge/graph-task-record?knId=${selectedKnowledge.id}&graphId=${id}&graphName=${name}`);
  };

  /** 查看图谱 */
  const viewGraph = () => {
    const { id, status } = graphBasicData;
    const url = `/knowledge/workflow/edit?id=${id}&knId=${selectedKnowledge?.id}`;
    history.push(url, {
      mode: 'view',
      // current: status === 'edit' ? 2 : 3
      current: 0
    });
  };

  const runNow = () => {
    openRunNowModal();
  };

  const openRunNowModal = () => {
    setRunNowModal(prevState => ({
      ...prevState,
      visible: true
    }));
  };

  const closeRunNowModal = () => {
    setRunNowModal(prevState => ({
      ...prevState,
      visible: false
    }));
  };

  const viewFailTaskDetails = () => {
    openErrorModal?.(graphBasicData.error_result);
  };

  const isRunning = useMemo(() => {
    const { status } = graphBasicData;
    const graphStatus = ad_graphStatus || status;
    return graphStatus === RUNNING || graphStatus === WAITING;
  }, [ad_graphStatus, graphBasicData]);

  // 操作下拉框选项
  const menu = (
    <Menu className="operator-menu">
      <ContainerIsVisible
        key="2"
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_EDIT,
          userType: PERMISSION_KEYS.KG_EDIT,
          userTypeDepend: graphBasicData?.__codes
        })}
      >
        {graphBasicData.status === GRAPH_STATUS.NORMAL && graphBasicData?.export && (
          <Menu.Item disabled={isRunning} key="export" style={{ height: 40 }} onClick={onExportGraph}>
            {intl.get('knowledge.export')}
          </Menu.Item>
        )}
      </ContainerIsVisible>
      {/* <Menu.Item key="save" style={{ height: 40 }} onClick={() => {}}>*/}
      {/*  {intl.get('knowledge.ontoSaveToOntoLibrary')}*/}
      {/* </Menu.Item>*/}
      <ContainerIsVisible
        key="1"
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_EDIT,
          userType: PERMISSION_KEYS.KG_EDIT,
          userTypeDepend: graphBasicData?.__codes
        })}
      >
        <Menu.Item
          disabled={graphBasicData.step_num < 3}
          key="timedTask"
          style={{ height: 40 }}
          onClick={onOpenModalTask}
        >
          {intl.get('graphList.timedTask')}
        </Menu.Item>
        <Menu.Item
          disabled={graphBasicData.step_num < 3 || isRunning}
          key="groupTask"
          style={{ height: 40 }}
          onClick={() => setRunGroupModalVisible(true)}
        >
          {intl.get('graphList.groupTask')}
        </Menu.Item>
        <Menu.Item
          disabled={graphBasicData.step_num < 3}
          key="taskRecord"
          style={{ height: 40 }}
          onClick={() => {
            jumpTaskRecord();
          }}
        >
          {intl.get('graphList.taskRecord')}
        </Menu.Item>
      </ContainerIsVisible>
      {/* <ContainerIsVisible
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_MEMBER,
          userType: PERMISSION_KEYS.KG_EDIT_PERMISSION,
          userTypeDepend: graphBasicData?.__codes
        })}
      >
        <Menu.Item
          key="3"
          style={{ height: 40 }}
          // onClick={openAuthPage}
          onClick={() => {
            const { id, name } = graphBasicData;
            history.push(`/knowledge/graph-auth?knId=${selectedKnowledge.id}&graphId=${id}&graphName=${name}`);
          }}
        >
          {intl.get('knowledge.authorityManagement')}
        </Menu.Item>
      </ContainerIsVisible> */}

      <Menu.Item key="refresh" style={{ height: 40 }} onClick={onRefresh}>
        {intl.get('global.refresh')}
      </Menu.Item>
      <ContainerIsVisible
        key="4"
        isVisible={HELPER.getAuthorByUserInfo({
          roleType: PERMISSION_CODES.ADF_KN_KG_DELETE,
          userType: PERMISSION_KEYS.KG_DELETE,
          userTypeDepend: graphBasicData?.__codes
        })}
      >
        <Menu.Item key="delete" style={{ height: 40 }} onClick={onOpenModalDelete}>
          {intl.get('knowledge.delete')}
        </Menu.Item>
      </ContainerIsVisible>
    </Menu>
  );

  const renderGroupTaskFailTips = () => {
    return (
      <Popover
        placement="bottom"
        content={
          <div>
            <span className="kw-align-center">
              <ExclamationCircleFilled className="kw-c-error" />
              <span className="kw-ml-2">{intl.get('task.groupTaskFailTips')}</span>
            </span>
            <div className="kw-mt-4" style={{ textAlign: 'right' }}>
              <Button onClick={jumpTaskRecord} size="small" type="primary">
                {intl.get('global.goNow')}
              </Button>
            </div>
          </div>
        }
      >
        <IconFont className="kw-c-subtext kw-ml-2" type="icon-wenhao" />
      </Popover>
    );
  };

  const STATUS = KEY_VALUE_COLOR[(ad_graphStatus || graphBasicData?.status) as keyof typeof KEY_VALUE_COLOR];
  return (
    <Format.Container className="headerRoot kw-border-b">
      <div className="left kw-flex-item-full-width">
        {collapsed && (
          <Format.Button
            className="kw-mr-3"
            onClick={() => {
              sessionStore.remove('graphListCollapse');
              setCollapsed(false);
            }}
            type="icon"
            tip={intl.get('global.expand')}
          >
            <IconFont type="icon-zhankai1" style={{ fontSize: 12, transform: 'rotate(180deg)' }} />
          </Format.Button>
        )}
        <IconFont type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
        <Format.Text level={2} className="kw-ellipsis kw-ml-2" tip={graphBasicData?.name} style={{ maxWidth: 240 }}>
          {graphBasicData?.name}
        </Format.Text>
        {graphBasicData?.name && (
          <span className="kw-align-center" style={{ minWidth: 67 }}>
            <Divider type="vertical" className="kw-ml-3 kw-mr-3" />
            <div className="status-sign" style={{ backgroundColor: STATUS?.color }} />
            <Format.Text style={{ marginLeft: 6 }}>{STATUS?.label}</Format.Text>
            {(graphBasicData?.status === RUNNING || ad_graphStatus === RUNNING) &&
              graphBasicData?.graphdb_type?.includes('nebula') && (
                <Tooltip title={intl.get('graphDetail.knGraphNebulaTip')}>
                  <QuestionCircleOutlined className="kw-c-subtext kw-ml-1" style={{ fontSize: 14 }} />
                </Tooltip>
              )}
            {ad_graphStatus === FAIL ? (
              latestTask.subgraph_id !== 0 ? (
                renderGroupTaskFailTips()
              ) : (
                <Format.Button type="icon" onClick={viewFailTaskDetails} tip={intl.get('global.detail')}>
                  <IconFont type="icon-wendang-xianxing" />
                </Format.Button>
              )
            ) : null}
          </span>
        )}
      </div>
      <div className="right">
        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            userType: PERMISSION_KEYS.KG_VIEW,
            userTypeDepend: graphBasicData?.__codes
          })}
        >
          <Format.Button className="kw-align-center" type="icon-text" onClick={viewGraph}>
            <IconFont type="icon-wendang-xianxing" />
            {intl.get('global.view')}
          </Format.Button>
        </ContainerIsVisible>
        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_KG_EDIT_EDIT,
            userType: PERMISSION_KEYS.KG_EDIT,
            userTypeDepend: graphBasicData?.__codes
          })}
        >
          <Format.Button className="kw-align-center" type="icon-text" onClick={editGraph}>
            <IconFont type="icon-edit" />
            {intl.get('graphList.edit')}
          </Format.Button>
        </ContainerIsVisible>
        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            userType: PERMISSION_KEYS.KG_VIEW,
            userTypeDepend: graphBasicData?.__codes
          })}
        >
          <Format.Button
            disabled={graphBasicData?.status === 'edit'}
            // disabled={graphBasicData?.status === 'edit' || isRunning}
            className="kw-align-center"
            type="icon-text"
            onClick={debugGraph}
          >
            <IconFont type="icon-tuputiaoshi" />
            {intl.get('global.analysis')}
          </Format.Button>
        </ContainerIsVisible>
        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_KG_EDIT,
            userType: PERMISSION_KEYS.KG_EDIT,
            userTypeDepend: graphBasicData?.__codes
          })}
        >
          <Format.Button
            // disabled={graphBasicData.step_num < 4}
            disabled={graphBasicData.step_num < 3 || isRunning}
            onClick={runNow}
            className="kw-align-center"
            type="icon-text"
          >
            <IconFont type="icon-qidong" />
            {intl.get('global.run')}
          </Format.Button>
        </ContainerIsVisible>
        <Dropdown
          overlay={menu}
          trigger={['click']}
          placement="bottomRight"
          getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
        >
          <Format.Button className="kw-align-center" type="icon-text">
            {/* <IconFont type="icon-caozuo1" /> */}
            <EllipsisOutlined />
            {intl.get('graphList.more')}
          </Format.Button>
        </Dropdown>
      </div>
      {runNowModal.visible && (
        <RunNowTask
          firstBuild={!graphBasicData.task_status}
          graphId={graphBasicData.id}
          onCancel={closeRunNowModal}
          onUpdateGraphStatus={onUpdateGraphStatus}
        />
      )}
      <TimedTask
        listFooterVisible={false}
        visible={isVisibleTask}
        graphId={taskTimedId}
        onCancel={onCloseModalTask}
        onOk={onCloseModalTask}
      />
      <ModalDelete visible={isVisibleModalDelete} onOk={deleteGraph} onCancel={onCloseModalDelete} />
      <ModalBranchTask
        visible={runGroupModalVisible}
        handleCancel={() => setRunGroupModalVisible(false)}
        graphId={graphBasicData?.id}
        goToTask={() => {
          getGraphTaskList();
          setRunGroupModalVisible(false);
        }}
        ontoId={graphBasicData?.otl}
      />
    </Format.Container>
  );
};

const mapStateToProps = (state: any) => {
  return {
    ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
  };
};

export default connect(mapStateToProps)(Header);
