import classNames from 'classnames';
import { Graph, Node } from '@antv/x6';
import intl from 'react-intl-universal';
import { Spin, Tooltip, message } from 'antd';
import React, { memo, useEffect, useState, useRef } from 'react';
import { SyncOutlined, LoadingOutlined } from '@ant-design/icons';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import FileIcon from '@/components/FileIcon';
import useLatestState from '@/hooks/useLatestState';
import TemplateModal from '@/components/TemplateModal';
import servicesCreateEntity from '@/services/createEntity';
import { FileTree } from '@/components/SourceImportComponent';
import { DsSourceItem } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/types';

import './style.less';

const X6ModelDirFileNode = (props: { node: Node; graph: Graph }) => {
  const { node, graph } = props;
  const nodeDataConfig = node?.getData();
  const { graphId, dataFile, file } = nodeDataConfig._sourceData;
  const [modalProps, setModalProps] = useState({
    visible: false,
    dataSource: {} as DsSourceItem,
    rootNode: {}
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');
  const [tooltipVisible, setTooltipVisible, getTooltipVisible] = useLatestState<boolean>(false);
  const prefixCls = 'kw-x6-model-dir-file-node';
  const prefixLocale = 'workflow.knowledgeMap';
  const isMove = useRef<boolean>(false);

  useEffect(() => {
    graph.on('node:move', nodeMove);
    graph.on('node:moved', nodeMoved);
    return () => {
      graph.off('node:move', nodeMove);
      graph.off('node:moved', nodeMoved);
    };
  }, []);

  useEffect(() => {
    if (file.file_type === 'dir') {
      refreshData();
    }
  }, []);

  /**
   * 节点开始移动
   */
  const nodeMove = () => {
    isMove.current = true;
    const visible = getTooltipVisible();
    if (visible) {
      setTooltipVisible(false);
    }
  };

  /**
   * 节点移动后
   */
  const nodeMoved = () => {
    isMove.current = false;
    const visible = getTooltipVisible();
    if (visible) {
      setTooltipVisible(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    const params = {
      docid: file.file_source,
      ds_id: dataFile.ds_id,
      postfix: 'all'
    };
    const { Cause } = (await servicesCreateEntity.getChildrenFile(params)) || {};
    setLoading(false);
    if (Cause) {
      const error = intl.get(`${prefixLocale}.fileNotExist`);
      setFileError(error);
      message.error({
        content: error,
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      nodeDataConfig.onRefreshModelDir(intl.get(`${prefixLocale}.fileNotExist`), dataFile);
    }
  };

  /**
   * 查看按钮的点击事件
   */
  const viewBtn = async () => {
    const data = await servicesCreateEntity.getFlowSource({ id: graphId, type: 'unfilter' });
    if (data) {
      const { res } = data;
      if (res) {
        const dataSourceList = res?.df ?? [];
        const dataSource = dataSourceList.find((item: DsSourceItem) => item.id === dataFile.ds_id) ?? {};
        setModalProps(prevState => ({
          ...prevState,
          visible: true,
          dataSource,
          rootNode: {
            key: JSON.stringify({
              docid: file.file_source,
              name: file.file_name,
              path: file.file_path,
              type: file.file_type
            }),
            id: file.file_source,
            title: file.file_name,
            name: file.file_name,
            type: file.file_type
          }
        }));
      }
    }
  };
  const close = () => {
    graph.removeNode(node);
    nodeDataConfig?.onClearX6ModelFileNode(file.file_source);
  };
  return (
    <Spin indicator={<LoadingOutlined />} spinning={loading}>
      <div className={classNames(prefixCls, 'kw-align-center kw-p-2 kw-border kw-bg-white')}>
        {fileError && <div className={`${prefixCls}-mask`} />}
        <FileIcon name={nodeDataConfig.label} type={nodeDataConfig.type} />
        <Tooltip
          placement="topLeft"
          overlayClassName={`${prefixCls}-tooltip`}
          title={
            <div>
              <div className="kw-c-header">{file.file_name}</div>
              <div className="kw-c-subtext">AnyShare://{file.file_path}</div>
            </div>
          }
          destroyTooltipOnHide
          open={tooltipVisible}
        >
          <span
            onMouseEnter={() => {
              if (!isMove.current) {
                setTooltipVisible(true);
              }
            }}
            onMouseLeave={() => {
              if (!isMove.current) {
                setTooltipVisible(false);
              }
            }}
            className="kw-flex-item-full-width kw-ellipsis kw-ml-2"
          >
            {nodeDataConfig.label}
          </span>
        </Tooltip>
        <span className="kw-align-center" style={{ zIndex: 10 }}>
          {fileError && (
            <Tooltip placement="top" title={fileError}>
              <Format.Button type="icon">
                <IconFont type="graph-warning1" style={{ color: '#f5222d' }} />
              </Format.Button>
            </Tooltip>
          )}
          <div className={`${prefixCls}-toolbar`}>
            {nodeDataConfig.type === 'dir' && (
              <>
                <Tooltip title={intl.get(`${prefixLocale}.view`)} placement="top">
                  <Format.Button disabled={!!fileError} type="icon" onClick={viewBtn}>
                    <IconFont type="icon-wendang-xianxing" />
                  </Format.Button>
                </Tooltip>
                <Tooltip title={intl.get(`${prefixLocale}.refresh`)} placement="top">
                  <Format.Button disabled={!!fileError} type="icon" onClick={refreshData}>
                    <SyncOutlined />
                  </Format.Button>
                </Tooltip>
              </>
            )}
            {!nodeDataConfig.readOnly && (
              <Format.Button type="icon" onClick={close} tip={intl.get(`${prefixLocale}.delete`)} tipPosition="top">
                <IconFont type="icon-guanbiquxiao" />
              </Format.Button>
            )}
          </div>
        </span>
        <TemplateModal
          className={`${prefixCls}-modal`}
          open={modalProps.visible}
          title={intl.get('workflow.information.details')}
          width={640}
          footer={null}
          onCancel={() => {
            setModalProps(prevState => ({
              ...prevState,
              visible: false
            }));
          }}
        >
          <FileTree
            className="kw-border-form-item"
            source={modalProps.dataSource}
            errors={{}}
            multiple={false}
            rootNode={modalProps.rootNode as any}
          />
        </TemplateModal>
      </div>
    </Spin>
  );
};

export default memo(X6ModelDirFileNode);
