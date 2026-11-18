import Link from 'next/link';
import { BreakType, SkillLevel, TidePreference } from '@/domain/models/Spot';
import { AUTHOR_NAME, REPO_URL } from '@/presentation/lib/site';

export const BREAK_LABEL_EN: Record<BreakType, string> = {
  'beach-break': 'Beach break',
  'reef-break': 'Reef',
  'point-break': 'Point break',
  slab: 'Slab',
};

export const SKILL_LABEL_EN: Record<SkillLevel, string> = {
  'all-levels': 'All levels',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const TIDE_LABEL_EN: Record<TidePreference, string> = {
  low: 'Low',
  mid: 'Mid',
  high: 'High',
  all: 'Any',
};

export const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Footer of the English pages: the same disclaimer and credits as the Spanish one, shorter. */
export function EnglishFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-4xl space-y-4 px-5 py-12 text-sm leading-relaxed text-ink-2 sm:px-8">
        <p>
          <span className="font-medium text-ink">Data, not a guarantee.</span> Scores, heights and windows come from global ocean and
          weather models and may differ from what you find on the beach. Always decide on the spot, according to your level.
        </p>
        <p className="text-ink-3">
          Waves, wind, tide and water temperature:{' '}
          <a className="underline underline-offset-4 hover:text-ink" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>{' '}
          (CC BY 4.0). Webcams belong to their owners. Made by {AUTHOR_NAME} ·{' '}
          <a className="underline underline-offset-4 hover:text-ink" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            open source
          </a>{' '}
          ·{' '}
          <Link href="/" hrefLang="es" lang="es" className="underline underline-offset-4 hover:text-ink">
            Español
          </Link>
        </p>
      </div>
    </footer>
  );
}

/** Note next to links into the live app, which is only in Spanish. */
export const IN_SPANISH = '(in Spanish)';
