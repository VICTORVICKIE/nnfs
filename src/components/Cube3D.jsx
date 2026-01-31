import { useRef, useEffect } from 'react';
import './Cube3D.css';

export default function Cube3D({ onClick, isExpanded = false }) {
  const svgRef = useRef(null);

  // Isometric projection parameters
  const size = 80;
  const angle = Math.PI / 6; // 30 degrees
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Cube vertices in 3D space (centered at origin)
  const vertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // back face
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]      // front face
  ];

  // Project 3D point to 2D (isometric)
  const project = (x, y, z) => {
    const scale = size / 2;
    const px = (x - z) * cos * scale;
    const py = (x + z) * sin * scale - y * scale;
    return { x: px + size, y: py + size };
  };

  // Cube faces (indices into vertices array)
  const faces = [
    { indices: [0, 1, 2, 3], color: '#1a1a1a', stroke: '#333' }, // back
    { indices: [4, 5, 6, 7], color: '#2a2a2a', stroke: '#444' }, // front
    { indices: [0, 1, 5, 4], color: '#222', stroke: '#333' },   // bottom
    { indices: [2, 3, 7, 6], color: '#2a2a2a', stroke: '#444' }, // top
    { indices: [0, 3, 7, 4], color: '#1f1f1f', stroke: '#333' }, // left
    { indices: [1, 2, 6, 5], color: '#252525', stroke: '#444' }  // right
  ];

  // Sort faces by z-depth for proper rendering
  const sortedFaces = faces.map((face, idx) => {
    const zSum = face.indices.reduce((sum, i) => sum + vertices[i][2], 0);
    return { ...face, zSum, idx };
  }).sort((a, b) => b.zSum - a.zSum);

  return (
    <div className={`cube-3d-container ${isExpanded ? 'expanded' : ''}`} onClick={onClick}>
      <svg
        ref={svgRef}
        width={size * 2}
        height={size * 2}
        viewBox={`0 0 ${size * 2} ${size * 2}`}
        className="cube-3d-svg"
        onClick={onClick}
        style={{ pointerEvents: 'all', cursor: 'pointer' }}
      >
        <defs>
          <linearGradient id="cubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {sortedFaces.map((face, faceIdx) => {
          const points = face.indices.map(i => {
            const [x, y, z] = vertices[i];
            const proj = project(x, y, z);
            return `${proj.x},${proj.y}`;
          }).join(' ');

          return (
            <polygon
              key={faceIdx}
              points={points}
              fill={face.color}
              stroke={face.stroke}
              strokeWidth="1.5"
              filter={faceIdx === 0 ? 'url(#shadow)' : ''}
              className="cube-face"
            />
          );
        })}
        
        {/* Add some highlights for depth */}
        <polygon
          points={sortedFaces[0].indices.slice(0, 2).map(i => {
            const [x, y, z] = vertices[i];
            const proj = project(x, y, z);
            return `${proj.x},${proj.y}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
        />
      </svg>
      {!isExpanded && (
        <div className="cube-label">Neural Network</div>
      )}
    </div>
  );
}
