import React, { memo, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import Column from './Column';
import { PreviewColumn } from '../types';
import { ONLY_KEYBOARD } from '@/enums';
import './style.less';

export interface PreviewTableProps {
  className?: string; // 类名
  data: PreviewColumn[]; // 表格数据
  shouldCheck?: boolean; // 是否可勾选
  checkedKeys?: string[]; // 勾选的表头key
  showLess?: boolean; // 较窄的列宽
  onCheck?: (keys: string[]) => void;
  selectFile?: any;
  partitionMes?: any;
}

const WIDTH1 = 160; // 默认宽度, 窄
const WIDTH2 = 280; // 默认宽度

const PreviewTable = (props: PreviewTableProps) => {
  const { className, data, shouldCheck, checkedKeys, showLess, onCheck, partitionMes, selectFile } = props;
  const containerRef = useRef<HTMLElement>();
  const [averageWidth, setAverageWidth] = useState(0);

  useEffect(() => {
    if (!data.length || !containerRef.current) return;
    const cWidth = containerRef.current.clientWidth;
    const defaultWidth = showLess ? WIDTH1 : WIDTH2;
    if (cWidth < data.length * defaultWidth) return setAverageWidth(defaultWidth);
    setAverageWidth(cWidth / data.length);
  }, [data]);

  const handleCheck = (isCheck: boolean, key: string) => {
    if (!Array.isArray(checkedKeys)) return;
    const newKeys = isCheck ? [...checkedKeys, key] : checkedKeys.filter(k => k !== key);
    onCheck?.(newKeys);
  };

  return (
    <div ref={containerRef as any} className={classNames('extract-preview-table-root kw-flex', className)}>
      {_.map(data, (item, index) => (
        <>
          <Column
            key={item.key + index}
            data={item}
            showLess={showLess}
            isLast={index === data.length - 1}
            shouldCheck={shouldCheck}
            averageWidth={averageWidth}
            checked={_.includes(checkedKeys, item.key)}
            onCheck={handleCheck}
            selectFile={selectFile}
            partitionMes={partitionMes}
          />
        </>
      ))}
    </div>
  );
};

export * from './assistant';
export default memo(PreviewTable);
