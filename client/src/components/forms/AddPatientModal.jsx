import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'

export default function AddPatientModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [allergies, setAllergies] = useState([])
  const [conditions, setConditions] = useState([])
  const [allergyInput, setAllergyInput] = useState('')
  const [conditionInput, setConditionInput] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  const addItem = (list, setList, input, setInput) => {
    if (input.trim()) {
      setList([...list, input.trim()])
      setInput('')
    }
  }

  const removeItem = (list, setList, index) => {
    setList(list.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/patients', {
        ...data,
        age: parseInt(data.age),
        allergies,
        chronicConditions: conditions,
      })
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Register New Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Ahmed Khan"
              {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Age + Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Age *</label>
              <input type="number" className="input" placeholder="35"
                {...register('age', { required: 'Age is required', min: 0, max: 150 })} />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
            </div>
            <div>
              <label className="label">Gender *</label>
              <select className="input" {...register('gender', { required: true })}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">Gender is required</p>}
            </div>
          </div>

          {/* Phone + Blood Group */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="03001234567"
                {...register('phone')} />
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select className="input" {...register('bloodGroup')}>
                <option value="Unknown">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="patient@email.com"
              {...register('email')} />
          </div>

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="House 12, Block 5, Karachi"
              {...register('address')} />
          </div>

          {/* Allergies */}
          <div>
            <label className="label">Allergies</label>
            <div className="flex gap-2">
              <input className="input" placeholder="e.g. Penicillin"
                value={allergyInput}
                onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(),
                  addItem(allergies, setAllergies, allergyInput, setAllergyInput))} />
              <button type="button" onClick={() =>
                addItem(allergies, setAllergies, allergyInput, setAllergyInput)}
                className="btn-secondary px-3 flex-shrink-0">
                <Plus size={16} />
              </button>
            </div>
            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allergies.map((a, i) => (
                  <span key={i} className="badge-danger flex items-center gap-1">
                    {a}
                    <button type="button" onClick={() => removeItem(allergies, setAllergies, i)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="label">Chronic Conditions</label>
            <div className="flex gap-2">
              <input className="input" placeholder="e.g. Diabetes"
                value={conditionInput}
                onChange={e => setConditionInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(),
                  addItem(conditions, setConditions, conditionInput, setConditionInput))} />
              <button type="button" onClick={() =>
                addItem(conditions, setConditions, conditionInput, setConditionInput)}
                className="btn-secondary px-3 flex-shrink-0">
                <Plus size={16} />
              </button>
            </div>
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {conditions.map((c, i) => (
                  <span key={i} className="badge-warning flex items-center gap-1">
                    {c}
                    <button type="button" onClick={() => removeItem(conditions, setConditions, i)}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}