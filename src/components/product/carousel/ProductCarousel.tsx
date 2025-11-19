import type { File } from "@elasticpath/js-sdk";
import "pure-react-carousel/dist/react-carousel.es.css";
import { useState, useEffect } from "react";
import HorizontalCarousel from "./HorizontalCarousel";
import ProductHighlightCarousel from "./ProductHighlightCarousel";

interface IProductCarousel {
  images: File[];
  mainImage: File | undefined;
}

const ProductCarousel = ({
  images,
  mainImage,
}: IProductCarousel): JSX.Element => {
  // Filter out images without link property
  const validMainImage = mainImage?.link ? mainImage : null;
  const validImages = images.filter((img) => img?.link);
  const completeImages: File[] = [
    ...(validMainImage ? [validMainImage] : []),
    ...validImages,
  ];

  const [selectedProductImage, setSelectedProductImage] = useState<File | null>(
    completeImages[0] || null,
  );

  // Update selected image when images change
  useEffect(() => {
    if (completeImages.length > 0 && completeImages[0]?.link) {
      setSelectedProductImage(completeImages[0]);
    } else {
      setSelectedProductImage(null);
    }
  }, [mainImage, images]);

  // Don't render if no images available
  if (!selectedProductImage || !selectedProductImage.link) {
    return <div>No images available</div>;
  }

  return (
    <div className="grid-cols-auto grid gap-6 w-full">
      <div className="relative">
        <ProductHighlightCarousel
          images={completeImages}
          selectedProductImage={selectedProductImage}
          setSelectedProductImage={setSelectedProductImage}
        />
      </div>
      <div className="relative">
        <HorizontalCarousel
          images={completeImages.map((item) => ({
            src: item.link.href,
            name: item.file_name,
          }))}
          visibleSlides={5}
          selectedImage={{
            src: selectedProductImage.link.href,
            name: selectedProductImage.file_name,
          }}
          setSelectedImage={({ src }) => {
            const found = completeImages.find((item) => item.link.href === src);
            setSelectedProductImage(found!);
          }}
        />
      </div>
    </div>
  );
};

export default ProductCarousel;
