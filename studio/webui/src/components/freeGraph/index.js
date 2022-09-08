/* eslint-disable max-lines */
/**
 * 创建图谱
 */

import React, { Component } from 'react';
import * as d3 from 'd3';
import intl from 'react-intl-universal';

import servicesCreateEntity from '@/services/createEntity';
import {
  handleExternalImport,
  setColor,
  setEdgeShift,
  getNodesToEdgesId,
  changeNodeInfo,
  changeEdgeInfo,
  handleBatchAddEdges,
  handleTaskImport,
  isFlow
} from './assistFunction';

import five from '@/assets/images/five.svg';
import './style.less';

const RECTWIDTH = 80;

class FreeGraph extends Component {
  forceSimulation = ''; // 力引导图

  svg = ''; // 绘图区

  edgeGroup = ''; // 图元素线集合

  nodeGroup = ''; // 图元素点集合

  entity_id = 1; // 点id

  edge_id = 1;

  selectedNodes = []; // 需要连线的节点

  hasDraged = []; // 被拖拽过的节点

  isFistLoading = true;

  markerStartColor = [];

  markerEndColor = [];

  markerRingColor = [];

  componentDidMount() {
    this.props.onFreeGraphRef(this);

    window.addEventListener('click', this.cancelCreate);
    window.addEventListener('mousemove', this.mousemove);

    // 本体库创建图谱
    if (!isFlow()) {
      this.initData();

      this.createGraph();
    }
  }

  componentDidUpdate(prevProps) {
    //  流程里创建图谱
    if (prevProps.current !== this.props.current && this.props.current === 2 && this.isFistLoading) {
      window.addEventListener('click', this.cancelCreate);
      window.addEventListener('mousemove', this.mousemove);

      this.initData();

      this.createGraph();

      this.isFistLoading = false;
    }

    if (prevProps.centerSelect !== this.props.centerSelect) {
      this.selectedNodes = [];
    }

    if (this.props.selectedElement !== prevProps.selectedElement) {
      this.selectHighLight(this.props.selectedElement);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.cancelCreate);
    window.removeEventListener('mousemove', this.mousemove);
  }

  /**
   * @description 点击空白区域取消操作
   */
  cancelCreate = e => {
    const { dataInfoRef, selectedElement } = this.props;

    if (!e) {
      return;
    }

    if (
      selectedElement &&
      selectedElement.model &&
      e.srcElement.localName === 'svg' &&
      e.srcElement.id === 'createEntityGraph'
    ) {
      this.selectedNodes = [];

      if (this.connectLine) {
        this.connectLine.remove();
        this.connectLine = '';
      }

      this.props.selectCenterTool();
      this.props.selectRightTool('', true);
      this.props.setSelectedElement('');
      this.edgeGroup.selectAll('.graph-rect').remove();

      return;
    }

    if (dataInfoRef && dataInfoRef.formNameRef.current) {
      const { checkData } = dataInfoRef.state;

      this.props.dataInfoRef.formNameRef.current
        .validateFields()
        .then(() => {
          if (checkData.isIncorrect) {
            return;
          }

          if (this.connectLine && e.srcElement.localName === 'path') {
            this.selectedNodes = [];
            this.connectLine.remove();
            this.connectLine = '';
          }

          if (e.srcElement.localName !== 'svg') {
            return;
          }

          if (e.srcElement.localName === 'svg' && e.srcElement.id === 'createEntityGraph') {
            this.selectedNodes = [];

            if (this.connectLine) {
              this.connectLine.remove();
              this.connectLine = '';
            }

            this.props.selectCenterTool();
            this.props.selectRightTool();
            this.props.setSelectedElement('');
            this.edgeGroup.selectAll('.graph-rect').remove();
          }
        })
        .catch(() => {});

      return;
    }

    if (this.connectLine && e.srcElement.localName === 'path') {
      this.selectedNodes = [];
      this.connectLine.remove();
      this.connectLine = '';
    }

    if (e.srcElement.localName !== 'svg') {
      return;
    }

    if (e.srcElement.localName === 'svg' && e.srcElement.id === 'createEntityGraph') {
      this.selectedNodes = [];

      if (this.connectLine) {
        this.connectLine.remove();
        this.connectLine = '';
      }

      this.props.selectCenterTool();
      this.props.selectRightTool();
      this.props.setSelectedElement('');
      this.edgeGroup.selectAll('.graph-rect').remove();
    }
  };

  /**
   * @description 鼠标移动事件
   */
  mousemove = e => {
    if (
      this.connectLine &&
      this.selectedNodes.length === 1 &&
      (e.srcElement.localName === 'svg' || e.srcElement.localName === 'circle')
    ) {
      const endX = isFlow() ? e.pageX + document.getElementById('newWorkFlowScroll').scrollLeft : e.pageX;
      const endY = isFlow() ? e.pageY - 54 + document.getElementById('newWorkFlowScroll').scrollTop : e.pageY;

      const p = d3.path();

      p.moveTo(this.startConnectX, this.startConnectY);

      p.lineTo(endX, endY);

      this.connectLine.attr('d', p);
    }
  };

