export function validateAmazonUrl(url: string): string | null {
  if (!url) {
    return "Product URL is required"
  }

  try {
    new URL(url)
  } catch (e) {
    return "Please enter a valid URL"
  }

  if (!url.includes("amazon.in") && !url.includes("amazon.com")) {
    return "Only Amazon.in and Amazon.com URLs are currently supported"
  }

  return null
}

export function validateZipCode(zipCode: string): string | null {
  if (!zipCode) {
    return "ZIP/PIN code is required"
  }

  // Indian PIN code (6 digits) or US ZIP code (5 digits)
  if (!/^\d{5,6}$/.test(zipCode)) {
    return "Please enter a valid 6-digit Indian PIN code or 5-digit US ZIP code"
  }

  return null
}
