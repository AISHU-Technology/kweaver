import React, { useState } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Menu, message, Tooltip, Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import { GRAPH_STATUS } from '@/enums';
import serverTaskManagement from '@/services/taskManagement';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import TimedTask from '@/components/timedTask';

import ModalDelete from './ModalDelete';

import './style.less';

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

const KEY_VALUE_COLOR = GRAPH_STATUS.getKeyValueColor();
type StatusType = typeof KEY_VALUE_COLOR;

interface HeaderInterface {
  ad_graphStatus: StatusType | undefined;
  graphBasicData: {
    name: string;
    status: string;
    export: boolean;
    kg_conf_id: number;
    is_upload: boolean;
  };
  isNewGraph: boolean;
  selectedKnowledge: { id: number };
  onRefresh: () => void;
  onSelectedGraph: (graph: string) => void;
  onRefreshLeftSpace: () => void;
}

const Header = (props: HeaderInterface) => {
  const history = useHistory();
  const { ad_graphStatus = 'NORMAL' } = props;
  const { graphBasicData, isNewGraph, selectedKnowledge } = props;
  const { onRefresh, onSelectedGraph, onRefreshLeftSpace } = props;
  const [taskTimedId, setTaskTimedId] = useState<number | null>(null); // 定时任务图谱 id
  const [isVisibleModalDelete, setIsVisibleModalDelete] = useState(false); // 删除弹窗 visible

  const isVisibleTask = taskTimedId === 0 ? true : !!taskTimedId;

  // 编辑图谱
  const editGraph = async () => {
    const { kg_conf_id, status, is_upload } = graphBasicData;
    const graphStatus = ad_graphStatus || status;

    if (graphStatus === GRAPH_STATUS.RUNNING) return message.warning(intl.get('graphList.needRun'));
    if (graphStatus === GRAPH_STATUS.WAITING) return message.warning(intl.get('graphList.needWait'));
    if (is_upload) return message.warning(intl.get('graphList.uploadErr'));

    try {
      if (graphStatus === GRAPH_STATUS.CONFIGURATION) {
        history.push(`/home/workflow/edit?id=${kg_conf_id}&status=${GRAPH_STATUS.CONFIGURATION}`);
      } else {
        history.push(`/home/workflow/edit?id=${kg_conf_id}&status=${GRAPH_STATUS.NORMAL}`);
      }
    } catch (error) {
      // console.log(error)
    }
  };

  // 打开关闭定时任务弹窗
  const onOpenModalTask = () => setTaskTimedId(graphBasicData?.kg_conf_id);
  const onCloseModalTask = () => setTaskTimedId(null);

  // 导出图谱
  const onExportGraph = () => {
    const postData = { ids: [String(graphBasicData?.kg_conf_id)] || [] };
    const fileName = graphBasicData?.name || '图谱';
    serverKnowledgeNetwork.graphOutput(postData, fileName);
  };

  // 打开关闭删除弹窗
  const onOpenModalDelete = () => setIsVisibleModalDelete(true);
  const onCloseModalDelete = () => setIsVisibleModalDelete(false);
  const deleteGraph = async () => {
    try {
      const data = { graphids: [Number(graphBasicData.kg_conf_id)], knw_id: selectedKnowledge.id };
      const result = await serverTaskManagement.graphDelByIds(data);
      if (result?.ErrorCode) {
        const error = ERROR_OBJECT[result.ErrorCode as keyof typeof ERROR_OBJECT];
        message.error(error ? intl.get(error.intlText) : result.Description);
        return;
      }
      message.success(intl.get('task.deleteSucc'));
      onRefreshLeftSpace();
      onSelectedGraph('');
      onCloseModalDelete();
    } catch (error) {
      // console.log(error)
    }
  };

  // 操作下拉框选项
  const menu = (
    <Menu className="operator-menu">
      <Menu.Item key="1" style={{ height: 40 }} onClick={onOpenModalTask}>
        {intl.get('graphList.timedTask')}
      </Menu.Item>
      {graphBasicData.status === GRAPH_STATUS.NORMAL && (
        <Menu.Item key="3" style={{ height: 40 }} onClick={onExportGraph}>
          {intl.get('knowledge.export')}
        </Menu.Item>
      )}
      <Menu.Item key="4" style={{ height: 40 }} onClick={onOpenModalDelete}>
        {intl.get('knowledge.delete')}
      </Menu.Item>
    </Menu>
  );

  const STATUS = KEY_VALUE_COLOR[(ad_graphStatus || graphBasicData?.status) as keyof typeof KEY_VALUE_COLOR];

  return (
    <Format.Container className="headerRoot">
      <div className="left">
        <IconFont className="titleIcon" type="icon-zhishiwangluo" />
        <Format.Title level={5} className="ad-ellipsis" tip={graphBasicData?.name} style={{ maxWidth: 410 }}>
          {graphBasicData?.name}
        </Format.Title>
        {graphBasicData?.name && (
          <div className="status" style={{ backgroundColor: STATUS?.background }}>
            <Format.Text style={{ color: STATUS?.color }}>{STATUS?.label}</Format.Text>
          </div>
        )}
      </div>
      {!isNewGraph && (
        <div className="right">
          <Format.Button className="button" type="primary" onClick={editGraph}>
            <IconFont type="icon-edit" />
            {intl.get('graphList.edit')}
          </Format.Button>
          <Format.Button className="button" onClick={onRefresh}>
            <IconFont type="icon-tongyishuaxin" />
            {intl.get('graphDetail.refresh')}
          </Format.Button>
          <Dropdown
            overlay={menu}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
          >
            <Tooltip title={intl.get('graphList.more')} placement="top">
              <Format.Button className="operate">
                <EllipsisOutlined style={{ color: 'rgba(0, 0, 0, 0.85)' }} />
              </Format.Button>
            </Tooltip>
          </Dropdown>
        </div>
      )}
      <TimedTask visible={isVisibleTask} graphId={taskTimedId} onCancel={onCloseModalTask} onOk={onCloseModalTask} />
      <ModalDelete visible={isVisibleModalDelete} onOk={deleteGraph} onCancel={onCloseModalDelete} />
    </Format.Container>
  );
};

const mapStateToProps = (state: any) => {
  return {
    ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
  };
};

export default connect(mapStateToProps)(Header);
