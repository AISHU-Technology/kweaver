import intl from 'react-intl-universal';

export const tipContent = [
  intl.get('cognitiveSearch.firstStep'),
  intl.get('cognitiveSearch.secondStep'),
  intl.get('cognitiveSearch.thirdStep'),
  intl.get('cognitiveSearch.forStep')
];

export const getDefaultCardConfigs = () => ({
  switch: false,
  weights: [],
  score_threshold: 0.8,
  entity_cards: []
});
