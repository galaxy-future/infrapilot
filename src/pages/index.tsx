'use client';
import type { ReactNode } from 'react';

import Projects from '@/pages/projects';

export default function Index(): ReactNode {
  return <Projects />;
}

Index.getLayout = (page: ReactNode): ReactNode => page;