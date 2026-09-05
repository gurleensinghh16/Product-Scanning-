interface Props {
  title: string;
  value: string;
  description: string;
}

function StatCard({ title, value, description }: Props) {
  return (
    <div className="stat-card">

      <p className="stat-title">
        {title}
      </p>

      <h2>
        {value}
      </h2>

      <span>
        {description}
      </span>

    </div>
  );
}

export default StatCard;