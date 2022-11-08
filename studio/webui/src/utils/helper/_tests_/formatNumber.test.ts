import { isNumberAndParseInt, formatFileSize, formatNumberWithComma, formatNumberWithSuffix } from '../formatNumber';

describe('formatNumber', () => {
  test('isNumberAndParseInt', () => {
    expect(isNumberAndParseInt(13)).toBe(13);
    expect(isNumberAndParseInt('13')).toBe(13);
    expect(isNumberAndParseInt('13xx')).toBe(13);
    expect(isNumberAndParseInt('xx13')).toBe(0);
  });

  test('formatFileSize', () => {
    expect(formatFileSize(128)).toBe('128 B');
    expect(formatFileSize(128128)).toBe('125 KB');
    expect(formatFileSize(128128128)).toBe('122 MB');
    expect(formatFileSize(128128128128)).toBe('119 GB');
  });

  test('formatNumberWithComma', () => {
    expect(formatNumberWithComma(128)).toBe('128');
    expect(formatNumberWithComma(128128)).toBe('128,128');
    expect(formatNumberWithComma(128128128)).toBe('128,128,128');
  });

  test('formatNumberWithSuffix', () => {
    expect(formatNumberWithSuffix(128)).toBe('128');
    expect(formatNumberWithSuffix(8211)).toBe('8 千');
    expect(formatNumberWithSuffix(128128)).toBe('13 万');
    expect(formatNumberWithSuffix(28128128)).toBe('3 千万');
    expect(formatNumberWithSuffix(128128128)).toBe('1 亿');
  });
});
