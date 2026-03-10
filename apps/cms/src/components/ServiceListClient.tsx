'use client'

import { useState } from 'react'
import { ServiceFilter } from '@/components/ServiceFilter'
import { ServiceCard } from '@/components/ServiceCard'

interface ServiceData {
  id: string | number
  name: string
  description: string
  price: number
  category: string
}

interface ServiceListClientProps {
  services: ServiceData[]
  locale: string
  isAuthenticated: boolean
  categories: string[]
  categoryLabels: Record<string, string>
  translations: {
    viewDetails: string
    price: string
    addToOrder: string
    categories: Record<string, string>
  }
  noServicesText: string
}

export function ServiceListClient({
  services,
  locale,
  isAuthenticated,
  categories,
  categoryLabels,
  translations,
  noServicesText,
}: ServiceListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredServices = selectedCategory
    ? services.filter((s) => s.category === selectedCategory)
    : services

  return (
    <>
      <div className="mb-6">
        <ServiceFilter
          categories={categories}
          categoryLabels={categoryLabels}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {filteredServices.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{noServicesText}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              name={service.name}
              description={service.description}
              price={service.price}
              category={service.category}
              locale={locale}
              isAuthenticated={isAuthenticated}
              translations={translations}
            />
          ))}
        </div>
      )}
    </>
  )
}
