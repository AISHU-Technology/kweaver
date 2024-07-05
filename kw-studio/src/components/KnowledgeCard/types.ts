type Override<P, S> = Omit<P, keyof S> & S;

export type KnowledgeCardConfigsType = {
  nodes: any[];
  config: Record<string, any>;
  [key: string]: any;
}[];

export type UseComponentsType = {
  mode?: 'develop' | 'production';
  language?: string;
  configs: KnowledgeCardConfigsType;
  toNextDetail?: (data: any) => void;
  toAsPreview?: (data: any) => void;
  skeleton?: boolean;
  loading?: boolean;
};

export type BaseComponents = {
  mode?: 'develop' | 'production';
  language?: string;
  componentConfig: {
    kg_id: number;
    nodes: any[];
    config: any;
  };
  skeleton?: boolean;
  loading?: boolean;
};

export type Properties = {
  name: string;
  alias: string;
  type?: string;
  value?: string;
};

export type CardTitleData = {
  alias: string;
  fill_color: string;
  properties: Properties[];
  color?: string;
  [key: string]: any;
};

export type EntityInfoProps = Override<BaseComponents, { nodes: CardTitleData[] }>;

export type RelatedLabelData = {
  fill_color: string;
  color?: string;
  [key: string]: any;
};

export type RelatedLabelProps = Override<BaseComponents, { toNextDetail?: (data: any) => void }>;

export type RelatedDocumentData = {
  [key: string]: any;
};

export type RelatedDocumentProps = Override<BaseComponents, { toAsPreview?: (data: any) => void }>;

export type TitleObj = {
  'zh-CN': string;
  'zh-TW': string;
  'en-US': string;
};
