import React, { useEffect, useMemo, useState } from 'react';
import './styles.less';
import { Tooltip, Tree } from 'antd';
import UniversalModal from '@/components/UniversalModal';
import intl from 'react-intl-universal';
import { SOURCE_IMG_MAP } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/AddDataFileModal/assistant';
import { DS_SOURCE, DS_TYPE, stringSeparator1 } from '@/enums';
import { DownOutlined } from '@ant-design/icons';
import _ from 'lodash';
import FileIcon from '@/components/FileIcon';
import servicesCreateEntity from '@/services/createEntity';
import { convertToList, flatToArray, updateTreeData } from './assistant';

const { TreeNode } = Tree;
const MultipleFileTree = ({ data, closeMultipleFileModal }: any) => {
  const [treeProps, setTreeProps] = useState({
    treeData: [] as any[],
    expandedKeys: [] as string[],
    loadedKeys: [] as string[]
  });

  useEffect(() => {
    const treeData: any = [];
    const loadedKeys: string[] = [];
    data.forEach((ds: any) => {
      loadedKeys.push(ds.ds_id);
      treeData.push({
        ds_id: ds.ds_id,
        level: 1,
        isLeaf: false,
        title: ds.ds_name,
        key: ds.ds_id,
        parentKey: null,
        icon: <img style={{ width: 20, height: 20 }} src={SOURCE_IMG_MAP[DS_SOURCE.as]} alt="KWeaver" />,
        children: ds.files.map((file: any) => ({
          ds_id: ds.ds_id,
          title: file.file_name,
          key: file.file_source,
          isLeaf: file.file_type === 'file',
          icon: <FileIcon style={{ lineHeight: 0 }} type={file.file_type} name={file.file_name} size={16} />,
          parentKey: ds.ds_id
        }))
      });
    });
    setTreeProps(prevState => ({
      ...prevState,
      treeData,
      expandedKeys: Array.from(new Set(loadedKeys)),
      loadedKeys: Array.from(new Set(loadedKeys))
    }));
  }, []);

  // const getDsNameNyPath = (path: string) => {
  //   const target = data.find((item: any) => item.ds_path === path);
  //   if (target) {
  //     return target.ds_name;
  //   }
  //   return path;
  // };

  // useEffect(() => {
  //   const allFlatDataSource: any = [];
  //   const expendedKeys: string[] = [];
  //   const tempArr: any = [];
  //   const loadedKeys: string[] = [];
  //   data.forEach((ds: any) => {
  //     loadedKeys.push(ds.ds_id);
  //     allFlatDataSource.push({
  //       ds_id: ds.ds_id,
  //       level: 1,
  //       isLeaf: false,
  //       title: ds.ds_name,
  //       key: ds.ds_id,
  //       parentKey: null,
  //       icon: <img style={{ width: 20, height: 20 }} src={SOURCE_IMG_MAP[DS_SOURCE.as]} alt="KWeaver" />
  //     });
  //     ds.files.forEach((file: any) => {
  //       tempArr.push({
  //         ...file,
  //         file_source: file.file_source.replace('gns://', ''),
  //         ds_id: ds.ds_id
  //       });
  //     });
  //   });
  //
  //   tempArr.forEach((item: any) => {
  //     const filePathArr = item.file_path.split('/');
  //     const fileSourceArr = convertToList(item.file_source);
  //     filePathArr.forEach((pathItem: string, index: number) => {
  //       const key = `${item.ds_id}${stringSeparator1}${fileSourceArr[index]}`;
  //       const parentKey = `${item.ds_id}${stringSeparator1}${fileSourceArr[index - 1]}`;
  //       const level = index + 2;
  //       const isLeaf = index + 1 === filePathArr.length;
  //       if (level < 3) {
  //         expendedKeys.push(key);
  //       }
  //       if (!isLeaf) {
  //         loadedKeys.push(key);
  //       }
  //       allFlatDataSource.push({
  //         ds_id: item.ds_id,
  //         level,
  //         isLeaf: isLeaf && item.file_type === 'file',
  //         title: pathItem,
  //         key,
  //         parentKey: index > 0 ? parentKey : item.ds_id,
  //         icon: <FileIcon style={{ lineHeight: 0 }} type={item.file_type} name={pathItem} size={16} />
  //       });
  //     });
  //   });
  //   const treeData = flatToArray(_.uniqBy(allFlatDataSource, 'key'));
  //   setTreeProps(prevState => ({
  //     ...prevState,
  //     treeData,
  //     expandedKeys: Array.from(new Set(loadedKeys)),
  //     loadedKeys: Array.from(new Set(loadedKeys))
  //   }));
  // }, []);

  const titleRender = ({ title, key, icon }: any) => {
    return (
      <span className="kw-align-center kw-ellipsis" key={key}>
        {icon}
        <span className="kw-ml-2">{title}</span>
      </span>
    );
  };

  // const onLoadData = (node: any) => {
  //   const { key, ds_id, level } = node;
  //   // eslint-disable-next-line no-async-promise-executor
  //   return new Promise<any>(async resolve => {
  //     const realNodeKey = key.replace(`${ds_id}${stringSeparator1}`, '');
  //     const params = {
  //       docid: realNodeKey,
  //       ds_id,
  //       postfix: 'all'
  //     };
  //     const { res } = (await servicesCreateEntity.getChildrenFile(params)) || {};
  //     const childNode = res.output.map((item: any) => ({
  //       ds_id,
  //       level: level + 1,
  //       isLeaf: item.type === 'file',
  //       title: item.name,
  //       key: `${ds_id}${stringSeparator1}${item.docid}`,
  //       parentKey: key,
  //       icon: <FileIcon style={{ lineHeight: 0 }} type={item.type} name={item.name} size={16} />
  //     }));
  //     const newTreeData = updateTreeData({
  //       treeDataSource: _.cloneDeep(treeProps.treeData),
  //       childNode,
  //       parentKey: key
  //     });
  //     setTreeProps(prevState => ({
  //       ...prevState,
  //       treeData: newTreeData,
  //       loadedKeys: [...prevState.loadedKeys, key]
  //     }));
  //     resolve(true);
  //   });
  // };

  const onLoadData = (node: any) => {
    const { key, ds_id, level } = node;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<any>(async resolve => {
      const params = {
        docid: key,
        ds_id,
        postfix: 'all'
      };
      const { res } = (await servicesCreateEntity.getChildrenFile(params)) || {};
      const childNode = res.output.map((item: any) => ({
        ds_id,
        isLeaf: item.type === 'file',
        title: item.name,
        key: item.docid,
        parentKey: key,
        icon: <FileIcon style={{ lineHeight: 0 }} type={item.type} name={item.name} size={16} />
      }));
      const newTreeData = updateTreeData({
        treeDataSource: _.cloneDeep(treeProps.treeData),
        childNode,
        parentKey: key
      });
      setTreeProps(prevState => ({
        ...prevState,
        treeData: newTreeData,
        loadedKeys: [...prevState.loadedKeys, key]
      }));
      resolve(true);
    });
  };
  return (
    <UniversalModal
      open
      title={intl.get('global.detail')}
      className="MultipleFileTree"
      onCancel={closeMultipleFileModal}
    >
      <Tree
        switcherIcon={<DownOutlined />}
        expandedKeys={treeProps.expandedKeys}
        selectedKeys={[]}
        loadedKeys={treeProps.loadedKeys}
        treeData={treeProps.treeData}
        onExpand={key => {
          setTreeProps(prevState => ({
            ...prevState,
            expandedKeys: key as string[]
          }));
        }}
        titleRender={titleRender}
        loadData={onLoadData}
        blockNode
      />
    </UniversalModal>
  );
};

export default MultipleFileTree;