  /**
   * @description 初始化配置数据
   */
  initData = () => {
    this.forceSimulation = d3
      .forceSimulation()
      .force('link', d3.forceLink())
      .force('charge', d3.forceManyBody().strength(-1)) // 作用力应用在所用的节点之间，当strength为正的时候可以模拟重力，当为负的时候可以模拟电荷力。
      .force(
        'center',
        d3
          .forceCenter()
          .x(document.getElementById('freeGraphMain') && document.getElementById('freeGraphMain').clientWidth / 2)
          .y(document.getElementById('freeGraphMain') && document.getElementById('freeGraphMain').clientHeight / 2)
      ) // 力导向图中心位置
      .force('collision', d3.forceCollide(100)); // 设置节点碰撞半径>= 点半径避免重叠

    this.svg = d3
      .select('#freeGraphMain')
      .append('svg')
      .attr('id', 'createEntityGraph')
      .attr('width', document.getElementById('freeGraphMain') && document.getElementById('freeGraphMain').clientWidth)
      .attr(
        'height',
        document.getElementById('freeGraphMain') && document.getElementById('freeGraphMain').clientHeight
      );

    // tip提示
    this.d3Tooltip = d3
      .select('#freeGraphMain')
      .append('div')
      .attr('class', 'd3-tooltip-new-create-qsx')
      .style('display', 'none');

    this.addPath = this.svg.append('g');
    this.edgeGroup = this.svg.append('g');
    this.nodeGroup = this.svg.append('g');
  };

  /**
   * @description 拖拽开始
   * @param {object} d 拖拽对象
   */
  started = d => {
    this.hasDraged = [...this.hasDraged, d.entity_id];

    if (!d3.event.active) {
      this.forceSimulation.alphaTarget(0.8).restart();
    }

    d.fx = d.x;
    d.fy = d.y;
  };

  /**
   * @description 拖拽中
   * @param {object} d 拖拽对象
   */
  dragged = d => {
    // 建立边的时候不能拖拽
    if (this.connectLine) {
      return;
    }

    d.fx = d3.event.x;
    d.fy = d3.event.y;
  };

  /**
   * @description 拖拽结束
   * @param {object} d 拖拽对象
   */
  ended = d => {
    if (!d3.event.active) {
      this.forceSimulation.alphaTarget(0);
    }

    // d.fx = null; // 节点拖拽结束后的位置，注释掉的话，节点位置会变
    // d.fy = null; // 节点拖拽结束后的位置，注释掉的话，节点位置会变
  };

