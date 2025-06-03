// Cloudinary configuration - Your actual values
export const cloudinaryConfig = {
  cloudName: "dxlry29hz", // Your cloud name
  uploadPreset: "innovacart", // Your existing preset
  apiKey: "878193559787356", // Your API key
  apiUrl: "https://api.cloudinary.com/v1_1/dxlry29hz/image/upload", // Your API URL
}

// Image transformation helpers
export const getOptimizedImageUrl = (
  publicId: string,
  options?: {
    width?: number
    height?: number
    quality?: string
    format?: string
  },
) => {
  const { width, height, quality = "auto", format = "auto" } = options || {}

  let transformations = `q_${quality},f_${format}`

  if (width && height) {
    transformations += `,w_${width},h_${height},c_fill`
  } else if (width) {
    transformations += `,w_${width}`
  } else if (height) {
    transformations += `,h_${height}`
  }

  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations}/${publicId}`
}

// Generate thumbnail URL
export const getThumbnailUrl = (publicId: string, size = 200) => {
  return getOptimizedImageUrl(publicId, { width: size, height: size })
}

// Generate product image URL with standard sizing
export const getProductImageUrl = (publicId: string, size: "small" | "medium" | "large" = "medium") => {
  const sizes = {
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 600 },
    large: { width: 1200, height: 1200 },
  }

  return getOptimizedImageUrl(publicId, sizes[size])
}
