import { SavedConfigs as TEntityCards } from '../../KnowledgeCard/types';
import { WeightItem } from '../../KnowledgeCard/components/WeightSortingModal/types';

export type TCardConfigs = {
  switch: boolean;
  weights: WeightItem[];
  score_threshold: number;
  entity_cards: TEntityCards;
  error?: boolean;
};
