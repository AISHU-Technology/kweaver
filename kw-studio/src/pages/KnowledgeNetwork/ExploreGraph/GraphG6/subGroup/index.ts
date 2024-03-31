/* eslint-disable no-param-reassign */
// @ts-nocheck
import _ from 'lodash';
import { IGroup } from '@antv/g-base';
import { deepMix, isString } from '@antv/util';
import { parsePathString } from '@antv/path-util';
import type { Item, BubblesetCfg, HullCfg, Graph } from '@antv/g6';

import { pathToPoints, getClosedSpline, roundedHull, paddedHull } from './util/path';
import { isPolygonsIntersect } from './util/calc';
import { genConvexHull } from './util/convexHull';
import { genBubbleSet } from './util/bubbleset';
import { defaultStyles } from './enums';

// 新增一些字段
type CustomCfg = HullCfg & {
  styles: {};
  states: string[]; // 状态
  info: Record<string, any>; // 子图信息
  from: string; // 来源 'select'自选 | 'subgroup'子图 | 'sliced'切片 | 'community'社区发现
  mode?: string | 'dashed'; // 图切片的normal状态只需要虚线简单包裹
  // groupType: string; // 分组类型 'path'路径 | 'other'其他非路径
};

/**
 * 用于包裹内部的成员的轮廓。
 * convex hull(凸包)：http://geomalgorithms.com/a10-_hull-1.html#Monotone%20Chain
 * bubble: 使用 bubbleset算法，refer: http://vialab.science.uoit.ca/wp-content/papercite-data/pdf/col2009c.pdf
 * 通过配置 padding 可以调节包裹轮廓对节点的松紧程度
 */
export default class Hull {
  id: string;

  graph: Graph;

  cfg: CustomCfg; // 各种配置数据, 拓展G6的配置

  path: any[][];

  group: IGroup;

  members: Item[];

  nonMembers: Item[];

  padding: number;

  bubbleCfg: Partial<BubblesetCfg>;

  type: string;

  constructor(graph: Graph, cfg: CustomCfg) {
    this.cfg = deepMix(this.getDefaultCfg(), cfg);
    this.graph = graph;
    this.id = this.cfg.id;
    this.group = this.cfg.group;
    // TODO 树布局会丢失点, 这里过滤掉, 可能会误判正常的脏数据
    this.members = this.cfg.members.map(item => (isString(item) ? graph.findById(item) : item)).filter(Boolean);
    if (!this.members.length) return;
    this.nonMembers = this.cfg.nonMembers.map(item => (isString(item) ? graph.findById(item) : item));
    this.setPadding();
    this.setType();
    this.path = this.calcPath(this.members, this.nonMembers);
    this.render();
  }

  /**
   * 默认配置
   */
  public getDefaultCfg(): CustomCfg {
    return {
      id: 'kw-subGroup',
      type: 'smooth-convex', // 'round-convex' |'smooth-convex' | 'bubble'
      members: [],
      nonMembers: [],
      style: { ...defaultStyles },
      styles: {},
      states: [],
      padding: 20
    };
  }

  /**
   * 设置轮廓的内边距
   */
  setPadding() {
    const nodeSize = this.members.length && this.members[0].getKeyShape().getCanvasBBox().width / 2;
    this.padding = this.cfg.padding > 0 ? this.cfg.padding + nodeSize : 10 + nodeSize;
    this.cfg.bubbleCfg = {
      nodeR0: this.padding - nodeSize,
      nodeR1: this.padding - nodeSize,
      morphBuffer: this.padding - nodeSize
    };
  }

  /**
   * 设置类型
   */
  setType() {
    this.type = this.cfg.type;
    if (this.members.length < 3) {
      this.type = 'round-convex';
    }
    if (this.type !== 'round-convex' && this.type !== 'smooth-convex' && this.type !== 'bubble') {
      this.type = 'round-convex';
    }
  }

  /**
   * 计算绘制轮廓的path
   * @param members 包裹的节点
   * @param nonMembers 避开的节点, 仅 bubble 生效
   * @returns path坐标 数组
   */
  calcPath(members: Item[], nonMembers: Item[]) {
    let contour;
    let path;
    let hull;
    switch (this.type) {
      case 'round-convex':
        contour = genConvexHull(members);
        hull = roundedHull(
          contour.map(p => [p.x, p.y]),
          this.padding
        );
        path = parsePathString(hull);
        break;
      case 'smooth-convex':
        contour = genConvexHull(members);
        if (contour.length === 2) {
          hull = roundedHull(
            contour.map(p => [p.x, p.y]),
            this.padding
          );
          path = parsePathString(hull);
        } else if (contour.length > 2) {
          hull = paddedHull(
            contour.map(p => [p.x, p.y]),
            this.padding
          );
          path = getClosedSpline(hull);
        }
        break;
      case 'bubble':
        contour = genBubbleSet(members, nonMembers, this.cfg.bubbleCfg);
        path = contour.length >= 2 && getClosedSpline(contour);
        break;
      default:
    }
    return path;
  }

