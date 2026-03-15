
"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import placeholderData from "@/app/lib/placeholder-images.json"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  const logoData = placeholderData.placeholderImages.find(img => img.id === "learnova-logo")
  
  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center", className)}>
      <Image
        src={logoData?.imageUrl || "https://picsum.photos/seed/learnova/200/200"}
        alt="Learnova Logo"
        width={size}
        height={size}
        className="object-contain"
        data-ai-hint="education logo"
      />
    </div>
  )
}
