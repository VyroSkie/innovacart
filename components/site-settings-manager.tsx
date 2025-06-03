"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSiteSettings, updateSiteSettings } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"
import type { SiteSettings } from "@/types"

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    itSolutionsAvailable: false,
    tshirtPageAvailable: false,
    paymentNumbers: {
      bkash: "",
      nagad: "",
      rocket: "",
    },
    categoryThumbnails: {
      tshirts: "",
      fruits: "",
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const fetchedSettings = await getSiteSettings()
        setSettings(fetchedSettings)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load site settings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await updateSiteSettings(settings)
      toast({
        title: "Success",
        description: "Site settings updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save site settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <Card className="w-full bg-black/50 border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
          <span className="text-purple-400">⚙️</span> Site Settings
        </CardTitle>
        <CardDescription className="text-gray-400">Manage website availability and payment settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pages" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-black/50">
            <TabsTrigger value="pages" className="text-white data-[state=active]:bg-purple-600">
              Page Settings
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-white data-[state=active]:bg-purple-600">
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="thumbnails" className="text-white data-[state=active]:bg-purple-600">
              Thumbnails
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="it-solutions" className="text-lg font-medium text-white">
                    IT Solutions Page
                  </Label>
                  <p className="text-sm text-gray-400">Enable or disable the IT Solutions page</p>
                </div>
                <Switch
                  id="it-solutions"
                  checked={settings.itSolutionsAvailable}
                  onCheckedChange={(checked) => setSettings({ ...settings, itSolutionsAvailable: checked })}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tshirts" className="text-lg font-medium text-white">
                    T-Shirts Page
                  </Label>
                  <p className="text-sm text-gray-400">Enable or disable the T-Shirts shop page</p>
                </div>
                <Switch
                  id="tshirts"
                  checked={settings.tshirtPageAvailable}
                  onCheckedChange={(checked) => setSettings({ ...settings, tshirtPageAvailable: checked })}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bkash" className="text-lg font-medium flex items-center text-white">
                  <span className="inline-block w-5 h-5 bg-pink-600 rounded-full mr-2"></span>
                  bKash Number
                </Label>
                <Input
                  id="bkash"
                  value={settings.paymentNumbers?.bkash || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentNumbers: {
                        ...settings.paymentNumbers,
                        bkash: e.target.value,
                      },
                    })
                  }
                  placeholder="+8801XXXXXXXXX"
                  className="border-pink-600/30 focus:border-pink-600 bg-black/50 text-white"
                />
                <p className="text-xs text-gray-400">Phone number customers will use for bKash transactions</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nagad" className="text-lg font-medium flex items-center text-white">
                  <span className="inline-block w-5 h-5 bg-orange-600 rounded-full mr-2"></span>
                  Nagad Number
                </Label>
                <Input
                  id="nagad"
                  value={settings.paymentNumbers?.nagad || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentNumbers: {
                        ...settings.paymentNumbers,
                        nagad: e.target.value,
                      },
                    })
                  }
                  placeholder="+8801XXXXXXXXX"
                  className="border-orange-600/30 focus:border-orange-600 bg-black/50 text-white"
                />
                <p className="text-xs text-gray-400">Phone number customers will use for Nagad transactions</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rocket" className="text-lg font-medium flex items-center text-white">
                  <span className="inline-block w-5 h-5 bg-blue-600 rounded-full mr-2"></span>
                  Rocket Number
                </Label>
                <Input
                  id="rocket"
                  value={settings.paymentNumbers?.rocket || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentNumbers: {
                        ...settings.paymentNumbers,
                        rocket: e.target.value,
                      },
                    })
                  }
                  placeholder="+8801XXXXXXXXX"
                  className="border-blue-600/30 focus:border-blue-600 bg-black/50 text-white"
                />
                <p className="text-xs text-gray-400">Phone number customers will use for Rocket transactions</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="thumbnails">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tshirts-thumb" className="text-lg font-medium text-white">
                  T-Shirts Category Thumbnail
                </Label>
                <Input
                  id="tshirts-thumb"
                  value={settings.categoryThumbnails?.tshirts || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      categoryThumbnails: {
                        ...settings.categoryThumbnails,
                        tshirts: e.target.value,
                      },
                    })
                  }
                  placeholder="https://example.com/tshirts-image.jpg"
                  className="bg-black/50 border-purple-500/20 text-white"
                />
                <p className="text-xs text-gray-400">URL for the T-Shirts category thumbnail image</p>
                {settings.categoryThumbnails?.tshirts && (
                  <div className="mt-2">
                    <img
                      src={settings.categoryThumbnails.tshirts || "/placeholder.svg"}
                      alt="T-Shirts thumbnail preview"
                      className="w-32 h-32 object-cover rounded-lg border border-purple-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fruits-thumb" className="text-lg font-medium text-white">
                  Fruits Category Thumbnail
                </Label>
                <Input
                  id="fruits-thumb"
                  value={settings.categoryThumbnails?.fruits || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      categoryThumbnails: {
                        ...settings.categoryThumbnails,
                        fruits: e.target.value,
                      },
                    })
                  }
                  placeholder="https://example.com/fruits-image.jpg"
                  className="bg-black/50 border-purple-500/20 text-white"
                />
                <p className="text-xs text-gray-400">URL for the Fruits category thumbnail image</p>
                {settings.categoryThumbnails?.fruits && (
                  <div className="mt-2">
                    <img
                      src={settings.categoryThumbnails.fruits || "/placeholder.svg"}
                      alt="Fruits thumbnail preview"
                      className="w-32 h-32 object-cover rounded-lg border border-purple-500/20"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
