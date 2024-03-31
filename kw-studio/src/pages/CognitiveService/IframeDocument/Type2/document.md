# 使用

## 引用

```javascript
<script src="./ADGraph.js"></script>;
or;
import ADGraph from './ADGraph.js';
```

```javascript
const graph = new ADGraph({
  container: container.current,
  location: { origin: 'http://192.168.33.41:3001', pathname: '/home' },
  config: { container: { width, height }, header: { visibility: 'visible' } }
});

// 修改节点数据
graph.updateItem('node', {
  label: '测试'
});
```

<style>
table th:first-of-type {
    width: 80pt;
}
table th:nth-of-type(2) {
    width: 150pt;
}
table th:nth-of-type(3) {
    width: 80pt;
}
table th:nth-of-type(4) {
    width: 200pt;
}
</style>

# 事件绑定/解绑

## graph.on(eventName, handler)

为图绑定事件监听。

### 参数:

| 名称      | 类型     | 是否必选 | 描述                         |
| --------- | -------- | -------- | ---------------------------- |
| eventName | string   | true     | 事件名，可选事件名参见 Event |
| handler   | Function | true     | 监听函数                     |

### 用法:

```javascript
// 为图上的所有节点绑定点击监听
graph.on('node:click', evt => {
  const item = evt.item; // 被操作的节点 item
  const target = evt.target; // 被操作的具体图形
  // ...
});
```

## graph.off(eventName, handler)

为图解除指定的事件监听。

### 参数:

| 名称      | 类型     | 是否必选 | 描述                         |
| --------- | -------- | -------- | ---------------------------- |
| eventName | string   | true     | 事件名，可选事件名参见 Event |
| handler   | Function | true     | 监听函数                     |

### 用法:

```javascript
// 监听函数
const fn = evt => {
  const item = evt.item; // 被操作的节点 item
  const target = evt.target; // 被操作的具体图形
  // ...
};
// 为图上的所有节点绑定点击监听
graph.on('node:click', fn);

// 解除上面的点击监听事件，注意 fn 必须是同一个对象
graph.off('node:click', fn);
```

# 获取

## graph.getNodes()

获取图中所有节点的数据。

### 返回值

返回值类型：Array；

### 用法:

```javascript
const nodes = graph.getNodes();
```

## graph.getEdges()

获取图中所有边的数据。

### 返回值

返回值类型：Array；

### 用法:

```javascript
const edges = graph.getEdges();
```

## graph.findById(id)

根据 ID，查询对应的元素数据。

### 参数:

| 名称 | 类型   | 是否必选 | 描述 |
| ---- | ------ | -------- | ---- | --- |
| id   | string | true     | 元素 | ID  |

### 返回值

返回值类型：Object；  
如果有符合规则的元素数据，则返回该元素数据，否则返回 undefined。

### 用法:

```javascript
const node = graph.findById('node');
```

## graph.getNeighbors(node, type)

根据节点 ID，查询邻居节点数据。

### 参数:

| 名称 | 类型                            | 是否必选 | 描述                                                                                                             |
| ---- | ------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| node | string                          | true     | 节点 ID                                                                                                          |
| type | 'source' / 'target' / undefined | false    | 邻居类型， 'source' 只获取当前节点的源节点，'target' 只获取当前节点指向的目标节点， 若不指定则返回所有类型的邻居 |

### 返回值

返回值类型：Array；  
返回值符合要求的节点数组。

### 用法:

```javascript
const neighbors = graph.getNeighbors('node1', 'source');
```

# 元素操作

## graph.addItem(type, model)

新增元素（节点和边）。

### 参数:

| 名称  | 类型   | 是否必选 | 描述                                     |
| ----- | ------ | -------- | ---------------------------------------- |
| type  | string | true     | 元素类型，可选值为 'node'、'edge'        |
| model | Object | true     | 元素的数据模型，具体内容参见元素配置项。 |

### 用法:

```javascript
const model = {
  id: 'node',
  label: 'node',
  address: 'cq',
  x: 200,
  y: 150,
  style: {
    fill: 'blue'
  }
};

graph.addItem('node', model);
```

## graph.removeItem(node)

删除元素。

### 参数:

| 名称 | 类型   | 是否必选 | 描述    |
| ---- | ------ | -------- | ------- |
| node | string | true     | 元素 ID |

### 用法:

```javascript
// 通过 ID 查询节点
graph.removeItem('node');
```

## graph.updateItem(node, model)

更新元素，包括更新数据、样式等。

### 参数:

| 名称  | 类型   | 是否必选 | 描述                                       |
| ----- | ------ | -------- | ------------------------------------------ |
| node  | string | true     | 元素 ID                                    |
| model | Object | true     | 需要更新的数据模型，具体内容参见元素配置项 |

