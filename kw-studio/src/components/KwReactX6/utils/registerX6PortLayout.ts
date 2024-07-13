import { Graph } from '@antv/x6';
import {
  KwFileDirPortRightPosition,
  KwHeaderPortLeftPosition,
  KwHeaderPortRightPosition,
  KwRowPortLeftPosition,
  KwRowPortRightPosition,
  KwRowStartEndPortLeftPosition,
  KwRowStartEndPortRightPosition,
  KwX6EntityNodeHeaderHeight,
  KwX6EntityNodeRowHeight,
  KwX6EntityNodeWidth,
  KwX6RelationStartEndNodeWidth
} from '@/components/KwReactX6/utils/constants';

/**
 * 注冊节点身上，连接桩的位置
 */
const registerX6PortLayout = () => {
  Graph.registerPortLayout(
    KwRowPortLeftPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: 0,
            y: index * KwX6EntityNodeRowHeight + KwX6EntityNodeRowHeight / 2 + KwX6EntityNodeHeaderHeight
          },
          angle: 0
        };
      });
    },
    true
  );
  Graph.registerPortLayout(
    KwRowPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: KwX6EntityNodeWidth,
            y: index * KwX6EntityNodeRowHeight + KwX6EntityNodeRowHeight / 2 + KwX6EntityNodeHeaderHeight
          },
          angle: 0
        };
      });
    },
    true
  );
  Graph.registerPortLayout(
    KwRowStartEndPortLeftPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: 0,
            y: index * KwX6EntityNodeRowHeight + KwX6EntityNodeRowHeight / 2 + KwX6EntityNodeHeaderHeight + 28
          },
          angle: 0
        };
      });
    },
    true
  );
  Graph.registerPortLayout(
    KwRowStartEndPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: KwX6RelationStartEndNodeWidth,
            y: index * KwX6EntityNodeRowHeight + KwX6EntityNodeRowHeight / 2 + KwX6EntityNodeHeaderHeight + 28
          },
          angle: 0
        };
      });
    },
    true
  );

  Graph.registerPortLayout(
    KwHeaderPortLeftPosition,
    portsPositionArgs => {
      return portsPositionArgs.map(() => {
        return {
          position: {
            x: 0,
            y: KwX6EntityNodeHeaderHeight / 2
          },
          angle: 0
        };
      });
    },
    true
  );

  Graph.registerPortLayout(
    KwHeaderPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map(() => {
        return {
          position: {
            x: KwX6EntityNodeWidth,
            y: KwX6EntityNodeHeaderHeight / 2
          },
          angle: 0
        };
      });
    },
    true
  );

  Graph.registerPortLayout(
    KwFileDirPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map(() => {
        return {
          position: {
            x: KwX6EntityNodeWidth,
            y: 20
          },
          angle: 0
        };
      });
    },
    true
  );
};

export default registerX6PortLayout;
