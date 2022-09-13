/**
 * 格式化展示json数据
 */

import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import { isType } from '@/utils/handleFunction';
import './style.less';

const { isString, isNumber, isBigint, isBoolean, isArray, isObject } = isType;

export interface JsonViewProps {
  data: any;
  [key: string]: any;
}
const JsonView: React.FC<JsonViewProps> = ({ data }) => {
  const jsonContainerRef = useRef<any>(); // 左侧行计数
  const [rowCount, setRowCount] = useState(0); // 行数

  // 行数变化
  const rowResize = () => {
    setRowCount(Math.ceil(jsonContainerRef.current.clientHeight / 22) || 0);
  };

  useEffect(() => {
    window.addEventListener('resize', rowResize);

    return () => window.removeEventListener('resize', rowResize);
  }, []);

  useEffect(() => {
    rowResize();
  }, [data]);

  // 渲染json
  const renderJson = (text: any) => {
    if (isString(text)) {
      return <span className="json-string">{`"${text}"`}</span>;
    }

    if (isNumber(text) || isBigint(text)) {
      return <span className="json-number">{text}</span>;
    }

    if (isBoolean(text)) {
      return <span className="json-boolean">{String(text)}</span>;
    }

    if (isArray(text)) {
      if (text.length) {
        return (
          <>
            {'['}
            <ul className="json-array">
              {text.map((item: any, index: number) => (
                <li key={index} className="json-array-item">
                  {renderJson(item)}
                  {index < text.length - 1 && ','}
                </li>
              ))}
            </ul>
            {']'}
          </>
        );
      }

      return '[]';
    }

    if (isObject(text)) {
      const obj2arr = Object.entries(text);

      if (obj2arr.length) {
        return (
          <>
            {'{'}
            <ul className="json-object">
              {obj2arr.map(([key, value]: any[], index: number) => (
                <li className="json-object-item" key={key}>
                  <span className="json-object-key">{`"${key}"`}</span>
                  &nbsp;{':'}&nbsp;&nbsp;
                  {renderJson(value)}
                  {index < obj2arr.length - 1 && ','}
                </li>
              ))}
            </ul>
            {'}'}
          </>
        );
      }

      return '{}';
    }

    return null;
  };

  // 缓存jsx, 避免重复递归渲染
  const JSON_ELEMENT = useMemo(() => renderJson(data), [data]);

  return (
    <div className="ad-json-view">
      <div className="row-count">
        {new Array(rowCount).fill(0).map((_, index: number) => {
          return (
            <div className="row-item" key={index}>
              {index + 1}
            </div>
          );
        })}
      </div>
      <div className="flex-right">
        <div className="json-container" ref={jsonContainerRef}>
          {JSON_ELEMENT}
        </div>
      </div>
    </div>
  );
};

export default memo(JsonView);
