'use client'

import dynamic from 'next/dynamic'

const LocationPickerClient = dynamic(
  () => import('@/components/Map/LocationPickerClient'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] bg-gray-200 animate-pulse rounded-md border border-black" />
    ),
  }
)

export default function LocationPicker(props) {
  return <LocationPickerClient {...props} />
}
