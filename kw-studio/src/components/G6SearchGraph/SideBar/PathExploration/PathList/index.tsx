import React, { useState, useEffect, memo } from 'react';
import _ from 'lodash';
import { Dropdown, Menu, Empty, Pagination } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import ScrollBar from '@/components/ScrollBar';
import { numToThousand } from '@/utils/handleFunction';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import kong from '@/assets/images/kong.svg';

import './style.less';

interface PathListBoxProps {
  nodes: any;
  pathList: any;
  loading: boolean;
  pathType: number;
  setSelectedPath: (path: any) => void;
  setPathList: (nodes: any) => void;
  setIsFirst: (first: boolean) => void;
}
const TYPE_MENU = [
  { id: 'desc', intlText: 'shortToLong' },
  { id: 'asc', intlText: 'longToShort' }
];
const SIZE = 20;
const PathListBox: React.FC<PathListBoxProps> = props => {
  const { pathList, loading, pathType, setIsFirst } = props;
  const [showList, setshowList] = useState<any[]>([]);
  const [lengthType, setLengthType] = useState<string>('desc'); // 显示的路径的排序
  const [page, setpage] = useState(1); // 当前页码
  const [selectedIndex, setselectedIndex] = useState<number>(-1); // 选中的路径下标
  const [isOpen, setIsOpen] = useState([{ over: false, show: true }]);
  const [saveNode, setSaveNode] = useState<any>(0); // 保存点

  useEffect(() => {
    if (!loading) {
      setLengthType('desc');
      setIsFirst(false);
      setSaveNode(props.nodes);
    }
  }, [loading]);

  useEffect(() => {
    setselectedIndex(-1);
    if (!loading) {
      changePage(1);
    }
  }, [pathList, loading]);

  // 换页
  const changePage = (page: number) => {
    const cur = pathList.data;

    setpage(page);
    if (SIZE * page > cur?.length) {
      const start = (page - 1) * SIZE;
      const list = cur?.slice(start);
      initStatus(list);
      setshowList(list);
    } else {
      const start = (page - 1) * SIZE;
      const list = cur?.slice(start, start + SIZE);
      initStatus(list);
      setshowList(list);
    }
  };

  // 判断路径是否收起
  const initStatus = (paths: any) => {
    const status = _.map(paths, (path: any) => {
      let length = 0;
      let col = 0;
      _.forEach(path?.vertices, (item: any, index: number) => {
        const name = getName(item) || '';

        let nameLength = name.length * 14 > 96 ? 96 : name.length * 14;
        if (index !== path.length - 1) {
          nameLength += 24;
        }
        if (length + nameLength <= 361) {
          length += nameLength;
        } else {
          length = nameLength;
          col += 1;
        }
      });

      return { over: col >= 2, show: !(col >= 2) };
    });

    setIsOpen(status);
  };

  /**
   * p排序
   */
  const selectTypeMenu = (e: any) => {
    setLengthType(e.key);
    const cur = pathList?.data;
    // 排序
    const fun = (type: string) => {
      return function (a: any, b: any) {
        if (type === 'desc') {
          return a?.vertices?.length - b?.vertices?.length;
        }
        return b?.vertices?.length - a?.vertices?.length;
      };
    };
    cur.sort(fun(e.key));
    props.setPathList({ data: cur, count: pathList?.count });
    changePage(1);
  };

  /**
   * 根据id获取实体名字
   */
  const getName = (id: string) => {
    const curNodes = saveNode || props.nodes;
    let name: any = '';
    const len = curNodes.length;
    for (let i = 0; i < len; i++) {
      if (id === curNodes[i].id) {
        name = curNodes?.[i]?.data?.default_property?.value || curNodes?.[i]?.data?.alias;
        break;
      }
    }
    return name;
  };

  // 展开
  const clickOpen = (index: number) => {
    const current = _.cloneDeep(isOpen);
    current[index].show = !current[index].show;
    setIsOpen(current);
  };

  // 路径长度排序
  const menuType = (
    <Menu className="menu-select" onClick={selectTypeMenu}>
      {_.map(TYPE_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = lengthType === id ? 'menu-selected' : '';
        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="select">{intl.get(`searchGraph.${intlText}`)}</div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div>
      <div className="replore-result">
        <div className={loading ? 'path-loading' : 'path-loading-hidden'}>
          <LoadingOutlined className="icon" />
          <p className="loading-tip">{intl.get('searchGraph.loadingTip')}</p>
        </div>
        <div className="result-title">
          <div className="title-weight">
            {intl.get('searchGraph.pathList')}(<span className="path-number">{numToThousand(pathList.count)}</span>)
          </div>
          <div>
            <Dropdown
              overlay={menuType}
              trigger={['click']}
              placement="bottomRight"
              getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
              disabled={!pathList?.data?.length || pathType === 1}
            >
              <IconFont
                type="icon-paixu11"
                className={pathList?.data?.length && pathType === 0 ? 'sort-icon' : 'sort-icon disabled'}
              />
            </Dropdown>
          </div>
        </div>
        <div className="path-list-content">
          {showList?.length ? (
            <div>
              <ScrollBar autoHeight autoHeightMax={500} color="rgb(184,184,184)" isshowx="false">
                {_.map(showList, (list, index) => {
                  const { vertices } = list;
                  return (
                    <div
                      key={index}
                      className={index === selectedIndex ? 'path-item selected-item' : 'path-item'}
                      onClick={() => {
                        setselectedIndex(index);
                        props.setSelectedPath(list);
                      }}
                    >
                      <div className="path-tag-box">
                        <span className="item-tag">
                          {intl.get('searchGraph.path')}
                          {(page - 1) * SIZE + index + 1}
                        </span>
                      </div>
                      <div className={isOpen[index]?.show ? 'path-item-box' : 'path-item-box listhidden'}>
                        {_.map(vertices, (item: string, itemIndex: number) => {
                          return (
                            <div key={itemIndex} className="path-item-node">
                              <span className="node" title={getName(item)}>
                                {getName(item)}
                              </span>
                              {itemIndex !== vertices.length - 1 && <span className="icon">{'>'}</span>}
                              {itemIndex === vertices.length - 1 && isOpen[index]?.over && (
                                <span className="close-path kw-ml-2" onClick={() => clickOpen(index)}>
                                  {isOpen[index]?.show ? `${intl.get('global.unExpand')}` : ''}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {isOpen[index]?.over && (
                          <span className="open" onClick={() => clickOpen(index)}>
                            {!isOpen[index]?.show ? `${intl.get('global.expand')}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ScrollBar>
              <Pagination
                className="pathList-pagination"
                current={page}
                pageSize={SIZE}
                total={pathList?.count}
                hideOnSinglePage={true}
                onChange={changePage}
                pageSizeOptions={[]}
                showSizeChanger={false}
                size={pathList?.count > 200 ? 'small' : 'default'}
              />
            </div>
          ) : (
            <div className="empty-box">
              <Empty style={{ marginTop: 100 }} description={`${intl.get('searchGraph.noPath')}`} image={kong} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default memo(PathListBox);