### 用法:

```javascript
const model = {
  id: 'node',
  label: 'node',
  address: 'cq',
  x: 200,
  y: 150,
  style: {
    fill: 'blue'
  }
};

graph.updateItem('node', model);
```

# 视口操作

## graph.zoomTo(toRatio, center)

缩放视窗窗口到一个固定比例。

### 参数:

| 名称    | 类型   | 是否必选 | 描述                                                                                 |
| ------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| toRatio | Number | true     | 固定比例值                                                                           |
| center  | Object | false    | 以 center 的 x、y 坐标为中心缩放，如果省略了 center 参数，则以元素当前位置为中心缩放 |

### 用法:

```javascript
// 以 (100, 100) 为中心点，放大3倍
graph.zoomTo(3, { x: 100, y: 100 });

// 以当前元素位置为中心，缩小到 0.5
graph.zoomTo(0.5);
```

## graph.fitView(padding, rules)

让画布内容适应视口。

### 参数:

| 名称    | 类型                                                                                     | 是否必选 | 描述                                          |
| ------- | ---------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| padding | Number / Array                                                                           | false    | [top, right, bottom, left] 四个方向上的间距值 |
| rules   | { onlyOutOfViewPort?: boolean; direction?: 'x' / 'y' / 'both'; ratioRule?: 'max' / 'min} | false    | fitView 的规则                                |

### 用法:

```javascript
// padding 只设置为一个值，则表示 top = right = bottom = left = 20
graph.fitView(20);

// 等价于 graph.fitView(20)
graph.fitView([20]);

// padding 设置为数组，只传 2 个值，则 top = bottom = 20, right = left = 10
graph.fitView([20, 10]);

// padding 设置为数组，四个方向值都指定
graph.fitView([20, 10, 20, 15]);

// 使用fitViewByRules, 默认rules: onlyOutOfViewPort = false, direction = 'both', ratioRule = 'min'
graph.fitView(0, {});

// 使用fitViewByRules, 自定义rules
graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
```

## graph.focusItem(node, animate, animateCfg)

移动图，使得 item 对齐到视口中心，该方法可用于做搜索后的缓动动画。

### 参数:

| 名称       | 类型    | 是否必选 | 描述                                                                                |
| ---------- | ------- | -------- | ----------------------------------------------------------------------------------- |
| node       | string  | true     | 元素 ID                                                                             |
| animate    | boolean | false    | 是否带有动画。若未配置，则跟随 graph 的 animate 参数                                |
| animateCfg | Object  | false    | 若带有动画，可配置动画，参见基础动画教程。若未配置，则跟随 graph 的 animateCfg 参数 |

### 用法:

```javascript
graph.focusItem('node');

// 动画地移动
graph.focusItem('node', true);

// 动画地移动，并配置动画
graph.focusItem('node', true, {
  easing: 'easeCubic',
  duration: 400
});
```

## 基础事件

| 事件名称     | 描述                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| beforelayout | 布局前触发。调用 graph.render 时会进行布局，因此 render 时会触发。或用户主动调用图的 graph.layout 时触发。 |
| afterlayout  | 布局前触发。调用 graph.render 时会进行布局，因此 render 时会触发。或用户主动调用图的 graph.layout 时触发。 |
| contextmenu  | 用户右击鼠标时触发并打开上下文菜单                                                                         |
| wheelzoom    | 鼠标滚轮滚动时触发该事件                                                                                   |

### canvas

| 事件名称         | 描述                                                       |
| ---------------- | ---------------------------------------------------------- |
| canvas:click     | 鼠标左键单击画布时触发                                     |
| canvas:dragstart | 当画布开始被拖拽的时候触发的事件，此事件作用在被拖曳画布上 |

### node

| 事件名称       | 描述                                                       |
| -------------- | ---------------------------------------------------------- |
| node:drag      | 当节点在拖动过程中时触发的事件，此事件作用于被拖拽节点上   |
| node:dragstart | 当节点开始被拖拽的时候触发的事件，此事件作用在被拖曳节点上 |
| node:dragend   | 当拖拽完成后触发的事件，此事件作用在被拖曳节点上           |
| node:dblclick  | 鼠标双击左键节点时触发，同时会触发两次 node:click          |
| node:click     | 鼠标左键单击节点时触发                                     |
| node:mousemove | 鼠标在节点内部移到时不断触发，不能通过键盘触发             |
| node:mouseout  | 鼠标移出节点后触发                                         |

### edge

| 事件名称       | 描述                                       |
| -------------- | ------------------------------------------ |
| edge:click     | 鼠标左键单击边时触发                       |
| edge:mousemove | 鼠标在边上移到时不断触发，不能通过键盘触发 |
| edge:mouseout  | 鼠标移出边后触发                           |
