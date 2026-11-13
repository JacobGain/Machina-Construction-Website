import type { ImageMetadata } from "astro";
import image0 from "../../images/careers-page/photo-46.JPEG";
import image1 from "../../images/home-page/earthworks-1.jpg";
import image2 from "../../images/home-page/hero.JPEG";
import image3 from "../../images/home-page/photo-10.JPEG";
import image4 from "../../images/home-page/photo-137.JPEG";
import image5 from "../../images/home-page/photo-141.JPEG";
import image6 from "../../images/home-page/photo-144.JPEG";
import image7 from "../../images/home-page/photo-15.JPEG";
import image8 from "../../images/home-page/photo-29.JPEG";
import image9 from "../../images/home-page/photo-60.JPEG";
import image10 from "../../images/logos-and-misc/Brampton-Logo.png";
import image11 from "../../images/logos-and-misc/City-of-Toronto-Logo.png";
import image12 from "../../images/logos-and-misc/Clarington-Logo.png";
import image13 from "../../images/logos-and-misc/Durham-Region-Logo.png";
import image14 from "../../images/logos-and-misc/Halton-Region-Logo.png";
import image15 from "../../images/logos-and-misc/IHSA-COR-certified.png";
import image16 from "../../images/logos-and-misc/Machina-Logo.png";
import image17 from "../../images/logos-and-misc/Markham-Logo.png";
import image18 from "../../images/logos-and-misc/Peel-Region-Logo.png";
import image19 from "../../images/logos-and-misc/Town-of-Ajax-Logo.png";
import image20 from "../../images/logos-and-misc/Vaughan-Logo.png";
import image21 from "../../images/logos-and-misc/York-Region-Logo.png";
import image22 from "../../images/storm-sewer/photo-58.JPEG";
import image23 from "../../images/watermain-sanitary/photo-107.JPEG";

// An explicit inventory keeps unpublished project photographs out of the build.
const images: Record<string, ImageMetadata> = {
  "images/careers-page/photo-46.JPEG": image0,
  "images/home-page/earthworks-1.jpg": image1,
  "images/home-page/hero.JPEG": image2,
  "images/home-page/photo-10.JPEG": image3,
  "images/home-page/photo-137.JPEG": image4,
  "images/home-page/photo-141.JPEG": image5,
  "images/home-page/photo-144.JPEG": image6,
  "images/home-page/photo-15.JPEG": image7,
  "images/home-page/photo-29.JPEG": image8,
  "images/home-page/photo-60.JPEG": image9,
  "images/logos-and-misc/Brampton-Logo.png": image10,
  "images/logos-and-misc/City-of-Toronto-Logo.png": image11,
  "images/logos-and-misc/Clarington-Logo.png": image12,
  "images/logos-and-misc/Durham-Region-Logo.png": image13,
  "images/logos-and-misc/Halton-Region-Logo.png": image14,
  "images/logos-and-misc/IHSA-COR-certified.png": image15,
  "images/logos-and-misc/Machina-Logo.png": image16,
  "images/logos-and-misc/Markham-Logo.png": image17,
  "images/logos-and-misc/Peel-Region-Logo.png": image18,
  "images/logos-and-misc/Town-of-Ajax-Logo.png": image19,
  "images/logos-and-misc/Vaughan-Logo.png": image20,
  "images/logos-and-misc/York-Region-Logo.png": image21,
  "images/storm-sewer/photo-58.JPEG": image22,
  "images/watermain-sanitary/photo-107.JPEG": image23,
};

export function sourceImage(path: string): ImageMetadata {
  const image = images[path.replace(/^\.?\//, "")];
  if (!image) throw new Error(`Missing source image: ${path}`);
  return image;
}
