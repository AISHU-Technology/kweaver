import React, { memo, useEffect, useState, useRef } from 'react';
import { Tree, Spin, Menu, Dropdown } from 'antd';
import { LoadingOutlined, DownOutlined } from '@ant-design/icons';
import HOOKS from '@/hooks';
import _ from 'lodash';
import classNames from 'classnames';

import intl from 'react-intl-universal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import { copyToBoard } from '@/utils/handleFunction';
import { NODE_TYPE } from '../enums';
import { getImage } from '../assistant';

import './style.less';

type DataSourceTreeType = {
  treeData: any[];
  loading: any;
  loadKey: string;
  onLoadData: (data: any, action?: string) => void;
  refresh: () => void;
  onChangeModalVisible: (data: boolean) => void;
  onAdd: (data: boolean) => void;
  isAdd: boolean;
  setIsAdd: (data: boolean) => void;
  isAddDisable: any;
  // defaultExpandedKeys: string[];
};
const ICON: Record<string, any> = {
  field: 'icon-AttributesTable',
  base: 'icon-data',
  mode: 'icon-jiegou',
  sheet: 'icon-Datatable'
};

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const { SHEET, FIELD, BASE, ROOT, MODE } = NODE_TYPE;
const DataSourceTree = (props: DataSourceTreeType) => {
  const {
    treeData,
    loading,
    loadKey,
    onLoadData,
    refresh,
    onChangeModalVisible,
    onAdd,
    isAdd,
    setIsAdd,
    isAddDisable
  } = props;
  const { height } = HOOKS.useWindowSize();
  const attributeRef = useRef<any>();
  const [expandedKeys, setExpandedKeys] = useState<any[]>([]); // 展开的节点
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]); // 选中的节点
  const [selectNode, setSelectNode] = useState<any>({}); // 选中节点
  const [dropOpen, setDropOpen] = useState<string>(''); // 下拉弹窗
  const [hoverTitle, setHoverTitle] = useState(false); // 鼠标移入某一行

  // HOOKS.useDeepCompareEffect(() => {
  //   setExpandedKeys(defaultExpandedKeys);
  // }, [defaultExpandedKeys]);

  useEffect(() => {
    if (!loadKey) return;
    setExpandedKeys((pre: any) => [...pre, loadKey]);
  }, [loadKey]);

  const onSelect = _.debounce((keys: any[], e: any) => {
    if (e?.node?.type !== FIELD && e?.node?.key) {
      const key = e?.node?.key;
      if (expandedKeys.includes(key)) {
        setExpandedKeys(expandedKeys.filter(item => item !== key));
      } else {
        if ([BASE, SHEET].includes(e?.node?.type)) {
          onLoadData(e.node);
        } else {
          setExpandedKeys([...expandedKeys, key]);
        }
      }
    }
    const types = [FIELD, SHEET];
    if (e?.selected) {
      if (types.includes(e?.node?.type)) {
        setSelectedKeys(keys);
      }
    }
    setSelectNode(e?.node);
    if ([SHEET, FIELD].includes(e?.node?.type)) {
      onLoadData(e.node, 'preview');
    }
  }, 300);

  /**
   * 展开节点
   * @param keys
   */
  const onExpand = _.debounce((keys: any[], e: any) => {
    if (e.expanded && [BASE, SHEET].includes(e?.node?.type)) {
      onLoadData(e.node);
    } else {
      setExpandedKeys(keys);
    }
  }, 300);

  /**
   * 全局sql按钮
   */
  const onClickSql = () => {
    if (!selectNode?.key) return;
    onLoadData(selectNode, 'sql');
  };

  /**
   * 右键
   */
  const onContextMenu = (e: any, node: any) => {
    e?.preventDefault();
    setSelectedKeys([node?.key]);
    setSelectNode(node);
    setDropOpen(node?.key);
  };

  /**
   * 鼠标经过某一行
   */
  const onmouseOver = (e: any, node: any) => {
    setHoverTitle(true);
    attributeRef.current = `${node?.sheetName}-${node?.title}`;
    // attributeRef.current = `${node?.title}-${node?.fieldType}`;
  };

  /**
   * 鼠标离开
   */
  const onMouseLeave = () => {
    setHoverTitle(false);
    attributeRef.current = '';
  };

  /**
   * 自定义渲染节点
   * @param node 节点数据
   * @returns
   */
  const titleRender = (node: any) => {
    const { title, type, fieldType, sheetName } = node;
    const tip = type === FIELD ? `${title}${'  '}${fieldType}` : title;
    const imgSrc = type === ROOT ? getImage(node?.origin) : '';
    if (title === '') return null; // 每层结构加的空节点
    return (
      <div
        className="titleWrapper kw-align-center"
        onMouseOver={e => onmouseOver(e, node)}
        onMouseLeave={onMouseLeave}
        style={{ height: 24 }}
        onContextMenu={e => onContextMenu(e, node)}
      >
        {ICON[type] && <IconFont type={ICON[type]} className="titleIcon" />}
        {imgSrc && <img className="source-icon" src={imgSrc} alt="nodata" />}
        <Dropdown
          overlay={<CustomMenu node={node} />}
          trigger={['click']}
          placement="bottomCenter"
          visible={dropOpen === node?.key}
          onVisibleChange={e => {
            if (!e) setDropOpen('');
          }}
          getPopupContainer={e => (document.getElementsByClassName('dataSourceListRoot')?.[0] as any) || document.body}
        >
          <span className="kw-pl-2 kw-ellipsis kw-flex sourceName" title={tip}>
            {title}
            {type === FIELD && <span className="kw-ml-2 kw-c-subtext">{fieldType}</span>}
          </span>
        </Dropdown>
        {['sheet', 'field'].includes(type) && hoverTitle && attributeRef?.current === `${sheetName}-${title}` ? (
          // {type === 'field' && hoverTitle && attributeRef?.current === `${title}-${fieldType}` ? (
          <span
            className="kw-pointer kw-c-primary"
            onClick={(e: any) => {
              e?.stopPropagation();
              setIsAdd(true);
              onAdd(title);
            }}
            title=""
            // style={{ cursor: isAddDisable ? 'not-allowed' : 'pointer' }}
          >
            {intl.get('cognitiveSearch.resource.add')}
          </span>
        ) : null}
      </div>
    );
  };

  const handleMenuClick = ({ key, node }: any) => {
    if (key === 'sql') onLoadData(node, 'sql');
    if (key === 'copy') copyToBoard(node?.title);
    setDropOpen('');
  };

  const CustomMenu = ({ node }: any) => {
    return (
      <Menu>
        <Menu.Item
          key="sql"
          onClick={e => {
            e?.domEvent?.stopPropagation();
            handleMenuClick({ key: 'sql', node });
          }}
        >
          <IconFont type="icon-SQLchaxun" className="kw-mr-2" />
          {intl.get('domainData.sqlQuery')}
        </Menu.Item>
        <Menu.Item
          key="copy"
          onClick={e => {
            e?.domEvent?.stopPropagation();
            handleMenuClick({ key: 'copy', node });
          }}
        >
          <IconFont type="icon-copy" className="kw-mr-2" />
          {intl.get('domainData.copyName')}
        </Menu.Item>
      </Menu>
    );
  };

  return (
    <div className="sql-data-source-list-root kw-h-100">
      <div className="treeWrapper" style={{ height: 'calc(100% - 40px)' }}>
        {loading && (
          <div className="loadingBox  kw-center">
            <Spin indicator={antIcon} />
          </div>
        )}
        <Tree
          showLine
          blockNode
          height={height - 200}
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          switcherIcon={<DownOutlined />}
          treeData={treeData}
          titleRender={titleRender}
          onExpand={onExpand}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
};
export default memo(DataSourceTree);
