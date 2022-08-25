export type ModalExportType = {
  isVisible: boolean;
  knowledge: { id: number };
  onClose: () => void;
};

export type PaginationType = {
  page?: number;
  pageSize?: number;
};

export type ItemType = {
  name: string;
  kgconfid: number;
};
