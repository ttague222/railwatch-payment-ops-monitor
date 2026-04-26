import type { SimulatorSeedConfig } from '../types';

// Re-export for convenience
export type { SimulatorSeedConfig };

export const DEFAULT_SEED_CONFIG: SimulatorSeedConfig = {
  institutionName: 'Lakeside Community Credit Union',
  assetSizeUSD: 3_000_000_000,
  railVolumeRanges: {
    ACH_Standard:       { min: 8000,  max: 15000 },
    ACH_Same_Day:       { min: 500,   max: 2000  },
    Wire_Domestic:      { min: 50,    max: 200   },
    Wire_International: { min: 5,     max: 30    },
    RTP:                { min: 200,   max: 800   },
    FedNow:             { min: 100,   max: 500   },
  },
  failureRateRanges: {
    ACH_Standard:       { min: 0.005, max: 0.03  },
    ACH_Same_Day:       { min: 0.005, max: 0.03  },
    Wire_Domestic:      { min: 0.001, max: 0.01  },
    Wire_International: { min: 0.001, max: 0.01  },
    RTP:                { min: 0.002, max: 0.02  },
    FedNow:             { min: 0.002, max: 0.02  },
  },
  exceptionCountRange:     { min: 15,        max: 80         },
  settlementPositionRange: { min: 8_000_000, max: 25_000_000 },
};
