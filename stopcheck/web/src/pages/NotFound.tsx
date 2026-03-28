export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">&#128683;</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500">
          This page doesn't exist. If you received a link from your event organizer,
          please check the URL and try again.
        </p>
      </div>
    </div>
  )
}
