import type { CommunityTheme } from './types';

// Cover gradients a community can pick (used when there's no cover photo).
export const THEME_GRADIENTS: Record<CommunityTheme, string> = {
  grove: 'linear-gradient(135deg, #00B2FF 0%, #B620E0 100%)',
  ocean: 'linear-gradient(135deg, #0866FF 0%, #00B2FF 100%)',
  sunset: 'linear-gradient(135deg, #F7B928 0%, #FA383E 100%)',
  forest: 'linear-gradient(135deg, #31A24C 0%, #0F766E 100%)',
  berry: 'linear-gradient(135deg, #B620E0 0%, #EC4899 100%)',
  night: 'linear-gradient(135deg, #312E81 0%, #1C1E21 100%)',
};
