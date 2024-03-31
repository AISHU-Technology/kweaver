import { Graph } from '@antv/x6';
import {
  AdFileDirPortRightPosition,
  AdHeaderPortLeftPosition,
  AdHeaderPortRightPosition,
  AdRowPortLeftPosition,
  AdRowPortRightPosition,
  AdRowStartEndPortLeftPosition,
  AdRowStartEndPortRightPosition,
  AdX6EntityNodeHeaderHeight,
  AdX6EntityNodeRowHeight,
  AdX6EntityNodeWidth,
  AdX6RelationStartEndNodeWidth
} from '@/components/AdReactX6/utils/constants';

/**
 * 注冊节点身上，连接桩的位置
 */
const registerX6PortLayout = () => {
  // The position of the connecting pile on the left side of the table row
  Graph.registerPortLayout(
    AdRowPortLeftPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: 0,
            y: index * AdX6EntityNodeRowHeight + AdX6EntityNodeRowHeight / 2 + AdX6EntityNodeHeaderHeight
          },
          angle: 0
        };
      });
    },
    true
  );
  // The position of the connecting pile on the right side of the table row
  Graph.registerPortLayout(
    AdRowPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: AdX6EntityNodeWidth,
            y: index * AdX6EntityNodeRowHeight + AdX6EntityNodeRowHeight / 2 + AdX6EntityNodeHeaderHeight
          },
          angle: 0
        };
      });
    },
    true
  );
  // The position of the connecting pile on the left side of the starting/ending table rows
  Graph.registerPortLayout(
    AdRowStartEndPortLeftPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: 0,
            y: index * AdX6EntityNodeRowHeight + AdX6EntityNodeRowHeight / 2 + AdX6EntityNodeHeaderHeight + 28
          },
          angle: 0
        };
      });
    },
    true
  );
  // The position of the connecting pile on the right side of the starting/ending table rows
  Graph.registerPortLayout(
    AdRowStartEndPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: AdX6RelationStartEndNodeWidth,
            y: index * AdX6EntityNodeRowHeight + AdX6EntityNodeRowHeight / 2 + AdX6EntityNodeHeaderHeight + 28
          },
          angle: 0
        };
      });
    },
    true
  );

  // The position of the connecting pile on the left side of the table header
  Graph.registerPortLayout(
    AdHeaderPortLeftPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: 0,
            y: AdX6EntityNodeHeaderHeight / 2
          },
          angle: 0
        };
      });
    },
    true
  );

  // The position of the connecting pile on the right side of the table header
  Graph.registerPortLayout(
    AdHeaderPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: AdX6EntityNodeWidth,
            y: AdX6EntityNodeHeaderHeight / 2
          },
          angle: 0
        };
      });
    },
    true
  );

  // File/folder connection pile location
  Graph.registerPortLayout(
    AdFileDirPortRightPosition,
    portsPositionArgs => {
      return portsPositionArgs.map((_, index) => {
        return {
          position: {
            x: AdX6EntityNodeWidth,
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
