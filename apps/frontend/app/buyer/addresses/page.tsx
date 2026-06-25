'use client'

import { useEffect, useState } from 'react'
import { MapPin, Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { createResolver } from '@/lib/validation/resolver'
import { AddressFormSchema, AddressFormData } from '@/lib/validation/buyer.schema'
import { ApiErrorResponse, ApiResponse, DeliveryAddress } from '@/types'

export default function BuyerAddressesPage() {
  const [addresses, setAddresses] = useState<DeliveryAddress[] | null | undefined>(undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DeliveryAddress | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeliveryAddress | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  const fetchAddresses = () => {
    api
      .get<ApiResponse<DeliveryAddress[]>>('/buyer/addresses')
      .then((res) => setAddresses(res.data.data))
      .catch(() => setAddresses(null))
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const openCreateForm = () => {
    setEditTarget(null)
    setIsFormOpen(true)
  }

  const openEditForm = (address: DeliveryAddress) => {
    setEditTarget(address)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    fetchAddresses()
  }

  const handleSetDefault = async (address: DeliveryAddress) => {
    setSettingDefaultId(address.id)
    try {
      await api.put(`/buyer/addresses/${address.id}/default`)
      toast.success('Alamat default berhasil diperbarui')
      fetchAddresses()
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal mengatur alamat default')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await api.delete(`/buyer/addresses/${deleteTarget.id}`)
      toast.success('Alamat berhasil dihapus')
      setDeleteTarget(null)
      fetchAddresses()
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      toast.error(apiErr.response?.data?.message ?? 'Gagal menghapus alamat')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Alamat Pengiriman</h1>
        <Button onClick={openCreateForm}>+ Tambah Alamat</Button>
      </div>

      {addresses === undefined ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Belum ada alamat"
          description="Tambahkan alamat pengiriman untuk mulai berbelanja."
          action={<Button onClick={openCreateForm}>+ Tambah Alamat</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <Card key={address.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">{address.label}</p>
                    {address.is_default && <Badge variant="blue">Default</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-text">
                    {address.recipient_name} — {address.phone}
                  </p>
                  <p className="text-sm text-text-sub">
                    {address.street}, {address.city}, {address.province} {address.postal_code}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(address)}
                    aria-label="Hapus alamat"
                    className="rounded-full p-1.5 text-text-sub hover:bg-gray-100 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditForm(address)}>
                  Edit
                </Button>
                {!address.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(address)}
                    isLoading={settingDefaultId === address.id}
                  >
                    <Star className="h-4 w-4" /> Jadikan Default
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        address={editTarget}
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Alamat?">
        <p className="text-sm text-text-sub">
          Alamat <span className="font-medium text-text">{deleteTarget?.label}</span> akan dihapus permanen.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function AddressFormModal({
  isOpen,
  onClose,
  onSuccess,
  address,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  address: DeliveryAddress | null
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const isEditing = !!address

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({ resolver: createResolver(AddressFormSchema) })

  useEffect(() => {
    if (isOpen) {
      reset(
        address
          ? {
              label: address.label,
              recipient_name: address.recipient_name,
              phone: address.phone,
              street: address.street,
              city: address.city,
              province: address.province,
              postal_code: address.postal_code,
              is_default: address.is_default,
            }
          : { label: '', recipient_name: '', phone: '', street: '', city: '', province: '', postal_code: '', is_default: false }
      )
      setApiError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, address])

  const onSubmit = async (formData: AddressFormData) => {
    setApiError(null)
    try {
      if (isEditing) {
        await api.put(`/buyer/addresses/${address.id}`, formData)
        toast.success('Alamat berhasil diperbarui')
      } else {
        await api.post('/buyer/addresses', formData)
        toast.success('Alamat berhasil ditambahkan')
      }
      onSuccess()
    } catch (error) {
      const apiErr = error as { response?: { data?: ApiErrorResponse } }
      const response = apiErr.response?.data

      if (response?.errors?.length) {
        response.errors.forEach((fieldError) => {
          setError(fieldError.field as keyof AddressFormData, { message: fieldError.message })
        })
      }
      setApiError(response?.message ?? 'Terjadi kesalahan. Silakan coba lagi.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Alamat' : 'Tambah Alamat'} className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Label" placeholder="Rumah" error={errors.label?.message} {...register('label')} />
        <Input
          label="Nama Penerima"
          placeholder="Budi Santoso"
          error={errors.recipient_name?.message}
          {...register('recipient_name')}
        />
        <Input label="No. HP" placeholder="081234567890" error={errors.phone?.message} {...register('phone')} />
        <Input
          label="Alamat"
          placeholder="Jl. Merdeka No. 10"
          error={errors.street?.message}
          {...register('street')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Kota" placeholder="Jakarta Selatan" error={errors.city?.message} {...register('city')} />
          <Input label="Provinsi" placeholder="DKI Jakarta" error={errors.province?.message} {...register('province')} />
        </div>
        <Input
          label="Kode Pos"
          placeholder="12345"
          error={errors.postal_code?.message}
          {...register('postal_code')}
        />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4" {...register('is_default')} />
          Jadikan alamat default
        </label>

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
