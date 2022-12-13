import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';

import './index.less';

export default function Associated(props) {
  const { nodes, selectedElement, setSelectedElement, showButton, changeTab } = props;
  const [associatedNode, setAssociatedNode] = useState();

  useEffect(() => {
    if (selectedElement) {
      init();
    }
  }, [selectedElement]);

  /**
   * @description 获取数据
   */
  const init = () => {
    let newNodes = [];

    nodes.forEach((item, index) => {
      if (selectedElement.relations[0] === item.name) {
        newNodes = [...newNodes, item];
      }
    });

    nodes.forEach((item, index) => {
      if (selectedElement.relations[2] === item.name) {
        newNodes = [...newNodes, item];
      }
    });
    setAssociatedNode(newNodes);
  };

  /**
   * @description 选择实体
   */
  const goBackEntity = entity => {
    showButton(true);
    setSelectedElement(entity);
    changeTab('entity');
  };

  return (
    <div>
      {associatedNode && (
        <>
          <div className="associated">
            <div className="associated-start">
              <div className="node-title">{intl.get('workflow.knowledge.beginEntity')}</div>
              <div
                className="word"
                title={`${associatedNode[0].alias}`}
                onClick={() => {
                  goBackEntity(associatedNode[0]);
                }}
              >
                <div className="icon" style={{ background: associatedNode[0].colour }}></div>
                <span className="word-name">{associatedNode[0].alias}</span>
              </div>
            </div>

            <span className="line"></span>

            <div className="associated-edges">
              <span className="edges-word">{intl.get('workflow.knowledge.relation')}</span>
              <span className="edges-icon" style={{ background: associatedNode[0].colour }}></span>
              <span className="edges-name">{selectedElement.alias}</span>
            </div>

            <span className="line"></span>
            <div className="associated-end">
              <div className="node-title">{intl.get('workflow.knowledge.endEntity')}</div>

              <div
                className="word"
                title={`${associatedNode[1].alias}`}
                onClick={() => {
                  goBackEntity(associatedNode[1]);
                }}
              >
                <div className="icon" style={{ background: associatedNode[1].colour }}></div>
                <span className="word-name">{associatedNode[1].alias}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
