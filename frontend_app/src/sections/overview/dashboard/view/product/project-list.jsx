import Box from '@mui/material/Box';

import { ProjectItem } from './project-item';
import { ProjectItemSkeleton } from './project-skeleton';

// ----------------------------------------------------------------------

export function ProjectList({ projects, loading, ...other }) {
  const renderLoading = <ProjectItemSkeleton />;

  const renderList = projects.map((project) => <ProjectItem key={project.id} project={project} />);

  return (
    <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        }}
        {...other}
      >
        {loading ? renderLoading : renderList}
      </Box>
  );
}
