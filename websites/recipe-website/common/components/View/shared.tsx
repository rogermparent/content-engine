import clsx from "clsx";
import { ReactNode } from "react";

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("rounded-sm", className)}>{children}</div>;
}

export function InfoCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className="p-2 m-1 text-center">
      {title && <div className="font-semibold">{title}</div>}
      <div>{children}</div>
    </Card>
  );
}
