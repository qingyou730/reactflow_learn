import  { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './text-updater-node.css';

function CustomNode({ data }) {
  return (
    <div className="node-item">
      <div className="node-title">
          {data.title + '标题'}
      </div>
      <div className="content">
          {data.content}
        </div>
      <Handle type="target" position={Position.Top}/>
      <Handle type="source" position={Position.Bottom}/>
    </div>
  );
}

export default memo(CustomNode);

