export const replaceDiacritics = (diacritics: Record<string, string>,text: string) => text.replace(/[^\u0000-\u007E]/g, (a: string) => diacritics[text] || text);

export const normalizeGreek = (text: string) =>
  text.replace(/Ά|Α|ά|Λ|λ/g, 'a')
  .replace(/Έ|Ε|έ/g, 'e')
  .replace(/Ή|Η|ή/g, 'n')
  .replace(/Ί|Ϊ|Ι|ί|ΐ|ϊ/g, 'i')
  .replace(/Ό|Ο|ό/g, 'o')
  .replace(/Ύ|Ϋ|Υ/g, 'y')
  .replace(/ύ|ΰ|ϋ/g, 'v')
  .replace(/Ώ|Ω|ώ/g, 'o')
  .replace(/Σ|ς/g, 'z');
