import { useEffect, useState } from "react";
import NextImage, { ImageProps } from "next/image";
export interface ImagePropsInterface extends ImageProps {
  defaultImage?: string;
}

export function Image({ alt, defaultImage, ...props }: ImagePropsInterface) {
  const [src, setSrc] = useState(props.src);

  useEffect(() => {
    setSrc(props.src);
  }, [props.src]);

  return (
    <NextImage
      {...props}
      src={src}
      alt={alt} // To fix lint warning
      onError={() => defaultImage && setSrc(defaultImage)}
      placeholder='blur'
      blurDataURL='/media/images/zunoks_logo.png'
    />
  );
}
