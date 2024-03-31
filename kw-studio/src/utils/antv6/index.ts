import registerEdgeActivate from './registerEdgeActivate';
import registerEdgeAdd from './registerEdgeAdd';
import registerNodeActivate from './registerNodeActivate';
import { tooltip, toolTipWorkFlow, attrToolTipOntoLib, registerToolTip } from './tooltip';

const constructEdgeConfig = (color: string, opacity: any) => ({
  style: { opacity, lineAppendWidth: 10 },
  labelCfg: { autoRotate: true, refY: 7, style: { fill: color, opacity } }
});

const constructNodeConfig = (color: string, opacity: any) => ({
  style: { fill: color, opacity, stroke: 'white', lineWidth: 3 },
  labelCfg: { position: 'top', offset: 7, style: { opacity } }
});

export {
  registerEdgeActivate,
  registerEdgeAdd,
  registerNodeActivate,
  tooltip,
  toolTipWorkFlow,
  attrToolTipOntoLib,
  registerToolTip
};
export { constructEdgeConfig, constructNodeConfig };
export * from './registerCheckedEdge';
export * from './registerIconNode';
export * from './getIcon';
