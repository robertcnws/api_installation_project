import React, { useState } from 'react';

import { Button } from '@mui/material';

const PrettifiedJson = ({ data, maxLength = 200 }) => {
  const jsonString = JSON.stringify(data, null, 2);
  const [expanded, setExpanded] = useState(false);

  if (jsonString.length <= maxLength) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
        {jsonString}
      </pre>
    );
  }

  const displayText = expanded ? jsonString : `${jsonString.substring(0, maxLength)} ...`;

  return (
    <div>
      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
        {displayText}
      </pre>
      <Button size="small" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'See less' : 'See more'}
      </Button>
    </div>
  );
};

export default PrettifiedJson;
