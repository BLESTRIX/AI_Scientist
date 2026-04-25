const AuroraBackground = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(222_47%_8%),hsl(222_47%_4%))]" />

      {/* Aurora orbs */}
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-[120px] opacity-50 animate-aurora"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--aurora-purple) / 0.55), transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full blur-[140px] opacity-45 animate-aurora"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--aurora-teal) / 0.5), transparent 70%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-[560px] w-[560px] rounded-full blur-[140px] opacity-40 animate-aurora"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--aurora-blue) / 0.5), transparent 70%)",
          animationDelay: "-12s",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
};

export default AuroraBackground;