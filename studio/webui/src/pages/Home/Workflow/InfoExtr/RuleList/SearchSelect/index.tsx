import React, { useState, useEffect } from 'react';
import './style.less';

/**
 * visible 可见性
 * selectData 可选择的数据
 * searchText 搜索值
 * pid 相对定位的父节点id
 * inputId 输入框的id
 * onChange 选中select条目时的回调函数
 */
interface SearchSelectProps {
  visible?: boolean;
  selectData: any[];
  searchText: string;
  pid: string;
  inputId: string;
  onChange: (value: string) => void;
}
const SearchSelect: React.FC<SearchSelectProps> = props => {
  const { selectData, searchText, pid, inputId, onChange, visible } = props;
  const [rect, setRect] = useState<{ width?: number; x?: number; y?: number }>({}); // 把自身当作矩形对象, 包含坐标x, y, width
  const [countFinish, setCountFinish] = useState(false); // 计算坐标完毕, 防止抖动
  const [showData, setShowData] = useState<any[]>([]); // 模糊搜索时展示的数据
  const [isOpenUp, setIsOpenUp] = useState(false); // 是否向上展开

  // 初始化显示所有数据
  useEffect(() => {
    setShowData(selectData);
    return () => setShowData([]);
  }, [selectData]);

  // 初始化时计算坐标
  useEffect(() => {
    const count = showData.length > 4 ? 4 : showData.length;

    if (!count) return;
    initPosition(pid, inputId, count);
    window.addEventListener('resize', () => initPosition(pid, inputId, count));
    return window.removeEventListener('resize', () => initPosition(pid, inputId, count));
  }, [pid, inputId, showData]);

  // input值变化时触发模糊搜索
  useEffect(() => {
    if (searchText && searchText === '') {
      setShowData(selectData);
    } else {
      try {
        const reg = new RegExp(searchText);
        const filterData = selectData.filter(data => reg.test(data));
        setShowData(filterData);
      } catch (err) {
        setShowData([]);
      }
    }
  }, [searchText, selectData]);

  /**
   * 初始化时计算坐标
   * @param pid 选择器的父节点id
   * @param id 绑定的input标签的id
   * @param count 选项个数
   */
  const initPosition = (pid: string, id: string, count: number) => {
    const parentNode = document.getElementById(pid);
    const inputNode = document.getElementById(id);
    if (parentNode && inputNode) {
      const parentRect = parentNode.getBoundingClientRect();
      const inputRect = inputNode.getBoundingClientRect();
      const width = inputRect.width;
      const x = inputRect.left - parentRect.left;
      let y;
      const selectorHeight = 32 * count + 2 * (count + 1); // 每一项高度 + padding

      if (inputRect.top - parentRect.top + selectorHeight + inputRect.height + 20 > parentRect.height) {
        y = inputRect.top - parentRect.top - selectorHeight; // 向上展开
        setIsOpenUp(true);
      } else {
        y = inputRect.top - parentRect.top + inputRect.height; // 向下展开
        setIsOpenUp(false);
      }

      setRect({ x, y, width });
      setCountFinish(true);
    }
  };

  return (
    <div>
      {visible && countFinish && searchText !== '' ? (
        <div
          className={`field-select ${isOpenUp ? 'field-select-up' : 'field-select-down'}`}
          style={{ width: rect.width, left: rect.x, top: rect.y }}
        >
          <ul>
            {showData && showData instanceof Array
              ? showData.length === 0
                ? null
                : showData.map(i => {
                    return (
                      <li
                        className="field-select-li ad-ellipsis"
                        key={i}
                        title={i}
                        onClick={() => onChange(i)}
                        onMouseDown={e => e.preventDefault()}
                      >
                        {i}
                      </li>
                    );
                  })
              : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default SearchSelect;