  render() {
    try {
      if (this.group.destroyed) return;
      if (this.cfg?.states?.length === 0 && !this.cfg?.styles?.normal) {
        this.cfg.styles.normal = this.cfg.style;
      }
      const state = this.cfg.states?.[0] || 'normal';
      const style = this.cfg.styles?.[state];
      // 虚线模式
      if (this.cfg.mode === 'dashed' && state === 'normal') {
        style.lineDash = [8, 5];
        style.fillOpacity = 0;
      } else {
        style.lineDash = [];
        style.fillOpacity = 1;
      }

      this.group.addShape('path', {
        attrs: {
          path: this.path,
          ...style
        },
        id: this.id,
        name: this.cfg.id,
        shapeType: 'subGroup' // 标记为子图
        // capture: false, // 是否可以被事件捕获
      });
      this.group.toBack();
    } catch (err) {}
  }

  /**
   * 增加hull的成员，同时如果该成员原先在nonMembers中，则从nonMembers中去掉
   * @param item 节点实例
   * @return boolean 添加成功返回 true，否则返回 false
   */
  public addMember(item: Item | string): boolean {
    if (!item) return;
    if (isString(item)) item = this.graph.findById(item);
    this.members.push(item);
    const index = this.nonMembers.indexOf(item);
    if (index > -1) {
      this.nonMembers.splice(index, 1);
    }
    this.updateData(this.members, this.nonMembers);
    return true;
  }

  /**
   * 增加hull需要排除的节点，同时如果该成员原先在members中，则从members中去掉
   * @param item 节点实例
   * @return boolean 添加成功返回 true，否则返回 false
   */
  public addNonMember(item: Item | string): boolean {
    if (!item) return;
    if (isString(item)) item = this.graph.findById(item);
    this.nonMembers.push(item);
    const index = this.members.indexOf(item);
    if (index > -1) {
      this.members.splice(index, 1);
    }
    this.updateData(this.members, this.nonMembers);
    return true;
  }

  /**
   * 移除hull中的成员
   * @param node 节点实例
   * @return boolean 移除成功返回 true，否则返回 false
   */
  public removeMember(item: Item | string): boolean {
    if (!item) return;
    if (isString(item)) item = this.graph.findById(item);
    const index = this.members.indexOf(item);
    if (index > -1) {
      this.members.splice(index, 1);
      this.updateData(this.members, this.nonMembers);
      return true;
    }
    return false;
  }

  /**
   * @param node 节点实例
   * @return boolean 移除成功返回 true，否则返回 false
   */
  public removeNonMember(item: Item | string): boolean {
    if (!item) return;
    if (isString(item)) item = this.graph.findById(item);
    const index = this.nonMembers.indexOf(item);
    if (index > -1) {
      this.nonMembers.splice(index, 1);
      this.updateData(this.members, this.nonMembers);
      return true;
    }
    return false;
  }

  public updateData(members: Item[] | string[], nonMembers?: string[] | Item[]) {
    this.group.findById(this.id)?.remove();
    if (members) this.members = (members as any[]).map(item => (isString(item) ? this.graph.findById(item) : item));
    if (nonMembers) {
      this.nonMembers = (nonMembers as any[]).map(item => (isString(item) ? this.graph.findById(item) : item));
    }
    const isDestroyed = _.some(members, m => {
      if (!m) return true;
      return m?.destroyed || !m?.get('visible');
    });
    if (isDestroyed) return;
    this.path = this.calcPath(this.members, this.nonMembers);
    this.setPadding();
    this.render();
  }

  public updateStyle(cfg: CustomCfg['style'], states?: string[]) {
    try {
      if (Array.isArray(states)) this.cfg.states = states;
      if (states?.[0]) this.cfg.styles[states?.[0]] = cfg;
      const path = this.group.findById(this.id);
      path.attr({
        ...cfg
      });
    } catch {
      //
    }
  }

  /**
   * 更新 hull
   * @param cfg hull 配置项
   * @param isRefresh 是否重新绘制
   */
  public updateCfg(cfg: Partial<CustomCfg>, isRefresh = true) {
    this.cfg = deepMix(this.cfg, cfg);
    if (!isRefresh) return;
    this.id = this.cfg.id;
    this.group = this.cfg.group;
    if (cfg.members) {
      this.members = this.cfg.members.map(item => (isString(item) ? this.graph.findById(item) : item));
    }
    if (cfg.nonMembers) {
      this.nonMembers = this.cfg.nonMembers.map(item => (isString(item) ? this.graph.findById(item) : item));
    }
    // TODO padding 设置太大，会影响到 contain 结果
    this.setPadding();
    this.setType();
    this.path = this.calcPath(this.members, this.nonMembers);
    this.render();
  }

  /**
   * 判断是否在hull内部
   * @param item
   */
  public contain(item: Item | string): boolean {
    let nodeItem: Item;
    if (isString(item)) {
      nodeItem = this.graph.findById(item);
    } else {
      nodeItem = item;
    }
    let shapePoints;
    const shape = nodeItem.getKeyShape();
    if (nodeItem.get('type') === 'path') {
      shapePoints = pathToPoints(shape.attr('path'));
    } else {
      const shapeBBox = shape.getCanvasBBox();
      shapePoints = [
        [shapeBBox.minX, shapeBBox.minY],
        [shapeBBox.maxX, shapeBBox.minY],
        [shapeBBox.maxX, shapeBBox.maxY],
        [shapeBBox.minX, shapeBBox.maxY]
      ];
    }
    shapePoints = shapePoints.map(canvasPoint => {
      const point = this.graph.getPointByCanvas(canvasPoint[0], canvasPoint[1]);
      return [point.x, point.y];
    });
    return isPolygonsIntersect(shapePoints, pathToPoints(this.path));
  }

  public destroy() {
    this.group.remove();
    this.cfg = null;
  }
}
