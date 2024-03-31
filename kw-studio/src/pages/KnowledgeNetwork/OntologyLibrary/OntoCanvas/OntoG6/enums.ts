import backgroundNet from '@/assets/images/net.png';
import backgroundPoint from '@/assets/images/background_point.png';
import backgroundNetSmall from '@/assets/images/net_small.png';
import backgroundPointSmall from '@/assets/images/background_point_small.png';

const WHITE = 'white';
const LIGHT_GREY = 'light_grey';
const GREY = 'grey';
const LIGHT_BLUE = 'light_blue';
const BLUE = 'blue';

const EMPTY = 'empty';
const POINT = 'point';
const NET = 'net';

const BACKGROUND_COLOR: any = {
  [WHITE]: '#fff',
  [LIGHT_GREY]: '#F8F8F8',
  [GREY]: '#F1F1F1',
  [LIGHT_BLUE]: '#F9FAFC',
  [BLUE]: '#F0F2F6'
};
const BACKGROUND_IMAGE: any = {
  [EMPTY]: '',
  [POINT]: backgroundPoint,
  [NET]: backgroundNet
};
const BACKGROUND_COLOR_LIST = [
  { key: WHITE, color: BACKGROUND_COLOR[WHITE] },
  { key: LIGHT_GREY, color: BACKGROUND_COLOR[LIGHT_GREY] },
  { key: GREY, color: BACKGROUND_COLOR[GREY] },
  { key: LIGHT_BLUE, color: BACKGROUND_COLOR[LIGHT_BLUE] },
  { key: BLUE, color: BACKGROUND_COLOR[BLUE] }
];
const BACKGROUND_IMAGE_LIST = [
  { key: EMPTY, image: '' },
  { key: POINT, image: backgroundPointSmall },
  { key: NET, image: backgroundNetSmall }
];

const DEFAULT = {
  color: WHITE,
  image: POINT
};

const ONTOLOGY_GRAPH_CONFIG = {
  WHITE,
  LIGHT_GREY,
  GREY,
  LIGHT_BLUE,
  BLUE,
  EMPTY,
  POINT,
  NET,
  BACKGROUND_COLOR,
  BACKGROUND_IMAGE,
  BACKGROUND_COLOR_LIST,
  BACKGROUND_IMAGE_LIST,
  DEFAULT
};

export default ONTOLOGY_GRAPH_CONFIG;
