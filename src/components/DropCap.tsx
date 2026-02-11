/**
 * DropCap — Enlarged first letter, floats over 3 lines
 * Props: firstChar, color, fontFamily
 * ~25 lines max
 */
export function DropCap({ char, color, fontFamily }: {
  char: string;
  color: string;
  fontFamily: string;
}) {
  // Skip non-letter characters
  if (!/\p{L}/u.test(char)) return null;

  return (
    <span style={{
      float: 'left',
      fontSize: '3.2em',
      lineHeight: 0.85,
      fontWeight: 700,
      fontFamily,
      color,
      marginRight: '6px',
      marginTop: '4px',
      textTransform: 'uppercase',
    }}>
      {char}
    </span>
  );
}
