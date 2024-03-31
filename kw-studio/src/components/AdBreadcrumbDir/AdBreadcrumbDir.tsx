// import node_modules
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Breadcrumb, Tooltip, Dropdown, Menu } from 'antd';
import React, { CSSProperties, forwardRef, useEffect, useImperativeHandle, memo, useRef } from 'react';
import { ArrowUpOutlined, ArrowRightOutlined, ArrowLeftOutlined, DoubleLeftOutlined } from '@ant-design/icons';
// import project public module
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import FileIcon from '@/components/FileIcon';
import NoDataBox from '@/components/NoDataBox';
import LoadingMask from '@/components/LoadingMask';
import useLatestState from '@/hooks/useLatestState';
// import business code
import AdResizeObserver from '../AdResizeObserver/AdResizeObserver';
// import style file
import './style.less';

export type BreadcrumbDataProps = {
  label: string;
  key: string;
  type: 'file' | 'dir';
  children?: BreadcrumbDataProps[];

  // The following properties are added internally by the component's internal flat array function
  // No need to pass them in externally
  parentKey?: string; // Parent node key
  keyPath?: string[]; // Full hierarchy of nodes
  rootNode?: boolean; // Is root node
  isLeaf?: boolean; // Is a child node

  // Allow developers to customize business attributes
  [key: string]: any;
};

interface AdBreadcrumbDirProps {
  className?: string;
  style?: CSSProperties;
  data?: BreadcrumbDataProps[]; // Tree node data
  onLoadData?: (selectedDir: BreadcrumbDataProps) => void; // Load node data asynchronously
  loading?: boolean;
  selectedFiles?: BreadcrumbDataProps;
  onFileSelected?: (selectedFile: BreadcrumbDataProps) => void;
  errors?: any;
}

export interface AdBreadcrumbDirRef {
  refreshCurrentDirData: () => void;
}

/**
 * 面包屑导航，回退 前进按钮  每次都是返回上一次选中的面包屑
 * @param props
 * @constructor
 */
