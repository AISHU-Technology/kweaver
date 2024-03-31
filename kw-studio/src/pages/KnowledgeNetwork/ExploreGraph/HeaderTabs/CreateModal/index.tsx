import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Modal, Button, message, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import servicesVisualAnalysis from '@/services/visualAnalysis';
import { getParam } from '@/utils/handleFunction';

import knowledgeEmpty from '@/assets/images/kgEmpty.svg';
import './style.less';

const WIDTH = 280;
const CreateModal = (props: any) => {
  const { graphItems, modalPosition } = props;
  const { onOk, onCancel } = props;

  const [canvasList, setCanvasList] = useState<any>([]); // 分析画布列表
  const [position, setPosition] = useState<any>({ top: 0, left: 0 });
  const { top = 0, left = 0 } = position;

  useEffect(() => {
    const containerWidth = document.body.clientWidth;
    const newPosition = { ...modalPosition };
    if (WIDTH + newPosition?.left > containerWidth) newPosition.left = newPosition?.left - WIDTH;
    setPosition(newPosition);
    getAnalysisList();
  }, []);

  /**
   * 获取分析列表
   */
  const getAnalysisList = async () => {
    const { knId: knw_id, graphId } = getParam(['knId', 'graphId']);
    try {
      const data = { page: 1, order_type: 'desc', kg_id: graphId, order_field: 'create_time' };
      const res = await servicesVisualAnalysis.visualAnalysisList(knw_id, data);
      if (res?.res) {
        const graphItemsCIds = _.map(graphItems, item => item?.detail?.c_id);
        const list = _.filter(res?.res?.canvases, item => !_.includes(graphItemsCIds, item?.c_id));
        setCanvasList(list);
      }
      if (res?.ErrorCode) message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  // 添加新的 canvas
  const onCreateCanvas = () => {
    const { kg_id, name } = graphItems?.[0]?.detail?.kg || {};
    if (kg_id && name) onOk({ type: 'add', kg_id, kg_name: name });
  };

  const onOpenCanvas = (c_id: string) => {
    if (c_id) onOk({ type: 'open', c_id });
  };

  return (
    <Modal
      className="createModalRoot"
      width={WIDTH}
      mask={false}
      footer={null}
      visible={true}
      closable={false}
      zIndex={1052}
      style={{ top, left, position: 'absolute' }}
      onCancel={onCancel}
    >
      <div className="createButton" onClick={onCreateCanvas}>
        <Button type="link" style={{ padding: 0 }}>
          <PlusOutlined />
          {intl.get('exploreGraph.createAnalysis')}
        </Button>
        <div className="kw-border-b" />
      </div>
      <div className="canvasList">
        {_.isEmpty(canvasList) ? (
          <div className="createModelEmpty">
            <img className="createModelEmptyImg" src={knowledgeEmpty} alt="nodata" />
            {intl.get('exploreGraph.createAnalysisEmpty')}
          </div>
        ) : (
          _.map(canvasList || [], item => {
            const { c_id, canvas_name } = item;
            return (
              <Tooltip key={c_id} title={canvas_name} placement="right">
                <div className="selectLine" onClick={() => onOpenCanvas(c_id)}>
                  {canvas_name}
                </div>
              </Tooltip>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default CreateModal;
