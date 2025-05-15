"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PriceTrackerForm } from "@/components/price-tracker-form"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/product-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ShoppingBag } from "lucide-react"

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

export default function Home() {
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleProductData = (data: ProductData | null) => {
    setProductData(data)
  }

  const handleError = (errorMessage: string | null) => {
    setError(errorMessage)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Track E-commerce Product Prices
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter a product URL and your ZIP/PIN code to check current pricing
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-1/3">
              <PriceTrackerForm onProductData={handleProductData} onError={handleError} />

              <Card className="mt-6 bg-brand-50 dark:bg-gray-800 border-brand-100 dark:border-gray-700">
                <CardContent className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Currently Supporting:</h3>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>Amazon.com and Amazon.in product pages</li>
                    <li>US ZIP codes (5 digits) and Indian PIN codes (6 digits)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="w-full lg:w-2/3">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {productData ? (
                <ProductCard product={productData} />
              ) : (
                <div className="h-full flex items-center justify-center p-12 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Product Data</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Enter a product URL and ZIP/PIN code to check prices
                    </p>
                    <div className="flex justify-center">
                      <ShoppingBag className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* API Documentation Section */}
              <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-3">API Documentation</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-brand-600 dark:text-brand-400">POST /api/track-price</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Check current price for a product</p>
                    <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono">
                      {"{"}
                      <br />
                      &nbsp;&nbsp;"productUrl": "https://www.amazon.com/product/...",
                      <br />
                      &nbsp;&nbsp;"zipCode": "90210" // or "201301" for India
                      <br />
                      {"}"}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Response (200 OK)</h4>
                    <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm font-mono">
                      {"{"}
                      <br />
                      &nbsp;&nbsp;"name": "Product Name",
                      <br />
                      &nbsp;&nbsp;"price": "99.99",
                      <br />
                      &nbsp;&nbsp;"currency": "$", // or "₹" for Indian products
                      <br />
                      &nbsp;&nbsp;"timestamp": "2025-05-09T12:34:56Z",
                      <br />
                      &nbsp;&nbsp;"imageUrl": "https://...",
                      <br />
                      &nbsp;&nbsp;"url": "https://www.amazon.com/product/...",
                      <br />
                      &nbsp;&nbsp;"overview": "Product overview generated by AI..."
                      <br />
                      {"}"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
