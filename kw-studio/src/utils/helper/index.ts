import constructListFromKeysAndLabel from './constructListFromKeysAndLabel';
import { isNumberAndParseInt, formatFileSize, formatNumberWithComma, formatNumberWithSuffix } from './formatNumber';
import formatQueryString from './formatQueryString';
import getAuthorByUserInfo from './getAuthorByUserInfo';
import getBrowserType from './getBrowserType';
import getLabelFromShowLabels from './getLabelFromShowLabels';
import getLengthFromString from './getLengthFromString';
import getPositionBaseTwoPoint from './getPositionBaseTwoPoint';
import { getRandomString, getRuleString } from './getRandomString';
import getValueBasedOnLanguage from './getValueBasedOnLanguage';
import hexToRgba from './hexToRgba';
import { rgbaToHex } from './rgbaToHex';
import stringEllipsis from './stringEllipsis';

const HELPER = {
  constructListFromKeysAndLabel,
  isNumberAndParseInt,
  formatFileSize,
  formatNumberWithComma,
  formatNumberWithSuffix,
  formatQueryString,
  getAuthorByUserInfo,
  getBrowserType,
  getLabelFromShowLabels,
  getLengthFromString,
  getPositionBaseTwoPoint,
  getRandomString,
  getRuleString,
  getValueBasedOnLanguage,
  hexToRgba,
  rgbaToHex,
  stringEllipsis
};

export default HELPER;
