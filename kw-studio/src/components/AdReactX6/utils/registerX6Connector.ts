import { Graph, Path } from '@antv/x6';
import { AdX6CurveConnector, AdX6MindMapConnector } from '@/components/AdReactX6/utils/constants';

/**
 * 注册X6用到的所有类型的连接器
 */
const registerX6Connector = () => {
  Graph.registerConnector(
    AdX6CurveConnector,
    (sourcePoint, targetPoint) => {
      const hGap = Math.abs(targetPoint.x - sourcePoint.x); // Horizontal clearance
      const path = new Path();
      path.appendSegment(Path.createSegment('M', sourcePoint.x - 4, sourcePoint.y));
      path.appendSegment(Path.createSegment('L', sourcePoint.x + 12, sourcePoint.y));
      // Horizontal third-order Bezier curve
      path.appendSegment(
        Path.createSegment(
          'C',
          sourcePoint.x < targetPoint.x ? sourcePoint.x + hGap / 2 : sourcePoint.x - hGap / 2,
          sourcePoint.y,
          sourcePoint.x < targetPoint.x ? targetPoint.x - hGap / 2 : targetPoint.x + hGap / 2,
          targetPoint.y,
          targetPoint.x - 6,
          targetPoint.y
        )
      );
      path.appendSegment(Path.createSegment('L', targetPoint.x + 2, targetPoint.y));

      return path.serialize();
    },
    true
  );

  Graph.registerConnector(
    AdX6MindMapConnector,
    (sourcePoint, targetPoint, routerPoints, options) => {
      const midX = sourcePoint.x - 350;
      const midY = sourcePoint.y;
      const ctrX = (targetPoint.x - midX) / 5 + midX;
      const ctrY = targetPoint.y;
      const pathData = `
     M ${sourcePoint.x} ${sourcePoint.y}
     C ${midX} ${midY}
     Q ${ctrX} ${ctrY} ${targetPoint.x} ${targetPoint.y}
    `;
      return options.raw ? Path.parse(pathData) : pathData;
    },
    true
  );
};

export default registerX6Connector;
