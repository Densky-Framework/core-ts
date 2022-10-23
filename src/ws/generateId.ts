export function generateId(): string {
  return (
    ((Math.random() * 1e8) | 0).toString(32) +
    ((Math.random() * 1e8) | 0).toString(32) +
    "-" +
    ((Math.random() * 1e8) | 0).toString(32) +
    ((Math.random() * 1e8) | 0).toString(32)
  );
}
