import React, { useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, Tooltip, Empty } from 'antd';
import classNames from 'classnames';
import { TOTAL_ICONS, GraphIcon, GraphIconName, getIconName } from '@/utils/antv6';
import { fuzzyMatch, isFF } from '@/utils/handleFunction';
import kongImg from '@/assets/images/kong.svg';
import './style.less';

const { Option } = Select;

export interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
}
type ValueOf<T> = T[keyof T];
type IconItem = ValueOf<typeof TOTAL_ICONS>;

/**
 * 转换成便于渲染虚拟列表的数组
 * @param arr 原数据, 一维数组
 */
const createVirtualListData = (arr: any[]) => _.chunk(arr, 6).map((data, index) => ({ key: `row_${index}`, data }));
const getTotalIcons = () => _.values(TOTAL_ICONS);

const IconSelect = (props: IconSelectProps) => {
  const { value, onChange } = props;
  const clearFlag = useRef(false); // 触发清除的标记, 用于阻止下拉关闭
  const selectorRef = useRef<any>(); // 下拉框ref
  const scrollTop = useRef(0); // 下拉列表滚动高度, 用于修复 firefox bug
  const [iconList, setIconList] = useState<any[]>(() => createVirtualListData(getTotalIcons())); // 显示的图标数据
  const [isOpen, setIsOpen] = useState(false);

  // 添加label用于显示icon
  const valueObj = useMemo(() => {
    if (!value) return undefined;
    const matchIcon = TOTAL_ICONS[value];
    if (!matchIcon) return undefined;
    return {
      value,
      label: (
        <>
          <GraphIcon type={value} className="s-icon" />
          &nbsp;&nbsp;
          <GraphIconName type={value} />
        </>
      )
    };
  }, [value]);

  /**
   * 点击选择图标
   */
  const onHandleClick = (e: React.MouseEvent, item: IconItem) => {
    onChange(item.font_class);
    setIsOpen(false);
  };

  /*
   * 搜索
   */
  const onSearch = (value: string) => {
    if (!value) return setIconList(createVirtualListData(getTotalIcons()));
    _.debounce(value => {
      const matchData = getTotalIcons().filter(item => fuzzyMatch(value, getIconName(item.font_class) || ''));
      setIconList(createVirtualListData(matchData));
    }, 300)(value);
  };

  /**
   * 清除
   */
  const onClear = () => {
    clearFlag.current = true;
    onChange('');
    setIconList(createVirtualListData(getTotalIcons()));
  };

  /**
   * 打开下拉
   * @param visible
   */
  const onDropdownVisibleChange = (visible: boolean) => {
    // 清除时不关闭
    if (!visible && clearFlag.current) {
      clearFlag.current = false;
      return;
    }
    setIsOpen(visible);

    /**
     * [bug 336667] fireFox浏览器中, 下拉列表滚动后, 再次打开时列表空白
     * 疑似fireFox中position与transform存在冲突, 导致transform的相对参照节点变成下拉框, 虚拟列表渲染内容的节点位置被错误的平移到底部
     * 解决方法是触发滚动, 让组件重新计算渲染新的文档流节点
     */
    if (visible && isFF) {
      setTimeout(() => {
        selectorRef.current?.scrollTo(scrollTop.current);
      }, 0);
    }
  };

  return (
    <Select
      ref={selectorRef}
      className="flow-icon-select-root kw-w-100"
      placeholder={intl.get('createEntity.selectInput')}
      getPopupContainer={triggerNode => triggerNode.parentElement!}
      labelInValue
      showSearch
      allowClear
      listItemHeight={60}
      filterOption={false}
      // open
      open={isOpen}
      value={valueObj}
      onDropdownVisibleChange={onDropdownVisibleChange}
      onSearch={onSearch}
      onClear={onClear}
      onPopupScroll={(e: any) => {
        scrollTop.current = e.target?.scrollTop;
      }}
      notFoundContent={
        <div className="kw-center kw-h-100 kw-pb-8">
          <Empty image={kongImg} description={intl.get('global.noContent')} />
        </div>
      }
    >
      {_.map(iconList, row => (
        <Option key={row.key}>
          <div className="icon-row kw-flex" onClick={e => e.stopPropagation()}>
            {row.data.map((item: IconItem) => (
              <div
                key={item.font_class}
                className="icon-item"
                title={getIconName(item.font_class) || ''}
                onClick={e => onHandleClick(e, item)}
              >
                <GraphIcon
                  className={classNames('icon-svg', { checked: value === item.font_class })}
                  type={item.font_class}
                />
              </div>
            ))}
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default IconSelect;