const AdBreadcrumbDir = forwardRef<AdBreadcrumbDirRef, AdBreadcrumbDirProps>((props, ref) => {
  const { className, style, data = [], loading = false, selectedFiles, onLoadData, onFileSelected, errors } = props;
  const restSpanRef = useRef<HTMLDivElement | null>(null);
  const flatData = useRef<BreadcrumbDataProps[]>([]); // Store flattened data
  const [menuProps, setMenuProps, getMenuProps] = useLatestState({
    data: [] as BreadcrumbDataProps[],
    activeMenu: undefined as BreadcrumbDataProps | undefined
  });

  const [breadcrumbProps, setBreadcrumbProps, getBreadcrumbProps] = useLatestState({
    dataSource: [] as BreadcrumbDataProps[], // Breadcrumb data source
    activeData: undefined as BreadcrumbDataProps | undefined, // Selected breadcrumbs

    goBackRecord: [] as BreadcrumbDataProps[], // Rollback record：ActiveData during operation
    goAheadRecord: [] as BreadcrumbDataProps[] // Forward record：ActiveData during operation
  });

  useImperativeHandle(ref, () => ({
    refreshCurrentDirData
  }));

  /**
   * 将树数据扁平化处理 并给每一个节点添加本组件必要属性
   */
  useEffect(() => {
    const loop = (data: BreadcrumbDataProps[], parentKey = '', parentKeyPath: string[] = []) => {
      return data.reduce((result, item, index) => {
        item.keyPath = parentKeyPath.length > 0 ? [...parentKeyPath, item.key] : [item.key];
        if (parentKey) {
          item.parentKey = parentKey;
        } else {
          item.rootNode = true;
        }
        let arr = [...result, item];
        if (item.children && item.children.length > 0) {
          item.isLeaf = false;
          arr = [...arr, ...loop(item.children, item.key, item.keyPath)];
        } else {
          item.isLeaf = true;
        }
        return arr;
      }, [] as BreadcrumbDataProps[]);
    };

    flatData.current = mergeData(flatData.current, loop(data));
    const { activeData } = getBreadcrumbProps();
    let breadcrumbData: BreadcrumbDataProps[] = [];
    let newActiveData = activeData;
    let menuData: BreadcrumbDataProps[] = [];
    if (!activeData) {
      flatData.current.length > 0 && breadcrumbData.push(flatData.current[0]);
      newActiveData = breadcrumbData[0];
    } else {
      const data = getBreadcrumbDataSource(activeData);
      breadcrumbData = data.newBreadcrumbData;
      menuData = data.menuData;
    }
    onResize(breadcrumbData, newActiveData!, menuData);
  }, [data]);

  const mergeData = (oldData: BreadcrumbDataProps[], latestData: BreadcrumbDataProps[]) => {
    const latestDataKeys = latestData.map(item => item.key);
    const oldDataKeys = oldData.map(item => item.key);
    const remainKeys = _.difference(oldDataKeys, latestDataKeys);
    const targetData = oldData.filter(item => remainKeys.includes(item.key));
    return [...latestData, ...targetData];
  };

  /**
   * 通过给定面包屑数据身上的keyPath 去获取面包屑所有的父级
   * @param breadcrumbData
   */
  const getBreadcrumbDataSource = (breadcrumbData: BreadcrumbDataProps) => {
    const keyPath = breadcrumbData.keyPath ?? [];
    let newBreadcrumbData = flatData.current.filter(item => keyPath?.includes(item.key));
    let menuData = getMenuProps().data;
    // Is there breadcrumb data in dropdown menu
    if (menuData.length > 0) {
      const menuKeys = menuData.map(item => item.key);
      // Filter breadcrumbs not in dropdown menu
      const breadcrumbDataNoMenu = newBreadcrumbData.filter(item => !menuKeys.includes(item.key));
      if (breadcrumbDataNoMenu.length === 0) {
        newBreadcrumbData = menuData.filter(item => keyPath.includes(item.key));
        newBreadcrumbData.reverse();
        menuData = [];
      } else {
        newBreadcrumbData = breadcrumbDataNoMenu;
      }
    }
    return { newBreadcrumbData, menuData };
  };

  /**
   * 面包屑的点击事件
   */
  const onBreadcrumbItemClick = (selectedData: BreadcrumbDataProps) => {
    setBreadcrumbProps(prevState => ({
      ...prevState,
      activeData: selectedData,
      goBackRecord: [...prevState.goBackRecord, prevState.activeData!]
    }));
    onLoadData && onLoadData(selectedData);
  };

  /**
   * 回退按钮，回退的是goBackDir按钮点击之前的状态，, 并记录返回之前的面包屑目录到goAheadRecord中
   */
  const goBackBtn = () => {
    if (breadcrumbProps.goBackRecord.length === 0) {
      return;
    }
    const activeData = breadcrumbProps.goBackRecord.pop()!;
    setBreadcrumbProps(prevState => ({
      ...prevState,
      activeData,
      goBackRecord: breadcrumbProps.goBackRecord,
      goAheadRecord: [...prevState.goAheadRecord, prevState.activeData!]
    }));
    onLoadData && onLoadData(activeData);
  };

  /**
   * 前进按钮， 回退的是goBackBtn按钮点击之前的状态
   */
  const goAheadBtn = () => {
    if (breadcrumbProps.goAheadRecord.length === 0) {
      return;
    }
    const activeData = breadcrumbProps.goAheadRecord.pop()!;
    setBreadcrumbProps(prevState => ({
      ...prevState,
      activeData,
      goAheadRecord: breadcrumbProps.goAheadRecord,
      goBackRecord: [...prevState.goBackRecord, prevState.activeData!]
    }));
    onLoadData && onLoadData(activeData);
  };

  /**
   * 返回上一层目录, 并记录返回之前的面包屑目录到goBackDir中
   */
  const goBackDir = () => {
    if (breadcrumbProps.dataSource.length <= 1 && menuProps.data.length === 0) {
      return;
    }
    const newActiveData = flatData.current.find(item => item.key === breadcrumbProps.activeData?.parentKey);

    if (newActiveData) {
      setBreadcrumbProps(prevState => ({
        ...prevState,
        activeData: newActiveData,
        goBackRecord: [...prevState.goBackRecord, prevState.activeData!]
      }));
      onLoadData && onLoadData(newActiveData);
    }
  };

  const onResize = (
    breadcrumbDataSource: BreadcrumbDataProps[],
    newActiveData: BreadcrumbDataProps,
    menuData: BreadcrumbDataProps[]
  ) => {
    const width = restSpanRef.current?.getBoundingClientRect().width || 0;
    if (width < 100) {
      if (breadcrumbDataSource.length > 1) {
        const menu = breadcrumbDataSource.shift()!;
        setMenuProps(prevState => ({
          ...prevState,
          data: [menu, ...menuData]
        }));
        setBreadcrumbProps(prevState => ({
          ...prevState,
          dataSource: breadcrumbDataSource,
          activeData: newActiveData
        }));
        return;
      }
    }
    if (width > 140) {
      if (menuData.length > 0) {
        setMenuProps(prevState => ({
          ...prevState,
          data: []
        }));
        setBreadcrumbProps(prevState => ({
          ...prevState,
          dataSource: [...menuData.reverse(), ...breadcrumbDataSource],
          activeData: newActiveData
        }));
        return;
      }
    }
    setMenuProps(prevState => ({
      ...prevState,
      data: menuData
    }));
    setBreadcrumbProps(prevState => ({
      ...prevState,
      dataSource: breadcrumbDataSource,
      activeData: newActiveData
    }));
  };

  const fileSelected = (file: BreadcrumbDataProps) => {
    onFileSelected && onFileSelected(file);
  };

  /**
   * 刷新当前目录数据
   */
  const refreshCurrentDirData = () => {
    onLoadData && onLoadData(breadcrumbProps.activeData!);
  };

  const prefixCls = 'kw-breadcrumb';
  return (
    <>
      <LoadingMask loading={loading} />
      <div className={classNames(prefixCls, className)} style={style}>
        <div className={`${prefixCls}-header`}>
          <div className={`${prefixCls}-btn`}>
            {/* 回退按钮 */}
            <Tooltip title={intl.get('workflow.knowledgeMap.backBtn')} placement="top">
              <Format.Button type="icon" onClick={goBackBtn} disabled={breadcrumbProps.goBackRecord.length === 0}>
                <ArrowLeftOutlined />
              </Format.Button>
            </Tooltip>

            {/* 前进按钮 */}
            <Tooltip title={intl.get('workflow.knowledgeMap.goAhead')} placement="top">
              <Format.Button type="icon" onClick={goAheadBtn} disabled={breadcrumbProps.goAheadRecord.length === 0}>
                <ArrowRightOutlined />
              </Format.Button>
            </Tooltip>

            {/* 返回上一层目录 */}
            <Tooltip title={intl.get('workflow.knowledgeMap.lastDir')} placement="top">
              <Format.Button
                type="icon"
                onClick={goBackDir}
                disabled={breadcrumbProps.dataSource.length <= 1 && menuProps.data.length === 0}
              >
                <ArrowUpOutlined />
              </Format.Button>
            </Tooltip>

            {menuProps.data.length > 0 && (
              <Dropdown
                trigger={['click']}
                overlay={
                  <Menu>
                    {menuProps.data.map(item => (
                      <Menu.Item onClick={() => onBreadcrumbItemClick(item)} key={item.key}>
                        {item.label}
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <Format.Button type="icon">
                  <DoubleLeftOutlined />
                </Format.Button>
              </Dropdown>
            )}
          </div>

          <div className={`${prefixCls}-nav kw-ellipsis`}>
            <Breadcrumb style={{ whiteSpace: 'nowrap' }} separator=">">
              {breadcrumbProps.dataSource.map((item, index) => (
                <Breadcrumb.Item key={item.key}>
                  {index === breadcrumbProps.dataSource.length - 1 ? (
                    <span title={item.label}>
                      <IconFont type="icon-putongwenjianjia" />
                      <span className="kw-ml-1">{item.label}</span>
                    </span>
                  ) : (
                    <Format.Button type="text" onClick={() => onBreadcrumbItemClick(item)}>
                      <span>{item.label}</span>
                    </Format.Button>
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
            <span
              style={{
                flex: 1,
                width: 0
              }}
              ref={restSpanRef}
            >
              <AdResizeObserver
                onResize={({ width }) => {
                  if (width === 0) {
                    const { dataSource } = getBreadcrumbProps();
                    if (dataSource.length > 1) {
                      const menu = dataSource.shift()!;
                      const menuData = [menu, ...getMenuProps().data];
                      setMenuProps(prevState => {
                        return {
                          ...prevState,
                          data: menuData
                        };
                      });
                      setBreadcrumbProps(prevState => ({
                        ...prevState,
                        dataSource
                      }));
                    }
                  }
                }}
              >
                <div></div>
              </AdResizeObserver>
            </span>
          </div>
        </div>
        <div className={`${prefixCls}-content`}>
          {breadcrumbProps.activeData?.children && breadcrumbProps.activeData?.children.length > 0
            ? breadcrumbProps.activeData?.children?.map(item => {
                if (item.type === 'file') {
                  return (
                    <div
                      key={item.key}
                      className={classNames(
                        `${prefixCls}-content-item`,
                        {
                          [`${prefixCls}-content-item-selected`]: selectedFiles?.key === item.key
                        },
                        { [`${prefixCls}-content-item-disabled`]: errors?.current?.errors[item?.key] }
                      )}
                      onClick={() => {
                        if (selectedFiles?.key !== item.key) {
                          fileSelected(item);
                        }
                      }}
                    >
                      <FileIcon type="sheet" size={16} className="kw-mr-2" />
                      <span title={item.label} className="kw-ellipsis">
                        {item.label}
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={item.key}
                    className={classNames(`${prefixCls}-content-item`)}
                    onClick={() => onBreadcrumbItemClick(item)}
                  >
                    <IconFont type="icon-putongwenjianjia" />
                    <span className="kw-ml-1 kw-ellipsis" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                );
              })
            : !loading && <NoDataBox.NO_CONTENT />}
        </div>
      </div>
    </>
  );
});

export default memo(AdBreadcrumbDir);
