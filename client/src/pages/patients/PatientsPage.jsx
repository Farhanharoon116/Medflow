import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, User, Phone, Droplets, Loader2, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axiosInstance'
import AddPatientModal from '../../components/forms/AddPatientModal'

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => {
      const { data } = await api.get('/patients', {
        params: { search, page, limit: 15 },
      })
      return data
    },
    keepPreviousData: true,
  })

  const bloodGroupColors = {
    'A+': 'badge-danger', 'A-': 'badge-danger',
    'B+': 'badge-info', 'B-': 'badge-info',
    'AB+': 'badge-warning', 'AB-': 'badge-warning',
    'O+': 'badge-success', 'O-': 'badge-success',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-400 text-sm mt-1">
            {data?.total ?? 0} total patients registered
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            className="input pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-500" />
          </div>
        ) : data?.patients?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <User size={40} className="mb-3 opacity-30" />
            <p className="font-medium">No patients found</p>
            <p className="text-sm">Add your first patient to get started</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Patient</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Age / Gender</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Blood Group</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">Conditions</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.patients?.map((patient) => (
                  <tr
                    key={patient._id}
                    onClick={() => navigate(`/dashboard/patients/${patient._id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                          style={{ backgroundColor: '#0A1628' }}>
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-400">{patient.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={13} className="text-gray-400" />
                        {patient.phone || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.age} yrs · <span className="capitalize">{patient.gender}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={bloodGroupColors[patient.bloodGroup] || 'badge-gray'}>
                        {patient.bloodGroup}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {patient.chronicConditions?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.chronicConditions.slice(0, 2).map((c) => (
                            <span key={c} className="badge-gray">{c}</span>
                          ))}
                          {patient.chronicConditions.length > 2 && (
                            <span className="badge-gray">+{patient.chronicConditions.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight size={16} className="text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data?.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Page {data.currentPage} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Patient Modal */}
      {showModal && (
        <AddPatientModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries(['patients'])
            toast.success('Patient added successfully!')
          }}
        />
      )}
    </div>
  )
}