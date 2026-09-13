type LegacyExperienceFrameProps = {
  section: "gyan-chaupar" | "traditions";
  title: string;
  className?: string;
};

export function LegacyExperienceFrame({
  section,
  title,
  className = "min-h-[64rem] lg:min-h-[58rem]",
}: LegacyExperienceFrameProps) {
  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--shadow-soft)]">
      <iframe
        src={`/landing.html?embed=${section}`}
        title={title}
        className={`block w-full border-0 ${className}`}
        loading="eager"
      />
    </div>
  );
}
