"use client";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import styles from "./ResponsiveTable.module.css";

type ContentProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  colSpan?: number;
  headers?: string;
  href?: string;
};
function hasAction(children: ReactNode): boolean {
  return Children.toArray(children).some(
    (child) =>
      isValidElement<ContentProps>(child) &&
      (child.type === "button" ||
        !!child.props.href ||
        hasAction(child.props.children)),
  );
}
export default function ResponsiveTable({
  caption,
  headers,
  children,
}: {
  caption: string;
  headers: string[];
  children: ReactNode;
}) {
  const tableId = useId();
  function labelRows(nodes: ReactNode): ReactNode {
    return Children.map(nodes, (node) => {
      if (!isValidElement<ContentProps>(node)) return node;
      if (node.type === Fragment)
        return cloneElement(node, { children: labelRows(node.props.children) });
      if (node.type !== "tr") return node;
      let column = 0;
      const cells = Children.map(node.props.children, (cell) => {
        if (
          !isValidElement<ContentProps>(cell) ||
          (cell.type !== "td" && cell.type !== "th")
        )
          return cell;
        const start = column,
          span = cell.props.colSpan ?? 1;
        column += span;
        const labels = headers.slice(start, column);
        const action =
          column >= headers.length && hasAction(cell.props.children);
        return cloneElement(cell, {
          role: "cell",
          headers: labels
            .map((_, index) => `${tableId}-column-${start + index}`)
            .join(" "),
          className: [styles.cell, cell.props.className]
            .filter(Boolean)
            .join(" "),
          ...{ "data-action": action ? "true" : undefined },
          children: (
            <>
              <span className={styles.label} aria-hidden="true">
                {labels.join(" · ")}
              </span>
              <div className={styles.value}>{cell.props.children}</div>
            </>
          ),
        });
      });
      return cloneElement(node, { role: "row", children: cells });
    });
  }
  return (
    <div className={styles.region}>
      <div
        className={styles.viewport}
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table className={styles.table} role="table">
          <caption>
            {caption}
            <span className={styles.hint}>
              مرّر الجدول أفقيًا لرؤية بقية التفاصيل؛ يمكن التركيز عليه واستخدام
              مفاتيح الأسهم.
            </span>
          </caption>
          <thead role="rowgroup">
            <tr role="row">
              {headers.map((header, index) => (
                <th
                  key={index}
                  id={`${tableId}-column-${index}`}
                  scope="col"
                  role="columnheader"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">{labelRows(children)}</tbody>
        </table>
      </div>
    </div>
  );
}
