
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePoints } from "@/contexts/PointsContext";
import { useBadges } from "@/contexts/BadgesContext";

interface ColorCalmProps {
  onClose: () => void;
}

const ColorCalm = ({ onClose }: ColorCalmProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#FF6B9D');
  const [brushSize, setBrushSize] = useState(5);
  const [brushType, setBrushType] = useState<'round' | 'square' | 'eraser' | 'fill'>('round');
  const [timeSpent, setTimeSpent] = useState(0);
  const { addPoints } = usePoints();
  const { updateProgress } = useBadges();
  const [pixelArtMode, setPixelArtMode] = useState(false);
  const [pixelGridSize, setPixelGridSize] = useState(32);
  const [pixelGrid, setPixelGrid] = useState(Array.from({ length: 32 }, () => Array(32).fill('#fff')));
  const [isPixelDrawing, setIsPixelDrawing] = useState(false);
  const [colorPicked, setColorPicked] = useState(false);
  const [pixelBrush, setPixelBrush] = useState<'color' | 'eraser' | 'fill'>('color');

  const colors = [
    '#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const brushTypes = [
    { type: 'round' as const, icon: '●', name: 'Round' },
    { type: 'square' as const, icon: '■', name: 'Square' },
    { type: 'eraser' as const, icon: '🧹', name: 'Eraser' },
    { type: 'fill' as const, icon: '🪣', name: 'Fill' },
  ];

  // Pixel art tool types for UI (with icons)
  const pixelBrushTypes = [
    { type: 'color' as const, icon: '●', name: 'Draw' },
    { type: 'eraser' as const, icon: '🧹', name: 'Eraser' },
    { type: 'fill' as const, icon: '🪣', name: 'Fill' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 300;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Flood fill algorithm for the fill tool with 8-way fill, multiple blur passes, edge dilation, and safety limit
  function floodFill(x: number, y: number, fillColor: string, tolerance = 128) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const MAX_PIXELS = 100000;

    // Convert fillColor to RGBA
    function hexToRgba(hex: string) {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
      const num = parseInt(c, 16);
      return [
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255,
        255
      ];
    }
    const targetIdx = (y*width+x)*4;
    const targetColor = [data[targetIdx], data[targetIdx+1], data[targetIdx+2], data[targetIdx+3]];
    const replacementColor = hexToRgba(fillColor);
    // If already filled, return
    if (targetColor.every((v, i) => v === replacementColor[i])) return;

    // Improved color match: Euclidean distance in RGBA space
    function colorMatch(a: number[], b: number[], tol: number) {
      const dr = a[0] - b[0];
      const dg = a[1] - b[1];
      const db = a[2] - b[2];
      const da = a[3] - b[3];
      return Math.sqrt(dr*dr + dg*dg + db*db + da*da) <= tol;
    }

    // 8-way neighbor directions
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];

    // Main flood fill
    const stack = [[x, y]];
    const filled = new Set();
    let filledCount = 0;
    while (stack.length && filledCount < MAX_PIXELS) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
      const idx = (cy*width+cx)*4;
      const color = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
      if (!colorMatch(color, targetColor, tolerance)) continue;
      data[idx] = replacementColor[0];
      data[idx+1] = replacementColor[1];
      data[idx+2] = replacementColor[2];
      data[idx+3] = replacementColor[3];
      filled.add(cy*width+cx);
      filledCount++;
      for (const [dx, dy] of directions) {
        stack.push([cx+dx, cy+dy]);
      }
    }
    // Multiple blur/anti-aliasing passes: average color for edge pixels
    for (let pass = 0; pass < 3; pass++) {
      for (const idx of filled) {
        const cx = Number(idx) % width;
        const cy = Math.floor(Number(idx) / width);
        const i = (cy*width+cx)*4;
        // If pixel is nearly white, blend with neighbors
        const pixel = [data[i], data[i+1], data[i+2], data[i+3]];
        if (Math.sqrt((pixel[0]-255)**2 + (pixel[1]-255)**2 + (pixel[2]-255)**2) < 64) {
          let r = 0, g = 0, b = 0, count = 0;
          for (const [dx, dy] of directions) {
            const nx = Number(cx+dx), ny = Number(cy+dy);
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const ni = (ny*width+nx)*4;
              r += data[ni];
              g += data[ni+1];
              b += data[ni+2];
              count++;
            }
          }
          if (count > 0) {
            data[i] = Math.round(r/count);
            data[i+1] = Math.round(g/count);
            data[i+2] = Math.round(b/count);
          }
        }
      }
    }
    // Edge dilation: expand filled area by 1 pixel
    const toDilate = [];
    for (const idx of filled) {
      const cx = Number(idx) % width;
      const cy = Math.floor(Number(idx) / width);
      for (const [dx, dy] of directions) {
        const nx = Number(cx+dx), ny = Number(cy+dy);
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny*width+nx;
          if (!filled.has(nidx)) {
            toDilate.push(nidx);
          }
        }
      }
    }
    for (const nidx of toDilate) {
      const i = nidx*4;
      data[i] = replacementColor[0];
      data[i+1] = replacementColor[1];
      data[i+2] = replacementColor[2];
      data[i+3] = replacementColor[3];
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Pixel art handlers (update to use pixelBrush)
  const handlePixelClick = (row: number, col: number) => {
    if (pixelBrush === 'fill') {
      // Flood fill for pixel art grid
      const targetColor = pixelGrid[row][col];
      if (targetColor === currentColor) return;
      const newGrid = pixelGrid.map(arr => arr.slice());
      const stack = [[row, col]];
      const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ];
      while (stack.length) {
        const [r, c] = stack.pop()!;
        if (
          r < 0 || r >= pixelGridSize ||
          c < 0 || c >= pixelGridSize ||
          newGrid[r][c] !== targetColor
        ) continue;
        newGrid[r][c] = currentColor;
        for (const [dr, dc] of directions) {
          stack.push([r + dr, c + dc]);
        }
      }
      setPixelGrid(newGrid);
      return;
    }
    setPixelGrid(grid => {
      const newGrid = grid.map(arr => arr.slice());
      newGrid[row][col] = pixelBrush === 'eraser' ? '#fff' : currentColor;
      return newGrid;
    });
  };
  const handlePixelMouseDown = (row: number, col: number) => {
    setIsPixelDrawing(true);
    handlePixelClick(row, col);
  };
  const handlePixelMouseOver = (row: number, col: number) => {
    if (isPixelDrawing) handlePixelClick(row, col);
  };
  const handlePixelMouseUp = () => setIsPixelDrawing(false);
  const clearPixelGrid = () => setPixelGrid(Array.from({ length: pixelGridSize }, () => Array(pixelGridSize).fill('#fff')));

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushType === 'fill') {
      // Fill tool: perform flood fill
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      floodFill(x, y, currentColor, 128);
      return;
    }
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (brushType === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = currentColor;
      
      if (brushType === 'round') {
        ctx.beginPath();
        ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
        ctx.fill();
      } else if (brushType === 'square') {
        ctx.fillRect(x - brushSize, y - brushSize, brushSize * 2, brushSize * 2);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const finishArtwork = () => {
    if (timeSpent >= 60) { // 1 minute minimum
      addPoints(25, 'Completed a calming art session');
      updateProgress('coloring');
    }
    onClose();
  };

  // Update pixel grid when grid size changes
  const handleGridSizeChange = (size: number) => {
    setPixelGridSize(size);
    setPixelGrid(Array.from({ length: size }, () => Array(size).fill('#fff')));
  };

  // Color picker helpers
  function rgbToHex(r: number, g: number, b: number) {
    return (
      '#' +
      [r, g, b]
        .map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }
  function hexToRgb(hex: string) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const num = parseInt(c, 16);
    return [
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255
    ];
  }
  function isValidHex(hex: string) {
    return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex);
  }
  function isValidRgb(rgb: string) {
    return /^\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*$/.test(rgb);
  }
  const rgbString = (() => {
    try {
      const [r, g, b] = hexToRgb(currentColor);
      return `${r}, ${g}, ${b}`;
    } catch {
      return '255, 255, 255';
    }
  })();

  // Update setCurrentColor to set colorPicked to true
  const setColor = (color: string) => {
    setCurrentColor(color);
    setColorPicked(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        id="scrollbar5"
        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
        style={{
          scrollbarColor: '#7c3aed #ede9fe', // dark purple thumb, light purple track
          scrollbarWidth: 'thin',
          msOverflowStyle: 'auto',
        }}
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            🎨 Color Calm
          </h2>
          <p className="text-gray-600 mb-2">
            Paint away stress with soothing patterns
          </p>
          <p className="text-sm text-gray-500">
            Time: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </p>
        </div>
        {/* Pixel Art Mode Toggle and Grid Size Selector */}
        <div className="mb-4 flex flex-col items-center">
          {pixelArtMode && (
            <div className="mb-2 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Grid Size:</span>
              {[16, 32, 64].map(size => (
                <button
                  key={size}
                  className={`px-3 py-1 rounded-full text-sm font-semibold border transition-all ${
                    pixelGridSize === size ? 'bg-pink-500 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-pink-100'
                  }`}
                  onClick={() => handleGridSizeChange(size)}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          )}
          {!pixelArtMode ? (
            <button
              className="px-4 py-2 rounded-full bg-pink-500 text-white font-semibold shadow hover:bg-pink-600 transition-all"
              onClick={() => setPixelArtMode(true)}
            >
              Pixel Art Mode
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded-full bg-purple-500 text-white font-semibold shadow hover:bg-purple-600 transition-all"
              onClick={() => setPixelArtMode(false)}
            >
              Back to Normal Mode
            </button>
          )}
        </div>
        {pixelArtMode ? (
          <>
            {/* Pixel Art Tool Selector (Draw, Eraser, Fill) - styled like normal brush types */}
            <div className="flex gap-2 justify-center mb-4">
              {pixelBrushTypes.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setPixelBrush(tool.type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    pixelBrush === tool.type
                      ? 'bg-purple-500 text-white' // All selected tools use the same purple
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{tool.icon}</span>
                  {tool.name}
                </button>
              ))}
            </div>
            {/* Pixel Art Canvas */}
            <div
              className="mx-auto mb-4"
              style={{ width: 384, height: 384, background: '#fff', display: 'grid', gridTemplateRows: `repeat(${pixelGridSize}, 1fr)`, gridTemplateColumns: `repeat(${pixelGridSize}, 1fr)`, border: '2px solid #eee' }}
              onMouseLeave={handlePixelMouseUp}
            >
              {pixelGrid.map((row, rIdx) =>
                row.map((color, cIdx) => (
                  <div
                    key={rIdx + '-' + cIdx}
                    style={{ background: color, border: '1px solid #eee', width: '100%', height: '100%', cursor: 'pointer' }}
                    onMouseDown={() => handlePixelMouseDown(rIdx, cIdx)}
                    onMouseOver={() => handlePixelMouseOver(rIdx, cIdx)}
                    onMouseUp={handlePixelMouseUp}
                  />
                ))
              )}
            </div>
            <div className="flex space-x-3 mb-4">
              <Button variant="outline" onClick={clearPixelGrid} className="flex-1 rounded-full">Clear All</Button>
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">Close</Button>
              <Button onClick={finishArtwork} className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-full">Finish (+25 pts)</Button>
            </div>
            {/* Color Palette for Pixel Art */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Colors:</p>
              <div className="flex flex-wrap gap-2 justify-center items-center mb-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                {/* Inline color picker */}
                <label className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-all hover:border-gray-500 ml-2 relative" style={{ background: colorPicked ? currentColor : 'none', overflow: 'hidden' }}>
                  {!colorPicked && (
                    <img src="/colorpickerwheel.png" alt="Color Picker Wheel" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <input
                    type="color"
                    value={isValidHex(currentColor) ? currentColor : '#ffffff'}
                    onChange={e => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ background: 'none', border: 'none' }}
                  />
                </label>
              </div>
              {/* Hex and RGB Inputs in a single row */}
              <div className="flex gap-4 justify-center items-center mt-2">
                <div className="flex gap-1 items-center">
                  <label className="text-xs text-gray-500">Hex:</label>
                  <input
                    type="text"
                    value={currentColor}
                    onChange={e => {
                      const val = e.target.value;
                      if (isValidHex(val)) setColor(val);
                    }}
                    className="w-20 px-2 py-1 rounded border text-xs"
                  />
                </div>
                <div className="flex gap-1 items-center">
                  <label className="text-xs text-gray-500">RGB:</label>
                  <input
                    type="text"
                    value={rgbString}
                    onChange={e => {
                      const val = e.target.value;
                      if (isValidRgb(val)) {
                        const [r, g, b] = val.split(',').map(x => parseInt(x.trim(), 10));
                        setColor(rgbToHex(r, g, b));
                      }
                    }}
                    className="w-24 px-2 py-1 rounded border text-xs"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
        {/* Canvas */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-inner w-full aspect-[4/3] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
                className="border border-gray-200 rounded-xl cursor-crosshair w-full h-full block"
            style={{ aspectRatio: '4/3' }}
          />
        </div>

        {/* Brush Types */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Brush Type:</p>
          <div className="flex gap-2 justify-center">
            {brushTypes.map((brush) => (
              <button
                key={brush.type}
                    onClick={() => setBrushType(brush.type as typeof brushType)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  brushType === brush.type 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{brush.icon}</span>
                {brush.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette - Only show when not using eraser */}
            {brushType !== 'eraser' && !pixelArtMode && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Colors:</p>
                <div className="flex flex-wrap gap-2 justify-center items-center mb-2">
              {colors.map((color) => (
                <button
                  key={color}
                      onClick={() => setColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
                  {/* Inline color picker */}
                  <label className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center cursor-pointer transition-all hover:border-gray-500 ml-2 relative" style={{ background: colorPicked ? currentColor : 'none', overflow: 'hidden' }}>
                    {!colorPicked && (
                      <img src="/colorpickerwheel.png" alt="Color Picker Wheel" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <input
                      type="color"
                      value={isValidHex(currentColor) ? currentColor : '#ffffff'}
                      onChange={e => setColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ background: 'none', border: 'none' }}
                    />
                  </label>
                </div>
                {/* Hex and RGB Inputs in a single row */}
                <div className="flex gap-4 justify-center items-center mt-2">
                  <div className="flex gap-1 items-center">
                    <label className="text-xs text-gray-500">Hex:</label>
                    <input
                      type="text"
                      value={currentColor}
                      onChange={e => {
                        const val = e.target.value;
                        if (isValidHex(val)) setColor(val);
                      }}
                      className="w-20 px-2 py-1 rounded border text-xs"
                    />
                  </div>
                  <div className="flex gap-1 items-center">
                    <label className="text-xs text-gray-500">RGB:</label>
                    <input
                      type="text"
                      value={rgbString}
                      onChange={e => {
                        const val = e.target.value;
                        if (isValidRgb(val)) {
                          const [r, g, b] = val.split(',').map(x => parseInt(x.trim(), 10));
                          setColor(rgbToHex(r, g, b));
                        }
                      }}
                      className="w-24 px-2 py-1 rounded border text-xs"
                    />
                  </div>
            </div>
          </div>
        )}

        {/* Brush Size */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {brushType === 'eraser' ? 'Eraser' : 'Brush'} Size:
          </p>
          <input
            type="range"
            min="2"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="flex-1 rounded-full"
          >
            Clear All
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-full"
          >
            Close
          </Button>
          <Button
            onClick={finishArtwork}
            className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-full"
          >
            Finish (+25 pts)
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ColorCalm;
