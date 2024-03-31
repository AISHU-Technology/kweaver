import _ from 'lodash';
import { Input } from 'antd';
import intl from 'react-intl-universal';
import React, { useState, useEffect, useRef } from 'react';
import HOOKS from '@/hooks';
import DragLine from '@/components/DragLine';
import { DownOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
import servicesEventStats, { getDictListDataType } from '@/services/eventStats';

import DictManagerLeftComp from './leftComponent';
import DictManagerRightComp from './rightComponent';
import DictEmptyPage from './EmptyPage';

import './style.less';

// 可拖拽的最小、最大值
enum LIMIT_WIDTH {
  MIN_DRAG_WIDTH = 364,
  MAX_DRAG_WIDTH = 824
}

const DictManagement = () => {
  // 当前的语言
  const language = HOOKS.useLanguage();

  const [leftTableData, setLeftTableData] = useState<Record<string, any>[]>([]);

  const [leftSearchValue, setLeftSearchValue] = useState<string>('');

  // 左侧div的宽度
  const [leftContentWidth, setLeftContentWidth] = useState(LIMIT_WIDTH.MIN_DRAG_WIDTH);

  // left要传递到right的值（层级简单，不用redux了）
  const [leftToRightInfo, setLeftToRightInfo] = useState<Record<string, any> | undefined>();

  // right要传递到left的值（层级简单，不用redux了）
  const [rightToLeftInfo, setRightToLeftInfo] = useState<Record<string, any>>();

  useEffect(() => {
    fetchDictListData();
  }, []);

  const fetchDictListData = async (searchName?: string) => {
    setLeftSearchValue(searchName || '');
    const fetchDataParam: getDictListDataType = {
      key: searchName,
      page: 1,
      size: -1
    };
    const result = (await servicesEventStats.getDictList(fetchDataParam)) || {};
    if (result.res) {
      setLeftToRightInfo(undefined); // 清空数据不然会残留
      setLeftTableData(result.res.data);
    }
  };

  const onChangeDragLine = (x: number, y: number) => {
    const currentWidth = x + leftContentWidth;
    const newWidth =
      currentWidth > LIMIT_WIDTH.MAX_DRAG_WIDTH
        ? LIMIT_WIDTH.MAX_DRAG_WIDTH
        : currentWidth < LIMIT_WIDTH.MIN_DRAG_WIDTH
        ? LIMIT_WIDTH.MIN_DRAG_WIDTH
        : currentWidth;
    setLeftContentWidth(newWidth);
  };

  return (
    <div className="admin-dictManagement-root">
      {!leftTableData.length && leftSearchValue === '' ? (
        <DictEmptyPage fetchDictListData={fetchDictListData} />
      ) : (
        <div className="admin-dictManagement-content">
          <div
            className="admin-dictManagement-left-content"
            style={{
              width: leftContentWidth,
              minWidth: LIMIT_WIDTH.MIN_DRAG_WIDTH,
              maxWidth: LIMIT_WIDTH.MAX_DRAG_WIDTH,
              borderRightWidth: 1,
              borderRightStyle: 'solid',
              borderRightColor: '#e0e0e0'
            }}
          >
            <DictManagerLeftComp
              leftTableData={leftTableData}
              rightToLeftInfo={rightToLeftInfo}
              fetchDictListData={fetchDictListData}
              setLeftToRightInfo={setLeftToRightInfo}
            />
          </div>
          <DragLine className="admin-dictManagement-drag-line" onChange={(x, y) => onChangeDragLine(x, y)} />
          <div className="admin-dictManagement-right-content" style={{ flex: 1, overflow: 'auto' }}>
            <DictManagerRightComp
              key={leftToRightInfo?.id}
              leftInfo={leftToRightInfo}
              setRightToLeftInfo={setRightToLeftInfo}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DictManagement;
