import classNames from 'classnames';
import { Avatar, Select } from 'antd';
import { Node, Graph } from '@antv/x6';
import intl from 'react-intl-universal';
import React, { useEffect, useRef, useState } from 'react';

import Format from '@/components/Format';
import { stringSeparator1 } from '@/enums';
import IconFont from '@/components/IconFont';

import { KwRowStartPointPortLeft, KwX6RelationNodeHeaderHeight } from '../utils/constants';
import './style.less';

/**
 * X6 关系类起始或者结束节点
 */
const X6RelationStartEndNode = (props: { node: Node; graph: Graph }) => {
  const { node } = props;
  const nodeDataConfig = node?.getData();
  const [value, setValue] = useState<string>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefixLocale = 'workflow.knowledge';
  useEffect(() => {
    setValue(nodeDataConfig.selectValue);
  }, [nodeDataConfig.selectValue]);
  const selectChange = (data: string) => {
    const prevPortId = `${nodeDataConfig.name}${stringSeparator1}${value}`;
    node.removePort(prevPortId);
    const latestPortId = `${nodeDataConfig.name}${stringSeparator1}${data}`;
    node.addPort({
      id: latestPortId,
      group: KwRowStartPointPortLeft
    });
    setValue(data);
    nodeDataConfig.updateStoreGraphKMap();
  };
  const prefixCls = 'kw-x6-relation-start-end-node';

  return (
    <div className={`${prefixCls} kw-border-t kw-border-l kw-border-r kw-bg-white`} ref={wrapperRef}>
      <div
        className={`${prefixCls}-title kw-center kw-border-b`}
        style={{
          height: 28,
          background: nodeDataConfig.type === 'start' ? 'rgba(240, 245, 255, 1)' : 'rgba(255, 242, 232, 1)'
        }}
      >
        <IconFont style={{ fontSize: 18 }} type={nodeDataConfig.type === 'start' ? 'icon-StartingPoint' : 'icon-end'} />
        <span className="kw-ml-1">
          {nodeDataConfig.type === 'start' ? intl.get(`${prefixLocale}.begin`) : intl.get(`${prefixLocale}.end`)}
        </span>
      </div>
      <div
        className={`${prefixCls}-header kw-align-center kw-border-b kw-pl-4`}
        style={{ height: KwX6RelationNodeHeaderHeight }}
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
      <Select
        className={classNames(`${prefixCls}-select`, 'kw-border-b', {
          [`${prefixCls}-select-hover`]: nodeDataConfig?.hoveField === value
        })}
        bordered={false}
        style={{ width: '100%' }}
        options={nodeDataConfig.selectOptions}
        size="large"
        value={value}
        onChange={selectChange}
        disabled={nodeDataConfig.readOnly}
      />
    </div>
  );
};

export default X6RelationStartEndNode;
