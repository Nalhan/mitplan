/* shouts out to not even close*/

import { forwardRef, type ComponentPropsWithoutRef } from 'react'

interface ZamIconProps extends Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'width' | 'height'> {
  icon: string
  size: number
}

export const ZamIcon = forwardRef<HTMLImageElement, ZamIconProps>(({ alt, size, icon, ...props }, ref) => (
  <img
    {...props}
    ref={ref}
    alt={alt}
    width={size}
    height={size}
    src={`https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`}
    style={{ flexShrink: 0, ...props.style }}
  />
))

ZamIcon.displayName = 'ZamIcon'