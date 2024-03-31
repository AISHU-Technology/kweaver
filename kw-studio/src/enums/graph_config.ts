import backgroundNet from '@/assets/images/net.png';
import backgroundPoint from '@/assets/images/background_point.png';
import backgroundNetSmall from '@/assets/images/net_small.png';
import backgroundPointSmall from '@/assets/images/background_point_small.png';

const HAS_LEGEND = 'hasLegend';

const WHITE = 'white';
const GREY = 'gray';
const GREY2 = 'gray2';

const EMPTY = 'empty';
const POINT = 'point';
const NET = 'net';

const BACKGROUND_COLOR: any = {
  [WHITE]: '#fff',
  [GREY]: '#F1F1F1',
  [GREY2]: '#F9FAFC'
};
const BACKGROUND_IMAGE: any = {
  [EMPTY]: '',
  [POINT]: backgroundPoint,
  [NET]: backgroundNet
};
const BACKGROUND_COLOR_LIST = [
  { key: WHITE, color: BACKGROUND_COLOR[WHITE] },
  { key: GREY, color: BACKGROUND_COLOR[GREY] },
  { key: GREY2, color: BACKGROUND_COLOR[GREY2] }
];
const BACKGROUND_IMAGE_LIST = [
  { key: EMPTY, image: '' },
  { key: POINT, image: backgroundPointSmall },
  { key: NET, image: backgroundNetSmall }
];

const DEFAULT = {
  [HAS_LEGEND]: true,
  color: WHITE,
  image: EMPTY
};

const GRAPH_CONFIG = {
  HAS_LEGEND,
  WHITE,
  GREY,
  GREY2,
  EMPTY,
  POINT,
  NET,
  BACKGROUND_COLOR,
  BACKGROUND_IMAGE,
  BACKGROUND_COLOR_LIST,
  BACKGROUND_IMAGE_LIST,
  DEFAULT
};

export default GRAPH_CONFIG;
