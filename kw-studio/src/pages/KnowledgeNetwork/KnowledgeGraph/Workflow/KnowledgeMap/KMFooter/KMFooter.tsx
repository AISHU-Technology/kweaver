import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Button, Dropdown, Menu, message } from 'antd';
import intl from 'react-intl-universal';
import { useKnowledgeMapContext } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import { CaretDownOutlined } from '@ant-design/icons';
import _ from 'lodash';
import serviceWorkflow from '@/services/workflow';
import RunNowModal from './RunNowModal/RunNowModal';
import { DS_SOURCE } from '@/enums';
import ModalBranchTask from '@/components/ModalBranchTask';
import { useHistory } from 'react-router-dom';
import TimedTask from '@/components/timedTask';
import serviceGraphDetail from '@/services/graphDetail';
import { G6EdgeData, G6NodeData } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';

interface KMButtonProps {
  onPrev: () => void; // 上一步
  onSave: (messageVisible?: boolean) => void; // 保存
}

interface KMButtonRefProps {
  getGraphKMapParam: () => any;
  save: () => void;
}

const KMFooter = forwardRef<KMButtonRefProps, KMButtonProps>(({ onPrev, onSave }, ref) => {
  const { knowledgeMapStore } = useKnowledgeMapContext();
  const history = useHistory();

  const isImmediately = useMemo(() => {
    return knowledgeMapStore.graphDataSource?.some(ds => ds.data_source === DS_SOURCE.mq);
  }, [knowledgeMapStore.graphDataSource]);

  const [taskModalType, setTaskModalType] = useState<'select' | 'save'>('select');

  const [modalVisible, setModalVisible] = useState({
    branch: false, // 分组运行弹框
    timeTask: false, // 定时任务弹框
    now: false // 立即运行弹框
  });
  const [firstBuild, setFirstBuild] = useState<boolean>(true); // 是否是首次构建
  const prefixLocale = 'workflow.knowledgeMap';
  useImperativeHandle(ref, () => ({
    getGraphKMapParam,
    save: () => {
      onSave(false);
    }
  }));

  useEffect(() => {
    knowledgeMapStore.graphId && getGraphBasicData();
  }, [knowledgeMapStore.graphId]);

  const getGraphBasicData = async () => {
    try {
      const result = await serviceGraphDetail.graphGetInfoBasic({
        is_all: true,
        graph_id: knowledgeMapStore.graphId
      });
      const data = result?.res || {};
      if (data.task_status) {
        // 说明不是首次构建
        setFirstBuild(false);
      }
    } catch (error) {
      const { type, response } = error;
      if (type === 'message') {
        // message.error(response?.Description || '');
        message.error({
          content: response?.Description || '',
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
      }
    }
  };

  /**
   * 获取映射要保存的参数
   */
  const getGraphKMapParam = () => {
    if (knowledgeMapStore.flow4Visible) {
      return _.cloneDeep(knowledgeMapStore.graphKMap)!;
    }
  };

  /**
   * 保存数据
   */
  const saveData = async () => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const params = {
        graph_step: 'graph_KMap',
        graph_process: getGraphKMapParam()
      };
      const res = await serviceWorkflow.graphEdit(knowledgeMapStore.graphId, params);
      if (!res?.res) {
        // message.error(res.message);
        message.error({
          content: res.message,
          className: 'custom-class',
          style: {
            padding: 0
          }
        });
        resolve(res.message);
      } else {
        resolve('');
      }
    });
  };
  const onMenuItemClick = async (key: string) => {
    if (knowledgeMapStore.flow4ErrorList.length > 0) {
      // message.error(intl.get(`${prefixLocale}.graphConfigErrorTips`));
      message.error({
        content: intl.get(`${prefixLocale}.graphConfigErrorTips`),
        className: 'custom-class',
        style: {
          padding: 0
        }
      });
      return;
    }
    const { graphKMap } = knowledgeMapStore;
    const cloneGraphG6Data = _.cloneDeep(knowledgeMapStore.graphG6Data);
    const cloneG6RelationDataFileObj = _.cloneDeep(knowledgeMapStore.g6RelationDataFileObj);
    const names = Object.keys(cloneG6RelationDataFileObj);
    const g6Data = [...cloneGraphG6Data.nodes!, ...cloneGraphG6Data.edges!];
    for (let i = 0; i < g6Data.length; i++) {
      const item = g6Data[i] as G6NodeData | G6EdgeData;
      const relations = item._sourceData.relations;
      const uniqueKey = relations ? String(item._sourceData.edge_id) : item._sourceData.name;
      if (names.includes(uniqueKey)) {
        const relations = item._sourceData.relations; // 关系类的关系
        const className = item._sourceData.name; // 实体类或关系类的类名

        const defaultProps = item._sourceData.default_tag; // 默认属性
        const mergeProps = item._sourceData.primary_key ?? []; // 融合属性
        const requiredProps = defaultProps ? [...mergeProps, defaultProps] : mergeProps; //  两者组合为必配置属性

        if (relations) {
          graphKMap.edge.forEach(edge => {
            if (_.isEqual(edge.relations, relations) && edge.entity_type) {
              edge.property_map.forEach(attr => {
                if (requiredProps.includes(attr.edge_prop) && !attr.entity_prop) {
                  // message.error(intl.get(`${prefixLocale}.graphConfigErrorTips`));
                  message.error({
                    content: intl.get(`${prefixLocale}.graphConfigErrorTips`),
                    className: 'custom-class',
                    style: {
                      padding: 0
                    }
                  });
                  throw new Error(intl.get(`${prefixLocale}.graphConfigErrorTips`));
                }
              });
            }
          });
        } else {
          graphKMap.entity.forEach(entity => {
            if (entity.name === className && entity.entity_type) {
              entity.property_map.forEach(attr => {
                if (requiredProps.includes(attr.otl_prop) && !attr.entity_prop) {
                  // message.error(intl.get(`${prefixLocale}.graphConfigErrorTips`));
                  message.error({
                    content: intl.get(`${prefixLocale}.graphConfigErrorTips`),
                    className: 'custom-class',
                    style: {
                      padding: 0
                    }
                  });
                  throw new Error(intl.get(`${prefixLocale}.graphConfigErrorTips`));
                }
              });
            }
          });
        }
      }
    }

    // 点击提交配置前需要把映射配置保存一下
    const error = await saveData();
    if (error) {
      return;
    }
    setModalVisible(prevState => ({
      ...prevState,
      [key]: true
    }));
  };

  return (
    <>
      <Button
        className="btn"
        onClick={() => {
          if (!knowledgeMapStore.viewMode) {
            onSave(false);
          }
          onPrev();
        }}
        type={knowledgeMapStore.viewMode ? 'primary' : 'default'}
      >
        {intl.get('global.previous')}
      </Button>
      {!knowledgeMapStore.viewMode && (
        <>
          <Button className="btn" onClick={() => onSave()}>
            {intl.get('global.save')}
          </Button>
          {/* <Button*/}
          {/*  className="btn"*/}
          {/*  onClick={() => {*/}
          {/*  }}*/}
          {/* >*/}
          {/*  查看store*/}
          {/* </Button>*/}
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="branch"
                  onClick={() => {
                    onMenuItemClick('branch');
                  }}
                >
                  <span>{intl.get('task.groupRun')}</span>
                </Menu.Item>
                {/* rabbitmq无定时任务 */}
                {!isImmediately && (
                  <Menu.Item
                    key="timeTask"
                    onClick={() => {
                      onMenuItemClick('timeTask');
                      // setModalVisible(prevState => ({
                      //   ...prevState,
                      //   timeTask: true
                      // }));
                    }}
                  >
                    <span> {intl.get('workflow.conflation.timedrun')}</span>
                  </Menu.Item>
                )}
                <Menu.Item
                  key="now"
                  onClick={() => {
                    onMenuItemClick('now');
                  }}
                >
                  <span>{intl.get('workflow.conflation.RunNow')}</span>
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
            overlayClassName="mix-run-overlay"
            getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
          >
            <Button type="primary" className="btn">
              {intl.get('workflow.conflation.configNow')}
              <CaretDownOutlined style={{ fontSize: 12 }} />
            </Button>
          </Dropdown>
        </>
      )}

      {modalVisible.now && (
        <RunNowModal
          firstBuild={firstBuild}
          taskModalType={isImmediately ? 'save' : taskModalType}
          setTaskModalType={setTaskModalType}
          isImmediately={isImmediately}
          closeModal={() => {
            setModalVisible(prevState => ({
              ...prevState,
              now: false
            }));
          }}
        />
      )}

      {/* 分组运行弹框 */}
      <ModalBranchTask
        firstBuild={firstBuild}
        visible={modalVisible.branch}
        handleCancel={() => {
          setModalVisible(prevState => ({
            ...prevState,
            branch: false
          }));
        }}
        graphId={knowledgeMapStore.graphId!}
        goToTask={() => {
          const knw_id =
            window.sessionStorage.getItem('selectedKnowledgeId') &&
            parseInt(window.sessionStorage.getItem('selectedKnowledgeId') as string);
          const confId = knowledgeMapStore.graphId;
          history.push(`/knowledge/studio-network?id=${knw_id}&gid=${confId}&isConfig=true&tab=task`);
        }}
      />

      <TimedTask
        graphId={knowledgeMapStore.graphId!}
        visible={modalVisible.timeTask}
        onCancel={() => {
          setModalVisible(prevState => ({
            ...prevState,
            timeTask: false
          }));
        }}
        onOk={async () => {
          await saveData();
          setTaskModalType('save');
          setModalVisible(prevState => ({
            ...prevState,
            now: true,
            timeTask: false
          }));
        }}
      />
    </>
  );
});

export default KMFooter;
