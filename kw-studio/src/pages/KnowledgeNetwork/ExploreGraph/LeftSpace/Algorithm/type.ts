import type { SelectProps } from 'antd';

// 单条图算法的类型
export type AlgorithmType = {
  key: string;
  label: string;
  question?: string;
};

// 一类图算法的类型
export type AlgorithmItemLineType = {
  items: any[];
  title: string;
  onClick: (data: AlgorithmType) => void;
  disabled?: boolean;
  className?: string;
};

// louvain 类型
export type LouvainType = {
  selectedItem: any;
  algorithmData: AlgorithmType;
  onGoBack: () => void;
  onChangeData: (data: { type: string; data: any }) => void;
  onCanUseScaling: (value: boolean) => void;
  onCloseLeftDrawer: () => void;
  onJudgeOnlyOneClassEdge: () => boolean;
};

// louvain 配置参数类型
export type LouvainParamsType = {
  directed: boolean;
  weightPropertyName: string;
  threshold: number;
};

// louvain 配置类型
export type LouvainConfigType = {
  params: LouvainParamsType;
  isLoading: boolean;
  optionsEdges: SelectProps['options'] | undefined;
  optionsWeight: SelectProps['options'] | undefined;
  onAnalysis: () => void;
  onChangeParams: (type: string) => (value: any) => void;
};

// louvain 结果类型
export type LouvainResultType = {
  title: string;
  source: any;
  selectedItem: any;
  isFirstRender: boolean;
  onGoBack: () => void;
  onChangeData: (data: { type: string; data: any }) => void;
  onCloseLeftDrawer: () => void;
  onChangeRenderIndex: (value: boolean) => void;
};
