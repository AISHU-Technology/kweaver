import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import { CheckCircleFilled } from '@ant-design/icons';
import serviceWorkflow from '@/services/workflow';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import LoadingMask from '@/components/LoadingMask';
import { graphTipModal } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/GraphTipModal';
import { useHistory } from 'react-router-dom';
import UniversalModal from '@/components/UniversalModal';
import './styles.less';
import BuildGraphModel from '@/components/BuildGraphModel';

interface RunNowModalProps {
  closeModal: () => void;
  isImmediately?: boolean; // 立即执行标识
  taskModalType: 'select' | 'save';
  setTaskModalType: any;
  firstBuild: boolean; // 是否是首次构建
}

/**
 * 立即运行弹框
 * @param props
 * @constructor
 */
const RunNowModal: React.FC<RunNowModalProps> = props => {
  const {
    knowledgeMapStore: { graphId }
  } = useKnowledgeMapContext();
  const history = useHistory();
  const { closeModal, isImmediately, taskModalType, setTaskModalType, firstBuild } = props;
  const [updateType, setUpdateType] = useState<'increment' | 'full'>('full'); // 增量更新 | 全量构建
  const [loading, setLoading] = useState(false);
  const [authKnowledgeData, setAuthKnowledgeData] = useState<any>(null); // 权限管理数据
  // const [firstBuild, setFirstBuild] = useState<boolean>(true); // 是否是首次构建
  useEffect(() => {
    if (isImmediately) {
      updateTaskByRabbitmq();
    }
    // getGraphBasicData();
  }, []);

  useEffect(() => {
    if (!firstBuild) {
      setUpdateType('increment');
    }
  }, [firstBuild]);

  const handleError = (res: any) => {
    if (res) {
      const { Code, Cause, ErrorCode, Description } = res;
      const curCode = Code || ErrorCode;
      const curCause = Cause || Description;

      // 权限错误
      if (curCode === 500403) {
        graphTipModal.open(intl.get('graphList.authErr'));

        return;
      }

      // 图谱不存在
      if ((curCode === 500001 && curCause?.includes('not exist')) || curCode === 500357) {
        graphTipModal.open(intl.get('graphList.hasBeenDel'));

        return;
      }

      // 知识量已超过量级限制
      if (curCode === 500055) {
        // message.error(intl.get('license.operationFailed'));
        message.error({
          content: intl.get('license.operationFailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }
      // 上传中的图谱不能运行
      if (curCode === 500065) {
        // message.error(intl.get('uploadService.runfailed'));
        message.error({
          content: intl.get('uploadService.runfailed'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        return;
      }

      // curCause && message.error(curCause);
      curCause &&
        message.error({
          content: curCause,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
    }
  };

  const updateTaskByRabbitmq = () => {
    setUpdateType('full');
    updateTask('full');
  };

  const updateTask = async (type?: string) => {
    const tasktype = type || updateType;
    setLoading(true);
    const taskRes = await serviceWorkflow.performTask(graphId!, { tasktype });
    setLoading(false);
    if (taskRes && taskRes.res) {
      // @ts-ignore
      window.history.pushState({}, null, window.origin + '/home');
      setTaskModalType('save');
    }
    if (taskRes && taskRes.Code) {
      handleError(taskRes);
    }
  };

  /**
   * @description 跳转到图谱列表
   * @param type 'task' | 'detail' 指定tab
   */
  const backGraphList = () => {
    const knw_id =
      window.sessionStorage.getItem('selectedKnowledgeId') &&
      parseInt(window.sessionStorage.getItem('selectedKnowledgeId') as string);
    history.push(`/knowledge/studio-network?id=${knw_id}&gid=${graphId}&gcid=${graphId}`);
  };

  return (
    <>
      {taskModalType === 'select' ? (
        <BuildGraphModel
          visible
          onCancel={() => {
            closeModal?.();
          }}
          firstBuild={firstBuild}
          onOk={(type: any) => {
            setUpdateType(type);
            updateTask(type);
          }}
        />
      ) : (
        <UniversalModal
          open
          title={null}
          className={'mix-modal'}
          width={480}
          zIndex={520}
          footer={null}
          maskClosable={false}
          closable={false}
          keyboard={false}
          destroyOnClose={true}
          onCancel={() => {
            if (authKnowledgeData) {
              setAuthKnowledgeData(null);
            }
          }}
          footerData={null}
        >
          <LoadingMask loading={loading} />
          <div className="mix-modal-content">
            <div className="title-box">
              <CheckCircleFilled className="check-icon" />
              <p className="title">{intl.get('workflow.conflation.teskSuccess')}</p>
            </div>

            <p className="warming">{intl.get('workflow.conflation.successInfo')}</p>

            <div className="footer">
              <Button className="ant-btn-default btn" onClick={() => backGraphList()}>
                {intl.get('global.view')}
              </Button>
            </div>
          </div>
        </UniversalModal>
      )}
    </>
  );
};

export default RunNowModal;
