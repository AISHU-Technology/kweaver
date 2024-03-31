import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import './style.less';
import classNames from 'classnames';
import { Radio, Breadcrumb } from 'antd';
import type { RadioChangeEvent } from 'antd';
import AdBreadcrumbDir, { AdBreadcrumbDirRef, BreadcrumbDataProps } from '@/components/AdBreadcrumbDir/AdBreadcrumbDir';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import { DS_SOURCE, DS_TYPE, EXTRACT_TYPE } from '@/enums';
import servicesCreateEntity from '@/services/createEntity';
import FileIcon from '@/components/FileIcon';
import { DsSourceItem } from '@/components/SourceImportComponent/types';
import intl from 'react-intl-universal';

type FileTypeProps = 'csv' | 'json' | '';

type DirDataSourceProps = {
  docid: string;
  name: string;
  type: 'file' | 'dir';
};

interface DataFileDirListProps {
  value?: BreadcrumbDataProps; // 配置该属性则证明受控
  onChange?: (selectedValue: BreadcrumbDataProps) => void;
  selectedDataSource: DsSourceItem; // 选中的数据源
  disabled?: boolean; // 是否禁用
  setSelectFileType?: (type: string) => void;
  errors?: any;
}

export type DataFileDirListRefProps = {
  refreshData: () => void;
};

const DataFileDirList = forwardRef<DataFileDirListRefProps, DataFileDirListProps>((props, ref) => {
  const { value, onChange, selectedDataSource, disabled, setSelectFileType, errors } = props;
  const prefixCls = 'data-file-dir-list';
  const [dataFileDirProps, setDataFileDirProps] = useState({
    loading: false,
    dataFileList: [] as BreadcrumbDataProps[],
    fileType: 'json', // 文件类型
    forceRefreshData: ['1'] as string[] // 触发AdBreadcrumbDir强制卸载并再加载的属性
  });
  const adBreadcrumbDirRef = useRef<AdBreadcrumbDirRef | null>(null);
  const cacheSelectedDirKey = useRef<string>('');

  useImperativeHandle(ref, () => ({
    refreshData: () => {
      adBreadcrumbDirRef.current?.refreshCurrentDirData();
    }
  }));

  useDeepCompareEffect(() => {
    const fileType = selectedDataSource.extract_type === EXTRACT_TYPE.LABEL ? 'json' : 'csv';
    setDataFileDirProps(prevState => ({
      ...prevState,
      fileType
    }));
    if (
      [DS_SOURCE.as].includes(selectedDataSource?.data_source) &&
      selectedDataSource?.dataType === DS_TYPE.STRUCTURED
    ) {
      // 结构化的as
      getDataFileDirRootNodeByDataSource(fileType);
    }
  }, [selectedDataSource]);

  /**
   * 通过选中的数据源去获取as 结构化 数据源下的根节点
   */
  const getDataFileDirRootNodeByDataSource = async (fileType: string) => {
    setDataFileDirProps(prevState => ({ ...prevState, loading: true }));
    const param = {
      ds_id: selectedDataSource.id,
      data_source: selectedDataSource?.data_source,
      postfix: fileType
    };
    const { res } = (await servicesCreateEntity.getDataList(param)) || {};
    const rootNode: DirDataSourceProps[] = res?.output ?? [];
    const dataFileList: BreadcrumbDataProps[] = rootNode.map((item: DirDataSourceProps) => ({
      label: item.name,
      type: item.type,
      key: item.docid
    }));
    if (rootNode.length > 0) {
      cacheSelectedDirKey.current = rootNode[0].docid;
      const data = await getDataFileDirChildTreeNodeByDocID(rootNode[0].docid, fileType);
      if (data.length > 0) {
        updateDataFileDirList(dataFileList, rootNode[0].docid, data);
      }
    }
    setDataFileDirProps((prevState: any) => ({
      ...prevState,
      dataFileList,
      loading: false,
      forceRefreshData: [cacheSelectedDirKey.current]
    }));
  };

  const updateDataFileDirList = (
    dataSource: BreadcrumbDataProps[],
    parentKey: string,
    children: BreadcrumbDataProps[]
  ) => {
    const loop = (list: BreadcrumbDataProps[]) => {
      for (let i = 0; i < list.length; i++) {
        const listItem = list[i];
        if (listItem.key === parentKey) {
          // debugger;
          // if (listItem.children && listItem.children.length > 0) {
          //   listItem.children = [...(listItem.children = children), ...children];
          // } else {
          //   listItem.children = children;
          // }
          listItem.children = children;
          break;
        } else {
          if (listItem.children && listItem.children.length > 0) {
            loop(listItem.children);
          }
        }
      }
    };
    loop(dataSource);
  };

  /**
   * 根据目录名获取目录下的数据
   */
  const getDataFileDirChildTreeNodeByDocID = async (docId: string, fileType: string) => {
    const param = {
      docid: docId,
      ds_id: selectedDataSource.id,
      postfix: fileType
    };
    const { res } = (await servicesCreateEntity.getChildrenFile(param)) || {};
    const data = res?.output ?? [];
    const result: BreadcrumbDataProps[] = data.map((item: DirDataSourceProps) => ({
      label: item.name,
      type: item.type,
      key: item.docid
    }));
    return result;
  };

  const onLoadData = async (selectedDir: BreadcrumbDataProps, fileType?: string) => {
    cacheSelectedDirKey.current = selectedDir.key;
    setDataFileDirProps(prevState => ({
      ...prevState,
      loading: true
    }));
    const data = await getDataFileDirChildTreeNodeByDocID(selectedDir.key, fileType || dataFileDirProps.fileType);
    updateDataFileDirList(dataFileDirProps.dataFileList, selectedDir.key, data);
    setDataFileDirProps(prevState => ({
      ...prevState,
      loading: false
    }));
  };

  const onFileSelected = (file: BreadcrumbDataProps) => {
    onChange && onChange(file);
  };

  return (
    <div
      className={classNames(prefixCls, 'kw-border-form-item kw-flex-column', {
        [`${prefixCls}-disabled`]: disabled,
        'kw-p-3 kw-h-100': !disabled
      })}
    >
      {/* 流程四 csv|json选择 */}
      {!disabled && (
        <div className="kw-border-b kw-pb-3">
          <span className="kw-mr-2">{intl.get('workflow.knowledgeMap.fileType')}:</span>
          <Radio.Group
            value={dataFileDirProps.fileType}
            onChange={(e: RadioChangeEvent) => {
              onLoadData({ key: cacheSelectedDirKey.current } as any, e.target.value);
              setDataFileDirProps(prevState => ({ ...prevState, fileType: e.target.value }));
              setSelectFileType?.(e?.target?.value);
            }}
          >
            <Radio disabled={selectedDataSource.extract_type === EXTRACT_TYPE.LABEL} value="csv">
              csv
            </Radio>
            <Radio value="json">json</Radio>
          </Radio.Group>
        </div>
      )}

      <div className="kw-flex-item-full-height kw-flex-column">
        {/* forceRefreshData起到控制AdBreadcrumbDir组件先卸载再重新加载的作用*/}
        {dataFileDirProps.forceRefreshData.map(item => (
          <AdBreadcrumbDir
            key={item}
            loading={dataFileDirProps.loading}
            data={[...dataFileDirProps.dataFileList]}
            onLoadData={(selectedDir: BreadcrumbDataProps) => {
              onLoadData(selectedDir);
            }}
            onFileSelected={onFileSelected}
            selectedFiles={value}
            errors={errors}
            ref={adBreadcrumbDirRef}
          />
        ))}
      </div>
    </div>
  );
});

export default DataFileDirList;
