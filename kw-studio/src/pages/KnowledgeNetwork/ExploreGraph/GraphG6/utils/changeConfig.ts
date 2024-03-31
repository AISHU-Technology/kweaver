import _ from 'lodash';

import HELPER from '@/utils/helper';

const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

/** 修改显示信息 */
const onChangeConfig = ({ graph, graphData, config, layout, onChangeData }: any) => {
  if (_.isEmpty(config)) return;
  if (graph.current.__isGroup && _.isEmpty(config?.node) && _.isEmpty(config?.more)) return;

  const toStackBeforeNodes: any = [];
  const toStackBeforeEdges: any = [];
  const toStackAfterNodes: any = [];
  const toStackAfterEdges: any = [];

  graph.current.__canvasRefresh = false;
  _.forEach(graph.current.getNodes(), item => {
    const model = item?.getModel();
    const hide = !item?.get('visible');
    const itemKey = config?.type === 'all' ? 'class' : 'id';
    const configKey = model?._sourceData?.[itemKey];
    const data = config?.node[configKey] || config?.more[configKey] || {};
    const {
      size,
      icon,
      type,
      position,
      labelType,
      labelLength,
      labelFixLength,
      showLabels,
      labelFill,
      iconColor,
      fillColor,
      strokeColor
    } = data;

    if (!_.isEmpty(data)) {
      if (showLabels && layout.key === 'tree') graph.current.__canvasRefresh = true;
      const _sourceData = _.cloneDeep(model?._sourceData);
      const defaultSize = model?._sourceData?.size;
      const defaultType = model?.type;
      const defaultColor = model?._sourceData?.color;
      const defaultLabelFill = model?._sourceData?.labelFill || '#000000';
      const defaultIconColor = model?._sourceData?.iconColor || 'rgba(255,255,255,1)';
      const defaultFillColor = model?._sourceData?.fillColor;
      // 形状变为，两个颜色保持一致
      const defaultStrokeColor = model?._sourceData?.strokeColor;
      const defaultLabelType = model?._sourceData?.labelType;
      const defaultLabelFixLength = model?._sourceData?.labelFixLength;
      const defaultLabelLength = model?._sourceData?.labelLength || 160;
      const defaultPosition = model?._sourceData?.position;

      // 要更新的_sourceData
      const hasShowLabels = !_.isEmpty(showLabels);
      _sourceData.type = type || defaultType;
      _sourceData.color = fillColor || defaultFillColor || defaultColor;
      _sourceData.iconColor = iconColor || defaultIconColor;
      _sourceData.fillColor = fillColor || defaultFillColor || defaultColor;
      _sourceData.strokeColor = strokeColor || defaultStrokeColor || defaultColor;
      _sourceData.labelFill = labelFill || defaultLabelFill;
      _sourceData.labelType = labelType || defaultLabelType;
      _sourceData.labelLength = labelLength || defaultLabelLength;
      _sourceData.labelFixLength = labelFixLength || defaultLabelFixLength;
      _sourceData.position = position || defaultPosition;
      _sourceData.size = parseInt(size, 10) || defaultSize;
      _sourceData.hide = hide;
      if (icon && _sourceData.icon !== icon) _sourceData.icon = icon;
      _sourceData.showLabels = _.map(_sourceData?.showLabels || [], item => {
        let newItem = hasShowLabels ? { ...item, isChecked: false } : item;
        _.forEach(showLabels, d => {
          if (d.key === '#defaultTag' && item.key === _sourceData?.default_property?.name) {
            newItem = { ...item, isChecked: d?.isChecked };
            return false;
          }
          if (d.key === item.key) newItem = { ...item, isChecked: d?.isChecked };
        });
        return newItem;
      });

      // 要更新的样式
      const label = getLabelValues(_sourceData.showLabels, _sourceData.labelLength) || '';
      const labelsWidth = _.map(label.split('\n') || [], item => (!item ? 0 : HELPER.getLengthFromString(item)));

      const updateData: any = {
        id: model?.id,
        type: _sourceData.type,
        _width: Math.max(0, ...labelsWidth),
        _sourceData
      };

      // 构建栈信息
      toStackAfterNodes.push(updateData);
      toStackBeforeNodes.push({ id: model?.id, type: defaultType, _sourceData: _.cloneDeep(model?._sourceData) });

      // 更新，不入栈
      graph.current.updateItem(model?.id, updateData);

      if (size || type) {
        graph.current?.__refreshSubGroup();
      }
      if (size) {
        try {
          const inEdges = item.getInEdges();
          _.forEach(inEdges, edge => graph.current.updateItem(edge, {}));
        } catch (error) {
          //
        }
      }
    }
  });
  _.forEach(graph.current.getEdges(), item => {
    const model = item?.getModel();
    const hide = !item?.get('visible');
    const itemKey = config?.type === 'all' ? 'class' : 'id';
    const configKey = model?._sourceData?.[itemKey];
    const data = config?.edge[configKey] || {};
    const { strokeColor, size, type, labelFill, showLabels } = data;

    if (!_.isEmpty(data)) {
      const _sourceData = _.cloneDeep(model?._sourceData);
      const defaultType = model?.type;
      const defaultLabel = model?.label;
      const defaultStrokeColor = model?._sourceData?.strokeColor;
      const defaultLabelFill = model?._sourceData?.labelFill || defaultStrokeColor;
      const defaultSize = model?._sourceData?.lineWidth || 0.75;

      // 要更新的样式
      const hasShowLabels = !_.isEmpty(showLabels);

      const showLabelsKV = _.keyBy(_sourceData.showLabels, 'key');
      let _showLabels: any = _sourceData.showLabels;
      if (hasShowLabels) {
        _showLabels = _.map(showLabels, d => {
          if (showLabelsKV?.[d?.key]) return { ..._.cloneDeep(d), value: showLabelsKV[d.key]?.value };
        });
      }
      const endArrow = _.cloneDeep(model?.style?.endArrow);
      const updateData: any = {
        type: type || defaultType,
        label: getLabelValues(_showLabels),
        style: { stroke: strokeColor || defaultStrokeColor, lineWidth: Number(size) || defaultSize }
      };
      if (endArrow) {
        endArrow.fill = strokeColor || defaultStrokeColor;
        updateData.style.endArrow = endArrow;
      }
      // 要更新的_sourceData
      _sourceData.type = type || defaultType;
      _sourceData.strokeColor = strokeColor || defaultStrokeColor;
      _sourceData.labelFill = labelFill || defaultLabelFill;
      _sourceData.lineWidth = Number(size) || defaultSize;
      _sourceData.hide = hide;
      _sourceData.showLabels = _.map(_sourceData?.showLabels || [], item => {
        let newItem = hasShowLabels ? { ...item, isChecked: false } : item;
        _.forEach(showLabels, d => {
          if (d.key === item.key) newItem = { ...item, isChecked: d?.isChecked };
        });
        return newItem;
      });
      updateData._sourceData = _sourceData;

      // 构建栈信息
      toStackAfterEdges.push({ ...updateData, id: model?.id });
      const stackData: any = {
        id: model?.id,
        label: defaultLabel,
        style: { stroke: model?.style?.stroke, lineWidth: model?.style?.lineWidth },
        _sourceData: _.cloneDeep(model?._sourceData)
      };
      if (endArrow) {
        stackData.style.endArrow = { ...model?.style?.endArrow, full: defaultStrokeColor };
      }
      toStackBeforeEdges.push(stackData);

      // 更新，不入栈
      if (layout?.default?.isGroup) return;
      graph.current.updateItem(item, updateData);
    }
  });

  onChangeData({ type: 'config', data: {} });
  const nodeKV = _.keyBy(
    _.map(graph.current.getNodes(), item => item.getModel()._sourceData),
    'id'
  );
  const edgeKV = _.keyBy(
    _.map(
      _.filter(graph.current.getEdges(), item => {
        return !item?._cfg.targetNode?._cfg?.model?.isMore;
      }),
      item => item.getModel()._sourceData
    ),
    'id'
  );
  onChangeData({
    type: 'graphData',
    data: {
      nodes: _.map(graphData.nodes, item => {
        if (nodeKV[item.id]) return nodeKV[item.id];
        return item;
      }),
      edges: _.map(graphData.edges, item => {
        if (edgeKV[item.id]) return edgeKV[item.id];
        return item;
      })
    }
  });

  // 编辑清空重做
  if (layout?.default?.isGroup) return;
  graph.current.graphStack.getRedoStack()?.clear();
  graph.current.graphStack.pushStack('update', {
    before: { nodes: toStackBeforeNodes, edges: toStackBeforeEdges },
    after: { nodes: toStackAfterNodes, edges: toStackAfterEdges }
  });
};

export default onChangeConfig;
