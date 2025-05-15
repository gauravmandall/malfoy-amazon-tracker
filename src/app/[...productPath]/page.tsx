"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"

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

export default function ProductPage() {
  const params = useParams()
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [zipCode, setZipCode] = useState<string>("201301") // default to 201301 for Noida, India

  useEffect(() => {
    const productPath = params.productPath as string[]

    if (!productPath || productPath.length < 3) {
      setError("Invalid product URL")
      setLoading(false)
      return
    }

    // check if the URL follows the pattern /[name]/dp/[productId]
    const dpIndex = productPath.indexOf("dp")
    if (dpIndex === -1 || dpIndex === productPath.length - 1) {
      setError("Invalid product URL format")
      setLoading(false)
      return
    }

    const productId = productPath[dpIndex + 1]

    // try to determine if it's an indian or US product based on the url
    // this is a simple heuristic and might need improvement
    const isIndian = window.location.hostname.includes("in") || document.referrer.includes("amazon.in")

    setZipCode(isIndian ? "201301" : "10001")
    fetchProductData(productId)
  }, [params])

  const fetchProductData = async (productId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/track-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          zipCode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch product data")
      }

      const data = await response.json()
      setProductData({
        ...data,
        zipCode,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Product Details</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product information...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : productData ? (
            <ProductCard product={productData} />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Product Found</AlertTitle>
              <AlertDescription>Could not find product information for the given URL.</AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
