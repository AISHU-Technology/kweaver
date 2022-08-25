import React, { Component } from 'react';
import * as d3 from 'd3';
import intl from 'react-intl-universal';
import './style.less';

class GraphShow extends Component {
  nodes = []; // 绘制节点

  edges = []; // 绘制边

  links = {}; // 边(连线)

  linksTextShow = {}; // 箭头线上的文字

  nodeTextShow = {}; // 节点上文字描述

  gs = {}; // 节点

  createEdge = []; // 创建边

  addEdgeSignal = false;

  selectedNodes = []; // 需要连线的节点

  markerStartColor = [];

  markerEndColor = [];

  markerRingColor = [];

  componentDidUpdate(preProps) {
    if (preProps.graphData !== this.props.graphData) {
      d3.select('#preGraphEntityGraph').remove();

      if (this.props.graphData) {
        this.createGraph(this.setGraphShowData(this.props.graphData));
      }
    }
  }

  /**
   * @description 设置渲染图需要的数据
   * @param {object} inputData 输入的数据
   */
  setGraphShowData = inputData => {
    const { entity, edge } = inputData;
    let lines = [];

    for (let i = 0; i < edge.length; i++) {
      lines = [
        ...lines,
        this.handleEdge(lines, {
          source: this.findNodeIndex(edge[i].relations[0], entity),
          target: this.findNodeIndex(edge[i].relations[2], entity),
          lineLength: 200,
          relation: edge[i].name,
          alias: edge[i].alias,
          color: edge[i].colour
        })
      ];
    }

    return { nodes: entity, edges: lines };
  };

  /**
   * @description 处理起点与终点相同的边
   * @param {Array} edges 边集合
   * @param {object} newEdge 新增的边
   */

  handleEdge = (edges, newEdge) => {
    let shirft = 2;
    let radius = 50;
    const copyNewEdge = newEdge;
    let sigal = true;

    if (copyNewEdge.source === copyNewEdge.target) {
      for (let i = 0; i < edges.length; i++) {
        if (copyNewEdge.source === edges[i].source && copyNewEdge.source === edges[i].target) {
          radius += 50;
        }
      }

      copyNewEdge.radius = radius;

      return copyNewEdge;
    }

    for (let i = 0; i < edges.length; i++) {
      if (
        (copyNewEdge.source === edges[i].source && copyNewEdge.target === edges[i].target) ||
        (copyNewEdge.source === edges[i].target && copyNewEdge.target === edges[i].source && sigal)
      ) {
        shirft *= 0.8;
        sigal = false;

        // eslint-disable-next-line no-continue
        continue;
      }

      if (copyNewEdge.source === edges[i].source && copyNewEdge.target === edges[i].target) {
        shirft *= 0.8;
      }
    }

    copyNewEdge.shirft = shirft;

    return copyNewEdge;
  };

  /**
   * @description 查找输入节点在数组中的下标
   * @param {string} name 需要查找的名字
   */
  findNodeIndex = (name, arr) => {
    for (let i = 0; i < arr.length; i++) {
      if (name === arr[i].name) {
        return i;
      }
    }
  };

