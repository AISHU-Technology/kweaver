import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import servicesDataSource from '@/services/dataSource';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import { getParam } from '@/utils/handleFunction';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { Empty, Modal, Tooltip, Select, Button, message, Form } from 'antd';

import serviceTaskManagement from '@/services/taskManagement';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import KwSpin from '@/components/KwSpin';
import { DATA_SOURCES } from './enum';
import kongImg from '@/assets/images/kong.svg';

import './style.less';

const page = 1;
const pageSize = 10000;
const order = 'descend';

const { Option } = Select;

const ModalSourceMatch = forwardRef((props: any, ref) => {
  const {
    modalFeedbackData,
    onHandleClose,
    fileData,
    knData,
    closeModalFeedback,
    fileReName,
    onPrev,
    usedSourceList,
    setUsedSourceList,
    dataTypeList,
    setDataTypeList,
    sourceMapping,
    setSourceMapping,
    onTabSkip,
    onSetSelectedId: setSelectedId,
    graphId
  } = props;
  const [dataSourceList, setDataSourceList] = useState<any>([]); // 所有数据源
  const [loading, setLoading] = useState(false); // 加载
  // const [selectedId, setSelectedId] = useState([]);
  const history = useHistory();
  useImperativeHandle(ref, () => ({
    onOk
  }));

  useEffect(() => {
    if (_.isEmpty(modalFeedbackData)) return;
    getTableData();
    onHandleDataSource(modalFeedbackData?.[0]);
  }, [modalFeedbackData]);

  /**
   * 获取表格数据
   */
  const getTableData = async () => {
    const knw_id = getParam('id');
    if (!knw_id) return;

    try {
      const { res } = await servicesDataSource.dataSourceGet(page, pageSize, order, knw_id);
      if (_.isEmpty(res?.df)) {
        setDataSourceList([]);
        setDataTypeList([]);
        return;
      }
      setDataSourceList(res?.df);
      setDataTypeList(res?.df);
    } catch (err) {
      //
    }
  };

  /**
   * 导入图谱使用的数据源
   * @param id 图谱id
   */
  const onHandleDataSource = (data: any) => {
    setLoading(true);
    if (!_.isEmpty(data?.ds_basic_infos)) {
      setUsedSourceList(data?.ds_basic_infos);
      const cloneData = _.cloneDeep(data?.ds_basic_infos);
      const ids = _.map(cloneData, (item: any) => {
        return item?.id;
      });
      const handleReduce = _.reduce(
        ids,
        (pre: any, key: any) => {
          pre[String(key)] = { key, value: 0 };
          return pre;
        },
        {}
      );
      setSourceMapping(handleReduce);
      setLoading(false);
    }
  };

  /**
   * 过滤下拉框数据(as、rabbitmq匹配相同的类型)
   */
  const onGraphShow = (data: any) => {
    const cloneSourceList = _.cloneDeep(dataSourceList);
    let filterGraph: any = [];

    // as结构化数据源
    if (['as', 'as7'].includes(data?.data_source)) {
      filterGraph = _.filter(
        cloneSourceList,
        (item: any) => ['as', 'as7'].includes(item?.data_source) && item?.dataType === data?.dataType
      );
    }
    if (data?.data_source === 'rabbitmq') {
      filterGraph = _.filter(cloneSourceList, (item: any) => item?.data_source === 'rabbitmq');
    }
    if (data?.data_source === 'AnyRobot') {
      filterGraph = _.filter(cloneSourceList, (item: any) => item?.data_source === 'AnyRobot');
    }

    if (_.isEmpty(filterGraph)) {
      filterGraph = _.filter(
        cloneSourceList,
        (item: any) => item?.dataType === 'structured' && !['as', 'as7', 'rabbitmq'].includes(item?.data_source)
      );
    }
    setDataTypeList(filterGraph);
  };

  /**
   * 下拉框变化(数据源映射随之改变)
   */
  const onChange = (e: number, usedId: number) => {
    sourceMapping[String(usedId)] = e;
    onHandleSelected(sourceMapping);
  };

  const onHandleSelected = (mapping: any, type?: string) => {
    const selectedIds: any = [];
    const cloneMapping = _.cloneDeep(mapping);
    _.map(cloneMapping, (item: any) => {
      if (typeof item === 'number') {
        selectedIds.push(item);
      }
    });

    setSelectedId(selectedIds);

    if (_.isEmpty(selectedIds) && type === 'run') {
      message.error(intl.get('knowledge.selectSourceMatch'));
      return false;
    }
    return true;
  };

  /**
   * 提交
   */
  const onOk = async (type: string) => {
    const isTrue = onHandleSelected(sourceMapping, type);
    if (!isTrue) return;

    const noCheckParam = _.reduce(
      sourceMapping,
      (pre: any, key: any, index: any) => {
        if (typeof key === 'number') {
          pre[index] = key;
          return pre;
        }
        return pre;
      },
      {}
    );

    const data: any = {
      knw_id: knData?.id,
      file: fileData,
      ds_id_map: JSON.stringify(noCheckParam),
      rename: fileReName
    };
    // 覆盖导入
    if (graphId) data.graph_id = graphId;
    serverKnowledgeNetwork.graphInput(data).then(result => {
      if (result?.type === 'success') {
        if (graphId) {
          const urlParams = new URLSearchParams(location.search);
          urlParams.set('gid', data.graph_id);
          urlParams.set('gcid', data.graph_id);
          urlParams.set('from', 'import');
          const newUrl = `${location.pathname}?${urlParams.toString()}`;
          history.replace(newUrl);
        }

        if (type === 'run') {
          onImportRun(result?.data?.[0]);
          return;
        }

        message.success(intl.get('knowledge.importSuccess'));
        onTabSkip('detail');
        closeModalFeedback(true);
        onHandleClose();
      }
      if (result?.type === 'fail') {
        message.error(result?.message);
        closeModalFeedback(true);
        onTabSkip('detail');
        onHandleClose();
      }
    });
  };

  /**
   * 导入并运行
   */
  const onImportRun = async (id: number) => {
    try {
      const tasktype = 'full';
      const { res, Code, Cause } = await serviceTaskManagement.taskCreate(id, { tasktype });
      if (res && !Code) {
        message.success(intl.get('knowledge.importSuccess'));
        onTabSkip('task');
        closeModalFeedback(true);
        onHandleClose();
      }
      if (Code) {
        onTabSkip('task');
        closeModalFeedback(true);
        onHandleClose();
        switch (true) {
          case Code === 500403 || Code === 'Studio.SoftAuth.UnknownServiceRecordError':
            message.error(intl.get('graphList.authErr'));
            break;
          case Code === 'Studio.Graph.KnowledgeNetworkNotFoundError':
            message.error(intl.get('graphList.hasBeenDel'));
            break;
          case Code === 500055:
            message.error(intl.get('graphList.errorByCapacity'));
            break; // 知识量已超过量级限制
          case Code === 500065:
            message.error(intl.get('uploadService.runfailed'));
            break;
          default:
            Cause && message.error(Cause);
        }
      }
    } catch (err) {
      //
    }
  };

  return (
    <div className="match-source-modal-root">
      {/* 初始数据源 */}
      {loading ? (
        <div className={`loading-mask ${loading && 'spinning'}`}>
          <KwSpin />
        </div>
      ) : null}
      <div className="inception-source-title kw-flex kw-mr-6 kw-w-100">
        <div className="kw-c-subtext title kw-pb-3">{intl.get('knowledge.original')}</div>
        <div className="kw-c-subtext title kw-pb-3">{intl.get('knowledge.target')}</div>
      </div>
      <div className="source-match">
        {_.map(usedSourceList, (item: any, index: any) => {
          return (
            <div className="kw-flex source-box" key={index}>
              <div className="kw-flex source-box-left">
                <div className="kw-flex icon-box">
                  <img className="source-icon" src={DATA_SOURCES[item?.data_source]} />
                </div>
                <div className="source-other kw-flex">
                  <div className="other-message-dsName kw-mb-1 kw-c-header kw-ellipsis" title={item?.dsname}>
                    {item?.dsname}
                  </div>
                  <div className="other-message kw-c-subtext kw-ellipsis" title={item?.ds_path}>
                    {item?.ds_path}
                  </div>
                </div>
                {['as', 'as7'].includes(item?.data_source) ? (
                  <Tooltip title={intl.get('knowledge.identical')}>
                    <IconFont type="icon-wenhao" className="icon-why" />
                  </Tooltip>
                ) : null}
              </div>
              <IconFont type="icon-lujing" style={{ opacity: '0.45' }} />
              <div className="kw-flex source-box-right">
                <Select
                  className="source-select"
                  placeholder={intl.get('knowledge.selectSource')}
                  notFoundContent={
                    <Empty image={kongImg} className="kw-pt-3 kw-pb-8" description={intl.get('knowledge.noData')} />
                  }
                  // listHeight={216}
                  onClick={() => onGraphShow(item)}
                  onChange={e => onChange(e, item?.id)}
                  getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
                >
                  {_.map(dataTypeList, (i: any) => {
                    return (
                      <Option value={i?.id} key={i?.id} className="kw-flex source-option">
                        <div className="kw-flex icon-box">
                          <img className="source-icon" src={DATA_SOURCES[i?.data_source]} />
                        </div>
                        <div className="source-other kw-flex">
                          <div className="other-message-dsName kw-c-header kw-ellipsis kw-mb-1" title={i?.dsname}>
                            {i?.dsname}
                          </div>
                          <div className="other-message kw-c-subtext kw-ellipsis" title={i?.ds_path}>
                            {i?.ds_path}
                          </div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ModalSourceMatch;
