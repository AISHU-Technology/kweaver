import React, { useState, useEffect, useRef } from 'react';

import _ from 'lodash';
import { Tree } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { DownOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import SearchInput from '@/components/SearchInput';
import { fuzzyMatch } from '@/utils/handleFunction';

const prefabricatedTemplate = {
  title: intl.get('prompt.form'),
  key: 'prefabricated',
  isLeaf: false,
  children: [],
  icon: <DownOutlined />
};

const TemplateLeft = (props: any) => {
  const { getData, templates, setShowData, setIsTemplate, setSelectGroup, promptManageList, setShowTreeSelect } = props;
  const oldExpandKeys = useRef<any>(); // 搜索前展开的数据
  const oldSelectedRef = useRef<any>(); // 搜索前展开的数据
  const searchName = useRef<any>(); // 搜索名称
  const [treeData, setTreeData] = useState<any>([]); // 树形控件需要的数据
  const [expandedKeys, setExpandedKeys] = useState<any>([]); // 展开
  const [matchTreeData, setMatchTreeData] = useState<any>([]); // 树形控件需要的数据
  const [selectPromptId, setSelectPromptId] = useState<any>('prefabricated');

  useEffect(() => {
    const value = ['prefabricated'];
    const data = {
      selected: true,
      node: prefabricatedTemplate
    };
    onTreeSelect(value, data);
    onExpand(value, { ...data, expanded: true });
  }, []);

  useEffect(() => {
    onHandleTreeData(promptManageList);
  }, [promptManageList]);

  /**
   * 左侧树选择
   */
  const onTreeSelect = (value: any, e: any, type?: string) => {
    if (value?.[0] === 'prefabricated') {
      setIsTemplate(true);
      setSelectGroup(intl.get('prompt.form'));
      setShowTreeSelect([]);
      setShowData(templates);
    }
    if (!e?.node?.children) {
      setSelectGroup(e?.node?.parentName);
      setIsTemplate(false);
      getData(e?.node);
    }
    // 包含说明已经展开，再点击就是关闭
    let expandData: any = [];
    if (expandedKeys.includes(value?.[0]) && e?.selected) {
      expandData = _.filter(expandedKeys, (item: any) => item !== e?.node?.key);
      setExpandedKeys(expandData);
      if (!searchName?.current) {
        oldExpandKeys.current = expandData;
        oldSelectedRef.current = '';
      }
      setSelectPromptId('');
      return;
    }
    expandData = e?.selected
      ? [...new Set([...expandedKeys, ...value])]
      : _.filter(expandedKeys, (item: any) => item !== e?.node?.key);
    setExpandedKeys(expandData);
    if (!type && !searchName?.current) {
      oldExpandKeys.current = expandData;
      oldSelectedRef.current = e?.selected ? value?.[0] : '';
    }
    setSelectPromptId(e?.selected ? value?.[0] : '');
  };

  /**
   * 提示词管理列表数据转换成需要的格式(Tree)
   */
  const onHandleTreeData = (data: any) => {
    const treeFormat = _.map(data, (item: any) => onTreeFormat(item));
    const allTreeData = [prefabricatedTemplate, ...treeFormat];
    setTreeData(allTreeData);
    setMatchTreeData(allTreeData);
  };

  /**
   * 树格式
   */
  const onTreeFormat = (item: any) => {
    const childrenData = _.map(item?.prompt_item_types, (i: any) => ({
      title: i?.name,
      key: i?.id,
      icon: <IconFont type="icon-wenjianjia" />,
      parentKey: item?.prompt_item_id,
      parentName: `${item?.prompt_item_name}/${i?.name}`
    }));
    return {
      title: item?.prompt_item_name,
      key: item?.prompt_item_id,
      icon: <IconFont type="icon-wenjianjia" />,
      children: childrenData,
      isLeaf: false
    };
  };

  /**
   * 提示词分组名称搜索
   */
  const onSearch = _.debounce(e => {
    const { value } = e.target;
    searchName.current = value;
    const matchData = value ? _.filter(_.cloneDeep(treeData), (item: any) => fuzzyMatch(value, item?.title)) : treeData;
    const expandKey = _.map(_.cloneDeep(matchData), (item: any) => item?.key);
    const key = [matchData?.[0]?.children?.[0]?.key];
    let data: any = {};
    _.map(_.cloneDeep(matchData), (item: any) => {
      if (item.key === 'prefabricated') {
        data = item;
      } else {
        _.map(item?.children, (i: any) => {
          if (i?.key === oldSelectedRef?.current) {
            data = i;
          }
        });
      }
    });
    if (!_.isEmpty(matchData) && matchData?.[0]?.key !== 'prefabricated') {
      onExpand(expandKey, {}, 'search');
    } else {
      onExpand(expandKey, {}, 'search');
    }
    if (!value) {
      setSelectPromptId(oldSelectedRef?.current);
      setSelectGroup(data?.parentName);
      if (data?.key === 'prefabricated') {
        setIsTemplate(true);
        setShowData([...templates]);
      } else {
        getData(data);
      }
    } else {
      setSelectPromptId('');
    }
    setMatchTreeData(matchData);
  }, 200);

  /**
   * 展开
   */
  const onExpand = (value: any, e: any, type?: string) => {
    if (!type) {
      setSelectPromptId(e?.expanded ? value?.[0] : '');
    }

    const data = searchName?.current && type ? expandedKeys : oldExpandKeys.current;
    // 搜索时
    if (searchName?.current || type) {
      // 搜索全部展开
      let expandData: any = [];
      if (_.isEmpty(e)) {
        expandData = type && searchName?.current ? value : oldExpandKeys?.current;
      } else {
        // 搜索时手动展开
        expandData = e?.expanded
          ? [...new Set([...data, ...value])]
          : _.filter(data, (item: any) => item !== e?.node?.key);
      }
      setExpandedKeys(expandData);
    } else {
      // 非搜索，手动展开
      const expandData = e?.expanded
        ? [...new Set([...data, ...value])]
        : _.filter(data, (item: any) => item !== e?.node?.key);
      setExpandedKeys(expandData);
      oldExpandKeys.current = expandData;
    }
  };

  /**
   * 渲染标题
   */
  const titleRender = (node: any) => {
    const { title, key } = node;
    return (
      <div className={classNames('kw-flex tree-title-box')} title={title}>
        <div className={classNames('kw-ellipsis tree-title-text', { checked: selectPromptId === key })} title={title}>
          <IconFont type="icon-wenjianjia" className="icon" />
          {title}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="kw-pr-3">
        <SearchInput
          className="kw-mb-4"
          autoWidth
          placeholder={intl.get('prompt.promptGroupPlaceName')}
          onChange={e => {
            e.persist();
            onSearch(e);
          }}
        />
      </div>
      {_.isEmpty(matchTreeData) ? (
        <div className="noData-box kw-content-center kw-w-100">
          <NoDataBox.NO_RESULT />
        </div>
      ) : (
        <Tree
          blockNode
          showLine={{ showLeafIcon: false }}
          switcherIcon={<DownOutlined />}
          treeData={matchTreeData}
          onSelect={onTreeSelect}
          titleRender={titleRender}
          expandedKeys={expandedKeys}
          onExpand={onExpand}
        />
      )}
    </>
  );
};

export default TemplateLeft;
