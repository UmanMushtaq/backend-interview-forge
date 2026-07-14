import {
  Monitor,
  Shield,
  GitFork,
  Server,
  Database,
  Zap,
  Radio,
  Layers,
  Globe,
  Link as LinkIcon,
  Lock,
  HardDrive,
  Rows3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ComponentType =
  | 'client'
  | 'api-gateway'
  | 'load-balancer'
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'kafka'
  | 'cdn'
  | 'external-api'
  | 'auth'
  | 'storage'
  | 'shard';

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface ComponentMeta {
  paletteLabel: string;
  defaultLabel: string;
  icon: LucideIcon;
  border: string;
  bg: string;
  text: string;
}

export const COMPONENT_META: Record<ComponentType, ComponentMeta> = {
  client: { paletteLabel: 'Client', defaultLabel: 'Client', icon: Monitor, border: 'border-blue-400', bg: 'bg-blue-400/10', text: 'text-blue-400' },
  'api-gateway': { paletteLabel: 'API Gateway', defaultLabel: 'API Gateway', icon: Shield, border: 'border-violet-400', bg: 'bg-violet-400/10', text: 'text-violet-400' },
  'load-balancer': { paletteLabel: 'Load Balancer', defaultLabel: 'Load Balancer', icon: GitFork, border: 'border-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400' },
  service: { paletteLabel: 'Service', defaultLabel: 'Service', icon: Server, border: 'border-green-400', bg: 'bg-green-400/10', text: 'text-green-400' },
  database: { paletteLabel: 'Database', defaultLabel: 'Database', icon: Database, border: 'border-indigo-400', bg: 'bg-indigo-400/10', text: 'text-indigo-400' },
  cache: { paletteLabel: 'Cache / Redis', defaultLabel: 'Cache', icon: Zap, border: 'border-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
  queue: { paletteLabel: 'Queue / RabbitMQ', defaultLabel: 'Queue', icon: Radio, border: 'border-pink-400', bg: 'bg-pink-400/10', text: 'text-pink-400' },
  kafka: { paletteLabel: 'Kafka', defaultLabel: 'Kafka', icon: Layers, border: 'border-purple-400', bg: 'bg-purple-400/10', text: 'text-purple-400' },
  cdn: { paletteLabel: 'CDN', defaultLabel: 'CDN', icon: Globe, border: 'border-cyan-400', bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
  'external-api': { paletteLabel: 'External API', defaultLabel: 'External API', icon: LinkIcon, border: 'border-gray-400', bg: 'bg-gray-400/10', text: 'text-gray-400' },
  auth: { paletteLabel: 'Auth Service', defaultLabel: 'Auth', icon: Lock, border: 'border-red-400', bg: 'bg-red-400/10', text: 'text-red-400' },
  storage: { paletteLabel: 'Storage', defaultLabel: 'Storage', icon: HardDrive, border: 'border-teal-400', bg: 'bg-teal-400/10', text: 'text-teal-400' },
  shard: { paletteLabel: 'Shard', defaultLabel: 'Shard', icon: Rows3, border: 'border-lime-400', bg: 'bg-lime-400/10', text: 'text-lime-400' },
};

// Full palette, including types added for Architecture Studio (e.g. 'shard').
// Design Canvas keeps its own original 12-type list so its palette is unchanged;
// this extended list is for consumers (like Architecture Studio) that want the new types.
export const ALL_COMPONENT_TYPES: ComponentType[] = [
  'client',
  'api-gateway',
  'load-balancer',
  'service',
  'database',
  'cache',
  'queue',
  'kafka',
  'cdn',
  'external-api',
  'auth',
  'storage',
  'shard',
];

export const NODE_SIZE = 80;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
