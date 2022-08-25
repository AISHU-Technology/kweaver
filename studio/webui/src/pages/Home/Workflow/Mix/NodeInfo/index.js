/* eslint-disable */
/**
 * 点信息
 */

import React from 'react';
import intl from 'react-intl-universal';

import ScrollBar from '@/components/ScrollBar';

import './style.less';

const NodeInfo = props => {
  const { entity, showIndex, setShowIndex, isError, setIsError, setErrMsg, setErrIndex } = props;

  const ENPTYERR = intl.get('workflow.conflation.enptyErr'); // 定义错误信息“空”

  /**
   * @description 点击 点类列表
   * @param {number} index 点击的 点 的索引
   */
  const onEntityClick = index => {
    if (isError) return;
    if (!entity[showIndex]) return setShowIndex(index);

    const { properties } = entity[showIndex];
    if (properties.length > 0 && !properties[properties.length - 1].property) {
      setIsError(true);
      setErrIndex(properties.length - 1);
      setErrMsg(ENPTYERR);
      setTimeout(() => {
        scrollToBottom();
      }, 0);
      return;
    }

    setShowIndex(index);
  };

  /**
   * @description 有错误时属性列表滚动条滚动到底部
   */
  const scrollToBottom = () => {
    let attrBox = document.querySelector('.mix-attr-scroll div:first-of-type');
    if (attrBox) attrBox.scrollTop = attrBox.scrollHeight;
  };

  return (
    <div className="node-info-box">
      <h1 className="info-title">{intl.get('workflow.conflation.vertexsTitle')}</h1>
      <div className="node-list-box">
        <ScrollBar isshowx="false" color="rgb(184,184,184)">
          <ul>
            {entity && entity.length > 0
              ? entity.map((item, index) => {
                  return (
                    <li
                      className={`vertex-item ${index === showIndex ? 'vertex-item-active' : ''}`}
                      key={item.alias}
                      title={item.alias}
                      onClick={() => onEntityClick(index)}
                    >
                      <div className="vertex-icon" style={{ background: item.colour }} />
                      <p className="vertex-name">{item.alias}</p>
                    </li>
                  );
                })
              : null}
          </ul>
        </ScrollBar>
      </div>
    </div>
  );
};

export default NodeInfo;
