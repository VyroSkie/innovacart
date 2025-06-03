export interface SiteSettings {
  itSolutionsAvailable: boolean
  tshirtPageAvailable: boolean
  paymentNumbers?: {
    bkash: string
    nagad: string
    rocket: string
  }
  categoryThumbnails?: {
    tshirts: string
    fruits: string
  }
  featureIcons?: {
    delivery: string
    quality: string
    support: string
  }
}
