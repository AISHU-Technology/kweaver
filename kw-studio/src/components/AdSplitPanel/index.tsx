import React from 'react';
import AdSplitPanel, { AdSplitPanelProps } from './AdSplitPanel';
import Panel, { PanelProps } from './Panel';

// Define the type of component ----  Combine parent component and child component into a new component
export type SplitPanelComponent = React.FC<AdSplitPanelProps> & {
  Panel: React.FC<PanelProps>;
};

const AdSplit = AdSplitPanel as SplitPanelComponent;
AdSplit.Panel = Panel;

export default AdSplit;
