import _ from 'lodash';
import G6 from '@antv/g6';
import intl from 'react-intl-universal';

import HELPER from '@/utils/helper';

const tooltip = () =>
  new G6.Tooltip({
    offsetX: 10,
    offsetY: 20,
    className: 'g6tip',
    trigger: 'mouseenter',
    itemTypes: ['node', 'edge'],
    getContent(e: any) {
      const item = e.item.getModel()._sourceData;
      const outDiv = document.createElement('div');
      outDiv.setAttribute(
        'style',
        'background-color: rgba(0,0,0,.8); padding: 10px 8px; border-radius: 4px; font-size: 12px;' +
          'color: #fff;  border: 1px solid rgb(0,0,0); '
      );
      outDiv.innerHTML = `
      <ul>
        <li>name: ${item.name}</li>
        <li>count: ${HELPER.formatNumberWithComma(item.count)}</li>
      </ul>`;
      return outDiv;
    }
  });

const toolTipWorkFlow = () =>
  new G6.Tooltip({
    offsetX: 10,
    offsetY: 20,
    className: 'g6tip',
    trigger: 'mouseenter',
    itemTypes: ['node', 'edge'],
    getContent(e: any) {
      const item = e?.item?.getModel()?._sourceData;
      if (_.isEmpty(item)) return '';
      const isEdge = !!item?.relation;
      const outDiv = document.createElement('div');
      outDiv.setAttribute(
        'style',
        'background-color: rgba(0,0,0,.8); padding: 10px 16px; border-radius: 4px; font-size: 14px;' +
          'color: #fff;  border: 1px solid rgb(0,0,0); '
      );
      outDiv.innerHTML = `
    <div>
      <div>${isEdge ? intl.get('createEntity.reN') : intl.get('createEntity.ecn')}<div>
      <div>${item?.name}</div>
      <div>-----------<div>
      <div>${intl.get('createEntity.acn')}<div>
      <div>${item?.alias}</div>
    </div>`;
      return outDiv;
    }
  });

export { tooltip, toolTipWorkFlow };
