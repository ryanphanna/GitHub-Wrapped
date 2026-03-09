export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface Theme {
  id: string
  label: string
  isDark: boolean
  bg: string
  accent: string
  cardBg: string
  text: string
  subtext: string
  heatmap: string[]
  divider: string
}

export const THEMES: Theme[] = [
  {
    id: 'daylight',
    label: 'Light',
    isDark: false,
    bg: 'linear-gradient(170deg, #f6f8fa 0%, #f6f8fa 55%, #e6ffec 100%)',
    accent: '#2da44e',
    cardBg: '#ffffff',
    text: '#24292f',
    subtext: '#57606a',
    heatmap: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    divider: '#d0d7de',
  },
  {
    id: 'midnight',
    label: 'Dark',
    isDark: true,
    bg: 'linear-gradient(170deg, #0d1117 0%, #0d1117 55%, #0b1d10 100%)',
    accent: '#39d353',
    cardBg: '#161b22',
    text: '#e6edf3',
    subtext: '#7d8590',
    heatmap: ['#2d333b', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    divider: '#21262d',
  },
  {
    id: 'gold',
    label: 'Gold',
    isDark: true,
    bg: 'linear-gradient(170deg, #1a1600 0%, #2c2500 55%, #3d3300 100%)',
    accent: '#ffd700',
    cardBg: '#2d2600',
    text: '#fff9e6',
    subtext: '#b3a77d',
    heatmap: ['#4f4300', '#f3d673', '#d4af37', '#b89122', '#aa8218'],
    divider: '#5a4d00',
  },
  {
    id: 'cyberpunk',
    label: 'Cyber',
    isDark: true,
    bg: 'linear-gradient(170deg, #050005 0%, #150015 55%, #250025 100%)',
    accent: '#ff00ff',
    cardBg: '#250025',
    text: '#ffe6ff',
    subtext: '#b37db3',
    heatmap: ['#4d004d', '#ff99ff', '#ff00ff', '#cc00cc', '#990099'],
    divider: '#4d004d',
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
