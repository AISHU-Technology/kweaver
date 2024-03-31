import _ from 'lodash';
import intl from 'react-intl-universal';

import HELPER from '@/utils/helper';
import { nodeSize } from '../../enums';

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};

// 获取根节点
const getRootKey = (_data: any) => {
  const data = _data;
  const { nodes, edges } = data;

  const sources: any = [];
  const targets: any = [];

  _.forEach(edges, (item: any) => {
    if (item.hide) return;
    if (_.includes(targets, item?.target)) return;
    sources.push(item?.source || item?.relation?.[0]);
    targets.push(item?.target || item?.relation?.[2]);
  });

  // 寻找树的根节点
  const rootsKey: any = nodes.length === 1 ? nodes[0].id : _.uniq(_.pullAllWith(sources, targets))[0];

  return rootsKey;
};

/** 构建树布局数据 */
const nodeType: any = { circle: 'customCircle', rect: 'customRect' };
export const constructGraphTreeData = (_data: any, option?: any, cache?: any) => {
  const newData = _data.newData || {};
  const data = _.cloneDeep({ nodes: _data.nodes || [], edges: _data.edges });
  const { limit, isGroup = false, direction, groupLimit = {} } = option;

  let result: any = {};
  const nodes = _.map(data.nodes, (_item, index: number) => {
    _item.size = _item.size || nodeSize;
    const item: any = {
      length: 15,
      position: 'top',
      type: 'customCircle',
      iconColor: 'rgba(255,255,255,1)',
      fillColor: _item.color,
      strokeColor: _item.color,
      size: nodeSize,
      ..._item
    };
    const { x, y, uid, icon, size, type, length, position, hide } = item;

    if (direction === 'RL') item.side = 'left';
    if (direction === 'LR') item.side = 'right';
    if (direction === 'H') item.side = index % 2 === 0 ? 'left' : 'right';
    if (direction === 'V') item.side = index % 2 === 0 ? 'left' : 'right';

    const node: any = {
      x,
      y,
      icon,
      size,
      position,
      side: item.side,
      id: uid || item?.id,
      type: nodeType[type] ? nodeType[type] : type,
      visible: !hide,
      _layout: 'tree',
      _direction: direction,
      _sourceData: item
    };

    // 如果有缓存并且有新增节点，则使用缓存类型默认样式
    if (cache && cache?.node?.[item.class] && newData?.node?.[item.id]) {
      const data = cache?.node?.[item.class] || {};
      const { type, labelLength, showLabels: _showLabels } = data;

      let showLabelsKV = _.keyBy(item.showLabels, 'key');
      let showLabels = _.map(_showLabels, d => {
        if (!showLabelsKV?.[d?.key]) return d;
        const value = showLabelsKV[d.key]?.value;
        showLabelsKV = _.omit(showLabelsKV, d.key);
        return { ..._.cloneDeep(d), value };
      });
      // 本体添加新属性后构建再搜索新属性无法显示
      showLabels = _.concat(showLabels, _.values(showLabelsKV));

      node.type = nodeType[type] ? nodeType[type] : type;
      node.label = getLabelValues(showLabels, labelLength) || '';
      node._sourceData = { ...node._sourceData, ...data, showLabels };
    }

    const label = getLabelValues(node?._sourceData?.showLabels, length) || '';
    const labels = _.filter(label.split('\n'), item => !!item);
    const labelsWidth = Math.max(0, ..._.map(labels || [], item => HELPER.getLengthFromString(item)));
    node.label = label;
    node._width = labelsWidth;

    if (_item.isRoot) result = { ...node, side: 'right', isRoot: true };
    // 如果有缓存并且有新增节点，则使用缓存类型默认样式
    return node;
  });
  // 当没有指定根节点的时候，计算出根节点
  if (_.isEmpty(result)) {
    const rootsKey = getRootKey(data);
    if (rootsKey) {
      const resultNode = _.find(nodes, item => item.id === rootsKey);
      result = { ...resultNode, side: 'right', isRoot: true };
    } else {
      result = { ...nodes[0], side: 'right', isRoot: true };
    }
  }

  const edges = _.map(data.edges, (_item: any) => {
    let item = _item;
    item.strokeColor = item.strokeColor || item.color;
    if (cache && cache?.edge?.[item.class] && newData?.edge?.[item.id]) {
      const data = cache?.edge?.[item.class] || {};
      const { showLabels: _showLabels } = data;

      let showLabelsKV = _.keyBy(item.showLabels, 'key');
      let showLabels = _.map(_showLabels, d => {
        if (!showLabelsKV?.[d?.key]) return d;
        const value = showLabelsKV[d.key]?.value;
        showLabelsKV = _.omit(showLabelsKV, d.key);
        return { ..._.cloneDeep(d), value };
      });
      // 本体添加新属性后构建再搜索新属性无法显示
      showLabels = _.concat(showLabels, _.values(showLabelsKV));

      item = { ...item, ...data, showLabels };
      item.label = getLabelValues(showLabels) || '';
    }

    item.group = item?.class;
    item.label = item?.label || item?.alias;
    item.source = item?.source || item?.relation?.[0];
    item.target = item?.target || item?.relation?.[2];
    return item;
  });

  const nodeKv = _.keyBy(nodes, 'id');

  /** 构建树图数据管道 */
  const constructGraphPip = (fn: any) => {
    try {
      fn(result);
    } catch (error) {}
  };

  const existNodeIds = [result?.id];
  /** 构建原始的树图结构 */
  const structureOriginalTree = (_data: any) => {
    const getDagre = (father: any) => {
      if (_.isEmpty(father.children)) {
        let hasChildren = false;
        _.forEach(edges, item => {
          item.source = item?.source || item?.relation?.[0];
          item.target = item?.target || item?.relation?.[2];
          if (item?.source === father.id) {
            const target: any = nodeKv?.[item?.target];
            if (_.includes(existNodeIds, target.id)) return;

            existNodeIds.push(target.id);
            target._path = [...(father?._path || []), father.id];
            target._sourceEdge = _.cloneDeep(item);
            hasChildren = true;
            if (father.children) {
              father.children.push(target);
            } else {
              father.children = [target];
            }
          }
        });
        if (hasChildren) structureOriginalTree(_data);
      } else {
        _.forEach(father.children, item => structureOriginalTree(item));
      }
    };

    getDagre(_data);
  };

  /** 增加代理节点 */
  const addAgencyNode = (father: any) => {
    if (_.isEmpty(father)) return;
    if (_.isEmpty(father?.children)) return;
    const mergeData: any = {};
    _.forEach(father.children, child => {
      if (!_.isEmpty(child.children)) addAgencyNode(child);

      const agency = child._sourceEdge;
      const { group, strokeColor } = agency;
      const id = `${agency.source}-${agency.target}`;
      const label = getLabelValues(agency.showLabels);

      if (mergeData[agency.group]) {
        mergeData[agency.group].children.push(child);
      } else {
        const tempData = {
          id,
          label,
          class: agency.class,
          icon: 'graph-reduce-circle',
          strokeColor,
          limit: groupLimit[group] || limit,
          isFather: true,
          type: 'nodeText',
          isAgencyNode: true,
          groupName: group,
          fatherId: father?.id,
          side: father?.side,
          visible: !agency.hide,
          children: [child],
          _direction: direction,
          _width: HELPER.getLengthFromString(label)
        };
        const _sourceData: any = _.cloneDeep(tempData);
        delete _sourceData?.children;
        mergeData[agency.group] = { ...tempData, _sourceData };
      }
    });

    father.children = _.values(mergeData);
  };

  /** 构建显示限制的叶子节点 */
  const structureLimitLeafNode = (father: any) => {
    if (_.isEmpty(father)) return;
    if (_.isEmpty(father.children)) return;

    const id = `${father.id}-more`;
    let moreData = {
      id,
      fatherId: father?.id,
      scope: 'all',
      label: intl.get('exploreGraph.more'),
      isMore: true,
      class: '__more',
      size: nodeSize,
      isAgencyNode: true,
      type: 'customCircle',
      color: 'rgba(0,0,0,.25)',
      fillColor: 'rgba(0,0,0,.25)',
      strokeColor: 'rgba(0,0,0,.25)',
      side: father?.side,
      visible: !father.hide,
      _layout: 'tree',
      _direction: direction,
      _width: HELPER.getLengthFromString(intl.get('exploreGraph.more')),
      showLabels: [{ key: 'more', alias: 'more', value: intl.get('exploreGraph.more'), isChecked: true }],
      ...(cache?.more?.__more || {})
    };

    if (isGroup) {
      if (!father.isAgencyNode) {
        _.forEach(father.children, child => structureLimitLeafNode(child));
      } else {
        const _limit = father?.limit || limit;
        moreData = { ...moreData, limit: _limit, isGroup: true, group: father?.groupName };

        const length = father?.children?.length;
        father.children = _.slice(father.children, 0, _limit);
        if (length > _limit) {
          father.children.push({ ...moreData, _sourceData: moreData });
        }
        _.forEach(father.children, child => structureLimitLeafNode(child));
      }
    } else {
      const _limit = father._sourceData?.limit || limit;
      const length = father?.children?.length;
      father.children = _.slice(father.children, 0, _limit);
      if (length > _limit) {
        father.children.push({ ...moreData, _sourceData: moreData });
      }
      _.forEach(father.children, child => structureLimitLeafNode(child));
    }
  };

  /** 写入节点的边信息 */
  const setNodeSide = (father: any) => {
    if (direction === 'H') {
      const setSide = (child: any, side: string) => {
        child.side = side;
        if (_.isEmpty(child?.children)) return;
        _.forEach(child.children, item => setSide(item, child.side));
      };

      _.forEach(father?.children, (child, index: number) => {
        child.side = index % 2 === 0 ? 'right' : 'left';
        if (_.isEmpty(child?.children)) return;
        _.forEach(child.children, item => setSide(item, child.side));
      });
    }
  };

  /** 计算节点宽度 */
  const computeNodeWidth = (father: any) => {
    const _tempWidth: any = []; // 根据树图label计算同一层级最大长度
    const getLayoutWidth = (father: any, index: number) => {
      if (_.isEmpty(father)) return;
      father._level = index;

      const lengthPrev = _tempWidth?.[index] || 0;
      const lengthCurrent = HELPER.getLengthFromString(father?.label);

      const maxArr = [father._width, lengthCurrent, lengthPrev];
      const length = _.max(maxArr);
      _tempWidth[index] = length;

      if (Array.isArray(father?.children)) {
        const _index = index + 1;
        _.forEach(father.children, item => getLayoutWidth(item, _index));
      }
    };
    getLayoutWidth(father, 0);

    /** 根据层级宽度给节点赋值 */
    const setLength = (father: any) => {
      if (_.isEmpty(father)) return;

      father._layoutWidth = _tempWidth?.[father?._level];
      if (
        (father.type === 'customCircle' || father.type === 'nodeText') &&
        (father._direction === 'TB' || father._direction === 'BT' || father._direction === 'V')
      ) {
        father._layoutWidth = 50;
      }
      father._leftNodeOffset = Math.abs(Math.abs(father?._layoutWidth) - (Math.abs(father?._width) || 0));
      if (Array.isArray(father?.children)) {
        _.forEach(father.children, item => setLength(item));
      }
    };
    setLength(father);
  };

  constructGraphPip(structureOriginalTree);
  if (isGroup) constructGraphPip(addAgencyNode);
  constructGraphPip(structureLimitLeafNode);
  constructGraphPip(setNodeSide);
  constructGraphPip(computeNodeWidth);

  return { result, nodes, edges };
};
