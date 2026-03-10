'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ServiceFilterProps {
  categories: string[]
  categoryLabels: Record<string, string>
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function ServiceFilter({
  categories,
  categoryLabels,
  selectedCategory,
  onCategoryChange,
}: ServiceFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className={cn(
          'transition-colors',
          selectedCategory === null && 'pointer-events-none',
        )}
      >
        全部
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category)}
          className={cn(
            'transition-colors',
            selectedCategory === category && 'pointer-events-none',
          )}
        >
          {categoryLabels[category] || category}
        </Button>
      ))}
    </div>
  )
}
