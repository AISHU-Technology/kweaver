import registerEdgeActivate from './registerEdgeActivate';
import registerNodeActivate from './registerNodeActivate';
import tooltip from './tooltip';

const constructEdgeConfig = (color: string, opacity: any) => ({
  style: { opacity, lineAppendWidth: 30 },
  loopCfg: { position: 'top', dist: 50, style: { opacity } },
  labelCfg: { autoRotate: true, refY: 7, style: { fill: color, opacity } }
});

const constructNodeConfig = (color: string, opacity: any) => ({
  style: { fill: color, opacity, stroke: 'white', lineWidth: 3 },
  labelCfg: { position: 'top', offset: 7, style: { opacity } }
});

export { registerEdgeActivate, registerNodeActivate, tooltip };
export { constructEdgeConfig, constructNodeConfig };
