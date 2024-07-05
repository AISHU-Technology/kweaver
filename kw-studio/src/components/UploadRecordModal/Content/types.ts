export type RecordItem = {
  cause: string;
  created: string;
  finished: string;
  graphName: string;
  id: string;
  ip: string;
  relatedGraphNetName: string;
  transferProgress: number;
  transferState: string;
  transferStatus: string;
  updated: string;
};

export type TableState = {
  loading: boolean;
  keyword: string;
  page: number;
  total: number;
  order: 'created' | 'updated' | string;
  reverse: 0 | 1 | number;
  kId: number;
  finished?: any;
};

export type RelationKnw = { id: number; name: string }[];
