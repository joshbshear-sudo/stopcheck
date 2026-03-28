import { getOAuthUrl } from '../api'

interface Props {
  platform: 'strava' | 'garmin' | 'wahoo'
  riderToken: string
  connected: boolean
  connectedPlatform: string | null
}

const platformConfig = {
  strava: {
    name: 'Strava',
    color: 'bg-[#fc4c02] hover:bg-[#e34402]',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
    ),
  },
  garmin: {
    name: 'Garmin',
    color: 'bg-[#007cc3] hover:bg-[#006bac]',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    ),
  },
  wahoo: {
    name: 'Wahoo',
    color: 'bg-[#1a73e8] hover:bg-[#1565c0]',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
}

export default function OAuthButton({ platform, riderToken, connected, connectedPlatform }: Props) {
  const config = platformConfig[platform]
  const isThisPlatform = connectedPlatform === platform

  if (connected && isThisPlatform) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full text-green-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-green-800">{config.name} Connected</div>
          <div className="text-sm text-green-600">Your activities will sync automatically</div>
        </div>
      </div>
    )
  }

  if (connected && !isThisPlatform) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl opacity-60">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-gray-400">
          {config.icon}
        </div>
        <div className="text-gray-500 text-sm">
          Already connected via {connectedPlatform}
        </div>
      </div>
    )
  }

  return (
    <a
      href={getOAuthUrl(platform, riderToken)}
      className={`flex items-center gap-3 px-4 py-3 ${config.color} text-white rounded-xl no-underline transition-colors active:scale-[0.98]`}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
        {config.icon}
      </div>
      <div>
        <div className="font-semibold">Connect {config.name}</div>
        <div className="text-sm opacity-90">Authorize activity access</div>
      </div>
    </a>
  )
}
