import React, { useState, useEffect } from 'react';
import DragLine from '@/components/DragLine';
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
  const [leftTableData, setLeftTableData] = useState<Record<string, any>[]>([]);

  const [leftSearchValue, setLeftSearchValue] = useState<string>('');

  // 左侧div的宽度
  const [leftContentWidth, setLeftContentWidth] = useState(LIMIT_WIDTH.MIN_DRAG_WIDTH);

  // left要传递到right的值
  const [leftToRightInfo, setLeftToRightInfo] = useState<Record<string, any> | undefined>();

  // right要传递到left的值
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
      setLeftToRightInfo(undefined);
      setLeftTableData(result.res.data);
    }
  };

  const onChangeDragLine = (x: number) => {
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
          <DragLine className="admin-dictManagement-drag-line" onChange={x => onChangeDragLine(x)} />
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
