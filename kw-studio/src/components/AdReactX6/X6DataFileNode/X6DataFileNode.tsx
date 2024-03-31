import React, { useEffect, useState, memo, useMemo } from 'react';
import { Table, Tooltip, ConfigProvider } from 'antd';
import { Node, Graph } from '@antv/x6';
import './style.less';
import { AdX6DataFileNodeHeaderHeight, AdX6EntityNodeHeaderHeight } from '../utils/constants';
import LoadingMask from '@/components/LoadingMask';
import FileIcon from '@/components/FileIcon';
import IconFont from '@/components/IconFont';
import { SyncOutlined } from '@ant-design/icons';
import Format from '@/components/Format';
import NoDataBox from '@/components/NoDataBox';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';

/**
 * X6 实体类节点
 */
const X6DataFileNode = (props: { node: Node; graph: Graph }) => {
  const { node, graph } = props;
  const nodeConfig = node?.getData();
  const close = () => {
    graph.removeNode(node);
    nodeConfig?.onClearX6FileNode();
  };

  /**
   * 刷新数据
   */
  const refreshData = async () => {
    await nodeConfig?.refreshDataFile(node);
  };

  const editData = () => {
    nodeConfig?.editDataFile();
  };

  const prefixCls = 'kw-x6-data-file-node';

  const partitionFields = useMemo(() => {
    const dataFile = nodeConfig.dataFile;
    if (dataFile.partition_usage) {
      return Object.keys(dataFile.partition_infos);
    }
    return [];
  }, []);
  return (
    <div className={`${prefixCls} kw-border-t kw-border-l kw-border-r kw-bg-white`}>
      {/* <LoadingMask loading={loading} />*/}
      <div
        className={`${prefixCls}-header kw-space-between kw-border-b kw-pl-4 kw-align-center`}
        style={{ height: AdX6DataFileNodeHeaderHeight }}
      >
        <span className="kw-align-center kw-flex-item-full-width">
          <FileIcon type={nodeConfig.fileIcon} size={22} dataSource={nodeConfig?.dataFile?.data_source} />
          <Format.Title className="kw-ml-1 kw-flex-item-full-width kw-ellipsis" title={nodeConfig.fileName}>
            {nodeConfig.fileName}
          </Format.Title>
        </span>
        <span>
          {nodeConfig.error && (
            <Tooltip placement="top" title={nodeConfig.error}>
              <IconFont style={{ fontSize: 18 }} type="graph-warning1" className="kw-c-error" />
            </Tooltip>
          )}
          {!nodeConfig.readOnly && (
            <Format.Button type="icon" onClick={editData} tip={intl.get('workflow.eidt')} tipPosition="top">
              <IconFont type="icon-edit" />
            </Format.Button>
          )}
          <Format.Button
            type="icon"
            onClick={refreshData}
            tip={intl.get('workflow.knowledgeMap.refreshSelectedField')}
            tipPosition="top"
          >
            <SyncOutlined />
          </Format.Button>
          {!nodeConfig.readOnly && (
            <Format.Button type="icon" onClick={close} tip={intl.get('workflow.knowledgeMap.delete')} tipPosition="top">
              <IconFont type="icon-guanbiquxiao" />
            </Format.Button>
          )}
        </span>
      </div>
      <div className={`${prefixCls}-table`}>
        {nodeConfig.error && <div className={`${prefixCls}-table-mask`} />}
        {
          <div style={{ position: 'relative' }}>
            <Table
              pagination={false}
              columns={[
                {
                  title: '字段名',
                  dataIndex: 'fieldName',
                  ellipsis: true,
                  render: (text, record) => {
                    return (
                      <div
                        className={classNames('kw-p-2 kw-w-100 kw-align-center kw-c-header kw-format-strong-6', {
                          [`${prefixCls}-td-hover`]: nodeConfig?.hoveField === record.fieldKey
                        })}
                      >
                        <span className="kw-ellipsis" title={text}>
                          {text}
                        </span>
                        {record.fieldError && (
                          <Tooltip placement="top" title={record.fieldError}>
                            <IconFont style={{ fontSize: 16 }} type="graph-warning1" className="kw-c-error kw-ml-2" />
                          </Tooltip>
                        )}
                        {partitionFields.includes(record.fieldKey) && (
                          <Tooltip title={intl.get('workflow.information.already')} placement="top">
                            <IconFont type="icon-fenqupeizhi" className="kw-ml-2" />
                          </Tooltip>
                        )}
                      </div>
                    );
                  }
                },
                {
                  title: '字段类型',
                  dataIndex: 'fieldValue',
                  ellipsis: true,
                  render: (text, record) => {
                    return (
                      <div
                        className={classNames('kw-p-2 kw-ellipsis', {
                          [`${prefixCls}-td-hover`]: nodeConfig?.hoveField === record.fieldKey
                        })}
                        title={text}
                        style={{ height: 38 }}
                      >
                        {text}
                      </div>
                    );
                  }
                }
              ]}
              dataSource={nodeConfig.tableData}
              className={`${prefixCls}-table`}
              size="small"
              showHeader={false}
              rowKey="fieldName"
              locale={{
                emptyText: (
                  <NoDataBox
                    className="kw-border-b"
                    imgSrc={require('@/assets/images/empty.svg').default}
                    desc={intl.get('global.noData')}
                  />
                )
              }}
            />
          </div>
        }
      </div>
    </div>
  );
};

export default X6DataFileNode;
