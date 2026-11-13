/// <reference types="astro/client" />

// Keep the supplied uppercase filenames; Astro processes these as image assets.
declare module '*.JPEG' {
  const image: import('astro').ImageMetadata;
  export default image;
}

declare module '*.JPG' {
  const image: import('astro').ImageMetadata;
  export default image;
}
