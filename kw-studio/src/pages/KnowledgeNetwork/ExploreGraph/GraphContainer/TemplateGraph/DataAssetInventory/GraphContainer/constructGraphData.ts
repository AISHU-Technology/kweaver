import _ from 'lodash';

import HELPER from '@/utils/helper';
import { cardPadding, iconFontSize, iconMargin, labelLineHeight, labelMarginMargin } from './enum';

export const getLabelValues = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => HELPER.stringEllipsis(l.value, limit || 15))?.join('\n');
};
//  getLengthFromString

const COMPRESS_CONFIG: any = {
  metadata_table: 2,
  businessobject: 2
};
export const constructGraphTreeData = (_data: any, config: any) => {
  const { graphStyle } = config;
  const data = _.cloneDeep({ nodes: _data.nodes || [], edges: _data.edges });

  let result: any = {};
  const nodes = _.map(data.nodes, _item => {
    const { color, iconColor, fillColor, strokeColor, ...other } = _item;

    const item = {
      iconColor: iconColor || color,
      fillColor: fillColor || color,
      strokeColor: strokeColor || color,
      type: 'templateDataAssetInventory',
      _compress: COMPRESS_CONFIG[_item._class] || 0,
      ...other
    };
    const { id, type } = item;
    const node: any = { id, type, _sourceData: item };
    if (_item._isRoot) {
      result = node;
      node._isRoot = true;
    }

    // 如果有缓存并且有新增节点，则使用缓存类型默认样式
    if (graphStyle && graphStyle?.node?.[item._class]) {
      const data = graphStyle?.node?.[item._class] || {};
      const { showLabels } = data;

      const propertiesKV = _.keyBy(item.properties, 'name');
      const properties = _.map(showLabels, d => {
        if (!propertiesKV?.[d?.key]) {
          return {
            name: d.key,
            alias: d.alias,
            value: d.value,
            type: d.type,
            isChecked: d.isChecked,
            isDisabled: d.isDisabled
          };
        }
        return { ..._.cloneDeep(d), value: propertiesKV[d.key]?.value };
      });

      node._sourceData = { ...node._sourceData, properties };
    }

    return node;
  });

  const nodeKv = _.keyBy(nodes, 'id');
  const edges = _.map(data.edges, (_item: any) => {
    const { color, strokeColor, ...other } = _item;
    const item = { strokeColor: strokeColor || color, ...other };
    const { id } = _item;
    const edge = { id, _sourceData: item };
    return edge;
  });

  const constructGraphPip = (fn: any) => fn(result);

  const existNodeIds = [result?.id];
  /** 构建原始的树图结构 */
  const getOriginalTree = (_data: any) => {
    const getDagre = (father: any) => {
      if (_.isEmpty(father.children)) {
        let hasChildren = false;
        _.forEach(data.edges, item => {
          item.source = item?.source || item?.relation?.[0];
          item.target = item?.target || item?.relation?.[2];
          if (item?.target === father.id) {
            const source: any = nodeKv?.[item?.source];
            if (!source) return;
            if (_.includes(existNodeIds, source.id)) return;

            existNodeIds.push(source.id);
            source._path = [...(father?._path || []), father.id];
            source._sourceEdge = _.cloneDeep(item);
            hasChildren = true;
            if (father.children) {
              father.children.push(source);
            } else {
              father.children = [source];
            }
          }
        });
        if (hasChildren) getOriginalTree(_data);
      } else {
        _.forEach(father.children, item => getOriginalTree(item));
      }
    };

    getDagre(_data);
  };

  /** 压缩节点 */
  const toCompressChildren = (father: any) => {
    if (_.isEmpty(father) || _.isEmpty(father?.children)) return;
    _.map(father.children, child => {
      if (child?._sourceData?._compress === 0) return;

      let index = child?._sourceData?._compress;
      const pushExtend = (data: any) => {
        if (index === 0) return;
        if (_.isEmpty(data?.children)) return;
        const _temp = data?.children?.[0];
        if (child._extend) {
          child._extend.push(_temp);
        } else {
          child._extend = [_temp];
        }
        delete data.children;
        index -= 1;
        pushExtend(_temp);
      };
      pushExtend(child);
      delete child.children;
    });
  };

  /** 增加代理节点 */
  const toAddAgencyNode = (father: any) => {
    if (_.isEmpty(father)) return;
    const mergeData: any = {};
    if (_.isEmpty(father?.children)) return;
    _.forEach(father.children, child => {
      const { type, icon, alias, iconColor, fillColor, strokeColor, properties, _class } = child?._sourceData || {};
      const refname = _.filter(properties, item => item.key === 'refname' && item.value);
      const refValue = refname?.[0]?.value;
      if (mergeData[_class]) {
        mergeData[_class].children.push(child);
      } else {
        mergeData[_class] = {
          id: `agency_${_class}`,
          type,
          _isAgency: true,
          children: [child],
          _sourceData: {
            icon,
            alias: refValue || alias,
            iconColor,
            fillColor,
            strokeColor,
            _class
          }
        };
      }
    });
    father.children = _.values(mergeData);
  };

  /** 计算节点宽度 */
  const computeNodeWidth = (father: any) => {
    const _tempWidth: any = []; // 根据树图label计算同一层级最大长度
    const getLayoutWidth = (father: any, index: number) => {
      if (_.isEmpty(father)) return;
      const { _isRoot, _isAgency, _extend, _sourceData } = father;
      const { alias, properties } = _sourceData || {};

      let label = '';
      let subLabel = '';
      if (_isAgency) label = alias;
      if (!_isAgency) label = getLabelValues(properties, 100);
      if (_isRoot) subLabel = '表维度';
      if (_extend) {
        subLabel = _.map(_extend, (item, index: number) => {
          const prefixname = _.filter(item?._sourceData?.properties, item => item.key === 'prefixname' && item.value);
          const prefixValue = prefixname?.[0]?.value;
          if (prefixValue) return `${prefixValue}: ${item?._sourceData?.default_property?.value}`;
          return `L${2 - index}: ${item?._sourceData?.default_property?.value}`;
        })?.join(' > ');
        if (subLabel) {
          const prefixname = _.filter(_sourceData?.properties, item => item.key === 'prefixname' && item.value);
          const prefixValue = prefixname?.[0]?.value;
          if (prefixValue) {
            label = `${prefixValue}: ${label}`;
          } else {
            label = `L3: ${label}`;
          }
        }
      }
      const hasIcon = _isRoot || _isAgency;
      let offset = 0;
      if (hasIcon) offset = offset + iconFontSize + iconMargin * 2;
      offset += labelMarginMargin;

      const lengthPrev = _tempWidth?.[index] || 0;
      const width = Math.max(
        160,
        HELPER.getLengthFromString(label) + offset,
        HELPER.getLengthFromString(subLabel) + offset
      );
      const layoutWidth = Math.max(lengthPrev, width);
      _tempWidth[index] = layoutWidth;

      const lineLength = subLabel ? 2 : 1;
      const height = lineLength * labelLineHeight + cardPadding * 2;

      father._width = width;
      father._height = height;
      father._level = index;
      father.label = label;
      father.subLabel = subLabel;

      if (_.isEmpty(father?.children)) return;
      _.forEach(father.children, child => {
        const _index = index + 1;
        getLayoutWidth(child, _index);
      });
    };
    getLayoutWidth(father, 0);

    /** 根据层级宽度给节点赋值 */
    const setLength = (father: any) => {
      if (_.isEmpty(father)) return;
      father._layoutWidth = _tempWidth?.[father?._level];
      if (_.isEmpty(father?.children)) return;
      _.forEach(father.children, item => setLength(item));
    };
    setLength(father);
  };

  constructGraphPip(getOriginalTree);
  constructGraphPip(toCompressChildren);
  constructGraphPip(toAddAgencyNode);
  constructGraphPip(computeNodeWidth);

  return { result, nodes, edges };
};
