'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, CheckCircle, AlertTriangle, Image as ImageIcon, FileText, Loader2 } from 'lucide-react'

interface UploadedWorking {
  file: File
  previewUrl?: string
  extractedText?: string
  status: 'uploading' | 'processing' | 'complete' | 'error'
  analysis?: WorkingAnalysis
}

interface WorkingAnalysis {
  is_fully_correct: boolean
  correct_steps: number[]
  errors: Array<{
    step_number: number
    student_working: string
    expected_working: string
    error_type: string
    error_category: string
  }>
  first_error_step?: number
  feedback: string
  message: string
  corrected_working?: Array<{
    step_number: number
    correct_working: string
    student_working: string
    is_error_step: boolean
    status: string
    correction_note: string
  }>
}

interface StudentWorkingUploadProps {
  onAnalysisComplete: (analysis: WorkingAnalysis) => void
  topicId: string
  acceptedTypes?: string[]
  maxSizeMB?: number
}

export default function StudentWorkingUpload({
  onAnalysisComplete,
  topicId,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  maxSizeMB = 10
}: StudentWorkingUploadProps) {
  const [uploadedWorking, setUploadedWorking] = useState<UploadedWorking | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      alert(`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Maximum size: ${maxSizeMB}MB`)
      return
    }

    // Create preview for images
    let previewUrl: string | undefined
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file)
    }

    // Set initial state
    const working: UploadedWorking = {
      file,
      previewUrl,
      status: 'uploading'
    }

    setUploadedWorking(working)

    // Simulate upload and analysis (in production, call API)
    try {
      // Update to processing
      setUploadedWorking(prev => prev ? { ...prev, status: 'processing' } : null)

      // In production, upload to API and get analysis
      // const formData = new FormData()
      // formData.append('file', file)
      // formData.append('topic_id', topicId)
      // const response = await fetch('/api/analyse/working', { method: 'POST', body: formData })
      // const analysis = await response.json()

      // Simulate API call for demo
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock analysis for demo
      const mockAnalysis: WorkingAnalysis = {
        is_fully_correct: false,
        correct_steps: [1, 2],
        errors: [{
          step_number: 3,
          student_working: '2x + 5 = 15, so 2x = 20',
          expected_working: '2x + 5 = 15, so 2x = 10',
          error_type: 'arithmetic',
          error_category: 'arithmetic'
        }],
        first_error_step: 3,
        feedback: ' Here's where it went wrong: Step 3',
        message: 'Let's fix this step together. Check your calculation in this step.',
        corrected_working: [
          {
            step_number: 1,
            correct_working: '2x + 5 = 15',
            student_working: '2x + 5 = 15',
            is_error_step: false,
            status: 'correct',
            correction_note: ' Correct'
          },
          {
            step_number: 2,
            correct_working: '2x = 15 - 5',
            student_working: '2x = 15 - 5',
            is_error_step: false,
            status: 'correct',
            correction_note: ' Correct'
          },
          {
            step_number: 3,
            correct_working: '2x = 10',
            student_working: '2x = 20',
            is_error_step: true,
            status: 'needs_correction',
            correction_note: ' Fix this step'
          },
          {
            step_number: 4,
            correct_working: 'x = 5',
            student_working: 'x = 10',
            is_error_step: false,
            status: 'consequence',
            correction_note: '→ Affected by step 3'
          }
        ]
      }

      setUploadedWorking(prev => prev ? {
        ...prev,
        status: 'complete',
        analysis: mockAnalysis
      } : null)

      onAnalysisComplete(mockAnalysis)

    } catch (error) {
      console.error('Error analysing working:', error)
      setUploadedWorking(prev => prev ? { ...prev, status: 'error' } : null)
    }
  }, [acceptedTypes, maxSizeMB, onAnalysisComplete, topicId])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const handleRemove = useCallback(() => {
    if (uploadedWorking?.previewUrl) {
      URL.revokeObjectURL(uploadedWorking.previewUrl)
    }
    setUploadedWorking(null)
  }, [uploadedWorking])

  return (
    <div className="space-y-4">
      {!uploadedWorking ? (
        // Upload area
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleChange}
            accept={acceptedTypes.join(',')}
            className="hidden"
          />

          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />

          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Upload Your Working
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Take a photo of your homework or type your solution
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Choose File
            </button>
            <span className="text-sm text-gray-500">or drag and drop</span>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Accepted: PNG, JPG, PDF (max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        // Uploaded file display
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              {uploadedWorking.file.type.startsWith('image/') ? (
                <ImageIcon className="w-5 h-5 text-blue-500" />
              ) : (
                <FileText className="w-5 h-5 text-purple-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {uploadedWorking.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedWorking.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadedWorking.status === 'uploading' && (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              )}
              {uploadedWorking.status === 'processing' && (
                <span className="text-sm text-purple-600 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysing...
                </span>
              )}
              {uploadedWorking.status === 'complete' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {uploadedWorking.status === 'error' && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}

              <button
                onClick={handleRemove}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Preview */}
          {uploadedWorking.previewUrl && (
            <div className="p-4 bg-white">
              <img
                src={uploadedWorking.previewUrl}
                alt="Uploaded working"
                className="max-h-64 mx-auto rounded border"
              />
            </div>
          )}

          {/* Analysis Results */}
          {uploadedWorking.analysis && (
            <AnalysisResults analysis={uploadedWorking.analysis} />
          )}
        </div>
      )}
    </div>
  )
}

interface AnalysisResultsProps {
  analysis: WorkingAnalysis
}

function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="border-t">
      {/* Feedback Summary */}
      <div className={`p-4 ${
        analysis.is_fully_correct
          ? 'bg-green-50'
          : 'bg-amber-50'
      }`}>
        <div className="flex items-start gap-3">
          {analysis.is_fully_correct ? (
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className={`font-semibold mb-1 ${
              analysis.is_fully_correct ? 'text-green-800' : 'text-amber-800'
            }`}>
              {analysis.feedback}
            </h4>
            <p className={`text-sm ${
              analysis.is_fully_correct ? 'text-green-700' : 'text-amber-700'
            }`}>
              {analysis.message}
            </p>
          </div>
        </div>
      </div>

      {/* Corrected Working */}
      {analysis.corrected_working && (
        <div className="p-4 bg-white">
          <h4 className="font-semibold text-gray-800 mb-3">
            Step-by-Step Analysis:
          </h4>
          <div className="space-y-2">
            {analysis.corrected_working.map((step, index) => (
              <div
                key={index}
                className={`p-3 rounded border-2 ${
                  step.is_error_step
                    ? 'border-red-300 bg-red-50'
                    : step.status === 'correct'
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Step {step.step_number}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    step.is_error_step
                      ? 'bg-red-200 text-red-800'
                      : step.status === 'correct'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {step.correction_note}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Correct:</p>
                    <p className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {step.correct_working}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Yours:</p>
                    <p className={`font-mono text-sm px-2 py-1 rounded border ${
                      step.is_error_step
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-white'
                    }`}>
                      {step.student_working}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
