interface Props {
  courseFileUrl: string | null
}

export default function CourseDownloads({ courseFileUrl }: Props) {
  if (!courseFileUrl) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <div className="text-amber-600 text-sm">
          Course files will be available once the organizer uploads them.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <a
        href={`/api/download/course/${encodeURIComponent(courseFileUrl)}?format=gpx`}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl no-underline text-gray-800 hover:bg-gray-50 transition-colors active:scale-[0.98]"
      >
        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full text-emerald-600 font-bold text-xs">
          GPX
        </div>
        <div>
          <div className="font-medium">Download Course GPX</div>
          <div className="text-sm text-gray-500">For Wahoo, Hammerhead, Karoo</div>
        </div>
      </a>

      <a
        href={`/api/download/course/${encodeURIComponent(courseFileUrl)}?format=fit`}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl no-underline text-gray-800 hover:bg-gray-50 transition-colors active:scale-[0.98]"
      >
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 font-bold text-xs">
          FIT
        </div>
        <div>
          <div className="font-medium">Download Course FIT</div>
          <div className="text-sm text-gray-500">For Garmin devices</div>
        </div>
      </a>
    </div>
  )
}