  /**
   * @description 箭头(连接线的箭头)
   * @param {string} color 箭头颜色(使用16进制写法)
   */
  markerEnd = color => {
    const reg = new RegExp(`${color}`);

    // 避免重复渲染
    if (reg.test(`${this.markerEndColor}`)) {
      return `url(#end${color})`;
    }

    this.markerEndColor = [...this.markerEndColor, color];

    this.svg
      .append('marker')
      .attr('id', `end${color}`)
      .attr('class', 'no-delete-marker')
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

  markerStart = color => {
    const reg = new RegExp(`${color}`);

    // 避免重复渲染
    if (reg.test(`${this.markerStartColor}`)) {
      return `url(#start${color})`;
    }

    this.markerStartColor = [...this.markerStartColor, color];

    this.svg
      .append('marker')
      .attr('id', `start${color}`)
      .attr('class', 'no-delete-marker')
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

  markerRing = (color, refY) => {
    const reg = new RegExp(`${color}${refY}`);

    if (reg.test(`${this.markerRingColor}`)) {
      return `url(#ring${color})`;
    }

    this.markerRingColor = [...this.markerRingColor, `${color}${refY}`];

    this.svg
      .append('marker')
      .attr('id', `ring${color}`)
      .attr('class', 'delete-marker')
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

  /**
   * @description 构建图谱
   */
  createGraph = () => {
    /**
     * @description 缩放函数
     */
    const zoomed = () => {
      if (this.connectLine) {
        return;
      }

      const { transform } = d3.event;

      this.edgeGroup.attr('transform', transform);
      this.nodeGroup.attr('transform', transform);
    };

    // 设置缩放
    const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', zoomed);

    // 添加图例dom节点svg
    this.svg.call(zoom).on('dblclick.zoom', null);

    // 点渲染
    this.forceSimulation.nodes(this.props.nodes).on('tick', this.tick);

    // 边渲染
    this.forceSimulation
      .force('link')
      .links(this.props.edges)
      .distance(d => {
        return d.lineLength; // 边的长度
      });

    // 边
    this.edgeGroup
      .selectAll('line')
      .data(this.props.edges)
      .enter()
      .append('path')
      .attr('class', 'link-node')
      .attr('id', (d, i) => {
        return `edgepath${d.edge_id}`;
      })
      .attr('stroke', d => {
        return d.colour;
      })
      .on('click', (d, i) => {
        this.clickEdge(d, i);
      });

    this.edgeGroup
      .selectAll('edgeText')
      .data(this.props.edges)
      .enter()
      .append('text')
      .attr('class', 'edge-des')
      .text((d, i) => {
        if (d.radius) {
          let temp = d.name;

          if (d.alias) {
            // temp = `${d.name}【${d.alias}】`;
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
      .attr('font-size', 14); // 文字大小;

    // 边的描述
    this.edgeGroup
      .selectAll('edgeText')
      .data(this.props.edges)
      .enter()
      .append('text')
      .attr('class', 'edge-des')
      .attr('fill', (d, i) => {
        return '#242B45'; // 箭头字体颜色
      })
      .append('textPath')
      .attr('xlink:href', (d, i) => {
        if (d.radius) {
          return '';
        }

        return `#edgepath${d.edge_id}`;
      })
      .text((d, i) => {
        if (!d.radius) {
          let temp = d.name;

          if (d.alias) {
            // temp = `${d.name}【${d.alias}】`;
            temp = d.alias;
          }

          if (temp.length < 20) {
            return temp;
          }

          return `${temp.substring(0, 17)}...`;
        }

        return '';
      })
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
            .html(
              d.alias
                ? `<div>
              <div class="name">${[intl.get('createEntity.reN')]}</div>
              <div class="des">${d.name}</div>
              <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
              <div class="des">${d.alias}</div>
            </div>`
                : `<div>
            <div class="name">${[intl.get('createEntity.reN')]}</div>
            <div class="des">${d.name}</div>
            <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
              <div class="des">- -</div>
          </div>`
            )
            .style('display', 'block')
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickEdge(d, i);
      });

    // 节点
    this.nodeGroup
      .selectAll('circle')
      .data(this.props.nodes)
      .enter()
      .append('circle')
      .attr('class', 'graph-node')
      .attr('r', 20) // 节点大小
      .attr('fill', (d, i) => {
        return d.colour;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .call(
        // 拖拽设置
        d3.drag().on('start', this.started).on('drag', this.dragged).on('end', this.ended)
      )
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
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
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickNode(d, i);
      });

    // 节点描述
    this.nodeGroup
      .selectAll('nodeText')
      .data(this.props.nodes)
      .enter()
      .append('text')
      .attr('class', 'node-des')
      .text((d, i) => {
        let temp = d.name;

        if (d.alias) {
          // temp = `${d.name}【${d.alias}】`;
          temp = d.alias;
        }

        if (temp.length < 20) {
          return temp;
        }

        return `${temp.substring(0, 17)}...`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', 14) // 文字大小
      .attr('fill', (d, i) => {
        return '#242B45';
      });

    // 文件五星
    this.nodeGroup
      .selectAll('select-task-icon')
      .data(this.props.nodes)
      .enter()
      .append('svg:image')
      .attr('class', 'five-icon')
      .attr('width', '19px')
      .attr('height', '18px')
      .attr('href', five)
      .attr('opacity', d => {
        return 0;
      })
      .call(
        // 拖拽设置
        d3.drag().on('start', this.started).on('drag', this.dragged).on('end', this.ended)
      )
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
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
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickNode(d, i);
      });

    // 创建边的时候，移动线的箭头
    this.addPath
      .append('marker')
      .attr('id', 'addPath')
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '0 -5 10 10') // 坐标系的区域
      .attr('refX', 10) // 箭头在线上的坐标位置 X轴
      .attr('refY', 0) // Y轴
      .attr('markerWidth', 10) // 标识的大小
      .attr('markerHeight', 10)
      .attr('orient', 'auto') // 绘制方向，可设定为：auto（自动确认方向）和 角度值
      .attr('stroke-width', 1.5) // 箭头宽度
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5') // 箭头的样式
      .attr('fill', '#54639C'); // 箭头颜色
  };

  /**
   * @description 图谱渲染
   */
  tick = () => {
    // this.svg.selectAll('.delete-marker').remove();
    this.nodeGroup.selectAll('circle').attr('transform', (d, i) => {
      return `translate(${d.x},${d.y})`;
    });

    this.nodeGroup.selectAll('.five-icon').attr('transform', (d, i) => {
      return `translate(${d.x - 9},${d.y - 9})`;
    });

    // 点上文字的位置
    this.nodeGroup
      .selectAll('.node-des')
      .attr('x', (d, i) => {
        return d.x;
      })
      .attr('y', (d, i) => {
        return d.y - 30;
      });

    // 选中点的样式
    this.edgeGroup.selectAll('.graph-rect').attr('transform', (d, i) => {
      return `translate(${d.x - RECTWIDTH / 2},${d.y - RECTWIDTH / 2})`;
    });

    // 线位置
    this.edgeGroup
      .selectAll('.link-node')
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
      .attr('marker-start', d => {
        if (d.radius) {
          return this.markerRing(d.colour, -2 * d.radius);
        }

        if (!d.radius && d.source.x >= d.target.x) {
          return this.markerStart(d.colour);
        }

        return null;
      })
      .attr('marker-end', d => {
        if (!d.radius && d.source.x < d.target.x) {
          return this.markerEnd(d.colour);
        }

        return null;
      });

    // 边文字的位置
    this.edgeGroup
      .selectAll('.edge-des')
      .attr('x', d => {
        if (d.radius) {
          return d.target.x + 2 * d.radius - 30;
        }

        const dx = Math.abs(d.source.x - d.target.x);
        const dy = Math.abs(d.source.y - d.target.y);

        const temp = d.name + d.alias;

        let wordShirft = temp.length * 4;

        if (temp.length > 15) {
          wordShirft = 60;
        }

        return Math.sqrt(dx * dx + dy * dy) / 2 - wordShirft;
      })
      .attr('y', d => {
        if (d.radius) {
          if ((d.radius / 50) % 2 === 0) {
            return d.target.y + 50;
          }

          return d.target.y - 50;
        }

        // return (d.source.y + d.target.y) /2;

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

    if (this.forceSimulation.alpha() <= 0.3) {
      // 固定节点位置
      this.nodeGroup.selectAll('circle').attr('transform', (d, i) => {
        d.fx = d.x;
        d.fy = d.y;

        return `translate(${d.x},${d.y})`;
      });

      this.forceSimulation.stop();
    }
  };

  /**
   * @description 添加点
   */
  addNode = () => {
    let { nodes } = this.props;

    const freeGraphMain = document.getElementById('freeGraphMain');

    const x = freeGraphMain && freeGraphMain.offsetWidth / 2 + Math.random() * 100;
    const y = freeGraphMain && freeGraphMain.offsetHeight / 2 + Math.random() * 50;

    const newNode = {
      colour: setColor(),
      name: '',
      x,
      y,
      entity_id: this.entity_id,
      dataType: '',
      data_source: '',
      ds_name: '',
      ds_path: '',
      extract_type: '',
      file_type: '',
      ds_id: '',
      model: '',
      properties: [['name', 'string']],
      properties_index: ['name'],
      task_id: '',
      source_type: 'manual',
      source_table: [],
      ds_address: '',
      alias: ''
    };

    nodes = [...nodes, newNode];

    this.entity_id++;

    this.updateNodes(nodes);

    this.props.selectCenterTool('node');
    this.props.selectRightTool('dataInfo');

    this.props.setSelectedElement(newNode);
    this.props.setNodes(nodes);

    setTimeout(() => {
      if (this.props.dataInfoRef && this.props.dataInfoRef.formNameRef.current) {
        this.props.dataInfoRef.formNameRef.current.resetFields();
      }

      document.getElementById('dataInfoName') && document.getElementById('dataInfoName').focus();

      this.addClickStyle(newNode);
    }, 0);
  };

  // 加边
  addLine = (source, target) => {
    let { edges } = this.props;

    let addEdge = {
      source: source.index,
      target: target.index,
      start: source.entity_id,
      end: target.entity_id,
      lineLength: 200,
      name: `${source.name}_2_${target.name}`,
      edge_id: this.edge_id,
      colour: setColor(),
      dataType: '',
      ds_name: '',
      data_source: '',
      ds_id: '',
      extract_type: '',
      file_type: '',
      model: '',
      properties: [['name', 'string']],
      properties_index: ['name'],
      source_type: 'manual',
      task_id: '',
      source_table: [],
      ds_address: '',
      alias: `${source.name}_2_${target.name}`
    };

    this.edge_id++;

    addEdge = setEdgeShift(addEdge, edges);
    edges = [...edges, addEdge];

    this.updateEdges([addEdge], edges);
    this.props.setSelectedElement(addEdge);
    this.props.setEdges(edges);

    setTimeout(() => {
      document.getElementById('dataInfoName') && document.getElementById('dataInfoName').focus();
    }, 0);
  };

  clearAll = () => {
    this.nodeGroup.selectAll('circle').remove();
    this.nodeGroup.selectAll('.node-des').remove();
    this.edgeGroup.selectAll('.link-node').remove();
    this.edgeGroup.selectAll('.edge-des').remove();

    this.props.selectCenterTool();
    this.props.selectRightTool('', true);
    this.props.setSelectedElement('');
    this.edgeGroup.selectAll('.graph-rect').remove();
  };

  /**
   * @description 删除点
   */
  deleteNodes = deleteNodes => {
    const { nodes, edges } = this.props;

    // 删除点
    this.nodeGroup.selectAll('circle').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'graph-node';
    });

    // 删除点的描述
    this.nodeGroup.selectAll('.node-des').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'node-des';
    });

    this.nodeGroup.selectAll('.five-icon').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'five-icon';
    });

    this.edgeGroup.selectAll('.graph-rect').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'graph-rect';
    });

    const newNodes = nodes.filter((item, index) => {
      return !deleteNodes.includes(item.entity_id);
    });

    this.props.setNodes(newNodes);

    this.svg.selectAll('.delete-element').remove();

    // 删除点，相连的边删除
    this.deleteEdges(getNodesToEdgesId(deleteNodes, edges), nodes, newNodes, deleteNodes);
  };

  /**
   * @description 删除边
   */
  deleteEdges = (deleteEdges, oldNodes, newNodes, deleteNodes) => {
    const { edges } = this.props;

    this.edgeGroup.selectAll('.link-node').attr('class', (d, i) => {
      if (deleteEdges.includes(d.edge_id)) {
        return 'delete-element';
      }

      return 'link-node';
    });

    this.edgeGroup.selectAll('.edge-des').attr('class', (d, i) => {
      if (deleteEdges.includes(d.edge_id)) {
        return 'delete-element';
      }

      return 'edge-des';
    });

    const newEdges = edges.filter((item, index) => {
      return !deleteEdges.includes(item.edge_id);
    });

    this.props.setEdges(newEdges);

    this.svg.selectAll('.delete-element').remove();

    this.deleteTask({ deleteEdges, oldNodes, newNodes, deleteNodes, oldEdges: edges, newEdges });

    if (this.connectLine) {
      this.connectLine.remove();
      this.connectLine = '';
      this.selectedNodes = [];
    }
  };

  /**
   * @description 删除点不删任务
   */
  deleteNodesNoTask = deleteNodes => {
    const { nodes, edges } = this.props;

    // 删除点
    this.nodeGroup.selectAll('circle').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'graph-node';
    });

    // 删除点的描述
    this.nodeGroup.selectAll('.node-des').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'node-des';
    });

    this.nodeGroup.selectAll('.five-icon').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'five-icon';
    });

    this.edgeGroup.selectAll('.graph-rect').attr('class', (d, i) => {
      if (deleteNodes.includes(d.entity_id)) {
        return 'delete-element';
      }

      return 'graph-rect';
    });

    const newNodes = nodes.filter((item, index) => {
      return !deleteNodes.includes(item.entity_id);
    });

    this.props.setNodes(newNodes);

    this.svg.selectAll('.delete-element').remove();

    // 删除点，相连的边删除
    this.deleteEdgesNoTask(getNodesToEdgesId(deleteNodes, edges));
  };

  /**
   * @description 删除边不删任务
   */
  deleteEdgesNoTask = deleteEdges => {
    const { edges } = this.props;

    this.edgeGroup.selectAll('.link-node').attr('class', (d, i) => {
      if (deleteEdges.includes(d.edge_id)) {
        return 'delete-element';
      }

      return 'link-node';
    });

    this.edgeGroup.selectAll('.edge-des').attr('class', (d, i) => {
      if (deleteEdges.includes(d.edge_id)) {
        return 'delete-element';
      }

      return 'edge-des';
    });

    const newEdges = edges.filter((item, index) => {
      return !deleteEdges.includes(item.edge_id);
    });

    this.props.setEdges(newEdges);

    this.svg.selectAll('.delete-element').remove();

    if (this.connectLine) {
      this.connectLine.remove();
      this.connectLine = '';
      this.selectedNodes = [];
    }
  };

  /**
   * @description  删除点和边的时候导致的任务删除
   */
  deleteTask = async ({ deleteEdges, oldNodes, newNodes, deleteNodes, oldEdges, newEdges }) => {
    const PoldNodes = oldNodes || this.props.nodes;
    const PnewNodes = newNodes || this.props.nodes;
    const PdeleteNodes = deleteNodes || [];

    let deleteTaskId = [];

    PoldNodes.forEach((item, index) => {
      if (PdeleteNodes.includes(item.entity_id) && typeof item.task_id === 'number') {
        deleteTaskId = [...deleteTaskId, item.task_id];
      }
    });

    oldEdges.forEach((item, index) => {
      if (deleteEdges.includes(item.edge_id) && typeof item.task_id === 'number') {
        deleteTaskId = [...deleteTaskId, item.task_id];
      }
    });

    deleteTaskId = Array.from(new Set(deleteTaskId));

    let newTaskIdGroup = [];

    PnewNodes.forEach((item, index) => {
      newTaskIdGroup = [...newTaskIdGroup, item.task_id];
    });

    newEdges.forEach((item, index) => {
      newTaskIdGroup = [...newTaskIdGroup, item.task_id];
    });

    newTaskIdGroup = Array.from(new Set(newTaskIdGroup));

    deleteTaskId = deleteTaskId.filter((item, index) => {
      return !newTaskIdGroup.includes(item);
    });

    // 删除任务
    if (deleteTaskId.length > 0) {
      const res = await servicesCreateEntity.deleteEntityTask({ task_list: deleteTaskId });

      if (res && res.res) {
        // 如果使用的过的任务里有删除的任务，则在使用过的任务中删除该任务
        let { used_task } = this.props;

        used_task = used_task.filter((item, index) => {
          return !deleteTaskId.includes(item);
        });

        // 更新使用过的任务
        this.props.setUsedTask(used_task);

        // 更新右侧任务列表
        if (this.props.taskListRef) {
          this.props.taskListRef.getTaskList(true);
        }
      }
    }
  };

  /**
   * @description 更新点
   */
  updateNodes = nodes => {
    if (!this.nodeGroup) {
      return;
    }

    this.nodeGroup.selectAll('.node-des').remove();
    this.nodeGroup.selectAll('.five-icon').remove();

    this.nodeGroup
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'graph-node')
      .attr('r', 20) // 节点大小
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .call(
        // 拖拽设置
        d3.drag().on('start', this.started).on('drag', this.dragged).on('end', this.ended)
      )
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
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
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickNode(d, i);
      });

    this.nodeGroup
      .selectAll('nodeText')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'node-des')
      .text((d, i) => {
        let temp = d.name;

        if (d.alias) {
          // temp = `${d.name}【${d.alias}】`;
          temp = d.alias;
        }

        if (temp.length < 20) {
          return temp;
        }

        return `${temp.substring(0, 17)}...`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', 14) // 文字大小
      .attr('fill', (d, i) => {
        return '#242B45';
      });

    this.nodeGroup
      .selectAll('select-task-icon')
      .data(nodes)
      .enter()
      .append('svg:image')
      .attr('class', 'five-icon')
      .attr('width', '19px')
      .attr('height', '18px')
      .attr('href', five)
      .attr('opacity', d => {
        return 0;
      })
      .call(
        // 拖拽设置
        d3.drag().on('start', this.started).on('drag', this.dragged).on('end', this.ended)
      )
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
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
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickNode(d, i);
      });

    // 添加节点的时候关闭固定位置
    this.nodeGroup
      .selectAll('circle')
      .attr('fill', (d, i) => {
        return d.colour;
      })
      .attr('x', (d, i) => {
        if (!this.hasDraged.includes(d.entity_id)) {
          d.fx = null;
        }

        return d.x;
      })
      .attr('x', (d, i) => {
        if (!this.hasDraged.includes(d.entity_id)) {
          d.fy = null;
        }

        return d.y;
      });

    this.forceSimulation.nodes(nodes);

    this.forceSimulation.alpha(1).restart();

    this.selectHighLight(this.props.selectedElement);
  };

  /**
   * @description 更新边
   */
  updateEdges = (edges, allEdges) => {
    if (!this.edgeGroup) {
      return;
    }

    this.edgeGroup
      .selectAll('line')
      .data(edges)
      .enter()
      .append('path')
      .attr('id', (d, i) => {
        return `edgepath${d.edge_id}`;
      })
      .attr('class', 'link-node')
      .attr('stroke', d => {
        return d.colour;
      })
      .on('click', (d, i) => {
        this.clickEdge(d, i);
      });

    this.edgeGroup
      .selectAll('edgeText')
      .data(edges)
      .enter()
      .append('text')
      .attr('class', 'edge-des')
      .text((d, i) => {
        if (d.radius) {
          let temp = d.name;

          if (d.alias) {
            // temp = `${d.name}【${d.alias}】`;
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
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
            .html(
              d.alias
                ? `<div>
                <div class="name">${[intl.get('createEntity.reN')]}</div>
                <div class="des">${d.name}</div>
                <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
                <div class="des">${d.alias}</div>
              </div>`
                : `<div>
              <div class="name">${[intl.get('createEntity.reN')]}</div>
              <div class="des">${d.name}</div>
              <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
                <div class="des">- -</div>
            </div>`
            )
            .style('display', 'block')
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickEdge(d, i);
      });

    this.edgeGroup
      .selectAll('edgeText')
      .data(edges)
      .enter()
      .append('text')
      .attr('class', 'edge-des')
      .attr('fill', (d, i) => {
        return '#242B45'; // 箭头字体颜色
      })
      .append('textPath')
      .attr('xlink:href', (d, i) => {
        if (d.radius) {
          return '';
        }

        return `#edgepath${d.edge_id}`;
      })
      .text((d, i) => {
        if (!d.radius) {
          let temp = d.name;

          if (d.alias) {
            // temp = `${d.name}【${d.alias}】`;
            temp = d.alias;
          }

          if (temp.length < 20) {
            return temp;
          }

          return `${temp.substring(0, 17)}...`;
        }

        return '';
      })
      .on('mouseover', d => {
        if (d.name) {
          this.d3Tooltip
            .html(
              d.alias
                ? `<div>
              <div class="name">${[intl.get('createEntity.reN')]}</div>
              <div class="des">${d.name}</div>
              <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
              <div class="des">${d.alias}</div>
            </div>`
                : `<div>
            <div class="name">${[intl.get('createEntity.reN')]}</div>
            <div class="des">${d.name}</div>
            <div class="nick-name">${[intl.get('createEntity.rcn')]}</div>
              <div class="des">- -</div>
          </div>`
            )
            .style('display', 'block')
            .style('left', `${d3.event.pageX - document.documentElement.scrollLeft}px`)
            .style('top', `${d3.event.pageY + 20 - document.documentElement.scrollTop}px`);
        }
      })
      .on('mouseout', () => {
        this.d3Tooltip.style('display', 'none');
      })
      .on('click', (d, i) => {
        this.clickEdge(d, i);
      });

    this.forceSimulation.force('link').links(allEdges);

    this.forceSimulation.alpha(1).restart();

    this.selectHighLight(this.props.selectedElement);
  };

  /**
   * @description 外部导入点边数据
   */
  externalImport = data => {
    // 本体导入
    const { nodes, entity_id, edges, edge_id } = handleExternalImport({
      savedNodes: this.props.nodes,
      entity_id: this.entity_id,
      edge_id: this.edge_id,
      data
    });

    this.entity_id = entity_id;
    this.edge_id = edge_id;

    const allEdges = [...this.props.edges, ...edges];

    this.props.setNodes(nodes);
    this.props.setEdges(allEdges);

    this.updateNodes(nodes);

    this.updateEdges(edges, allEdges);
  };

  /**
   * @description 任务导入节点
   */
  taskImport = data => {
    const { nodes, edges } = this.props;

    const { copySavedNodes, copyEntityId, copyEdgeId, addEdges } = handleTaskImport({
      savedNodes: nodes,
      entity_id: this.entity_id,
      edge_id: this.edge_id,
      data
    });

    this.entity_id = copyEntityId;
    this.edge_id = copyEdgeId;

    const allEdges = [...edges, ...addEdges];

    this.props.setNodes(copySavedNodes);
    this.props.setEdges(allEdges);

    this.updateNodes(copySavedNodes);

    this.updateEdges(addEdges, allEdges);
  };

  /**
   * @description 批量添加边
   */
  batchAddEdges = addEdges => {
    const { edges, nodes } = this.props;

    const { newAddEdges, edge_id } = handleBatchAddEdges(addEdges, edges, nodes, this.edge_id);

    const allEdges = [...edges, ...newAddEdges];

    this.edge_id = edge_id;

    this.props.setEdges(allEdges);

    this.updateEdges(newAddEdges, allEdges);
  };

  /**
   * @description 改变选中数据
   */
  updateData = (data, targetEle) => {
    const { nodes, selectedElement, edges } = this.props;
    const willUpdateEle = targetEle || selectedElement;

    // 更新点
    if (willUpdateEle && typeof willUpdateEle.entity_id === 'number') {
      const newNodes = changeNodeInfo(data, nodes, willUpdateEle);

      this.props.setNodes(newNodes);

      this.updateNodes(newNodes);
    }

    // 更新边
    if (willUpdateEle && typeof willUpdateEle.edge_id === 'number') {
      const newEdges = changeEdgeInfo(data, edges, willUpdateEle);

      this.props.setEdges(newEdges);

      this.svg.selectAll('.link-node').remove();
      this.svg.selectAll('.edge-des').remove();

      this.updateEdges(newEdges, newEdges);
    }
  };

  /**
   * @description 点击节点
   */
  clickNode = (d, i) => {
    this.props.setTouch(true);

    const { centerSelect, dataInfoRef } = this.props;

    this.addClickStyle(d);

    if (dataInfoRef && dataInfoRef.formNameRef.current) {
      const { checkData } = dataInfoRef.state;

      this.props.dataInfoRef.formNameRef.current
        .validateFields()
        .then(() => {
          if (checkData.isIncorrect) {
            return;
          }

          if (centerSelect === 'edge') {
            if (this.selectedNodes.length === 1) {
              this.connectLine.remove();
              this.connectLine = '';

              this.addLine(this.selectedNodes[0], { index: i, entity_id: d.entity_id, name: d.name });

              this.selectedNodes = [];
              this.props.selectRightTool('dataInfo');

              return;
            }

            this.selectedNodes = [{ index: i, entity_id: d.entity_id, name: d.name }];

            this.connectLine = this.addPath
              .append('path')
              .style('fill', 'none')
              .style('stroke', '#54639C')
              .style('stroke-width', 2)
              .attr('marker-end', 'url(#addPath)');

            this.startConnectX = isFlow()
              ? window.event.pageX + document.getElementById('newWorkFlowScroll').scrollLeft
              : window.event.pageX;

            this.startConnectY = isFlow()
              ? window.event.pageY - 54 + document.getElementById('newWorkFlowScroll').scrollTop
              : window.event.pageY;
          }

          this.props.setSelectedElement(d);
          this.props.selectRightTool('dataInfo');
        })
        .catch(() => {});

      return;
    }

    if (centerSelect === 'edge') {
      if (this.selectedNodes.length === 1) {
        this.connectLine.remove();
        this.connectLine = '';

        this.addLine(this.selectedNodes[0], { index: i, entity_id: d.entity_id, name: d.name });

        this.selectedNodes = [];
        this.props.selectRightTool('dataInfo');

        return;
      }

      this.selectedNodes = [{ index: i, entity_id: d.entity_id, name: d.name }];

      this.connectLine = this.addPath
        .append('path')
        .style('fill', 'none')
        .style('stroke', '#54639C')
        .style('stroke-width', 2)
        .attr('marker-end', 'url(#addPath)');

      this.startConnectX = isFlow()
        ? window.event.pageX + document.getElementById('newWorkFlowScroll').scrollLeft
        : window.event.pageX;

      this.startConnectY = isFlow()
        ? window.event.pageY - 54 + document.getElementById('newWorkFlowScroll').scrollTop
        : window.event.pageY;
    }

    this.props.setSelectedElement(d);
    this.props.selectRightTool('dataInfo');
  };

  /**
   * @description 点击边
   */
  clickEdge = (d, i) => {
    this.props.setTouch(true);

    const { dataInfoRef } = this.props;

    if (dataInfoRef && dataInfoRef.formNameRef.current) {
      const { checkData } = dataInfoRef.state;

      this.props.dataInfoRef.formNameRef.current
        .validateFields()
        .then(() => {
          if (checkData.isIncorrect) {
            return;
          }

          this.props.setSelectedElement(d);
          this.props.selectRightTool('dataInfo');
        })
        .catch(() => {});

      return;
    }

    this.props.setSelectedElement(d);
    this.props.selectRightTool('dataInfo');
  };

  /**
   * @description 选中元素高亮
   */
  selectHighLight = selectedElement => {
    if (!selectedElement) {
      this.edgeGroup.selectAll('.link-node').attr('opacity', 1);
      this.edgeGroup.selectAll('.edge-des').attr('opacity', 1);
      this.nodeGroup.selectAll('circle').attr('opacity', 1);
      this.nodeGroup.selectAll('.node-des').attr('opacity', 1);
    }

    // 选中点
    if (selectedElement && typeof selectedElement.entity_id === 'number') {
      let lightNodes = [selectedElement.entity_id];

      this.edgeGroup.selectAll('.link-node').attr('opacity', d => {
        if (d.start === selectedElement.entity_id || d.end === selectedElement.entity_id) {
          lightNodes = [...lightNodes, ...[d.start, d.end]];

          return 1;
        }

        return 0.2;
      });

      this.edgeGroup.selectAll('.edge-des').attr('opacity', d => {
        if (d.start === selectedElement.entity_id || d.end === selectedElement.entity_id) {
          lightNodes = [...lightNodes, ...[d.start, d.end]];

          return 1;
        }

        return 0.2;
      });

      this.nodeGroup.selectAll('circle').attr('opacity', d => {
        if (lightNodes.includes(d.entity_id)) {
          return 1;
        }

        return 0.2;
      });

      this.nodeGroup.selectAll('.node-des').attr('opacity', d => {
        if (lightNodes.includes(d.entity_id)) {
          return 1;
        }

        return 0.2;
      });
    }

    // 选中边
    if (selectedElement && typeof selectedElement.edge_id === 'number') {
      this.edgeGroup.selectAll('.link-node').attr('opacity', d => {
        if (d.edge_id === selectedElement.edge_id) {
          return 1;
        }

        return 0.2;
      });

      this.edgeGroup.selectAll('.edge-des').attr('opacity', d => {
        if (d.edge_id === selectedElement.edge_id) {
          return 1;
        }

        return 0.2;
      });

      this.nodeGroup.selectAll('circle').attr('opacity', d => {
        if (d.entity_id === selectedElement.start || d.entity_id === selectedElement.end) {
          return 1;
        }

        return 0.2;
      });

      this.nodeGroup.selectAll('.node-des').attr('opacity', d => {
        if (d.entity_id === selectedElement.start || d.entity_id === selectedElement.end) {
          return 1;
        }

        return 0.2;
      });
    }
  };

  /**
   * @description 添加五角星标记
   */
  addFive = selectedTaskData => {
    if (selectedTaskData) {
      this.nodeGroup.selectAll('.five-icon').attr('opacity', d => {
        if (d.task_id === selectedTaskData.task_id) {
          return 1;
        }

        return 0;
      });

      return;
    }

    this.nodeGroup.selectAll('.five-icon').attr('opacity', 0);
  };

  /**
   * @description 添加点选中样式
   */
  addClickStyle = clickNode => {
    const { nodes } = this.props;

    this.edgeGroup.selectAll('.graph-rect').remove();

    // 节点选中样式
    this.edgeGroup
      .selectAll('rect-show')
      .data(nodes)
      .enter()
      .filter(d => {
        if (d.entity_id === clickNode.entity_id) {
          return true;
        }

        return false;
      })
      .append('rect')
      .attr('class', 'graph-rect')
      .attr('width', RECTWIDTH)
      .attr('height', RECTWIDTH)
      .attr('rx', RECTWIDTH / 2)
      .attr('ry', RECTWIDTH / 2)
      .attr('fill', (d, i) => {
        return d.colour;
      })
      .attr('opacity', 0.2)
      .call(
        // 拖拽设置
        d3.drag().on('start', this.started).on('drag', this.dragged).on('end', this.ended)
      );
  };

  render() {
    return (
      <div className="free-graph" id="freegraph">
        <div id="freeGraphMain"></div>
      </div>
    );
  }
}

FreeGraph.defaultProps = {
  onFreeGraphRef: () => {},
  selectCenterTool: () => {},
  selectRightTool: () => {},
  setSelectedElement: () => {},
  setNodes: () => {},
  setEdges: () => {},
  setTouch: () => {},
  nodes: [],
  edges: []
};

export default FreeGraph;
