import React, { useEffect, useState, memo } from 'react';
import { Table, Button, Avatar, Tooltip } from 'antd';
import { Node, Graph } from '@antv/x6';
import './style.less';
import { AdX6EntityNodeHeaderHeight } from '../utils/constants';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import intl from 'react-intl-universal';
import classNames from 'classnames';

interface DataSourceProps {
  fieldName?: string;
  fieldType?: string;
  key?: string;

  [fileld: string]: any;
}

type DataConfigPropsProps = {
  attrName: string;
  attrType: string;
  [key: string]: any;
};

interface DataConfigProps {
  label: string;
  name: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  attributes: DataConfigPropsProps[];
}

/**
 * X6 实体类节点
 */
const X6EntityNode = (props: { node: Node; graph: Graph }) => {
  const { node, graph } = props;
  const nodeDataConfig = node?.getData();

  const prefixCls = 'kw-x6-entity-node';
  return (
    <div className={`${prefixCls} kw-border-t kw-border-l kw-border-r kw-bg-white`}>
      <div
        className={`${prefixCls}-header kw-align-center kw-border-b kw-pl-4`}
        style={{ height: AdX6EntityNodeHeaderHeight }}
      >
        <Avatar
          size={24}
          style={{ background: nodeDataConfig.iconBgColor, color: nodeDataConfig.iconColor }}
          icon={<IconFont type={nodeDataConfig.icon} style={{ fontSize: 20 }} />}
        />
        <div className="kw-flex-column kw-ml-3" style={{ width: '85%', lineHeight: 1.2 }}>
          <Format.Title ellipsis title={nodeDataConfig.label}>
            {nodeDataConfig.label}
          </Format.Title>
          <Format.Text ellipsis subText style={{ fontSize: 12 }} title={nodeDataConfig.name}>
            {nodeDataConfig.name}
          </Format.Text>
        </div>
      </div>
      <Table
        pagination={false}
        columns={[
          {
            title: '字段名',
            dataIndex: 'fieldName',
            ellipsis: true,
            render: text => {
              let required = false;
              if (nodeDataConfig.uniqueProperty === text || nodeDataConfig.mergeProperty.includes(text)) {
                required = true;
              }
              return (
                <div
                  className={classNames('kw-p-2 kw-w-100 kw-ellipsis kw-c-header kw-format-strong-6', {
                    [`${prefixCls}-td-hover`]: nodeDataConfig?.hoveField === text
                  })}
                  title={text}
                >
                  {required && <span className="kw-c-error">*</span>}
                  {text}
                </div>
              );
            }
          },
          {
            title: '字段类型',
            dataIndex: 'fieldType',
            ellipsis: true,
            width: 100,
            render: (value, record, index) => {
              const renderErrorIcon = () => {
                let unConfigDefaultTag = false;
                let unConfigMergeTag = false;
                if (nodeDataConfig.dataFile && Object.keys(nodeDataConfig.dataFile).length > 0) {
                  const configProperty = nodeDataConfig.configProperty;
                  if (nodeDataConfig.uniqueProperty === record.fieldName) {
                    if (configProperty.length > 0 && !configProperty.includes(record.fieldName)) {
                      unConfigDefaultTag = true;
                    }
                  }
                  if (nodeDataConfig.mergeProperty.includes(record.fieldName)) {
                    if (configProperty.length > 0 && !configProperty.includes(record.fieldName)) {
                      unConfigMergeTag = true;
                    }
                  }
                }
                if (unConfigDefaultTag && unConfigMergeTag) {
                  return (
                    <Tooltip placement="top" title={intl.get('workflow.knowledgeMap.errorTips1')}>
                      <IconFont style={{ fontSize: 16 }} type="graph-warning1" className="kw-c-error" />
                    </Tooltip>
                  );
                }
                if (unConfigDefaultTag) {
                  return (
                    <Tooltip placement="top" title={intl.get('workflow.knowledgeMap.defaultTagRequiredTip')}>
                      <IconFont style={{ fontSize: 16 }} type="graph-warning1" className="kw-c-error" />
                    </Tooltip>
                  );
                }
                if (unConfigMergeTag) {
                  return (
                    <Tooltip placement="top" title={intl.get('workflow.knowledgeMap.mergeRequiredTip')}>
                      <IconFont style={{ fontSize: 16 }} type="graph-warning1" className="kw-c-error" />
                    </Tooltip>
                  );
                }
                if (nodeDataConfig.repeatMapField.includes(record.fieldName)) {
                  return (
                    <Tooltip placement="top" title={intl.get('workflow.knowledgeMap.fieldMapUniqueError')}>
                      <IconFont style={{ fontSize: 16 }} type="graph-warning1" className="kw-c-error" />
                    </Tooltip>
                  );
                }
              };

              return (
                <div
                  className={classNames('kw-p-2 kw-space-between', {
                    [`${prefixCls}-td-hover`]: nodeDataConfig?.hoveField === record.fieldName
                  })}
                  title={value}
                >
                  {value}
                  {renderErrorIcon()}
                </div>
              );
            }
          }
        ]}
        dataSource={nodeDataConfig.tableData}
        className={`${prefixCls}-table`}
        size="small"
        showHeader={false}
        rowKey="fieldName"
      />
    </div>
  );
};

export default X6EntityNode;
