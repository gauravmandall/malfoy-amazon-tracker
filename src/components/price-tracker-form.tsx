"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { validateAmazonUrl, validateZipCode } from "@/lib/validators"

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

interface PriceTrackerFormProps {
  onProductData: (data: ProductData | null) => void
  onError: (error: string | null) => void
}

export function PriceTrackerForm({ onProductData, onError }: PriceTrackerFormProps) {
  const [url, setUrl] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [zipCodeError, setZipCodeError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (urlError) {
      setUrlError(validateAmazonUrl(e.target.value))
    }
  }

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // allow digits, limit to 6 characters for indian PIN codes
    if (value === "" || (/^\d*$/.test(value) && value.length <= 6)) {
      setZipCode(value)
      if (zipCodeError) {
        setZipCodeError(validateZipCode(value))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const urlValidationError = validateAmazonUrl(url)
    const zipCodeValidationError = validateZipCode(zipCode)

    setUrlError(urlValidationError)
    setZipCodeError(zipCodeValidationError)

    // If there are any validation errors, don't submit
    if (urlValidationError || zipCodeValidationError) {
      return
    }

    setIsLoading(true)
    onError(null)
    onProductData(null)

    try {
      const response = await fetch("/api/track-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productUrl: url, zipCode }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch product data")
      }

      const data = await response.json()
      onProductData({
        ...data,
        zipCode,
      })
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-2 border-brand-100 dark:border-gray-700 shadow-md">
      <form onSubmit={handleSubmit}>
        <CardHeader className="bg-brand-50 dark:bg-gray-800">
          <CardTitle className="text-xl text-brand-900 dark:text-gray-100">Track Product Prices</CardTitle>
          <CardDescription>Enter product details to check current pricing</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">
              Product URL
            </Label>
            <Input
              id="url"
              placeholder="https://www.amazon.com/product/..."
              value={url}
              onChange={handleUrlChange}
              className={urlError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode" className="text-sm font-medium">
              ZIP/PIN Code
            </Label>
            <Input
              id="zipCode"
              placeholder="90210 or 201301"
              maxLength={6}
              value={zipCode}
              onChange={handleZipCodeChange}
              className={zipCodeError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {zipCodeError && <p className="text-xs text-red-500 mt-1">{zipCodeError}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/50 p-4">
          <Button type="submit" disabled={isLoading} className="bg-brand-500 hover:bg-brand-600 text-white">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Checking Price...</span>
              </div>
            ) : (
              "Check Price"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
