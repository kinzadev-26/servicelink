import { BriefcaseBusiness, GraduationCap, Scissors, Snowflake, Sparkles, Wrench, Zap } from 'lucide-react';

// A coloured tile with an icon for each category (like the company logos in the reference).
const ICONS = {
  plumbing: Wrench,
  electrician: Zap,
  'home cleaning': Sparkles,
  tutoring: GraduationCap,
  tailoring: Scissors,
  'ac repair': Snowflake,
};
const TINTS = ['bg-emerald-500', 'bg-brand-500', 'bg-sky-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500'];

export default function CategoryAvatar({ name = '', size = 'md' }) {
  const Icon = ICONS[name.toLowerCase()] || BriefcaseBusiness;
  const tint = TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];
  const box = size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-14 w-14 rounded-2xl';
  return (
    <span className={`grid shrink-0 place-items-center text-white ${box} ${tint}`}>
      <Icon size={size === 'lg' ? 30 : 26} />
    </span>
  );
}
