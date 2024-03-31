import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Tree, Radio } from 'antd';
import { DownOutlined, LoadingOutlined, BulbOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import servicesCreateEntity from '@/services/createEntity';
import { EXTRACT_TYPE, DS_TYPE } from '@/enums';
import IconFont from '@/components/IconFont';
import FileIcon from '@/components/FileIcon';
import LoadingMask from '@/components/LoadingMask';
import ExplainTip from '@/components/ExplainTip';
import NoDataBox from '@/components/NoDataBox';
import { fuzzyMatch } from '@/utils/handleFunction';
import SearchInput from '@/components/SearchInput';
import { DsSourceItem } from '../types';
import { createTreeNode, updateTreeData, getNode, getAllChildrenKeys, onCreateTreeNode } from './assistant';
import './style.less';

export interface FileTreeProps {
  className?: string;
  source: DsSourceItem; // 数据源
  multiple?: boolean; //  是否多选 默认 true
  errors?: Record<string, string>; // 错误信息
  extraTip?: string; // 额外的提示

  // 单选时的受控属性
  selectedKey?: string; // 选中的key
  onRowClick?: (docid?: string) => void; // 点击文件预览

  // 多选时的受控属性
  checkedKeys?: any[]; // 勾选的key(受控属性)
  onChange?: (keys: any[], postfix?: string) => void; // 勾选变化(配合受控属性使用的值变化事件)

  rootNode?: { node: string; key: string }; // 设置根节点的key，从指定的根节点开始显示
  setSourceFileType?: (data: any) => void; // 选择的数据源类型 csv | json
  onDefaultRequestId?: any;
  disabledNodeKeys?: string[];
}

export type FileTreeRefProps = {
  refreshData: () => void;
};

type FileType = 'json' | 'csv' | 'all';
const SOURCE_TYPE = ['kingbasees', 'postgresql', 'sqlserver'];

const FileTree = forwardRef<FileTreeRefProps, FileTreeProps>((props, ref) => {
  const {
    className,
    source,
    checkedKeys = [],
    selectedKey,
    errors = {},
    extraTip,
    onChange,
    onRowClick,
    multiple = true,
    rootNode,
    setSourceFileType,
    onDefaultRequestId,
    disabledNodeKeys = []
  } = props;
  const [treeData, setTreeData] = useState<any[]>([]); // 树数据
  const [fileType, setFileType] = useState<FileType>('csv'); // 结构化数据过滤文件类型
  const [loading, setLoading] = useState(false); // 加载状态
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]); // 展开的key
  const [treeLoadingMap, setTreeLoadingMap] = useState<Record<string, boolean>>({}); // loading标记
  const [keyword, setKeyword] = useState(''); // 搜索关键字
  const [searchData, setSearchData] = useState<any>([]); // 搜索数据
  const [treeDataNew, setTreeDataNew] = useState<any[]>([]); // 树数据
  const cacheExpandedKeys = useRef<string[]>([]);
  const selectedNodes = useMemo(() => {
    if (!selectedKey) return [];
    const node = getNode(selectedKey, treeData);
    return node ? [node.key] : [];
  }, [selectedKey, treeData]);

  useEffect(() => {
    if (!SOURCE_TYPE.includes(source?.data_source)) return;
    const treeDataNew = _.cloneDeep(treeData);
    const showData = _.filter(treeDataNew, (d: any) => {
      const newArr = _.filter(d?.children, (i: any) => {
        return fuzzyMatch(keyword, i?.value);
      });
      d.children = newArr;
      return d?.children.length !== 0;
    });
    setSearchData(showData);
    const openKeys = _.map(showData, (item: any) => {
      return item.key;
    });
    if (!_.isEmpty(keyword)) {
      setExpandedKeys(openKeys);
      return;
    }
    if (cacheExpandedKeys.current.length > 0) {
      setExpandedKeys(cacheExpandedKeys.current);
      cacheExpandedKeys.current = [];
    } else {
      setExpandedKeys([]);
    }
    setSearchData([]);
  }, [keyword, treeData]);

  useEffect(() => {
    if (source.id) {
      if (rootNode) {
        onLoadData(rootNode);
      } else {
        getFileRoot();
      }
    }
  }, [source.id]);

  // 导出刷新树数据方法
  useImperativeHandle(ref, () => ({
    refreshData: () => {
      if (SOURCE_TYPE.includes(source.data_source)) {
        cacheExpandedKeys.current = expandedKeys;
      } else {
        setExpandedKeys([]);
      }
      getFileRoot();
    }
  }));

  /**
   * 获取根目录
   */
  const getFileRoot = async (filePostfix?: FileType) => {
    const { id, data_source, dataType, extract_type } = source;
    let postfix = filePostfix;
    if (!postfix) {
      postfix = dataType === DS_TYPE.STRUCTURED ? (extract_type === EXTRACT_TYPE.LABEL ? 'json' : 'csv') : 'all';
    }
    setFileType(postfix);
    const params = { ds_id: id, data_source, postfix };
    setLoading(true);
    const { res } = (await servicesCreateEntity.getDataList(params)) || {};
    setLoading(false);
    if (!res) return;
    const tree = _.map(res.output, file => createTreeNode(file, source, undefined, disabledNodeKeys));
    // 当数据源类型是postgresql kingbasees sqlserver
    if (SOURCE_TYPE.includes(data_source)) {
      const tableName = Object.values(res.output);
      const tableNameKey = Object.keys(res.output);
      const kanTree = tableNameKey.map((item: any, index: any) => onCreateTreeNode(item, tableName[index], index));
      setTreeData(kanTree);
      setTreeDataNew(kanTree);
      return;
    }
    setTreeData(tree);
    setExpandedKeys([]);
  };
  /**
   * 展开文件夹
   */
  const onLoadData = async (node: any) => {
    const { id, key } = node;
    if (SOURCE_TYPE.includes(source?.data_source)) {
      return;
    }

    const params = {
      docid: id,
      ds_id: source.id,
      postfix: source.dataType === DS_TYPE.STRUCTURED ? fileType : 'all'
    };
    // 获取文件夹下的文件
    setTreeLoadingMap({ [key]: true });
    const { res } = (await servicesCreateEntity.getChildrenFile(params)) || {};
    setTreeLoadingMap({ [key]: false });

    // [bug 359385] 每次展开/收起都为刷新为新数据, 强制修改antd的`已加载标记`
    Object.assign(node, { loaded: false });

    if (!res) return;
    setExpandedKeys([...expandedKeys, node.key]);
    const newNodes = _.map(res.output, d => createTreeNode(d, source, node, disabledNodeKeys));
    const newTree = treeData.length > 0 ? updateTreeData(treeData, node.id, newNodes) : newNodes;
    setTreeData(newTree);
  };

  /**
   * 勾选
   */
  const onCheck = (keys: any, e: any) => {
    // 标注只能单选
    if (source.extract_type === EXTRACT_TYPE.LABEL) {
      onChange && onChange(e.checked ? [e.node.value] : []);
      return;
    }
    // 勾选父节点时, 只在样式上选中子节点, 实际数据只添加父节点这一份数据
    const { checkedNodes } = e;
    const childrenKeys = _.reduce(
      checkedNodes,
      (res, node) => {
        return [...res, ...getAllChildrenKeys(node)];
      },
      [] as string[]
    );
    const curKeys = _.filter(keys, k => !childrenKeys.includes(k));
    onChange && onChange(curKeys, source.dataType === DS_TYPE.STRUCTURED ? fileType : undefined);
  };

  /**
   * 选中文件
   */
  const onSelect = (keys: any[], e: any) => {
    const { node } = e;
    let newCheck: string[] = [];

    if (node.checkable) {
      const parentNode = getNode(node.pid, treeData);
      if (node.checked) {
        // 原来是勾选, 取消勾选
        if (checkedKeys.includes(node.key)) {
          newCheck = checkedKeys.filter(k => k !== node.key);
        } else {
          const brotherKeys = _.map(parentNode?.children, c => c.key);
          newCheck = _.filter([...checkedKeys, ...brotherKeys], k => ![node.key, parentNode.key].includes(k));
        }
        newCheck = _.uniq(newCheck);
        const checkedNodes = getNode(newCheck, treeData, 'key');
        onCheck(newCheck, { ...e, checked: !node.checked, checkedNodes });
      } else {
        // 原来未勾选, 勾选
        const childrenKeys = getAllChildrenKeys(node);
        newCheck = [...checkedKeys, node.key, ...childrenKeys];
        if (
          parentNode?.checkable &&
          parentNode?.children?.length &&
          _.every(parentNode?.children, broNode => _.includes(newCheck, broNode.key))
        ) {
          newCheck.push(parentNode.key);
        }
        newCheck = _.uniq(newCheck);
        const checkedNodes = getNode(newCheck, treeData, 'key');
        onCheck(newCheck, { ...e, checked: !node.checked, checkedNodes });
      }
    }

    if (node.type === 'dir') {
      const isExpand = !expandedKeys.includes(node.key);
      if (!isExpand) {
        setExpandedKeys(pre => pre.filter(key => key !== node.key));
      } else {
        onLoadData(node);
        setExpandedKeys(pre => [...pre, node.key]);
      }
    }
  };

  /**
   * 切换过滤类型
   * @param e
   */
  const onFixChange = (e: any) => {
    const { value } = e.target;
    setFileType(value);
    setSourceFileType && setSourceFileType(value);
    onChange && onChange([]);
    onRowClick && onRowClick();
    setExpandedKeys([]);
    getFileRoot(value);
  };

  /**
   * 点击名称预览
   * @param node
   */
  const onNameClick = (e: any, node: any) => {
    const { id, type } = node;
    const { extract_type } = source;
    if (extract_type !== EXTRACT_TYPE.MODEL && type === 'file') {
      e.stopPropagation();
      onDefaultRequestId && onDefaultRequestId();
      onRowClick && onRowClick(id);
    }
  };

  /**
   * 展开
   * @param keys
   */
  const onExpand = (keys: any[], e: any) => {
    if (e.expanded && e.node.type === 'dir' && !SOURCE_TYPE.includes(source?.data_source)) {
      onLoadData(e.node);
    } else {
      setExpandedKeys(keys);
      setTreeLoadingMap({ [e.node.key]: true });
      setTimeout(() => {
        setTreeLoadingMap({ [e.node.key]: false });
      }, 10);
    }
  };

  const onSearch = _.debounce(e => {
    setKeyword(e.target.value);
  }, 300);

  /**
   * 渲染标题
   */
  const titleRender = (node: any) => {
    const { id, type, name, key } = node;
    const disabled = !!errors[id];
    return (
      <>
        {treeLoadingMap[key] ? (
          <LoadingOutlined />
        ) : SOURCE_TYPE.includes(source.data_source) && id.includes('/') ? (
          <IconFont type="icon-DataSheet" />
        ) : (
          <FileIcon type={type} name={name} size={16} className={classNames({ disabled })} />
        )}
        <span
          className={classNames('kw-flex-item-full-width file-name kw-ml-2', {
            disabled,
            link: type === 'file' && source.dataType === DS_TYPE.STRUCTURED
          })}
          onClick={e => onNameClick(e, node)}
        >
          {name}
        </span>
      </>
    );
  };

  return (
    <div className={classNames(className, 'extract-file-tree-wrap kw-flex-column kw-w-100 kw-h-100 kw-pt-2')}>
      {SOURCE_TYPE.includes(source.data_source) ? (
        <div className="kw-flex">
          <SearchInput
            className="s-input kw-mb-2"
            placeholder={intl.get('graphList.enter')}
            onChange={e => {
              e.persist();
              onSearch(e);
            }}
          />
          {extraTip && (
            <ExplainTip title={extraTip} placement="bottom" autoMaxWidth>
              <div className="icon-mask-other icon-mask">
                <BulbOutlined />
              </div>
            </ExplainTip>
          )}
        </div>
      ) : (
        <>
          {source.dataType === DS_TYPE.STRUCTURED && (
            <div className={classNames('file-type kw-mb-2 kw-p-2 kw-pt-0', { 'has-tip': !!extraTip })}>
              <Radio.Group onChange={onFixChange} value={fileType}>
                <Radio value={'csv'} disabled={source.extract_type === EXTRACT_TYPE.LABEL}>
                  csv
                </Radio>
                <Radio value={'json'}>json</Radio>
              </Radio.Group>

              {extraTip && (
                <ExplainTip title={extraTip} placement="bottom" autoMaxWidth>
                  <div className="icon-mask">
                    <BulbOutlined />
                  </div>
                </ExplainTip>
              )}
            </div>
          )}
        </>
      )}
      <LoadingMask loading={loading} />
      {_.isEmpty(searchData) && keyword && <NoDataBox.NO_RESULT />}
      <div className="tree-scroll-wrap kw-w-100 kw-h-100">
        <Tree
          key={fileType}
          checkable={multiple}
          blockNode
          switcherIcon={<DownOutlined />}
          checkedKeys={checkedKeys}
          selectedKeys={selectedNodes}
          treeData={_.isEmpty(searchData) && !keyword ? treeData : searchData}
          expandedKeys={expandedKeys}
          onSelect={onSelect}
          onCheck={onCheck}
          titleRender={titleRender}
          onExpand={onExpand}
        />
      </div>
    </div>
  );
});

export default FileTree;
