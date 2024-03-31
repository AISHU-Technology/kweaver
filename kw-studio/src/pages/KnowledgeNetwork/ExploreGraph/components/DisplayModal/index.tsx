import React, { useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Tabs } from 'antd';
import Draggable from 'react-draggable';

import Styles from './Styles';
import Scope from './Scope';

import './style.less';

const CONFIG = {
  style: { visible: true, disabled: false },
  type: { visible: true, disabled: false },
  color: { visible: true, disabled: false },
  size: { visible: true, disabled: false },
  label: { visible: true, disabled: false },
  labelLength: { visible: true, disabled: false },
  labelPosition: { visible: true, disabled: false },
  icon: { visible: true, disabled: false },
  rule: { visible: true, disabled: false },
  scope: { visible: true, disabled: false }
};
export const defaultConfig = _.cloneDeep(CONFIG);
export const getDefaultConfig = (coverData: any) => {
  const config: any = _.cloneDeep(CONFIG);
  if (_.isEmpty(coverData)) return config;
  _.forEach(Object.keys(coverData), key => {
    if (config[key]) config[key] = { ...config[key], ...coverData[key] };
  });
  return config;
};

type DisplayModalType = {
  config: any;
  modalType: string;
  graphStyle: any;
  updateData: any;
  layoutType: string;
  onCancel: () => void;
  onChangeData: (data: any) => void;
  onUpdateStyle: (data: any) => void;
  batchClass?: string[];
};
const DisplayModal = (props: DisplayModalType) => {
  const { config = CONFIG, modalType, batchClass, graphStyle, updateData, layoutType } = props;
  const { onCancel, onChangeData, onUpdateStyle } = props;

  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: any, uiData: any) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y)
    });
  };

  const hasScope = config.scope.visible;
  const modalMoveBarOffset = hasScope ? 120 + 60 : 120;
  let { x = 0, y = 0 } = updateData?.menuPosition || {};

  if (y + 500 > document.documentElement.clientHeight - 130) y = document.documentElement.clientHeight - 150 - 500;
  if (x + 360 > document.documentElement.clientWidth) x -= 360 + 30;

  return (
    <Modal
      wrapClassName="displayModalRoot"
      visible={true}
      mask={false}
      title={<div />}
      footer={false}
      width={360}
      zIndex={1052}
      closable={false}
      style={updateData?.menuPosition ? { top: y + 130, left: x, margin: 'unset', height: 0 } : { top: 200 }}
      onCancel={onCancel}
      modalRender={modal => (
        <Draggable disabled={disabled} bounds={bounds} onStart={(event: any, uiData: any) => onStart(event, uiData)}>
          <div ref={draggleRef}>{modal}</div>
        </Draggable>
      )}
    >
      <div
        className="modalMoveBar"
        style={{ left: modalMoveBarOffset, width: `calc(100% - ${modalMoveBarOffset}px)` }}
        onMouseOver={() => {
          if (disabled) setDisabled(false);
        }}
        onMouseOut={() => setDisabled(true)}
      />
      <Tabs defaultActiveKey="style">
        <Tabs.TabPane tab={intl.get('exploreGraph.style.defaultStyle')} key="style">
          <Styles
            modalType={modalType}
            layoutType={layoutType}
            batchClass={batchClass}
            graphStyle={graphStyle}
            updateData={updateData}
            onChangeData={onChangeData}
            onUpdateStyle={onUpdateStyle}
          />
        </Tabs.TabPane>
        {config.scope.visible && (
          <Tabs.TabPane tab={intl.get('exploreGraph.style.range')} key="scope">
            <Scope
              modalType={modalType}
              updateData={updateData}
              onChangeData={onChangeData}
              onUpdateStyle={onUpdateStyle}
            />
          </Tabs.TabPane>
        )}
      </Tabs>
    </Modal>
  );
};

export default DisplayModal;
