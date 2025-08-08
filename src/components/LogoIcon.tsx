export default function LogoIcon({ size = "2.5rem" }: { size?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2563eb 60%, #60a5fa 100%)",
        color: "#fff",
        fontWeight: 900,
        fontSize: "1.7rem",
        boxShadow: "0 2px 8px #2563eb22",
        letterSpacing: "-2px",
      }}
    >
      P
    </span>
  );
}
