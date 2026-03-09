"use client";

import { Product } from "@/types/product.types";
import Image from "next/image";
import { useState } from "react";

const PhotoSection = ({ data, photos }: { data: Product; photos: string[] }) => {
  const normalizedPhotos = photos.length > 0 ? photos : [data.srcUrl];
  const [selected, setSelected] = useState<string>(normalizedPhotos[0]);

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:space-x-3.5">
      {normalizedPhotos.length > 0 && (
        <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3.5 w-full lg:w-fit items-center lg:justify-start justify-center">
          {normalizedPhotos.map((photo, index) => (
            <button
              key={index}
              type="button"
              className="bg-surface-product rounded-[13px] xl:rounded-[20px] w-full max-w-27.75 xl:max-w-38 max-h-26.5 xl:max-h-41.75 xl:min-h-41.75 aspect-square overflow-hidden"
              onClick={() => setSelected(photo)}
            >
              <Image
                src={photo}
                width={152}
                height={167}
                className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
                alt={data.title}
                priority
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center bg-surface-product rounded-[13px] sm:rounded-[20px] w-full sm:w-96 md:w-full mx-auto h-full max-h-132.5 min-h-82.5 lg:min-h-95 xl:min-h-132.5 overflow-hidden mb-3 lg:mb-0">
        <Image
          src={selected}
          width={444}
          height={530}
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={data.title}
          priority
          unoptimized
        />
      </div>
    </div>
  );
};

export default PhotoSection;
