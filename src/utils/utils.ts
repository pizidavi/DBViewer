// Utils
import rnTextSize from 'react-native-text-size';

/**
 * Capitalize a string
 * @param {string} str String to capitalize
 * @return {string} String capitalized
 */
export const capitalize = (str: string): string =>
  str[0].toUpperCase() + str.slice(1);

/**
 * Calculate how many px the largest Text
 * in an array takes
 * @param {Row[]} rows
 * @return {number[]} Width of every column in order
 */
export const getLargestColumnsWidth = async (
  rows: Row[],
): Promise<number[]> => {
  if (rows.length === 0) return [];

  const largestValues: { [key: string]: string } = Object.keys(rows[0]).reduce(
    (a, v) => ({ ...a, [v]: v }),
    {},
  );
  rows.forEach(row => {
    Object.entries(row).forEach(([column, value]) => {
      if (value === null) return;
      if (value.toString().length > largestValues[column].length)
        largestValues[column] = value.toString();
    });
  });

  return (await Promise.all(
    Object.values(largestValues).map(async item => {
      const val = await rnTextSize.measure({ text: item, width: 220 });
      return Math.ceil(val.width) + 18;
    }),
  )) as number[];
};
