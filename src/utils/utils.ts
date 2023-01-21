// Utils

/**
 * Capitalize a string
 * @param {string} str String to capitalize
 * @return {string} String capitalized
 */
export const capitalize = (str: string): string =>
  str[0].toUpperCase() + str.slice(1);
