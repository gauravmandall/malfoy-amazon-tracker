import Image from "next/image"
import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

type ProductData = {
  name: string
  price: string
  currency: string
  timestamp: string
  imageUrl?: string
  url: string
  zipCode: string
  overview?: string
  description?: string
}

export function ProductCard({ product }: { product: ProductData }) {
  const formattedDate = new Date(product.timestamp).toLocaleString()

  return (
    <Card className="w-full overflow-hidden border-2 border-brand-100 dark:border-gray-700 shadow-lg">
      <CardHeader className="bg-brand-50 dark:bg-gray-800 pb-2">
        <CardTitle className="text-lg font-medium text-brand-900 dark:text-gray-100 line-clamp-2">
          {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row gap-4">
          {product.imageUrl && (
            <div className="flex-shrink-0">
              <div className="h-32 w-32 relative rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
          <div className="flex-grow">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Current Price:</span>
                <span className="ml-2 text-xl font-semibold text-brand-600 dark:text-brand-400">
                  {product.currency} {product.price}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Product URL:</span>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-sm text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 hover:underline break-all"
                >
                  {product.url}
                </a>
              </div>

              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">ZIP Code:</span>
                <span className="ml-2 text-sm">{product.zipCode}</span>
              </div>

              <Separator className="my-2" />

              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Last checked:</span>
                <span className="ml-2 text-xs">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {(product.overview || product.description) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {product.overview && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <h4 className="text-sm font-medium">Product Overview:</h4>
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs bg-brand-50 dark:bg-gray-800 text-brand-700 dark:text-brand-300"
                  >
                    AI Generated
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{product.overview}</p>
              </div>
            )}

            {product.description && (
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-2">Product Description:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/50 dark:bg-gray-800/50 p-4">
        <Button asChild className="w-full bg-brand-500 hover:bg-brand-600 text-white">
          <a href={product.url} target="_blank" rel="noopener noreferrer">
            View on Amazon <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