  /**
   * @description 渲染知识图谱
   * @param {Array} nodes 点集合
   * @param {Array} edges 边集合
   */
  createGraph = ({ nodes, edges }) => {
    /**
     * @description 拖拽开始
     * @param {object} d 拖拽对象
     */
    const started = d => {
      if (!d3.event.active) {
        forceSimulation.alphaTarget(0.8).restart();
      }

      d.fx = d.x;
      d.fy = d.y;
    };

    /**
     * @description 拖拽中
     * @param {object} d 拖拽对象
     */
    const dragged = d => {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    };

    /**
     * @description 拖拽结束
     * @param {object} d 拖拽对象
     */
    const ended = d => {
      if (!d3.event.active) {
        forceSimulation.alphaTarget(0);
      }
      // d.fx = null; // 节点拖拽结束后的位置，注释掉的话，节点位置会变
      // d.fy = null; // 节点拖拽结束后的位置，注释掉的话，节点位置会变
    };

    /**
     * @description 渲染图形位置
     */
    const render = () => {
      // 线的位置
      this.links
        .attr('d', d => {
          if (d.radius) {
            return `M${d.target.x} ${d.target.y} A ${d.radius} ${d.radius}, 0,1,1, ${d.target.x + 2 * d.radius} ${
              d.target.y
            } A ${d.radius} ${d.radius}, 0,1,1, ${d.target.x} ${d.target.y}`;
          }

          let dr = 0; // Math.random()*1000

          if (d.shirft < 2) {
            const dx = d.target.x - d.source.x; // 增量
            const dy = d.target.y - d.source.y;

            dr = d.shirft * Math.sqrt(dx * dx + dy * dy);
          }

          if (d.target.x > d.source.x) {
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
          }

          return `M${d.target.x},${d.target.y}A${dr},${dr} 0 0,0 ${d.source.x},${d.source.y}`;
        })
        // .attr('marker-mid', d => {
        //   if (d.radius) {
        //     return markerRing(d.color);
        //   }

        //   return '';
        // })
        .attr('marker-start', d => {
          if (d.radius) {
            return markerRing(d.color, -2 * d.radius);
          }

          if (!d.radius && d.source.x >= d.target.x) {
            return markerStart(d.color);
          }

          return null;
        })
        .attr('marker-end', d => {
          if (!d.radius && d.source.x < d.target.x) {
            return markerEnd(d.color);
          }

          return null;
        });

      // 线上的文字的位置
      this.linksTextShow
        .attr('x', d => {
          if (d.radius) {
            return d.target.x + 2 * d.radius - 30;
          }

          const dx = Math.abs(d.source.x - d.target.x);
          const dy = Math.abs(d.source.y - d.target.y);
          const temp = d.relations + d.alias;

          const wordShirft = temp.length * 4;

          return Math.sqrt(dx * dx + dy * dy) / 2 - wordShirft;
        })
        .attr('y', d => {
          if (d.radius) {
            if ((d.radius / 50) % 2 === 0) {
              return d.target.y + 50;
            }

            return d.target.y - 50;
          }

          return 0;
        })
        .attr('transform', d => {
          // 在Y轴上点偏移量
          if (d.source.x < d.target.x) {
            return 'translate(0,-5)';
          }

          return 'translate(0,5)';
        })
        .attr('dominant-baseline', d => {
          if (d.source.x < d.target.x) {
            return 'text-after-edge';
          }

          return 'text-before-edge';
        });

      // 圆点的位置
      this.gs.attr('transform', (d, i) => {
        return `translate(${d.x},${d.y})`;
      });

      // 节点文字描述的位置
      this.nodeTextShow
        .attr('x', d => {
          return d.x;
        })
        .attr('y', d => {
          return d.y - 30;
        });

      if (forceSimulation.alpha() <= 0.3) {
        // 固定节点位置
        this.gs.attr('transform', (d, i) => {
          d.fx = d.x;
          d.fy = d.y;

          return `translate(${d.x},${d.y})`;
        });

        forceSimulation.stop();
      }
    };

    /**
     * @description 缩放函数
     */
    const zoomed = () => {
      const { transform } = d3.event;

      g.attr('transform', transform);
      this.nodeTextShow.attr('transform', transform);
    };

    // 设置缩放
    const zoom = d3.zoom().scaleExtent([0.1, 8]).on('zoom', zoomed);

    // 添加图例dom节点svg
    const svg = d3
      .select('#premainShow')
      .append('svg')
      .attr('id', 'preGraphEntityGraph')
      .attr('width', document.getElementById('premainShow') && document.getElementById('premainShow').clientWidth)
      .attr('height', document.getElementById('premainShow') && document.getElementById('premainShow').clientHeight)
      .call(zoom)
      .on('dblclick.zoom', null);

    // 添加svg节点
    const g = svg.append('g');

    // tip提示
    const d3Tooltip = d3
      .select('#premainShow')
      .append('div')
      .attr('class', 'd3-tooltip-showF')
      .style('display', 'none');

    /**
     * @description 箭头(连接线的箭头)
     * @param {string} color 箭头颜色(使用16进制写法)
     */
    const markerEnd = color => {
      const reg = new RegExp(`${color}`);

      // 避免重复渲染
      if (reg.test(`${this.markerEndColor}`)) {
        return `url(#end${color})`;
      }

      this.markerEndColor = [...this.markerEndColor, color];

      svg
        .append('marker')
        .attr('id', `end${color}`)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('viewBox', '0 -5 10 10') // 坐标系的区域
        .attr('refX', 31) // 箭头在线上的坐标位置 X轴
        .attr('refY', 0) // Y轴
        .attr('markerWidth', 10) // 标识的大小
        .attr('markerHeight', 10)
        .attr('orient', 'auto') // 绘制方向，可设定为：auto（自动确认方向）和 角度值
        .attr('stroke-width', 1.5) // 箭头宽度
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5') // 箭头的样式
        .attr('fill', color); // 箭头颜色

      return `url(#end${color})`;
    };

    const markerStart = color => {
      const reg = new RegExp(`${color}`);

      // 避免重复渲染
      if (reg.test(`${this.markerStartColor}`)) {
        return `url(#start${color})`;
      }

      this.markerStartColor = [...this.markerStartColor, color];

      svg
        .append('marker')
        .attr('id', `start${color}`)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('viewBox', '0 -5 10 10') // 坐标系的区域
        .attr('refX', -21) // 箭头在线上的坐标位置 X轴
        .attr('refY', 0) // Y轴
        .attr('markerWidth', 10) // 标识的大小
        .attr('markerHeight', 10)
        .attr('orient', 'auto') // 绘制方向，可设定为：auto（自动确认方向）和 角度值
        .attr('stroke-width', 1.5) // 箭头宽度
        .append('path')
        .attr('d', 'M0,0L10,-5L10,5') // 箭头的样式
        .attr('fill', color); // 箭头颜色

      return `url(#start${color})`;
    };

    const markerRing = (color, refY) => {
      const reg = new RegExp(`${color}${refY}`);

      if (reg.test(`${this.markerRingColor}`)) {
        return `url(#ring${color})`;
      }

      this.markerRingColor = [...this.markerRingColor, `${color}${refY}`];

      svg
        .append('marker')
        .attr('id', `ring${color}`)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('viewBox', '0 -5 10 10') // 坐标系的区域
        .attr('refX', 0) // 箭头在线上的坐标位置 X轴
        .attr('refY', refY) // Y轴
        .attr('markerWidth', 10) // 标识的大小
        .attr('markerHeight', 10)
        .attr('orient', 'auto') // 绘制方向，可设定为：auto（自动确认方向）和 角度值
        .attr('stroke-width', 1.5) // 箭头宽度
        .append('path')
        .attr('d', 'M0,0L10,-5L10,5') // 箭头的样式
        .attr('fill', color); // 箭头颜色

      return `url(#ring${color})`;
    };

    const forceSimulation = d3
      .forceSimulation()
      .force('link', d3.forceLink())
      .force('charge', d3.forceManyBody().strength(-1)) // 作用力应用在所用的节点之间，当strength为正的时候可以模拟重力，当为负的时候可以模拟电荷力。
      .force(
        'center',
        d3
          .forceCenter()
          .x(document.getElementById('premainShow') && document.getElementById('premainShow').clientWidth / 2)
          .y(document.getElementById('premainShow') && document.getElementById('premainShow').clientHeight / 2)
      ) // 力导向图中心位置
      .force('collision', d3.forceCollide(100)); // 设置节点碰撞半径>= 点半径避免重叠

    // 图渲染
    forceSimulation.nodes(nodes).on('tick', render);

    // 生成边集
    forceSimulation
      .force('link')
      .links(edges)
      .distance(d => {
        return d.lineLength; // 边的长度
      });

    this.links = g
      .append('g')
      .selectAll('lineGraphShow')
      .data(edges)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', d => {
        return d.color;
      })
      .attr('id', (d, i) => {
        return `edgepathGraphShow${i}`;
      })
      .on('mouseover', d => {
        d3Tooltip
          .html(
            d.alias
              ? `<div>
          <div class="name">${[intl.get('createEntity.reN')]}</div>
          <div class="des">${d.relation}</div>
          <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
          <div class="des">${d.alias}</div>
        </div>`
              : `<div>
        <div class="name">${[intl.get('createEntity.reN')]}</div>
        <div class="des">${d.relation}</div>
        <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
          <div class="des">- -</div>
      </div>`
          )
          .style('display', 'block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY + 20}px`);
      })
      .on('mouseout', d => {
        d3Tooltip.style('display', 'none');
      });

    // 箭头线上的文字
    this.linksTextShow = g
      .append('g')
      .selectAll('.edgelabelGraphShow')
      .data(edges)
      .enter()
      .append('text')
      .text((d, i) => {
        if (d.radius) {
          let temp = d.relation;

          if (d.alias) {
            // temp = `${d.relation}【${d.alias}】`;
            temp = d.alias;
          }

          if (temp.length < 20) {
            return temp;
          }

          return `${temp.substring(0, 17)}...`;
        }

        return '';
      })
      .attr('fill', (d, i) => {
        return '#242B45'; // 箭头字体颜色
      })
      .attr('font-size', 14) // 文字大小;
      .attr('cursor', 'default')
      .on('mouseover', d => {
        d3Tooltip
          .html(
            d.alias
              ? `<div>
          <div class="name">${[intl.get('createEntity.reN')]}</div>
          <div class="des">${d.relation}</div>
          <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
          <div class="des">${d.alias}</div>
        </div>`
              : `<div>
        <div class="name">${[intl.get('createEntity.reN')]}</div>
        <div class="des">${d.relation}</div>
        <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
          <div class="des">- -</div>
      </div>`
          )
          .style('display', 'block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY + 20}px`);
      })
      .on('mouseout', d => {
        d3Tooltip.style('display', 'none');
      });

    this.linksTextShow
      .append('textPath')
      .attr('xlink:href', (d, i) => {
        return `#edgepathGraphShow${i}`;
      })
      .text((d, i) => {
        if (d.radius) {
          return '';
        }

        let temp = d.relation;

        if (d.alias) {
          // temp = `${d.relation}【${d.alias}】`;
          temp = d.alias;
        }

        if (temp.length < 20) {
          return temp;
        }

        return `${temp.substring(0, 17)}...`;
      });

    // 节点上文字描述
    this.nodeTextShow = svg
      .selectAll('nodeTextGraphShow')
      .data(nodes)
      .enter()
      .append('text')
      .text((d, i) => {
        let temp = d.name;

        if (d.alias) {
          // temp = `${d.name}【${d.alias}】`;
          temp = d.alias;
        }

        if (temp.length < 15) {
          return temp;
        }

        return `${temp.substring(0, 12)}...`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', 14) // 文字大小
      .attr('cursor', 'default')
      .attr('fill', (d, i) => {
        return '#242B45';
      });

    // 节点
    this.gs = g
      .selectAll('circleGraphShow')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'graph-node')
      .attr('r', 20) // 节点大小
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('fill', (d, i) => {
        return d.colour;
      })
      .on('mouseover', d => {
        d3Tooltip
          .html(
            d.alias
              ? `<div>
          <div class="name">${[intl.get('createEntity.ecn')]}</div>
          <div class="des">${d.name}</div>
          <div class="nick-name">${[intl.get('createEntity.acn')]}</div>
          <div class="des">${d.alias}</div>
        </div>`
              : `<div>
        <div class="name">${[intl.get('createEntity.ecn')]}</div>
        <div class="des">${d.name}</div>
        <div class="nick-name">${[intl.get('createEntity.acn')]}</div>
          <div class="des">- -</div>
      </div>`
          )
          .style('display', 'block')
          .style('left', `${d3.event.pageX}px`)
          .style('top', `${d3.event.pageY + 20}px`);
      })
      .on('mouseout', d => {
        d3Tooltip.style('display', 'none');
      })
      .call(
        // 拖拽设置
        d3.drag().on('start', started).on('drag', dragged).on('end', ended)
      );
  };

  render() {
    return (
      <div className="graph-show">
        <div id="premainShow"></div>
      </div>
    );
  }
}

export default GraphShow;
