import React, { memo, useEffect, useState, useRef, useContext } from 'react';
import { Tree, Spin, Menu, Dropdown, Space, message } from 'antd';
import { LoadingOutlined, DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import HOOKS from '@/hooks';
import _ from 'lodash';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { NODE_TYPE, TreeWrapperHeight } from '../enums';
import { getImage } from '../assistant';

import './style.less';
import { getParam } from '@/utils/handleFunction/GetParam';
import CreateModal from '@/pages/DPApiService/FirstSQLSetting/SQLSourceTree/CreateModal';
import {
  CHANGE_SELECTED_KN_USER_ID_VALUE,
  CHANGE_SELECTED_KN_USER_INFO_VALUE,
  DpapiDataContext
} from '@/pages/DPApiService/dpapiData';
import KwKNIcon from '@/components/KwKNIcon';

type DataSourceTreeType = {
  treeData: any[];
  loading: any;
  loadKey: string;
  onLoadData: (data: any, action?: string) => void;
  refresh: (isFresh: boolean, currentKwId: number, isToastSuccess: boolean) => void;
  onKnIdChange: (data: any) => void;
  pageAction: string;
};
const ICON: Record<string, any> = {
  field: 'icon-AttributesTable',
  base: 'icon-data',
  mode: 'icon-jiegou',
  sheet: 'icon-Datatable'
};

type KnInfoTypes = {
  id: number;
  identify_id: string;
  intelligence_score: string;
  knw_description: string;
  knw_name: string;
};

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const { SHEET, FIELD, BASE, ROOT } = NODE_TYPE;
const DataSourceTree = (props: DataSourceTreeType) => {
  // @ts-ignore
  const { data, dispatch } = useContext(DpapiDataContext);
  const { knUserList, selectedKnUserId, selectedKnUserInfo } = data.toJS();
  const { treeData, loading, loadKey, onLoadData, refresh, pageAction, onKnIdChange } = props;
  const treeWrapperRef = useRef<any>();
  const [expandedKeys, setExpandedKeys] = useState<any[]>([]); // 展开的节点
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]); // 选中的节点
  const [treeWrapperHeight, setTreeWrapperHeight] = useState<number>(TreeWrapperHeight);
  const [visible, setVisible] = useState<boolean>(false); // 新建弹窗

  // tree组件
  const [treeEditStatusKey, setTreeEditStatusKey] = useState<any>();

  useEffect(() => {
    if (!loadKey) return;
    setExpandedKeys((pre: any) => [...pre, loadKey]);
  }, [loadKey]);

  /**
   * 控制新建弹窗
   */
  const onChangeModalVisible = (value: boolean) => setVisible(value);

  const resetKwInfo = (currentKwId: number) => {
    const findArr = knUserList.filter((x: any) => x.id === currentKwId);
    if (findArr && findArr.length > 0) {
      dispatch({ type: CHANGE_SELECTED_KN_USER_ID_VALUE, data: currentKwId });
      dispatch({ type: CHANGE_SELECTED_KN_USER_INFO_VALUE, data: findArr[0] });
    }
  };

  const onSelect = _.debounce((keys: any[], e: any) => {
    if ([SHEET, FIELD].includes(e?.node?.type)) setSelectedKeys(keys);

    if ([SHEET, FIELD].includes(e?.node?.type)) {
      onLoadData(e.node, 'sql');
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

  // 判断regionName长度隐藏
  const getTextWidth = (text: any, fontSize: any) => {
    const span = document.createElement('span');
    span.style.fontSize = fontSize;
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    span.innerText = text;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
  };

  /**
   * 自定义渲染节点
   * @param node 节点数据
   * @returns
   */
  const titleRender = (node: any) => {
    const { title, type, fieldType } = node;
    const tip = type === FIELD ? `${title}${'  '}${fieldType}` : title;
    const imgSrc = type === ROOT ? getImage(node?.origin) : '';
    if (title === '') return null; // 每层结构加的空节点
    const isHovered = node.key === treeEditStatusKey;
    const regionWidth = getTextWidth(node.title, '14px');
    return (
      <div
        className="titleWrapper kw-align-center"
        style={{ height: 24 }}
        onMouseEnter={() => {
          setTreeEditStatusKey(node.key);
        }}
        onMouseLeave={() => {
          setTreeEditStatusKey(null);
        }}
      >
        {ICON[type] && <IconFont type={ICON[type]} className="titleIcon" />}
        {imgSrc && <img className="source-icon" src={imgSrc} alt="nodata" />}
        <span className="kw-pl-2 kw-ellipsis sourceName" title={tip}>
          {title}
          {isHovered}
          {type === FIELD && <span className="kw-ml-2 kw-c-subtext">{fieldType}</span>}
        </span>
        {isHovered && (
          <>
            <span>
              {node?.parentId !== '0' && (
                <Space>
                  <CopyToClipboard text={title}>
                    <span
                      className="del-icon"
                      onClick={() => {
                        message.success(intl.get('exploreAnalysis.copySuccess'));
                      }}
                    >
                      <IconFont type="icon-copy" />
                    </span>
                  </CopyToClipboard>
                </Space>
              )}
            </span>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    const contianerHeight = treeWrapperRef?.current?.offsetHeight - 20;
    setTreeWrapperHeight(contianerHeight);
  }, [treeWrapperRef.current]);

  // @ts-ignore
  return (
    <div className="source-tree-wrapper kw-h-100">
      <div className="kw-space-between kw-border-b" style={{ height: 40 }}>
        <Format.Text className="kw-c-header">
          <Dropdown
            disabled={pageAction !== 'create'}
            overlay={
              <Menu
                onClick={e => {
                  // 知识网络用户发生变化-触发更新 ds
                  const id = Number(e.key);
                  resetKwInfo(id);
                  refresh(true, id, false);
                }}
              >
                {knUserList.map((item: any) => {
                  return (
                    <Menu.Item key={item.id} style={{ height: 40 }}>
                      <div className="kw-align-center" style={{ width: 220 }}>
                        <KwKNIcon type={item?.color} />
                        <div
                          className="kw-flex-item-full-width kw-ellipsis"
                          style={{ marginLeft: 6 }}
                          title={item.knw_name}
                        >
                          {item.knw_name}
                        </div>
                      </div>
                    </Menu.Item>
                  );
                })}
              </Menu>
            }
            trigger={['click']}
            placement="bottomLeft"
            // getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
          >
            {selectedKnUserInfo !== null ? (
              <span className="knInfoDropdownItem">
                {/* <IconFont type="icon-color-renzhiyingyong" /> */}
                <KwKNIcon type={selectedKnUserInfo?.color} />

                <span className="kw-flex-item-full-width kw-ellipsis" style={{ marginLeft: 6 }}>
                  {selectedKnUserInfo.knw_name}111111111111111111111111122222222222222222222222222222222
                </span>
                {pageAction !== 'create' ? (
                  <span></span>
                ) : (
                  <span style={{ marginLeft: 6 }}>
                    <DownOutlined style={{ fontSize: 10 }} />
                  </span>
                )}
              </span>
            ) : (
              <span></span>
            )}
          </Dropdown>
        </Format.Text>
        <div>
          <ExplainTip title={intl.get('global.refresh')}>
            <IconFont
              type="icon-tongyishuaxin"
              className="kw-pointer"
              onClick={() => {
                // @ts-ignore
                refresh(true, selectedKnUserInfo.id, true);
              }}
            />
          </ExplainTip>
          <ExplainTip title={intl.get('global.create')}>
            <IconFont type="icon-Add" className="kw-ml-3 kw-pointer" onClick={() => onChangeModalVisible(true)} />
          </ExplainTip>
        </div>
      </div>
      <div className="tree-wrapper" ref={treeWrapperRef}>
        {loading.tree ? (
          <div className="loadingBox  kw-center">
            <Spin indicator={antIcon} />
          </div>
        ) : (
          <Tree
            showLine
            blockNode
            height={treeWrapperHeight}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            switcherIcon={<DownOutlined />}
            treeData={treeData}
            titleRender={titleRender}
            onExpand={onExpand}
            onSelect={onSelect}
          />
        )}
      </div>

      <CreateModal
        visible={visible}
        knw_id={selectedKnUserInfo?.id}
        onCancel={() => onChangeModalVisible(false)}
        onOK={() => {
          // @ts-ignore
          refresh(false, selectedKnUserInfo.id, true);
          onChangeModalVisible(false);
        }}
      />
    </div>
  );
};
export default memo(DataSourceTree);
