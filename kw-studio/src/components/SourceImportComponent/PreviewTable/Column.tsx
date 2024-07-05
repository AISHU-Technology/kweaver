import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, Checkbox } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import HOOKS from '@/hooks';
import { PreviewColumn } from '../types';
import './style.less';
import IconFont from '@/components/IconFont';

export interface ColumnProps {
  data: PreviewColumn;
  shouldCheck?: boolean;
  checked?: boolean;
  isLast?: boolean;
  showLess?: boolean;
  averageWidth?: number;
  onCheck?: (isCheck: boolean, key: string) => void;
  selectFile?: any;
  partitionMes?: any;
}

const WIDTH1 = 160;
const WIDTH2 = 280;
const MIN_WIDTH = 100;

const Column = (props: ColumnProps) => {
  const { data, shouldCheck, checked, isLast, selectFile, partitionMes, showLess, averageWidth, onCheck } = props;

  const startX = useRef(0);
  const [width, setWidth] = useState(() => (showLess ? WIDTH1 : WIDTH2));
  const [tableName, setTableName] = useState<any>([]);
  const forceUpdate = HOOKS.useForceUpdate();
  const setWidthThrottle = _.throttle(w => setWidth(w), 100);
  const [isShow, setIsShow] = useState(false);
  const [isUsePartition, setIsUsePartition] = useState(true);

  useEffect(() => {
    if (_.isEmpty(partitionMes)) return;

    const tableNameArr: any = [];
    const partitionNames = _.map(partitionMes, (item: any) => item?.table_name);
    if (!partitionNames.includes(selectFile?.file_name)) {
      setIsUsePartition(false);
      return;
    }
    setIsUsePartition(true);
    _.map(partitionMes, (pre: any) => {
      if (pre?.table_name === selectFile?.file_name) {
        if (!_.isEmpty(pre?.value)) {
          tableNameArr?.push(Object?.keys(pre?.value));
        }
        setIsShow(pre?.isOpen);
      }
    });
    setTableName(tableNameArr[0]);
  }, [selectFile, partitionMes]);

  useEffect(() => {
    averageWidth && setWidth(averageWidth);
  }, [averageWidth]);

  const handleCheck = () => {
    if (!shouldCheck || !onCheck) return;
    onCheck(!checked, data.key);
  };

  const onDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    document.addEventListener('mousemove', onDragging);
    document.addEventListener('mouseup', onDragEnd);
    startX.current = e.pageX;
  };

  const onDragging = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const offsetX = e.pageX - startX.current;
    const x = width + offsetX;
    setWidthThrottle(x < MIN_WIDTH ? MIN_WIDTH : x);
  };

  const onDragEnd = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    document.removeEventListener('mousemove', onDragging);
    document.removeEventListener('mouseup', onDragEnd);
    startX.current = 0;
    forceUpdate();
  };

  return (
    <div
      className={classNames('column-item', { disabled: shouldCheck && !checked, dragging: startX.current })}
      style={{ width }}
    >
      <div className="p-th kw-align-center" onClick={handleCheck}>
        <span className="th-key kw-ellipsis" title={data?.name}>
          {data?.name}
          {(_.isEmpty(partitionMes) || !isUsePartition
            ? selectFile?.partition_usage && Object.keys(selectFile.partition_infos).includes(data?.name)
            : tableName?.includes(data?.name) && isShow) && (
            <IconFont type="icon-fenqupeizhi" className="kw-ml-2" title={intl.get('workflow.information.already')} />
          )}
        </span>

        {shouldCheck && (
          <Tooltip
            placement="bottom"
            title={checked ? intl.get('workflow.information.clickCancel') : intl.get('workflow.information.clickCheck')}
          >
            <Checkbox checked={checked} />
          </Tooltip>
        )}

        {!isLast && <div className="drag-line" onMouseDown={onDragStart} onClick={e => e.stopPropagation()} />}
      </div>

      {_.map(data.columns, (item, i) => (
        <div key={i} className="p-tr kw-c-text kw-ellipsis" title={item}>
          {item}&nbsp;
        </div>
      ))}
    </div>
  );
};

export default Column;
