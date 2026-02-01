import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import './FlowCanvas.css';
import { resolveCollisions } from '../utils/collisionDetection';

// Component that runs inside ReactFlow context to calculate group size
function GroupSizeCalculator({ nodes, setNodes, isExpanded }) {
  const groupSizeTimeoutRef = useRef(null);
  const { getNode, fitView } = useReactFlow();
  const hasFitOnMount = useRef(false);

  // Fit view on mount
  useEffect(() => {
    if (!hasFitOnMount.current && nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
        hasFitOnMount.current = true;
      }, 500);
    }
  }, [nodes.length, fitView]);

  useEffect(() => {
    // Only recalculate group size on structural change (expand/collapse)
    // Not on every node update (which happens during training)
    if (!isExpanded) return;

    // Clear any pending calculation
    if (groupSizeTimeoutRef.current) {
      clearTimeout(groupSizeTimeoutRef.current);
    }

    // Debounce to allow React Flow to measure nodes after accordion expansion
    groupSizeTimeoutRef.current = setTimeout(() => {
      const groupNode = nodes.find(n => n.id === 'neural-network' && n.type === 'group');
      if (!groupNode) return;

      const childNodes = nodes.filter(n => n.parentId === 'neural-network');
      if (childNodes.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      childNodes.forEach(child => {
        // Get the actual node from React Flow to access DOM measurements
        const actualNode = getNode(child.id) || child;

        const x = actualNode.position?.x || child.position?.x || 0;
        const y = actualNode.position?.y || child.position?.y || 0;

        // Try to get actual DOM element size
        let width = 200;
        let height = 50;

        // First try to get from React Flow's measured dimensions
        if (actualNode.measured?.width) {
          width = actualNode.measured.width;
        } else if (actualNode.width) {
          width = actualNode.width;
        } else if (actualNode.style?.width) {
          width = typeof actualNode.style.width === 'string'
            ? parseFloat(actualNode.style.width)
            : actualNode.style.width;
        } else if (child.style?.width) {
          width = typeof child.style.width === 'string'
            ? parseFloat(child.style.width)
            : child.style.width;
        }

        if (actualNode.measured?.height) {
          height = actualNode.measured.height;
        } else if (actualNode.height) {
          height = actualNode.height;
        } else if (actualNode.style?.height) {
          height = typeof actualNode.style.height === 'string'
            ? parseFloat(actualNode.style.height)
            : actualNode.style.height;
        } else if (child.style?.height) {
          height = typeof child.style.height === 'string'
            ? parseFloat(child.style.height)
            : child.style.height;
        }

        // Try to get actual DOM element to measure its real size
        // React Flow uses class 'react-flow__node' with data-id attribute
        try {
          // Try multiple selectors to find the correct node element
          let nodeElement = document.querySelector(`.react-flow__node[data-id="${child.id}"]`);
          if (!nodeElement) {
            // Fallback: search all React Flow nodes
            const allNodes = document.querySelectorAll('.react-flow__node');
            nodeElement = Array.from(allNodes).find(el => {
              const nodeId = el.getAttribute('data-id') || el.getAttribute('id');
              return nodeId === child.id;
            });
          }

          if (nodeElement) {
            const rect = nodeElement.getBoundingClientRect();
            // Use scrollHeight for height as it includes all content (even if overflow hidden)
            // and getBoundingClientRect for width
            const measuredHeight = Math.max(rect.height, nodeElement.scrollHeight || 0);
            const measuredWidth = rect.width;

            if (measuredWidth > 0) width = measuredWidth;
            if (measuredHeight > 0) height = measuredHeight;
          }
        } catch (e) {
          // Fallback to calculated values
        }

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      const padding = 30;
      const headerHeight = 50;
      const newWidth = Math.max(750, maxX - minX + padding * 2);
      const newHeight = Math.max(220, maxY - minY + padding + headerHeight);

      // Only update if size changed (with small threshold to avoid jitter)
      const currentWidth = groupNode.style?.width || 0;
      const currentHeight = groupNode.style?.height || 0;
      const widthDiff = Math.abs(currentWidth - newWidth);
      const heightDiff = Math.abs(currentHeight - newHeight);

      if (widthDiff > 1 || heightDiff > 1) {
        setNodes(nds => nds.map(n => {
          if (n.id === 'neural-network' && n.type === 'group') {
            return {
              ...n,
              style: {
                ...n.style,
                width: newWidth,
                height: newHeight
              }
            };
          }
          return n;
        }));
      }
    }, 300); // Debounce to allow DOM to fully update after accordion expansion

    return () => {
      if (groupSizeTimeoutRef.current) {
        clearTimeout(groupSizeTimeoutRef.current);
      }
    };
  }, [isExpanded, nodes, setNodes, getNode]); // Only depend on isExpanded for structural changes

  return null; // This component doesn't render anything
}

export default function FlowCanvas({ nodes: initialNodes, edges: initialEdges, nodeTypes, edgeTypes, isExpanded }) {
  // Use useNodesState and useEdgesState - React Flow's recommended hooks
  // These manage state internally and provide change handlers
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle collision detection after dragging
  const onNodeDragStop = useCallback(() => {
    setNodes((nds) =>
      resolveCollisions(nds, {
        maxIterations: 50,
        overlapThreshold: 0.5,
        margin: 15,
      })
    );
  }, [setNodes]);

  // Only sync nodes on STRUCTURAL changes (expand/collapse), not data updates
  // This prevents resetting user-modified positions/sizes during training
  const prevIsExpandedRef = useRef(isExpanded);
  const prevNodeIdsRef = useRef(new Set());

  useEffect(() => {
    const prevNodeIds = prevNodeIdsRef.current;
    const newNodeIds = new Set(initialNodes.map(n => n.id));
    
    // Check if node structure changed (different IDs or count)
    const structureChanged = 
      prevNodeIds.size !== newNodeIds.size ||
      ![...prevNodeIds].every(id => newNodeIds.has(id)) ||
      ![...newNodeIds].every(id => prevNodeIds.has(id));

    // Reset nodes when:
    // 1. Expand/collapse state changes
    // 2. Node structure changes (layers config changed, nodes added/removed)
    if (prevIsExpandedRef.current !== isExpanded || structureChanged) {
      prevIsExpandedRef.current = isExpanded;
      prevNodeIdsRef.current = newNodeIds;
      setNodes(initialNodes);
    } else {
      // Update only node data without changing positions/dimensions
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const updatedNode = initialNodes.find((n) => n.id === node.id);
          if (updatedNode) {
            return {
              ...node,
              data: updatedNode.data, // Update data only
              type: updatedNode.type, // Update type in case of expand/collapse
            };
          }
          return node;
        })
      );
    }
  }, [isExpanded, initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        connectionLineStyle={{ stroke: '#fff', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#888', strokeWidth: 2 }
        }}
      >
        <Background />
        <Controls />
        <GroupSizeCalculator nodes={nodes} setNodes={setNodes} isExpanded={isExpanded} />
      </ReactFlow>
    </div>
  );
}
