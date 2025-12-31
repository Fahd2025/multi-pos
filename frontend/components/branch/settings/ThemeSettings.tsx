"use client";

/**
 * Theme Settings Component
 *
 * Touch-optimized theme configuration interface with:
 * - Basic tab: Mode selection, preset/custom themes, live preview
 * - Advanced tab: Border radius, font scale, spacing, animations
 * - Accessibility tab: High contrast, reduced motion
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "@/providers/ThemeProvider";
import { themePresets } from "@/lib/theme-presets";
import { ThemeConfig } from "@/types/branch-settings";
import { Button } from "@/components/shared/Button";
import { Label } from "@/components/shared/label";
import { RadioGroup, RadioGroupItem } from "@/components/shared/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/tabs";
import { Slider } from "@/components/shared/slider";
import { Switch } from "@/components/shared/switch";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Smartphone,
  Eye,
  Zap,
  Accessibility,
} from "lucide-react";

interface ThemeSettingsProps {
  currentTheme?: ThemeConfig;
  onSave: (theme: ThemeConfig) => Promise<void>;
}

export const ThemeSettings = observer(
  ({ currentTheme, onSave }: ThemeSettingsProps) => {
    const themeStore = useTheme();
    const [localConfig, setLocalConfig] = useState<ThemeConfig>(
      currentTheme || themeStore.config
    );
    const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<
      "basic" | "advanced" | "accessibility"
    >("basic");

    // Update local config when currentTheme changes
    useEffect(() => {
      if (currentTheme) {
        setLocalConfig(currentTheme);
      }
    }, [currentTheme]);

    const handleSave = async () => {
      setSaving(true);
      try {
        await onSave(localConfig);
        themeStore.setConfig(localConfig);
      } finally {
        setSaving(false);
      }
    };

    const currentPreset =
      localConfig.style === "preset" && localConfig.presetId
        ? themePresets.find((p) => p.id === localConfig.presetId)
        : undefined;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Theme Configuration</h2>
        </div>

        {/* Tabs for different settings categories */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="gap-2">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
          </TabsList>

          {/* BASIC TAB */}
          <TabsContent value="basic" className="space-y-6">
            {/* Theme Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Theme Mode</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() =>
                    setLocalConfig({ ...localConfig, mode: "light" })
                  }
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                    min-h-[88px] touch-manipulation
                    ${
                      localConfig.mode === "light"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                    }
                  `}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() =>
                    setLocalConfig({ ...localConfig, mode: "dark" })
                  }
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                    min-h-[88px] touch-manipulation
                    ${
                      localConfig.mode === "dark"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                    }
                  `}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() =>
                    setLocalConfig({ ...localConfig, mode: "auto" })
                  }
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                    min-h-[88px] touch-manipulation
                    ${
                      localConfig.mode === "auto"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                    }
                  `}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-sm font-medium">Auto</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Auto mode adapts to your device&apos;s system preference
              </p>
            </div>

            {/* Theme Style Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Theme Style</Label>
              <RadioGroup
                value={localConfig.style}
                onValueChange={(value) =>
                  setLocalConfig({ ...localConfig, style: value as any })
                }
              >
                <div className="flex items-center gap-2 p-3 border rounded-lg touch-manipulation">
                  <RadioGroupItem value="preset" id="preset" className="h-5 w-5" />
                  <Label
                    htmlFor="preset"
                    className="font-normal cursor-pointer flex-1"
                  >
                    Preset Themes
                  </Label>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg touch-manipulation">
                  <RadioGroupItem value="custom" id="custom" className="h-5 w-5" />
                  <Label
                    htmlFor="custom"
                    className="font-normal cursor-pointer flex-1"
                  >
                    Custom Colors
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Preset Selection */}
            {localConfig.style === "preset" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Select Preset</Label>

                {/* Grid of preset cards (touch-friendly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        setLocalConfig({ ...localConfig, presetId: preset.id })
                      }
                      className={`
                        flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all text-left
                        min-h-[120px] touch-manipulation
                        ${
                          localConfig.presetId === preset.id
                            ? "border-primary bg-primary/10"
                            : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                        }
                      `}
                    >
                      {/* Color preview */}
                      <div className="flex gap-2 w-full">
                        <div
                          className="h-8 flex-1 rounded"
                          style={{ background: preset.light.primary }}
                        />
                        <div
                          className="h-8 flex-1 rounded"
                          style={{ background: preset.dark.primary }}
                        />
                      </div>

                      {/* Preset info */}
                      <div>
                        <div className="font-semibold">{preset.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Live Preview */}
                {currentPreset && (
                  <div className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Preview</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewMode("light")}
                          className={`
                            p-2 rounded-md transition-all touch-manipulation
                            ${
                              previewMode === "light"
                                ? "bg-white dark:bg-gray-800 shadow"
                                : "hover:bg-gray-200 dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          <Sun className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPreviewMode("dark")}
                          className={`
                            p-2 rounded-md transition-all touch-manipulation
                            ${
                              previewMode === "dark"
                                ? "bg-white dark:bg-gray-800 shadow"
                                : "hover:bg-gray-200 dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          <Moon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["primary", "secondary", "accent", "background"].map(
                        (colorKey) => {
                          const colors =
                            previewMode === "light"
                              ? currentPreset.light
                              : currentPreset.dark;
                          const color =
                            colors[colorKey as keyof typeof colors];

                          // For background, use foreground as text color
                          // For others, use their respective foreground colors
                          let foreground: string;
                          if (colorKey === "background") {
                            foreground = colors.foreground;
                          } else {
                            foreground =
                              colors[
                                `${colorKey}Foreground` as keyof typeof colors
                              ] || "#fff";
                          }

                          return (
                            <div
                              key={colorKey}
                              className="h-20 rounded-lg border flex items-center justify-center text-sm font-medium capitalize"
                              style={{ background: color, color: foreground }}
                            >
                              {colorKey}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Colors (if style === 'custom') */}
            {localConfig.style === "custom" && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Custom Colors</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize colors for light and dark modes separately
                </p>

                {/* Mode Selector for Custom Colors */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setPreviewMode("light")}
                    className={`
                      flex-1 py-2 px-4 rounded-md transition-all touch-manipulation
                      ${
                        previewMode === "light"
                          ? "bg-white dark:bg-gray-700 shadow text-primary font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }
                    `}
                  >
                    <Sun className="h-4 w-4 inline mr-2" />
                    Light Mode
                  </button>
                  <button
                    onClick={() => setPreviewMode("dark")}
                    className={`
                      flex-1 py-2 px-4 rounded-md transition-all touch-manipulation
                      ${
                        previewMode === "dark"
                          ? "bg-white dark:bg-gray-700 shadow text-primary font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }
                    `}
                  >
                    <Moon className="h-4 w-4 inline mr-2" />
                    Dark Mode
                  </button>
                </div>

                {/* Color Pickers */}
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  {[
                    { key: "primary", label: "Primary Color", description: "Main brand color for buttons and accents" },
                    { key: "primaryForeground", label: "Primary Text", description: "Text color on primary backgrounds" },
                    { key: "secondary", label: "Secondary Color", description: "Secondary UI elements" },
                    { key: "secondaryForeground", label: "Secondary Text", description: "Text on secondary backgrounds" },
                    { key: "accent", label: "Accent Color", description: "Highlights and hover states" },
                    { key: "accentForeground", label: "Accent Text", description: "Text on accent backgrounds" },
                    { key: "background", label: "Background", description: "Page background color" },
                    { key: "foreground", label: "Text Color", description: "Primary text color" },
                    { key: "card", label: "Card Background", description: "Card and panel backgrounds" },
                    { key: "cardForeground", label: "Card Text", description: "Text on cards" },
                    { key: "border", label: "Border Color", description: "Borders and dividers" },
                    { key: "input", label: "Input Background", description: "Form input backgrounds" },
                    { key: "ring", label: "Focus Ring", description: "Focus indicator color" },
                    { key: "destructive", label: "Destructive/Danger", description: "Delete and error actions" },
                    { key: "destructiveForeground", label: "Destructive Text", description: "Text on destructive backgrounds" },
                    { key: "success", label: "Success Color", description: "Success messages and states" },
                    { key: "warning", label: "Warning Color", description: "Warning messages and alerts" },
                    { key: "info", label: "Info Color", description: "Informational messages" },
                  ].map(({ key, label, description }) => {
                    const mode = previewMode === "light" ? "light" : "dark";
                    const defaultPreset = themePresets[0];
                    const currentValue =
                      localConfig.customColors?.[mode]?.[key as keyof typeof localConfig.customColors.light] ||
                      defaultPreset[mode][key as keyof typeof defaultPreset.light] ||
                      "#000000";

                    return (
                      <div key={key} className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3 items-start p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex-1">
                          <Label htmlFor={`color-${key}`} className="text-sm font-semibold">
                            {label}
                          </Label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            id={`color-${key}`}
                            value={currentValue}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              setLocalConfig({
                                ...localConfig,
                                customColors: {
                                  light: localConfig.customColors?.light || {},
                                  dark: localConfig.customColors?.dark || {},
                                  [mode]: {
                                    ...(localConfig.customColors?.[mode] || {}),
                                    [key]: newColor,
                                  },
                                },
                              });
                            }}
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer touch-manipulation"
                          />
                          <div className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-mono w-20">
                            {currentValue}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Banner */}
                <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Palette className="h-5 w-5 text-info flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 text-sm">
                        Custom Color Tips
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Configure light and dark modes separately using the tabs above</li>
                        <li>• Ensure sufficient contrast between text and background colors</li>
                        <li>• "Foreground" colors are for text on corresponding backgrounds</li>
                        <li>• Changes preview in real-time when you click "Apply Theme"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ADVANCED TAB */}
          <TabsContent value="advanced" className="space-y-6">
            {/* Border Radius */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Border Radius</Label>
              <div className="grid grid-cols-5 gap-2">
                {(["none", "sm", "md", "lg", "xl"] as const).map((radius) => (
                  <button
                    key={radius}
                    onClick={() =>
                      setLocalConfig({ ...localConfig, borderRadius: radius })
                    }
                    className={`
                      p-4 border-2 transition-all touch-manipulation min-h-[56px]
                      ${
                        localConfig.borderRadius === radius
                          ? "border-primary bg-primary/10"
                          : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                      }
                    `}
                    style={{
                      borderRadius:
                        radius === "none" ? "0" : `var(--radius-${radius})`,
                    }}
                  >
                    <span className="text-xs font-medium capitalize">
                      {radius}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Scale */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Font Size</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                  Small
                </span>
                <Slider
                  min={0.8}
                  max={1.2}
                  step={0.1}
                  value={[localConfig.fontScale || 1]}
                  onValueChange={([value]) =>
                    setLocalConfig({ ...localConfig, fontScale: value })
                  }
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  Large
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current: {Math.round((localConfig.fontScale || 1) * 100)}%
              </p>
            </div>

            {/* Spacing */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Spacing</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["compact", "comfortable", "spacious"] as const).map(
                  (spacing) => (
                    <button
                      key={spacing}
                      onClick={() =>
                        setLocalConfig({ ...localConfig, spacing })
                      }
                      className={`
                        p-4 border-2 rounded-lg transition-all touch-manipulation min-h-[56px]
                        ${
                          localConfig.spacing === spacing
                            ? "border-primary bg-primary/10"
                            : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                        }
                      `}
                    >
                      <span className="text-sm font-medium capitalize">
                        {spacing}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Animations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">
                    Enable Animations
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Smooth transitions and effects
                  </p>
                </div>
                <Switch
                  checked={localConfig.enableAnimations ?? true}
                  onCheckedChange={(checked) =>
                    setLocalConfig({ ...localConfig, enableAnimations: checked })
                  }
                />
              </div>

              {localConfig.enableAnimations && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <Label className="text-sm font-semibold">
                    Animation Speed
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["slow", "normal", "fast"] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() =>
                          setLocalConfig({ ...localConfig, animationSpeed: speed })
                        }
                        className={`
                          p-3 border-2 rounded-lg transition-all touch-manipulation
                          ${
                            localConfig.animationSpeed === speed
                              ? "border-primary bg-primary/10"
                              : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
                          }
                        `}
                      >
                        <Zap className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs font-medium capitalize">
                          {speed}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ACCESSIBILITY TAB */}
          <TabsContent value="accessibility" className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enhance readability and usability for all users
              </p>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-semibold">High Contrast</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Increase contrast between text and background
                </p>
              </div>
              <Switch
                checked={localConfig.highContrast ?? false}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, highContrast: checked })
                }
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-semibold">Reduced Motion</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                checked={localConfig.reducedMotion ?? false}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, reducedMotion: checked })
                }
              />
            </div>

            {/* Info banner */}
            <div className="bg-info/10 border border-info/30 rounded-lg p-4">
              <div className="flex gap-3">
                <Accessibility className="h-5 w-5 text-info flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    Accessibility Features
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    These settings help users with visual impairments or motion
                    sensitivity. Changes apply immediately across the entire
                    application.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="min-w-[140px] min-h-[48px] touch-manipulation"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {saving ? "Applying..." : "Apply Theme"}
          </Button>
        </div>
      </div>
    );
  }
);

ThemeSettings.displayName = "ThemeSettings";
