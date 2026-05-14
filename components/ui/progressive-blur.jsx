"use client"

import React from "react"

import { cn } from "@/lib/utils"

export function ProgressiveBlur({
  className,
  direction = "right",
  blurLevels = [0.5, 1, 2, 4, 8, 16, 32, 64],
}) {
  const divElements = Array(blurLevels.length - 2).fill(null)

  const isHorizontal = direction === "left" || direction === "right"
  const gradientDirection = direction === "right" ? "to right" :
    direction === "left" ? "to left" :
      direction === "bottom" ? "to bottom" : "to top"

  return (
    <div
      className={cn(
        "gradient-blur pointer-events-none absolute z-10",
        isHorizontal ? "top-0 bottom-0" : "left-0 right-0",
        direction === "right" && "right-0",
        direction === "left" && "left-0",
        direction === "bottom" && "bottom-0",
        direction === "top" && "top-0",
        className
      )}
      style={{
        [isHorizontal ? "width" : "height"]: "30%",
      }}
    >
      {/* First blur layer */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          backdropFilter: `blur(${blurLevels[0]}px)`,
          WebkitBackdropFilter: `blur(${blurLevels[0]}px)`,
          maskImage: `linear-gradient(${gradientDirection}, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%)`,
          WebkitMaskImage: `linear-gradient(${gradientDirection}, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 12.5%, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 37.5%)`,
        }}
      />

      {/* Middle blur layers */}
      {divElements.map((_, index) => {
        const blurIndex = index + 1
        const startPercent = blurIndex * 12.5
        const midPercent = (blurIndex + 1) * 12.5
        const endPercent = (blurIndex + 2) * 12.5

        const maskGradient = `linear-gradient(${gradientDirection}, rgba(0,0,0,0) ${startPercent}%, rgba(0,0,0,1) ${midPercent}%, rgba(0,0,0,1) ${endPercent}%, rgba(0,0,0,0) ${endPercent + 12.5}%)`

        return (
          <div
            key={`blur-${index}`}
            className="absolute inset-0"
            style={{
              zIndex: index + 2,
              backdropFilter: `blur(${blurLevels[blurIndex]}px)`,
              WebkitBackdropFilter: `blur(${blurLevels[blurIndex]}px)`,
              maskImage: maskGradient,
              WebkitMaskImage: maskGradient,
            }}
          />
        )
      })}

      {/* Last blur layer */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: blurLevels.length,
          backdropFilter: `blur(${blurLevels[blurLevels.length - 1]}px)`,
          WebkitBackdropFilter: `blur(${blurLevels[blurLevels.length - 1]}px)`,
          maskImage: `linear-gradient(${gradientDirection}, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)`,
          WebkitMaskImage: `linear-gradient(${gradientDirection}, rgba(0,0,0,0) 87.5%, rgba(0,0,0,1) 100%)`,
        }}
      />
    </div>
  )
}
