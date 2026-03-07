import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  id: string | number
  name: string
  description: string
  price: number
  category: string
  locale: string
  translations: {
    viewDetails: string
    price: string
    categories: Record<string, string>
  }
}

export function ProductCard({
  id,
  name,
  description,
  price,
  category,
  locale,
  translations,
}: ProductCardProps) {
  const categoryLabel = translations.categories[category] || category

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{categoryLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-lg font-bold">
          ${price.toFixed(2)}
        </span>
        <Link href={`/${locale}/products/${id}`}>
          <Button size="sm">{translations.viewDetails}</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
