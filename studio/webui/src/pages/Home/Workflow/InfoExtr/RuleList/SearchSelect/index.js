/* eslint-disable */
import React, { useState, useEffect } from 'react';
import './style.less';

/**
 * @description 可模糊搜索的单选select
 * @param {Array} selectData 可选择的数据
 * @param {string} searchText 搜索值
 * @param {string} pid 相对定位的父节点id
 * @param {string} inputId 输入框的id
 * @param {function} onChange 选中select条目时的回调函数
 */
const SearchSelect = props => {
  const { selectData, searchText, pid, inputId, onChange, visible } = props;
  const [rect, setRect] = useState({}); // 把自身当作矩形对象, 包含坐标x, y, width
  const [countFinish, setCountFinish] = useState(false); // 计算坐标完毕, 防止抖动
  const [showData, setShowData] = useState([]); // 模糊搜索时展示的数据
  const [isOpenUp, setIsOpenUp] = useState(false); // 是否向上展开

  // 初始化显示所有数据
  useEffect(() => {
    setShowData(selectData);
    return setShowData([]); // 卸载组件时清空
  }, [selectData]);

  // 初始化时计算坐标
  useEffect(() => {
    let count = showData.length > 4 ? 4 : showData.length;
    if (count > 0) {
      initPosition(pid, inputId, count);
      // 窗口改变时重新计算
      if (window.attachEvent) {
        // IE
        window.attachEvent('onresize', () => initPosition(pid, inputId, count));
        return window.detachEvent('onresize', () => initPosition(pid, inputId, count));
      } else {
        window.addEventListener('resize', () => initPosition(pid, inputId, count));
        return window.removeEventListener('resize', () => initPosition(pid, inputId, count));
      }
    }
  }, [pid, inputId, showData]);

  // input值变化时触发模糊搜索
  useEffect(() => {
    if (searchText && searchText === '') {
      setShowData(selectData);
    } else {
      try {
        let reg = new RegExp(searchText);
        let filterData = selectData.filter(data => reg.test(data));
        setShowData(filterData);
      } catch (err) {
        setShowData([]);
      }
    }
  }, [searchText, selectData]);

  /**
   * @description 初始化时计算坐标
   * @param {string} pid 选择器的父节点id
   * @param {string} id 绑定的input标签的id
   */
  const initPosition = (pid, id, count) => {
    let parentNode = document.getElementById(pid);
    let inputNode = document.getElementById(id);
    if (parentNode && inputNode) {
      let parentRect = parentNode.getBoundingClientRect();
      let inputRect = inputNode.getBoundingClientRect();

      let width = inputRect.width;
      let x = inputRect.left - parentRect.left;
      let y;

      let selectorHeight = 32 * count + 2 * (count + 1); // 每一项高度 + padding
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
                        className="field-select-li"
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
