import { useState, useEffect, useRef } from "react";
import "./App.css";

// Text configuration
const TEXT_CONFIG = {
  // Starting position of text
  startX: 170,
  startY: 150,

  // Common text formatting
  fontFamily: "Times New Roman",
  maxWidth: 170,
  initialFontSize: 36, // Increased from previous size
  // Removed minFontSize to allow unlimited shrinking
  lineHeightRatio: 1.5, // Line height as a ratio of font size

  // Column height limits
  firstColumnMaxHeight: 200, // Maximum height for first column
  secondColumnMaxHeight: 150, // Maximum height for second column

  // First column perspective transform
  firstColumn: {
    skewX: -0.02,
    skewY: 0.1,
    xOffsetMultiplier: 0.05,
    xOffsetBaseY: 50,
  },

  // Second column configuration
  secondColumn: {
    x: 370,
    y: 160,
    skewX: 0.02,
    skewY: -0.08,
    xOffsetMultiplier: 0.03,
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
    remainingText: string;
  }

  const drawTextWithPerspective = (
    ctx: CanvasRenderingContext2D,
    text: string,
    startX: number,
    startY: number,
    maxHeight: number,
    columnConfig:
      | typeof TEXT_CONFIG.firstColumn
      | typeof TEXT_CONFIG.secondColumn,
    fontSize: number
  ): ColumnResult => {
    const lineHeight = getCurrentLineHeight(fontSize);
    let y = startY;
    let remainingText = "";

    const words = text.split(" ");
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > TEXT_CONFIG.maxWidth) {
        // If current line exceeds maxWidth, render the current line
        if (y + lineHeight > startY + maxHeight) {
          // If adding this line exceeds maxHeight, stop and carry over the remaining words
          remainingText = words.slice(i).join(" ");
          break;
        }

        // Draw the current line
        const xOffset =
          (y - columnConfig.xOffsetBaseY) * columnConfig.xOffsetMultiplier;
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
        (y - columnConfig.xOffsetBaseY) * columnConfig.xOffsetMultiplier;
      ctx.fillText(currentLine, startX + xOffset, y);
      y += lineHeight;
    } else if (currentLine) {
      remainingText = currentLine + (remainingText ? ` ${remainingText}` : "");
    }

    return { remainingText };
  };

  function prepareColumn(
    text: string,
    startX: number,
    startY: number,
    maxHeight: number,
    columnConfig:
      | typeof TEXT_CONFIG.firstColumn
      | typeof TEXT_CONFIG.secondColumn,
    ctx: CanvasRenderingContext2D,
    fontSize: number
  ): ColumnResult {
    return drawTextWithPerspective(
      ctx,
      text,
      startX,
      startY,
      maxHeight,
      columnConfig,
      fontSize
    );
  }

  function applyPerspectiveTransform(
    ctx: CanvasRenderingContext2D,
    columnConfig:
      | typeof TEXT_CONFIG.firstColumn
      | typeof TEXT_CONFIG.secondColumn
  ) {
    const x = columnConfig.x || TEXT_CONFIG.startX;
    const y = columnConfig.y || TEXT_CONFIG.startY;

    ctx.translate(x, y);
    ctx.transform(1, columnConfig.skewY, columnConfig.skewX, 1, 0, 0);
    ctx.translate(-x, -y);
  }

  const drawCanvas = (image: HTMLImageElement, hands: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let fontSize = TEXT_CONFIG.initialFontSize;
    let textFits = false;
    let finalRemainingText = "";

    // Function to attempt drawing text with the current font size
    const attemptDraw = (): boolean => {
      ctx.font = `${fontSize}px "${TEXT_CONFIG.fontFamily}"`;
      const lineHeight = getCurrentLineHeight(fontSize);

      // First Column Processing
      const firstColumnResult = prepareColumn(
        text,
        TEXT_CONFIG.startX,
        TEXT_CONFIG.startY,
        TEXT_CONFIG.firstColumnMaxHeight,
        TEXT_CONFIG.firstColumn,
        ctx,
        fontSize
      );

      // Second Column Processing
      const secondColumnResult = prepareColumn(
        firstColumnResult.remainingText,
        TEXT_CONFIG.secondColumn.x,
        TEXT_CONFIG.secondColumn.y,
        TEXT_CONFIG.secondColumnMaxHeight,
        TEXT_CONFIG.secondColumn,
        ctx,
        fontSize
      );

      // Check if all text fits within both columns
      finalRemainingText = secondColumnResult.remainingText;
      return finalRemainingText === "";
    };

    // Try different font sizes until text fits in both columns
    while (!textFits) {
      if (attemptDraw()) {
        textFits = true;
      } else {
        fontSize--;
        console.log(`Reducing font size to ${fontSize} to fit text.`);
        // Continue looping until all text fits
      }

      // Prevent infinite loop by breaking if font size becomes too small
      if (fontSize <= 5) {
        // Arbitrary lower limit to maintain readability
        console.warn(
          "Font size is very small. Some words might not fit properly."
        );
        break;
      }
    }

    // Set canvas size to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Clear the canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image
    ctx.drawImage(image, 0, 0);

    // Draw text columns
    ctx.fillStyle = "#000000";

    // Set final font size
    ctx.font = `${fontSize}px "${TEXT_CONFIG.fontFamily}"`;

    // First Column Transformation
    ctx.save();
    applyPerspectiveTransform(ctx, TEXT_CONFIG.firstColumn);
    drawTextWithPerspective(
      ctx,
      text,
      TEXT_CONFIG.startX,
      TEXT_CONFIG.startY,
      TEXT_CONFIG.firstColumnMaxHeight,
      TEXT_CONFIG.firstColumn,
      fontSize
    );
    ctx.restore();

    if (finalRemainingText) {
      ctx.save();
      // Second Column Transformation
      applyPerspectiveTransform(ctx, TEXT_CONFIG.secondColumn);
      drawTextWithPerspective(
        ctx,
        finalRemainingText,
        TEXT_CONFIG.secondColumn.x,
        TEXT_CONFIG.secondColumn.y,
        TEXT_CONFIG.secondColumnMaxHeight,
        TEXT_CONFIG.secondColumn,
        fontSize
      );
      ctx.restore();
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
    trumpImage.src = "/trump.jpg";

    const hands = new Image();
    hands.src = "/hands.png";

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
      image.src = "/trump.jpg";
      image.onload = () => drawCanvas(image, handsImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, imageLoaded, handsImage]);

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        backgroundColor: "#1a237e",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <h1
        style={{
          color: "#C4A484",
          fontFamily: '"Times New Roman", serif',
          marginBottom: "2rem",
        }}
      >
        Executive Order Generator
      </h1>

      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          height: "auto",
          border: "5px solid #C4A484",
          borderRadius: "8px",
          backgroundColor: "#fff",
        }}
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your executive order text here..."
        style={{
          width: "80%",
          height: "150px",
          margin: "2rem 0",
          padding: "1rem",
          borderRadius: "8px",
          border: "2px solid #C4A484",
          fontSize: "16px",
          fontFamily: '"Times New Roman", serif',
        }}
      />

      <button
        onClick={handleDownload}
        style={{
          backgroundColor: "#C4A484",
          color: "#1a237e",
          padding: "1rem 2rem",
          border: "none",
          borderRadius: "8px",
          fontSize: "18px",
          cursor: "pointer",
          fontFamily: '"Times New Roman", serif',
          fontWeight: "bold",
          transition: "transform 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Download Executive Order
      </button>
    </div>
  );
}

export default App;
