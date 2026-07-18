import type { OpenNextConfig } from 'open-next'

const config: OpenNextConfig = {
  overrides: {
    default: {
      edge: true,
    },
    api: {
      edge: true,
    },
  },
}

export default config
