import React, { useMemo } from 'react';
import { Checkbox, Collapse } from 'antd';
import { CloseCircleFilled, CheckCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classnames from 'classnames';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import Table from '../components/Table';
import Path from '../components/Path';
import SubGraph from '../components/SubGraph';
import Texts from '../components/Texts';
import CustomTabs from '../components/CustomTabs';
import './style.less';

export interface SqlQueryResProps {
  className?: string;
  style?: React.CSSProperties;
  dataSource: any[]; // 渲染数据
  checkable?: boolean; // 是否显示可勾选
  hideStatement?: boolean; // 图服务隐藏查询语句
  checkedKeys: Record<string, any>; // 勾选的key
  disabledKeys: Record<string, any>; // 禁用的key
  onFocusItem?: (data: any) => void; // 点击 聚焦定位 的回调
  onCheckChange?: (keys: Record<string, any>) => void; // 勾选的回调
}

const getTabTitle = (type: string) => {
  switch (type) {
    case 'path':
      return intl.get('exploreGraph.list');
    case 'subgraph':
      return intl.get('exploreGraph.style.shape');
    default:
      return intl.get('exploreGraph.table');
  }
};

const SqlQueryRes = (props: SqlQueryResProps) => {
  const { className, style, dataSource, checkable, hideStatement, checkedKeys, disabledKeys } = props;
  const { onFocusItem, onCheckChange } = props;

  // 查询边的结果, 加上起点终点字段
  const curRenderData = useMemo(() => {
    return _.map(dataSource, statement => {
      if (statement.renderType !== 'edges') return statement;
      const nodesMap = _.keyBy(statement.data.nodes, 'id');
      const edges = _.map(statement.data.edges, e => {
        const sourceLabel = nodesMap[e.source]?.default_property?.value;
        const targetLabel = nodesMap[e.target]?.default_property?.value;
        return { ...e, sourceLabel, targetLabel };
      });
      return { ...statement, data: { ...statement.data, edges } };
    });
  }, [dataSource]);

  /**
   * 处理勾选
   * @param checked 是否勾选
   * @param renderType 渲染类型
   * @param item 勾选的项
   */
  const handleCheck = (checked: boolean, renderType: string, item: any) => {
    if (!checked) {
      const newCheckedObj = { ...checkedKeys };
      Reflect.deleteProperty(newCheckedObj, item.id);
      return onCheckChange?.(newCheckedObj);
    }
    let value: boolean | string[] = true;
    const { id, data } = item;
    const { nodes, edges, paths } = data || {};
    switch (renderType) {
      case 'path':
        value = _.map(paths, p => p.id);
        break;
      case 'nodes':
        value = _.map(nodes, n => n.id);
        break;
      case 'edges':
        value = _.map(edges, n => n.id);
        break;
      default:
        break;
    }
    onCheckChange?.({ ...checkedKeys, [id]: value });
  };

  /**
   * 获取语句勾选状态
   * @param statement
   */
  const getStatementCheckedStatus = (statement: Record<string, any>) => {
    const { error } = statement;
    const { nodes, edges, paths } = statement.data || {};
    const { renderType } = statement;
    let disabled = false;
    let checked = false;
    let indeterminate = false;
    if (error) return { checked, disabled: true, indeterminate };
    if (!checkedKeys[statement.id] && !disabledKeys[statement.id]) return { checked, disabled, indeterminate };
    let checkedCount = 0;
    let disabledCount = 0;
    switch (true) {
      case renderType === 'path':
        _.forEach(paths, p => {
          _.includes(checkedKeys[statement.id], p.id) && (checkedCount += 1);
          _.includes(disabledKeys[statement.id], p.id) && (disabledCount += 1);
        });
        checked = checkedCount === paths?.length;
        indeterminate = !checked && !!checkedCount;
        disabled = disabledCount === paths?.length;
        break;
      case ['nodes', 'edges'].includes(renderType):
        // eslint-disable-next-line no-case-declarations
        const data = renderType === 'edges' ? edges : nodes;
        _.forEach(data, n => {
          _.includes(checkedKeys[statement.id], n.id) && (checkedCount += 1);
          _.includes(disabledKeys[statement.id], n.id) && (disabledCount += 1);
        });
        checked = checkedCount === data?.length;
        indeterminate = !checked && !!checkedCount;
        disabled = disabledCount === data?.length;
        break;
      case renderType === 'subgraph':
        checked = true;
        disabled = !!disabledKeys[statement.id];
        break;
      default:
        break;
    }
    return { checked, disabled, indeterminate };
  };

  /**
   * 表格/路径勾选
   * @param keys 勾选的节点id(路径id)
   * @param statement 语句
   */
  const onTableOrPathCheck = (keys: string[], statement: Record<string, any>) => {
    const newCheckedObj = { ...checkedKeys };
    if (!keys.length) {
      Reflect.deleteProperty(newCheckedObj, statement.id);
    } else {
      newCheckedObj[statement.id] = keys;
    }
    onCheckChange?.(newCheckedObj);
  };

  /**
   * 选中语句
   * @param item
   */
  const handleFocus = (statement: Record<string, any>) => {
    const { renderType } = statement;
    if (['nodes', 'edges'].includes(renderType)) {
      onFocusItem?.({ type: renderType, data: _.pick(statement.data, 'nodes', 'edges') });
    }
    if (renderType === 'subgraph') {
      onFocusItem?.({ type: renderType, data: _.pick(statement.data, 'gid', 'nodes', 'edges') });
    }
    if (renderType === 'path') {
      const nodes = _.uniq(_.flattenDeep(_.map(statement.data.paths, p => p.nodes)));
      const edges = _.uniq(_.flattenDeep(_.map(statement.data.paths, p => p.edges)));
      onFocusItem?.({ type: renderType, data: { nodes, edges } });
    }
  };

  /**
   * 渲染语句的方式
   * @param statement
   */
  const renderStatement = (statement: any) => {
    const { id, data, error, renderType } = statement;
    const { nodes, edges, texts } = data || {};

    if (error) {
      return (
        <div key={id} className="kw-p-6 kw-pl-3 kw-pr-3">
          {error}
        </div>
      );
    }

    // 含有文本, 使用tabs渲染
    if (texts?.length && (nodes.length || edges.length)) {
      return (
        <CustomTabs
          key={id}
          items={[
            {
              key: id + 'text',
              tab: intl.get('exploreGraph.text'),
              content: <Texts texts={texts} />
            },
            {
              key: id + renderType,
              tab: getTabTitle(renderType),
              content: <>{renderData(statement)}</>
            }
          ]}
        />
      );
    }

    // 只有text
    if (texts.length) {
      return <Texts key={id + renderType} texts={texts} />;
    }

    // 单个类型直接渲染
    return renderData(statement, !hideStatement);
  };

  /**
   * 最终数据渲染
   * @param statement
   * @param isInTabs 是否在tabs渲染
   */
  const renderData = (statement: any, isInTabs = true) => {
    const { id, data, renderType } = statement;
    const { nodes, edges, paths } = data || {};
    const _checkedKeys = checkedKeys[id] || [];
    const _disabledKeys = disabledKeys[id] || [];
    return (
      <React.Fragment key={id + renderType}>
        {renderType === 'path' ? (
          <Path
            dataSource={paths}
            checkable={checkable}
            checkedKeys={_checkedKeys}
            disabledKeys={_disabledKeys}
            onCheckChange={(keys: string[]) => onTableOrPathCheck(keys, statement)}
            onFocusItem={onFocusItem}
          />
        ) : renderType === 'subgraph' ? (
          <SubGraph nodes={nodes} edges={edges} />
        ) : nodes?.length || edges?.length ? (
          <Table
            className={classnames({ 'kw-pt-4': !hideStatement })}
            height={isInTabs ? 300 : undefined}
            type={renderType}
            dataSource={renderType === 'edges' ? edges : nodes}
            checkable={checkable}
            checkedKeys={_checkedKeys}
            disabledKeys={_disabledKeys}
            onCheckChange={(keys: string[]) => onTableOrPathCheck(keys, statement)}
          />
        ) : null}
      </React.Fragment>
    );
  };

  return (
    <div
      style={style}
      className={classnames(className, 'sql-result-panel', {
        'not-statement': hideStatement
      })}
    >
      {hideStatement ? (
        _.map(curRenderData, renderStatement)
      ) : (
        <Collapse className="statement-collapse" accordion defaultActiveKey={dataSource[0]?.id}>
          {_.map(curRenderData, item => {
            const { id, statement, error, renderType } = item;
            const checkStatus = getStatementCheckedStatus(item);
            return (
              <Collapse.Panel
                key={id}
                className="statement-panel"
                header={
                  <div className="panel-header kw-align-center">
                    {checkable && (
                      <Checkbox
                        className="kw-mr-3"
                        {...checkStatus}
                        onChange={e => handleCheck(e.target.checked, renderType, item)}
                        onClick={e => {
                          e.stopPropagation();
                          e.nativeEvent?.stopImmediatePropagation();
                        }}
                      />
                    )}
                    {error ? (
                      <CloseCircleFilled className="kw-c-error" />
                    ) : (
                      <CheckCircleFilled className="kw-c-success" />
                    )}
                    <div className="p-name kw-pl-2 kw-pr-2 kw-ellipsis" title={statement}>
                      {statement}
                    </div>
                    {!checkable && (
                      <IconFont
                        className={error ? 'icon-disabled' : ''}
                        type="icon-dingwei1"
                        onClick={(event: any) => {
                          event.stopPropagation();
                          event.nativeEvent.stopImmediatePropagation();
                          !error && handleFocus(item);
                        }}
                      />
                    )}
                  </div>
                }
              >
                {renderStatement(item)}
              </Collapse.Panel>
            );
          })}
        </Collapse>
      )}
    </div>
  );
};

export default SqlQueryRes;
