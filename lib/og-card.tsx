export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function OgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: "72px",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: "#1d4ed8",
          display: "flex",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 34,
            width: 42,
            height: 42,
            borderRadius: 8,
            background: "#bfdbfe",
            transform: "rotate(-16deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 36,
            top: 18,
            width: 42,
            height: 42,
            borderRadius: 8,
            background: "#ffffff",
            transform: "rotate(12deg)",
          }}
        />
      </div>
      <div style={{ marginTop: 36, fontSize: 68, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>
        Image Extractor
      </div>
      <div style={{ marginTop: 16, fontSize: 30, color: "#64748b" }}>
        Download images from any public page. Free, no signup.
      </div>
    </div>
  );
}
