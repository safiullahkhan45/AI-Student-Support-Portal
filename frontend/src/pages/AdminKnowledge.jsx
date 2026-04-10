import { useEffect, useRef, useState } from 'react'
import api from '../api/client'

export default function AdminKnowledge() {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    try {
      const res = await api.get('/knowledge')
      setDocuments(res.data)
    } catch (err) {
      console.error('Failed to load documents', err)
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileInputRef.current?.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const res = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadSuccess(`Uploaded "${res.data.filename}" — ${res.data.chunk_count} chunks created`)
      fileInputRef.current.value = ''
      fetchDocuments()
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId, filename) {
    if (!confirm(`Delete "${filename}"? This will remove it from the AI knowledge base.`)) return
    try {
      await api.delete(`/knowledge/${docId}`)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      alert('Failed to delete document')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Knowledge Base</h2>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload New Document</h3>
        <form onSubmit={handleUpload} className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="flex-1 text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {uploadSuccess && (
          <p className="mt-3 text-sm text-green-600">{uploadSuccess}</p>
        )}
        {uploadError && (
          <p className="mt-3 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">
            Uploaded Documents ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No documents uploaded yet. Upload a PDF to get started.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{doc.filename}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {doc.chunk_count} chunks · Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium transition"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}