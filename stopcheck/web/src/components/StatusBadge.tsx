interface Props {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pass: { label: 'PASS', bg: 'bg-green-100', text: 'text-green-800' },
  fail: { label: 'FAIL', bg: 'bg-red-100', text: 'text-red-800' },
  missed: { label: 'MISSED', bg: 'bg-red-100', text: 'text-red-800' },
  guard_waived: { label: 'GUARD WAIVED', bg: 'bg-blue-100', text: 'text-blue-800' },
  not_applicable: { label: 'N/A', bg: 'bg-gray-100', text: 'text-gray-600' },
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5 font-bold',
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const config = statusConfig[status] || statusConfig.missed
  return (
    <span className={`inline-block rounded-full font-semibold tracking-wide ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  )
}
