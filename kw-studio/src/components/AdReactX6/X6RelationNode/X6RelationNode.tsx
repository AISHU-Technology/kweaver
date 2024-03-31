import React, { memo } from 'react';
import { Table, Avatar, Tooltip } from 'antd';
import { Node, Graph } from '@antv/x6';
import HOOKS from '@/hooks';
import './style.less';
import { AdX6RelationNodeHeaderHeight } from '../utils/constants';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import intl from 'react-intl-universal';
import classNames from 'classnames';

const { useDeepCompareEffect } = HOOKS;

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
const X6RelationNode = (props: { node: Node; graph: Graph }) => {
  const { node, graph } = props;
  const nodeDataConfig = node?.getData();

  const prefixCls = 'kw-x6-relation-node';

  return (
    <div className={`${prefixCls} kw-border-t kw-border-l kw-border-r kw-bg-white`}>
      <div
        className={`${prefixCls}-header kw-align-center kw-border-b kw-pl-4`}
        style={{ height: AdX6RelationNodeHeaderHeight }}
      >
        <div className={`${prefixCls}-icon`} />
        <div className="kw-flex-column kw-ml-3" style={{ width: '85%', lineHeight: 1.2 }}>
          <Format.Title ellipsis title={nodeDataConfig.label}>
            {nodeDataConfig.label}
          </Format.Title>
          <Format.Text ellipsis subText style={{ fontSize: 12 }} title={nodeDataConfig.name}>
            {nodeDataConfig.name}
          </Format.Text>
        </div>
      </div>
      {nodeDataConfig.tableData && nodeDataConfig.tableData.length > 0 && (
        <Table
          pagination={false}
          columns={[
            {
              title: '字段名',
              dataIndex: 'fieldName',
              ellipsis: true,
              render: text => {
                let required = false;
                if (nodeDataConfig.uniqueProperty === text) {
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
                let unConfigDefaultTag = false;
                let repeatField = false;
                if (nodeDataConfig.dataFile && Object.keys(nodeDataConfig.dataFile).length > 0) {
                  const configProperty = nodeDataConfig.configProperty ?? [];
                  if (nodeDataConfig.uniqueProperty === record.fieldName) {
                    if (configProperty.length > 0 && !configProperty.includes(record.fieldName)) {
                      unConfigDefaultTag = true;
                    }
                  }
                }
                if (nodeDataConfig.repeatMapField.includes(record.fieldName)) {
                  repeatField = true;
                }
                return (
                  <div
                    className={classNames('kw-p-2 kw-space-between kw-ellipsis', {
                      [`${prefixCls}-td-hover`]: nodeDataConfig?.hoveField === record.fieldName
                    })}
                    title={value}
                  >
                    {value}
                    {(unConfigDefaultTag || repeatField) && (
                      <Tooltip
                        placement="top"
                        title={intl.get(
                          `workflow.knowledgeMap.${
                            unConfigDefaultTag ? 'defaultTagRequiredTip' : 'fieldMapUniqueError'
                          }`
                        )}
                      >
                        <IconFont style={{ fontSize: 16 }} type="graph-warning1" className="kw-c-error" />
                      </Tooltip>
                    )}
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
      )}
    </div>
  );
};

export default X6RelationNode;
