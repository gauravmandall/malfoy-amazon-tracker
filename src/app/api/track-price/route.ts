import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

// rate limiting setup with more robust implementation
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10
const ipRequestCounts = new Map<string, { count: number; resetTime: number; blocked: boolean }>()

// Cache setup
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const productCache = new Map<string, { data: any; timestamp: number }>()

export async function POST(request: Request) {
  try {
    console.log("Received POST request to /api/track-price")

    let body
    try {
      body = await request.json()
      console.log("Request body:", body)
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 })
    }

    const { productUrl, zipCode, productId } = body

    console.log("Extracted values:", { productUrl, zipCode, productId })

    // check if we have a productId directly
    if (!productUrl && !productId) {
      console.error("Missing required parameters: either productUrl or productId must be provided")
      return NextResponse.json(
        {
          message: "Either productUrl or productId is required",
          receivedBody: body,
        },
        { status: 400 },
      )
    }

    // get client IP for rate limiting and block IPs
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const ipData = ipRequestCounts.get(ip) || { count: 0, resetTime: Date.now() + RATE_LIMIT_WINDOW, blocked: false }

    if (ipData.blocked) {
      return NextResponse.json({ message: "Too many requests. Your IP has been temporarily blocked." }, { status: 429 })
    }

    const now = Date.now()

    if (now > ipData.resetTime) {
      ipData.count = 1
      ipData.resetTime = now + RATE_LIMIT_WINDOW
    } else {
      ipData.count += 1

      // if exceeded limit, block the IP for 10 minutes
      if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
        ipData.blocked = true
        setTimeout(
          () => {
            const currentData = ipRequestCounts.get(ip)
            if (currentData) {
              currentData.blocked = false
              ipRequestCounts.set(ip, currentData)
            }
          },
          10 * 60 * 1000,
        ) // 10 minutes block

        return NextResponse.json({ message: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }
    }

    ipRequestCounts.set(ip, ipData)

    let cleanedUrl = ""

    // Check if we have a productId directly
    if (productId) {
      // Construct URL from productId
      cleanedUrl = `https://www.amazon.com/dp/${productId}`
      // If we can determine it's from amazon.in based on some logic
      if (zipCode && zipCode.length === 6) {
        cleanedUrl = `https://www.amazon.in/dp/${productId}`
      }
    } else if (productUrl) {
      // Validate URL is from supported marketplace
      if (!productUrl.includes("amazon.in") && !productUrl.includes("amazon.com")) {
        return NextResponse.json(
          { message: "Only Amazon.in and Amazon.com URLs are currently supported" },
          { status: 400 },
        )
      }

      // Clean the URL - extract the base product URL without query parameters
      cleanedUrl = cleanProductUrl(productUrl)
    } else {
      return NextResponse.json({ message: "Either productUrl or productId is required" }, { status: 400 })
    }

    if (!zipCode) {
      return NextResponse.json({ message: "ZIP/PIN code is required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = `${cleanedUrl}:${zipCode}`
    const cachedData = productCache.get(cacheKey)

    if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
      console.log("Returning cached data for:", cleanedUrl)
      return NextResponse.json(cachedData.data)
    }

    // Fetch product data
    const productData = await scrapeProductData(cleanedUrl, zipCode)

    // Generate product overview using AI
    try {
      productData.overview = await generateProductDescription(productData.name)
    } catch (error) {
      console.error("Error generating product overview:", error)
      // Don't fail the whole request if overview generation fails
      productData.overview = "Product overview not available at this time."
    }

    // Cache the result
    productCache.set(cacheKey, {
      data: productData,
      timestamp: now,
    })

    return NextResponse.json(productData)
  } catch (error) {
    console.error("Error tracking price:", error)

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 })
  }
}

// Function to clean Amazon URLs by removing query parameters and keeping only the essential product path
function cleanProductUrl(url: string): string {
  try {
    // Parse the URL
    const urlObj = new URL(url)

    // For Amazon URLs, we want to keep the domain and path up to the product ID
    if (urlObj.hostname.includes("amazon")) {
      // Extract the path
      const path = urlObj.pathname

      // Amazon product URLs typically follow these patterns:
      // 1. /product-name/dp/PRODUCTID
      // 2. /dp/PRODUCTID
      // 3. /gp/product/PRODUCTID

      // Try to match the product ID
      const dpMatch = path.match(/\/dp\/([A-Z0-9]{10})/)
      const gpMatch = path.match(/\/gp\/product\/([A-Z0-9]{10})/)

      if (dpMatch && dpMatch[1]) {
        // Format 1 or 2
        return `${urlObj.protocol}//${urlObj.hostname}/dp/${dpMatch[1]}`
      } else if (gpMatch && gpMatch[1]) {
        // Format 3
        return `${urlObj.protocol}//${urlObj.hostname}/gp/product/${gpMatch[1]}`
      }
    }

    // If we couldn't parse it as expected, return the original URL without query parameters
    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
  } catch (error) {
    console.error("Error cleaning URL:", error)
    // If there's an error parsing the URL, return the original
    return url
  }
}

