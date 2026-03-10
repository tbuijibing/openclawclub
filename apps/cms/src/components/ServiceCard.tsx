import { Link } from '@/i18n/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ServiceCardProps {
  id: string | number
  name: string
  description: string
  price: number
  category: string
  locale: string
  isAuthenticated?: boolean
  translations: {
    viewDetails: string
    price: string
    addToOrder?: string
    categories: Record<string, string>
  }
}

export function ServiceCard({
  id,
  name,
  description,
  price,
  category,
  locale,
  isAuthenticated,
  translations,
}: ServiceCardProps) {
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
        <div className="flex gap-2">
          {isAuthenticated && translations.addToOrder && (
            <Link href={`/orders/new?service=${id}`}>
              <Button size="sm" variant="outline">{translations.addToOrder}</Button>
            </Link>
          )}
          <Link href={`/products/${id}`}>
            <Button size="sm">{translations.viewDetails}</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
