import { useState, useEffect, useRef } from "react";
import "./App.css";

// Text configuration
const TEXT_CONFIG = {
  // Starting position of text
  startX: 410,
  startY: 90,

  // Common text formatting
  fontFamily: "Markazi Text",
  maxWidth: 140,
  initialFontSize: 24,
  lineHeightRatio: 1.5, // Line height as a ratio of font size

  // Column configuration
  maxHeight: 150,

  // Perspective transform
  transform: {
    skewX: -0.47,
    skewY: 0.25,
    xOffsetMultiplier: 0.05,
    xOffsetBaseY: 50,
  },
};

function App() {
  const [text, setText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [handsImage, setHandsImage] = useState<HTMLImageElement | null>(null);

  // Calculate current line height based on font size
  const getCurrentLineHeight = (fontSize: number) => {
    return Math.round(fontSize * TEXT_CONFIG.lineHeightRatio);
  };

  interface ColumnResult {
    textFits: boolean;
  }

  const drawTextWithPerspective = (
    ctx: CanvasRenderingContext2D,
    text: string,
    startX: number,
    startY: number,
    maxHeight: number,
    transform: typeof TEXT_CONFIG.transform,
    fontSize: number
  ): ColumnResult => {
    const lineHeight = getCurrentLineHeight(fontSize);
    let y = startY;
    let textFits = true;

    const words = text.split(" ");
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > TEXT_CONFIG.maxWidth) {
        // If current line exceeds maxWidth, render the current line
        if (y + lineHeight > startY + maxHeight) {
          // If adding this line exceeds maxHeight, indicate text doesn't fit
          textFits = false;
          break;
        }

        // Draw the current line
        const xOffset =
          (y - transform.xOffsetBaseY) * transform.xOffsetMultiplier;
        ctx.fillText(currentLine, startX + xOffset, y);
        y += lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    // Draw the last line if it fits
    if (currentLine && y + lineHeight <= startY + maxHeight) {
      const xOffset =
        (y - transform.xOffsetBaseY) * transform.xOffsetMultiplier;
      ctx.fillText(currentLine, startX + xOffset, y);
    } else if (currentLine) {
      textFits = false;
    }

    return { textFits };
  };

  const drawCanvas = (image: HTMLImageElement, hands: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let fontSize = TEXT_CONFIG.initialFontSize;
    let textFits = false;

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Try different font sizes until text fits
    while (!textFits && fontSize > 5) {
      // Clear the canvas before each attempt
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      ctx.fillStyle = "#000000";
      ctx.font = `${fontSize}px "${TEXT_CONFIG.fontFamily}"`;

      // Apply transform and draw text
      ctx.save();
      ctx.translate(TEXT_CONFIG.startX, TEXT_CONFIG.startY);
      ctx.transform(
        1,
        TEXT_CONFIG.transform.skewY,
        TEXT_CONFIG.transform.skewX,
        1,
        0,
        0
      );
      ctx.translate(-TEXT_CONFIG.startX, -TEXT_CONFIG.startY);

      const result = drawTextWithPerspective(
        ctx,
        text,
        TEXT_CONFIG.startX,
        TEXT_CONFIG.startY,
        TEXT_CONFIG.maxHeight,
        TEXT_CONFIG.transform,
        fontSize
      );

      ctx.restore();

      if (result.textFits) {
        textFits = true;
      } else {
        fontSize--;
        console.log(`Reducing font size to ${fontSize} to fit text.`);
      }
    }

    // Draw hands image on top
    ctx.drawImage(hands, 0, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "executive-order.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  useEffect(() => {
    // Load both images on mount
    const trumpImage = new Image();
    trumpImage.src =
      "https://raw.githubusercontent.com/Beasleydog/execorder/refs/heads/main/public/trump.png";

    const hands = new Image();
    hands.src =
      "https://raw.githubusercontent.com/Beasleydog/execorder/refs/heads/main/public/hand.png";

    // Wait for both images to load
    Promise.all([
      new Promise((resolve) => (trumpImage.onload = resolve)),
      new Promise((resolve) => (hands.onload = resolve)),
    ]).then(() => {
      setHandsImage(hands);
      setImageLoaded(true);
      drawCanvas(trumpImage, hands);
    });
  }, []);

  useEffect(() => {
    if (imageLoaded && handsImage) {
      const image = new Image();
      image.src =
        "https://raw.githubusercontent.com/Beasleydog/execorder/refs/heads/main/public/trump.png";
      image.onload = () => drawCanvas(image, handsImage);
    }
  }, [text, imageLoaded, handsImage]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        position: "absolute",
        backgroundImage: `
          linear-gradient(to right, #e5e5e5 1px, transparent 1px),
          linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <div
        className="app-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "radial-gradient(circle, #ffffff66 0%, #ffffff 70%)",
          minHeight: "100vh",
          color: "#333",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#1C1C1C",
            fontFamily: '"Markazi Text", serif',
            marginBottom: "1rem",
            fontSize: "3.5rem",
            fontWeight: "600",
            textAlign: "center",
            marginTop: "2rem",
          }}
        >
          Presidential Decree
        </h1>
        <h2
          style={{
            color: "#333",
            fontFamily: '"Markazi Text", serif',
            marginBottom: "4rem",
            fontSize: "1.8rem",
            fontWeight: "400",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "3px",
            opacity: 0.8,
            marginTop: "-2rem",
          }}
        >
          Executive Order Simulator
        </h2>

        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%",
            height: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#fff",
          }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="By the authority vested in me as President..."
          style={{
            width: "80%",
            maxWidth: "700px",
            height: "150px",
            margin: "3rem 0",
            padding: "1.5rem",
            borderRadius: "4px",
            border: "2px dotted #666",
            fontSize: "18px",
            fontFamily: '"Markazi Text", serif',
            resize: "vertical",
            lineHeight: "1.6",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#333")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#666")}
        />

        <button
          onClick={handleDownload}
          style={{
            backgroundColor: "#1C1C1C",
            color: "#fff",
            padding: "1rem 2.5rem",
            border: "none",
            borderRadius: "4px",
            fontSize: "20px",
            cursor: "pointer",
            fontFamily: '"Markazi Text", serif',
            fontWeight: "500",
            letterSpacing: "0.5px",
            transition: "all 0.2s",
            marginBottom: "2rem",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#1C1C1C";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Issue Executive Order
        </button>
      </div>
    </div>
  );
}

export default App;
