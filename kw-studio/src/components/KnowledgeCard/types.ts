type Override<P, S> = Omit<P, keyof S> & S;

/** 卡片的配置属性 */
export type KnowledgeCardConfigsType = {
  nodes: any[];
  config: Record<string, any>;
  [key: string]: any;
}[];
/** 构建卡片dom参数类型 */
export type UseComponentsType = {
  mode?: 'develop' | 'production';
  language?: string;
  configs: KnowledgeCardConfigsType;
  toNextDetail?: (data: any) => void;
  toAsPreview?: (data: any) => void;
  skeleton?: boolean; // 是否有骨架屏
  loading?: boolean;
};

/** 组件的基础类型 */
export type BaseComponents = {
  mode?: 'develop' | 'production';
  language?: string;
  componentConfig: {
    kg_id: number;
    nodes: any[];
    config: any; // 组件的配置，根据该配置筛选和组织 data 数据用以展示
  };
  skeleton?: boolean; // 是否有骨架屏
  loading?: boolean;
};

/** 属性类型 */
export type Properties = {
  name: string;
  alias: string;
  type?: string;
  value?: string;
};

/** 实体信息需要的 data 数据 */
export type CardTitleData = {
  alias: string;
  fill_color: string;
  properties: Properties[];
  color?: string;
  [key: string]: any;
};
/** 实体信息组件类型 */
export type EntityInfoProps = Override<BaseComponents, { nodes: CardTitleData[] }>;

/** 相关词条需要的 data 数据 */
export type RelatedLabelData = {
  fill_color: string;
  color?: string;
  [key: string]: any;
};
/** 相关词条组件类型 */
export type RelatedLabelProps = Override<BaseComponents, { toNextDetail?: (data: any) => void }>;

/** 相关文档需要的 data 数据 */
export type RelatedDocumentData = {
  [key: string]: any;
};
/** 相关文档组件类型 */
export type RelatedDocumentProps = Override<BaseComponents, { toAsPreview?: (data: any) => void }>;

/** 多语言标题 */
export type TitleObj = {
  'zh-CN': string;
  'zh-TW': string;
  'en-US': string;
};
