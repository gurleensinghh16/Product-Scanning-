interface Props {
  status: "Compliant" | "Violation" | "Review";
}

function StatusBadge({ status }: Props) {

  const className =
    status === "Compliant"
      ? "status compliant"
      : status === "Violation"
      ? "status violation"
      : "status review";

  return (
    <span className={className}>
      {status}
    </span>
  );
}

export default StatusBadge;