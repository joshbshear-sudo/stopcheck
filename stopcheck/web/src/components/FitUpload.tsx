import { useState, useRef, useCallback } from 'react'
import { uploadFit } from '../api'

interface Props {
  authToken: string
  onUploaded: () => void
}

export default function FitUpload({ authToken, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.fit')) {
      setError('Only .fit files are accepted')
      return
    }
    setError(null)
    setUploading(true)
    try {
      await uploadFit(authToken, file)
      setSuccess(true)
      onUploaded()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [authToken, onUploaded])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  const onClickSelect = useCallback(() => inputRef.current?.click(), [])

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (success) {
    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-xl p-6 text-center">
        <div className="text-green-600 text-4xl mb-2">&#10003;</div>
        <div className="font-semibold text-green-800">File Uploaded</div>
        <div className="text-sm text-green-600 mt-1">Processing will complete within a few minutes</div>
      </div>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClickSelect}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'}
        ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <input ref={inputRef} type="file" accept=".fit" className="hidden" onChange={onChange} />

      <div className="text-gray-400 text-3xl mb-2">
        {uploading ? (
          <div className="inline-block w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto">
            <path d="M12 16V4m0 0L8 8m4-4l4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="font-medium text-gray-700">
        {uploading ? 'Uploading...' : 'Drop FIT file here'}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {uploading ? 'Please wait' : 'or tap to select from your device'}
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
