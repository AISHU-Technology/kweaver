import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Col, Row } from 'antd';
import { CircleA, CircleB, RectA, RectB } from './ExampleItems';

import Format from '@/components/Format';

import './style.less';

const DisplayShape = (props: any) => {
  const { selectedItem } = props;
  const { onChangeData } = props;

  const onChangeItem = (config: any) => {
    const { type, hasLine, position, labelFill } = config;
    const ontoDataNode = _.keyBy(selectedItem.ontoData.entity, 'name');

    const newGraphStyle = _.cloneDeep(selectedItem.graphStyle);
    _.forEach(newGraphStyle.node, item => {
      const ontoData = ontoDataNode[item?._class];
      item.type = type;
      item.position = position;
      item.labelFill = labelFill;
      if (type === 'customCircle' && ontoData) {
        item.icon = ontoData?.icon || 'empty';
        item.iconColor = 'rgba(255,255,255,1)';
        item.fillColor = ontoData?.fill_color;
      }
      if (type === 'customRect') {
        if (ontoData) {
          item.icon = ontoData?.icon || 'empty';
          item.fillColor = ontoData?.fill_color;
        }
        item.hasLine = hasLine;
        item.iconColor = _.cloneDeep(item.fillColor);
        item.fillColor = 'rgba(255,255,255,1)';
      }
    });
    onChangeData({ type: 'graphStyle', data: { ...newGraphStyle, notUpdate: true } });

    const oldNodes = _.cloneDeep(selectedItem?.graphData?.nodes);
    const newNodes = _.map(selectedItem?.graphData?.nodes, (item: any) => {
      const ontoData = ontoDataNode[item?._class];
      item.type = type;
      item.position = position;
      item.labelFill = labelFill;
      if (type === 'customCircle' && ontoData) {
        item.icon = ontoData?.icon || 'empty';
        item.iconColor = 'rgba(255,255,255,1)';
        item.fillColor = ontoData?.fill_color;
      }
      if (type === 'customRect') {
        if (ontoData) {
          item.icon = ontoData?.icon || 'empty';
          item.fillColor = ontoData?.fill_color;
        }
        item.hasLine = hasLine;
        item.iconColor = _.cloneDeep(item.fillColor);
        item.fillColor = 'rgba(255,255,255,1)';
      }
      return item;
    });
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: selectedItem?.graphData?.edges } });
    selectedItem?.graph?.current.graphStack.getRedoStack()?.clear();
    selectedItem?.graph?.current.graphStack.pushStack('update', {
      before: { nodes: oldNodes, edges: [] },
      after: { nodes: newNodes, edges: [] }
    });
  };

  const EXAMPLE_ITEMS: any = [
    {
      key: 'circle',
      label: intl.get('exploreGraph.style.circle'),
      children: [
        {
          key: 'a',
          Component: CircleA,
          onClick: () => {
            onChangeItem({ type: 'customCircle', hasLine: false, position: 'bottom' });
          }
        },
        {
          key: 'b',
          Component: CircleB,
          onClick: () => {
            onChangeItem({
              type: 'customCircle',
              hasLine: false,
              labelFill: 'rgba(255, 255, 255, 1)',
              position: 'center'
            });
          }
        }
      ]
    },
    {
      key: 'rect',
      label: intl.get('exploreGraph.style.rect'),
      children: [
        {
          key: 'a',
          Component: RectA,
          onClick: () => {
            onChangeItem({
              type: 'customRect',
              hasLine: false,
              labelFill: 'rgba(0, 0, 0, 1)',
              position: 'center'
            });
          }
        },
        {
          key: 'b',
          Component: RectB,
          onClick: () => {
            onChangeItem({
              type: 'customRect',
              hasLine: true,
              labelFill: 'rgba(0, 0, 0, 1)',
              position: 'center'
            });
          }
        }
      ]
    }
  ];

  return (
    <div className="displayShapeRoot">
      {_.map(EXAMPLE_ITEMS, shape => {
        const { key, label, children } = shape;
        return (
          <div key={key} className="kw-mt-4">
            <div>
              <Format.Text>{label}</Format.Text>
            </div>
            <Row className="kw-mt-2" gutter={[12, 12]}>
              {_.map(children, item => {
                const { key, Component, onClick } = item;
                return (
                  <Col key={key} span={12}>
                    <div className="exampleItem" onClick={() => onClick?.()}>
                      <Component />
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        );
      })}
    </div>
  );
};

export default DisplayShape;
