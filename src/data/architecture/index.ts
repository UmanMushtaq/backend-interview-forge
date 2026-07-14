import type { ArchitectureModule, ArchitectureLesson } from '../../types';
import { foundations } from './foundations';
import { dataStorage } from './data-storage';
import { communicationPatterns } from './communication-patterns';
import { distributedSystems } from './distributed-systems';
import { microservicesDdd } from './microservices-ddd';
import { fullSystemDesign } from './full-system-design';

export const ARCHITECTURE_MODULES: ArchitectureModule[] = [
  foundations,
  dataStorage,
  communicationPatterns,
  distributedSystems,
  microservicesDdd,
  fullSystemDesign,
];

export const architectureModuleById: Record<string, ArchitectureModule> = Object.fromEntries(
  ARCHITECTURE_MODULES.map((m) => [m.id, m]),
);

interface LessonLocation {
  module: ArchitectureModule;
  lesson: ArchitectureLesson;
  index: number;
}

export const architectureLessonLocationById: Record<string, LessonLocation> = Object.fromEntries(
  ARCHITECTURE_MODULES.flatMap((m) => m.lessons.map((lesson, index) => [lesson.id, { module: m, lesson, index }])),
);
