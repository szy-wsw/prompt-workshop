interface SkeletonProps {
  height: number
  width?: string | number
  style?: React.CSSProperties
}

export default function Skeleton({ height, width = '100%', style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        ...style
      }}
    />
  )
}
