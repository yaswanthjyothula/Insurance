import { Fragment } from "react";

/** Wraps a value in markers that `bold` turns into <strong>, so a whole sentence stays one message. */
export const mark = (text: string | number) => `\u0001${text}\u0002`;

/** Renders text containing `mark(...)` spans with those spans in <strong>. */
export function bold(text: string, className?: string): React.ReactNode {
  return text.split(/(\u0001[^\u0002]*\u0002)/).map((part, i) =>
    part.startsWith("\u0001") ? (
      <strong key={i} className={className}>
        {part.slice(1, -1)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
