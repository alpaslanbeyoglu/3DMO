import React, { useState } from 'react';
import { CADViewport, ViewportMode } from './CADViewport';

export const ViewportGrid: React.FC = () => {
  const [maximizedViewport, setMaximizedViewport] = useState<ViewportMode | null>(null);

  const toggleMaximize = (mode: ViewportMode) => {
    if (maximizedViewport === mode) {
      setMaximizedViewport(null);
    } else {
      setMaximizedViewport(mode);
    }
  };

  if (maximizedViewport) {
    return (
      <div className="w-full h-full p-0.5">
        <CADViewport
          mode={maximizedViewport}
          isMaximized={true}
          onToggleMaximize={() => toggleMaximize(maximizedViewport)}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 p-0.5 bg-gray-900">
      <CADViewport
        mode="3D"
        isMaximized={false}
        onToggleMaximize={() => toggleMaximize('3D')}
      />
      <CADViewport
        mode="Top"
        isMaximized={false}
        onToggleMaximize={() => toggleMaximize('Top')}
      />
      <CADViewport
        mode="Front"
        isMaximized={false}
        onToggleMaximize={() => toggleMaximize('Front')}
      />
      <CADViewport
        mode="Right"
        isMaximized={false}
        onToggleMaximize={() => toggleMaximize('Right')}
      />
    </div>
  );
};
