type RobotStatePanelProps = {
  title: string;
  values: {
    label: string;
    value: number;
  }[];
};

export function RobotStatePanel({
  title,
  values,
}: RobotStatePanelProps) {
  return (
    <section className="robot-state">
      <h2>{title}</h2>

      {values.map((item) => (
        <p key={item.label}>
          {item.label}: {item.value.toFixed(3)}
        </p>
      ))}
    </section>
  );
}