async function scrapeProductData(url: string, zipCode: string) {
  try {
    console.log("Scraping product data for:", url)

    // Configure fetch options with headers to mimic a browser
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        // Add a random referrer to avoid detection
        Referer: "https://www.google.com/",
      },
      cache: "no-store" as RequestCache,
      next: { revalidate: 0 },
    }

    // In a production environment, you would use a proxy service like Bright Data
    // Example with proxy (commented out as it requires actual credentials):
    /*
    const proxyUrl = "http://username:password@proxy.brightdata.com:22225";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      agent: new HttpsProxyAgent(proxyUrl),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    */

    // For now, we'll use a direct fetch
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`Failed to fetch product page: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract product data
    const name = $("span#productTitle").text().trim() || $("h1.product-title-word-break").text().trim()

    if (!name) {
      throw new Error("Could not extract product name")
    }

    // Try different price selectors for different Amazon layouts
    let price = ""
    const priceSelectors = [
      "span.a-price-whole",
      "span#priceblock_ourprice",
      "span#priceblock_dealprice",
      "span.a-price .a-offscreen",
      "span.a-price",
      ".a-price .a-offscreen",
      "#corePrice_feature_div .a-price .a-offscreen",
    ]

    for (const selector of priceSelectors) {
      const priceElement = $(selector).first()
      if (priceElement.length) {
        price = priceElement
          .text()
          .trim()
          .replace(/[^\d.,]/g, "")
        break
      }
    }

    if (!price) {
      throw new Error("Could not extract product price")
    }

    // Determine currency based on URL
    const currency = url.includes("amazon.in") ? "₹" : "$"

    // Extract image URL
    const imageUrl =
      $("#landingImage").attr("src") ||
      $("#imgBlkFront").attr("src") ||
      $("img#main-image").attr("src") ||
      $(".a-dynamic-image").attr("src") ||
      undefined

    // Extract additional product details if available
    const description =
      $("#productDescription p").text().trim() || $("#feature-bullets .a-list-item").text().trim() || ""

    return {
      name,
      price,
      currency,
      timestamp: new Date().toISOString(),
      imageUrl,
      url,
      description: description.substring(0, 200) + (description.length > 200 ? "..." : ""), // Truncate long descriptions
    }
  } catch (error) {
    console.error("Error scraping product data:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to scrape product data")
  }
}

// Function to generate product description without using Gemini API
async function generateProductDescription(productName: string): Promise<string> {
  try {
    // Extract potential product type/category from the name
    const words = productName.toLowerCase().split(" ")
    const commonProductTypes = [
      "monitor",
      "laptop",
      "phone",
      "camera",
      "headphones",
      "speaker",
      "keyboard",
      "mouse",
      "tablet",
      "watch",
      "chair",
      "desk",
      "table",
      "sofa",
      "bed",
      "mattress",
      "blender",
      "mixer",
      "toaster",
      "microwave",
      "refrigerator",
      "tv",
      "television",
      "computer",
      "printer",
      "scanner",
      "router",
      "modem",
      "drive",
      "storage",
      "memory",
      "processor",
      "gpu",
      "cpu",
      "motherboard",
      "case",
      "power",
      "supply",
      "cooler",
      "fan",
      "heatsink",
      "monitor",
      "arm",
      "stand",
      "mount",
      "cable",
      "adapter",
      "charger",
      "battery",
    ]

    // Find product type in name
    let productType = ""
    for (const word of words) {
      if (commonProductTypes.includes(word)) {
        productType = word
        break
      }
    }

    if (!productType) {
      // Try to find two-word product types
      for (let i = 0; i < words.length - 1; i++) {
        const twoWordType = words[i] + " " + words[i + 1]
        if (commonProductTypes.includes(words[i]) && commonProductTypes.includes(words[i + 1])) {
          productType = twoWordType
          break
        }
      }
    }

    // If still no product type found, use a generic term
    if (!productType) {
      productType = "product"
    }

    // Generate a description based on the product name and type
    const descriptions = [
      `This ${productName} is designed for optimal performance and user satisfaction. It offers a combination of durability and functionality, making it a practical choice for everyday use.`,

      `The ${productName} features high-quality construction and thoughtful design elements. It's built to provide reliable performance while meeting the needs of its target users.`,

      `This ${productType} offers excellent value with its combination of quality materials and practical features. It's designed to enhance user experience while maintaining durability for long-term use.`,

      `The ${productName} stands out for its thoughtful design and quality construction. It provides the essential features users expect from a ${productType} while offering reliable performance.`,

      `This ${productType} combines practical functionality with quality craftsmanship. It's designed to meet the needs of users looking for a reliable and effective solution.`,
    ]

    // Return a random description from the array
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  } catch (error) {
    console.error("Error generating product description:", error)
    return "This product offers a combination of quality and functionality designed to meet user needs. It features practical design elements and durable construction for reliable performance."
  }
}
