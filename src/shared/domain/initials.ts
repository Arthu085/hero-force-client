export const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1 ? [words[0], words[words.length - 1]] : words;

  return initials
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase();
};
