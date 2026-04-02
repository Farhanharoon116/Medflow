import { useQuery } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import api from '../../api/axiosInstance'
import LabResultCard from '../../components/LabResultCard'

export default function MyLabResultsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myLabResults'],
    queryFn: async () => {
      const { data } = await api.get('/labs/my-results')
      return data
    },
  })

  const labs = data?.labResults || []

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Lab Results</h1>
        <p className="page-subtitle">Reports shared with you by your clinic</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="spinner w-8 h-8" />
        </div>
      ) : labs.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <FlaskConical size={32} />
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-2)' }}>
            No lab results yet
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
            When your clinic uploads lab reports and shares them with you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {labs.map((lab) => (
            <LabResultCard key={lab._id} lab={lab} canDelete={false} canUpdateStatus={false} />
          ))}
        </div>
      )}
    </div>
  )
}
