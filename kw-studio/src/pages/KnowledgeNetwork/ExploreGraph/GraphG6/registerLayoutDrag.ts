import G6 from '@antv/g6';
import _ from 'lodash';

/** 拖动时重新布局 */
const registerLayoutDrag = (name: string, option: any) => {
  const { onChangeData } = option;

  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:dragstart': 'nodeDragstart',
        'node:dragend': 'nodeDragend',
        'canvas:click': 'canvasClick'
      };
    },
    nodeDragstart() {
      const self = this as any;
      self.graph.__onSetMenuConfig(null); // 清除右键菜单
      self.graph?.cfg?.layoutController?.layoutMethods[0]?.destroy();
      setTimeout(() => {
        const moveBefore = _.map(self.graph.getNodes(), item => {
          const { x, y, id } = item.getModel();
          return { x, y, id };
        });

        self.graph.__moveBefore = moveBefore;
      });
    },
    nodeDragend(data: any) {
      const self = this as any;

      data.item.get('model').fx = null;
      data.item.get('model').fy = null;

      self.graph.__isNotFitView = true;
      const forceLayout = self.graph.get('layoutController').layoutMethods[0];
      forceLayout.execute();

      let end = 0;
      let animateTime: any = null;
      let flag = self.graph.__tickIndex;
      clearInterval(animateTime);
      animateTime = setInterval(() => {
        if (end++ > 1000) clearInterval(animateTime);
        if (flag === self.graph.__tickIndex) {
          self.graph.__tickIndex = 0;
          clearInterval(animateTime);

          const moveCurrent = _.map(self.graph.getNodes(), item => {
            const { x, y, id } = item.getModel();
            return { x, y, id };
          });
          const before = self.graph.__moveBefore;

          self.graph.__moveBefore = null;
          const redoStack = self.graph.graphStack.getRedoStack();
          redoStack.clear();
          self.graph.graphStack.pushStack('update', {
            after: { nodes: moveCurrent },
            before: { nodes: before }
          });
        } else {
          flag = self.graph.__tickIndex;
        }
      }, 100);
    },
    canvasClick() {
      const self = this as any;
      /** 停止布局的迭代 */
      self.graph?.cfg?.layoutController?.layoutMethods[0]?.destroy();
      onChangeData({ type: 'isLoading', data: false });
    }
  });
};

export default registerLayoutDrag;
