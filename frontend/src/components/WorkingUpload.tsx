'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Upload, FileText, Image, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'

interface WorkingUploadProps {
  sessionId: string
  studentId: string
  topicId: string
  onUploadComplete: (result: WorkingAnalysisResult) => void
  onUploadError?: (error: string) => void
}

interface WorkingAnalysisResult {
  working_id: string
  extracted_text: string
  working_steps: WorkingStep[]
  analysis: AnalysisResult
  feedback: FeedbackMessage
}

interface WorkingStep {
  step_number: number
  content: string
  type: string
  has_equation: boolean
  has_calculation: boolean
}

interface AnalysisResult {
  is_correct: boolean
  has_partial_understanding: boolean
  errors: ErrorDetail[]
  correct_steps: CorrectStep[]
  error_location: number | null
  total_steps: number
  correct_steps_count: number
  error_count: number
}

interface ErrorDetail {
  step_number: number
  error_code: string
  error_category: string
  error_description: string
  student_content: string
  corrected_content: string
  explanation: string
}

interface CorrectStep {
  step_number: number
  content: string
}

interface FeedbackMessage {
  type: 'positive' | 'partial' | 'needs_help'
  title: string
  message: string
  error_location?: number | null
  corrected_step?: string | null
}

export default function WorkingUpload({
  sessionId,
  studentId,
  topicId,
  onUploadComplete,
  onUploadError,
}: WorkingUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [typedWorking, setTypedWorking] = useState('')
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && isValidFileType(file)) {
      setSelectedFile(file)
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/pdf',
      'text/plain',
    ]
    return validTypes.includes(file.type)
  }

  const handleUpload = async () => {
    if (!selectedFile && !typedWorking) {
      onUploadError?.('Please select a file or type your working')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()

      if (uploadMode === 'file' && selectedFile) {
        formData.append('file', selectedFile)
        formData.append('session_id', sessionId)
        formData.append('student_id', studentId)
        formData.append('topic_id', topicId)

        const response = await fetch('http://localhost:8000/api/analyse/working/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()
        onUploadComplete(result)
      } else if (uploadMode === 'text' && typedWorking) {
        const textFormData = new FormData()
        textFormData.append('working_text', typedWorking)
        textFormData.append('session_id', sessionId)
        textFormData.append('student_id', studentId)
        textFormData.append('topic_id', topicId)

        const response = await fetch('http://localhost:8000/api/analyse/working/text', {
          method: 'POST',
          body: textFormData,
        })

        if (!response.ok) {
          throw new Error('Analysis failed')
        }

        const result = await response.json()
        onUploadComplete(result)
      }

      // Clear form
      setSelectedFile(null)
      setPreviewUrl(null)
      setTypedWorking('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-lg border-2 border-purple-200">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Upload size={20} className="text-purple-600" />
          Share Your Working
        </h3>
        <p className="text-sm text-gray-600">
          Upload a photo of your working, or type it out step-by-step
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUploadMode('file')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            uploadMode === 'file'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Image size={16} />
            Upload Image/PDF
          </div>
        </button>
        <button
          onClick={() => setUploadMode('text')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            uploadMode === 'text'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FileText size={16} />
            Type Working
          </div>
        </button>
      </div>

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-4">
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearSelection()
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <FileText size={20} />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-sm text-gray-500">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              <p className="text-sm text-gray-500">
                Click to change or drag and drop a new file
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload size={48} className="mx-auto text-gray-400" />
              <div>
                <p className="text-gray-700 font-medium">
                  Drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports: PNG, JPG, PDF, or TXT
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Input Mode */}
      {uploadMode === 'text' && (
        <div className="space-y-2">
          <textarea
            value={typedWorking}
            onChange={(e) => setTypedWorking(e.target.value)}
            placeholder="Type your working step-by-step...

Example:
Step 1: x + 5 = 12
Step 2: x = 12 - 5
Step 3: x = 7"
            className="w-full h-48 p-4 border-2 border-gray-300 rounded-xl resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 font-mono text-sm"
          />
          <p className="text-sm text-gray-500">
            Show all your working steps clearly
          </p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || (!selectedFile && !typedWorking)}
        className={`w-full mt-4 py-3 px-6 rounded-xl font-bold text-white transition-all ${
          isUploading || (!selectedFile && !typedWorking)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            Analysing your working...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            Submit Working for Feedback
          </div>
        )}
      </button>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2 text-sm"> Tips for Great Working:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li> Show EVERY step, even simple ones</li>
          <li> Write clearly and neatly</li>
          <li> Use the method your teacher showed you</li>
          <li> Check each step as you go</li>
          <li> Don't worry about mistakes - that's how we learn!</li>
        </ul>
      </div>
    </div>
  )
}
